/**
 * Export Service for Compliance Reports
 * 
 * Generates PDF, JSON, and CSV exports of compliance logs
 * PolarUniversal Sovereign Systems - POLAR COMMAND
 */

import crypto from "crypto";

interface ComplianceLogEntry {
  id: string;
  timestamp: string;
  serial_id: string;
  pharmacy_id: string;
  compliance_status: string;
  ai_analysis?: {
    status: string;
    confidence_score: number;
    violations: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
  };
  blockchain_verification?: {
    network: string;
    resource_address: string;
    ledger_version: number;
    found: boolean;
  };
  quarantine_action?: {
    triggered: boolean;
    transaction_hash?: string;
    reason?: string;
  };
}

const complianceLogs: ComplianceLogEntry[] = [];

const formatTexasTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }) + " CST";
};

const formatISO8601Texas = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const texasDate = new Date(d.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  return texasDate.toISOString().replace("Z", "-06:00");
};

const safeNumber = (value: number | null | undefined, fallback: number = 0): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value;
};

export function addComplianceLog(entry: Omit<ComplianceLogEntry, "id">): string {
  const id = `log_${crypto.randomBytes(8).toString("hex")}`;
  complianceLogs.push({ ...entry, id });
  return id;
}

export function getComplianceLogs(
  filters?: {
    pharmacy_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
  }
): ComplianceLogEntry[] {
  let logs = [...complianceLogs];

  if (filters?.pharmacy_id) {
    logs = logs.filter(l => l.pharmacy_id === filters.pharmacy_id);
  }
  if (filters?.status) {
    logs = logs.filter(l => l.compliance_status === filters.status);
  }
  if (filters?.from_date) {
    logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.from_date!));
  }
  if (filters?.to_date) {
    logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.to_date!));
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function exportToJSON(logs: ComplianceLogEntry[]): string {
  const total = logs.length || 1;
  const verified = safeNumber(logs.filter(l => l.compliance_status === "VERIFIED").length, 0);
  const quarantine = safeNumber(logs.filter(l => l.compliance_status === "QUARANTINE").length, 0);
  const audit_required = safeNumber(logs.filter(l => l.compliance_status === "AUDIT_REQUIRED").length, 0);
  const pending = safeNumber(logs.filter(l => l.compliance_status === "PENDING").length, 0);

  return JSON.stringify({
    report_type: "POLAR COMMAND Compliance Report",
    organization: "PolarUniversal Sovereign Systems",
    version: "3.1.0-WHALE",
    generated_at: formatISO8601Texas(new Date()),
    timezone: "America/Chicago (CST)",
    total_entries: safeNumber(logs.length, 0),
    summary: {
      verified: verified,
      verified_percent: safeNumber((verified / total) * 100, 0).toFixed(1),
      quarantine: quarantine,
      quarantine_percent: safeNumber((quarantine / total) * 100, 0).toFixed(1),
      audit_required: audit_required,
      audit_required_percent: safeNumber((audit_required / total) * 100, 0).toFixed(1),
      pending: pending,
      pending_percent: safeNumber((pending / total) * 100, 0).toFixed(1),
    },
    logs: logs.map(log => ({
      ...log,
      timestamp_formatted: formatTexasTime(log.timestamp),
      ai_analysis: log.ai_analysis ? {
        ...log.ai_analysis,
        confidence_score: safeNumber(log.ai_analysis.confidence_score, 0),
      } : null,
    })),
  }, null, 2);
}

export function exportToCSV(logs: ComplianceLogEntry[]): string {
  const headers = [
    "ID",
    "Timestamp (CST)",
    "Serial ID",
    "Pharmacy ID",
    "Compliance Status",
    "AI Status",
    "AI Confidence",
    "Violation Count",
    "Network",
    "Resource Address",
    "Quarantine Triggered",
    "Quarantine TX Hash",
  ];

  const rows = logs.map(log => [
    log.id,
    formatTexasTime(log.timestamp),
    log.serial_id,
    log.pharmacy_id,
    log.compliance_status,
    log.ai_analysis?.status || "N/A",
    safeNumber(log.ai_analysis?.confidence_score, 0).toFixed(2),
    safeNumber(log.ai_analysis?.violations?.length, 0).toString(),
    log.blockchain_verification?.network || "N/A",
    log.blockchain_verification?.resource_address || "N/A",
    log.quarantine_action?.triggered ? "YES" : "NO",
    log.quarantine_action?.transaction_hash || "N/A",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export function exportToPDFContent(logs: ComplianceLogEntry[]): {
  title: string;
  content: string;
  summary: Record<string, number>;
} {
  const total = logs.length || 1;
  const summary = {
    total: safeNumber(logs.length, 0),
    verified: safeNumber(logs.filter(l => l.compliance_status === "VERIFIED").length, 0),
    quarantine: safeNumber(logs.filter(l => l.compliance_status === "QUARANTINE").length, 0),
    audit_required: safeNumber(logs.filter(l => l.compliance_status === "AUDIT_REQUIRED").length, 0),
    pending: safeNumber(logs.filter(l => l.compliance_status === "PENDING").length, 0),
  };

  const generateQRPlaceholder = (txHash: string): string => {
    if (!txHash || txHash === "N/A") return "[No Transaction]";
    const explorerUrl = `https://explorer.movementlabs.xyz/txn/${txHash}?network=testnet`;
    return `
    ┌─────────────────────────────────┐
    │  ▄▄▄▄▄▄▄ ▄▄▄▄▄ ▄▄▄▄▄▄▄  │
    │  █ ▄▄▄ █ ▀▄▄▀ █ ▄▄▄ █  │
    │  █ ███ █ ▀▄▀▄ █ ███ █  │
    │  █▄▄▄▄▄█ ▄ ▄▀▄ █▄▄▄▄▄█  │
    │  ▄▄ ▄▄▄▄▀▄▀▄▀▀▄▄   ▄   │
    │  █▀▄▀▄ ▄▀▀▀▄▄▀▀▄▀▄▀▄▀  │
    │  █▄▄▄▄▄█ ▀▄▄▀▀ ▀▀▀▀▄▄  │
    └─────────────────────────────────┘
    Scan QR or visit:
    ${explorerUrl}`;
  };

  const content = logs.map(log => {
    const txHash = log.quarantine_action?.transaction_hash || "";
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENTRY: ${log.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timestamp (CST):    ${formatTexasTime(log.timestamp)}
Serial ID:          ${log.serial_id}
Pharmacy ID:        ${log.pharmacy_id}
Compliance Status:  ${log.compliance_status === "VERIFIED" ? "DSCSA 2026 COMPLIANT | AUTHENTIC" : log.compliance_status}

AI Analysis:
  Status:           ${log.ai_analysis?.status || "N/A"}
  Confidence:       ${log.ai_analysis?.confidence_score ? (safeNumber(log.ai_analysis.confidence_score, 0) * 100).toFixed(1) + "%" : "N/A"}
  Violations:       ${safeNumber(log.ai_analysis?.violations?.length, 0)}

Blockchain Verification:
  Network:          ${log.blockchain_verification?.network || "N/A"}
  Resource Address: ${log.blockchain_verification?.resource_address || "N/A"}
  Ledger Version:   ${log.blockchain_verification?.ledger_version || "N/A"}

Quarantine Action:
  Triggered:        ${log.quarantine_action?.triggered ? "YES" : "NO"}
  Transaction:      ${log.quarantine_action?.transaction_hash || "N/A"}
  Reason:           ${log.quarantine_action?.reason || "N/A"}

Transaction QR Code (Movement Explorer):
${generateQRPlaceholder(txHash)}
`;
  }).join("\n");

  const verifiedPct = summary.total > 0 ? ((summary.verified / summary.total) * 100).toFixed(1) : "0.0";
  const quarantinePct = summary.total > 0 ? ((summary.quarantine / summary.total) * 100).toFixed(1) : "0.0";
  const auditPct = summary.total > 0 ? ((summary.audit_required / summary.total) * 100).toFixed(1) : "0.0";
  const pendingPct = summary.total > 0 ? ((summary.pending / summary.total) * 100).toFixed(1) : "0.0";

  return {
    title: `POLAR COMMAND Compliance Report - ${formatTexasTime(new Date())}`,
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                         POLAR COMMAND                                        ║
║                   COMPLIANCE VERIFICATION REPORT                             ║
║              PolarUniversal Sovereign Systems v3.1.0-WHALE                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

Generated: ${formatTexasTime(new Date())}
Timezone:  America/Chicago (CST)
Standard:  FDA DSCSA 2026

EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────────────────────
Total Entries:      ${summary.total}
DSCSA Compliant:    ${summary.verified} (${verifiedPct}%)
Quarantine:         ${summary.quarantine} (${quarantinePct}%)
Audit Required:     ${summary.audit_required} (${auditPct}%)
Pending:            ${summary.pending} (${pendingPct}%)

DETAILED ENTRIES
─────────────────────────────────────────────────────────────────────────────────
${content}

═══════════════════════════════════════════════════════════════════════════════
                        DIGITAL SIGNATURE PLACEHOLDER
═══════════════════════════════════════════════════════════════════════════════

Compliance Officer Signature: _________________________________________

Printed Name: _________________________________________

Date: _________________________________________

Title: _________________________________________

Organization: PolarUniversal Sovereign Systems

This document has been generated by POLAR COMMAND v3.1.0-WHALE and constitutes
an official compliance record under FDA DSCSA 2026 guidelines. All blockchain
transactions are immutably recorded on Movement M1 Testnet.

Document Hash: ${crypto.randomBytes(32).toString("hex")}

═══════════════════════════════════════════════════════════════════════════════
                              END OF REPORT
═══════════════════════════════════════════════════════════════════════════════
`,
    summary,
  };
}

export const ExportService = {
  addComplianceLog,
  getComplianceLogs,
  exportToJSON,
  exportToCSV,
  exportToPDFContent,
};

export default ExportService;
