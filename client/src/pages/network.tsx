import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Layers,
  Zap,
  RefreshCw,
  Loader2,
  Radio,
  Globe,
  Lock,
  Server,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

interface TollRoad {
  id: string;
  tier: string;
  label: string;
  costMultiplier: number;
  processingMode: string;
  chains: string[];
  settlementChains: string[];
  encryptionEngine: string;
  strategy: string;
  resilience: {
    primary: string;
    secondary: string;
    fallback: string;
    activeLayer: string;
  };
}

interface OWASPStatus {
  owaspVersion: string;
  mitigationsActive: number;
  totalMitigations: number;
  mitigations: Array<{
    code: string;
    name: string;
    status: string;
    severity: string;
  }>;
  circuitBreaker: {
    isTripped: boolean;
    consecutiveFailures: number;
    maxFailures: number;
    cooldownMs: number;
  };
}

interface NetworkVitalEntry {
  chain: string;
  ticker: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  latencyMs: number;
  tier: "PRIMARY" | "SECONDARY" | "FALLBACK";
  tollRoad: string;
  role: string;
  lastChecked: string;
}

interface NetworkVitals {
  chains: NetworkVitalEntry[];
  overallHealth: string;
  resilienceEvents: Array<{
    id: string;
    timestamp: string;
    tollRoad: string;
    fromTier: string;
    toTier: string;
    fromChain: string;
    toChain: string;
    reason: string;
    autoHealed: boolean;
  }>;
  lastUpdated: string;
}

interface ResilienceData {
  events: Array<{
    id: string;
    timestamp: string;
    tollRoad: string;
    fromTier: string;
    toTier: string;
    fromChain: string;
    toChain: string;
    reason: string;
    autoHealed: boolean;
  }>;
  stacks: Record<string, { primary: string; secondary: string; fallback: string; activeLayer: string }>;
}

interface NetworkPool {
  totalNodes: number;
  onlineNodes: number;
  pools: Array<{
    industry: string;
    nodes: Array<{ name: string; ticker: string; status: string }>;
  }>;
}

const TOLL_ROAD_LABELS: Record<string, string> = {
  TURBO_TOLL: "Turbo Toll",
  EXPRESS_LANE: "Express Lane",
  ECO_COMMUTE: "Eco-Commute",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-amber-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-blue-400",
};

function StatusIndicator({ status }: { status: string }) {
  const colors: Record<string, string> = {
    HEALTHY: "bg-emerald-500",
    DEGRADED: "bg-amber-500",
    DOWN: "bg-red-500",
    ONLINE: "bg-emerald-500",
    ACTIVE: "bg-emerald-500",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-muted-foreground"}`}
      data-testid={`status-indicator-${status?.toLowerCase()}`}
    />
  );
}

export default function NetworkPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: tollRoads, isLoading: tollLoading } = useQuery<{ tollRoads: TollRoad[]; status: any }>({
    queryKey: ["/api/v1/routes/toll-road", refreshKey],
  });

  const { data: owaspStatus, isLoading: owaspLoading } = useQuery<OWASPStatus>({
    queryKey: ["/api/v1/owasp/status"],
  });

  const { data: vitals, isLoading: vitalsLoading } = useQuery<NetworkVitals>({
    queryKey: ["/api/v1/network-vitals"],
    refetchInterval: 30000,
  });

  const { data: resilienceData } = useQuery<ResilienceData>({
    queryKey: ["/api/v1/resilience/events"],
    refetchInterval: 30000,
  });

  const { data: networkPool } = useQuery<NetworkPool>({
    queryKey: ["/api/v1/routes/network-pool"],
  });

  const isLoading = tollLoading || owaspLoading || vitalsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--electric-cyan))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--sovereign-blue))] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--electric-cyan))]" data-testid="text-page-title">
              Network & Security
            </h1>
            <p className="text-sm text-muted-foreground">
              Multi-chain resilience, OWASP hardening, and network health monitoring
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setRefreshKey(k => k + 1)}
            data-testid="button-refresh-network"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-overall-health">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${vitals?.overallHealth === "HEALTHY" ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                <Activity className={`w-5 h-5 ${vitals?.overallHealth === "HEALTHY" ? "text-emerald-500" : "text-amber-500"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overall Health</p>
                <p className="text-sm font-bold" data-testid="text-overall-health">{vitals?.overallHealth || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-owasp-count">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[hsl(var(--electric-cyan))]/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">OWASP Guards</p>
                <p className="text-sm font-bold" data-testid="text-owasp-count">{owaspStatus?.mitigationsActive || 0}/10</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-nodes-count">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-purple-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Network Nodes</p>
                <p className="text-sm font-bold" data-testid="text-node-count">{networkPool?.onlineNodes || 0}/{networkPool?.totalNodes || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-circuit-breaker">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center ${owaspStatus?.circuitBreaker?.isTripped ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
                <Lock className={`w-5 h-5 ${owaspStatus?.circuitBreaker?.isTripped ? "text-red-500" : "text-emerald-500"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Circuit Breaker</p>
                <p className="text-sm font-bold" data-testid="text-circuit-breaker">
                  {owaspStatus?.circuitBreaker?.isTripped ? "TRIPPED" : "NORMAL"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-testid="card-toll-roads">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Regulatory Toll Roads</CardTitle>
              </div>
              <CardDescription>3-tier resilience with auto-failover per toll road</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tollRoads?.tollRoads?.map(tr => (
                <div key={tr.id} className="space-y-2 p-3 rounded-md bg-muted/30" data-testid={`toll-road-${tr.tier.toLowerCase()}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[hsl(var(--electric-cyan))]" />
                      <span className="text-sm font-bold">{tr.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{tr.costMultiplier}x cost</Badge>
                      <Badge variant="secondary" className="text-[10px]">{tr.processingMode}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { label: "Primary", chain: tr.resilience.primary, active: tr.resilience.activeLayer === "PRIMARY" },
                      { label: "Secondary", chain: tr.resilience.secondary, active: tr.resilience.activeLayer === "SECONDARY" },
                      { label: "Fallback", chain: tr.resilience.fallback, active: tr.resilience.activeLayer === "FALLBACK" },
                    ].map(layer => (
                      <div
                        key={layer.label}
                        className={`relative p-2 rounded-md text-center ${layer.active ? "bg-[hsl(var(--electric-cyan))]/10 ring-1 ring-[hsl(var(--electric-cyan))]/30" : "bg-muted/30"}`}
                        data-testid={`layer-${tr.tier.toLowerCase()}-${layer.label.toLowerCase()}`}
                      >
                        {layer.active && (
                          <Badge variant="default" className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0">
                            ACTIVE
                          </Badge>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{layer.label}</p>
                        <p className="text-xs font-medium truncate">{layer.chain}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                    <Lock className="w-3 h-3" />
                    <span>{tr.encryptionEngine}</span>
                    <span className="mx-1">|</span>
                    <span>Strategy: {tr.strategy}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card data-testid="card-owasp-status">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">OWASP Smart Contract Top 10 (2026)</CardTitle>
              </div>
              <CardDescription>
                Version: {owaspStatus?.owaspVersion || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {owaspStatus?.mitigations?.map(m => (
                  <div
                    key={m.code}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30"
                    data-testid={`owasp-guard-${m.code.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {m.status === "ACTIVE" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="text-xs font-mono font-bold shrink-0">{m.code}</span>
                      <span className="text-xs truncate">{m.name}</span>
                    </div>
                    <Badge
                      variant={m.status === "ACTIVE" ? "default" : "destructive"}
                      className="text-[10px] shrink-0"
                    >
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Circuit Breaker (SC10)</p>
                <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={owaspStatus?.circuitBreaker?.isTripped ? "DOWN" : "HEALTHY"} />
                    <span className="text-xs">Consecutive Failures</span>
                  </div>
                  <span className="text-xs font-mono">
                    {owaspStatus?.circuitBreaker?.consecutiveFailures || 0} / {owaspStatus?.circuitBreaker?.maxFailures || 5}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-testid="card-chain-health">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Chain Health Monitor</CardTitle>
              </div>
              <CardDescription>Real-time latency and status for all monitored chains</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-80">
                <div className="space-y-1.5">
                  {vitals?.chains?.map(chain => (
                    <div
                      key={`${chain.tollRoad}-${chain.tier}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/30"
                      data-testid={`chain-row-${chain.ticker.toLowerCase()}-${chain.tier.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIndicator status={chain.status} />
                        <span className="text-xs font-medium truncate">{chain.chain.split("(")[0].trim()}</span>
                        <Badge variant="outline" className="text-[9px] shrink-0">{chain.ticker}</Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{chain.latencyMs}ms</span>
                        <Badge variant={chain.tier === "PRIMARY" ? "default" : "secondary"} className="text-[9px]">
                          {chain.tier}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          {TOLL_ROAD_LABELS[chain.tollRoad]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card data-testid="card-network-nodes">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Industry Network Nodes</CardTitle>
              </div>
              <CardDescription>
                {networkPool?.onlineNodes || 0} of {networkPool?.totalNodes || 0} nodes online across {networkPool?.pools?.length || 0} pools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-80">
                <div className="space-y-3">
                  {networkPool?.pools?.map(pool => (
                    <div key={pool.industry} data-testid={`pool-${pool.industry.toLowerCase()}`}>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{pool.industry}</p>
                      <div className="space-y-1">
                        {pool.nodes?.map(node => (
                          <div
                            key={node.ticker}
                            className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted/30"
                            data-testid={`node-${node.ticker.toLowerCase()}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <StatusIndicator status={node.status} />
                              <span className="text-xs truncate">{node.name}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] shrink-0">{node.ticker}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {resilienceData?.events && resilienceData.events.length > 0 && (
          <Card data-testid="card-failover-events">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Failover Event Log</CardTitle>
              </div>
              <CardDescription>Auto-failover events across all toll road tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {resilienceData.events.map(evt => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 p-2 rounded-md bg-muted/30"
                      data-testid={`failover-event-${evt.id}`}
                    >
                      {evt.autoHealed ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[9px]">
                            {TOLL_ROAD_LABELS[evt.tollRoad]}
                          </Badge>
                          <span className="text-xs font-mono">
                            {evt.fromChain} <ArrowRight className="w-3 h-3 inline" /> {evt.toChain}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{evt.reason}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(evt.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
