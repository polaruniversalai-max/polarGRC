#!/usr/bin/env python3
"""
Sentinel OS v1.1 - Global Compliance Operating System
=====================================================
Triple-Zero Standard: Zero-Downtime, Zero-Knowledge, Zero-Trust

Multi-Sector Compliance Engine:
- Pharma: Movement M1 + Celestia DA (DSCSA 2026, FDA 21 CFR Part 11)
- Banking: FET.ai Agentic AML (RBI Sandbox, FATF)
- Healthcare: ICP Patient Vault + Stacks Bitcoin Anchoring (DPDP Act, HIPAA)

Indian Localization (February 2026):
- DPDP Act data residency compliance
- CDSCO Biopharma Shakti audit trails
- RBI Regulatory Sandbox mode

@module main
@version 1.1.0
@author PolarUniversal

Opik Observability: polar-grc-enterprise
"""

import asyncio
import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import opik
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False

try:
    from core.logger import get_logger, Logger
    from interface.theme import TERMINAL_COLORS, StatusLevel, format_terminal_output
    CORE_AVAILABLE = True
except ImportError:
    CORE_AVAILABLE = False
    get_logger = None

from modules import (
    PharmaModule,
    BankingModule,
    HealthcareModule,
    GlobalStateOrchestrator,
    DPDPCompliance,
    CDSCOAuditTrail,
    RBISandboxMode,
    NetworkType,
    ResilienceEvent,
    RBACManager,
    RBACRole,
    OIPK_AVAILABLE
)
from modules.pharma_module import ShipmentRecord
from modules.banking_module import TransactionType, RiskLevel
from modules.healthcare_module import RecordType, DataResidency
from modules.indian_compliance import CDSCOTrialPhase, RBISandboxCategory, DPDPDataCategory

try:
    from enterprise_core.compliance.oipk_engine import ZKProofGenerator, PharmaTrialLog, ProofType
    ZK_ENGINE_AVAILABLE = True
except ImportError:
    ZK_ENGINE_AVAILABLE = False
    ZKProofGenerator = None
    PharmaTrialLog = None

# Use theme colors if available, otherwise fallback
if CORE_AVAILABLE:
    EMERALD = TERMINAL_COLORS["EMERALD"]
    GOLD = TERMINAL_COLORS["GOLD"]
    RED = TERMINAL_COLORS["RED"]
    RESET = TERMINAL_COLORS["RESET"]
    BOLD = TERMINAL_COLORS["BOLD"]
else:
    EMERALD = "\033[38;5;48m"
    GOLD = "\033[38;5;220m"
    RED = "\033[38;5;196m"
    RESET = "\033[0m"
    BOLD = "\033[1m"

# Initialize structured logger
_logger = get_logger("SentinelOS") if CORE_AVAILABLE and get_logger else None


def print_banner():
    """Print Sentinel OS banner."""
    banner = f"""
{EMERALD}{BOLD}╔══════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗                ║
║   ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║                ║
║   ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║                ║
║   ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║                ║
║   ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗           ║
║   ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝           ║
║                                                                              ║
║   ██████╗ ███████╗    ██╗   ██╗ ██╗    ██╗                                   ║
║   ██╔═══██╗██╔════╝    ██║   ██║███║   ███║                                  ║
║   ██║   ██║███████╗    ██║   ██║╚██║   ╚██║                                  ║
║   ██║   ██║╚════██║    ╚██╗ ██╔╝ ██║    ██║                                  ║
║   ╚██████╔╝███████║     ╚████╔╝  ██║██╗ ██║                                  ║
║    ╚═════╝ ╚══════╝      ╚═══╝   ╚═╝╚═╝ ╚═╝                                  ║
║                                                                              ║
║   GLOBAL COMPLIANCE OPERATING SYSTEM                                        ║
║   Triple-Zero Standard: Zero-Downtime | Zero-Knowledge | Zero-Trust         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝{RESET}
"""
    print(banner)


def print_section(title: str):
    """Print section header."""
    print(f"\n{EMERALD}{BOLD}{'═' * 70}")
    print(f"  {title}")
    print(f"{'═' * 70}{RESET}")


def print_result(label: str, value, indent: int = 2):
    """Print formatted result."""
    prefix = " " * indent
    if isinstance(value, dict):
        print(f"{EMERALD}{prefix}{label}:{RESET}")
        for k, v in value.items():
            print(f"{EMERALD}{prefix}  {k}: {v}{RESET}")
    else:
        print(f"{EMERALD}{prefix}{label}: {value}{RESET}")


async def demo_pharma_module(orchestrator: GlobalStateOrchestrator):
    """Demonstrate Pharma Module with Movement M1 + Celestia failover."""
    print_section("PHARMA MODULE - Movement M1 + Celestia DA")
    
    pharma = PharmaModule(orchestrator)
    
    shipment1 = pharma.tracker.create_shipment(
        gtin="12345678901234",
        serial_number="SN-2026-001-A",
        lot_number="LOT-20260202-001",
        expiration_date="2027-12-31",
        manufacturer_gln="1234567890123",
        destination_gln="9876543210987",
        atp_verified=True
    )
    print_result("Created Shipment", shipment1.shipment_id)
    
    shipment2 = pharma.tracker.create_shipment(
        gtin="98765432109876",
        serial_number="SN-2026-002-B",
        lot_number="LOT-20260202-002",
        expiration_date="2028-06-30",
        manufacturer_gln="1234567890123",
        destination_gln="5555555555555",
        atp_verified=True
    )
    print_result("Created Shipment", shipment2.shipment_id)
    
    batch = await pharma.tracker.submit_batch()
    print_result("Batch Submitted", {
        "batch_id": batch.batch_id,
        "provider": batch.provider.value,
        "latency_ms": f"{batch.latency_ms:.1f}ms",
        "tx_hash": batch.tx_hash[:32] + "..."
    })
    
    print(f"\n{GOLD}[DEMO] Triggering Movement M1 latency spike...{RESET}")
    pharma.tracker.trigger_latency_spike()
    
    shipment3 = pharma.tracker.create_shipment(
        gtin="11111111111111",
        serial_number="SN-2026-003-C",
        lot_number="LOT-20260202-003",
        expiration_date="2027-03-15",
        manufacturer_gln="1234567890123",
        destination_gln="7777777777777"
    )
    
    batch2 = await pharma.tracker.submit_batch()
    print_result("Failover Batch", {
        "batch_id": batch2.batch_id,
        "provider": batch2.provider.value,
        "latency_ms": f"{batch2.latency_ms:.1f}ms",
        "failover_to": "Celestia DA"
    })
    
    pharma.tracker.restore_primary()
    print(f"{EMERALD}[RESTORED] Movement M1 back to healthy state{RESET}")
    
    report = await pharma.generate_compliance_report()
    print_result("DSCSA 2026 Report", report)
    
    return pharma


async def demo_banking_module(orchestrator: GlobalStateOrchestrator):
    """Demonstrate Banking Module with FET.ai AML gateway."""
    print_section("BANKING MODULE - FET.ai Agentic AML Gateway")
    
    banking = BankingModule(orchestrator, rbi_sandbox_mode=True)
    
    tx1 = banking.create_transaction(
        sender_id="SENDER-001",
        receiver_id="RECEIVER-001",
        amount=50000,
        currency="INR",
        tx_type=TransactionType.DOMESTIC
    )
    result1 = await banking.process_payment(tx1)
    print_result("Normal Transaction", {
        "tx_id": tx1.tx_id,
        "risk_score": f"{result1['risk_score']:.2f}",
        "recommendation": result1['recommendation']
    })
    
    tx2 = banking.create_transaction(
        sender_id="SENDER-002",
        receiver_id="RECEIVER-002",
        amount=750000,
        currency="INR",
        tx_type=TransactionType.CROSS_BORDER
    )
    result2 = await banking.process_payment(tx2)
    print_result("High-Value Cross-Border", {
        "tx_id": tx2.tx_id,
        "risk_score": f"{result2['risk_score']:.2f}",
        "recommendation": result2['recommendation'],
        "stacks_anchor": result2.get('stacks_anchor_hash', 'N/A')[:32] + "..."
    })
    
    print(f"\n{GOLD}[DEMO] Simulating velocity spike...{RESET}")
    for i in range(15):
        tx = banking.create_transaction(
            sender_id="SENDER-003",
            receiver_id=f"RECEIVER-{100+i}",
            amount=10000 * (i + 1),
            tx_type=TransactionType.DOMESTIC
        )
        await banking.process_payment(tx)
    
    alerts = banking.gateway.get_velocity_alerts()
    if alerts:
        print_result("Velocity Alerts Generated", len(alerts))
        for alert in alerts[-2:]:
            print_result(f"Alert {alert.alert_id}", {
                "account": alert.account_id,
                "tx_count": alert.tx_count,
                "risk_level": alert.risk_level.value
            })
    
    status = await banking.get_compliance_status()
    print_result("AML Gateway Status", status)
    
    return banking


async def demo_healthcare_module(orchestrator: GlobalStateOrchestrator):
    """Demonstrate Healthcare Module with ICP + Stacks."""
    print_section("HEALTHCARE MODULE - ICP Patient Vault + Bitcoin Finality")
    
    healthcare = HealthcareModule(DataResidency.INDIA, orchestrator)
    
    record1 = await healthcare.store_clinical_note(
        patient_id="PATIENT-001",
        note_content="Patient presents with mild hypertension. BP: 145/92. Recommended lifestyle changes.",
        consent_id="CONSENT-2026-001"
    )
    print_result("Clinical Note Stored", {
        "record_id": record1.record_id,
        "data_hash": record1.data_hash[:32] + "...",
        "icp_canister": record1.icp_canister_id[:24] + "...",
        "stacks_tx": record1.stacks_tx_hash[:32] + "..."
    })
    
    lab_data = {
        "test_type": "Complete Blood Count",
        "hemoglobin": 14.2,
        "wbc_count": 7500,
        "platelet_count": 250000
    }
    record2 = await healthcare.store_lab_result(
        patient_id="PATIENT-001",
        lab_data=lab_data,
        consent_id="CONSENT-2026-001"
    )
    print_result("Lab Result Stored", {
        "record_id": record2.record_id,
        "bitcoin_anchored": record2.stacks_tx_hash is not None,
        "data_residency": record2.data_residency.value
    })
    
    integrity = await healthcare.vault.verify_record_integrity(record1.record_id)
    print_result("Integrity Verification", integrity)
    
    status = await healthcare.get_compliance_status()
    print_result("Healthcare Compliance", status)
    
    return healthcare


async def demo_zero_knowledge_rbac():
    """Demonstrate Zero-Knowledge and Zero-Trust compliance."""
    print_section("ZERO-KNOWLEDGE & ZERO-TRUST DEMONSTRATION")
    
    rbac = RBACManager()
    rbac.register_user("PHYSICIAN-001", RBACRole.PHYSICIAN)
    rbac.register_user("AUDITOR-001", RBACRole.AUDITOR)
    rbac.register_user("NURSE-001", RBACRole.NURSE)
    rbac.register_user("PATIENT-001", RBACRole.PATIENT)
    
    print(f"\n{GOLD}[RBAC] Testing Zero-Trust Access Control...{RESET}")
    
    access_tests = [
        ("PHYSICIAN-001", "RECORD-001", "read"),
        ("PHYSICIAN-001", "RECORD-001", "write"),
        ("NURSE-001", "RECORD-001", "vitals"),
        ("NURSE-001", "RECORD-001", "prescribe"),  # Should be denied
        ("AUDITOR-001", "RECORD-001", "audit"),
        ("PATIENT-001", "RECORD-001", "read_own"),
        ("PATIENT-001", "RECORD-001", "write"),  # Should be denied
    ]
    
    for user_id, resource_id, action in access_tests:
        granted = rbac.check_access(user_id, resource_id, action)
        status = f"{EMERALD}✓ GRANTED{RESET}" if granted else f"{RED}✗ DENIED{RESET}"
        print(f"  {user_id} -> {action} on {resource_id}: {status}")
    
    metrics = rbac.get_metrics()
    print_result("RBAC Metrics", {
        "total_access_attempts": metrics["total_access_attempts"],
        "granted": metrics["granted"],
        "denied": metrics["denied"],
        "mfa_enforced": metrics["mfa_enforced"],
        "rbac_enabled": metrics["rbac_enabled"]
    })
    
    if ZK_ENGINE_AVAILABLE:
        print(f"\n{GOLD}[OIPK] Generating Zero-Knowledge Proof...{RESET}")
        
        zk_generator = ZKProofGenerator()
        
        trial_log = PharmaTrialLog(
            trial_id="TRIAL-POLAR-2026-001",
            participant_id="PART-12345",
            participant_dob="1985-05-15",
            participant_name="[REDACTED - ZK Protected]",
            dosage_mg=250.0,
            administration_date="2026-02-02",
            site_id="SITE-MUMBAI-001",
            investigator_id="INV-SHARMA-001",
            adverse_events=[],
            vitals={"bp_systolic": 120, "bp_diastolic": 80, "heart_rate": 72}
        )
        
        proof = zk_generator.prove_age_and_dosage(
            trial_log=trial_log,
            protocol_dosage=250.0,
            minimum_age=18
        )
        
        print_result("ZK Proof Generated", {
            "proof_id": proof.proof_id,
            "proof_type": proof.proof_type.value,
            "commitment": proof.commitment[:32] + "...",
            "challenge": proof.challenge[:32] + "...",
            "public_inputs": proof.public_inputs,
            "verification_key": proof.verification_key[:32] + "..."
        })
        
        structure_valid = proof.verify_structure()
        print(f"  {EMERALD}Proof Structure Valid: {'✓' if structure_valid else '✗'}{RESET}")
    else:
        print(f"{GOLD}[INFO] OIPK Engine not available - ZK demo skipped{RESET}")
    
    return rbac


async def demo_indian_compliance(orchestrator: GlobalStateOrchestrator):
    """Demonstrate Indian Compliance modules."""
    print_section("INDIAN COMPLIANCE - DPDP + CDSCO + RBI Sandbox")
    
    dpdp = DPDPCompliance(orchestrator)
    consent = await dpdp.grant_consent(
        data_principal_id="CITIZEN-IN-001",
        data_fiduciary_id="POLAR-UNIVERSAL",
        purpose="Healthcare data processing for clinical research",
        data_categories=[DPDPDataCategory.SENSITIVE_PERSONAL, DPDPDataCategory.PERSONAL],
        validity_days=365,
        cross_border=False
    )
    print_result("DPDP Consent Granted", {
        "consent_id": consent.consent_id,
        "data_principal": consent.data_principal_id,
        "cross_border": consent.cross_border_allowed,
        "icp_anchor": consent.icp_anchor_hash[:32] + "..."
    })
    
    residency = await dpdp.verify_data_residency(
        data_hash="abc123",
        storage_location="subnet-mumbai.icp.io"
    )
    print_result("Data Residency Verified", residency)
    
    cdsco = CDSCOAuditTrail(orchestrator)
    
    trial = await cdsco.register_trial(
        trial_id="TRIAL-POLAR-2026-001",
        trial_name="XR-7742 Phase 2 Study",
        sponsor="Polar Pharmaceuticals",
        phase=CDSCOTrialPhase.PHASE_2,
        sites=["SITE-MUMBAI-001", "SITE-BANGALORE-002"]
    )
    print_result("CDSCO Trial Registered", trial)
    
    audit_entry = await cdsco.log_modification(
        trial_id="TRIAL-POLAR-2026-001",
        trial_phase=CDSCOTrialPhase.PHASE_2,
        site_id="SITE-MUMBAI-001",
        action="dosage_adjustment",
        previous_value="250mg",
        new_value="275mg",
        modified_by="Dr. Sharma"
    )
    print_result("CDSCO Audit Entry", {
        "entry_id": audit_entry.entry_id,
        "action": audit_entry.action,
        "movement_tx": audit_entry.movement_tx_hash[:32] + "...",
        "accreditation": audit_entry.accreditation_standard
    })
    
    rbi = RBISandboxMode(orchestrator)
    sandbox_activation = await rbi.activate_sandbox(RBISandboxCategory.REGULATORY_COMPLIANCE)
    print_result("RBI Sandbox Activated", sandbox_activation)
    
    rbi_tx = await rbi.process_transaction(
        category=RBISandboxCategory.REGULATORY_COMPLIANCE,
        amount=500000,
        sender_ifsc="HDFC0001234",
        receiver_ifsc="ICIC0005678"
    )
    print_result("RBI Sandbox Transaction", {
        "tx_id": rbi_tx.tx_id,
        "amount": f"₹{rbi_tx.amount:,.2f}",
        "stacks_anchor": rbi_tx.stacks_anchor_hash[:32] + "..."
    })
    
    return dpdp, cdsco, rbi


async def demo_orchestrator_failover():
    """Demonstrate GlobalStateOrchestrator failover."""
    print_section("GLOBAL STATE ORCHESTRATOR - <200ms Failover")
    
    orchestrator = GlobalStateOrchestrator()
    
    health = await orchestrator.check_rpc_health(NetworkType.MOVEMENT_M1)
    print_result("Movement M1 Health", {
        "status": health.status.value,
        "latency_ms": f"{health.latency_ms:.1f}ms",
        "block_height": health.block_height
    })
    
    print(f"\n{GOLD}[DEMO] Simulating Movement M1 latency spike...{RESET}")
    orchestrator.simulate_network_issue(NetworkType.MOVEMENT_M1, latency_override=350.0)
    
    failover_result = await orchestrator.execute_failover(
        source_module="PharmaModule",
        primary=NetworkType.MOVEMENT_M1,
        reason="Latency spike detected: 350ms > 150ms threshold"
    )
    print_result("Failover Result", failover_result)
    
    orchestrator.restore_network(NetworkType.MOVEMENT_M1)
    
    triple_zero = await orchestrator.get_triple_zero_status()
    print_result("Triple-Zero Status", triple_zero)
    
    return orchestrator


async def run_full_demo():
    """Run complete Sentinel OS v1.1 demonstration."""
    print_banner()
    print(f"{EMERALD}Started: {datetime.now().isoformat()}{RESET}")
    print(f"{EMERALD}Opik Project: polar-grc-enterprise{RESET}")
    print(f"{EMERALD}Tags: Polar-GRC-Resolution-V2{RESET}")
    
    orchestrator = await demo_orchestrator_failover()
    
    await demo_pharma_module(orchestrator)
    
    await demo_banking_module(orchestrator)
    
    await demo_healthcare_module(orchestrator)
    
    await demo_indian_compliance(orchestrator)
    
    await demo_zero_knowledge_rbac()
    
    print_section("SENTINEL OS v1.1 - DEMO COMPLETE")
    
    summary = orchestrator.get_health_summary()
    print_result("System Health Summary", {
        "healthy_networks": summary["healthy_count"],
        "total_networks": summary["total_networks"],
        "resilience_events": summary["resilience_events_total"],
        "successful_failovers": summary["successful_failovers"]
    })
    
    final_status = await orchestrator.get_triple_zero_status()
    print(f"\n{EMERALD}{BOLD}TRIPLE-ZERO COMPLIANCE:{RESET}")
    print(f"{EMERALD}  Zero-Downtime: {final_status['components']['zero_downtime']['status']}{RESET}")
    print(f"{EMERALD}  Zero-Knowledge: {final_status['components']['zero_knowledge']['status']}{RESET}")
    print(f"{EMERALD}  Zero-Trust: {final_status['components']['zero_trust']['status']}{RESET}")
    print(f"{EMERALD}  Overall: {'✓ COMPLIANT' if final_status['overall_compliant'] else '✗ NON-COMPLIANT'}{RESET}")
    
    return {
        "version": "1.1.0",
        "codename": "SENTINEL-TRIPLE-ZERO",
        "timestamp": datetime.now().isoformat(),
        "triple_zero_compliant": final_status["overall_compliant"],
        "health_summary": summary,
        "modules_active": ["Pharma", "Banking", "Healthcare", "Indian Compliance"]
    }


if __name__ == "__main__":
    print(f"\n{EMERALD}{BOLD}SENTINEL OS v1.1 - GLOBAL COMPLIANCE OPERATING SYSTEM{RESET}")
    print(f"{EMERALD}Triple-Zero Standard | Multi-Sector Compliance{RESET}")
    
    try:
        result = asyncio.run(run_full_demo())
        print(f"\n{EMERALD}[SUCCESS] Demo completed successfully{RESET}")
        print(f"{EMERALD}View Opik traces: https://www.comet.com/opik/polar-universal/home{RESET}")
        sys.exit(0)
    except Exception as e:
        print(f"\n{RED}[FATAL] Demo failed: {e}{RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
