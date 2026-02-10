import { MovementService } from "./movement_service";
import { track } from "opik";
import { getOpikClient } from "./opik-client";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface TemperatureLog {
  celsius: number;
  timestamp?: string;
  location?: string;
}

interface ComplianceAnalysisRequest {
  serial_id: string;
  ndc_code?: string;
  lot_number?: string;
  temperature_logs?: TemperatureLog[];
  chain_of_custody?: Array<{ entity: string; timestamp?: string }>;
  manufacturing_date?: string;
  expiration_date?: string;
  custom_scenario?: string;
}

interface ComplianceViolation {
  type: "TEMPERATURE_EXCURSION" | "CUSTODY_GAP" | "EXPIRED" | "MISSING_DATA" | "REGULATORY";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  evidence: string;
  recommendation: string;
}

interface GeminiAnalysisResult {
  status: "VERIFIED" | "QUARANTINE" | "AUDIT_REQUIRED" | "PENDING";
  confidence_score: number;
  violations: ComplianceViolation[];
  recommendations: string[];
  quarantine_triggered: boolean;
  quarantine_transaction?: string;
  analysis_model: string;
  analysis_timestamp: string;
  raw_ai_response?: string;
}

export class GeminiComplianceService {
  private static instance: GeminiComplianceService | null = null;
  private readonly modelName = "gemini-1.5-flash";
  private readonly callGeminiAPI: (prompt: string) => Promise<string | null>;

  private constructor() {
    const opikClient = getOpikClient();
    this.callGeminiAPI = opikClient
      ? track({ name: "gemini-compliance-analysis", type: "llm" }, this.callGeminiAPICore.bind(this))
      : this.callGeminiAPICore.bind(this);
  }

  public static getInstance(): GeminiComplianceService {
    if (!GeminiComplianceService.instance) {
      GeminiComplianceService.instance = new GeminiComplianceService();
    }
    return GeminiComplianceService.instance;
  }

  private ruleBasedAnalysis(request: ComplianceAnalysisRequest): {
    violations: ComplianceViolation[];
    shouldQuarantine: boolean;
  } {
    const violations: ComplianceViolation[] = [];
    let shouldQuarantine = false;

    if (request.temperature_logs && request.temperature_logs.length > 0) {
      for (const log of request.temperature_logs) {
        if (log.celsius > 8) {
          violations.push({
            type: "TEMPERATURE_EXCURSION",
            severity: log.celsius > 15 ? "CRITICAL" : "HIGH",
            description: `Temperature exceeded 8°C threshold: ${log.celsius}°C`,
            evidence: `Recorded at ${log.location || "unknown location"} at ${log.timestamp || "unknown time"}`,
            recommendation: "Immediately quarantine batch and initiate stability assessment",
          });
          shouldQuarantine = true;
        } else if (log.celsius < 2) {
          violations.push({
            type: "TEMPERATURE_EXCURSION",
            severity: "HIGH",
            description: `Temperature below 2°C threshold: ${log.celsius}°C (potential freeze damage)`,
            evidence: `Recorded at ${log.location || "unknown location"} at ${log.timestamp || "unknown time"}`,
            recommendation: "Quarantine batch and assess for freeze-thaw damage",
          });
          shouldQuarantine = true;
        }
      }
    }

    if (!request.chain_of_custody || request.chain_of_custody.length === 0) {
      violations.push({
        type: "CUSTODY_GAP",
        severity: "MEDIUM",
        description: "Missing chain of custody documentation",
        evidence: "No custody records provided",
        recommendation: "Obtain complete custody chain before distribution",
      });
    }

    if (!request.ndc_code) {
      violations.push({
        type: "MISSING_DATA",
        severity: "MEDIUM",
        description: "Missing NDC code",
        evidence: "NDC code field is empty",
        recommendation: "Verify product identification before release",
      });
    }

    if (!request.lot_number) {
      violations.push({
        type: "MISSING_DATA",
        severity: "MEDIUM",
        description: "Missing lot number",
        evidence: "Lot number field is empty",
        recommendation: "Verify batch identification before release",
      });
    }

    if (request.expiration_date) {
      const expDate = new Date(request.expiration_date);
      const now = new Date();
      if (expDate < now) {
        violations.push({
          type: "EXPIRED",
          severity: "CRITICAL",
          description: "Product has expired",
          evidence: `Expiration date: ${request.expiration_date}`,
          recommendation: "Do not distribute - initiate recall if already in market",
        });
        shouldQuarantine = true;
      }
    }

    return { violations, shouldQuarantine };
  }

  private async callGeminiAPICore(prompt: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("[GeminiService] GEMINI_API_KEY not set - using rule-based analysis");
      return null;
    }

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        console.error(`[GeminiService] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) {
      console.error("[GeminiService] API call failed:", e);
      return null;
    }
  }

  private parseGeminiResponse(response: string): {
    violations: ComplianceViolation[];
    shouldQuarantine: boolean;
    confidence: number;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          violations: parsed.violations || [],
          shouldQuarantine: parsed.quarantine === true || parsed.should_quarantine === true,
          confidence: parsed.confidence || 0.75,
        };
      }
    } catch {
      console.log("[GeminiService] Could not parse JSON response, using text analysis");
    }

    const shouldQuarantine =
      response.toLowerCase().includes("quarantine") ||
      response.toLowerCase().includes("temperature excursion") ||
      response.toLowerCase().includes("critical violation");

    return { violations: [], shouldQuarantine, confidence: 0.65 };
  }

  private buildPrompt(request: ComplianceAnalysisRequest): string {
    const systemPreamble = `You are the PolarUniversal Productivity & Compliance Agent. Your mission is to help professionals achieve their 2026 resolution of 100% audit readiness. You specialize in transforming complex Pharma GRC (FDA/HIPAA) requirements into a streamlined, high-productivity workflow. Every decision you make is logged via Opik tracing to provide a transparent audit trail for the user.`;

    if (request.custom_scenario) {
      return `${systemPreamble}

Analyze this compliance scenario:

${request.custom_scenario}

Provide a professional compliance assessment with actionable recommendations.

Respond with JSON:
{
  "quarantine": true/false,
  "confidence": 0.0-1.0,
  "violations": [{"type": "...", "severity": "CRITICAL|HIGH|MEDIUM|LOW", "description": "..."}],
  "recommendations": ["..."],
  "summary": "Brief summary of the compliance assessment"
}`;
    }

    return `${systemPreamble}

Analyze this drug batch for FDA 21 CFR Part 11 compliance.

Batch Data:
- Serial ID: ${request.serial_id}
- NDC Code: ${request.ndc_code || "MISSING"}
- Lot Number: ${request.lot_number || "MISSING"}
- Temperature Logs: ${JSON.stringify(request.temperature_logs || [])}
- Chain of Custody: ${JSON.stringify(request.chain_of_custody || [])}
- Expiration Date: ${request.expiration_date || "UNKNOWN"}

Cold chain requirements: 2-8°C for vaccines and biologics.

Respond with JSON:
{
  "quarantine": true/false,
  "confidence": 0.0-1.0,
  "violations": [{"type": "...", "severity": "CRITICAL|HIGH|MEDIUM|LOW", "description": "..."}],
  "recommendations": ["..."]
}`;
  }

  public async analyzeCompliance(request: ComplianceAnalysisRequest): Promise<GeminiAnalysisResult> {
    const timestamp = new Date().toISOString();
    const ruleResult = this.ruleBasedAnalysis(request);
    const prompt = this.buildPrompt(request);

    const geminiResponse = await this.callGeminiAPI(prompt);
    let geminiViolations: ComplianceViolation[] = [];
    let geminiQuarantine = false;
    let confidence = 0.85;

    if (geminiResponse) {
      const parsed = this.parseGeminiResponse(geminiResponse);
      geminiViolations = parsed.violations;
      geminiQuarantine = parsed.shouldQuarantine;
      confidence = parsed.confidence;
    }

    const allViolations = [...ruleResult.violations];
    for (const gv of geminiViolations) {
      if (!allViolations.some(v => v.type === gv.type && v.description === gv.description)) {
        allViolations.push(gv);
      }
    }

    const shouldQuarantine = ruleResult.shouldQuarantine || geminiQuarantine;

    let quarantineTx: string | undefined;
    if (shouldQuarantine) {
      console.log(`[GeminiService] Compliance breach for ${request.serial_id} - triggering quarantine`);
      const criticalViolation = allViolations.find(v => v.severity === "CRITICAL" || v.type === "TEMPERATURE_EXCURSION");
      const reason = criticalViolation?.description || "AI-detected compliance violation";
      const quarantineResult = await MovementService.triggerQuarantine(request.serial_id, reason, "GEMINI_COMPLIANCE_AI");
      if (quarantineResult.success) {
        quarantineTx = quarantineResult.transaction_hash || undefined;
      }
    }

    let status: GeminiAnalysisResult["status"];
    if (shouldQuarantine) {
      status = "QUARANTINE";
    } else if (allViolations.some(v => v.severity === "MEDIUM")) {
      status = "AUDIT_REQUIRED";
    } else if (allViolations.length > 0) {
      status = "PENDING";
    } else {
      status = "VERIFIED";
    }

    const recommendations: string[] = [];
    if (shouldQuarantine) {
      recommendations.push("IMMEDIATE: Quarantine batch and notify quality assurance team");
      recommendations.push("Initiate root cause analysis for temperature excursion");
    }
    allViolations.forEach(v => {
      if (v.recommendation && !recommendations.includes(v.recommendation)) {
        recommendations.push(v.recommendation);
      }
    });
    if (status === "VERIFIED") {
      recommendations.push("Batch cleared for distribution - maintain temperature monitoring");
    }

    return {
      status,
      confidence_score: confidence,
      violations: allViolations,
      recommendations,
      quarantine_triggered: shouldQuarantine,
      quarantine_transaction: quarantineTx,
      analysis_model: geminiResponse ? this.modelName : "rule-based-fallback",
      analysis_timestamp: timestamp,
      raw_ai_response: geminiResponse || undefined,
    };
  }

  public async checkGeminiStatus(): Promise<{ available: boolean; model: string; error?: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { available: false, model: this.modelName, error: "GEMINI_API_KEY not configured" };
    }

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: { "x-goog-api-key": apiKey },
      });
      if (response.ok) {
        return { available: true, model: this.modelName };
      }
      return { available: false, model: this.modelName, error: `API error: ${response.status}` };
    } catch (e: any) {
      return { available: false, model: this.modelName, error: e.message };
    }
  }
}

const geminiServiceInstance = GeminiComplianceService.getInstance();

export const GeminiService = {
  analyzeCompliance: geminiServiceInstance.analyzeCompliance.bind(geminiServiceInstance),
  checkGeminiStatus: geminiServiceInstance.checkGeminiStatus.bind(geminiServiceInstance),
};

export default GeminiService;
