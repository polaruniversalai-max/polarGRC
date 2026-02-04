import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const PRIMARY_ADMIN = "0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783";
  
  console.log("=".repeat(60));
  console.log("PolarUniversal GRC V2 - Sepolia Testnet Deployment");
  console.log("=".repeat(60));
  
  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    console.error("\nInsufficient balance! Get Sepolia ETH from: https://sepoliafaucet.com");
    process.exit(1);
  }
  
  console.log("\nDeploying PolarUniversalGRC_V2...");
  console.log("Primary Admin:", PRIMARY_ADMIN);
  
  const PolarGRC = await ethers.getContractFactory("PolarUniversalGRC_V2");
  const contract = await PolarGRC.deploy(PRIMARY_ADMIN);
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\nContract Address:", contractAddress);
  console.log("Explorer Link:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress} ${PRIMARY_ADMIN}`);
  console.log("=".repeat(60));
  
  return { contractAddress, deployer: deployer.address };
}

main()
  .then((result) => {
    console.log("\nDeployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nDeployment failed:", error);
    process.exit(1);
  });
