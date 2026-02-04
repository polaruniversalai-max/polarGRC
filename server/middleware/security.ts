import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import rateLimit from "express-rate-limit";

export const auditRequestSchema = z.object({
  serialId: z.string().max(100).optional(),
  pharmacyId: z.string().max(100).optional(),
  scenario: z.string().max(5000).optional(),
  jurisdiction: z.enum(["US", "INDIA", "UAE", "EU"]).optional(),
  documentBase64: z.string().max(10_000_000).optional(),
  includeBlockchainVerification: z.boolean().optional(),
  includePrivacyShielding: z.boolean().optional(),
  hipaaFields: z.record(z.string()).optional(),
}).refine(data => data.serialId || data.scenario, {
  message: "Either serialId or scenario is required",
});

export const batchVerifySchema = z.object({
  serial_id: z.string().min(1).max(100),
  pharmacy_id: z.string().max(100).optional(),
  batch_data: z.object({
    ndc_code: z.string().max(50).optional(),
    lot_number: z.string().max(50).optional(),
    temperature_logs: z.array(z.object({
      celsius: z.number().min(-100).max(100),
      location: z.string().max(200).optional(),
      timestamp: z.string().optional(),
    })).optional(),
    chain_of_custody: z.array(z.object({
      entity: z.string().max(200),
      timestamp: z.string().optional(),
    })).optional(),
    expiration_date: z.string().optional(),
    manufacturing_date: z.string().optional(),
    hipaa_fields: z.record(z.string()).optional(),
  }).optional(),
  include_ai_analysis: z.boolean().optional(),
  include_gas_estimate: z.boolean().optional(),
});

export const scenarioAnalysisSchema = z.object({
  scenario: z.string().min(10).max(10000),
  jurisdiction: z.enum(["US", "INDIA", "UAE", "EU"]).optional(),
});

const DANGEROUS_PATTERNS = [
  /\{\{.*\}\}/gi,
  /<script.*?>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /\beval\s*\(/gi,
  /\bexec\s*\(/gi,
  /\bignore\s+previous\s+instructions/gi,
  /\bsystem\s*:/gi,
  /\bassistant\s*:/gi,
];

function sanitizeString(input: string): string {
  let sanitized = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[SANITIZED]");
  }
  return sanitized;
}

function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj !== null && typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

export class SecurityMiddleware {
  public static validateRequest(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const sanitizedBody = sanitizeObject(req.body);
        const validated = schema.parse(sanitizedBody);
        req.body = validated;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          });
        }
        return res.status(400).json({
          error: "Invalid request",
          code: "BAD_REQUEST",
        });
      }
    };
  }

  public static zeroTrustHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
      next();
    };
  }

  public static sanitizeInput() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      next();
    };
  }

  public static auditLog() {
    return (req: Request, res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString();
      const userId = (req as any).user?.id || "anonymous";
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      
      console.log(`[AUDIT] ${timestamp} | ${req.method} ${req.path} | User: ${userId} | IP: ${ip}`);
      
      res.on("finish", () => {
        console.log(`[AUDIT] ${timestamp} | ${req.method} ${req.path} | Status: ${res.statusCode}`);
      });
      
      next();
    };
  }
}

export const auditRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: "Too many audit requests",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export class GlobalErrorHandler {
  public static handle() {
    return (err: any, req: Request, res: Response, next: NextFunction) => {
      console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.path} | ${err.message}`);
      
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      if (err.name === "UnauthorizedError") {
        return res.status(401).json({
          error: "Authentication required",
          code: "UNAUTHORIZED",
          timestamp: new Date().toISOString(),
        });
      }

      if (err.status === 403 || err.name === "ForbiddenError") {
        return res.status(403).json({
          error: "Access denied",
          code: "FORBIDDEN",
          timestamp: new Date().toISOString(),
        });
      }

      if (err.status === 404) {
        return res.status(404).json({
          error: "Resource not found",
          code: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
      });
    };
  }
}

export default SecurityMiddleware;
