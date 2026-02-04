/**
 * Mailgun Email Service for Batch Audit Reports
 * 
 * Sends compliance reports via email using Mailgun API
 */

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "sandbox.mailgun.org";
const MAILGUN_FROM = process.env.MAILGUN_FROM || "PolarUniversal GRC <noreply@polaruniversal.ai>";

interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BatchAuditJob {
  id: string;
  email: string;
  pharmacy_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  report_urls?: {
    json?: string;
    csv?: string;
    pdf?: string;
  };
  error?: string;
}

const batchJobs = new Map<string, BatchAuditJob>();

export function checkMailgunStatus(): {
  available: boolean;
  domain?: string;
  error?: string;
} {
  if (!MAILGUN_API_KEY) {
    return {
      available: false,
      error: "MAILGUN_API_KEY not configured",
    };
  }

  return {
    available: true,
    domain: MAILGUN_DOMAIN,
  };
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string,
  attachments?: EmailAttachment[]
): Promise<EmailResult> {
  if (!MAILGUN_API_KEY) {
    console.log(`[EMAIL SIMULATION] To: ${to}, Subject: ${subject}`);
    return {
      success: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    const formData = new FormData();
    formData.append("from", MAILGUN_FROM);
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", htmlContent);
    if (textContent) {
      formData.append("text", textContent);
    }

    if (attachments) {
      for (const attachment of attachments) {
        const blob = new Blob([attachment.content], { type: attachment.contentType });
        formData.append("attachment", blob, attachment.filename);
      }
    }

    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mailgun API error: ${errorText}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.id,
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message,
    };
  }
}

export async function sendBatchAuditReport(
  email: string,
  pharmacyId: string,
  reportContent: {
    json: string;
    csv: string;
    pdfText: string;
  },
  summary: Record<string, number>
): Promise<EmailResult> {
  const subject = `PolarUniversal Compliance Report - ${pharmacyId} - ${new Date().toISOString().split("T")[0]}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #0A192F; color: #E2E8F0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #112240; border-radius: 8px; padding: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #00F0FF; font-family: 'JetBrains Mono', monospace; }
    .summary { background: #0A192F; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .stat { display: inline-block; margin: 10px 20px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #00F0FF; font-family: 'JetBrains Mono', monospace; }
    .stat-label { font-size: 12px; color: #8892B0; text-transform: uppercase; }
    .verified { color: #10B981; }
    .quarantine { color: #EF4444; }
    .footer { margin-top: 30px; font-size: 12px; color: #8892B0; text-align: center; }
    .cta { display: inline-block; background: #00F0FF; color: #0A192F; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">POLARUNIVERSAL GRC</div>
      <p style="color: #8892B0;">Compliance Report Generated</p>
    </div>
    
    <p>Your batch compliance audit has been completed for pharmacy <strong>${pharmacyId}</strong>.</p>
    
    <div class="summary">
      <h3 style="margin-top: 0; color: #00F0FF;">EXECUTIVE SUMMARY</h3>
      <div style="text-align: center;">
        <div class="stat">
          <div class="stat-value">${summary.total || 0}</div>
          <div class="stat-label">Total Entries</div>
        </div>
        <div class="stat">
          <div class="stat-value verified">${summary.verified || 0}</div>
          <div class="stat-label">Verified</div>
        </div>
        <div class="stat">
          <div class="stat-value quarantine">${summary.quarantine || 0}</div>
          <div class="stat-label">Quarantine</div>
        </div>
      </div>
    </div>
    
    <p>Your compliance reports are attached in three formats:</p>
    <ul>
      <li><strong>JSON</strong> - Machine-readable format for integration</li>
      <li><strong>CSV</strong> - Spreadsheet-compatible format</li>
      <li><strong>PDF</strong> - Human-readable detailed report</li>
    </ul>
    
    <div class="footer">
      <p>PolarUniversal GRC v3.1.0-WHALE</p>
      <p>Global Compliance OS for Regulated Industries</p>
      <p style="font-family: 'JetBrains Mono', monospace; color: #00F0FF;">Movement M1 | Railgun Privacy | Gemini AI</p>
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
PolarUniversal Compliance Report
================================

Pharmacy: ${pharmacyId}
Generated: ${new Date().toISOString()}

SUMMARY
-------
Total Entries: ${summary.total || 0}
Verified: ${summary.verified || 0}
Quarantine: ${summary.quarantine || 0}
Audit Required: ${summary.audit_required || 0}

Your compliance reports are attached in JSON, CSV, and PDF formats.

--
PolarUniversal GRC v3.1.0-WHALE
Global Compliance OS for Regulated Industries
`;

  const attachments: EmailAttachment[] = [
    {
      filename: `compliance_report_${pharmacyId}_${Date.now()}.json`,
      content: reportContent.json,
      contentType: "application/json",
    },
    {
      filename: `compliance_report_${pharmacyId}_${Date.now()}.csv`,
      content: reportContent.csv,
      contentType: "text/csv",
    },
    {
      filename: `compliance_report_${pharmacyId}_${Date.now()}.txt`,
      content: reportContent.pdfText,
      contentType: "text/plain",
    },
  ];

  return sendEmail(email, subject, htmlContent, textContent, attachments);
}

export function createBatchJob(email: string, pharmacyId: string): BatchAuditJob {
  const job: BatchAuditJob = {
    id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    pharmacy_id: pharmacyId,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  batchJobs.set(job.id, job);
  return job;
}

export function getBatchJob(jobId: string): BatchAuditJob | null {
  return batchJobs.get(jobId) || null;
}

export function updateBatchJob(jobId: string, updates: Partial<BatchAuditJob>): BatchAuditJob | null {
  const job = batchJobs.get(jobId);
  if (!job) return null;

  const updated = { ...job, ...updates };
  batchJobs.set(jobId, updated);
  return updated;
}

export const EmailService = {
  checkMailgunStatus,
  sendEmail,
  sendBatchAuditReport,
  createBatchJob,
  getBatchJob,
  updateBatchJob,
};

export default EmailService;
