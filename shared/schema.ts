import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Role constants for multi-tenant access control
export const UserRoleType = {
  ADMIN: "admin",
  AUDITOR: "auditor",
} as const;

export type UserRoleTypeValue = (typeof UserRoleType)[keyof typeof UserRoleType];

export const roleTypeSchema = z.enum(["admin", "auditor"]);

// Credit cost constants for usage tracking
export const CreditCosts = {
  SCAN: 1,
  ZK_SHIELD: 5,
  PDF_EXPORT: 2,
} as const;

// Staking tier thresholds for free monthly scans
export const StakingTiers = [
  { minStake: 10000, freeScans: 100 },
  { minStake: 5000, freeScans: 50 },
  { minStake: 1000, freeScans: 20 },
  { minStake: 100, freeScans: 5 },
] as const;

// Helper function to calculate free scans from staked tokens
export function calculateFreeScansFromStake(stakedTokens: number): number {
  for (const tier of StakingTiers) {
    if (stakedTokens >= tier.minStake) {
      return tier.freeScans;
    }
  }
  return 0;
}

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  corporateId: text("corporate_id"),
  fdaLicenseNumber: text("fda_license_number"),
  dea_number: text("dea_number"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  settings: jsonb("settings").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id"),
  role: text("role").notNull().default("auditor"),
  permissions: jsonb("permissions").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

export const creditBalances = pgTable("credit_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id"),
  balance: integer("balance").notNull().default(100),
  lifetimeEarned: integer("lifetime_earned").default(0),
  lifetimeSpent: integer("lifetime_spent").default(0),
  stakedPolarTokens: real("staked_polar_tokens").default(0),
  freeMonthlyScans: integer("free_monthly_scans").default(0),
  lastRewardAt: timestamp("last_reward_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCreditBalanceSchema = createInsertSchema(creditBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCreditBalance = z.infer<typeof insertCreditBalanceSchema>;
export type CreditBalance = typeof creditBalances.$inferSelect;

export const usageLedger = pgTable("usage_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id"),
  actionType: text("action_type").notNull(),
  description: text("description"),
  creditsUsed: integer("credits_used").notNull().default(0),
  creditsEarned: integer("credits_earned").default(0),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUsageLedgerSchema = createInsertSchema(usageLedger).omit({
  id: true,
  createdAt: true,
});

export type InsertUsageLedger = z.infer<typeof insertUsageLedgerSchema>;
export type UsageLedger = typeof usageLedger.$inferSelect;

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  organizationId: varchar("organization_id"),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("medium"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").default("usd"),
  creditsAdded: integer("credits_added").notNull(),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

export const scans = pgTable("scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serial_id: text("serial_id").notNull(),
  product_name: text("product_name").notNull(),
  pharmacy_id: text("pharmacy_id"),
  userId: varchar("user_id"),
  organizationId: varchar("organization_id"),
  // GS1 DSCSA 2026 Required Fields (Irving Pilot Specs)
  ndc_code: text("ndc_code"),
  lot_number: text("lot_number"),
  expiration_date: text("expiration_date"),
  // ATP (Authorized Trading Partner) verification
  atp_verified: boolean("atp_verified").default(false),
  atp_registry_id: text("atp_registry_id"),
  status: text("status").notNull().default("PENDING"),
  compliance_score: real("compliance_score").default(0),
  movement_verified: boolean("movement_verified").default(false),
  tx_hash: text("tx_hash"),
  ledger_version: integer("ledger_version"),
  temperature_celsius: real("temperature_celsius"),
  violation_count: integer("violation_count").default(0),
  violations: jsonb("violations").$type<Array<{ type: string; severity: string; description: string }>>(),
  chain_of_custody: jsonb("chain_of_custody").$type<Array<{ entity: string; timestamp: string }>>(),
  // Compliance Binder fields
  zk_verification_hash: text("zk_verification_hash"),
  retention_expires_at: timestamp("retention_expires_at"),
  is_demo_data: boolean("is_demo_data").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  report_type: text("report_type").notNull(),
  pharmacy_id: text("pharmacy_id"),
  userId: varchar("user_id"),
  organizationId: varchar("organization_id"),
  total_scans: integer("total_scans").default(0),
  verified_count: integer("verified_count").default(0),
  quarantine_count: integer("quarantine_count").default(0),
  audit_required_count: integer("audit_required_count").default(0),
  compliance_percentage: real("compliance_percentage").default(0),
  summary: jsonb("summary").$type<Record<string, any>>(),
  generated_by: text("generated_by"),
  is_demo_data: boolean("is_demo_data").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  created_at: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipment_id: text("shipment_id").notNull().unique(),
  product_name: text("product_name").notNull(),
  manufacturer: text("manufacturer"),
  origin: text("origin"),
  destination: text("destination"),
  quantity: integer("quantity").default(1),
  status: text("status").notNull().default("IN_TRANSIT"),
  temperature_min: real("temperature_min"),
  temperature_max: real("temperature_max"),
  chain_of_custody: jsonb("chain_of_custody").$type<Array<{ entity: string; timestamp: string; location?: string }>>(),
  compliance_status: text("compliance_status").default("PENDING"),
  blockchain_verified: boolean("blockchain_verified").default(false),
  tx_hash: text("tx_hash"),
  is_demo_data: boolean("is_demo_data").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;

// Platform Treasury for 2.5% fee tracking
export const platformTreasury = pgTable("platform_treasury", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionType: text("transaction_type").notNull(),
  sourceUserId: varchar("source_user_id"),
  grossAmount: real("gross_amount").notNull(),
  feeAmount: real("fee_amount").notNull(),
  feePercentage: real("fee_percentage").default(2.5),
  netAmount: real("net_amount").notNull(),
  status: text("status").default("completed"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlatformTreasurySchema = createInsertSchema(platformTreasury).omit({
  id: true,
  createdAt: true,
});

export type InsertPlatformTreasury = z.infer<typeof insertPlatformTreasurySchema>;
export type PlatformTreasury = typeof platformTreasury.$inferSelect;

// ATP Registry for Authorized Trading Partners
export const atpRegistry = pgTable("atp_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  licenseType: text("license_type").notNull(),
  state: text("state"),
  country: text("country").default("USA"),
  expirationDate: timestamp("expiration_date"),
  isActive: boolean("is_active").default(true),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAtpRegistrySchema = createInsertSchema(atpRegistry).omit({
  id: true,
  createdAt: true,
});

export type InsertAtpRegistry = z.infer<typeof insertAtpRegistrySchema>;
export type AtpRegistry = typeof atpRegistry.$inferSelect;

// Sovereign Ranks XP thresholds
export const SovereignRanks = {
  BRONZE_AUDITOR: { name: "Bronze Auditor", minXP: 0, color: "#CD7F32" },
  SILVER_SENTINEL: { name: "Silver Sentinel", minXP: 500, color: "#C0C0C0" },
  SOVEREIGN_WARDEN: { name: "Sovereign Warden", minXP: 2000, color: "#FFD700" },
} as const;

// XP rewards for actions
export const XPRewards = {
  VERIFIED_SCAN: 10,
  TOKEN_SWAP: 50,
  LRA_UPTIME_DAY: 100,
} as const;

// Helper to calculate rank from XP
export function getRankFromXP(xp: number): { name: string; minXP: number; color: string; nextRank?: typeof SovereignRanks[keyof typeof SovereignRanks] } {
  if (xp >= SovereignRanks.SOVEREIGN_WARDEN.minXP) {
    return { ...SovereignRanks.SOVEREIGN_WARDEN };
  } else if (xp >= SovereignRanks.SILVER_SENTINEL.minXP) {
    return { ...SovereignRanks.SILVER_SENTINEL, nextRank: SovereignRanks.SOVEREIGN_WARDEN };
  }
  return { ...SovereignRanks.BRONZE_AUDITOR, nextRank: SovereignRanks.SILVER_SENTINEL };
}

// User Preferences for Sovereign OS (Audit Notes, Favorites, Gamification)
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  auditNotes: text("audit_notes").default(""),
  favorites: jsonb("favorites").$type<string[]>().default([]),
  tourCompleted: boolean("tour_completed").default(false),
  complianceXP: integer("compliance_xp").default(0),
  lastLRAUptimeCheck: timestamp("last_lra_uptime_check"),
  consecutiveLRADays: integer("consecutive_lra_days").default(0),
  facilityName: text("facility_name"),
  facilityLocation: text("facility_location").default("Irving"),
  settings: jsonb("settings").$type<Record<string, any>>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
