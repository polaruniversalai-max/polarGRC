export enum RiskCategory {
  HIGH_RISK = 'High-Risk',
  PRIOR_INTIMATION = 'Prior-Intimation',
  COMPLIANT = 'Compliant'
}

export interface RegulatoryFlag {
  clause: string;
  description: string;
  severity: 'Critical' | 'Warning' | 'Informational';
  recommendation: string;
}

export interface ReasoningTrace {
  timestamp: string;
  documentHash: string;
  category: RiskCategory;
  bifurcationStatus: 'PERMISSION_REQUIRED' | 'ACKNOWLEDGED';
  flags: RegulatoryFlag[];
  summary: string;
  isValidDocument: boolean;
  validationErrors?: string[];
}

export interface SettlementData {
  txId: string;
  hash: string;
  timestamp: string;
  status: 'Pending' | 'Confirmed' | 'Failed';
}

export type TaskStatus = 'Planning' | 'Executing' | 'Verifying';

export type MissionPhase = 'Planning' | 'Verifying' | 'Finalizing';

export interface SecurityClearance {
  tenantId: string;
  authorized: boolean;
  accessScope: string[];
  verifiedAt: string;
}

export interface AntigravityArtifact {
  agentId: string;
  runId: string;
  taskStatus: TaskStatus;
  finalVerification: boolean;
  timestamp: string;
  metadata: Record<string, unknown>;
  result?: ReasoningTrace;
  security_clearance?: SecurityClearance;
}

export interface EthicsCheck {
  found: boolean;
  format_valid: boolean;
}

export interface AntigravityOutput {
  status: string;
  risk_level: string;
  reasoning: string;
  verified: boolean;
  trace_id: string;
  ethics_check: EthicsCheck;
  security_clearance?: SecurityClearance;
}

export interface AuditRecord {
  id: string;
  tenantId: string;
  timestamp: string;
  trace: ReasoningTrace;
  antigravity: AntigravityOutput;
  settlement: SettlementData | null;
}

export interface AnalysisResponse {
  trace: ReasoningTrace;
  settlement: SettlementData | null;
  artifact: AntigravityArtifact;
  antigravity: AntigravityOutput;
  timestamp: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  auditorRole: string;
}

export interface AgentMissionLog {
  missionId: string;
  tenantId: string;
  phase: MissionPhase;
  timestamp: string;
  message: string;
}
