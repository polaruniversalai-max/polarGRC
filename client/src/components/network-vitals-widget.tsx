import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Activity, AlertTriangle, CheckCircle2, Radio, RefreshCw, Loader2, Zap, Shield, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

interface ResilienceEvent {
  id: string;
  timestamp: string;
  tollRoad: string;
  fromTier: string;
  toTier: string;
  fromChain: string;
  toChain: string;
  reason: string;
  autoHealed: boolean;
}

interface NetworkVitals {
  chains: NetworkVitalEntry[];
  overallHealth: "HEALTHY" | "DEGRADED" | "DOWN";
  resilienceEvents: ResilienceEvent[];
  lastUpdated: string;
}

const TOLL_ROAD_LABELS: Record<string, string> = {
  TURBO_TOLL: "Turbo Toll",
  EXPRESS_LANE: "Express Lane",
  ECO_COMMUTE: "Eco-Commute",
};

const TIER_LABELS: Record<string, string> = {
  PRIMARY: "Primary",
  SECONDARY: "Secondary",
  FALLBACK: "Fallback",
};

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    HEALTHY: "bg-emerald-500",
    DEGRADED: "bg-amber-500",
    DOWN: "bg-red-500",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colorMap[status] || "bg-muted-foreground"}`}
      data-testid={`status-dot-${status.toLowerCase()}`}
    />
  );
}

function TierBadge({ tier }: { tier: string }) {
  const variantMap: Record<string, "default" | "secondary" | "outline"> = {
    PRIMARY: "default",
    SECONDARY: "secondary",
    FALLBACK: "outline",
  };
  return (
    <Badge variant={variantMap[tier] || "outline"} data-testid={`badge-tier-${tier.toLowerCase()}`}>
      {TIER_LABELS[tier] || tier}
    </Badge>
  );
}

export function NetworkVitalsWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: vitals, isLoading, refetch } = useQuery<NetworkVitals>({
    queryKey: ["/api/v1/network-vitals"],
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading network vitals...</span>
        </CardContent>
      </Card>
    );
  }

  if (!vitals) return null;

  const primaryChains = vitals.chains.filter(c => c.tier === "PRIMARY");
  const grouped = new Map<string, NetworkVitalEntry[]>();
  for (const chain of vitals.chains) {
    const key = chain.tollRoad;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(chain);
  }

  return (
    <Card data-testid="card-network-vitals">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Network Vitals</CardTitle>
          <Badge
            variant={vitals.overallHealth === "HEALTHY" ? "default" : "destructive"}
            data-testid="badge-overall-health"
          >
            {vitals.overallHealth}
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleRefresh}
          data-testid="button-refresh-vitals"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {primaryChains.map(chain => (
            <div
              key={`${chain.tollRoad}-${chain.ticker}`}
              className="flex items-center justify-between gap-2 flex-wrap"
              data-testid={`vitals-row-${chain.ticker.toLowerCase()}`}
            >
              <div className="flex items-center gap-2">
                <StatusDot status={chain.status} />
                <span className="text-sm font-medium">{chain.chain.split("(")[0].trim()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{chain.latencyMs}ms</span>
                <Badge variant="outline" className="text-xs">
                  {TOLL_ROAD_LABELS[chain.tollRoad] || chain.tollRoad}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resilience Tiers</span>
          </div>
          {Array.from(grouped.entries()).map(([tollRoad, chains]) => (
            <div key={tollRoad} className="space-y-1.5" data-testid={`resilience-group-${tollRoad.toLowerCase()}`}>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">{TOLL_ROAD_LABELS[tollRoad]}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {chains.sort((a, b) => {
                  const order = { PRIMARY: 0, SECONDARY: 1, FALLBACK: 2 };
                  return (order[a.tier] ?? 3) - (order[b.tier] ?? 3);
                }).map(c => (
                  <div
                    key={`${c.tollRoad}-${c.tier}`}
                    className="flex flex-col items-center gap-0.5 p-1.5 rounded-md bg-muted/50"
                    data-testid={`tier-cell-${c.tollRoad.toLowerCase()}-${c.tier.toLowerCase()}`}
                  >
                    <StatusDot status={c.status} />
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{c.ticker}</span>
                    <span className="text-[9px] text-muted-foreground/70">{TIER_LABELS[c.tier]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {vitals.resilienceEvents.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Failover Events</span>
              </div>
              <ScrollArea className="max-h-32">
                <div className="space-y-1.5">
                  {vitals.resilienceEvents.slice(0, 5).map(evt => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-2 text-xs"
                      data-testid={`event-row-${evt.id}`}
                    >
                      {evt.autoHealed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium">
                          {TOLL_ROAD_LABELS[evt.tollRoad]}: {evt.fromTier} {"->"} {evt.toTier}
                        </span>
                        <p className="text-muted-foreground truncate">{evt.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <div className="text-[10px] text-muted-foreground/60 text-right">
          Last updated: {new Date(vitals.lastUpdated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
