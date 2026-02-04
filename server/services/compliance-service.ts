import { SentinelBrain } from "./sentinel-brain";
import { DocumentProcessor } from "./document-processor";
import { SanityClient } from "./sanity-client";
import { MovementService } from "./movement_service";
import { PrivacyService } from "./privacy_service";
import crypto from "crypto";

export type AuditLifecycle = "STANDBY" | "PROCESSING" | "RISK_ASSESSMENT" | "COMPLETE" | "ERROR";

interface ComplianceAuditRequest {
  serialId: string;
  pharmacyId?: string;
  documentPath?: string;
  documentBase64?: string;
  scenario?: string;
  jurisdiction?: "US" | "INDIA" | "UAE" | "EU";
  includeBlockchainVerification?: boolean;
  includePrivacyShielding?: boolean;
  hipaaFields?: Record<string, string>;
}

interface ComplianceAuditResult {
  auditId: string;
  lifecycle: AuditLifecycle;
  serialId: string;
  pharmacyId: string;
  compliance: {
    status: string;
    confidence: number;
    violations: any[];
    recommendations: string[];
    reasoningLog: string[];
    sources: string[];
  };
  blockchain?: {
    network: string;
    verified: boolean;
    transactionHash?: string;
    explorerUrl?: string;
  };
  privacy?: {
    shielded: boolean;
    zkAddress?: string;
    noteId?: string;
  };
  regulatoryContext?: {
    rules: any[];
    jurisdiction: string;
  };
  verificationHash: string;
  timestamp: string;
  processingTimeMs: number;
}

export class ComplianceService {
  private sentinelBrain: SentinelBrain;
  private documentProcessor: DocumentProcessor;
  private sanityClient: SanityClient;
  private currentLifecycle: AuditLifecycle = "STANDBY";
  private lifecycleListeners: Array<(lifecycle: AuditLifecycle) => void> = [];

  constructor() {
    this.sentinelBrain = SentinelBrain.getInstance();
    this.documentProcessor = new DocumentProcessor();
    this.sanityClient = new SanityClient();
  }

  private updateLifecycle(lifecycle: AuditLifecycle): void {
    this.currentLifecycle = lifecycle;
    this.lifecycleListeners.forEach((listener) => listener(lifecycle));
  }

  public onLifecycleChange(callback: (lifecycle: AuditLifecycle) => void): void {
    this.lifecycleListeners.push(callback);
  }

  public getLifecycle(): AuditLifecycle {
    return this.currentLifecycle;
  }

  public async runComplianceAudit(request: ComplianceAuditRequest): Promise<ComplianceAuditResult> {
    const startTime = Date.now();
    const auditId = crypto.randomUUID();
    const effectivePharmacyId = request.pharmacyId || `pharmacy_${crypto.randomBytes(8).toString("hex")}`;

    try {
      this.updateLifecycle("PROCESSING");

      let documentContent: string | undefined;
      if (request.documentPath || request.documentBase64) {
        documentContent = await this.documentProcessor.extractText(
          request.documentPath,
          request.documentBase64
        );
      }

      const regulatoryRules = await this.sanityClient.getComplianceRules(request.jurisdiction || "US");

      this.updateLifecycle("RISK_ASSESSMENT");

      const aiAnalysis = await this.sentinelBrain.analyzeCompliance({
        documentContent,
        scenario: request.scenario,
        jurisdiction: request.jurisdiction,
        batchData: {
          serialId: request.serialId,
        },
        regulatoryText: regulatoryRules.map((r: { description: string }) => r.description).join("\n"),
      });

      let blockchainResult: ComplianceAuditResult["blockchain"];
      if (request.includeBlockchainVerification) {
        const movementVerification = await MovementService.verifyOnMovement(request.serialId);
        blockchainResult = {
          network: "Movement Testnet (M1)",
          verified: movementVerification.success,
          transactionHash: (movementVerification.resource as any)?.transaction_hash,
          explorerUrl: movementVerification.explorer_url,
        };

        if (aiAnalysis.status === "QUARANTINE") {
          const quarantineResult = await MovementService.triggerQuarantine(
            request.serialId,
            aiAnalysis.violations[0]?.description || "AI-detected compliance violation",
            "SENTINEL_BRAIN"
          );
          if (quarantineResult.transaction_hash) {
            blockchainResult.transactionHash = quarantineResult.transaction_hash;
          }
        }
      }

      let privacyResult: ComplianceAuditResult["privacy"];
      if (request.includePrivacyShielding && request.hipaaFields) {
        const shieldResult = await PrivacyService.shieldBatchData(
          effectivePharmacyId,
          request.serialId,
          new Date().toISOString(),
          request.hipaaFields
        );
        privacyResult = {
          shielded: shieldResult.success,
          zkAddress: shieldResult.zkAddress,
          noteId: shieldResult.noteId,
        };
      }

      const verificationInput = `${auditId}:${request.serialId}:${aiAnalysis.status}:${Date.now()}`;
      const verificationHash = crypto.createHash("sha256").update(verificationInput).digest("hex");

      this.updateLifecycle("COMPLETE");

      return {
        auditId,
        lifecycle: "COMPLETE",
        serialId: request.serialId,
        pharmacyId: effectivePharmacyId,
        compliance: {
          status: aiAnalysis.status,
          confidence: aiAnalysis.confidence,
          violations: aiAnalysis.violations,
          recommendations: aiAnalysis.recommendations,
          reasoningLog: aiAnalysis.reasoningLog,
          sources: aiAnalysis.sources,
        },
        blockchain: blockchainResult,
        privacy: privacyResult,
        regulatoryContext: {
          rules: regulatoryRules,
          jurisdiction: request.jurisdiction || "US",
        },
        verificationHash,
        timestamp: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      this.updateLifecycle("ERROR");
      throw new Error(`Compliance audit failed: ${error.message}`);
    }
  }

  public async analyzeScenario(
    scenario: string,
    jurisdiction?: "US" | "INDIA" | "UAE" | "EU"
  ): Promise<{
    analysis: any;
    regulatoryContext: any[];
  }> {
    const rules = await this.sanityClient.getComplianceRules(jurisdiction || "US");

    const analysis = await this.sentinelBrain.analyzeCompliance({
      scenario,
      jurisdiction,
      regulatoryText: rules.map((r: { description: string }) => r.description).join("\n"),
    });

    return {
      analysis,
      regulatoryContext: rules,
    };
  }

  public async getSystemStatus(): Promise<{
    sentinelBrain: { available: boolean; model: string };
    documentProcessor: { available: boolean };
    sanityClient: { available: boolean };
    blockchain: { connected: boolean };
  }> {
    const [brainStatus, movementStatus] = await Promise.all([
      this.sentinelBrain.checkStatus(),
      MovementService.getMovementNetworkStatus(),
    ]);

    return {
      sentinelBrain: {
        available: brainStatus.available,
        model: brainStatus.model,
      },
      documentProcessor: {
        available: this.documentProcessor.isAvailable(),
      },
      sanityClient: {
        available: this.sanityClient.isAvailable(),
      },
      blockchain: {
        connected: movementStatus.connected,
      },
    };
  }
}

export default ComplianceService;
