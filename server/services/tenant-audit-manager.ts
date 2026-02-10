import type { AuditRecord } from "../../shared/types/audit";

export class TenantAuditManager {
  private static instance: TenantAuditManager;
  private tenantAudits: Map<string, AuditRecord[]> = new Map();
  private readonly maxPerTenant: number;

  private constructor(maxPerTenant = 50) {
    this.maxPerTenant = maxPerTenant;
    console.log(`[TenantAuditManager] Initialized with max ${maxPerTenant} records per tenant`);
  }

  public static getInstance(): TenantAuditManager {
    if (!TenantAuditManager.instance) {
      TenantAuditManager.instance = new TenantAuditManager();
    }
    return TenantAuditManager.instance;
  }

  public addAudit(tenantId: string, record: AuditRecord): void {
    if (record.tenantId !== tenantId) {
      throw new Error("RLS_VIOLATION: Audit record tenantId does not match request tenantId");
    }

    if (!this.tenantAudits.has(tenantId)) {
      this.tenantAudits.set(tenantId, []);
    }

    const audits = this.tenantAudits.get(tenantId)!;
    audits.unshift(record);

    if (audits.length > this.maxPerTenant) {
      audits.pop();
    }
  }

  public getAudits(tenantId: string, limit = 5): { audits: AuditRecord[]; total: number } {
    const audits = this.tenantAudits.get(tenantId) || [];
    const cappedLimit = Math.min(limit, this.maxPerTenant);
    return {
      audits: audits.slice(0, cappedLimit),
      total: audits.length,
    };
  }

  public getTenantCount(): number {
    return this.tenantAudits.size;
  }

  public getTotalAudits(): number {
    let total = 0;
    for (const audits of this.tenantAudits.values()) {
      total += audits.length;
    }
    return total;
  }
}
