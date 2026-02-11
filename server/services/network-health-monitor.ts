import crypto from "crypto";
import type {
  TollRoadTier,
  NetworkTier,
  NetworkHealthStatus,
  NetworkVitals,
  NetworkVitalEntry,
  ResilienceEvent,
  RouteResilienceConfig,
  ResilienceLayer,
} from "../../shared/types/route-orchestrator";

const LATENCY_THRESHOLD_MS = 1000;
const HEALTH_CHECK_INTERVAL_MS = 30_000;
const MAX_RESILIENCE_EVENTS = 100;

interface ChainConfig {
  chain: string;
  chainName: string;
  baseLatencyMs: number;
}

const RESILIENCE_STACKS: Record<TollRoadTier, { primary: ChainConfig; secondary: ChainConfig; fallback: ChainConfig }> = {
  TURBO_TOLL: {
    primary: { chain: "MONAD", chainName: "Monad (Parallel EVM) + Zama (FHE)", baseLatencyMs: 25 },
    secondary: { chain: "MOVEMENT", chainName: "Movement M1 (High-speed Move VM)", baseLatencyMs: 35 },
    fallback: { chain: "SOLANA", chainName: "Solana (Mainnet-Beta)", baseLatencyMs: 50 },
  },
  EXPRESS_LANE: {
    primary: { chain: "MOVEMENT", chainName: "Movement M1", baseLatencyMs: 35 },
    secondary: { chain: "SOLANA", chainName: "Solana", baseLatencyMs: 50 },
    fallback: { chain: "APTOS", chainName: "Aptos", baseLatencyMs: 70 },
  },
  ECO_COMMUTE: {
    primary: { chain: "AKT", chainName: "Akash/io.net + Hyperliquid", baseLatencyMs: 75 },
    secondary: { chain: "POLYGON", chainName: "Polygon PoS", baseLatencyMs: 60 },
    fallback: { chain: "BASE", chainName: "Base (L2)", baseLatencyMs: 45 },
  },
};

export class NetworkHealthMonitor {
  private static instance: NetworkHealthMonitor;
  private chainHealth: Map<string, { status: NetworkHealthStatus; latencyMs: number; lastChecked: string }> = new Map();
  private resilienceEvents: ResilienceEvent[] = [];
  private activeLayer: Map<TollRoadTier, NetworkTier> = new Map();
  private failoverCounts: Map<TollRoadTier, number> = new Map();
  private lastFailoverAt: Map<TollRoadTier, string | null> = new Map();
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.initializeChainHealth();
    this.startHealthMonitor();
    console.log("[NetworkHealthMonitor] Initialized - 3-tier resilience active for all toll roads");
  }

  static getInstance(): NetworkHealthMonitor {
    if (!NetworkHealthMonitor.instance) {
      NetworkHealthMonitor.instance = new NetworkHealthMonitor();
    }
    return NetworkHealthMonitor.instance;
  }

  private initializeChainHealth(): void {
    const allChains = new Set<string>();
    for (const tier of Object.values(RESILIENCE_STACKS)) {
      allChains.add(tier.primary.chain);
      allChains.add(tier.secondary.chain);
      allChains.add(tier.fallback.chain);
    }

    for (const chain of allChains) {
      this.chainHealth.set(chain, {
        status: "HEALTHY",
        latencyMs: this.getBaseLatency(chain),
        lastChecked: new Date().toISOString(),
      });
    }

    const tollRoads: TollRoadTier[] = ["TURBO_TOLL", "EXPRESS_LANE", "ECO_COMMUTE"];
    for (const tr of tollRoads) {
      this.activeLayer.set(tr, "PRIMARY");
      this.failoverCounts.set(tr, 0);
      this.lastFailoverAt.set(tr, null);
    }
  }

  private getBaseLatency(chain: string): number {
    for (const stack of Object.values(RESILIENCE_STACKS)) {
      if (stack.primary.chain === chain) return stack.primary.baseLatencyMs;
      if (stack.secondary.chain === chain) return stack.secondary.baseLatencyMs;
      if (stack.fallback.chain === chain) return stack.fallback.baseLatencyMs;
    }
    return 100;
  }

  private startHealthMonitor(): void {
    this.performHealthCheck();
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  private performHealthCheck(): void {
    for (const [chain, health] of this.chainHealth.entries()) {
      const jitter = (Math.random() - 0.5) * 20;
      const baseLatency = this.getBaseLatency(chain);
      const simulatedLatency = Math.max(5, Math.round(baseLatency + jitter));

      let status: NetworkHealthStatus = "HEALTHY";
      if (simulatedLatency > LATENCY_THRESHOLD_MS) {
        status = "DOWN";
      } else if (simulatedLatency > LATENCY_THRESHOLD_MS * 0.7) {
        status = "DEGRADED";
      }

      const previousStatus = health.status;
      this.chainHealth.set(chain, {
        status,
        latencyMs: simulatedLatency,
        lastChecked: new Date().toISOString(),
      });

      if (previousStatus === "HEALTHY" && status !== "HEALTHY") {
        this.evaluateFailover(chain, status);
      } else if (previousStatus !== "HEALTHY" && status === "HEALTHY") {
        this.evaluateRecovery(chain);
      }
    }
  }

  private evaluateFailover(failedChain: string, status: NetworkHealthStatus): void {
    for (const [tollRoad, stack] of Object.entries(RESILIENCE_STACKS) as [TollRoadTier, typeof RESILIENCE_STACKS[TollRoadTier]][]) {
      const currentLayer = this.activeLayer.get(tollRoad) || "PRIMARY";

      if (currentLayer === "PRIMARY" && stack.primary.chain === failedChain) {
        this.triggerFailover(tollRoad, "PRIMARY", "SECONDARY", stack.primary.chainName, stack.secondary.chainName, `${failedChain} ${status}: latency exceeded ${LATENCY_THRESHOLD_MS}ms threshold`);
      } else if (currentLayer === "SECONDARY" && stack.secondary.chain === failedChain) {
        this.triggerFailover(tollRoad, "SECONDARY", "FALLBACK", stack.secondary.chainName, stack.fallback.chainName, `${failedChain} ${status}: secondary also failed`);
      }
    }
  }

  private evaluateRecovery(recoveredChain: string): void {
    for (const [tollRoad, stack] of Object.entries(RESILIENCE_STACKS) as [TollRoadTier, typeof RESILIENCE_STACKS[TollRoadTier]][]) {
      const currentLayer = this.activeLayer.get(tollRoad) || "PRIMARY";

      if (currentLayer !== "PRIMARY" && stack.primary.chain === recoveredChain) {
        this.triggerFailover(tollRoad, currentLayer, "PRIMARY", this.getActiveChainName(tollRoad), stack.primary.chainName, `${recoveredChain} recovered - returning to primary`);
      }
    }
  }

  private triggerFailover(tollRoad: TollRoadTier, fromTier: NetworkTier, toTier: NetworkTier, fromChain: string, toChain: string, reason: string): void {
    this.activeLayer.set(tollRoad, toTier);
    const count = (this.failoverCounts.get(tollRoad) || 0) + 1;
    this.failoverCounts.set(tollRoad, count);
    this.lastFailoverAt.set(tollRoad, new Date().toISOString());

    const event: ResilienceEvent = {
      id: `RE-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
      timestamp: new Date().toISOString(),
      tollRoad,
      fromTier,
      toTier,
      fromChain,
      toChain,
      reason,
      autoHealed: toTier === "PRIMARY",
    };

    this.resilienceEvents.unshift(event);
    if (this.resilienceEvents.length > MAX_RESILIENCE_EVENTS) {
      this.resilienceEvents.pop();
    }

    console.log(`[NetworkHealthMonitor] FAILOVER: ${tollRoad} ${fromTier} -> ${toTier} | ${fromChain} -> ${toChain} | ${reason}`);
  }

  simulateChainFailure(chain: string): ResilienceEvent | null {
    const health = this.chainHealth.get(chain);
    if (!health) return null;

    this.chainHealth.set(chain, {
      status: "DOWN",
      latencyMs: 9999,
      lastChecked: new Date().toISOString(),
    });

    this.evaluateFailover(chain, "DOWN");

    return this.resilienceEvents[0] || null;
  }

  simulateChainRecovery(chain: string): void {
    const baseLatency = this.getBaseLatency(chain);
    this.chainHealth.set(chain, {
      status: "HEALTHY",
      latencyMs: baseLatency,
      lastChecked: new Date().toISOString(),
    });
    this.evaluateRecovery(chain);
  }

  getActiveLayer(tollRoad: TollRoadTier): NetworkTier {
    return this.activeLayer.get(tollRoad) || "PRIMARY";
  }

  getActiveChainName(tollRoad: TollRoadTier): string {
    const stack = RESILIENCE_STACKS[tollRoad];
    const layer = this.activeLayer.get(tollRoad) || "PRIMARY";
    switch (layer) {
      case "PRIMARY": return stack.primary.chainName;
      case "SECONDARY": return stack.secondary.chainName;
      case "FALLBACK": return stack.fallback.chainName;
    }
  }

  getResilienceConfig(tollRoad: TollRoadTier): RouteResilienceConfig {
    const stack = RESILIENCE_STACKS[tollRoad];
    const now = new Date().toISOString();

    const buildLayer = (tier: NetworkTier, config: ChainConfig): ResilienceLayer => {
      const health = this.chainHealth.get(config.chain);
      return {
        tier,
        chain: config.chain,
        chainName: config.chainName,
        latencyMs: health?.latencyMs || config.baseLatencyMs,
        status: health?.status || "HEALTHY",
        lastChecked: health?.lastChecked || now,
      };
    };

    return {
      primary: buildLayer("PRIMARY", stack.primary),
      secondary: buildLayer("SECONDARY", stack.secondary),
      fallback: buildLayer("FALLBACK", stack.fallback),
      activeLayer: this.activeLayer.get(tollRoad) || "PRIMARY",
      failoverCount: this.failoverCounts.get(tollRoad) || 0,
      lastFailoverAt: this.lastFailoverAt.get(tollRoad) || null,
    };
  }

  getNetworkVitals(): NetworkVitals {
    const chains: NetworkVitalEntry[] = [];

    for (const [tollRoad, stack] of Object.entries(RESILIENCE_STACKS) as [TollRoadTier, typeof RESILIENCE_STACKS[TollRoadTier]][]) {
      const entries: [NetworkTier, ChainConfig][] = [
        ["PRIMARY", stack.primary],
        ["SECONDARY", stack.secondary],
        ["FALLBACK", stack.fallback],
      ];

      for (const [tier, config] of entries) {
        const health = this.chainHealth.get(config.chain);
        chains.push({
          chain: config.chainName,
          ticker: config.chain,
          status: health?.status || "HEALTHY",
          latencyMs: health?.latencyMs || config.baseLatencyMs,
          tier,
          tollRoad,
          role: tier === "PRIMARY" ? "Active Chain" : tier === "SECONDARY" ? "Hot Standby" : "Cold Standby",
          lastChecked: health?.lastChecked || new Date().toISOString(),
        });
      }
    }

    const unhealthyCount = chains.filter(c => c.status !== "HEALTHY").length;
    let overallHealth: NetworkHealthStatus = "HEALTHY";
    if (unhealthyCount > chains.length / 2) overallHealth = "DOWN";
    else if (unhealthyCount > 0) overallHealth = "DEGRADED";

    return {
      chains,
      overallHealth,
      resilienceEvents: this.resilienceEvents.slice(0, 20),
      lastUpdated: new Date().toISOString(),
    };
  }

  getResilienceEvents(limit: number = 20): ResilienceEvent[] {
    return this.resilienceEvents.slice(0, limit);
  }

  getResilienceStacks(): typeof RESILIENCE_STACKS {
    return RESILIENCE_STACKS;
  }

  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }
}
