import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string | null;
}

interface HelpContent {
  title: string;
  category: string;
  content: string;
  relatedLinks?: { label: string; url: string }[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  "lra-score": {
    title: "LRA - Live Risk Assessment",
    category: "Compliance",
    content: `
## Live Risk Assessment (LRA)

**LRA** represents the next evolution in pharmaceutical compliance monitoring, replacing legacy Quarterly Risk Assessments (QRA) and Annual Risk Assessments (ARA) with **24/7 continuous monitoring**.

### Why LRA > ARA/QRA

| Traditional | LRA |
|-------------|-----|
| Quarterly/Annual snapshots | Real-time, continuous |
| Reactive to issues | Proactive prevention |
| Manual audits | AI-automated scanning |
| Delayed compliance gaps | Instant violation alerts |

### Score Ranges

- **90-100%**: Excellent compliance - All systems operational
- **70-89%**: Good compliance - Minor issues detected
- **50-69%**: Fair compliance - Action required
- **Below 50%**: Critical - Immediate remediation needed

### How It's Calculated

The LRA score aggregates data from:
1. **ATP Verification** - Authorized Trading Partner validation rates
2. **Serialization Accuracy** - GS1 barcode scan precision
3. **Temperature Excursions** - Cold chain monitoring incidents
4. **Chain of Custody** - Record completeness (6-year DSCSA requirement)
5. **ZK-Verification** - Privacy-preserving audit success rates

### Best Practices

- Run daily compliance scans for optimal LRA
- Address quarantined items within 24 hours
- Maintain complete chain of custody records
- Monitor the 8-Pillar Architecture status
    `,
  },
  "wallet-balance": {
    title: "Wallet & $POLAR Credits",
    category: "Economics",
    content: `
## $POLAR Credit System

Credits are the utility token for consuming POLAR COMMAND services.

### Credit Costs

| Action | Credits |
|--------|---------|
| Compliance Scan | 1 credit |
| ZK-Shielding | 5 credits |
| PDF Export | 2 credits |

### Earning Credits

- **Purchase**: Buy credits with USD (2.5% platform fee)
- **Staking Rewards**: Stake $POLAR tokens for monthly free scans
- **Referrals**: Earn credits when referred users sign up

### Staking Tiers

| Staked Amount | Free Scans/Month |
|--------------|------------------|
| 10,000+ $POLAR | 100 scans |
| 5,000+ $POLAR | 50 scans |
| 1,000+ $POLAR | 20 scans |
| 100+ $POLAR | 5 scans |
    `,
  },
  "eight-pillars": {
    title: "8-Pillar Sovereign Architecture",
    category: "Infrastructure",
    content: `
## Sovereign Security Architecture

The 8-Pillar Architecture ensures maximum security and compliance across all operations.

### The Pillars

1. **Movement M1** - Primary blockchain verification layer
2. **Railgun Privacy** - ZK-SNARK privacy shielding
3. **Gemini AI** - Compliance analysis engine
4. **EigenLayer** - Economic security layer
5. **Celestia** - Data availability layer
6. **ICP Canister** - Permanent storage for medical records
7. **Humanity Protocol** - Proof of Personhood
8. **Story Protocol** - IP Asset Registry

### Why 8 Pillars?

Each pillar provides redundancy and specialized functionality:
- No single point of failure
- Multi-chain verification
- Privacy-first design
- Regulatory compliance built-in
    `,
  },
  "scan-history": {
    title: "Scan History & Verification",
    category: "Operations",
    content: `
## Pharmaceutical Scan Records

Track all compliance scans with full audit trail.

### Scan Statuses

- **VERIFIED** ✓ - Product passed all compliance checks
- **QUARANTINE** ⚠ - Product held for investigation
- **AUDIT_REQUIRED** - Manual review needed
- **PENDING** - Verification in progress

### GS1 Data Captured

Each scan records:
- NDC (National Drug Code)
- Serial Number
- Lot/Batch Number
- Expiration Date
- ATP Verification Status

### Retention Policy

Per DSCSA 2026 requirements:
- All records retained for **6 years**
- ZK-hashes stored on-chain
- Full audit trail available
    `,
  },
  "privacy-wallet": {
    title: "Railgun Privacy Wallet",
    category: "Privacy",
    content: `
## ZK-Shielded Transactions

Your private viewing key enables confidential compliance operations.

### How It Works

1. **Shielding**: HIPAA data is encrypted with ZK-SNARKs
2. **Verification**: Compliance proven without revealing data
3. **Unshielding**: Authorized parties can decrypt with viewing key

### Security Model

- Private key never leaves your device
- Public key shared with auditors as needed
- Zero-knowledge proofs verify without exposure

### HIPAA Compliance

ZK-shielding satisfies HIPAA requirements by:
- Encrypting PHI at rest
- Proving compliance without data exposure
- Maintaining audit trail with privacy
    `,
  },
  "gas-savings": {
    title: "Sovereign Gas Optimization",
    category: "Economics",
    content: `
## Multi-Chain Gas Savings

POLAR COMMAND routes transactions to minimize gas costs.

### How Savings Work

The system compares:
- Standard Route (Ethereum L1)
- Sovereign Route (Movement M1 / Monad)

### Typical Savings

- **Small transactions**: 60-80% savings
- **Large batches**: 85-95% savings
- **Peak congestion**: Up to 99% savings

### Infrastructure Modes

- **Economy**: Prioritize lowest cost
- **Fortress**: Prioritize security (slightly higher cost)
    `,
  },
  "risk-monitor": {
    title: "Risk Assessment Monitor",
    category: "Compliance",
    content: `
## Real-Time Risk Scoring

Monitor compliance risks across your supply chain.

### Risk Levels

| Level | Score | Action |
|-------|-------|--------|
| LOW | 0-25 | Continue monitoring |
| MEDIUM | 26-50 | Review flagged items |
| HIGH | 51-75 | Immediate investigation |
| CRITICAL | 76-100 | Halt operations |

### Risk Factors

- Temperature excursions
- ATP verification failures
- Chain of custody gaps
- Expired products detected
- Counterfeit indicators
    `,
  },
  "batch-export": {
    title: "Compliance Report Export",
    category: "Reporting",
    content: `
## Export Compliance Data

Generate audit-ready reports for FDA inspection.

### Export Formats

- **PDF**: Human-readable compliance report
- **CSV**: Spreadsheet-compatible data
- **JSON**: Machine-readable format

### Report Contents

- Full scan history
- Compliance scores
- Violation records
- Chain of custody
- ATP verification status

### Email Delivery

Reports can be emailed directly to:
- FDA inspectors
- Corporate compliance officers
- Trading partners
    `,
  },
  "offline-mode": {
    title: "Offline Operations",
    category: "Resilience",
    content: `
## Continue Operations Offline

POLAR COMMAND works even without internet connectivity.

### Offline Capabilities

- Queue scans locally
- View cached compliance data
- Record chain of custody

### Sync Process

When connectivity returns:
1. Pending scans auto-submit
2. Blockchain verification completes
3. Records update with tx hashes

### Data Integrity

- Local encryption of cached data
- Timestamp preservation
- Conflict resolution on sync
    `,
  },
  "remediation": {
    title: "Compliance Remediation Engine",
    category: "Compliance",
    content: `
## Automated Violation Resolution

The remediation engine provides guided resolution for compliance issues.

### Remediation Workflow

1. **Detection**: Violation identified
2. **Classification**: Severity assessed
3. **Guidance**: Step-by-step resolution
4. **Verification**: Re-scan to confirm fix
5. **Documentation**: Audit trail updated

### Common Violations

- Temperature excursion → Quarantine & investigate
- ATP failure → Verify trading partner license
- Serial mismatch → Contact manufacturer
- Expired product → Remove from distribution
    `,
  },
  "dscsa-2026": {
    title: "DSCSA 2026 - FDA Unit-Level Tracking",
    category: "Regulatory",
    content: `
## Drug Supply Chain Security Act (DSCSA) 2026

The **DSCSA 2026** mandate requires **unit-level serialization and tracking** for all prescription drugs in the US pharmaceutical supply chain.

### Key Requirements

| Requirement | Description |
|-------------|-------------|
| **Unit-Level Tracking** | Every individual package must have a unique serial number |
| **Interoperability** | All trading partners must exchange data electronically |
| **Verification** | Products must be verified at each ownership change |
| **ATP Validation** | Only Authorized Trading Partners can handle drugs |

### GS1 Standard Data Elements

- **GTIN**: Global Trade Item Number (NDC)
- **Serial Number**: Unique identifier per unit
- **Lot Number**: Batch/production identifier
- **Expiration Date**: Product shelf life

### Compliance Timeline

- **November 2023**: Initial requirements active
- **November 2024**: Enhanced verification required
- **November 2026**: Full interoperability deadline

### POLAR COMMAND Compliance

POLAR COMMAND provides:
- Automated GS1 barcode scanning
- Real-time ATP verification
- 6-year record retention (blockchain-backed)
- ZK-privacy for sensitive data
    `,
  },
  "movement-m1": {
    title: "Movement M1 - High-Speed Blockchain",
    category: "Infrastructure",
    content: `
## Movement Network M1 Ledger

**Movement M1** is a high-throughput blockchain achieving **100,000+ transactions per second (TPS)**, specifically designed for enterprise compliance applications.

### Performance Metrics

| Metric | Value |
|--------|-------|
| **TPS** | 100,000+ |
| **Finality** | Sub-second |
| **Gas Costs** | 99% lower than Ethereum |
| **Security** | Move VM (formally verified) |

### Why Movement M1?

1. **Speed**: Real-time compliance verification
2. **Cost**: Affordable for high-volume pharma operations
3. **Security**: Move language prevents common vulnerabilities
4. **Compliance**: Built for enterprise audit requirements

### Move Language Benefits

- **Resource-oriented**: Assets cannot be duplicated
- **Formal verification**: Mathematically proven security
- **Type safety**: Compile-time error prevention

### Integration with POLAR COMMAND

- Primary verification layer (Fortress Mode)
- Immutable audit trail storage
- Smart contract compliance logic
- Cross-chain bridging to Ethereum
    `,
  },
  "railgun": {
    title: "Railgun - ZK Privacy Shield",
    category: "Privacy",
    content: `
## Railgun Privacy Technology

**Railgun** uses **Zero-Knowledge SNARKs (ZK-SNARKs)** to enable privacy-preserving compliance audits without exposing sensitive data.

### How ZK-Privacy Works

| Step | Process |
|------|---------|
| 1. **Shield** | HIPAA/sensitive data encrypted |
| 2. **Prove** | Compliance proven mathematically |
| 3. **Verify** | Auditors confirm without seeing data |
| 4. **Unshield** | Authorized access via viewing key |

### Privacy Features

- **Shielded Transactions**: Data encrypted on-chain
- **Viewing Keys**: Selective disclosure to auditors
- **ZK-Proofs**: Prove compliance without data exposure
- **HIPAA Compliant**: Satisfies privacy regulations

### Use Cases in Pharma

1. **Patient Data**: Protect PHI while proving compliance
2. **Pricing Data**: Hide competitive pricing info
3. **Supply Chain**: Verify without revealing partners
4. **Audit Trails**: Immutable but private records

### Security Model

- Private keys never leave your device
- Viewing keys shared only with authorized auditors
- Zero-knowledge proofs verify without exposure
- Quantum-resistant cryptography roadmap
    `,
  },
};

export function HelpDrawer({ isOpen, onClose, widgetId }: HelpDrawerProps) {
  const content = widgetId ? HELP_CONTENT[widgetId] : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-[hsl(var(--card))] border-[hsl(var(--border))]">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[hsl(var(--electric-cyan))]" />
            <SheetTitle>{content?.title || "Help"}</SheetTitle>
          </div>
          {content && (
            <Badge variant="outline" className="w-fit">
              {content.category}
            </Badge>
          )}
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          {content ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold text-[hsl(var(--electric-cyan))] mt-4 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-muted-foreground mb-2">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-sm text-muted-foreground mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-sm text-muted-foreground mb-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-foreground font-semibold">{children}</strong>
                  ),
                  table: ({ children }) => (
                    <table className="w-full text-sm border-collapse my-2">{children}</table>
                  ),
                  th: ({ children }) => (
                    <th className="border border-[hsl(var(--border))] px-2 py-1 text-left bg-[hsl(var(--sovereign-blue))]">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-[hsl(var(--border))] px-2 py-1">{children}</td>
                  ),
                  code: ({ children }) => (
                    <code className="bg-[hsl(var(--sovereign-blue))] px-1 py-0.5 rounded text-[hsl(var(--electric-cyan))]">{children}</code>
                  ),
                }}
              >
                {content.content}
              </ReactMarkdown>
              
              {content.relatedLinks && content.relatedLinks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[hsl(var(--border))]">
                  <h4 className="text-sm font-semibold mb-2">Related Resources</h4>
                  <div className="space-y-2">
                    {content.relatedLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[hsl(var(--electric-cyan))] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a widget's help icon to view documentation</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
