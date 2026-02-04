# Movement Network Deployment Guide

## Prerequisites

1. Install the Aptos CLI:
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

2. Or using npm:
```bash
npm install -g aptos
```

## Setup

1. Initialize your Movement account (if not already done):
```bash
aptos init --network custom --rest-url https://aptos.testnet.porto.movementlabs.xyz/v1
```

2. Get testnet MOVE tokens:
   - Visit: https://faucet.movementnetwork.xyz
   - Enter your account address
   - Request tokens

## Deploy the Contract

Run this command from the `contracts/move` directory:

```bash
aptos move publish \
  --named-addresses polar_universal=default \
  --rest-url https://aptos.testnet.porto.movementlabs.xyz/v1 \
  --assume-yes
```

## Initialize the GRC Registry

After deployment, initialize the contract:

```bash
aptos move run \
  --function-id 'YOUR_ADDRESS::grc::initialize' \
  --rest-url https://aptos.testnet.porto.movementlabs.xyz/v1 \
  --assume-yes
```

Replace `YOUR_ADDRESS` with your deployed contract address.

## Verify Deployment

Check your contract on Movement Explorer:
https://explorer.movementnetwork.xyz/account/YOUR_ADDRESS

## Contract Addresses

After deployment, update the dashboard with your contract address:
- Movement M1: `0x...` (your address here)

## Gas Costs

Movement uses MOVE tokens for gas. Typical costs:
- Contract publish: ~0.1 MOVE
- Initialize: ~0.01 MOVE
- Create compliance record: ~0.005 MOVE

## Troubleshooting

If you encounter errors:

1. **"Account not found"**: Request tokens from faucet first
2. **"Insufficient gas"**: Get more MOVE tokens
3. **"Module verification failed"**: Check Move.toml configuration

## Move.toml Configuration

Create `contracts/move/Move.toml`:

```toml
[package]
name = "PolarUniversalGRC"
version = "1.0.0"
authors = ["PolarUniversal Team"]

[addresses]
polar_universal = "_"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "mainnet" }
```
