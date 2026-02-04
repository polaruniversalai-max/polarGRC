require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.8.28",
        settings: {
          evmVersion: "prague",
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    sepolia: {
      url: "https://1rpc.io/sepolia",
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
      timeout: 120000
    },
    monad: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: [PRIVATE_KEY],
      timeout: 120000
    },
    movement: {
      url: "https://mainnet.movementnetwork.xyz",
      chainId: 30730,
      accounts: [PRIVATE_KEY],
      timeout: 180000,
      gasPrice: 1000000000
    },
    berachain: {
      url: "https://bepolia.rpc.berachain.com",
      chainId: 80069,
      accounts: [PRIVATE_KEY],
      timeout: 120000
    },
    story: {
      url: "https://aeneid.storyrpc.io",
      chainId: 1315,
      accounts: [PRIVATE_KEY],
      timeout: 120000
    },
    abstract: {
      url: "https://api.testnet.abs.xyz",
      chainId: 11124,
      accounts: [PRIVATE_KEY],
      timeout: 120000
    },
    hyperliquid: {
      url: "https://rpc.hyperliquid-testnet.xyz/evm",
      chainId: 998,
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      monad: "no-api-key-required",
      movement: "no-api-key-required"
    },
    customChains: [
      {
        network: "monad",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet.monadexplorer.com/api",
          browserURL: "https://testnet.monadexplorer.com"
        }
      },
      {
        network: "movement",
        chainId: 30732,
        urls: {
          apiURL: "https://explorer.testnet.imola.movementlabs.xyz/api",
          browserURL: "https://explorer.testnet.imola.movementlabs.xyz"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
