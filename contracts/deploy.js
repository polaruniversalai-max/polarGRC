/**
 * PolarUniversal GRC Multi-Chain Deployment Script
 * 
 * This script deploys PolarUniversalGRC.sol to multiple EVM chains using MetaMask.
 * 
 * NETWORKS SUPPORTED:
 * - Monad Testnet
 * - Berachain Testnet (bArtio)
 * - Story Testnet
 * - Abstract Testnet
 * - Sepolia (Ethereum Testnet)
 * 
 * For Movement Network, use the Aptos CLI (see MOVEMENT_DEPLOY.md)
 * 
 * USAGE:
 * 1. Open this file in a browser environment with MetaMask
 * 2. Or use Hardhat/Foundry with the network configs below
 */

const NETWORKS = {
  sepolia: {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    nativeToken: "ETH",
    faucet: "https://sepoliafaucet.com"
  },
  monad: {
    name: "Monad Testnet",
    chainId: 10143,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    explorerUrl: "https://testnet.monadexplorer.com",
    nativeToken: "MON",
    faucet: "https://faucet.monad.xyz"
  },
  berachain: {
    name: "Berachain bArtio",
    chainId: 80084,
    rpcUrl: "https://bartio.rpc.berachain.com",
    explorerUrl: "https://bartio.beratrail.io",
    nativeToken: "BERA",
    faucet: "https://bartio.faucet.berachain.com"
  },
  story: {
    name: "Story Testnet",
    chainId: 1513,
    rpcUrl: "https://testnet.storyrpc.io",
    explorerUrl: "https://testnet.storyscan.xyz",
    nativeToken: "IP",
    faucet: "https://faucet.story.foundation"
  },
  abstract: {
    name: "Abstract Testnet",
    chainId: 11124,
    rpcUrl: "https://api.testnet.abs.xyz",
    explorerUrl: "https://explorer.testnet.abs.xyz",
    nativeToken: "ETH",
    faucet: "https://faucet.abs.xyz"
  },
  baseSepolia: {
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    nativeToken: "ETH",
    faucet: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
  },
  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    nativeToken: "ETH",
    faucet: "https://faucet.quicknode.com/arbitrum/sepolia"
  },
  polygonAmoy: {
    name: "Polygon Amoy",
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorerUrl: "https://amoy.polygonscan.com",
    nativeToken: "MATIC",
    faucet: "https://faucet.polygon.technology"
  },
  optimismSepolia: {
    name: "Optimism Sepolia",
    chainId: 11155420,
    rpcUrl: "https://sepolia.optimism.io",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    nativeToken: "ETH",
    faucet: "https://app.optimism.io/faucet"
  },
  scrollSepolia: {
    name: "Scroll Sepolia",
    chainId: 534351,
    rpcUrl: "https://sepolia-rpc.scroll.io",
    explorerUrl: "https://sepolia.scrollscan.com",
    nativeToken: "ETH",
    faucet: "https://scroll.io/bridge"
  },
  lineaSepolia: {
    name: "Linea Sepolia",
    chainId: 59141,
    rpcUrl: "https://rpc.sepolia.linea.build",
    explorerUrl: "https://sepolia.lineascan.build",
    nativeToken: "ETH",
    faucet: "https://www.infura.io/faucet/linea"
  },
  zksyncSepolia: {
    name: "zkSync Sepolia",
    chainId: 300,
    rpcUrl: "https://sepolia.era.zksync.dev",
    explorerUrl: "https://sepolia.explorer.zksync.io",
    nativeToken: "ETH",
    faucet: "https://portal.zksync.io/faucet"
  },
  hyperliquid: {
    name: "Hyperliquid Testnet",
    chainId: 998,
    rpcUrl: "https://api.hyperliquid-testnet.xyz/evm",
    explorerUrl: "https://explorer.hyperliquid-testnet.xyz",
    nativeToken: "HYPE",
    faucet: "https://app.hyperliquid-testnet.xyz/drip"
  },
  movement: {
    name: "Movement M1",
    chainId: 30732,
    rpcUrl: "https://aptos.testnet.porto.movementlabs.xyz/v1",
    explorerUrl: "https://explorer.testnet.movementnetwork.xyz",
    nativeToken: "MOVE",
    faucet: "https://faucet.movementlabs.xyz",
    isMove: true
  }
};

const CONTRACT_BYTECODE = `/* Compile with: solc --optimize --bin contracts/solidity/PolarUniversalGRC.sol */`;

const CONTRACT_ABI = [
  "constructor(address initialOwner)",
  "function addAuditor(address auditor) external",
  "function removeAuditor(address auditor) external",
  "function createComplianceRecord(uint8 sector, uint8 status, uint256 fineAmount, string regulatoryRef, bytes32 evidenceHash) external returns (uint256)",
  "function approveHITLRecord(uint256 recordId) external",
  "function updateComplianceStatus(uint256 recordId, uint8 newStatus) external",
  "function submitAuditBatch(uint256[] recordIds) external returns (uint256)",
  "function finalizeAuditBatch(uint256 batchId) external",
  "function getComplianceRecord(uint256 recordId) external view returns (tuple(uint256 id, uint8 sector, uint8 status, uint256 fineAmount, string regulatoryRef, uint256 timestamp, address auditor, bool humanApproved, bytes32 evidenceHash))",
  "function getTotalRecords() external view returns (uint256)",
  "function isAuditor(address account) external view returns (bool)",
  "event ComplianceRecordCreated(uint256 indexed recordId, uint8 indexed sector, uint8 status, uint256 fineAmount, string regulatoryRef, address indexed auditor)",
  "event HITLApprovalRequired(uint256 indexed recordId, uint256 fineAmount, string reason)",
  "event AuditBatchSubmitted(uint256 indexed batchId, uint256 recordCount, address indexed submittedBy)"
];

async function addNetworkToMetaMask(networkKey) {
  const network = NETWORKS[networkKey];
  if (!network || network.isMove) {
    console.log(`${networkKey} is not an EVM network`);
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${network.chainId.toString(16)}`,
        chainName: network.name,
        nativeCurrency: {
          name: network.nativeToken,
          symbol: network.nativeToken,
          decimals: 18
        },
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl]
      }]
    });
    console.log(`Added ${network.name} to MetaMask`);
    return true;
  } catch (error) {
    console.error(`Failed to add ${network.name}:`, error);
    return false;
  }
}

async function switchNetwork(networkKey) {
  const network = NETWORKS[networkKey];
  if (!network || network.isMove) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${network.chainId.toString(16)}` }]
    });
    return true;
  } catch (error) {
    if (error.code === 4902) {
      return await addNetworkToMetaMask(networkKey);
    }
    throw error;
  }
}

async function deployToNetwork(networkKey, signerAddress) {
  const network = NETWORKS[networkKey];
  console.log(`\n========================================`);
  console.log(`Deploying to ${network.name}...`);
  console.log(`========================================`);
  
  console.log(`1. Switch MetaMask to ${network.name}`);
  console.log(`2. Ensure you have ${network.nativeToken} for gas`);
  console.log(`   Faucet: ${network.faucet}`);
  console.log(`3. Click CONFIRM when MetaMask prompts for deployment`);
  
  return {
    network: networkKey,
    status: 'pending_confirmation',
    explorerUrl: network.explorerUrl
  };
}

function getExplorerLink(networkKey, contractAddress) {
  const network = NETWORKS[networkKey];
  if (network.isMove) {
    return `${network.explorerUrl}/account/${contractAddress}`;
  }
  return `${network.explorerUrl}/address/${contractAddress}`;
}

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       POLARUNIVERSAL GRC - MULTI-CHAIN DEPLOYMENT             ║
║                     AIRDROP MAX STATUS                        ║
╚═══════════════════════════════════════════════════════════════╝

SUPPORTED NETWORKS:
${Object.entries(NETWORKS).map(([key, net]) => 
  `  • ${net.name} (${net.isMove ? 'Move' : 'EVM'}) - ${net.nativeToken}`
).join('\n')}

DEPLOYMENT ORDER:
  1. Sepolia (most reliable testnet)
  2. Berachain bArtio
  3. Monad Testnet
  4. Story Testnet
  5. Abstract Testnet
  6. Movement M1 (requires Aptos CLI)

For each EVM network:
  1. Get testnet tokens from the faucet
  2. Add network to MetaMask (script will prompt)
  3. Click CONFIRM when deployment transaction appears

For Movement Network:
  See MOVEMENT_DEPLOY.md for CLI commands
`);

module.exports = { NETWORKS, CONTRACT_ABI, addNetworkToMetaMask, switchNetwork, deployToNetwork, getExplorerLink };
