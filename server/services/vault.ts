// Vault Class - PII Masking Layer for LLM Processing
// Ensures no patient-identifiable data is sent to AI models

interface PIIMaskingResult {
  maskedData: string;
  maskMap: Map<string, string>;
  piiTypesFound: string[];
  originalHash: string;
}

interface UnmaskRequest {
  maskedData: string;
  maskMap: Map<string, string>;
}

interface SensitiveField {
  pattern: RegExp;
  type: string;
  maskPrefix: string;
}

export class Vault {
  private static instance: Vault | null = null;
  private maskCounter: number = 0;
  private sessionMasks: Map<string, Map<string, string>> = new Map();

  private readonly sensitivePatterns: SensitiveField[] = [
    {
      pattern: /\+91[\-\s]?[6-9]\d{9}\b/g,
      type: "PHONE_INDIA",
      maskPrefix: "[MASKED_PHONE]",
    },
    {
      pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi,
      type: "PAN_CARD",
      maskPrefix: "[MASKED_PAN]",
    },
    {
      pattern: /\b\d{12}\b/g,
      type: "AADHAAR",
      maskPrefix: "[MASKED_AADHAAR]",
    },
    {
      pattern: /\b[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4,10}\b/gi,
      type: "VEHICLE_REG",
      maskPrefix: "[MASKED_VEHICLE]",
    },
    {
      pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      type: "EMAIL",
      maskPrefix: "[MASKED_EMAIL]",
    },
    {
      pattern: /\b[6-9]\d{9}\b/g,
      type: "PHONE_INDIA_LOCAL",
      maskPrefix: "[MASKED_PHONE]",
    },
    {
      pattern: /\b(?:\+1[\-\s]?)?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}\b/g,
      type: "PHONE_US",
      maskPrefix: "[MASKED_PHONE]",
    },
    {
      pattern: /\b\d{3}[\-\s]?\d{2}[\-\s]?\d{4}\b/g,
      type: "SSN_US",
      maskPrefix: "[MASKED_SSN]",
    },
    {
      pattern: /\b(?:MRN|MR|Patient\s*ID|Hospital\s*ID|UHID)[\s:]*[A-Z0-9\-]{4,20}\b/gi,
      type: "MEDICAL_RECORD",
      maskPrefix: "[MASKED_MRN]",
    },
    {
      pattern: /\b(?:DOB|Date\s*of\s*Birth)[\s:]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi,
      type: "DATE_OF_BIRTH",
      maskPrefix: "[MASKED_DOB]",
    },
    {
      pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g,
      type: "DATE",
      maskPrefix: "[MASKED_DATE]",
    },
    {
      pattern: /\b(?:passport\s*(?:no|number)?[\s:]*)?[A-Z][0-9]{7}\b/gi,
      type: "PASSPORT",
      maskPrefix: "[MASKED_PASSPORT]",
    },
    {
      pattern: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g,
      type: "FULL_NAME",
      maskPrefix: "[MASKED_NAME]",
    },
    {
      pattern: /\b(?:Address|Addr|Residence)[\s:]+[A-Za-z0-9\s,.\-#]{10,100}\b/gi,
      type: "ADDRESS",
      maskPrefix: "[MASKED_ADDRESS]",
    },
    {
      pattern: /\b\d{6}\b/g,
      type: "PINCODE_INDIA",
      maskPrefix: "[MASKED_PINCODE]",
    },
    {
      pattern: /\b\d{5}(?:\-\d{4})?\b/g,
      type: "ZIPCODE_US",
      maskPrefix: "[MASKED_ZIP]",
    },
    {
      pattern: /\b(?:IP|IPv4)[\s:]*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/gi,
      type: "IP_ADDRESS",
      maskPrefix: "[MASKED_IP]",
    },
    {
      pattern: /\b(?:GSTIN|GST)[\s:]*\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/gi,
      type: "GSTIN",
      maskPrefix: "[MASKED_GST]",
    },
  ];

  private constructor() {
    console.log("[Vault] PII Masking Layer initialized");
  }

  public static getInstance(): Vault {
    if (!Vault.instance) {
      Vault.instance = new Vault();
    }
    return Vault.instance;
  }

  public maskPII(data: string, sessionId?: string): PIIMaskingResult {
    const maskMap = new Map<string, string>();
    const piiTypesFound: string[] = [];
    let maskedData = data;

    const originalHash = this.hashString(data);

    for (const field of this.sensitivePatterns) {
      const matches = data.match(field.pattern);
      if (matches) {
        for (const match of matches) {
          if (!maskMap.has(match)) {
            const maskToken = field.maskPrefix;
            maskMap.set(match, maskToken);
            maskedData = maskedData.split(match).join(maskToken);

            if (!piiTypesFound.includes(field.type)) {
              piiTypesFound.push(field.type);
            }
          }
        }
      }
    }

    if (sessionId) {
      this.sessionMasks.set(sessionId, maskMap);
    }

    if (piiTypesFound.length > 0) {
      console.log(`[Vault] Masked ${maskMap.size} PII instances (${piiTypesFound.join(", ")})`);
    }

    return {
      maskedData,
      maskMap,
      piiTypesFound,
      originalHash,
    };
  }

  public unmaskPII(request: UnmaskRequest): string {
    let unmaskedData = request.maskedData;

    request.maskMap.forEach((maskToken, originalValue) => {
      unmaskedData = unmaskedData.split(maskToken).join(originalValue);
    });

    return unmaskedData;
  }

  public unmaskFromSession(maskedData: string, sessionId: string): string | null {
    const maskMap = this.sessionMasks.get(sessionId);
    if (!maskMap) {
      console.warn(`[Vault] No mask map found for session: ${sessionId}`);
      return null;
    }

    return this.unmaskPII({ maskedData, maskMap });
  }

  public clearSession(sessionId: string): void {
    this.sessionMasks.delete(sessionId);
    console.log(`[Vault] Cleared mask map for session: ${sessionId}`);
  }

  public prepareForLLM(data: Record<string, any>, sessionId?: string): {
    safeData: Record<string, any>;
    piiSummary: { totalFields: number; maskedFields: number; piiTypes: string[] };
  } {
    const jsonString = JSON.stringify(data);
    const result = this.maskPII(jsonString, sessionId);

    return {
      safeData: JSON.parse(result.maskedData),
      piiSummary: {
        totalFields: Object.keys(data).length,
        maskedFields: result.maskMap.size,
        piiTypes: result.piiTypesFound,
      },
    };
  }

  public validateNoLeakage(response: string, maskMap: Map<string, string>): {
    safe: boolean;
    leakedData: string[];
  } {
    const leakedData: string[] = [];

    maskMap.forEach((_, originalValue) => {
      if (response.includes(originalValue)) {
        leakedData.push(originalValue.substring(0, 4) + "****");
      }
    });

    return {
      safe: leakedData.length === 0,
      leakedData,
    };
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  public getStats(): {
    activeSessions: number;
    totalMasksGenerated: number;
  } {
    return {
      activeSessions: this.sessionMasks.size,
      totalMasksGenerated: this.maskCounter,
    };
  }
}

export default Vault;
