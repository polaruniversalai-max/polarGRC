#!/usr/bin/env node
/**
 * PolarUniversal GRC - Multi-Chain Deployment Script
 * Deploys to all 14 configured networks using Hardhat
 * 
 * Usage: npx hardhat run scripts/deploy-all-networks.js
 * Or for specific network: npx hardhat run scripts/deploy-all-networks.js --network sepolia
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEPLOYMENT_LOG_FILE = "deployments.json";

const ALL_NETWORKS = [
  "sepolia",
  "monad", 
  "movement",
  "berachain",
  "story",
  "abstract",
  "hyperliquid"
];

const NETWORK_DISPLAY_NAMES = {
  sepolia: "Ethereum Sepolia",
  monad: "Monad Testnet",
  movement: "Movement M2 Mainnet",
  berachain: "Berachain Bepolia",
  story: "Story Aeneid",
  abstract: "Abstract Testnet",
  hyperliquid: "Hyperliquid Testnet"
};

const EXPLORER_URLS = {
  sepolia: "https://sepolia.etherscan.io",
  monad: "https://testnet.monadexplorer.com",
  movement: "https://explorer.movementnetwork.xyz",
  berachain: "https://bepolia.beratrail.io",
  story: "https://aeneid.storyscan.xyz",
  abstract: "https://explorer.testnet.abs.xyz",
  hyperliquid: "https://explorer.hyperliquid-testnet.xyz"
};

function loadDeployments() {
  try {
    if (fs.existsSync(DEPLOYMENT_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(DEPLOYMENT_LOG_FILE, "utf8"));
    }
  } catch (e) {
    console.log("Creating new deployments log...");
  }
  return { deployments: [], lastUpdated: null };
}

function saveDeployments(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DEPLOYMENT_LOG_FILE, JSON.stringify(data, null, 2));
  console.log(`Deployments saved to ${DEPLOYMENT_LOG_FILE}`);
}

async function deployContract(contractName, constructorArgs = []) {
  const network = hre.network.name;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Deploying ${contractName} to ${NETWORK_DISPLAY_NAMES[network] || network}`);
  console.log(`${"=".repeat(60)}`);

  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} native tokens`);

    if (balance === 0n) {
      throw new Error(`No balance on ${network}. Get testnet tokens first.`);
    }

    console.log(`\nCompiling contract...`);
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    
    console.log(`Deploying...`);
    const contract = await ContractFactory.deploy(...constructorArgs);
    
    console.log(`Waiting for deployment...`);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    const deployTx = contract.deploymentTransaction();
    
    console.log(`\n✅ SUCCESS!`);
    console.log(`Contract Address: ${address}`);
    console.log(`Transaction Hash: ${deployTx.hash}`);
    console.log(`Explorer: ${EXPLORER_URLS[network]}/address/${address}`);

    return {
      network,
      networkName: NETWORK_DISPLAY_NAMES[network] || network,
      contractName,
      address,
      txHash: deployTx.hash,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      explorerUrl: `${EXPLORER_URLS[network]}/address/${address}`,
      status: "success"
    };

  } catch (error) {
    console.error(`\n❌ FAILED: ${error.message}`);
    return {
      network,
      networkName: NETWORK_DISPLAY_NAMES[network] || network,
      contractName,
      error: error.message,
      timestamp: new Date().toISOString(),
      status: "failed"
    };
  }
}

async function deployPolarUniversalGRC() {
  const [deployer] = await hre.ethers.getSigners();
  return deployContract("PolarUniversalGRC_V3", [deployer.address]);
}

async function deployGlobalComplianceRegistry() {
  return deployContract("GlobalComplianceRegistry", []);
}

async function deploySwitchableProvider() {
  return deployContract("SwitchableProvider", []);
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       POLARUNIVERSAL GRC v3.1.1-WHALE                         ║
║       MULTI-CHAIN DEPLOYMENT ENGINE                           ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const network = hre.network.name;
  const deploymentData = loadDeployments();

  if (network === "hardhat" || network === "localhost") {
    console.log("Deploying to local network for testing...");
    const result = await deployPolarUniversalGRC();
    deploymentData.deployments.push(result);
    saveDeployments(deploymentData);
    return;
  }

  console.log(`Deploying to: ${NETWORK_DISPLAY_NAMES[network] || network}`);
  
  const grcResult = await deployPolarUniversalGRC();
  deploymentData.deployments.push(grcResult);

  saveDeployments(deploymentData);

  console.log(`\n${"=".repeat(60)}`);
  console.log("DEPLOYMENT SUMMARY");
  console.log(`${"=".repeat(60)}`);
  
  const successCount = deploymentData.deployments.filter(d => d.status === "success").length;
  const failCount = deploymentData.deployments.filter(d => d.status === "failed").length;
  
  console.log(`Total Deployments: ${deploymentData.deployments.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  console.log(`\nRecent Deployments:`);
  deploymentData.deployments.slice(-5).forEach(d => {
    const status = d.status === "success" ? "✅" : "❌";
    console.log(`  ${status} ${d.networkName}: ${d.address || d.error}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
