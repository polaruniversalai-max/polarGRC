"""
Sentinel OS v1.1 - Sector Modules
=================================
Triple-Zero Standard: Zero-Downtime, Zero-Knowledge, Zero-Trust

@module modules
@version 1.1.0
@author PolarUniversal

SECTOR MODULES:
- PharmaModule: Movement M1 + Celestia DA fallback (DSCSA 2026)
- BankingModule: FET.ai Agentic AML Gateway (RBI Sandbox)
- HealthcareModule: ICP Patient Vault + Stacks Bitcoin anchoring (DPDP Act)

ORCHESTRATION:
- GlobalStateOrchestrator: <200ms RPC failover with Opik Resilience Events

COMPLIANCE:
- IndianCompliance: DPDP Act, CDSCO Audit Trail, RBI Sandbox Mode

FAILOVER LOGIC:
Each module implements Primary/Secondary/Tertiary fallback chains
for enterprise-grade resilience and Zero-Downtime compliance.
"""

from .pharma_module import PharmaModule, ShipmentTracker, MovementM1Provider, CelestiaDAProvider
from .banking_module import BankingModule, AMLGateway, FETAgentProvider
from .healthcare_module import HealthcareModule, PatientVault, ICPProvider, StacksProvider, RBACManager, RBACRole, OIPK_AVAILABLE
from .global_orchestrator import GlobalStateOrchestrator, ResilienceEvent, RPCHealth, NetworkType
from .indian_compliance import DPDPCompliance, CDSCOAuditTrail, RBISandboxMode

__version__ = "1.1.0"
__codename__ = "SENTINEL-TRIPLE-ZERO"

__all__ = [
    "PharmaModule",
    "ShipmentTracker", 
    "MovementM1Provider",
    "CelestiaDAProvider",
    "BankingModule",
    "AMLGateway",
    "FETAgentProvider",
    "HealthcareModule",
    "PatientVault",
    "ICPProvider",
    "StacksProvider",
    "RBACManager",
    "RBACRole",
    "OIPK_AVAILABLE",
    "GlobalStateOrchestrator",
    "ResilienceEvent",
    "RPCHealth",
    "NetworkType",
    "DPDPCompliance",
    "CDSCOAuditTrail",
    "RBISandboxMode",
]
