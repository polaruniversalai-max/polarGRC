/**
 * PUBLIC ORCHESTRATOR
 * Demo Mode Mock Data
 * 
 * Hardcoded mock data for hackathon demonstrations.
 * Allows full app testing without exposing real logic or API keys.
 */

export const MOCK_SCAN_RESULTS = [
  {
    serial_id: 'DEMO-NDC-001-2026',
    status: 'VERIFIED',
    confidence: 0.98,
    network: 'Movement M1',
    violations: [],
    zk_shielded: true,
  },
  {
    serial_id: 'DEMO-NDC-002-2026',
    status: 'AUDIT_REQUIRED',
    confidence: 0.85,
    network: 'Movement M1',
    violations: [
      { type: 'TEMP_EXCURSION', severity: 'MEDIUM', description: 'Temperature logged at 9.2°C' }
    ],
    zk_shielded: true,
  },
  {
    serial_id: 'DEMO-NDC-003-2026',
    status: 'QUARANTINE',
    confidence: 0.45,
    network: 'Celestia DA',
    violations: [
      { type: 'CHAIN_BREAK', severity: 'CRITICAL', description: 'Missing custody transfer at step 3' },
      { type: 'ATP_FAILURE', severity: 'HIGH', description: 'ATP verification timeout' }
    ],
    zk_shielded: false,
  },
];

export const MOCK_NETWORK_STATUS = {
  primary: {
    name: 'Movement M1',
    status: 'healthy',
    latency: 45,
    blockHeight: 1847293,
  },
  fallbacks: [
    { name: 'Celestia DA', status: 'healthy', latency: 78, blockHeight: 982341 },
    { name: 'Stacks BTC', status: 'healthy', latency: 120, blockHeight: 156789 },
    { name: 'ICP Vault', status: 'degraded', latency: 250, blockHeight: 4521098 },
  ],
};

export const MOCK_COMPLIANCE_METRICS = {
  totalScans: 15847,
  verifiedRate: 0.94,
  averageLatency: 67,
  zkProofsGenerated: 12453,
  failoversExecuted: 3,
  lastFailover: {
    from: 'Movement M1',
    to: 'Celestia DA',
    reason: 'Network congestion',
    duration: 145,
    timestamp: '2026-02-02T14:32:00Z',
  },
};

export const MOCK_LEADERBOARD = [
  { facility: 'Irving Pharma Hub', location: 'Irving, TX', xp: 4850, rank: 'Sovereign Warden' },
  { facility: 'Dallas Med Center', location: 'Dallas, TX', xp: 3200, rank: 'Sovereign Warden' },
  { facility: 'Austin Distribution', location: 'Austin, TX', xp: 1850, rank: 'Silver Sentinel' },
  { facility: 'Houston Logistics', location: 'Houston, TX', xp: 1200, rank: 'Silver Sentinel' },
  { facility: 'Fort Worth Depot', location: 'Fort Worth, TX', xp: 450, rank: 'Bronze Auditor' },
];

export const MOCK_TREASURY_STATS = {
  totalFees: 12450.75,
  polarBalance: 847293,
  stakingRewards: 2341.50,
  pendingSwaps: 3,
};

export const MOCK_AI_TRACES = [
  {
    id: 'trace-001',
    name: 'DSCSA Batch Analysis',
    timestamp: '2026-02-03T01:15:00Z',
    reasoning: `Analyzing batch NDC-2026-DEMO for DSCSA 2026 compliance...
    
Step 1: Validating GS1 Product Identifier
- NDC Code: 12345-6789-01 ✓
- Lot Number: LOT-2026-A1 ✓
- Expiration: 2027-06-15 ✓

Step 2: Chain of Custody Verification
- Manufacturer → Distributor: Verified on Movement M1
- Distributor → Pharmacy: Verified on Movement M1
- All custody transfers within 24h window ✓

Step 3: Temperature Log Analysis
- 847 readings analyzed
- Range: 2.1°C - 7.8°C
- Cold chain maintained ✓

Step 4: ATP Verification
- Trading Partner verified via Railgun ZK
- No suspicious activity detected ✓

CONCLUSION: DSCSA 2026 COMPLIANT
Confidence Score: 0.98
Network: Movement M1 (Primary)`,
  },
  {
    id: 'trace-002',
    name: 'AML Transaction Screening',
    timestamp: '2026-02-03T01:10:00Z',
    reasoning: `Screening transaction for AML/KYC compliance...
    
Step 1: Identity Verification
- KYC Status: Verified
- Document Type: Aadhaar + PAN
- Jurisdiction: India (DPDP Act applicable)

Step 2: PEP/Sanctions Screening
- OFAC List: No match
- EU Sanctions: No match
- Indian PEP Database: No match

Step 3: Transaction Pattern Analysis
- Amount: ₹4,50,000
- Pattern: Within normal range for entity type
- Velocity: 2nd transaction this week

Step 4: FET.ai Agent Assessment
- Risk Score: 0.12 (Low)
- Recommended Action: Approve

CONCLUSION: TRANSACTION APPROVED
Risk Level: Low
Network: FET.ai Gateway`,
  },
];

export const MOCK_SPONSOR_COMPLIANCE_RULES = [
  {
    id: 'DSCSA-2026',
    title: 'Drug Supply Chain Security Act 2026',
    description: 'Full serialization and interoperability requirements',
    status: 'active',
  },
  {
    id: 'HIPAA-PHI',
    title: 'HIPAA Protected Health Information',
    description: 'Encryption and access control for patient data',
    status: 'active',
  },
  {
    id: 'DPDP-2023',
    title: 'Digital Personal Data Protection Act',
    description: 'Indian data residency and consent requirements',
    status: 'active',
  },
];
