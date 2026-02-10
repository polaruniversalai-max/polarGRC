import { Response } from "express";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { userPreferences } from "@shared/schema";

export function safeErrorResponse(
  res: Response,
  statusCode: number,
  code: string,
  error: unknown,
): void {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  if (statusCode >= 500) {
    console.error(`[ERROR] ${code}: ${message}`);
  }

  const sanitized =
    statusCode >= 500
      ? "Internal server error. Please try again later."
      : message;

  res.status(statusCode).json({
    error: sanitized,
    code,
    timestamp: new Date().toISOString(),
  });
}

export async function awardComplianceXP(
  userId: string,
  xpAmount: number,
): Promise<void> {
  if (!db) return;

  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(userPreferences)
      .set({
        complianceXP: sql`COALESCE(compliance_xp, 0) + ${xpAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      complianceXP: xpAmount,
    });
  }
}
