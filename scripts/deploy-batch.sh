#!/bin/bash
# PolarUniversal GRC - Batch Multi-Chain Deployment
# Deploys to all configured EVM networks sequentially

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       POLARUNIVERSAL GRC v3.1.1-WHALE                         ║"
echo "║       BATCH MULTI-CHAIN DEPLOYMENT                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"

NETWORKS=("sepolia" "monad" "movement" "berachain" "story" "abstract" "hyperliquid")
RESULTS_FILE="deployment-results.txt"

echo "" > $RESULTS_FILE
echo "Deployment Started: $(date)" >> $RESULTS_FILE
echo "=================================" >> $RESULTS_FILE

for network in "${NETWORKS[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Deploying to: $network"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if npx hardhat run scripts/deploy-all-networks.js --network $network 2>&1; then
    echo "✅ $network: SUCCESS" >> $RESULTS_FILE
  else
    echo "❌ $network: FAILED (insufficient balance or network error)" >> $RESULTS_FILE
  fi
done

echo ""
echo "================================="
echo "DEPLOYMENT COMPLETE"
echo "================================="
echo ""
cat $RESULTS_FILE
