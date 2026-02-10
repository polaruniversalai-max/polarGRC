/**
 * Demo Data Seed Service
 * 
 * Seeds the database with high-fidelity demo data for pilot demonstrations
 * PolarUniversal Sovereign Systems - POLAR COMMAND v3.1.0-WHALE
 * 
 * Uses professional fictional pharmaceutical names for legal safety:
 * - Phronesis Pharmaceuticals (Insulin)
 * - NovaVanguard Biologics (Vaccines)
 * - M-Core Therapeutics (Biologics)
 */

import crypto from "crypto";
import { db } from "../db";
import { scans, reports, shipments } from "@shared/schema";

interface DemoScanRecord {
  serial_id: string;
  product_name: string;
  pharmacy_id: string;
  status: string;
  compliance_score: number;
  movement_verified: boolean;
  tx_hash: string | null;
  ledger_version: number | null;
  temperature_celsius: number | null;
  violation_count: number;
  violations: Array<{ type: string; severity: string; description: string }> | null;
  chain_of_custody: Array<{ entity: string; timestamp: string }> | null;
  is_demo_data: boolean;
}

interface DemoShipmentRecord {
  shipment_id: string;
  product_name: string;
  manufacturer: string;
  origin: string;
  destination: string;
  quantity: number;
  status: string;
  temperature_min: number | null;
  temperature_max: number | null;
  chain_of_custody: Array<{ entity: string; timestamp: string; location?: string }> | null;
  compliance_status: string;
  blockchain_verified: boolean;
  tx_hash: string | null;
  is_demo_data: boolean;
}

const generateTxHash = (): string => {
  return `0x${crypto.randomBytes(32).toString("hex")}`;
};

const generateLedgerVersion = (): number => {
  return Math.floor(64000000 + Math.random() * 100000);
};

const generateChainOfCustody = (entities: string[]): Array<{ entity: string; timestamp: string }> => {
  const baseTime = new Date();
  return entities.map((entity, index) => ({
    entity,
    timestamp: new Date(baseTime.getTime() - (entities.length - index) * 86400000).toISOString(),
  }));
};

const generateShipmentCustody = (entities: string[], locations: string[]): Array<{ entity: string; timestamp: string; location?: string }> => {
  const baseTime = new Date();
  return entities.map((entity, index) => ({
    entity,
    timestamp: new Date(baseTime.getTime() - (entities.length - index) * 86400000).toISOString(),
    location: locations[index] || "Unknown",
  }));
};

export async function seedScenarioA(): Promise<number> {
  const records: DemoScanRecord[] = [];
  
  for (let i = 1; i <= 500; i++) {
    const serialNum = String(i).padStart(6, "0");
    records.push({
      serial_id: `PHR-INS-2026-${serialNum}`,
      product_name: "Phronesis-Insulin 100U/mL",
      pharmacy_id: `pharma_${crypto.randomBytes(4).toString("hex")}`,
      status: "VERIFIED",
      compliance_score: 100.0,
      movement_verified: true,
      tx_hash: generateTxHash(),
      ledger_version: generateLedgerVersion(),
      temperature_celsius: 2.0 + Math.random() * 4,
      violation_count: 0,
      violations: null,
      chain_of_custody: generateChainOfCustody([
        "Phronesis Manufacturing (Indianapolis, IN)",
        "ColdChain Logistics Hub",
        "Regional Distribution Center",
        "Pharmacy Receiving",
      ]),
      is_demo_data: true,
    });
  }

  if (db) {
    await db.insert(scans).values(records);
  }

  return records.length;
}

export async function seedScenarioB(): Promise<number> {
  const records: DemoScanRecord[] = [];
  const duplicateSerial = "NVG-VAX-2026-DUP001";
  
  for (let i = 1; i <= 5; i++) {
    records.push({
      serial_id: duplicateSerial,
      product_name: "NovaVanguard-Vaccine 0.5mL",
      pharmacy_id: `pharma_counterfeit_${i}`,
      status: "QUARANTINE",
      compliance_score: 0.0,
      movement_verified: false,
      tx_hash: generateTxHash(),
      ledger_version: generateLedgerVersion(),
      temperature_celsius: 5.0 + Math.random() * 2,
      violation_count: 3,
      violations: [
        {
          type: "DUPLICATE_SERIAL",
          severity: "CRITICAL",
          description: "Duplicate serial ID detected - potential counterfeit",
        },
        {
          type: "CHAIN_BREAK",
          severity: "HIGH",
          description: "Chain of custody verification failed",
        },
        {
          type: "AUTHENTICATION_FAILED",
          severity: "CRITICAL",
          description: "Movement M1 authentication returned INVALID",
        },
      ],
      chain_of_custody: generateChainOfCustody([
        "Unknown Manufacturer",
        "Unverified Distributor",
      ]),
      is_demo_data: true,
    });
  }

  if (db) {
    await db.insert(scans).values(records);
  }

  return records.length;
}

export async function seedScenarioC(): Promise<number> {
  const records: DemoScanRecord[] = [];
  
  const batches = [
    { batchNum: "001", tempDeviation: 12.5, status: "QUARANTINE" },
    { batchNum: "002", tempDeviation: -5.2, status: "QUARANTINE" },
  ];

  for (const batch of batches) {
    records.push({
      serial_id: `MCB-BIO-2026-${batch.batchNum}`,
      product_name: "M-Core Biologics Therapeutic",
      pharmacy_id: `pharma_mcore_${batch.batchNum}`,
      status: batch.status,
      compliance_score: 25.0,
      movement_verified: true,
      tx_hash: generateTxHash(),
      ledger_version: generateLedgerVersion(),
      temperature_celsius: batch.tempDeviation,
      violation_count: 2,
      violations: [
        {
          type: "TEMPERATURE_DEVIATION",
          severity: "CRITICAL",
          description: `Temperature excursion detected: ${batch.tempDeviation}°C (required: 2-8°C)`,
        },
        {
          type: "AI_ALERT",
          severity: "HIGH",
          description: "Gemini AI flagged potential product degradation",
        },
      ],
      chain_of_custody: generateChainOfCustody([
        "M-Core Therapeutics (Boston, MA)",
        "BioPharma Cold Storage",
        "Temperature Incident Zone",
        "Quarantine Holding",
      ]),
      is_demo_data: true,
    });
  }

  if (db) {
    await db.insert(scans).values(records);
  }

  return records.length;
}

export async function seedDemoShipments(): Promise<number> {
  const shipmentRecords: DemoShipmentRecord[] = [
    {
      shipment_id: "SHIP-PHR-2026-001",
      product_name: "Phronesis-Insulin 100U/mL (Bulk)",
      manufacturer: "Phronesis Pharmaceuticals",
      origin: "Indianapolis, IN",
      destination: "Houston, TX",
      quantity: 500,
      status: "DELIVERED",
      temperature_min: 2.1,
      temperature_max: 5.8,
      chain_of_custody: generateShipmentCustody(
        ["Phronesis Manufacturing", "ColdChain Logistics", "Regional Hub", "Houston Pharmacy Network"],
        ["Indianapolis, IN", "Memphis, TN", "Dallas, TX", "Houston, TX"]
      ),
      compliance_status: "VERIFIED",
      blockchain_verified: true,
      tx_hash: generateTxHash(),
      is_demo_data: true,
    },
    {
      shipment_id: "SHIP-NVG-2026-002",
      product_name: "NovaVanguard-Vaccine 0.5mL",
      manufacturer: "NovaVanguard Biologics",
      origin: "Unknown",
      destination: "Multiple",
      quantity: 5,
      status: "SEIZED",
      temperature_min: null,
      temperature_max: null,
      chain_of_custody: generateShipmentCustody(
        ["Unknown Origin", "Unverified Handler"],
        ["Unknown", "Unknown"]
      ),
      compliance_status: "COUNTERFEIT",
      blockchain_verified: false,
      tx_hash: null,
      is_demo_data: true,
    },
    {
      shipment_id: "SHIP-MCB-2026-003",
      product_name: "M-Core Biologics Therapeutic",
      manufacturer: "M-Core Therapeutics",
      origin: "Boston, MA",
      destination: "Phoenix, AZ",
      quantity: 2,
      status: "QUARANTINE",
      temperature_min: -5.2,
      temperature_max: 12.5,
      chain_of_custody: generateShipmentCustody(
        ["M-Core Therapeutics", "BioPharma Cold Storage", "Quarantine Facility"],
        ["Boston, MA", "Chicago, IL", "Phoenix, AZ"]
      ),
      compliance_status: "QUARANTINE",
      blockchain_verified: true,
      tx_hash: generateTxHash(),
      is_demo_data: true,
    },
  ];

  if (db) {
    await db.insert(shipments).values(shipmentRecords);
  }

  return shipmentRecords.length;
}

export async function seedDemoReports(): Promise<number> {
  const reportRecords = [
    {
      report_type: "COMPLIANCE_SUMMARY",
      pharmacy_id: "demo_network",
      total_scans: 507,
      verified_count: 500,
      quarantine_count: 7,
      audit_required_count: 0,
      compliance_percentage: 98.62,
      summary: {
        scenario_a: { product: "Phronesis-Insulin", count: 500, status: "VERIFIED" },
        scenario_b: { product: "NovaVanguard-Vaccine", count: 5, status: "COUNTERFEIT" },
        scenario_c: { product: "M-Core Biologics", count: 2, status: "QUARANTINE" },
      },
      generated_by: "POLAR COMMAND Demo Seed",
      is_demo_data: true,
    },
  ];

  if (db) {
    await db.insert(reports).values(reportRecords);
  }

  return reportRecords.length;
}

export async function seedAllDemoData(): Promise<{
  scans: number;
  shipments: number;
  reports: number;
  total: number;
}> {
  const scanCountA = await seedScenarioA();
  const scanCountB = await seedScenarioB();
  const scanCountC = await seedScenarioC();
  const shipmentCount = await seedDemoShipments();
  const reportCount = await seedDemoReports();

  const totalScans = scanCountA + scanCountB + scanCountC;

  return {
    scans: totalScans,
    shipments: shipmentCount,
    reports: reportCount,
    total: totalScans + shipmentCount + reportCount,
  };
}

export async function clearDemoData(): Promise<{
  scans_deleted: number;
  shipments_deleted: number;
  reports_deleted: number;
}> {
  let scansDeleted = 0;
  let shipmentsDeleted = 0;
  let reportsDeleted = 0;

  if (db) {
    const { eq } = await import("drizzle-orm");
    
    const deletedScans = await db.delete(scans).where(eq(scans.is_demo_data, true)).returning();
    scansDeleted = deletedScans.length;
    
    const deletedShipments = await db.delete(shipments).where(eq(shipments.is_demo_data, true)).returning();
    shipmentsDeleted = deletedShipments.length;
    
    const deletedReports = await db.delete(reports).where(eq(reports.is_demo_data, true)).returning();
    reportsDeleted = deletedReports.length;
  }

  return {
    scans_deleted: scansDeleted,
    shipments_deleted: shipmentsDeleted,
    reports_deleted: reportsDeleted,
  };
}

export async function getDemoDataStats(): Promise<{
  scans: number;
  shipments: number;
  reports: number;
  scenarios: {
    a: { product: string; count: number };
    b: { product: string; count: number };
    c: { product: string; count: number };
  };
}> {
  let scanCount = 0;
  let shipmentCount = 0;
  let reportCount = 0;
  let scenarioA = 0;
  let scenarioB = 0;
  let scenarioC = 0;

  if (db) {
    const { eq, and, like } = await import("drizzle-orm");
    
    const demoScans = await db.select().from(scans).where(eq(scans.is_demo_data, true));
    scanCount = demoScans.length;
    
    scenarioA = demoScans.filter((s: { product_name: string }) => s.product_name.includes("Phronesis")).length;
    scenarioB = demoScans.filter((s: { product_name: string }) => s.product_name.includes("NovaVanguard")).length;
    scenarioC = demoScans.filter((s: { product_name: string }) => s.product_name.includes("M-Core")).length;
    
    const demoShipments = await db.select().from(shipments).where(eq(shipments.is_demo_data, true));
    shipmentCount = demoShipments.length;
    
    const demoReports = await db.select().from(reports).where(eq(reports.is_demo_data, true));
    reportCount = demoReports.length;
  }

  return {
    scans: scanCount,
    shipments: shipmentCount,
    reports: reportCount,
    scenarios: {
      a: { product: "Phronesis-Insulin", count: scenarioA },
      b: { product: "NovaVanguard-Vaccine", count: scenarioB },
      c: { product: "M-Core Biologics", count: scenarioC },
    },
  };
}

export const DemoSeedService = {
  seedScenarioA,
  seedScenarioB,
  seedScenarioC,
  seedDemoShipments,
  seedDemoReports,
  seedAllDemoData,
  clearDemoData,
  getDemoDataStats,
};

export default DemoSeedService;
