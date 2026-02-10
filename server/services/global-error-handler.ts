import type { Response } from "express";

export class GlobalErrorHandler {
  public static forbidden(res: Response, message: string): Response {
    console.error(`[SecurityException] 403 FORBIDDEN: ${message}`);
    return res.status(403).json({
      error: message,
      code: "FORBIDDEN",
      timestamp: new Date().toISOString(),
    });
  }

  public static unauthorized(res: Response, message: string): Response {
    console.error(`[SecurityException] 401 UNAUTHORIZED: ${message}`);
    return res.status(401).json({
      error: message,
      code: "UNAUTHORIZED",
      timestamp: new Date().toISOString(),
    });
  }

  public static badRequest(res: Response, message: string): Response {
    return res.status(400).json({
      error: message,
      code: "BAD_REQUEST",
      timestamp: new Date().toISOString(),
    });
  }

  public static internal(res: Response, message: string, code = "INTERNAL_ERROR"): Response {
    console.error(`[GlobalErrorHandler] 500: ${message}`);
    return res.status(500).json({
      error: message,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}
