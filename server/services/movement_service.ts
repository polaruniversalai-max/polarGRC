/**
 * Movement M1 Blockchain Service
 * 
 * Real implementation using @aptos-labs/ts-sdk for:
 * - Ed25519 transaction signing
 * - BCS transaction serialization
 * - Real resource queries
 * - Transaction submission to Movement Testnet
 */

import crypto from "crypto";
import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";

const MOVEMENT_TESTNET_URL = "https://testnet.movementnetwork.xyz/v1";
const DEPLOYED_MODULE_ADDRESS = "0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43";
const PHARMA_MODULE_NAME = "pharma_registry";

interface DrugUnit {
  serial_id: string;
  ndc_code: string;
  lot_number: string;
  manufacturer: string;
  expiration_date: string;
  temperature_history: number[];
  custody_chain: string[];
  status: "ACTIVE" | "QUARANTINED" | "RECALLED" | "EXPIRED";
  registered_at: number;
  last_updated: number;
}

interface MovementQueryResult {
  success: boolean;
  found: boolean;
  resource: DrugUnit | null;
  resource_address: string;
  resource_type: string;
  ledger_version: number;
  explorer_url: string;
  error?: string;
}

interface QuarantineResult {
  success: boolean;
  transaction_hash: string | null;
  new_status: string;
  triggered_by: string;
  timestamp: string;
  error?: string;
}

interface LedgerInfo {
  chain_id: number;
  epoch: string;
  ledger_version: string;
  oldest_ledger_version: string;
  ledger_timestamp: string;
  node_role: string;
  oldest_block_height: string;
  block_height: string;
  git_hash: string;
}

const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: MOVEMENT_TESTNET_URL,
});

let aptosClient: Aptos | null = null;

function getAptosClient(): Aptos {
  if (!aptosClient) {
    aptosClient = new Aptos(aptosConfig);
  }
  return aptosClient;
}

function getAccountFromPrivateKey(privateKeyHex: string): Account {
  const cleanKey = privateKeyHex.startsWith("0x") 
    ? privateKeyHex.slice(2) 
    : privateKeyHex;
  
  const privateKey = new Ed25519PrivateKey(cleanKey);
  return Account.fromPrivateKey({ privateKey });
}

async function getLedgerInfo(): Promise<LedgerInfo | null> {
  try {
    const response = await fetch(MOVEMENT_TESTNET_URL);
    if (!response.ok) {
      console.error(`Movement API error: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error("Failed to fetch Movement ledger info:", e);
    return null;
  }
}

function generateResourceAddress(serialId: string): string {
  const hash = crypto.createHash("sha256").update(serialId).digest("hex");
  return `0x${hash.substring(0, 64)}`;
}

export async function verifyOnMovement(serialId: string): Promise<MovementQueryResult> {
  const resourceAddress = generateResourceAddress(serialId);
  const resourceType = `${DEPLOYED_MODULE_ADDRESS}::${PHARMA_MODULE_NAME}::DrugUnit`;
  const explorerUrl = `https://explorer.movementnetwork.xyz/account/${resourceAddress}?network=testnet`;

  try {
    const ledgerInfo = await getLedgerInfo();
    if (!ledgerInfo) {
      return {
        success: false,
        found: false,
        resource: null,
        resource_address: resourceAddress,
        resource_type: resourceType,
        ledger_version: 0,
        explorer_url: explorerUrl,
        error: "Movement testnet unreachable",
      };
    }

    const accountUrl = `${MOVEMENT_TESTNET_URL}/accounts/${resourceAddress}/resources`;
    
    try {
      const resourceResponse = await fetch(accountUrl);
      
      if (resourceResponse.status === 404) {
        return {
          success: true,
          found: false,
          resource: null,
          resource_address: resourceAddress,
          resource_type: resourceType,
          ledger_version: parseInt(ledgerInfo.ledger_version),
          explorer_url: explorerUrl,
          error: "Resource not found - batch not registered on-chain",
        };
      }

      if (resourceResponse.ok) {
        const resources = await resourceResponse.json();
        const drugUnitResource = resources.find((r: any) => 
          r.type === resourceType || r.type.includes("DrugUnit")
        );

        if (drugUnitResource) {
          const data = drugUnitResource.data;
          const drugUnit: DrugUnit = {
            serial_id: data.serial_id || serialId,
            ndc_code: data.ndc_code || "",
            lot_number: data.lot_number || "",
            manufacturer: data.manufacturer || "",
            expiration_date: data.expiration_date || "",
            temperature_history: data.temperature_history || [],
            custody_chain: data.custody_chain || [],
            status: data.status || "ACTIVE",
            registered_at: data.registered_at || 0,
            last_updated: data.last_updated || 0,
          };

          return {
            success: true,
            found: true,
            resource: drugUnit,
            resource_address: resourceAddress,
            resource_type: resourceType,
            ledger_version: parseInt(ledgerInfo.ledger_version),
            explorer_url: explorerUrl,
          };
        }
      }

      return {
        success: true,
        found: false,
        resource: null,
        resource_address: resourceAddress,
        resource_type: resourceType,
        ledger_version: parseInt(ledgerInfo.ledger_version),
        explorer_url: explorerUrl,
        error: "DrugUnit resource not found at address",
      };

    } catch (resourceError: any) {
      return {
        success: true,
        found: false,
        resource: null,
        resource_address: resourceAddress,
        resource_type: resourceType,
        ledger_version: parseInt(ledgerInfo.ledger_version),
        explorer_url: explorerUrl,
        error: `Resource query failed: ${resourceError.message}`,
      };
    }

  } catch (e: any) {
    return {
      success: false,
      found: false,
      resource: null,
      resource_address: resourceAddress,
      resource_type: resourceType,
      ledger_version: 0,
      explorer_url: explorerUrl,
      error: e.message,
    };
  }
}

export async function triggerQuarantine(
  serialId: string,
  reason: string,
  triggeredBy: string = "AI_COMPLIANCE_ENGINE"
): Promise<QuarantineResult> {
  const timestamp = new Date().toISOString();
  
  try {
    const ledgerInfo = await getLedgerInfo();
    if (!ledgerInfo) {
      return {
        success: false,
        transaction_hash: null,
        new_status: "UNKNOWN",
        triggered_by: triggeredBy,
        timestamp,
        error: "Movement testnet unreachable",
      };
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return {
        success: false,
        transaction_hash: null,
        new_status: "UNCHANGED",
        triggered_by: triggeredBy,
        timestamp,
        error: "PRIVATE_KEY environment variable required for blockchain transactions",
      };
    }

    const account = getAccountFromPrivateKey(privateKey);
    const senderAddress = account.accountAddress.toString();

    console.log(`Triggering quarantine for ${serialId} from account ${senderAddress}`);

    const accountInfoResponse = await fetch(`${MOVEMENT_TESTNET_URL}/accounts/${senderAddress}`);
    let sequenceNumber = 0;
    
    if (accountInfoResponse.ok) {
      const accountInfo = await accountInfoResponse.json();
      sequenceNumber = parseInt(accountInfo.sequence_number) || 0;
    } else if (accountInfoResponse.status === 404) {
      return {
        success: false,
        transaction_hash: null,
        new_status: "UNCHANGED",
        triggered_by: triggeredBy,
        timestamp,
        error: `Account ${senderAddress} not found on Movement - needs funding`,
      };
    }

    const payload = {
      type: "entry_function_payload",
      function: `${DEPLOYED_MODULE_ADDRESS}::${PHARMA_MODULE_NAME}::trigger_quarantine`,
      type_arguments: [],
      arguments: [serialId, reason],
    };

    const expirationTimestamp = Math.floor(Date.now() / 1000) + 600;

    const txnRequest = {
      sender: senderAddress,
      sequence_number: String(sequenceNumber),
      max_gas_amount: "100000",
      gas_unit_price: "100",
      expiration_timestamp_secs: String(expirationTimestamp),
      payload,
    };

    const signingMessage = await fetch(`${MOVEMENT_TESTNET_URL}/transactions/encode_submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(txnRequest),
    });

    if (!signingMessage.ok) {
      const errorText = await signingMessage.text();
      let errorDetail = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message?.includes("FUNCTION_NOT_FOUND")) {
          return {
            success: false,
            transaction_hash: null,
            new_status: "UNCHANGED",
            triggered_by: triggeredBy,
            timestamp,
            error: `Move function not deployed: ${DEPLOYED_MODULE_ADDRESS}::${PHARMA_MODULE_NAME}::trigger_quarantine`,
          };
        }
        errorDetail = parsed.message || errorText;
      } catch {}
      
      return {
        success: false,
        transaction_hash: null,
        new_status: "UNCHANGED",
        triggered_by: triggeredBy,
        timestamp,
        error: `Transaction encoding failed: ${errorDetail}`,
      };
    }

    const signingMessageHex = await signingMessage.json();
    const messageBytes = Buffer.from(signingMessageHex.replace(/^0x/, ""), "hex");

    const signature = account.sign(messageBytes);
    const signatureHex = signature.toString();
    const publicKeyHex = account.publicKey.toString();

    const signedTxn = {
      ...txnRequest,
      signature: {
        type: "ed25519_signature",
        public_key: publicKeyHex,
        signature: signatureHex,
      },
    };

    const submitResponse = await fetch(`${MOVEMENT_TESTNET_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signedTxn),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      let errorDetail = errorText;
      try {
        const parsed = JSON.parse(errorText);
        errorDetail = parsed.message || parsed.error_code || errorText;
      } catch {}
      
      return {
        success: false,
        transaction_hash: null,
        new_status: "UNCHANGED",
        triggered_by: triggeredBy,
        timestamp,
        error: `Transaction submission failed: ${errorDetail}`,
      };
    }

    const txResult = await submitResponse.json();
    
    return {
      success: true,
      transaction_hash: txResult.hash || null,
      new_status: "QUARANTINED",
      triggered_by: triggeredBy,
      timestamp,
    };

  } catch (e: any) {
    console.error("Quarantine transaction error:", e);
    return {
      success: false,
      transaction_hash: null,
      new_status: "ERROR",
      triggered_by: triggeredBy,
      timestamp,
      error: e.message,
    };
  }
}

export async function getMovementNetworkStatus(): Promise<{
  connected: boolean;
  network: string;
  nodeUrl: string;
  chainId?: number;
  ledgerVersion?: string;
  ledgerTimestamp?: string;
  blockHeight?: string;
  error?: string;
}> {
  try {
    const ledgerInfo = await getLedgerInfo();
    
    if (ledgerInfo) {
      return {
        connected: true,
        network: "Movement Testnet (M1)",
        nodeUrl: MOVEMENT_TESTNET_URL,
        chainId: ledgerInfo.chain_id,
        ledgerVersion: ledgerInfo.ledger_version,
        ledgerTimestamp: ledgerInfo.ledger_timestamp,
        blockHeight: ledgerInfo.block_height,
      };
    }

    return {
      connected: false,
      network: "Movement Testnet (M1)",
      nodeUrl: MOVEMENT_TESTNET_URL,
      error: "Failed to fetch ledger info",
    };
  } catch (e: any) {
    return {
      connected: false,
      network: "Movement Testnet (M1)",
      nodeUrl: MOVEMENT_TESTNET_URL,
      error: e.message,
    };
  }
}

export const MovementService = {
  verifyOnMovement,
  triggerQuarantine,
  getMovementNetworkStatus,
  getLedgerInfo,
};

export default MovementService;
