export type RouteId = 'INSTITUTIONAL' | 'PRO_AUDIT' | 'ECONOMY';
export type RoutePriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type PrivacyLevel = 'MAXIMUM' | 'STANDARD' | 'BASIC';
export type IndustrySector = 'PHARMA' | 'BANKING' | 'SECURITY' | 'COMPUTE';

export interface NetworkNode {
  ticker: string;
  name: string;
  sector: IndustrySector;
  role: string;
  isActive: boolean;
  latencyMs: number;
  privacyCapable: boolean;
}

export interface RouteConfig {
  id: RouteId;
  label: string;
  priority: RoutePriority;
  chains: string[];
  strategy: string;
  privacyLevel: PrivacyLevel;
  estimatedGasMultiplier: number;
  batchingEnabled: boolean;
}

export interface NetworkReceipt {
  receiptId: string;
  routeUsed: RouteId;
  routeLabel: string;
  timestamp: string;
  chains: ChainHop[];
  totalGasEstimate: number;
  gasSaved: number;
  gasSavedPercent: number;
  privacyLevel: PrivacyLevel;
  privacyEngines: string[];
  executionTimeMs: number;
  zkProofGenerated: boolean;
  zkProofHash: string | null;
  tenantId: string;
  agentType: 'SITE_FINDER' | 'AUDIT' | 'COMPLIANCE';
}

export interface ChainHop {
  chain: string;
  ticker: string;
  role: string;
  gasEstimate: number;
  latencyMs: number;
  status: 'COMPLETED' | 'PENDING' | 'SKIPPED';
}

export interface ZKIdentity {
  anonymousId: string;
  proofHash: string;
  engine: 'ZAMA_FHE' | 'RAILGUN_SHIELD' | 'ZKSYNC_L2';
  shielded: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface RouteSelectionRequest {
  routeId: RouteId;
  tenantId: string;
  agentType: 'SITE_FINDER' | 'AUDIT' | 'COMPLIANCE';
  payload?: Record<string, unknown>;
}

export interface RouteSelectionResponse {
  route: RouteConfig;
  receipt: NetworkReceipt;
  zkIdentity: ZKIdentity;
  networkPool: NetworkNode[];
}

export interface IndustryNetworkPool {
  pharma: NetworkNode[];
  banking: NetworkNode[];
  security: NetworkNode[];
  compute: NetworkNode[];
}

export interface RouteOrchestratorStatus {
  activeRoute: RouteId;
  totalRoutes: number;
  networkNodesOnline: number;
  networkNodesTotal: number;
  lastReceiptId: string | null;
  uptime: string;
  zkEngineStatus: 'ACTIVE' | 'STANDBY' | 'OFFLINE';
}
