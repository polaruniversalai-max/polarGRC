"""
PolarUniversal AI-Agent Middleware for Movement M2 Mainnet
Contract: 0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43
"""

import os
import opik
from aptos_sdk.account import Account
from aptos_sdk.async_client import RestClient
from aptos_sdk.transactions import EntryFunction, TransactionArgument, TransactionPayload
from aptos_sdk.type_tag import TypeTag, StructTag

MOVEMENT_MAINNET_URL = "https://mainnet.movementnetwork.xyz/v1"
CONTRACT_ADDRESS = "0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43"
EVALUATION_THRESHOLD = 0.85

opik.configure(api_key=os.environ.get("OPIK_API_KEY"))

async def get_movement_client() -> RestClient:
    return RestClient(MOVEMENT_MAINNET_URL)

def get_agent_account() -> Account:
    private_key = os.environ.get("MOVEMENT_PRIVATE_KEY")
    if not private_key:
        raise ValueError("MOVEMENT_PRIVATE_KEY not found in environment")
    return Account.load_key(private_key)

@opik.track(name="verify_pharma_audit", project_name="polar-grc-movement")
async def verify_pharma_audit(
    batch_id: str,
    facility_id: str,
    compliance_data: dict
) -> dict:
    """
    Verify pharmaceutical audit with Opik observability tracking.
    Returns evaluation score and compliance status.
    """
    score = 0.0
    
    if compliance_data.get("gs1_verified"):
        score += 0.25
    if compliance_data.get("atp_status") == "verified":
        score += 0.25
    if compliance_data.get("dscsa_compliant"):
        score += 0.25
    if compliance_data.get("zk_proof_valid"):
        score += 0.25
    
    return {
        "batch_id": batch_id,
        "facility_id": facility_id,
        "evaluation_score": score,
        "compliant": score >= EVALUATION_THRESHOLD,
        "details": compliance_data
    }

async def execute_auditor_reward(
    auditor_address: str,
    amount: int
) -> str:
    """
    Execute token transfer from Agent Vault to Auditor.
    Only called when evaluation score > 0.85.
    """
    client = await get_movement_client()
    agent_account = get_agent_account()
    
    payload = EntryFunction.natural(
        f"{CONTRACT_ADDRESS}::polar_token",
        "transfer",
        [],
        [
            TransactionArgument(auditor_address, TransactionArgument.ADDRESS),
            TransactionArgument(amount, TransactionArgument.U64),
        ],
    )
    
    signed_txn = await client.create_bcs_signed_transaction(
        agent_account,
        TransactionPayload(payload)
    )
    tx_hash = await client.submit_bcs_transaction(signed_txn)
    await client.wait_for_transaction(tx_hash)
    
    return tx_hash

@opik.track(name="process_audit_with_reward", project_name="polar-grc-movement")
async def process_audit_with_reward(
    batch_id: str,
    facility_id: str,
    auditor_address: str,
    compliance_data: dict,
    reward_amount: int = 100
) -> dict:
    """
    Main middleware function: Verify audit and reward if score > 0.85.
    """
    audit_result = await verify_pharma_audit(batch_id, facility_id, compliance_data)
    
    result = {
        "audit": audit_result,
        "reward_executed": False,
        "tx_hash": None
    }
    
    if audit_result["evaluation_score"] > EVALUATION_THRESHOLD:
        try:
            tx_hash = await execute_auditor_reward(auditor_address, reward_amount)
            result["reward_executed"] = True
            result["tx_hash"] = tx_hash
        except Exception as e:
            result["reward_error"] = str(e)
            print(f"[TRACE] Reward execution failed: {e}")
    
    return result


if __name__ == "__main__":
    import asyncio
    
    test_data = {
        "gs1_verified": True,
        "atp_status": "verified",
        "dscsa_compliant": True,
        "zk_proof_valid": True
    }
    
    async def test():
        result = await verify_pharma_audit("BATCH-001", "FAC-IRV-001", test_data)
        print(f"Audit Result: {result}")
        print(f"Score: {result['evaluation_score']} (threshold: {EVALUATION_THRESHOLD})")
        print(f"Reward eligible: {result['evaluation_score'] > EVALUATION_THRESHOLD}")
    
    asyncio.run(test())
