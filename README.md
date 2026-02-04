# Sentinel OS v1.2

## Global Compliance Operating System | Triple-Zero Standard

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Sentinel OS](https://img.shields.io/badge/Sentinel%20OS-v1.2.0-emerald)](https://github.com/polar-universal/sentinel-os)
[![DeveloperWeek 2026](https://img.shields.io/badge/DeveloperWeek-2026-purple)](https://developerweek.com)
[![Built with Replit Agent](https://img.shields.io/badge/Built%20with-Replit%20Agent-orange)](https://replit.com)

---

## Vision

**Sentinel OS** is an institutional-grade **Agentic GRC (Governance, Risk, and Compliance)** platform that transforms enterprise compliance from reactive auditing to real-time, blockchain-verified assurance.

We believe compliance should be:
- **Invisible** — Automated and embedded, not manual and burdensome
- **Immutable** — Blockchain-anchored for absolute audit certainty
- **Intelligent** — AI-powered risk detection with zero false positives
- **Instant** — Sub-200ms failover for true zero-downtime compliance

> *"Compliance is not a cost center. It's a competitive advantage."*

---

## Core Capabilities

### Agentic GRC Architecture

Sentinel OS implements autonomous compliance agents that continuously monitor, verify, and remediate compliance posture across multiple regulatory frameworks.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SENTINEL OS v1.2                              │
│                    Triple-Zero Compliance Engine                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │ ZERO-       │    │ ZERO-       │    │ ZERO-       │              │
│  │ DOWNTIME    │    │ KNOWLEDGE   │    │ TRUST       │              │
│  │             │    │             │    │             │              │
│  │ <200ms      │    │ Vault PII   │    │ RBAC +      │              │
│  │ Failover    │    │ Engine      │    │ Audit Logs  │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Vaulted PII Security

The **Vault** class ensures zero patient-identifiable data reaches AI models:

- **15+ PII Types Detected**: Aadhaar, PAN, SSN, MRN, Passport, Email, Phone, IP
- **Standardized Masking**: `[MASKED_AADHAAR]`, `[MASKED_PAN]`, `[MASKED_EMAIL]`
- **Bidirectional**: Mask before LLM, unmask for authorized responses
- **DPDP/HIPAA Compliant**: Full audit trail for every masking operation

```bash
# Test Vault masking
curl -X POST http://localhost:5000/api/v1/vault/mask \
  -H "Content-Type: application/json" \
  -d '{"data":{"aadhaar":"123456789012","email":"patient@hospital.com"}}'

# Response: {"safeData":{"aadhaar":"[MASKED_AADHAAR]","email":"[MASKED_EMAIL]"}}
```

### Gemini AI Integration

Powered by Google's Gemini 1.5 Flash for cost-optimized compliance analysis:

- **Context Caching**: 200+ page regulatory documents cached for fast inference
- **Adaptive Thinking**: Low effort for UI tasks, high effort for trial evaluation
- **Streaming**: Real-time compliance assessments

---

## Sponsor Integrations

### Sanity.io
Headless CMS for dynamic compliance rules and regulatory content management.

### Miro SDK
Real-time compliance flowchart generation with board creation API:

```bash
# Check Miro integration status
curl http://localhost:5000/api/v1/miro/status
# {"available":true,"mode":"DEMO"|"LIVE"}
```

### Perfect Corp
AI-powered visual compliance insights and document analysis.

### Replit Mobile
Cross-platform compliance monitoring with native mobile experience.

---

## Multi-Chain Architecture

```
                    ┌─────────────────────┐
                    │   Audit Request     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Network Orchestrator│
                    │   (Health Monitor)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   PHARMA    │  │   BANKING   │  │  HEALTHCARE │
     │   MODULE    │  │   MODULE    │  │   MODULE    │
     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
            │                │                │
  ┌─────────┴─────────┐      │      ┌─────────┴─────────┐
  │                   │      │      │                   │
  ▼                   ▼      ▼      ▼                   ▼
┌───────┐         ┌───────┐ ┌───────┐         ┌───────┐
│Movement│ ──────▶│Celestia│ │FET.ai │         │ ICP   │──────▶│Stacks │
│  M1   │ PRIMARY │  DA   │ │Gateway│         │Patient│ PRIMARY│Bitcoin│
│       │ FAILOVER│       │ │       │         │ Vault │ FAILOVER│Anchor │
└───────┘         └───────┘ └───────┘         └───────┘         └───────┘
```

### Module Standards

| Module | Primary | Secondary | Standards |
|--------|---------|-----------|-----------|
| Pharma | Movement M1 | Celestia DA | DSCSA 2026, FDA 21 CFR 11 |
| Banking | FET.ai | Stacks Bitcoin | RBI Sandbox, FATF AML/CFT |
| Healthcare | ICP Patient Vault | Stacks Finality | HIPAA, DPDP Act, GDPR |

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/polar-universal/sentinel-os.git
cd sentinel-os
npm install

# Start development server
npm run dev

# Run compliance tests
chmod +x test-compliance.sh
./test-compliance.sh
```

---

## API Reference

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

### Miro Board Creation
```bash
POST /api/v1/miro/create-board
Content-Type: application/json

{
  "drugName": "Test Drug",
  "approvalPath": "PRIOR_INTIMATION"
}
```

---

<details>
<summary><b>Regional Module: IndiaAI & Biopharma SHAKTI</b></summary>

## NDCT 2026 Compliance Engine

Sentinel OS implements the **January 28, 2026 CDSCO Amendment** with full regulatory traceability:

### Prior-Intimation Pathway (0-Day Start)

Per the NDCT 2026 Amendment, **Prior-Intimation is the DEFAULT** for all non-high-risk drugs:

- **Low Risk Drugs**: Immediate trial commencement (0-day delay)
- **Generic Injectables**: Fast-track with excipient matching
- **BA/BE Studies**: Zero waiting period
- **Animal Study Waiver**: Automatic when excipients match reference

```bash
# Test 0-day approval for generic drug
curl -X POST http://localhost:5000/api/v1/cdsco/evaluate-trial \
  -H "Content-Type: application/json" \
  -d '{"drugName":"Paracetamol","category":"generic"}'

# Response: {"evaluation":{"startDelay":0,"mechanism":"PRIOR_INTIMATION"}}
```

### 45-Day Test License (High-Risk Only)

High-risk categories requiring mandatory 45-day review:
- Cytotoxic agents
- Narcotic/psychotropic substances
- Gene therapy products
- Cell/stem cell therapies
- Blood products & plasma derivatives

### SHAKTI Compliance Tracker

Real-time 45-day countdown with milestone tracking:

- **Live Countdown**: Days, hours, minutes, seconds remaining
- **Fast-Track Badge**: "Fast-Track Verified" for 0-day approvals
- **CDSCO Circular Link**: Direct link to Jan 2026 notification
- **Sovereign Node Status**: ap-south-1 (Mumbai) + DPDP Act compliance

### Indian Regulatory Framework

| Regulation | Implementation |
|------------|----------------|
| DPDP Act 2023 | Data residency in ap-south-1, consent management |
| NDCT 2026 Amendment | Prior-Intimation default pathway |
| CDSCO Circular (Jan 28) | 0-day start for non-high-risk |
| RBI Sandbox | Banking module compliance |

### Verification

```bash
# Run full compliance test suite
./test-compliance.sh

# Expected: All CDSCO tests pass
# - HIGH_RISK → 45 days
# - Low Risk → 0 days
# - Generic → 0 days
# - BA/BE → 0 days
```

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

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

---

Built with Replit Agent | Powered by Gemini 1.5 Flash
