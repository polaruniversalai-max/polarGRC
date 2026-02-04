# PolarUniversal GRC V2 - Testnet Deployment Guide

## Overview

This guide walks you through deploying PolarUniversal smart contracts across all supported **testnet** chains. All deployments use free testnet tokens from faucets.

---

## Deployer Accounts

| Account Type | Address |
|--------------|---------|
| **Primary EVM Admin (MetaMask)** | `0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783` |
| **Movement Vault Admin** | `0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43` |

---

## Target Networks (All Testnet)

| Chain | Type | Multiplier | Status |
|-------|------|------------|--------|
| Monad Testnet | EVM | 2.5x | Ready |
| Berachain bArtio | EVM | 2.0x | Ready |
| Hyperliquid Testnet | EVM | 2.2x | Ready |
| Abstract Testnet | EVM | 1.8x | Ready |
| Story Testnet | EVM | 1.5x | Ready |
| Sepolia | EVM | 1.5x | Ready |
| Movement Testnet | Move | 3.0x | Ready |

---

## Quick Deploy Command (Sepolia)

For final verification on Sepolia Testnet:

```bash
# Using Foundry (recommended)
forge create --rpc-url https://rpc.sepolia.org \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783 \
  contracts/solidity/PolarUniversalGRC_V2.sol:PolarUniversalGRC_V2

# Or using the Dashboard
# 1. Open the app at your-repl-url
# 2. Click DEPLOY button in header
# 3. Select Sepolia and click Deploy
# 4. Confirm in MetaMask
```

---

## EVM Chain Deployments

### Chain 1: Sepolia (Final Verification)

**Faucet:** https://sepoliafaucet.com

```bash
# Deploy via Foundry
forge create --rpc-url https://rpc.sepolia.org \
  --private-key $PRIVATE_KEY \
  --constructor-args 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783 \
  contracts/solidity/PolarUniversalGRC_V2.sol:PolarUniversalGRC_V2
```

Or via Dashboard:
1. Get ETH from faucet to `0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783`
2. Click **DEPLOY** button in dashboard header
3. Select **Sepolia** and click **Deploy**
4. Confirm in MetaMask

---

### Chain 2: Monad Testnet (2.5x Multiplier)

**Faucet:** https://faucet.monad.xyz

1. Get MON tokens from faucet
2. Click **Deploy** next to Monad Testnet
3. Add network when prompted
4. Confirm deployment

---

### Chain 3: Berachain bArtio (2.0x Multiplier)

**Faucet:** https://bartio.faucet.berachain.com

1. Get BERA tokens (requires social verification)
2. Click **Deploy** next to Berachain bArtio
3. Add network and confirm

---

### Chain 4: Hyperliquid Testnet (2.2x Multiplier)

**Faucet:** https://app.hyperliquid-testnet.xyz/drip

1. Get HYPE tokens from drip faucet
2. Click **Deploy** next to Hyperliquid
3. Confirm deployment

---

### Chain 5: Abstract Testnet (1.8x Multiplier)

**Faucet:** https://faucet.abs.xyz

1. Get ETH from Abstract faucet
2. Click **Deploy** next to Abstract
3. Confirm deployment

---

### Chain 6: Story Testnet (1.5x Multiplier)

**Faucet:** https://faucet.story.foundation

1. Get IP tokens from faucet
2. Click **Deploy** next to Story
3. Confirm deployment

---

## Movement Testnet Deployment (3.0x Multiplier)

Movement uses the Move language and requires CLI deployment.

**Faucet:** https://faucet.movementlabs.xyz

### Prerequisites

```bash
# Install Movement CLI
curl -sSf https://raw.githubusercontent.com/movementlabsxyz/aptos-core/movement/scripts/cli/install.sh | bash

# Add to PATH
export PATH="$HOME/.movement/bin:$PATH"

# Initialize with Movement Testnet
movement init --network testnet --private-key YOUR_PRIVATE_KEY
```

### Deploy SecureVault Module

```bash
cd contracts/move

# Compile the module
movement move compile --named-addresses polar_universal=0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43

# Deploy to Movement Testnet (Porto)
movement move publish --named-addresses polar_universal=0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43

# Initialize the vault
movement move run --function-id '0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43::secure_vault::initialize' \
  --args address:0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783
```

---

## Contract Addresses (After Deployment)

| Chain | Network | Contract Address | Admin | Status |
|-------|---------|------------------|-------|--------|
| Sepolia | Testnet | TBD | 0x9d91...A783 | Pending |
| Monad | Testnet | TBD | 0x9d91...A783 | Pending |
| Berachain | bArtio | TBD | 0x9d91...A783 | Pending |
| Hyperliquid | Testnet | TBD | 0x9d91...A783 | Pending |
| Abstract | Testnet | TBD | 0x9d91...A783 | Pending |
| Story | Testnet | TBD | 0x9d91...A783 | Pending |
| Movement | Testnet | TBD | 0x8b31...2c43 | Pending |

---

## Verification Steps

After each deployment:

1. Copy the deployed contract address
2. Visit the chain's block explorer
3. Verify contract source code (optional)
4. Test by calling `getNetworkHealth()`

---

## Troubleshooting

### "Insufficient funds for gas"
- Visit the faucet link for that chain
- Ensure tokens are sent to `0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783`

### "Network not found"
- Click "Add Network" when MetaMask prompts
- Network details are auto-configured

### "Movement CLI not found"
```bash
export PATH="$HOME/.movement/bin:$PATH"
```

---

## Legal Disclaimer

**ALPHA STAGE: Experimental software for research only. Users assume all risk. Not for production use.**
