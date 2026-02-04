import pkg from "hardhat";
const { ethers, network } = pkg;

async function main() {
  const PRIMARY_ADMIN = "0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783";
  
  console.log("=".repeat(70));
  console.log("GLOBAL COMPLIANCE OS v3.1.0-WHALE - SOVEREIGN DEPLOYMENT");
  console.log("=".repeat(70));
  console.log("\nNetwork:", network.name);
  console.log("Chain ID:", network.config.chainId);
  
  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH/Native");
  
  if (balance < ethers.parseEther("0.005")) {
    console.error("\nInsufficient balance for deployment!");
    process.exit(1);
  }
  
  // Deploy PolarUniversalGRC_V3
  console.log("\n" + "-".repeat(70));
  console.log("Deploying PolarUniversalGRC_V3 (Global Compliance OS)...");
  console.log("-".repeat(70));
  console.log("Primary Admin:", PRIMARY_ADMIN);
  console.log("Version: 3.1.0-WHALE");
  console.log("Security: Fortress (Ownable2Step, ReentrancyGuard, CEI Pattern)");
  
  const PolarGRC = await ethers.getContractFactory("PolarUniversalGRC_V3");
  const grcContract = await PolarGRC.deploy(PRIMARY_ADMIN);
  
  await grcContract.waitForDeployment();
  const grcAddress = await grcContract.getAddress();
  
  console.log("\nPolarUniversalGRC_V3 deployed to:", grcAddress);
  
  // Deploy AuditPayment (with dummy USDC for testnet)
  console.log("\n" + "-".repeat(70));
  console.log("Deploying AuditPayment (Payments Sector)...");
  console.log("-".repeat(70));
  
  // Use zero address for USDY (optional) and a placeholder USDC
  // In production, these would be real token addresses
  const DUMMY_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  
  const AuditPayment = await ethers.getContractFactory("AuditPayment");
  const paymentContract = await AuditPayment.deploy(PRIMARY_ADMIN, DUMMY_USDC, ZERO_ADDRESS);
  
  await paymentContract.waitForDeployment();
  const paymentAddress = await paymentContract.getAddress();
  
  console.log("AuditPayment deployed to:", paymentAddress);
  
  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("SOVEREIGN DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(70));
  console.log("\n  Contract                    Address");
  console.log("  " + "-".repeat(66));
  console.log(`  PolarUniversalGRC_V3        ${grcAddress}`);
  console.log(`  AuditPayment                ${paymentAddress}`);
  console.log("\n  Network:", network.name);
  console.log("  Chain ID:", network.config.chainId);
  console.log("  Primary Admin:", PRIMARY_ADMIN);
  console.log("  Version: 3.0.0-sovereign");
  
  // Explorer links based on network
  const explorers = {
    sepolia: "https://sepolia.etherscan.io/address/",
    monad: "https://testnet.monadexplorer.com/address/",
    monadTestnet: "https://testnet.monadexplorer.com/address/"
  };
  
  const explorer = explorers[network.name] || "";
  if (explorer) {
    console.log("\n  Explorer Links:");
    console.log(`  - GRC: ${explorer}${grcAddress}`);
    console.log(`  - Payments: ${explorer}${paymentAddress}`);
  }
  
  console.log("\n  Verify commands:");
  console.log(`  npx hardhat verify --network ${network.name} ${grcAddress} ${PRIMARY_ADMIN}`);
  console.log(`  npx hardhat verify --network ${network.name} ${paymentAddress} ${PRIMARY_ADMIN} ${DUMMY_USDC} ${ZERO_ADDRESS}`);
  
  console.log("\n" + "=".repeat(70));
  console.log("SYSTEM SOVEREIGN CONFIRMED");
  console.log("=".repeat(70));
  
  return { 
    grcAddress, 
    paymentAddress, 
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address 
  };
}

main()
  .then((result) => {
    console.log("\nDeployment complete!");
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nDeployment failed:", error);
    process.exit(1);
  });
