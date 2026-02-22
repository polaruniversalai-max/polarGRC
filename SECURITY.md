# Security Policy

## Sentinel Core Engine - Proprietary Module

The **Sentinel Core Engine** is a proprietary, closed-source module developed by PolarUniversal Inc. This security document explains our approach to protecting intellectual property while ensuring the security of sensitive Pharma, Banking, and Healthcare data.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PUBLIC ORCHESTRATOR                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   UI/UX     │  │  Sponsor    │  │   API Connectors        │  │
│  │  Components │  │  Integrations│  │  (Solana/Movement/Stacks)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                            │                                      │
│                    ┌───────▼───────┐                             │
│                    │ Mock Interface │                             │
│                    │   (Wrapper)    │                             │
│                    └───────┬───────┘                             │
└────────────────────────────┼─────────────────────────────────────┘
                             │
              ═══════════════╪═══════════════  SECURITY BOUNDARY
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      SENTINEL VAULT                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Resilience    │  │   Compliance    │  │    ZK Proof     │  │
│  │   Algorithms    │  │   Mapping       │  │    Generator    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
│  [PROPRIETARY] - NOT INCLUDED IN PUBLIC REPOSITORY               │
└───────────────────────────────────────────────────────────────────┘
```

## What's Protected

### Sentinel Vault (Proprietary)

The following components contain trade secrets and are NOT included in the public repository:

| Component | Description | Why It's Protected |
|-----------|-------------|-------------------|
| **Network Failover Engine** | <200ms multi-chain failover algorithm | Competitive advantage in resilience |
| **Compliance Mapping Engine** | Multi-sector regulatory mapping (DSCSA, HIPAA, DPDP) | Core IP for GRC platform |
| **ZK Proof Generator** | OIPK zero-knowledge proof implementation | Cryptographic trade secrets |
| **Sector Adapters** | Industry-specific compliance logic | Domain expertise codified |

### What's Included

The public repository includes:

- **UI Components**: Full React frontend with all visual elements
- **Sponsor Integrations**: Complete implementations for DeveloperWeek 2026 challenges
- **API Connectors**: Connection logic for Solana, Movement, Stacks, ICP
- **Demo Mode**: Hardcoded mock data for testing and judging
- **Minified Core**: Pre-compiled `sentinel-core.min.js` for app functionality

## Demo Mode

For hackathon judging and testing, the application runs in **Demo Mode** by default:

```typescript
const DEMO_MODE = true; // Set in public-orchestrator/sentinel-core-interface.ts
```

Demo Mode provides:
- ✅ Full UI/UX functionality
- ✅ Realistic mock responses for all operations
- ✅ All sponsor integrations working
- ✅ Simulated network failover with proper timing
- ❌ No real proprietary algorithms executed
- ❌ No actual ZK proofs generated (mock commitments only)

## Reporting Security Vulnerabilities

If you discover a security vulnerability in our public code, please report it responsibly:

1. **Email**: security@polaruniversal.io
2. **PGP Key**: Available at https://polaruniversal.io/.well-known/security.txt
3. **Response Time**: We aim to acknowledge within 24 hours

### Scope

- Public repository code
- API endpoints
- UI security issues
- Authentication/authorization flaws

### Out of Scope

- Sentinel Vault internals (not accessible)
- Social engineering attacks
- DoS attacks on demo infrastructure

## Compliance Certifications

The Sentinel Core Engine is designed to meet:

| Standard | Status | Auditor |
|----------|--------|---------|
| SOC 2 Type II | In Progress | Pending |
| HIPAA | Compliant | Self-Assessed |
| DPDP Act 2023 | Compliant | Self-Assessed |
| FDA 21 CFR Part 11 | Designed For | Pending |

## Data Handling

### Pharma Data (DSCSA 2026)
- All PHI fields ZK-shielded before storage
- Audit trails retained for 7 years
- Movement M1 blockchain for immutable verification

### Banking Data (AML/KYC)
- PII encrypted at rest and in transit
- FET.ai agent screening for transaction monitoring
- RBI Sandbox compliant for Indian operations

### Healthcare Data (HIPAA/DPDP)
- ICP Patient Vault for permanent record storage
- Stacks Bitcoin anchoring for timestamp proofs
- Data residency enforcement for Indian citizens

## License

The public orchestrator code is available under MIT License.
The Sentinel Vault is proprietary and all rights reserved.

---

**Copyright © 2026 PolarUniversal Inc. All Rights Reserved.**

For licensing inquiries: legal@polaruniversal.io
For partnership opportunities: partnerships@polaruniversal.io
