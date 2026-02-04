import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { PrivacyService } from "./services/privacy_service";
import { MovementService } from "./services/movement_service";
import { GeminiService } from "./services/gemini_service";
import { JupiterService } from "./services/jupiter_service";
import { ExportService } from "./services/export_service";
import { EmailService } from "./services/email_service";
import { DemoSeedService } from "./services/demo_seed_service";
import { ComplianceService } from "./services/compliance-service";
import { 
  SecurityMiddleware, 
  auditRateLimiter, 
  auditRequestSchema,
  scenarioAnalysisSchema,
  GlobalErrorHandler 
} from "./middleware/security";
import { db } from "./db";
import { 
  scans, shipments, reports, organizations, userRoles, creditBalances, usageLedger, alerts, paymentTransactions,
  platformTreasury, atpRegistry, userPreferences,
  CreditCosts, StakingTiers, calculateFreeScansFromStake, roleTypeSchema, UserRoleType,
  XPRewards, getRankFromXP, SovereignRanks
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const HIPAA_SENSITIVE_FIELDS = [
  "patient_id", "patient_name", "date_of_birth", "medical_record_number",
  "prescription_id", "pharmacy_id", "prescriber_npi", "diagnosis_codes"
];

type ComplianceStatus = "VERIFIED" | "QUARANTINE" | "AUDIT_REQUIRED" | "PENDING" | "REJECTED";

interface VerifyBatchRequest {
  serial_id: string;
  pharmacy_id?: string;
  batch_data?: {
    ndc_code?: string;
    lot_number?: string;
    temperature_logs?: Array<{ celsius: number; location?: string; timestamp?: string }>;
    chain_of_custody?: Array<{ entity: string; timestamp?: string }>;
    expiration_date?: string;
    manufacturing_date?: string;
    hipaa_fields?: Record<string, string>;
  };
  include_ai_analysis?: boolean;
  include_gas_estimate?: boolean;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/license", (req, res) => {
    const licensePath = path.join(process.cwd(), "LICENSE");
    if (fs.existsSync(licensePath)) {
      res.type("text/plain").send(fs.readFileSync(licensePath, "utf-8"));
    } else {
      res.status(404).send("License not found");
    }
  });

  app.get("/api/privacy", (req, res) => {
    const privacyPath = path.join(process.cwd(), "PRIVACY.md");
    if (fs.existsSync(privacyPath)) {
      res.type("text/markdown").send(fs.readFileSync(privacyPath, "utf-8"));
    } else {
      res.status(404).send("Privacy policy not found");
    }
  });

  app.get("/api/copyright", (req, res) => {
    const copyrightPath = path.join(process.cwd(), "COPYRIGHT");
    if (fs.existsSync(copyrightPath)) {
      res.type("text/plain").send(fs.readFileSync(copyrightPath, "utf-8"));
    } else {
      res.status(404).send("Copyright not found");
    }
  });

  app.get("/api/v1/health", async (req, res) => {
    try {
      const [movementStatus, geminiStatus, jupiterStatus] = await Promise.all([
        MovementService.getMovementNetworkStatus(),
        GeminiService.checkGeminiStatus(),
        JupiterService.checkJupiterStatus(),
      ]);

      res.json({
        status: "healthy",
        service: "PolarUniversal Pharma Engine",
        version: "3.1.0-WHALE",
        components: {
          movement_blockchain: {
            connected: movementStatus.connected,
            network: movementStatus.network,
            chain_id: movementStatus.chainId,
            ledger_version: movementStatus.ledgerVersion,
          },
          gemini_ai: {
            available: geminiStatus.available,
            model: geminiStatus.model,
            error: geminiStatus.error,
          },
          jupiter_price: {
            available: jupiterStatus.available,
            latency_ms: jupiterStatus.latency_ms,
          },
          privacy_layer: {
            available: true,
            type: "Railgun-compatible ZK shielding",
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({
        status: "error",
        error: e.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/api/v1/movement-status", async (req, res) => {
    try {
      const status = await MovementService.getMovementNetworkStatus();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({
        connected: false,
        network: "Movement Testnet (M1)",
        error: e.message,
      });
    }
  });

  app.post("/api/v1/verify-batch", async (req, res) => {
    try {
      const {
        serial_id,
        pharmacy_id,
        batch_data = {},
        include_ai_analysis = true,
        include_gas_estimate = true,
      }: VerifyBatchRequest = req.body;

      if (!serial_id) {
        return res.status(400).json({
          error: "serial_id is required",
          code: "MISSING_SERIAL_ID",
        });
      }

      const effectivePharmacyId = pharmacy_id || `pharmacy_${crypto.randomBytes(8).toString("hex")}`;

      const [movementResult, gasEstimate] = await Promise.all([
        MovementService.verifyOnMovement(serial_id),
        include_gas_estimate 
          ? JupiterService.estimateGasCost("movement", "verify")
          : Promise.resolve(null),
      ]);

      let aiAnalysis = null;
      let quarantineTriggered = false;
      let quarantineTransaction = null;

      if (include_ai_analysis) {
        aiAnalysis = await GeminiService.analyzeCompliance({
          serial_id,
          ndc_code: batch_data.ndc_code,
          lot_number: batch_data.lot_number,
          temperature_logs: batch_data.temperature_logs,
          chain_of_custody: batch_data.chain_of_custody,
          expiration_date: batch_data.expiration_date,
          manufacturing_date: batch_data.manufacturing_date,
        });

        quarantineTriggered = aiAnalysis.quarantine_triggered;
        quarantineTransaction = aiAnalysis.quarantine_transaction;
      }

      let shieldingResult = null;
      const hipaaFields = batch_data.hipaa_fields || {};
      
      if (Object.keys(hipaaFields).length > 0) {
        shieldingResult = await PrivacyService.shieldBatchData(
          effectivePharmacyId,
          serial_id,
          new Date().toISOString(),
          hipaaFields
        );
      }

      let complianceStatus: ComplianceStatus;
      if (aiAnalysis) {
        complianceStatus = aiAnalysis.status;
      } else if (movementResult.found && movementResult.resource) {
        complianceStatus = movementResult.resource.status === "QUARANTINED" 
          ? "QUARANTINE" 
          : "VERIFIED";
      } else if (movementResult.success) {
        complianceStatus = "PENDING";
      } else {
        complianceStatus = "AUDIT_REQUIRED";
      }

      const verificationInput = `${serial_id}:${new Date().toISOString()}:${complianceStatus}`;
      const verificationHash = crypto.createHash("sha256").update(verificationInput).digest("hex");

      res.json({
        serial_id,
        pharmacy_id: effectivePharmacyId,
        compliance_status: complianceStatus,
        blockchain_verification: {
          network: "Movement Testnet (M1)",
          success: movementResult.success,
          found: movementResult.found,
          resource_address: movementResult.resource_address,
          resource_type: movementResult.resource_type,
          ledger_version: movementResult.ledger_version,
          explorer_url: movementResult.explorer_url,
          on_chain_data: movementResult.resource,
          error: movementResult.error,
        },
        ai_compliance_analysis: aiAnalysis ? {
          status: aiAnalysis.status,
          confidence_score: aiAnalysis.confidence_score,
          violations: aiAnalysis.violations,
          recommendations: aiAnalysis.recommendations,
          model: aiAnalysis.analysis_model,
          timestamp: aiAnalysis.analysis_timestamp,
        } : null,
        quarantine_action: quarantineTriggered ? {
          triggered: true,
          transaction_hash: quarantineTransaction,
          triggered_by: "GEMINI_COMPLIANCE_AI",
          reason: aiAnalysis?.violations.find((v: { severity: string }) => v.severity === "CRITICAL")?.description,
        } : null,
        privacy_shielding: shieldingResult ? {
          success: shieldingResult.success,
          zk_address: shieldingResult.zkAddress,
          note_id: shieldingResult.noteId,
          commitment: shieldingResult.commitment,
          nullifier: shieldingResult.nullifier,
          shield_type: "Railgun-compatible",
        } : null,
        gas_estimate: gasEstimate,
        verification_hash: verificationHash,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error("Verify batch error:", e);
      res.status(500).json({
        error: e.message,
        code: "VERIFICATION_FAILED",
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.post("/api/v1/privacy/create-wallet", async (req, res) => {
    try {
      const { pharmacy_id } = req.body;

      if (!pharmacy_id) {
        return res.status(400).json({
          error: "pharmacy_id is required",
          code: "MISSING_PHARMACY_ID",
        });
      }

      const wallet = PrivacyService.createPrivacyWallet(pharmacy_id);

      res.json({
        success: true,
        pharmacy_id,
        zk_address: wallet.zkAddress,
        viewing_key: {
          public_key: wallet.viewingKey.viewingPublicKey,
          private_key: wallet.viewingKey.viewingPrivateKey,
          created_at: wallet.viewingKey.createdAt,
        },
        message: "Store your viewing private key securely - it cannot be recovered",
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "WALLET_CREATION_FAILED",
      });
    }
  });

  app.post("/api/v1/privacy/shield", async (req, res) => {
    try {
      const { pharmacy_id, batch_id, data } = req.body;

      if (!pharmacy_id || !batch_id) {
        return res.status(400).json({
          error: "pharmacy_id and batch_id are required",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      const result = await PrivacyService.shieldBatchData(
        pharmacy_id,
        batch_id,
        new Date().toISOString(),
        data || {}
      );

      if (!result.success) {
        return res.status(500).json({
          error: result.error,
          code: "SHIELDING_FAILED",
        });
      }

      res.json({
        success: true,
        note_id: result.noteId,
        commitment: result.commitment,
        nullifier: result.nullifier,
        zk_address: result.zkAddress,
        encrypted_payload_hash: crypto.createHash("sha256")
          .update(result.encryptedPayload)
          .digest("hex"),
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "SHIELDING_FAILED",
      });
    }
  });

  app.post("/api/v1/privacy/view-history", async (req, res) => {
    try {
      const { pharmacy_id, viewing_private_key } = req.body;

      if (!pharmacy_id || !viewing_private_key) {
        return res.status(400).json({
          error: "pharmacy_id and viewing_private_key are required",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      const result = await PrivacyService.viewShieldedHistory(pharmacy_id, viewing_private_key);

      if (!result.success) {
        return res.status(403).json({
          error: result.error,
          code: "VIEW_ACCESS_DENIED",
        });
      }

      res.json({
        success: true,
        pharmacy_id,
        total_notes: result.noteHistory.length,
        history: result.decryptedData,
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "VIEW_FAILED",
      });
    }
  });

  app.get("/api/v1/privacy/export-viewing-key/:pharmacy_id", async (req, res) => {
    try {
      const { pharmacy_id } = req.params;

      const viewingKey = PrivacyService.exportViewingKey(pharmacy_id);

      if (!viewingKey) {
        return res.status(404).json({
          error: "Wallet not found for pharmacy",
          code: "WALLET_NOT_FOUND",
        });
      }

      res.json({
        pharmacy_id,
        viewing_key: viewingKey,
        warning: "Keep your private key secure - anyone with this key can view your transaction history",
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "EXPORT_FAILED",
      });
    }
  });

  app.post("/api/v1/quarantine/trigger", async (req, res) => {
    try {
      const { serial_id, reason } = req.body;

      if (!serial_id || !reason) {
        return res.status(400).json({
          error: "serial_id and reason are required",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      const result = await MovementService.triggerQuarantine(
        serial_id,
        reason,
        "MANUAL_TRIGGER"
      );

      res.json({
        success: result.success,
        serial_id,
        new_status: result.new_status,
        transaction_hash: result.transaction_hash,
        triggered_by: result.triggered_by,
        timestamp: result.timestamp,
        error: result.error,
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "QUARANTINE_FAILED",
      });
    }
  });

  app.get("/api/v1/gas/estimate/:chain", async (req, res) => {
    try {
      const { chain } = req.params;
      const { operation = "verify" } = req.query;

      const estimate = await JupiterService.estimateGasCost(
        chain,
        operation as "verify" | "quarantine" | "transfer"
      );

      res.json(estimate);
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "GAS_ESTIMATE_FAILED",
      });
    }
  });

  app.get("/api/v1/price/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;

      const price = await JupiterService.getTokenPrice(symbol.toUpperCase());

      if (!price) {
        return res.status(404).json({
          error: `Price not found for ${symbol}`,
          code: "PRICE_NOT_FOUND",
        });
      }

      res.json(price);
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "PRICE_FETCH_FAILED",
      });
    }
  });

  app.post("/api/v1/prices", async (req, res) => {
    try {
      const { symbols } = req.body;

      if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({
          error: "symbols array is required",
          code: "MISSING_SYMBOLS",
        });
      }

      const prices = await JupiterService.getMultipleTokenPrices(
        symbols.map((s: string) => s.toUpperCase())
      );

      res.json({
        prices,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "PRICE_FETCH_FAILED",
      });
    }
  });

  app.post("/api/v1/analyze-shipment", async (req, res) => {
    try {
      const {
        serial_id,
        pharmacy_id,
        temperature_logs,
        chain_of_custody,
        ndc_code,
        lot_number,
        shield_data = false,
      } = req.body;

      if (!serial_id) {
        return res.status(400).json({
          error: "serial_id is required",
          code: "MISSING_SERIAL_ID",
        });
      }

      const effectivePharmacyId = pharmacy_id || `pharmacy_${crypto.randomBytes(8).toString("hex")}`;

      const aiAnalysis = await GeminiService.analyzeCompliance({
        serial_id,
        ndc_code,
        lot_number,
        temperature_logs,
        chain_of_custody,
      });

      let viewingKey = null;
      let shieldResult = null;

      if (shield_data) {
        const wallet = PrivacyService.createPrivacyWallet(effectivePharmacyId);
        viewingKey = wallet.viewingKey;
        shieldResult = await PrivacyService.shieldBatchData(
          effectivePharmacyId,
          serial_id,
          new Date().toISOString(),
          { temperature_logs, chain_of_custody }
        );
      }

      ExportService.addComplianceLog({
        timestamp: new Date().toISOString(),
        serial_id,
        pharmacy_id: effectivePharmacyId,
        compliance_status: aiAnalysis.status,
        ai_analysis: {
          status: aiAnalysis.status,
          confidence_score: aiAnalysis.confidence_score,
          violations: aiAnalysis.violations,
        },
        quarantine_action: aiAnalysis.quarantine_triggered ? {
          triggered: true,
          transaction_hash: aiAnalysis.quarantine_transaction || undefined,
          reason: aiAnalysis.violations.find((v: { severity: string }) => v.severity === "CRITICAL")?.description,
        } : undefined,
      });

      res.json({
        serial_id,
        pharmacy_id: effectivePharmacyId,
        analysis: {
          status: aiAnalysis.status,
          confidence_score: aiAnalysis.confidence_score,
          violations: aiAnalysis.violations,
          recommendations: aiAnalysis.recommendations,
          model: aiAnalysis.analysis_model,
        },
        quarantine: {
          triggered: aiAnalysis.quarantine_triggered,
          transaction_hash: aiAnalysis.quarantine_transaction,
        },
        privacy: shield_data ? {
          shielded: shieldResult?.success || false,
          zk_address: shieldResult?.zkAddress,
          viewing_key: viewingKey ? {
            public_key: viewingKey.viewingPublicKey,
            private_key: viewingKey.viewingPrivateKey,
          } : null,
          note_id: shieldResult?.noteId,
        } : null,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error("Analyze shipment error:", e);
      res.status(500).json({
        error: e.message,
        code: "ANALYSIS_FAILED",
      });
    }
  });

  app.get("/api/v1/export-report", async (req, res) => {
    try {
      const { format = "json", pharmacy_id, status, from_date, to_date } = req.query;

      const logs = ExportService.getComplianceLogs({
        pharmacy_id: pharmacy_id as string,
        status: status as string,
        from_date: from_date as string,
        to_date: to_date as string,
      });

      switch (format) {
        case "csv":
          const csvContent = ExportService.exportToCSV(logs);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", `attachment; filename=compliance_report_${Date.now()}.csv`);
          res.send(csvContent);
          break;

        case "pdf":
          const pdfData = ExportService.exportToPDFContent(logs);
          res.setHeader("Content-Type", "text/plain");
          res.setHeader("Content-Disposition", `attachment; filename=compliance_report_${Date.now()}.txt`);
          res.send(pdfData.content);
          break;

        case "json":
        default:
          const jsonContent = ExportService.exportToJSON(logs);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Content-Disposition", `attachment; filename=compliance_report_${Date.now()}.json`);
          res.send(jsonContent);
          break;
      }
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "EXPORT_FAILED",
      });
    }
  });

  app.post("/api/v1/batch-audit", async (req, res) => {
    try {
      const { email, pharmacy_id } = req.body;

      if (!email || !pharmacy_id) {
        return res.status(400).json({
          error: "email and pharmacy_id are required",
          code: "MISSING_REQUIRED_FIELDS",
        });
      }

      const job = EmailService.createBatchJob(email, pharmacy_id);

      (async () => {
        try {
          EmailService.updateBatchJob(job.id, { status: "processing" });

          const logs = ExportService.getComplianceLogs({ pharmacy_id });
          const jsonReport = ExportService.exportToJSON(logs);
          const csvReport = ExportService.exportToCSV(logs);
          const pdfData = ExportService.exportToPDFContent(logs);

          const emailResult = await EmailService.sendBatchAuditReport(
            email,
            pharmacy_id,
            {
              json: jsonReport,
              csv: csvReport,
              pdfText: pdfData.content,
            },
            pdfData.summary
          );

          if (emailResult.success) {
            EmailService.updateBatchJob(job.id, {
              status: "completed",
              completed_at: new Date().toISOString(),
            });
          } else {
            EmailService.updateBatchJob(job.id, {
              status: "failed",
              error: emailResult.error,
            });
          }
        } catch (e: any) {
          EmailService.updateBatchJob(job.id, {
            status: "failed",
            error: e.message,
          });
        }
      })();

      res.json({
        success: true,
        job_id: job.id,
        status: "pending",
        message: `Batch audit report will be sent to ${email}`,
        estimated_completion: "1-5 minutes",
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "BATCH_AUDIT_FAILED",
      });
    }
  });

  app.get("/api/v1/batch-audit/:job_id", async (req, res) => {
    try {
      const { job_id } = req.params;
      const job = EmailService.getBatchJob(job_id);

      if (!job) {
        return res.status(404).json({
          error: "Job not found",
          code: "JOB_NOT_FOUND",
        });
      }

      res.json(job);
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "JOB_LOOKUP_FAILED",
      });
    }
  });

  app.get("/api/v1/gas/savings", async (req, res) => {
    try {
      const [movementGas, ethereumGas] = await Promise.all([
        JupiterService.estimateGasCost("movement", "verify"),
        JupiterService.estimateGasCost("ethereum", "verify"),
      ]);

      const movementCost = movementGas?.estimatedGasCostUSD || 0.034;
      const ethereumCost = ethereumGas?.estimatedGasCostUSD || 2.50;
      const savings = ethereumCost - movementCost;
      const savingsPercent = ((savings / ethereumCost) * 100).toFixed(1);

      res.json({
        sovereign_route: {
          chain: "Movement M1",
          cost_usd: movementCost,
        },
        standard_route: {
          chain: "Ethereum Mainnet",
          cost_usd: ethereumCost,
        },
        savings: {
          amount_usd: savings,
          percent: parseFloat(savingsPercent),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "SAVINGS_CALC_FAILED",
      });
    }
  });

  // Sentinel OS - Enterprise Compliance Audit (OOP Architecture)
  const complianceService = new ComplianceService();

  // CDSCO Engine - NDCT 2026 Amendment Rules
  const { CDSCOEngine } = await import("./services/cdsco-engine");
  const cdscoEngine = CDSCOEngine.getInstance();

  // Vault - PII Masking Layer
  const { Vault } = await import("./services/vault");
  const vault = Vault.getInstance();

  // CDSCO Trial Evaluation API
  app.post("/api/v1/cdsco/evaluate-trial",
    SecurityMiddleware.zeroTrustHeaders(),
    auditRateLimiter,
    SecurityMiddleware.sanitizeInput(),
    async (req, res) => {
      try {
        const { drugProfile } = req.body;
        if (!drugProfile || !drugProfile.name || !drugProfile.category) {
          return res.status(400).json({
            error: "drugProfile with name and category is required",
            code: "INVALID_INPUT",
          });
        }

        const evaluation = cdscoEngine.evaluateTrialType(drugProfile);
        const deadline = cdscoEngine.calculateSHAKTIDeadline(
          drugProfile.applicationDate ? new Date(drugProfile.applicationDate) : new Date(),
          evaluation.trialType
        );

        res.json({
          evaluation,
          deadline,
          ndctVersion: cdscoEngine.getNDCTVersion(),
          timestamp: new Date().toISOString(),
        });
      } catch (e: any) {
        res.status(500).json({
          error: e.message,
          code: "CDSCO_EVALUATION_FAILED",
        });
      }
    });

  // Vault PII Masking API
  app.post("/api/v1/vault/mask",
    SecurityMiddleware.zeroTrustHeaders(),
    auditRateLimiter,
    async (req, res) => {
      try {
        const { data, sessionId } = req.body;
        if (!data) {
          return res.status(400).json({
            error: "data field is required",
            code: "INVALID_INPUT",
          });
        }

        const result = vault.prepareForLLM(data, sessionId);
        res.json({
          safeData: result.safeData,
          summary: result.piiSummary,
          sessionId: sessionId || null,
          timestamp: new Date().toISOString(),
        });
      } catch (e: any) {
        res.status(500).json({
          error: e.message,
          code: "PII_MASKING_FAILED",
        });
      }
    });

  // Vault Stats API
  app.get("/api/v1/vault/stats", async (req, res) => {
    try {
      const stats = vault.getStats();
      res.json({
        ...stats,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "VAULT_STATS_FAILED",
      });
    }
  });

  // Miro SDK Integration
  const { MiroIntegration } = await import("./services/miro-integration");
  const miroIntegration = MiroIntegration.getInstance();

  // Miro Status API
  app.get("/api/v1/miro/status", async (req, res) => {
    try {
      const status = miroIntegration.getStatus();
      res.json({
        ...status,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "MIRO_STATUS_FAILED",
      });
    }
  });

  // Miro Create Compliance Board
  app.post("/api/v1/miro/create-board",
    SecurityMiddleware.zeroTrustHeaders(),
    async (req, res) => {
      try {
        const { auditId } = req.body;
        if (!auditId) {
          return res.status(400).json({
            error: "auditId is required",
            code: "INVALID_INPUT",
          });
        }

        const board = await miroIntegration.createComplianceBoard(auditId);
        const nodes = miroIntegration.generateComplianceFlowData("STANDBY");

        if (board) {
          await miroIntegration.addComplianceNodes(board.boardId, nodes);
        }

        res.json({
          board,
          nodes: nodes.length,
          status: miroIntegration.getStatus(),
          timestamp: new Date().toISOString(),
        });
      } catch (e: any) {
        res.status(500).json({
          error: e.message,
          code: "MIRO_BOARD_FAILED",
        });
      }
    });

  app.post("/api/v1/sentinel/audit", 
    SecurityMiddleware.zeroTrustHeaders(),
    auditRateLimiter,
    SecurityMiddleware.sanitizeInput(),
    SecurityMiddleware.validateRequest(auditRequestSchema),
    SecurityMiddleware.auditLog(),
    async (req, res) => {
    try {
      const { 
        serialId, 
        scenario, 
        jurisdiction = "US",
        includeBlockchainVerification = true,
        includePrivacyShielding = false,
        hipaaFields
      } = req.body;

      if (!serialId && !scenario) {
        return res.status(400).json({
          error: "Either serialId or scenario is required",
          code: "MISSING_INPUT",
        });
      }

      const result = await complianceService.runComplianceAudit({
        serialId: serialId || `AUDIT-${Date.now()}`,
        scenario,
        jurisdiction,
        includeBlockchainVerification,
        includePrivacyShielding,
        hipaaFields,
      });

      res.json(result);
    } catch (e: any) {
      console.error("[Sentinel Audit Error]:", e);
      res.status(500).json({
        error: e.message,
        code: "AUDIT_FAILED",
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/api/v1/sentinel/status", async (req, res) => {
    try {
      const status = await complianceService.getSystemStatus();
      res.json({
        ...status,
        version: "1.2.0",
        standard: "Triple-Zero",
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "STATUS_CHECK_FAILED",
      });
    }
  });

  // Compliance Command Center - General Scenario Analysis
  app.post("/api/v1/compliance/analyze-scenario", async (req, res) => {
    try {
      const { scenario } = req.body;
      
      if (!scenario || typeof scenario !== 'string' || scenario.trim().length === 0) {
        return res.status(400).json({
          error: "Missing or empty compliance scenario",
          code: "INVALID_SCENARIO",
        });
      }

      // Use Gemini to analyze the compliance scenario
      const analysis = await GeminiService.analyzeCompliance({
        serial_id: `SCENARIO-${Date.now()}`,
        ndc_code: "N/A",
        lot_number: "N/A",
        temperature_logs: [],
        chain_of_custody: [],
        custom_scenario: scenario,
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        scenario: scenario.substring(0, 200),
        analysis: analysis,
        opik_traced: true,
        project: "polar-universal",
      });
    } catch (e: any) {
      console.error("Compliance scenario analysis error:", e);
      res.status(500).json({
        error: e.message,
        code: "SCENARIO_ANALYSIS_FAILED",
      });
    }
  });

  // Demo Data Endpoints
  app.post("/api/v1/demo/seed", async (req, res) => {
    try {
      const result = await DemoSeedService.seedAllDemoData();
      res.json({
        success: true,
        message: "Demo data seeded successfully",
        ...result,
      });
    } catch (e: any) {
      console.error("Demo seed error:", e);
      res.status(500).json({
        error: e.message,
        code: "SEED_FAILED",
      });
    }
  });

  app.delete("/api/v1/demo/clear", async (req, res) => {
    try {
      const result = await DemoSeedService.clearDemoData();
      res.json({
        success: true,
        message: "Demo data cleared successfully",
        ...result,
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "CLEAR_FAILED",
      });
    }
  });

  app.get("/api/v1/demo/stats", async (req, res) => {
    try {
      const stats = await DemoSeedService.getDemoDataStats();
      res.json({
        success: true,
        ...stats,
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "STATS_FAILED",
      });
    }
  });

  app.get("/api/v1/scans", async (req, res) => {
    try {
      const { limit = 50, status, is_demo } = req.query;
      
      if (!db) {
        return res.json({ scans: [], total: 0 });
      }

      let query = db.select().from(scans).orderBy(desc(scans.created_at)).limit(Number(limit));
      
      const results = await query;
      
      res.json({
        scans: results,
        total: results.length,
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "SCANS_FETCH_FAILED",
      });
    }
  });

  app.get("/api/v1/shipments", async (req, res) => {
    try {
      const { limit = 50 } = req.query;
      
      if (!db) {
        return res.json({ shipments: [], total: 0 });
      }

      const results = await db.select().from(shipments).orderBy(desc(shipments.created_at)).limit(Number(limit));
      
      res.json({
        shipments: results,
        total: results.length,
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "SHIPMENTS_FETCH_FAILED",
      });
    }
  });

  app.get("/api/v1/reports", async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      
      if (!db) {
        return res.json({ reports: [], total: 0 });
      }

      const results = await db.select().from(reports).orderBy(desc(reports.created_at)).limit(Number(limit));
      
      res.json({
        reports: results,
        total: results.length,
      });
    } catch (e: any) {
      res.status(500).json({
        error: e.message,
        code: "REPORTS_FETCH_FAILED",
      });
    }
  });

  app.get("/api/v1/organizations/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const [org] = await db.select().from(organizations).where(eq(organizations.id, req.params.id));
      if (!org) return res.status(404).json({ error: "Organization not found" });
      res.json(org);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/organizations", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const userId = req.user?.claims?.sub;
      const { name, corporateId, fdaLicenseNumber, dea_number, address, phone, email } = req.body;
      
      const [org] = await db.insert(organizations).values({
        name,
        corporateId,
        fdaLicenseNumber,
        dea_number,
        address,
        phone,
        email,
      }).returning();

      await db.insert(userRoles).values({
        userId,
        organizationId: org.id,
        role: "admin",
        permissions: ["all"],
      });

      await db.insert(creditBalances).values({
        userId,
        organizationId: org.id,
        balance: 100,
      });

      res.json(org);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/v1/organizations/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const { name, corporateId, fdaLicenseNumber, dea_number, address, phone, email } = req.body;
      
      const [org] = await db.update(organizations)
        .set({ name, corporateId, fdaLicenseNumber, dea_number, address, phone, email, updatedAt: new Date() })
        .where(eq(organizations.id, req.params.id))
        .returning();
      
      res.json(org);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/credits", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.json({ balance: 100, lifetimeEarned: 0, lifetimeSpent: 0, stakedPolarTokens: 0, freeMonthlyScans: 0 });
      const userId = req.user?.claims?.sub;
      
      let [balance] = await db.select().from(creditBalances).where(eq(creditBalances.userId, userId));
      
      if (!balance) {
        [balance] = await db.insert(creditBalances).values({ userId, balance: 100 }).returning();
      }
      
      res.json(balance);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/credits/consume", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const userId = req.user?.claims?.sub;
      const { actionType, description, metadata } = req.body;
      
      // Validate action type and get credit cost from centralized constants
      const validActionTypes: Record<string, number> = {
        SCAN: CreditCosts.SCAN,
        ZK_SHIELD: CreditCosts.ZK_SHIELD,
        PDF_EXPORT: CreditCosts.PDF_EXPORT,
      };
      
      const creditCost = validActionTypes[actionType];
      if (creditCost === undefined) {
        return res.status(400).json({ 
          error: `Invalid action type: ${actionType}. Valid types: SCAN, ZK_SHIELD, PDF_EXPORT`,
          validTypes: Object.keys(validActionTypes),
          creditCosts: CreditCosts,
        });
      }
      
      let [balance] = await db.select().from(creditBalances).where(eq(creditBalances.userId, userId));
      
      if (!balance || balance.balance < creditCost) {
        return res.status(400).json({ 
          error: "Insufficient credits", 
          code: "INSUFFICIENT_CREDITS",
          required: creditCost,
          available: balance?.balance || 0,
        });
      }

      await db.update(creditBalances)
        .set({ 
          balance: balance.balance - creditCost,
          lifetimeSpent: (balance.lifetimeSpent || 0) + creditCost,
          updatedAt: new Date(),
        })
        .where(eq(creditBalances.userId, userId));

      await db.insert(usageLedger).values({
        userId,
        actionType,
        description: description || `${actionType} operation`,
        creditsUsed: creditCost,
        metadata,
      });

      res.json({ 
        success: true, 
        newBalance: balance.balance - creditCost,
        creditsUsed: creditCost,
        actionType,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/credits/topup", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const userId = req.user?.claims?.sub;
      const { amount, creditsToAdd, stripeSessionId } = req.body;

      let [balance] = await db.select().from(creditBalances).where(eq(creditBalances.userId, userId));
      
      if (!balance) {
        [balance] = await db.insert(creditBalances).values({ userId, balance: 0 }).returning();
      }

      await db.update(creditBalances)
        .set({
          balance: balance.balance + creditsToAdd,
          lifetimeEarned: (balance.lifetimeEarned || 0) + creditsToAdd,
          updatedAt: new Date(),
        })
        .where(eq(creditBalances.userId, userId));

      await db.insert(paymentTransactions).values({
        userId,
        stripeSessionId: stripeSessionId || `mock_${Date.now()}`,
        amount,
        creditsAdded: creditsToAdd,
        status: "completed",
      });

      await db.insert(usageLedger).values({
        userId,
        actionType: "CREDIT_TOPUP",
        description: `Purchased ${creditsToAdd} credits`,
        creditsEarned: creditsToAdd,
        metadata: { amount, stripeSessionId },
      });

      res.json({ success: true, newBalance: balance.balance + creditsToAdd });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/ledger", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.json({ transactions: [], total: 0 });
      const userId = req.user?.claims?.sub;
      const { limit = 50 } = req.query;

      const transactions = await db.select().from(usageLedger)
        .where(eq(usageLedger.userId, userId))
        .orderBy(desc(usageLedger.createdAt))
        .limit(Number(limit));

      res.json({ transactions, total: transactions.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/alerts", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.json({ alerts: [], total: 0 });
      const userId = req.user?.claims?.sub;

      const userAlerts = await db.select().from(alerts)
        .where(and(eq(alerts.userId, userId), eq(alerts.isDismissed, false)))
        .orderBy(desc(alerts.createdAt))
        .limit(50);

      res.json({ alerts: userAlerts, total: userAlerts.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/alerts", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const userId = req.user?.claims?.sub;
      const { type, priority, title, message, metadata } = req.body;

      const [alert] = await db.insert(alerts).values({
        userId,
        type,
        priority,
        title,
        message,
        metadata,
      }).returning();

      res.json(alert);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/v1/alerts/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      
      const [alert] = await db.update(alerts)
        .set({ isRead: true })
        .where(eq(alerts.id, req.params.id))
        .returning();

      res.json(alert);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/v1/alerts/:id/dismiss", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      
      const [alert] = await db.update(alerts)
        .set({ isDismissed: true })
        .where(eq(alerts.id, req.params.id))
        .returning();

      res.json(alert);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/analytics/roi", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) {
        return res.json({
          finesAvoided: 0,
          potentialFinePerViolation: 10000,
          verifiedScans: 0,
          totalScans: 0,
          complianceRate: 0,
          timeSaved: { hours: 0, costSaved: 0 },
          creditUsage: { total: 0, scans: 0, zkShielding: 0, exports: 0 },
        });
      }
      
      const userId = req.user?.claims?.sub;
      
      const allScans = await db.select().from(scans).where(eq(scans.userId, userId));
      const verifiedScans = allScans.filter(s => s.status === "VERIFIED").length;
      const totalScans = allScans.length;
      const complianceRate = totalScans > 0 ? (verifiedScans / totalScans) * 100 : 0;
      
      const FINE_PER_VIOLATION = 10000;
      const finesAvoided = verifiedScans * FINE_PER_VIOLATION;
      
      const HOURS_PER_MANUAL_AUDIT = 2;
      const HOURLY_RATE = 150;
      const timeSavedHours = totalScans * HOURS_PER_MANUAL_AUDIT;
      const costSaved = timeSavedHours * HOURLY_RATE;

      const ledgerEntries = await db.select().from(usageLedger).where(eq(usageLedger.userId, userId));
      const creditUsage = {
        total: ledgerEntries.reduce((acc, e) => acc + (e.creditsUsed || 0), 0),
        scans: ledgerEntries.filter(e => e.actionType === "SCAN").reduce((acc, e) => acc + (e.creditsUsed || 0), 0),
        zkShielding: ledgerEntries.filter(e => e.actionType === "ZK_SHIELDING").reduce((acc, e) => acc + (e.creditsUsed || 0), 0),
        exports: ledgerEntries.filter(e => e.actionType === "PDF_EXPORT").reduce((acc, e) => acc + (e.creditsUsed || 0), 0),
      };

      res.json({
        finesAvoided,
        potentialFinePerViolation: FINE_PER_VIOLATION,
        verifiedScans,
        totalScans,
        complianceRate,
        timeSaved: { hours: timeSavedHours, costSaved },
        creditUsage,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/v1/user/role", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.json({ role: "auditor", permissions: [] });
      const userId = req.user?.claims?.sub;
      
      const [userRole] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
      
      if (!userRole) {
        return res.json({ role: "auditor", permissions: ["view_reports"] });
      }
      
      res.json(userRole);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/staking/claim-rewards", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const userId = req.user?.claims?.sub;
      
      let [balance] = await db.select().from(creditBalances).where(eq(creditBalances.userId, userId));
      
      if (!balance) {
        return res.status(400).json({ error: "No credit balance found" });
      }

      const stakedAmount = balance.stakedPolarTokens || 0;
      // Use centralized staking tier function from schema
      const freeScans = calculateFreeScansFromStake(stakedAmount);

      // Return current tier info for UI display
      const currentTier = StakingTiers.find(t => stakedAmount >= t.minStake);
      const nextTier = StakingTiers.filter(t => stakedAmount < t.minStake).pop();

      if (freeScans > 0) {
        await db.update(creditBalances)
          .set({
            freeMonthlyScans: freeScans,
            lastRewardAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(creditBalances.userId, userId));
      }

      res.json({ 
        success: true, 
        freeScans, 
        stakedAmount,
        currentTier: currentTier ? { minStake: currentTier.minStake, freeScans: currentTier.freeScans } : null,
        nextTier: nextTier ? { minStake: nextTier.minStake, freeScans: nextTier.freeScans } : null,
        tiers: StakingTiers,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/staking/update", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      const userId = req.user?.claims?.sub;
      const { stakedAmount } = req.body;

      await db.update(creditBalances)
        .set({
          stakedPolarTokens: stakedAmount,
          updatedAt: new Date(),
        })
        .where(eq(creditBalances.userId, userId));

      res.json({ success: true, stakedAmount });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Platform Treasury API - 2.5% fee tracking
  const PLATFORM_FEE_PERCENTAGE = 2.5;

  app.get("/api/v1/admin/treasury", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) return res.status(500).json({ error: "Database not available" });
      
      // Check if user is admin (mocked for now)
      const userId = req.user?.claims?.sub;
      
      const treasuryRecords = await db.select().from(platformTreasury).orderBy(desc(platformTreasury.createdAt)).limit(100);
      
      // Calculate totals
      const totalFees = treasuryRecords.reduce((sum, r) => sum + (r.feeAmount || 0), 0);
      const totalGross = treasuryRecords.reduce((sum, r) => sum + (r.grossAmount || 0), 0);
      
      res.json({
        success: true,
        treasury: {
          totalFees: Number(totalFees.toFixed(2)),
          totalGross: Number(totalGross.toFixed(2)),
          transactionCount: treasuryRecords.length,
          feePercentage: PLATFORM_FEE_PERCENTAGE,
          availableProfit: Number(totalFees.toFixed(2)),
        },
        recentTransactions: treasuryRecords.slice(0, 20),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/v1/admin/treasury/withdraw", isAuthenticated, async (req: any, res) => {
    try {
      // Mocked withdraw functionality
      const { amount } = req.body;
      
      res.json({
        success: true,
        message: "Withdrawal request submitted (mocked)",
        requestedAmount: Number(amount || 0).toFixed(2),
        status: "pending_review",
        estimatedProcessingTime: "3-5 business days",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ATP Registry verification endpoint
  app.post("/api/v1/atp/verify", async (req, res) => {
    try {
      const { licenseNumber, serialId } = req.body;
      
      if (!licenseNumber || !serialId) {
        return res.status(400).json({ 
          error: "License number and serial ID required",
          code: "MISSING_PARAMS" 
        });
      }

      if (!db) {
        // Mock ATP verification when DB not available
        return res.json({
          verified: Math.random() > 0.2,
          licenseNumber,
          message: "ATP verification completed (mock mode)",
        });
      }

      const [atpRecord] = await db.select().from(atpRegistry)
        .where(eq(atpRegistry.licenseNumber, licenseNumber));

      if (!atpRecord) {
        return res.json({
          verified: false,
          licenseNumber,
          message: "License not found in ATP Registry - QUARANTINE triggered",
          quarantine: true,
        });
      }

      if (!atpRecord.isActive) {
        return res.json({
          verified: false,
          licenseNumber,
          message: "ATP license inactive or expired - QUARANTINE triggered",
          quarantine: true,
        });
      }

      res.json({
        verified: true,
        licenseNumber,
        atpName: atpRecord.name,
        licenseType: atpRecord.licenseType,
        verifiedAt: new Date().toISOString(),
        message: "ATP verification successful",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // User Preferences API (Sovereign OS - Audit Notes, Favorites)
  app.get("/api/v1/user/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const [prefs] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (!prefs) {
        // Return default preferences if none exist
        return res.json({
          auditNotes: "",
          favorites: [],
          tourCompleted: false,
          settings: {},
        });
      }

      res.json({
        auditNotes: prefs.auditNotes || "",
        favorites: prefs.favorites || [],
        tourCompleted: prefs.tourCompleted || false,
        settings: prefs.settings || {},
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/v1/user/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { auditNotes, favorites, tourCompleted, settings } = req.body;

      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Upsert user preferences
      const [existing] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (existing) {
        // Update existing preferences
        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (auditNotes !== undefined) updateData.auditNotes = auditNotes;
        if (favorites !== undefined) updateData.favorites = favorites;
        if (tourCompleted !== undefined) updateData.tourCompleted = tourCompleted;
        if (settings !== undefined) updateData.settings = settings;

        await db
          .update(userPreferences)
          .set(updateData)
          .where(eq(userPreferences.userId, userId));
      } else {
        // Insert new preferences
        await db.insert(userPreferences).values({
          userId,
          auditNotes: auditNotes || "",
          favorites: favorites || [],
          tourCompleted: tourCompleted || false,
          settings: settings || {},
        });
      }

      res.json({ success: true, message: "Preferences updated" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Treasury Stats endpoint
  app.get("/api/v1/treasury/stats", isAuthenticated, async (req: any, res) => {
    try {
      const totalFees = await db
        ?.select({ total: sql<number>`COALESCE(SUM(fee_amount), 0)` })
        .from(platformTreasury);

      const totalTransactions = await db
        ?.select({ count: sql<number>`COUNT(*)` })
        .from(platformTreasury);

      res.json({
        totalFees: totalFees?.[0]?.total || 0,
        totalTransactions: totalTransactions?.[0]?.count || 0,
        polarPrice: 0.25,
        gasPrice: 25,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Treasury Transaction History
  app.get("/api/v1/treasury/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const transactions = await db
        ?.select()
        .from(platformTreasury)
        .where(eq(platformTreasury.sourceUserId, userId))
        .orderBy(desc(platformTreasury.createdAt))
        .limit(20);

      const formatted = (transactions || []).map(tx => ({
        id: tx.id,
        type: tx.transactionType === "credit_purchase" ? "buy" : "swap",
        fromToken: tx.transactionType === "credit_purchase" ? "USD" : "ETH",
        toToken: "POLAR",
        fromAmount: tx.grossAmount || 0,
        toAmount: (tx.netAmount || 0) * 4,
        feeAmount: tx.feeAmount || 0,
        feePercentage: tx.feePercentage || 1.5,
        status: "completed",
        timestamp: tx.createdAt,
      }));

      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Treasury Buy endpoint
  const SOVEREIGN_FEE = 1.5;
  app.post("/api/v1/treasury/buy", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { amount, token } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const feeAmount = amount * (SOVEREIGN_FEE / 100);
      const netAmount = amount - feeAmount;
      const tokensReceived = netAmount * 4;

      // Log to platform treasury
      if (db) {
        await db.insert(platformTreasury).values({
          sourceUserId: userId,
          transactionType: "credit_purchase",
          grossAmount: amount,
          feeAmount,
          feePercentage: SOVEREIGN_FEE,
          netAmount,
          metadata: { token, tokensReceived },
        });

        // Award XP for token swap (+50 XP)
        const [prefs] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, userId))
          .limit(1);

        if (prefs) {
          await db
            .update(userPreferences)
            .set({ 
              complianceXP: sql`COALESCE(compliance_xp, 0) + ${XPRewards.TOKEN_SWAP}`,
              updatedAt: new Date() 
            })
            .where(eq(userPreferences.userId, userId));
        } else {
          await db.insert(userPreferences).values({
            userId,
            complianceXP: XPRewards.TOKEN_SWAP,
          });
        }

        // Update credit balance
        const [balance] = await db
          .select()
          .from(creditBalances)
          .where(eq(creditBalances.userId, userId))
          .limit(1);

        if (balance) {
          await db
            .update(creditBalances)
            .set({ 
              balance: sql`balance + ${Math.floor(tokensReceived)}`,
              updatedAt: new Date() 
            })
            .where(eq(creditBalances.userId, userId));
        }
      }

      res.json({
        success: true,
        fromToken: "USD",
        toToken: token || "POLAR",
        fromAmount: amount,
        toAmount: tokensReceived,
        feeAmount,
        feePercentage: SOVEREIGN_FEE,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Treasury Swap endpoint
  app.post("/api/v1/treasury/swap", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { fromToken, toToken, amount } = req.body;
      if (!amount || amount <= 0 || !fromToken || !toToken) {
        return res.status(400).json({ error: "Invalid swap parameters" });
      }

      const feeAmount = amount * (SOVEREIGN_FEE / 100);
      const netAmount = amount - feeAmount;

      // Log to platform treasury
      if (db) {
        await db.insert(platformTreasury).values({
          sourceUserId: userId,
          transactionType: "token_swap",
          grossAmount: amount,
          feeAmount,
          feePercentage: SOVEREIGN_FEE,
          netAmount,
          metadata: { fromToken, toToken },
        });

        // Award XP for token swap (+50 XP) with upsert logic
        const [prefs] = await db
          .select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, userId))
          .limit(1);

        if (prefs) {
          await db
            .update(userPreferences)
            .set({ 
              complianceXP: sql`COALESCE(compliance_xp, 0) + ${XPRewards.TOKEN_SWAP}`,
              updatedAt: new Date() 
            })
            .where(eq(userPreferences.userId, userId));
        } else {
          await db.insert(userPreferences).values({
            userId,
            complianceXP: XPRewards.TOKEN_SWAP,
          });
        }
      }

      res.json({
        success: true,
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: netAmount,
        feeAmount,
        feePercentage: SOVEREIGN_FEE,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Leaderboard endpoint - Top facilities in Irving by XP
  app.get("/api/v1/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      if (!db) {
        return res.json([]);
      }

      const leaderboardData = await db
        .select({
          userId: userPreferences.userId,
          facilityName: userPreferences.facilityName,
          facilityLocation: userPreferences.facilityLocation,
          complianceXP: userPreferences.complianceXP,
        })
        .from(userPreferences)
        .where(eq(userPreferences.facilityLocation, "Irving"))
        .orderBy(desc(userPreferences.complianceXP))
        .limit(10);

      const formatted = leaderboardData.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        facilityName: entry.facilityName || `Facility #${index + 1}`,
        facilityLocation: entry.facilityLocation || "Irving",
        complianceXP: entry.complianceXP || 0,
        sovereignRank: getRankFromXP(entry.complianceXP || 0).name,
      }));

      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Award XP for verified scan endpoint (called after successful scan)
  app.post("/api/v1/xp/award-scan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const [prefs] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      if (prefs) {
        await db
          .update(userPreferences)
          .set({ 
            complianceXP: sql`COALESCE(compliance_xp, 0) + ${XPRewards.VERIFIED_SCAN}`,
            updatedAt: new Date() 
          })
          .where(eq(userPreferences.userId, userId));
      } else {
        await db.insert(userPreferences).values({
          userId,
          complianceXP: XPRewards.VERIFIED_SCAN,
        });
      }

      res.json({ success: true, xpAwarded: XPRewards.VERIFIED_SCAN });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
