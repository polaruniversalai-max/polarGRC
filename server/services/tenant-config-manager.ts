import type { TenantConfig } from "../../shared/types/audit";

export class TenantConfigManager {
  private static instance: TenantConfigManager;
  private configs: Map<string, TenantConfig> = new Map();

  private constructor() {
    this.seedDefaults();
    console.log(`[TenantConfigManager] Initialized with ${this.configs.size} tenant configs`);
  }

  public static getInstance(): TenantConfigManager {
    if (!TenantConfigManager.instance) {
      TenantConfigManager.instance = new TenantConfigManager();
    }
    return TenantConfigManager.instance;
  }

  private seedDefaults(): void {
    const defaults: TenantConfig[] = [
      {
        id: "polar-hq",
        name: "PolarUniversal HQ",
        logoUrl: "/branding/polar-logo.svg",
        primaryColor: "#06b6d4",
        secondaryColor: "#10b981",
        auditorRole: "Sovereign Auditor",
      },
      {
        id: "apollo-pharma",
        name: "Apollo Pharmaceuticals",
        logoUrl: "/branding/apollo-logo.svg",
        primaryColor: "#f59e0b",
        secondaryColor: "#ef4444",
        auditorRole: "Clinical Compliance Officer",
      },
      {
        id: "axis-bank",
        name: "Axis Digital Banking",
        logoUrl: "/branding/axis-logo.svg",
        primaryColor: "#8b5cf6",
        secondaryColor: "#6366f1",
        auditorRole: "Financial Risk Auditor",
      },
      {
        id: "medanta-health",
        name: "Medanta Healthcare",
        logoUrl: "/branding/medanta-logo.svg",
        primaryColor: "#22c55e",
        secondaryColor: "#14b8a6",
        auditorRole: "Healthcare Compliance Lead",
      },
    ];

    for (const config of defaults) {
      this.configs.set(config.id, config);
    }
  }

  public getConfig(tenantId: string): TenantConfig | null {
    return this.configs.get(tenantId) || null;
  }

  public getDefaultConfig(): TenantConfig {
    return this.configs.get("polar-hq")!;
  }

  public getAllConfigs(): TenantConfig[] {
    return Array.from(this.configs.values());
  }

  public upsertConfig(config: TenantConfig): void {
    this.configs.set(config.id, config);
  }
}
