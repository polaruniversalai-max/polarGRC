import { createClient, SanityClient as SanityClientType } from "@sanity/client";

interface ComplianceRule {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  sector: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  references: string[];
  effectiveDate?: string;
  lastUpdated: string;
}

interface RegulatorySchema {
  id: string;
  name: string;
  version: string;
  jurisdiction: string;
  rules: ComplianceRule[];
}

const MOCK_COMPLIANCE_RULES: Record<string, ComplianceRule[]> = {
  US: [
    {
      id: "fda-21cfr11-10a",
      title: "FDA 21 CFR Part 11.10(a) - Electronic Signatures",
      description:
        "Organizations must implement controls to ensure the authenticity, integrity, and confidentiality of electronic records.",
      jurisdiction: "US",
      sector: "PHARMA",
      severity: "CRITICAL",
      references: ["21 CFR Part 11.10(a)", "FDA Guidance for Industry"],
      lastUpdated: "2024-01-15",
    },
    {
      id: "dscsa-2026-verification",
      title: "DSCSA 2026 - Product Verification Requirements",
      description:
        "Trading partners must verify product identifiers (GTIN, Serial Number, Lot Number, Expiration Date) before distribution.",
      jurisdiction: "US",
      sector: "PHARMA",
      severity: "CRITICAL",
      references: ["DSCSA Section 582", "FDA Guidance Document"],
      effectiveDate: "2026-11-27",
      lastUpdated: "2024-06-01",
    },
    {
      id: "hipaa-phi-storage",
      title: "HIPAA - Protected Health Information Storage",
      description:
        "PHI must be encrypted at rest and in transit. Access controls and audit logging are mandatory.",
      jurisdiction: "US",
      sector: "HEALTHCARE",
      severity: "CRITICAL",
      references: ["45 CFR 164.312", "HIPAA Security Rule"],
      lastUpdated: "2023-12-01",
    },
    {
      id: "cold-chain-2-8c",
      title: "Cold Chain Temperature Requirements",
      description:
        "Vaccines and biologics must be maintained between 2-8°C. Any excursion requires quarantine and stability assessment.",
      jurisdiction: "US",
      sector: "PHARMA",
      severity: "HIGH",
      references: ["CDC Vaccine Storage Guidelines", "USP <1079>"],
      lastUpdated: "2024-03-15",
    },
  ],
  INDIA: [
    {
      id: "dpdp-2023-consent",
      title: "DPDP Act 2023 - Data Principal Consent",
      description:
        "Personal data processing requires explicit, informed consent. Data fiduciaries must maintain consent records.",
      jurisdiction: "INDIA",
      sector: "DATA_PRIVACY",
      severity: "CRITICAL",
      references: ["Digital Personal Data Protection Act 2023", "Section 6"],
      effectiveDate: "2024-08-01",
      lastUpdated: "2024-01-01",
    },
    {
      id: "cdsco-audit-trail",
      title: "CDSCO - Biopharma Audit Trail Requirements",
      description:
        "All manufacturing and quality control activities must maintain complete, tamper-evident audit trails.",
      jurisdiction: "INDIA",
      sector: "PHARMA",
      severity: "HIGH",
      references: ["CDSCO Guidelines", "Schedule M"],
      lastUpdated: "2024-02-15",
    },
    {
      id: "rbi-sandbox",
      title: "RBI Regulatory Sandbox Guidelines",
      description:
        "Fintech solutions handling payments must operate within RBI sandbox parameters with restricted transaction limits.",
      jurisdiction: "INDIA",
      sector: "FINANCE",
      severity: "MEDIUM",
      references: ["RBI/2019-20/10", "Enabling Framework for Regulatory Sandbox"],
      lastUpdated: "2023-11-01",
    },
  ],
  UAE: [
    {
      id: "difc-dp-2020",
      title: "DIFC Data Protection Law 2020",
      description:
        "Data controllers in DIFC must implement appropriate technical and organizational measures to protect personal data.",
      jurisdiction: "UAE",
      sector: "DATA_PRIVACY",
      severity: "HIGH",
      references: ["DIFC Law No. 5 of 2020", "Commissioner Guidance Notes"],
      lastUpdated: "2024-01-10",
    },
    {
      id: "mohap-pharma",
      title: "MOHAP Pharmaceutical Registration",
      description:
        "All pharmaceutical products must be registered with MOHAP and meet GMP requirements before distribution.",
      jurisdiction: "UAE",
      sector: "PHARMA",
      severity: "CRITICAL",
      references: ["Federal Law No. 8 of 2019", "MOHAP Guidelines"],
      lastUpdated: "2023-09-01",
    },
  ],
  EU: [
    {
      id: "gdpr-art25",
      title: "GDPR Article 25 - Data Protection by Design",
      description:
        "Controllers must implement appropriate technical measures to ensure data protection principles are embedded in processing.",
      jurisdiction: "EU",
      sector: "DATA_PRIVACY",
      severity: "HIGH",
      references: ["GDPR Article 25", "WP29 Guidelines"],
      lastUpdated: "2024-02-01",
    },
    {
      id: "eu-fmd",
      title: "EU Falsified Medicines Directive",
      description:
        "All prescription medicines must carry unique identifiers and anti-tampering devices verified at point of dispense.",
      jurisdiction: "EU",
      sector: "PHARMA",
      severity: "CRITICAL",
      references: ["Directive 2011/62/EU", "Delegated Regulation 2016/161"],
      lastUpdated: "2023-12-15",
    },
  ],
};

export class SanityClient {
  private client: SanityClientType | null = null;
  private mockMode: boolean = true;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    const projectId = process.env.SANITY_PROJECT_ID;
    const dataset = process.env.SANITY_DATASET || "production";
    const apiVersion = process.env.SANITY_API_VERSION || "2024-01-01";

    if (projectId) {
      try {
        this.client = createClient({
          projectId,
          dataset,
          apiVersion,
          useCdn: true,
        });
        this.mockMode = false;
        console.log("[SanityClient] Connected to Sanity.io Content Lake");
      } catch (e) {
        console.warn("[SanityClient] Failed to connect - using mock data");
        this.mockMode = true;
      }
    } else {
      console.log("[SanityClient] No Sanity project configured - using mock compliance rules");
      this.mockMode = true;
    }
  }

  public isAvailable(): boolean {
    return !this.mockMode || Object.keys(MOCK_COMPLIANCE_RULES).length > 0;
  }

  public async getComplianceRules(jurisdiction: string = "US"): Promise<ComplianceRule[]> {
    if (this.mockMode) {
      return MOCK_COMPLIANCE_RULES[jurisdiction] || MOCK_COMPLIANCE_RULES["US"];
    }

    try {
      const query = `*[_type == "complianceRule" && jurisdiction == $jurisdiction] {
        "id": _id,
        title,
        description,
        jurisdiction,
        sector,
        severity,
        references,
        effectiveDate,
        "lastUpdated": _updatedAt
      }`;

      const rules = await this.client!.fetch<ComplianceRule[]>(query, { jurisdiction });
      return rules.length > 0 ? rules : MOCK_COMPLIANCE_RULES[jurisdiction] || [];
    } catch (e) {
      console.warn("[SanityClient] Fetch failed - returning mock data");
      return MOCK_COMPLIANCE_RULES[jurisdiction] || MOCK_COMPLIANCE_RULES["US"];
    }
  }

  public async getRegulatorySchema(schemaId: string): Promise<RegulatorySchema | null> {
    if (this.mockMode) {
      const jurisdiction = schemaId.split("-")[0]?.toUpperCase() || "US";
      const rules = MOCK_COMPLIANCE_RULES[jurisdiction] || [];
      return {
        id: schemaId,
        name: `${jurisdiction} Compliance Schema`,
        version: "1.0.0",
        jurisdiction,
        rules,
      };
    }

    try {
      const query = `*[_type == "regulatorySchema" && _id == $schemaId][0] {
        "id": _id,
        name,
        version,
        jurisdiction,
        "rules": rules[]->
      }`;

      return await this.client!.fetch<RegulatorySchema>(query, { schemaId });
    } catch (e) {
      console.warn("[SanityClient] Schema fetch failed");
      return null;
    }
  }

  public async getSectorRules(sector: string, jurisdiction?: string): Promise<ComplianceRule[]> {
    const allRules = await this.getComplianceRules(jurisdiction || "US");
    return allRules.filter((rule) => rule.sector === sector);
  }

  public async searchRules(searchTerm: string): Promise<ComplianceRule[]> {
    const allJurisdictions = Object.values(MOCK_COMPLIANCE_RULES).flat();

    if (this.mockMode) {
      const lowerSearch = searchTerm.toLowerCase();
      return allJurisdictions.filter(
        (rule) =>
          rule.title.toLowerCase().includes(lowerSearch) ||
          rule.description.toLowerCase().includes(lowerSearch) ||
          rule.references.some((ref) => ref.toLowerCase().includes(lowerSearch))
      );
    }

    try {
      const query = `*[_type == "complianceRule" && (
        title match $searchTerm ||
        description match $searchTerm ||
        references[] match $searchTerm
      )] {
        "id": _id,
        title,
        description,
        jurisdiction,
        sector,
        severity,
        references,
        effectiveDate,
        "lastUpdated": _updatedAt
      }`;

      return await this.client!.fetch<ComplianceRule[]>(query, { searchTerm: `*${searchTerm}*` });
    } catch (e) {
      return allJurisdictions.filter((rule) =>
        rule.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }
}

export default SanityClient;
