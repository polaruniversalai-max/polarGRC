import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Cost-Optimization: Thinking Level Control
type ThinkingLevel = "low" | "medium" | "high";

interface GenerationConfig {
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK?: number;
}

// Context Caching for Regulatory Documents
interface CachedContext {
  content: string;
  jurisdiction: string;
  timestamp: number;
  expiresAt: number;
}

interface ComplianceAnalysisResult {
  status: "VERIFIED" | "QUARANTINE" | "AUDIT_REQUIRED" | "PENDING";
  confidence: number;
  violations: Array<{
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    description: string;
    evidence?: string;
    recommendation?: string;
  }>;
  recommendations: string[];
  reasoningLog: string[];
  sources: string[];
  timestamp: string;
}

interface AnalysisRequest {
  regulatoryText?: string;
  documentContent?: string;
  batchData?: {
    serialId: string;
    ndcCode?: string;
    lotNumber?: string;
    temperatureLogs?: Array<{ celsius: number; location?: string; timestamp?: string }>;
    chainOfCustody?: Array<{ entity: string; timestamp?: string }>;
    expirationDate?: string;
  };
  scenario?: string;
  jurisdiction?: "US" | "INDIA" | "UAE" | "EU";
}

export class SentinelBrain {
  private static instance: SentinelBrain | null = null;
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private readonly modelName = "gemini-1.5-flash";
  
  // Cost-Optimization: Configuration Presets
  private readonly configPresets: Record<ThinkingLevel, GenerationConfig> = {
    low: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      topP: 0.7,
      topK: 20,
    },
    medium: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      topP: 0.85,
      topK: 40,
    },
    high: {
      temperature: 1.0, // Gemini optimal per 2026 Developer Guide
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 64,
    },
  };

  // Context Caching: Regulatory Document Cache (1 hour TTL)
  private regulatoryCache: Map<string, CachedContext> = new Map();
  private readonly cacheTTL = 3600000; // 1 hour in ms

  private constructor() {
    this.initializeClient();
  }

  public static getInstance(): SentinelBrain {
    if (!SentinelBrain.instance) {
      SentinelBrain.instance = new SentinelBrain();
    }
    return SentinelBrain.instance;
  }

  private initializeClient(): void {
    const apiKey = process.env.Gemini_API_Key || process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      // Default to medium thinking level for initialization
      this.model = this.getModelWithConfig("medium");
      console.log(`[SentinelBrain] Initialized with ${this.modelName} (cost-optimized)`);
    } else {
      console.warn("[SentinelBrain] No API key found - using fallback mode");
    }
  }

  // Cost-Optimization: Get model with specific thinking level
  private getModelWithConfig(thinkingLevel: ThinkingLevel): GenerativeModel | null {
    if (!this.client) return null;
    
    const config = this.configPresets[thinkingLevel];
    return this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: config,
    });
  }

  // Context Caching: Store regulatory context
  public cacheRegulatoryContext(jurisdiction: string, content: string): void {
    const now = Date.now();
    this.regulatoryCache.set(jurisdiction, {
      content,
      jurisdiction,
      timestamp: now,
      expiresAt: now + this.cacheTTL,
    });
    console.log(`[SentinelBrain] Cached regulatory context for ${jurisdiction} (TTL: 1hr)`);
  }

  // Context Caching: Retrieve cached context
  private getCachedContext(jurisdiction: string): string | null {
    const cached = this.regulatoryCache.get(jurisdiction);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.regulatoryCache.delete(jurisdiction);
      console.log(`[SentinelBrain] Cache expired for ${jurisdiction}`);
      return null;
    }
    
    console.log(`[SentinelBrain] Using cached context for ${jurisdiction}`);
    return cached.content;
  }

  // Context Caching: Preload regulatory documents
  public async preloadRegulatoryDocuments(): Promise<void> {
    const jurisdictions = ["US", "INDIA", "UAE", "EU"];
    for (const jur of jurisdictions) {
      const context = this.getJurisdictionContext(jur);
      this.cacheRegulatoryContext(jur, context);
    }
    console.log("[SentinelBrain] Preloaded all jurisdiction contexts");
  }

  // Determine thinking level based on task complexity
  private determineThinkingLevel(request: AnalysisRequest): ThinkingLevel {
    // High: Complex multi-sector regulatory analysis
    if (request.documentContent && request.documentContent.length > 5000) return "high";
    if (request.batchData?.temperatureLogs && request.batchData.temperatureLogs.length > 10) return "high";
    if (request.scenario && request.scenario.toLowerCase().includes("cross-border")) return "high";
    
    // Low: Simple classification and UI updates
    if (!request.documentContent && !request.scenario) return "low";
    if (request.scenario && request.scenario.length < 100) return "low";
    
    // Medium: Standard compliance checks
    return "medium";
  }

  private buildCompliancePrompt(request: AnalysisRequest): string {
    // Context Caching: Use cached regulatory context if available
    const cachedContext = this.getCachedContext(request.jurisdiction || "US");
    const jurisdictionContext = cachedContext || this.getJurisdictionContext(request.jurisdiction);
    
    // Cache the context for future requests if not already cached
    if (!cachedContext) {
      this.cacheRegulatoryContext(request.jurisdiction || "US", jurisdictionContext);
    }
    
    let prompt = `You are the Sentinel OS Compliance AI - an institutional-grade GRC agent specializing in multi-sector regulatory compliance.

## Your Mission
Analyze the provided compliance data and provide a professional, audit-ready assessment with full reasoning transparency.

## Jurisdiction Context (Cached)
${jurisdictionContext}

## Analysis Guidelines
1. Cite specific regulatory references (FDA 21 CFR Part 11, DSCSA 2026, HIPAA, DPDP Act, etc.)
2. Provide step-by-step reasoning for each finding
3. Assign confidence scores based on evidence quality
4. Flag any data gaps that require human review

`;

    if (request.documentContent) {
      prompt += `## Document Content to Analyze
${request.documentContent}

`;
    }

    if (request.batchData) {
      prompt += `## Batch Data
- Serial ID: ${request.batchData.serialId}
- NDC Code: ${request.batchData.ndcCode || "MISSING"}
- Lot Number: ${request.batchData.lotNumber || "MISSING"}
- Temperature Logs: ${JSON.stringify(request.batchData.temperatureLogs || [])}
- Chain of Custody: ${JSON.stringify(request.batchData.chainOfCustody || [])}
- Expiration Date: ${request.batchData.expirationDate || "UNKNOWN"}

Cold chain requirements: 2-8°C for vaccines and biologics per FDA guidelines.

`;
    }

    if (request.scenario) {
      prompt += `## Scenario to Analyze
${request.scenario}

`;
    }

    if (request.regulatoryText) {
      prompt += `## Regulatory Reference Text
${request.regulatoryText}

`;
    }

    prompt += `## Required Response Format (JSON)
{
  "status": "VERIFIED|QUARANTINE|AUDIT_REQUIRED|PENDING",
  "confidence": 0.0-1.0,
  "violations": [
    {
      "type": "TEMPERATURE_EXCURSION|CUSTODY_GAP|EXPIRED|MISSING_DATA|REGULATORY",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "description": "Detailed description",
      "evidence": "Specific evidence from provided data",
      "recommendation": "Actionable recommendation"
    }
  ],
  "recommendations": ["List of actionable recommendations"],
  "reasoning": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "sources": ["FDA 21 CFR Part 11.10(a)", "DSCSA Section 582", ...]
}

Provide your analysis now:`;

    return prompt;
  }

  private getJurisdictionContext(jurisdiction?: string): string {
    const contexts: Record<string, string> = {
      US: `United States Regulations:
- FDA 21 CFR Part 11 (Electronic Records)
- DSCSA 2026 (Drug Supply Chain Security Act)
- HIPAA (Health Insurance Portability and Accountability Act)
- FDA 21 CFR Part 820 (Quality System Regulation)`,
      INDIA: `India Regulations:
- DPDP Act 2023 (Digital Personal Data Protection)
- CDSCO Guidelines (Central Drugs Standard Control Organization)
- RBI Regulatory Sandbox Guidelines
- IT Act 2000 (Information Technology)`,
      UAE: `UAE/Dubai Regulations:
- DIFC Data Protection Law 2020
- UAE Federal Law No. 45 of 2021 (Personal Data Protection)
- Dubai Healthcare City Regulations
- MOHAP Guidelines (Ministry of Health and Prevention)`,
      EU: `European Union Regulations:
- GDPR (General Data Protection Regulation)
- EU FMD (Falsified Medicines Directive)
- EudraLex Volume 4 (GMP Guidelines)
- MDR (Medical Devices Regulation)`,
    };
    return contexts[jurisdiction || "US"] || contexts.US;
  }

  private parseResponse(response: string): ComplianceAnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          status: parsed.status || "PENDING",
          confidence: parsed.confidence || 0.75,
          violations: parsed.violations || [],
          recommendations: parsed.recommendations || [],
          reasoningLog: parsed.reasoning || [],
          sources: parsed.sources || [],
          timestamp: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn("[SentinelBrain] Failed to parse JSON response");
    }

    const shouldQuarantine =
      response.toLowerCase().includes("quarantine") ||
      response.toLowerCase().includes("critical violation");

    return {
      status: shouldQuarantine ? "QUARANTINE" : "AUDIT_REQUIRED",
      confidence: 0.6,
      violations: [],
      recommendations: ["Manual review required - AI response parsing failed"],
      reasoningLog: ["Unable to parse structured response", "Fallback analysis applied"],
      sources: [],
      timestamp: new Date().toISOString(),
    };
  }

  public async analyzeCompliance(request: AnalysisRequest): Promise<ComplianceAnalysisResult> {
    const reasoningLog: string[] = [];
    reasoningLog.push(`[${new Date().toISOString()}] Analysis initiated`);

    if (!this.client) {
      reasoningLog.push("[FALLBACK] No AI client available - using rule-based analysis");
      return this.fallbackAnalysis(request, reasoningLog);
    }

    try {
      // Cost-Optimization: Determine thinking level
      const thinkingLevel = this.determineThinkingLevel(request);
      const config = this.configPresets[thinkingLevel];
      reasoningLog.push(`[COST-OPT] Thinking level: ${thinkingLevel} (temp: ${config.temperature}, tokens: ${config.maxOutputTokens})`);

      // Get model with appropriate configuration
      const model = this.getModelWithConfig(thinkingLevel);
      if (!model) {
        reasoningLog.push("[FALLBACK] Model initialization failed");
        return this.fallbackAnalysis(request, reasoningLog);
      }

      reasoningLog.push(`[MODEL] Using ${this.modelName} for analysis`);

      // Context Caching: Check for cached regulatory context
      const cachedContext = this.getCachedContext(request.jurisdiction || "US");
      if (cachedContext) {
        reasoningLog.push("[CACHE] Using cached regulatory context");
      }

      const prompt = this.buildCompliancePrompt(request);
      reasoningLog.push("[PROMPT] Compliance prompt constructed");

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      reasoningLog.push("[RESPONSE] AI response received");

      const analysis = this.parseResponse(response);
      analysis.reasoningLog = [...reasoningLog, ...analysis.reasoningLog];

      return analysis;
    } catch (error: any) {
      reasoningLog.push(`[ERROR] AI analysis failed: ${error.message}`);
      return this.fallbackAnalysis(request, reasoningLog);
    }
  }

  private fallbackAnalysis(request: AnalysisRequest, reasoningLog: string[]): ComplianceAnalysisResult {
    const violations: ComplianceAnalysisResult["violations"] = [];
    let shouldQuarantine = false;

    if (request.batchData?.temperatureLogs) {
      for (const log of request.batchData.temperatureLogs) {
        if (log.celsius > 8) {
          violations.push({
            type: "TEMPERATURE_EXCURSION",
            severity: log.celsius > 15 ? "CRITICAL" : "HIGH",
            description: `Temperature exceeded 8°C threshold: ${log.celsius}°C`,
            evidence: `Recorded at ${log.location || "unknown location"}`,
            recommendation: "Immediately quarantine batch and initiate stability assessment",
          });
          shouldQuarantine = true;
          reasoningLog.push(`[RULE] Temperature excursion detected: ${log.celsius}°C`);
        }
      }
    }

    if (!request.batchData?.ndcCode) {
      violations.push({
        type: "MISSING_DATA",
        severity: "MEDIUM",
        description: "Missing NDC code",
        recommendation: "Verify product identification before release",
      });
      reasoningLog.push("[RULE] Missing NDC code detected");
    }

    return {
      status: shouldQuarantine ? "QUARANTINE" : violations.length > 0 ? "AUDIT_REQUIRED" : "VERIFIED",
      confidence: 0.85,
      violations,
      recommendations: violations.map((v) => v.recommendation || ""),
      reasoningLog,
      sources: ["FDA 21 CFR Part 11", "DSCSA 2026"],
      timestamp: new Date().toISOString(),
    };
  }

  public async checkStatus(): Promise<{ available: boolean; model: string; error?: string }> {
    if (!this.model) {
      return {
        available: false,
        model: this.modelName,
        error: "API key not configured",
      };
    }

    try {
      const result = await this.model.generateContent("Respond with: OK");
      const response = result.response.text();
      return {
        available: response.includes("OK"),
        model: this.modelName,
      };
    } catch (e: any) {
      return {
        available: false,
        model: this.modelName,
        error: e.message,
      };
    }
  }
}

export default SentinelBrain;
