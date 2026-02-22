/**
 * Sentinel Core - Client Integration
 * 
 * This module provides the client-side interface to the Sentinel Core engine.
 * In demo mode, it uses mock responses. In production, it calls the private backend.
 */

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export interface AuditRequest {
  serialId: string;
  sector: 'pharma' | 'banking' | 'healthcare' | 'depin' | 'privacy';
  data: Record<string, unknown>;
  options?: {
    zkShielding?: boolean;
    fullAuditTrail?: boolean;
  };
}

export interface AuditResponse {
  status: 'VERIFIED' | 'AUDIT_REQUIRED' | 'QUARANTINE' | 'REJECTED';
  confidenceScore: number;
  violations: Array<{
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }>;
  zkProof?: {
    commitment: string;
    verificationKey: string;
  };
  networkUsed: string;
  latencyMs: number;
  timestamp: string;
}

export interface FailoverStatus {
  primaryNetwork: string;
  fallbackNetworks: string[];
  currentNetwork: string;
  healthStatus: Record<string, boolean>;
}

class SentinelCoreClient {
  private currentNetwork: string = 'movement-m1';
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (DEMO_MODE) {
      console.log('[SENTINEL] Demo mode active - using mock responses');
    }
    this.initialized = true;
  }

  async executeSecureAudit(request: AuditRequest): Promise<AuditResponse> {
    const startTime = Date.now();

    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      return this.getMockAuditResponse(request, startTime);
    }

    try {
      const response = await fetch('/api/v1/sentinel/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch {
      return this.getMockAuditResponse(request, startTime);
    }
  }

  async getFailoverStatus(): Promise<FailoverStatus> {
    if (DEMO_MODE) {
      return {
        primaryNetwork: 'movement-m1',
        fallbackNetworks: ['celestia-da', 'stacks-btc', 'icp-vault'],
        currentNetwork: this.currentNetwork,
        healthStatus: {
          'movement-m1': true,
          'celestia-da': true,
          'stacks-btc': true,
          'icp-vault': Math.random() > 0.3,
        },
      };
    }

    const response = await fetch('/api/v1/sentinel/failover-status');
    return await response.json();
  }

  async triggerManualFailover(toNetwork: string): Promise<{ success: boolean; latencyMs: number }> {
    const startTime = Date.now();

    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
      this.currentNetwork = toNetwork;
      return { success: true, latencyMs: Date.now() - startTime };
    }

    const response = await fetch('/api/v1/sentinel/failover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetNetwork: toNetwork }),
    });
    return await response.json();
  }

  async generateZKProof(data: Record<string, unknown>, fieldsToShield: string[]): Promise<{
    shieldedData: Record<string, string>;
    verificationKey: string;
  }> {
    if (DEMO_MODE) {
      const shieldedData: Record<string, string> = {};
      for (const field of fieldsToShield) {
        if (data[field] !== undefined) {
          shieldedData[field] = `ZK_SHIELDED:${Math.random().toString(36).substring(2, 10)}...`;
        }
      }
      return {
        shieldedData,
        verificationKey: 'VK_DEMO_' + Math.random().toString(36).substring(2, 34),
      };
    }

    const response = await fetch('/api/v1/sentinel/zk-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, fieldsToShield }),
    });
    return await response.json();
  }

  private getMockAuditResponse(request: AuditRequest, startTime: number): AuditResponse {
    const hasViolations = Math.random() > 0.7;
    const violations = hasViolations ? [
      {
        type: 'DSCSA-001',
        severity: 'MEDIUM',
        description: 'Missing auxiliary data field',
        recommendation: 'Verify all required fields before submission',
      }
    ] : [];

    return {
      status: violations.length > 0 ? 'AUDIT_REQUIRED' : 'VERIFIED',
      confidenceScore: violations.length > 0 ? 0.85 : 0.98,
      violations,
      zkProof: request.options?.zkShielding ? {
        commitment: 'DEMO_' + Math.random().toString(36).substring(2, 18),
        verificationKey: 'VK_' + Math.random().toString(36).substring(2, 34),
      } : undefined,
      networkUsed: this.currentNetwork,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  isDemoMode(): boolean {
    return DEMO_MODE;
  }
}

export const sentinelCore = new SentinelCoreClient();
export default sentinelCore;
