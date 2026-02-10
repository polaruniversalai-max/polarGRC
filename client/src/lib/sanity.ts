/**
 * Sentinel OS v1.2 - Sanity.io Integration
 * =========================================
 * Headless CMS for compliance rules and regulations.
 * DeveloperWeek 2026: Sanity.io $500 Challenge
 * 
 * @module lib/sanity
 * @version 1.2.0
 */

import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'polar-grc',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

export interface ComplianceRule {
  _id: string;
  title: string;
  standard: 'HIPAA' | 'DPDP' | 'DIFC' | 'CDSCO' | 'FDA_21_CFR_11' | 'DSCSA_2026';
  description: string;
  requirements: string[];
  penalties: string;
  region: 'US' | 'India' | 'Dubai' | 'Global';
  category: 'Healthcare' | 'Pharma' | 'Banking' | 'Privacy';
  lastUpdated: string;
}

export interface ComplianceContent {
  rules: ComplianceRule[];
  standards: {
    name: string;
    description: string;
    enforcementDate: string;
  }[];
}

const MOCK_COMPLIANCE_RULES: ComplianceRule[] = [
  {
    _id: 'hipaa-001',
    title: 'HIPAA Privacy Rule',
    standard: 'HIPAA',
    description: 'Establishes national standards to protect individuals\' medical records and other personal health information.',
    requirements: [
      'Implement technical safeguards for PHI',
      'Conduct risk assessments',
      'Maintain audit logs for 6 years',
      'Employee training requirements'
    ],
    penalties: 'Up to $1.5M per violation category per year',
    region: 'US',
    category: 'Healthcare',
    lastUpdated: '2026-01-15'
  },
  {
    _id: 'dpdp-001',
    title: 'Digital Personal Data Protection Act',
    standard: 'DPDP',
    description: 'India\'s comprehensive data protection law with strict consent and data residency requirements.',
    requirements: [
      'Data localization for critical personal data',
      'Explicit consent mechanisms',
      'Right to erasure implementation',
      'Data Protection Officer appointment'
    ],
    penalties: 'Up to ₹250 Crore per violation',
    region: 'India',
    category: 'Privacy',
    lastUpdated: '2026-02-01'
  },
  {
    _id: 'difc-001',
    title: 'DIFC Data Protection Law',
    standard: 'DIFC',
    description: 'Dubai International Financial Centre data protection regulations aligned with GDPR.',
    requirements: [
      'Cross-border data transfer protocols',
      'Privacy by design principles',
      'Breach notification within 72 hours',
      'Data subject access rights'
    ],
    penalties: 'Up to $100,000 per violation',
    region: 'Dubai',
    category: 'Privacy',
    lastUpdated: '2026-01-20'
  },
  {
    _id: 'cdsco-001',
    title: 'CDSCO Biopharma Shakti',
    standard: 'CDSCO',
    description: 'Central Drugs Standard Control Organization audit trail requirements for clinical trials.',
    requirements: [
      'Complete audit trail for all trial data',
      'Electronic signature compliance',
      'Data integrity verification',
      'Immutable record keeping'
    ],
    penalties: 'License suspension and criminal prosecution',
    region: 'India',
    category: 'Pharma',
    lastUpdated: '2026-01-10'
  },
  {
    _id: 'dscsa-001',
    title: 'DSCSA 2026 Requirements',
    standard: 'DSCSA_2026',
    description: 'Drug Supply Chain Security Act full implementation requirements effective November 2026.',
    requirements: [
      'GS1 EPCIS event tracking',
      'Authorized Trading Partner verification',
      'Interoperable data exchange',
      'Product verification within 24 hours'
    ],
    penalties: 'FDA enforcement actions and import alerts',
    region: 'US',
    category: 'Pharma',
    lastUpdated: '2026-02-01'
  },
  {
    _id: 'fda-cfr-001',
    title: 'FDA 21 CFR Part 11',
    standard: 'FDA_21_CFR_11',
    description: 'Electronic records and electronic signatures compliance for pharmaceutical industry.',
    requirements: [
      'Validated computer systems',
      'Electronic signature controls',
      'Audit trail capabilities',
      'Access controls and authority checks'
    ],
    penalties: 'Warning letters and consent decrees',
    region: 'US',
    category: 'Pharma',
    lastUpdated: '2026-01-05'
  }
];

export async function fetchComplianceRules(): Promise<ComplianceRule[]> {
  try {
    const query = `*[_type == "complianceRule"] {
      _id,
      title,
      standard,
      description,
      requirements,
      penalties,
      region,
      category,
      lastUpdated
    }`;
    
    const rules = await sanityClient.fetch<ComplianceRule[]>(query);
    return rules.length > 0 ? rules : MOCK_COMPLIANCE_RULES;
  } catch {
    return MOCK_COMPLIANCE_RULES;
  }
}

export async function fetchRulesByStandard(standard: string): Promise<ComplianceRule[]> {
  const allRules = await fetchComplianceRules();
  return allRules.filter(rule => rule.standard === standard);
}

export async function fetchRulesByRegion(region: string): Promise<ComplianceRule[]> {
  const allRules = await fetchComplianceRules();
  return allRules.filter(rule => rule.region === region);
}

export { MOCK_COMPLIANCE_RULES };
