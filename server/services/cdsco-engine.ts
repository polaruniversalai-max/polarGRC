// CDSCO Engine - NDCT 2026 Amendment Rules Implementation
// For IndiaAI Innovation Challenge & Biopharma SHAKTI Initiative

interface DrugProfile {
  name: string;
  category: string;
  excipients?: string[];
  referenceExcipients?: string[];
  isGenericInjectable?: boolean;
  trialPhase?: "Phase1" | "Phase2" | "Phase3" | "Phase4" | "BA/BE";
  indication?: string;
  manufacturer?: string;
  applicationDate?: Date;
}

interface TrialEvaluation {
  trialType: "HIGH_RISK" | "STANDARD" | "EXPEDITED" | "PRIOR_INTIMATION";
  mechanism: "45_DAY_TEST_LICENSE" | "PRIOR_INTIMATION" | "STANDARD_REVIEW";
  startDelay: number;
  requirements: string[];
  exemptions: string[];
  regulatoryBasis: string[];
  shaktiCompliance: boolean;
  estimatedApprovalDate?: Date;
}

interface AnimalStudyWaiver {
  eligible: boolean;
  reason: string;
  regulatoryReference: string;
  conditions?: string[];
}

const HIGH_RISK_KEYWORDS = [
  "cytotoxic",
  "narcotic",
  "psychotropic",
  "controlled substance",
  "schedule h1",
  "schedule x",
  "radiopharmaceutical",
  "gene therapy",
  "cell therapy",
  "stem cell",
  "blood product",
  "plasma derivative",
];

const PRIOR_INTIMATION_ELIGIBLE = [
  "bioavailability",
  "bioequivalence",
  "ba/be",
  "generic",
  "biosimilar",
  "new indication",
  "pediatric formulation",
];

export class CDSCOEngine {
  private static instance: CDSCOEngine | null = null;
  private readonly ndctVersion = "NDCT-2026-Amendment-Jan28";

  private constructor() {
    console.log(`[CDSCOEngine] Initialized with ${this.ndctVersion}`);
  }

  public static getInstance(): CDSCOEngine {
    if (!CDSCOEngine.instance) {
      CDSCOEngine.instance = new CDSCOEngine();
    }
    return CDSCOEngine.instance;
  }

  public evaluateTrialType(drugProfile: DrugProfile): TrialEvaluation {
    const categoryLower = drugProfile.category.toLowerCase();
    const indicationLower = (drugProfile.indication || "").toLowerCase();
    const combinedText = `${categoryLower} ${indicationLower} ${drugProfile.name.toLowerCase()}`;

    const isHighRisk = HIGH_RISK_KEYWORDS.some((keyword) =>
      combinedText.includes(keyword)
    );

    const isPriorIntimationEligible = PRIOR_INTIMATION_ELIGIBLE.some((keyword) =>
      combinedText.includes(keyword)
    );

    const requirements: string[] = [];
    const exemptions: string[] = [];
    const regulatoryBasis: string[] = [];

    if (isHighRisk) {
      requirements.push("Mandatory 45-Day Test License Application");
      requirements.push("Enhanced Safety Monitoring Protocol");
      requirements.push("DCGI Review Committee Presentation");
      requirements.push("Phase I Trial Site Pre-approval");
      regulatoryBasis.push("NDCT Rules 2019, Rule 21(b)");
      regulatoryBasis.push("NDCT 2026 Amendment, Schedule Y-A");

      const applicationDate = drugProfile.applicationDate || new Date();
      const estimatedApprovalDate = new Date(applicationDate);
      estimatedApprovalDate.setDate(estimatedApprovalDate.getDate() + 45);

      return {
        trialType: "HIGH_RISK",
        mechanism: "45_DAY_TEST_LICENSE",
        startDelay: 45,
        requirements,
        exemptions,
        regulatoryBasis,
        shaktiCompliance: true,
        estimatedApprovalDate,
      };
    }

    if (isPriorIntimationEligible) {
      requirements.push("Prior Intimation Letter to CDSCO");
      requirements.push("Protocol Summary Submission");
      requirements.push("Ethics Committee Approval Copy");
      regulatoryBasis.push("NDCT 2026 Amendment, Prior-Intimation Mechanism");
      exemptions.push("45-Day Waiting Period Waived");
      exemptions.push("Test License Not Required");

      const animalStudyWaiver = this.checkAnimalStudyWaiver(drugProfile);
      if (animalStudyWaiver.eligible) {
        exemptions.push(`Animal Toxicity Study: ${animalStudyWaiver.reason}`);
        regulatoryBasis.push(animalStudyWaiver.regulatoryReference);
      }

      return {
        trialType: "EXPEDITED",
        mechanism: "PRIOR_INTIMATION",
        startDelay: 0,
        requirements,
        exemptions,
        regulatoryBasis,
        shaktiCompliance: true,
        estimatedApprovalDate: new Date(),
      };
    }

    // Per NDCT 2026 Amendment (Jan 28, 2026): Prior-Intimation is DEFAULT for ALL non-high-risk drugs
    // Zero-day start delay - trials can commence immediately after intimation filing
    requirements.push("Prior Intimation Letter to CDSCO");
    requirements.push("Form CT-04 Submission");
    requirements.push("Ethics Committee Approval Copy");
    regulatoryBasis.push("NDCT 2026 Amendment - Prior-Intimation Default Pathway");
    regulatoryBasis.push("CDSCO Circular dated January 28, 2026");
    exemptions.push("45-Day Waiting Period Waived");
    exemptions.push("Zero-day start (immediate trial commencement post-intimation)");

    const animalStudyWaiver = this.checkAnimalStudyWaiver(drugProfile);
    if (animalStudyWaiver.eligible) {
      exemptions.push(`Animal Toxicity Study: ${animalStudyWaiver.reason}`);
      regulatoryBasis.push(animalStudyWaiver.regulatoryReference);
    }

    return {
      trialType: "PRIOR_INTIMATION",
      mechanism: "PRIOR_INTIMATION",
      startDelay: 0,
      requirements,
      exemptions,
      regulatoryBasis,
      shaktiCompliance: true,
      estimatedApprovalDate: new Date(),
    };
  }

  public checkAnimalStudyWaiver(drugProfile: DrugProfile): AnimalStudyWaiver {
    if (!drugProfile.isGenericInjectable) {
      return {
        eligible: false,
        reason: "Not a generic injectable formulation",
        regulatoryReference: "N/A",
      };
    }

    if (!drugProfile.excipients || !drugProfile.referenceExcipients) {
      return {
        eligible: false,
        reason: "Excipient data not provided for comparison",
        regulatoryReference: "N/A",
      };
    }

    const excipientMatch = this.compareExcipients(
      drugProfile.excipients,
      drugProfile.referenceExcipients
    );

    if (excipientMatch.isExactMatch) {
      return {
        eligible: true,
        reason: "Excipients match reference product exactly - Animal Toxicity Study WAIVED",
        regulatoryReference: "NDCT 2026 Amendment, Notification dated January 28, 2026",
        conditions: [
          "Formulation must be identical to reference listed drug",
          "Manufacturing process equivalence required",
          "Stability data must be comparable",
        ],
      };
    }

    return {
      eligible: false,
      reason: `Excipient mismatch detected: ${excipientMatch.differences.join(", ")}`,
      regulatoryReference: "Standard NDCT Rules apply",
    };
  }

  private compareExcipients(
    test: string[],
    reference: string[]
  ): { isExactMatch: boolean; differences: string[] } {
    const testSet = new Set(test.map((e) => e.toLowerCase().trim()));
    const refSet = new Set(reference.map((e) => e.toLowerCase().trim()));

    const differences: string[] = [];

    testSet.forEach((excipient) => {
      if (!refSet.has(excipient)) {
        differences.push(`+${excipient} (not in reference)`);
      }
    });

    refSet.forEach((excipient) => {
      if (!testSet.has(excipient)) {
        differences.push(`-${excipient} (missing from test)`);
      }
    });

    return {
      isExactMatch: differences.length === 0,
      differences,
    };
  }

  public calculateSHAKTIDeadline(applicationDate: Date, trialType: "HIGH_RISK" | "STANDARD" | "EXPEDITED" | "PRIOR_INTIMATION"): {
    deadline: Date;
    daysRemaining: number;
    status: "ON_TRACK" | "WARNING" | "CRITICAL" | "EXPIRED";
    milestones: Array<{ name: string; date: Date; completed: boolean }>;
  } {
    const now = new Date();
    const deadline = new Date(applicationDate);

    let totalDays: number;
    switch (trialType) {
      case "HIGH_RISK":
        totalDays = 45;
        break;
      case "EXPEDITED":
        totalDays = 14;
        break;
      case "PRIOR_INTIMATION":
        totalDays = 14;
        break;
      default:
        totalDays = 14;
    }

    deadline.setDate(deadline.getDate() + totalDays);
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: "ON_TRACK" | "WARNING" | "CRITICAL" | "EXPIRED";
    if (daysRemaining < 0) {
      status = "EXPIRED";
    } else if (daysRemaining <= 5) {
      status = "CRITICAL";
    } else if (daysRemaining <= 15) {
      status = "WARNING";
    } else {
      status = "ON_TRACK";
    }

    const initialReviewDays = Math.max(1, Math.floor(totalDays * 0.2));
    const techEvalDays = Math.max(2, Math.floor(totalDays * 0.6));

    const milestones = [
      {
        name: "Application Submitted",
        date: applicationDate,
        completed: true,
      },
      {
        name: "Initial Review",
        date: new Date(applicationDate.getTime() + initialReviewDays * 24 * 60 * 60 * 1000),
        completed: now > new Date(applicationDate.getTime() + initialReviewDays * 24 * 60 * 60 * 1000),
      },
      {
        name: "Technical Evaluation",
        date: new Date(applicationDate.getTime() + techEvalDays * 24 * 60 * 60 * 1000),
        completed: now > new Date(applicationDate.getTime() + techEvalDays * 24 * 60 * 60 * 1000),
      },
      {
        name: "Final Decision",
        date: deadline,
        completed: false,
      },
    ];

    return {
      deadline,
      daysRemaining: Math.max(0, daysRemaining),
      status,
      milestones,
    };
  }

  public getNDCTVersion(): string {
    return this.ndctVersion;
  }
}

export default CDSCOEngine;
