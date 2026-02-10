import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export class TenantContext {
  private static readonly HEADER_KEY = "x-tenant-id";
  private static readonly VALID_TENANT_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;

  public static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const tenantId = req.headers[TenantContext.HEADER_KEY] as string | undefined;

      if (!tenantId) {
        console.error(`[SecurityException] 403 FORBIDDEN: X-Tenant-ID header is required`);
        return res.status(403).json({
          error: "X-Tenant-ID header is required for clinical endpoints",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      if (!TenantContext.VALID_TENANT_PATTERN.test(tenantId)) {
        console.error(`[SecurityException] 403 FORBIDDEN: Invalid X-Tenant-ID format`);
        return res.status(403).json({
          error: "Invalid X-Tenant-ID format",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      req.tenantId = tenantId;
      next();
    };
  }

  public static extractTenantId(req: Request): string {
    if (!req.tenantId) {
      throw new Error("TENANT_CONTEXT_MISSING: TenantContext middleware not applied");
    }
    return req.tenantId;
  }
}
