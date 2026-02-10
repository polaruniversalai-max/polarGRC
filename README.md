# Sentinel OS v1.2

## The Regulatory Swiss Army Knife | Global Compliance Operating System

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Sentinel OS](https://img.shields.io/badge/Sentinel%20OS-v1.2.0-emerald)](https://github.com/polar-universal/sentinel-os)
[![OWASP SC 2026](https://img.shields.io/badge/OWASP%20SC%20Top%2010-2026%20Hardened-critical)](https://owasp.org)
[![DeveloperWeek 2026](https://img.shields.io/badge/DeveloperWeek-2026-purple)](https://developerweek.com)
[![Built with Replit Agent](https://img.shields.io/badge/Built%20with-Replit%20Agent-orange)](https://replit.com)

---

## Vision

**Sentinel OS** is not a wrapper around existing compliance tools. It is an institutional-grade **Agentic GRC (Governance, Risk, and Compliance) Operating System** that transforms enterprise compliance from reactive auditing into real-time, blockchain-verified, multi-chain assurance across 14 network nodes and 5 regulated sectors.

By integrating purpose-built industry protocols like **Akiri** (Healthcare Data Liquidity), **PokitDok/DokChain** (Medical Payments), and **Quant QNT** (Banking Interoperability) directly into the compliance pipeline, Sentinel OS delivers what generic audit platforms cannot: **sector-native regulatory intelligence** that understands the language, data flows, and legal requirements of each industry it serves.

We believe compliance should be:
- **Invisible** -- Automated and embedded, not manual and burdensome
- **Immutable** -- Blockchain-anchored for absolute audit certainty
- **Intelligent** -- AI-powered risk detection with zero false positives
- **Instant** -- Sub-200ms failover for true zero-downtime compliance
- **Interoperable** -- Multi-chain, multi-sector, multi-jurisdiction by design

> *"Compliance is not a cost center. It is a competitive advantage."*

---

## Triple-Zero Architecture

```
+-----------------------------------------------------------------------+
|                         SENTINEL OS v1.2                              |
|                  Global Compliance Operating System                   |
|                       Triple-Zero Standard                            |
+-----------------------------------------------------------------------+
|                                                                       |
|   ZERO-DOWNTIME         ZERO-KNOWLEDGE          ZERO-TRUST           |
|                                                                       |
|   < 200ms Failover      Vault PII Engine         RBAC + Tenant       |
|   Primary/Secondary     15+ PII Types            Verification        |
|   Chain Switching        ZK-Hash Storage          Session Isolation   |
|   Health Monitoring      HIPAA/DPDP/GDPR         Audit Logging       |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## Route Orchestrator: 3 Strategies, 14 Nodes

Sentinel OS routes every compliance request through the **Route Orchestrator**, which selects the optimal execution path based on institutional tier, risk profile, and regulatory jurisdiction.

### Routing Strategies

| Strategy | Target Users | Characteristics |
|----------|-------------|-----------------|
| **INSTITUTIONAL** | Hedge Funds, Banks, Sovereign Entities | Maximum security, multi-chain settlement, full ZK identity, priority SLA |
| **PRO_AUDIT** | Compliance Officers, Auditors, Legal Teams | Balanced throughput and verification depth, real-time trace IDs |
| **ECONOMY** | Startups, Research Labs, SMBs | Cost-optimized, single-chain settlement, essential compliance coverage |

### 14 Network Nodes Across 4 Sectors

Every audit is routed through sector-specific blockchain nodes chosen for their regulatory fit:

#### Pharma Sector (Healthcare Data + Drug Supply Chain)

| Node | Protocol | Role | Privacy |
|------|----------|------|---------|
| **AKIRI** | Akiri (Medical Data Liquidity) | EHR Data Verification -- validates electronic health records against compliance rules before they enter the audit pipeline | Yes |
| **DOKC** | DokChain (Healthcare Claims) | Claims Processing -- anchors medical payment claims on-chain for HIPAA-compliant audit trails (built on PokitDok infrastructure) | No |
| **MEDTK** | Medicalchain (Patient EHR) | Patient Record Storage -- provides tamper-proof patient record hashing with privacy-preserving access controls | Yes |

> **Why these chains?** Generic blockchains cannot interpret HL7 FHIR payloads or enforce HIPAA BAA requirements at the protocol level. Akiri was purpose-built for healthcare data liquidity, ensuring EHR data never leaves compliant corridors. DokChain (PokitDok) understands medical claims schemas natively, eliminating the translation layer that causes audit gaps.

#### Banking Sector (Financial Settlement + Interoperability)

| Node | Protocol | Role | Privacy |
|------|----------|------|---------|
| **QNT** | Quant (Overledger) | Cross-Ledger Banking -- enables interoperability between SWIFT, central bank ledgers, and DLT networks through Overledger mDApps | Yes |
| **ONDO** | Ondo Finance (RWA Settlement) | Real-World Asset Tokenization -- settles tokenized treasury bills, bonds, and institutional money market funds on-chain | No |
| **XRP** | Ripple (RLUSD) | Cross-Border Institutional Settlement -- provides sub-4-second settlement for institutional cross-border compliance payments | No |

> **Why these chains?** Banking compliance requires interoperability with legacy systems (SWIFT MT103, ISO 20022) that no single blockchain supports alone. Quant's Overledger acts as the connective tissue between traditional banking rails and DLT settlement layers. ONDO brings institutional RWA compliance (SEC-regulated), and Ripple provides the settlement speed that FATF travel rule enforcement demands.

#### Security Sector (Privacy + Encryption)

| Node | Protocol | Role | Privacy |
|------|----------|------|---------|
| **ZBT** | Zama (FHE Privacy) | Fully Homomorphic Encryption -- enables computation on encrypted audit data without ever decrypting it | Yes |
| **RAIL** | Railgun (Shielded TX) | Shielded Transactions -- provides zero-knowledge shielded transfers for sensitive compliance payments | Yes |
| **ZKSYNC** | ZKSync (L2 Privacy) | ZK Rollup Layer-2 -- delivers high-throughput ZK proof verification for batch audit anchoring | Yes |

#### Compute Sector (Infrastructure + Performance)

| Node | Protocol | Role | Privacy |
|------|----------|------|---------|
| **AKT** | Akash Network | Distributed Cloud Compute -- decentralized infrastructure for running compliance workloads | No |
| **RNDR** | Render Network | GPU Rendering -- powers AI model inference for document analysis and risk scoring | No |
| **IO** | io.net | Distributed GPU Cluster -- provides scalable GPU compute for batch compliance processing | No |
| **MONAD** | Monad (Parallel EVM) | Parallel Execution Engine -- 10,000+ TPS for high-volume audit anchoring | No |
| **HYPE** | Hyperliquid | High-Speed Finality -- sub-second finality for time-critical compliance attestations | No |

---

## Industry Chain Architecture

Sentinel OS is built around three **Industry Chains** -- purpose-built compliance pipelines that combine the right protocols, standards, and data formats for each regulated sector.

### Pharma Industry Chain

```
Drug Manufacturer --> Akiri (EHR Verify) --> DokChain (Claims Anchor)
        |                                           |
        v                                           v
  Movement M1 (Primary)                   Medicalchain (Patient EHR)
        |                                           |
        v                                           v
  Celestia DA (Failover)              Compliance Record (DSCSA 2026)
```

**Standards enforced:** DSCSA 2026, FDA 21 CFR Part 11, HIPAA BAA, ICH E6(R3) GCP
**Data formats:** HL7 FHIR R4, NDC codes, DSCSA Transaction Statements
**Regulatory bodies:** FDA, CDSCO, EMA, MHRA

### Banking Industry Chain

```
Transaction Event --> Quant QNT (Cross-Ledger) --> Ondo (RWA Settlement)
        |                                                |
        v                                                v
  Ripple RLUSD (Settlement)                    Compliance Record (AML)
        |                                                |
        v                                                v
  Stacks/Bitcoin (Anchor)                  FATF Travel Rule Attestation
```

**Standards enforced:** FATF AML/CFT, RBI Sandbox, MiCA, Basel III/IV, PSD2
**Data formats:** ISO 20022, SWIFT MT/MX, FIX Protocol
**Regulatory bodies:** RBI, SEC, FCA, BaFin, MAS

### Research Industry Chain

```
Clinical Trial Data --> Akiri (Data Validation) --> Medicalchain (Storage)
        |                                                  |
        v                                                  v
  ICP Patient Vault (ZK-Hash)                    DokChain (Claims Verify)
        |                                                  |
        v                                                  v
  Stacks Bitcoin (Finality)                  Research Compliance Record
```

**Standards enforced:** ICH GCP E6(R3), NDCT 2026 Amendment, DPDP Act 2023, GDPR Article 89
**Data formats:** CDISC SDTM/ADaM, HL7 FHIR ResearchStudy, ClinicalTrials.gov XML
**Regulatory bodies:** CDSCO, FDA (IND), EMA (IMPD), IRB/Ethics Committees

---

## OWASP Smart Contract Top 10 (2026) Security Hardening

Sentinel OS implements comprehensive mitigation for all 10 categories of the OWASP Smart Contract Top 10 (2026 edition). Every financial operation, blockchain interaction, and tenant action passes through the centralized **OWASPSmartContractSecurity** layer.

### Security Status

```bash
# Live security status
curl http://localhost:5000/api/v1/security/status

# Response:
{
  "owaspVersion": "OWASP-SC-2026-v1.0",
  "mitigationsActive": 10,
  "activeGuards": [
    "SC01-RBAC-TenantVerification",
    "SC02-ReentrancyProtection",
    "SC03-CircuitBreaker-InvalidHash",
    "SC04-FlashLoanProtection",
    "SC05-InputValidation-BatchLimit",
    "SC06-ExternalCallSafety",
    "SC07-SafeMath-Overflow",
    "SC08-CEI-Pattern",
    "SC09-SafeMath-Underflow",
    "SC10-FailoverSecurity"
  ]
}
```

### All 10 Mitigations

| ID | Vulnerability | Mitigation | Where Applied |
|----|--------------|------------|---------------|
| **SC01** | Access Control / Visibility | RBAC with tenant verification -- validates `X-Tenant-ID` headers and role permissions before any privileged operation | Clinical analysis, admin treasury withdrawal, route execution |
| **SC02** | Reentrancy / Business Logic | Operation-scoped reentrancy guards with lock tracking -- prevents concurrent execution of the same critical operation | Route execution, settlement, credit operations |
| **SC03** | Oracle Manipulation / Circuit Breaker | Circuit breaker trips after 5 invalid hashes within a window; all subsequent requests are rejected (HTTP 400) until 5-minute cooldown | Batch verification, hash anchoring, oracle price feeds |
| **SC04** | Flash Loan Protection | Block-level transaction detection -- rejects operations where multiple high-value calls originate in the same block | Solidity: `createComplianceRecord`, `triggerAgentAudit`, `registerPrivacyShieldedIP`, `registerHardwareAttestation` |
| **SC05** | Input Validation | Batch size caps (max 100 items), field length limits, hex format enforcement, injection pattern rejection | All blockchain data inputs, batch operations, API payloads |
| **SC06** | Unchecked External Calls | Try/catch wrappers with structured error logging and automatic failover to secondary chain on primary failure | Movement blockchain calls, cross-chain settlement, external API calls |
| **SC07** | Integer Overflow (SafeMath) | Explicit overflow detection on all addition and multiplication operations with `Number.MAX_SAFE_INTEGER` bounds checking | Credit topup, treasury aggregation, fee calculations, token conversions |
| **SC08** | CEI Pattern (Checks-Effects-Interactions) | All Solidity functions follow strict Checks-Effects-Interactions ordering; backend operations validate before mutating state | All Solidity contract functions, backend credit mutations |
| **SC09** | Integer Underflow (SafeMath) | Pre-subtraction balance verification -- rejects operations where result would be negative; fee anomaly detection for unreasonable percentages | Credit consumption, treasury withdrawals, fee deductions |
| **SC10** | Failover / Proxy Security | Automatic primary-to-secondary chain failover with health monitoring; switchable provider architecture | Movement (primary) to Celestia/Stacks (secondary), all external calls |

### Solidity Contract Hardening (PolarUniversalGRC_V3.sol)

- **SafeMath:** All `polarRewards` and `airdropMultiplier` increments use `safeAddReward()` / `safeAddMultiplier()` with overflow protection (zero raw `+=` operations remain)
- **Flash Loan Protection:** `flashLoanProtection` modifier on 4 high-value entry points prevents same-block exploitation
- **Input Guards:** `validFineAmount`, `validConfidenceScore`, `validateOracleInput` modifiers enforce data bounds on all public functions
- **Access Control:** `onlyAuditor`, `nonReentrant`, `whenNotPaused`, `notInEmergency` modifiers compose to enforce multi-layer access control
- **CEI Pattern:** Every function follows Checks-Effects-Interactions ordering to prevent state manipulation

### Move Contract Hardening (SecureVault.move)

- **SafeMath:** `safe_add()` / `safe_sub()` with overflow/underflow assertions on all balance operations (deposit, withdraw, stake)
- **Deposit Limits:** `MAX_DEPOSIT_PER_TX` (10 trillion units) prevents single-transaction manipulation
- **Signer Limits:** `MAX_SIGNERS` (10) prevents governance capture attacks
- **Access Control:** Signer-based authorization with explicit capability checks

### Security API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/security/status` | GET | Full OWASP guard status and active mitigations |
| `/api/v1/security/audit-log` | GET | Recent security events with timestamps and types |
| `/api/v1/security/circuit-breaker` | GET | Circuit breaker state, failure counts, cooldown status |
| `/api/v1/security/validate-hash` | POST | Validate a hash against SC03 rules (format, uniqueness) |
| `/api/v1/security/validate-address` | POST | Validate a blockchain address against SC05 rules |

---

## Vaulted PII Security

The **Vault** class ensures zero patient-identifiable data reaches AI models:

- **15+ PII Types Detected**: Aadhaar, PAN, SSN, MRN, Passport, Email, Phone, IP
- **Standardized Masking**: `[MASKED_AADHAAR]`, `[MASKED_PAN]`, `[MASKED_EMAIL]`
- **Bidirectional**: Mask before LLM, unmask for authorized responses
- **DPDP/HIPAA Compliant**: Full audit trail for every masking operation

---

## Multi-Chain Settlement Architecture

```
                    +---------------------+
                    |   Audit Request     |
                    +----------+----------+
                               |
                               v
                    +---------------------+
                    | Route Orchestrator  |
                    | (Strategy Engine)   |
                    +----------+----------+
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
     +--------+------+ +------+-------+ +------+--------+
     |   PHARMA      | |   BANKING    | |  RESEARCH     |
     |   CHAIN       | |   CHAIN      | |  CHAIN        |
     +-------+-------+ +------+-------+ +-------+-------+
             |                |                  |
   +---------+---------+     |        +---------+---------+
   |         |         |     |        |         |         |
   v         v         v     v        v         v         v
 Akiri   DokChain  Medical  QNT    Ondo      ICP     Stacks
 (EHR)   (Claims)  chain  (Overledger)(RWA)  (Vault) (BTC)
                           Ripple
                           (RLUSD)
```

### Primary/Failover Chain Mapping

| Module | Primary Chain | Failover Chain | Failover Trigger |
|--------|--------------|----------------|------------------|
| Pharma | Movement M1 | Celestia DA | 3 consecutive failures or > 500ms latency |
| Banking | FET.ai Gateway | Stacks Bitcoin | 3 consecutive failures or > 500ms latency |
| Healthcare/Research | ICP Patient Vault | Stacks Bitcoin | 3 consecutive failures or > 500ms latency |

---

## $POLAR Credit Economy

| Operation | Fee | SafeMath Protected |
|-----------|-----|--------------------|
| Credit Purchase | 2.5% platform fee | `safeFeeCalculation()` with anomaly detection |
| Sovereign Conversion | Tier-based fee | `safeFeeCalculation()` + `safeMul()` |
| Token Swap | Tier-based fee | `safeFeeCalculation()` with bounds checking |
| Credit Consumption | Per-audit deduction | `safeSubtract()` with underflow protection |
| Treasury Aggregation | Summation | `safeAdd()` loop with overflow protection |

---

## Gemini AI Integration

Powered by Google's Gemini 1.5 Flash for cost-optimized compliance analysis:

- **Context Caching**: 200+ page regulatory documents cached for fast inference
- **Adaptive Thinking**: Low effort for UI tasks, high effort for trial evaluation
- **Streaming**: Real-time compliance assessments

---

## Sponsor Integrations

### Sanity.io
Headless CMS for dynamic compliance rules and regulatory content management.

### Miro SDK
Real-time compliance flowchart generation with board creation API.

### Perfect Corp
AI-powered visual compliance insights and document analysis.

### Replit Mobile
Cross-platform compliance monitoring with native mobile experience.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/polar-universal/sentinel-os.git
cd sentinel-os
npm install

# Start development server
npm run dev

# Verify security status
curl http://localhost:5000/api/v1/security/status

# Run compliance tests
chmod +x test-compliance.sh
./test-compliance.sh
```

---

## API Reference

### Security Status
```bash
GET /api/v1/security/status
# Returns: OWASP guard status, active mitigations, circuit breaker state
```

### CDSCO Trial Evaluation
```bash
POST /api/v1/cdsco/evaluate-trial
Content-Type: application/json

{
  "drugName": "Paracetamol Generic",
  "category": "generic",
  "isGenericInjectable": true
}
```

### Vault PII Masking
```bash
POST /api/v1/vault/mask
Content-Type: application/json

{
  "data": {"patientId": "123456789012", "email": "test@example.com"}
}
```

### Route Execution
```bash
POST /api/v1/routes/execute
Content-Type: application/json
X-Tenant-ID: <tenant-id>

{
  "routeId": "INSTITUTIONAL",
  "payload": { ... }
}
```

### Circuit Breaker Status
```bash
GET /api/v1/security/circuit-breaker
# Returns: isTripped, invalidHashCount, consecutiveFailures, lastResetAt
```

---

<details>
<summary><b>Regional Module: IndiaAI and Biopharma SHAKTI</b></summary>

## NDCT 2026 Compliance Engine

Sentinel OS implements the **January 28, 2026 CDSCO Amendment** with full regulatory traceability:

### Prior-Intimation Pathway (0-Day Start)

Per the NDCT 2026 Amendment, **Prior-Intimation is the DEFAULT** for all non-high-risk drugs:

- **Low Risk Drugs**: Immediate trial commencement (0-day delay)
- **Generic Injectables**: Fast-track with excipient matching
- **BA/BE Studies**: Zero waiting period
- **Animal Study Waiver**: Automatic when excipients match reference

### 45-Day Test License (High-Risk Only)

High-risk categories requiring mandatory 45-day review:
- Cytotoxic agents
- Narcotic/psychotropic substances
- Gene therapy products
- Cell/stem cell therapies
- Blood products and plasma derivatives

### Indian Regulatory Framework

| Regulation | Implementation |
|------------|----------------|
| DPDP Act 2023 | Data residency in ap-south-1, consent management |
| NDCT 2026 Amendment | Prior-Intimation default pathway |
| CDSCO Circular (Jan 28) | 0-day start for non-high-risk |
| RBI Sandbox | Banking module compliance |

</details>

---

<details>
<summary><b>DeveloperWeek 2026 Hackathon</b></summary>

## Sponsor Integration Showcase

### Sanity.io Integration
- Dynamic compliance rule management
- Real-time content updates for regulatory changes
- Structured content for multi-jurisdiction rules

### Miro SDK Integration
- Compliance flowchart generation
- Visual audit trail mapping
- Collaborative board creation API

### Perfect Corp Integration
- AI-powered document analysis
- Visual compliance insights modal
- Enhanced OCR for regulatory documents

### Replit Mobile Integration
- Cross-platform compliance dashboard
- Native mobile audit notifications
- Offline compliance verification

</details>

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ETHERSCAN_API_KEY` | Ethereum network verification | Optional |
| `MOVEMENT_PRIVATE_KEY` | Movement M1 signing | Optional |
| `MIRO_ACCESS_TOKEN` | Miro SDK (LIVE mode) | Optional |
| `SESSION_SECRET` | Session encryption | Required |

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Node.js, Express.js, TypeScript (ESM) |
| Database | PostgreSQL, Drizzle ORM |
| Blockchain | ethers.js v6, Movement M1, Solidity 0.8.28, Move (Aptos) |
| AI | Google Gemini 1.5 Flash |
| Security | OWASP SC 2026 Hardened, Vault PII Engine |

---

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

---

Built with Replit Agent | Powered by Gemini 1.5 Flash | OWASP SC 2026 Hardened
