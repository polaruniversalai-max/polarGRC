import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  Shield,
  ShieldAlert, 
  Info, 
  FileText, 
  RotateCcw, 
  Loader2, 
  Link2, 
  Hash, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Microscope,
  FileWarning,
  Zap,
  Gauge,
  Coins,
  Lock,
  Network,
  Route,
  Fingerprint,
} from "lucide-react";

interface RegulatoryFlag {
  clause: string;
  description: string;
  severity: "Critical" | "Warning" | "Informational";
  recommendation: string;
}

interface ReasoningTrace {
  timestamp: string;
  documentHash: string;
  category: string;
  bifurcationStatus: "PERMISSION_REQUIRED" | "ACKNOWLEDGED";
  flags: RegulatoryFlag[];
  summary: string;
  isValidDocument: boolean;
  validationErrors?: string[];
}

interface SettlementData {
  txId: string;
  hash: string;
  timestamp: string;
  status: "Pending" | "Confirmed" | "Failed";
}

interface AntigravityOutput {
  status: string;
  risk_level: string;
  reasoning: string;
  verified: boolean;
  trace_id: string;
  ethics_check: {
    found: boolean;
    format_valid: boolean;
  };
}

interface ArtifactData {
  agentId: string;
  runId: string;
  taskStatus: string;
  finalVerification: boolean;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface ChainHop {
  chain: string;
  ticker: string;
  role: string;
  gasEstimate: number;
  latencyMs: number;
  status: string;
}

interface NetworkReceipt {
  receiptId: string;
  routeUsed: string;
  routeLabel: string;
  timestamp: string;
  chains: ChainHop[];
  totalGasEstimate: number;
  gasSaved: number;
  gasSavedPercent: number;
  privacyLevel: string;
  privacyEngines: string[];
  executionTimeMs: number;
  zkProofGenerated: boolean;
  zkProofHash: string | null;
  tenantId: string;
  agentType: string;
}

interface ZKIdentity {
  anonymousId: string;
  proofHash: string;
  engine: string;
  shielded: boolean;
}

interface RouteConfig {
  id: string;
  label: string;
  priority: string;
  chains: string[];
  strategy: string;
  privacyLevel: string;
  estimatedGasMultiplier: number;
  batchingEnabled: boolean;
}

interface AnalysisResponse {
  trace: ReasoningTrace;
  settlement: SettlementData | null;
  artifact: ArtifactData;
  antigravity: AntigravityOutput;
  networkReceipt?: NetworkReceipt;
  zkIdentity?: ZKIdentity;
  timestamp: string;
}

type RouteId = "INSTITUTIONAL" | "PRO_AUDIT" | "ECONOMY";

const ROUTE_META: Record<RouteId, { icon: typeof Zap; color: string; shortLabel: string }> = {
  INSTITUTIONAL: { icon: Zap, color: "text-purple-400", shortLabel: "Instant" },
  PRO_AUDIT: { icon: Shield, color: "text-emerald-400", shortLabel: "Pro" },
  ECONOMY: { icon: Coins, color: "text-amber-400", shortLabel: "Eco" },
};

function FlagCard({ flag, index }: { flag: RegulatoryFlag; index: number }) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "Critical":
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          color: "text-red-400",
          bg: "bg-red-950/30",
          border: "border-red-800/50",
          badgeBg: "bg-red-600",
        };
      case "Warning":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          color: "text-amber-400",
          bg: "bg-amber-950/30",
          border: "border-amber-800/50",
          badgeBg: "bg-amber-600",
        };
      default:
        return {
          icon: <Info className="w-3.5 h-3.5" />,
          color: "text-blue-400",
          bg: "bg-blue-950/30",
          border: "border-blue-800/50",
          badgeBg: "bg-blue-600",
        };
    }
  };

  const config = getSeverityConfig(flag.severity);

  return (
    <div
      className={`p-4 rounded-md border ${config.bg} ${config.border}`}
      data-testid={`flag-card-${index}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${config.badgeBg} text-white text-[10px] font-mono`}>
            <FileText className="w-2.5 h-2.5 mr-1" />
            {flag.clause}
          </Badge>
          <span className={`${config.color} flex items-center gap-1`}>
            {config.icon}
          </span>
        </div>
        <span className="text-[10px] opacity-30 font-mono tracking-widest">
          TRACE_{index + 1}
        </span>
      </div>
      <p className="text-sm font-semibold mb-2 leading-tight text-foreground/90 font-mono">
        {flag.description}
      </p>
      <div className="text-[11px] opacity-60 border-t border-white/10 pt-2 mt-2 font-mono">
        <span className={`${config.color} font-bold uppercase mr-1`}>ACTION:</span>
        {flag.recommendation}
      </div>
    </div>
  );
}

function RouteSelector({ selected, onSelect, routes }: { selected: RouteId; onSelect: (r: RouteId) => void; routes: RouteConfig[] }) {
  return (
    <div className="flex gap-1.5" data-testid="route-selector">
      {(["ECONOMY", "PRO_AUDIT", "INSTITUTIONAL"] as RouteId[]).map((routeId) => {
        const meta = ROUTE_META[routeId];
        const Icon = meta.icon;
        const isActive = selected === routeId;
        const routeConfig = routes.find(r => r.id === routeId);
        return (
          <Button
            key={routeId}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(routeId)}
            className={`text-[10px] font-mono gap-1.5 ${isActive ? "" : "opacity-60"}`}
            data-testid={`route-btn-${routeId.toLowerCase()}`}
          >
            <Icon className="w-3 h-3" />
            {meta.shortLabel}
            {routeConfig && (
              <span className="opacity-50">
                {routeConfig.estimatedGasMultiplier}x
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

function NetworkReceiptCard({ receipt, zkIdentity }: { receipt: NetworkReceipt; zkIdentity?: ZKIdentity }) {
  return (
    <div className="p-4 bg-black/40 border border-purple-900/30 rounded-md font-mono text-[10px] space-y-3" data-testid="network-receipt">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-900/20 pb-2">
        <span className="flex items-center gap-1.5 text-purple-400 font-black uppercase tracking-[0.2em]">
          <Network className="w-3 h-3" />
          Network_Receipt
        </span>
        <span className="text-muted-foreground">{receipt.receiptId}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-purple-400/60 block mb-0.5">ROUTE</span>
          <span className="text-foreground/80 font-bold" data-testid="receipt-route">{receipt.routeLabel}</span>
        </div>
        <div>
          <span className="text-purple-400/60 block mb-0.5">GAS_SAVED</span>
          <span className="text-emerald-400 font-bold" data-testid="receipt-gas-saved">{receipt.gasSavedPercent}%</span>
        </div>
        <div>
          <span className="text-purple-400/60 block mb-0.5">PRIVACY</span>
          <span className={`font-bold ${receipt.privacyLevel === "MAXIMUM" ? "text-purple-400" : receipt.privacyLevel === "STANDARD" ? "text-blue-400" : "text-amber-400"}`} data-testid="receipt-privacy">
            {receipt.privacyLevel}
          </span>
        </div>
        <div>
          <span className="text-purple-400/60 block mb-0.5">EXEC_TIME</span>
          <span className="text-foreground/80 font-bold">{receipt.executionTimeMs}ms</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-purple-400/60 font-black uppercase tracking-widest">Chain_Hops</span>
        <div className="flex flex-wrap gap-1.5">
          {receipt.chains.map((hop, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] font-mono gap-1" data-testid={`chain-hop-${i}`}>
                <Route className="w-2.5 h-2.5" />
                {hop.ticker}
                <span className="opacity-40">{hop.latencyMs}ms</span>
              </Badge>
              {i < receipt.chains.length - 1 && (
                <span className="text-purple-400/30">&#8594;</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {receipt.privacyEngines.map((engine, i) => (
          <Badge key={i} className="bg-purple-950/50 text-purple-300 text-[9px] font-mono">
            <Lock className="w-2.5 h-2.5 mr-1" />
            {engine}
          </Badge>
        ))}
      </div>

      {zkIdentity && zkIdentity.shielded && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-purple-900/20 pt-2">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Fingerprint className="w-3 h-3" />
            <span className="font-bold">ZK_ID: {zkIdentity.anonymousId}</span>
          </div>
          <span className="text-muted-foreground">{zkIdentity.engine}</span>
        </div>
      )}

      {receipt.zkProofGenerated && receipt.zkProofHash && (
        <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
          <span className="opacity-40 flex items-center gap-1">
            <Hash className="w-3 h-3" />
            ZK_PROOF
          </span>
          <span className="truncate max-w-[200px] font-bold text-right">
            {receipt.zkProofHash.slice(0, 24)}...
          </span>
        </div>
      )}
    </div>
  );
}

export default function ClinicalAnalysisPage() {
  const [inputText, setInputText] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<RouteId>("PRO_AUDIT");
  const [logs, setLogs] = useState<string[]>([
    "[0x00] KERNEL_INIT: Sentinel OS Clinical Engine v1.2",
    "[0x01] SYS: NDCT-2026-Amendment loaded",
    "[0x02] ROUTE: Orchestrator online. 3 routes, 14 nodes.",
    "[0x03] NET: Awaiting clinical protocol input...",
  ]);
  const [result, setResult] = useState<ReasoningTrace | null>(null);
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [antigravity, setAntigravity] = useState<AntigravityOutput | null>(null);
  const [artifact, setArtifact] = useState<ArtifactData | null>(null);
  const [networkReceipt, setNetworkReceipt] = useState<NetworkReceipt | null>(null);
  const [zkIdentity, setZkIdentity] = useState<ZKIdentity | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const { data: routesData } = useQuery<{ routes: RouteConfig[] }>({
    queryKey: ["/api/v1/routes"],
  });

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs((p) => [...p.slice(-14), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const analyzeMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/v1/clinical/analyze", { content, routeId: selectedRoute });
      return res.json() as Promise<AnalysisResponse>;
    },
    onSuccess: (data) => {
      setResult(data.trace);
      setSettlement(data.settlement);
      setAntigravity(data.antigravity);
      setArtifact(data.artifact);
      setNetworkReceipt(data.networkReceipt || null);
      setZkIdentity(data.zkIdentity || null);
      addLog(`ENGINE: Bifurcation complete. Category: ${data.trace.category}`);
      addLog(`OPIK: Trace ${data.antigravity?.trace_id} | Verified: ${data.antigravity?.verified}`);
      if (data.networkReceipt) {
        addLog(`ROUTE: ${data.networkReceipt.routeLabel} | Gas saved: ${data.networkReceipt.gasSavedPercent}% | Privacy: ${data.networkReceipt.privacyLevel}`);
        addLog(`RECEIPT: ${data.networkReceipt.receiptId} | Chains: ${data.networkReceipt.chains.map(c => c.ticker).join(" -> ")}`);
      }
      if (data.zkIdentity?.shielded) {
        addLog(`ZK_ID: ${data.zkIdentity.anonymousId} | Engine: ${data.zkIdentity.engine}`);
      }
      if (data.settlement) {
        addLog(`ANCHOR: Blockchain settlement confirmed. TX=${data.settlement.txId.slice(0, 12)}`);
      }
    },
    onError: (err: Error) => {
      addLog(`FAULT: ${err.message}`);
    },
  });

  const handleAudit = () => {
    if (!inputText.trim()) return;
    addLog(`ENGINE: Booting Compliance Logic via ${ROUTE_META[selectedRoute].shortLabel} route...`);
    setResult(null);
    setSettlement(null);
    setNetworkReceipt(null);
    setZkIdentity(null);
    analyzeMutation.mutate(inputText);
  };

  const handleLoadMock = async () => {
    try {
      const res = await fetch("/api/v1/clinical/mock-report");
      const data = await res.json();
      setInputText(data.content);
      addLog("STREAM: Mock CT-10 protocol loaded into buffer.");
    } catch {
      addLog("FAULT: Failed to load mock report.");
    }
  };

  const handleReset = () => {
    setInputText("");
    setResult(null);
    setSettlement(null);
    setAntigravity(null);
    setArtifact(null);
    setNetworkReceipt(null);
    setZkIdentity(null);
    setLogs([
      "[0x00] KERNEL_PURGE: Memory buffers cleared.",
      "[0x01] SYS: Logic Core Reset Ready.",
    ]);
  };

  const routes = routesData?.routes || [];

  return (
    <div className="min-h-full bg-[hsl(var(--sovereign-blue))] text-[hsl(var(--electric-cyan))] font-mono flex flex-col p-6">
      <header className="border-b border-[hsl(var(--border))] pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-foreground flex items-center gap-2" data-testid="text-page-title">
            <Shield className="w-6 h-6 text-primary" />
            Clinical Compliance Engine
          </h1>
          <p className="text-sm font-sans text-muted-foreground">
            NDCT 2026 regulatory bifurcation & multi-chain audit orchestration
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RouteSelector selected={selectedRoute} onSelect={setSelectedRoute} routes={routes} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadMock} data-testid="button-load-mock">
              <FileWarning className="w-3.5 h-3.5 mr-1.5" />
              Load Sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-reset">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              SYS_RESET
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        <section className="lg:col-span-5 flex flex-col gap-4" data-testid="section-input">
          <Card className="flex-1 flex flex-col bg-[hsl(var(--card))] border-[hsl(var(--border))] overflow-hidden">
            <div className="p-3 border-b border-[hsl(var(--border))] flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase opacity-60">
              <span>Input_Buffer</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                REC
              </span>
            </div>
            <CardContent className="flex-1 flex flex-col p-0">
              <Textarea
                className="flex-1 border-0 rounded-none resize-none text-sm font-mono focus-visible:ring-0 min-h-[200px] bg-transparent text-foreground"
                placeholder="PASTE CLINICAL TRIAL PROTOCOL OR REGULATORY DOCUMENT HERE..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                data-testid="input-clinical-data"
              />
              <div className="p-4 border-t border-[hsl(var(--border))] space-y-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    Route: <span className={ROUTE_META[selectedRoute].color}>{ROUTE_META[selectedRoute].shortLabel}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {selectedRoute === "INSTITUTIONAL" ? "FHE Encrypted" : selectedRoute === "PRO_AUDIT" ? "ZK Verified" : "Hash Anon"}
                  </span>
                </div>
                <Button
                  className="w-full font-black text-xs tracking-[0.3em] uppercase"
                  onClick={handleAudit}
                  disabled={analyzeMutation.isPending || !inputText.trim()}
                  data-testid="button-execute-audit"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ENGINE_CALCULATING...
                    </>
                  ) : (
                    <>
                      <Microscope className="w-4 h-4 mr-2" />
                      EXECUTE_AUDIT
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-7 flex flex-col" data-testid="section-output">
          <Card className="flex-1 flex flex-col bg-[hsl(var(--card))] border-[hsl(var(--border))] overflow-hidden">
            <div className="p-3 border-b border-[hsl(var(--border))] flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase opacity-60">
              <span>Trace_Output</span>
              <span>VERIFIED_BY_GEMINI</span>
            </div>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {analyzeMutation.isError && (
                <div className="p-4 border border-red-600 bg-red-950/20 text-red-400 rounded-md font-bold text-xs uppercase" data-testid="text-error">
                  <XCircle className="w-4 h-4 inline mr-2" />
                  FAULT_DETECTED: {analyzeMutation.error?.message}
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {antigravity && (
                    <div className="p-4 bg-black/50 border border-emerald-900/30 rounded-md space-y-3" data-testid="auditor-console">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/20 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                          Auditor_Console
                        </span>
                        <Badge className={`text-[10px] ${antigravity.verified ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`} data-testid="badge-mission-status">
                          {antigravity.verified ? 'MISSION_VERIFIED' : 'MISSION_PENDING'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                        <div>
                          <span className="text-emerald-400/60 block mb-0.5">OPIK_TRACE_ID</span>
                          <span className="text-foreground/80 font-bold" data-testid="text-trace-id">{antigravity.trace_id}</span>
                        </div>
                        <div>
                          <span className="text-emerald-400/60 block mb-0.5">RISK_LEVEL</span>
                          <span className={`font-bold ${
                            antigravity.risk_level === 'High-Risk' ? 'text-red-400' :
                            antigravity.risk_level === 'Prior-Intimation' ? 'text-amber-400' : 'text-emerald-400'
                          }`} data-testid="text-risk-level">{antigravity.risk_level}</span>
                        </div>
                        <div>
                          <span className="text-emerald-400/60 block mb-0.5">ETHICS_FOUND</span>
                          <span className={`font-bold ${antigravity.ethics_check.found ? 'text-emerald-400' : 'text-red-400'}`} data-testid="text-ethics-found">
                            {antigravity.ethics_check.found ? 'DETECTED' : 'MISSING'}
                          </span>
                        </div>
                        <div>
                          <span className="text-emerald-400/60 block mb-0.5">FORMAT_VALID</span>
                          <span className={`font-bold ${antigravity.ethics_check.format_valid ? 'text-emerald-400' : 'text-amber-400'}`} data-testid="text-format-valid">
                            {antigravity.ethics_check.format_valid ? 'VALID' : 'INVALID'}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-foreground/50 border-t border-emerald-900/20 pt-2">
                        STATUS: <span className="text-emerald-400">{antigravity.status}</span>
                        {artifact && <> | AGENT: <span className="text-emerald-400">{artifact.agentId}</span></>}
                      </div>
                    </div>
                  )}

                  {networkReceipt && (
                    <NetworkReceiptCard receipt={networkReceipt} zkIdentity={zkIdentity || undefined} />
                  )}

                  <div
                    className={`p-5 rounded-md border-l-4 ${
                      result.bifurcationStatus === "PERMISSION_REQUIRED"
                        ? "border-l-red-600 bg-red-950/20"
                        : "border-l-emerald-500 bg-emerald-950/20"
                    }`}
                    data-testid="result-bifurcation"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                        {result.category}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        BIFURCATION_RESULT
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground/90 leading-relaxed mb-3" data-testid="text-summary">
                      {result.summary}
                    </p>
                    {result.bifurcationStatus === "PERMISSION_REQUIRED" && (
                      <Badge className="bg-red-600 text-white text-[10px]" data-testid="badge-mandatory-review">
                        Mandatory 45-Day Review Required
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] border-b border-[hsl(var(--border))] pb-2">
                      Reasoning_Trace
                    </p>
                    {result.flags.map((f, i) => (
                      <FlagCard key={i} flag={f} index={i} />
                    ))}
                  </div>

                  {settlement && (
                    <div className="p-4 bg-black/40 border border-[hsl(var(--electric-cyan))]/10 rounded-md font-mono text-[10px] space-y-2" data-testid="settlement-block">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[hsl(var(--electric-cyan))]/50 border-b border-white/5 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Link2 className="w-3 h-3" />
                          MOVEMENT_M1_SETTLEMENT
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          FINALIZED
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="opacity-40 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          TX_SIG
                        </span>
                        <span className="truncate max-w-[200px] text-right font-bold text-muted-foreground">
                          {settlement.txId}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="opacity-40 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          SHA_HASH
                        </span>
                        <span className="truncate max-w-[200px] text-right font-bold text-muted-foreground">
                          {result.documentHash.slice(0, 24)}...
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="opacity-40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          TIMESTAMP
                        </span>
                        <span className="text-right font-bold text-muted-foreground">
                          {new Date(settlement.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!result && !analyzeMutation.isPending && !analyzeMutation.isError && (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center opacity-15">
                  <Microscope className="w-16 h-16 mb-4" />
                  <p className="text-xs tracking-[0.8em] font-black uppercase">
                    Core_Idle_Ready
                  </p>
                </div>
              )}

              {analyzeMutation.isPending && (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--electric-cyan))] mb-4" />
                  <p className="text-xs tracking-[0.5em] font-black uppercase opacity-60 animate-pulse">
                    Analyzing_Protocol...
                  </p>
                </div>
              )}
            </CardContent>

            <div className="h-24 bg-black/60 border-t border-[hsl(var(--border))] p-3 text-[10px] overflow-y-auto font-mono" data-testid="terminal-console">
              {logs.map((l, i) => (
                <div key={i} className="mb-1 flex gap-3">
                  <span className="opacity-30 select-none">{i + 1}</span>
                  <span className={l.includes("FAULT") ? "text-red-400" : l.includes("ROUTE:") || l.includes("RECEIPT:") ? "text-purple-400" : l.includes("ZK_ID:") ? "text-purple-300" : "text-muted-foreground"}>
                    {l}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </Card>
        </section>
      </main>

      <footer className="mt-4 pt-3 border-t border-[hsl(var(--border))] text-[9px] opacity-30 flex flex-wrap justify-between gap-4 font-black tracking-widest uppercase">
        <div className="flex gap-6">
          <span>SNTL_OS_BUILD: 2026.1.2</span>
          <span>KERNEL: GEMINI_FLASH</span>
          <span>ROUTES: 3</span>
          <span>NODES: 14</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            ZK_ENGINE: ACTIVE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            MVMT_M1: ACTIVE
          </span>
        </div>
      </footer>
    </div>
  );
}
