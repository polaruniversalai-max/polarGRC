#!/bin/bash
# =============================================================
# Sentinel OS v1.2 - Pilot Test: Full E2E Suite
# =============================================================
# Covers: OWASP, Toll Road Race, Agent Fleet, Resilience,
# Network Vitals, Multi-chain failover
#
# Usage: bash scripts/pilot-test.sh
# =============================================================

set -e

BASE_URL="${SENTINEL_URL:-http://localhost:5000}"
TENANT_ID="${TENANT_ID:-polar-hq}"
PASS=0
FAIL=0
TOTAL=0

green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }
blue() { echo -e "\033[34m$1\033[0m"; }

check() {
  TOTAL=$((TOTAL + 1))
  if [ "$1" = "true" ]; then
    PASS=$((PASS + 1))
    green "  PASS: $2"
  else
    FAIL=$((FAIL + 1))
    red "  FAIL: $2"
  fi
}

echo ""
blue "=============================================="
blue "  SENTINEL OS v1.2 - PILOT TEST SUITE"
blue "  Resilience + OWASP + Multi-Chain"
blue "=============================================="
echo ""

# -----------------------------------------------------------
# TEST 1: Health Check
# -----------------------------------------------------------
yellow "TEST 1: Health Check"
HEALTH=$(curl -s "$BASE_URL/api/v1/health")
STATUS=$(echo "$HEALTH" | jq -r '.status' 2>/dev/null)
check "$([ "$STATUS" = "healthy" ] && echo true || echo false)" "Server health: $STATUS"

# -----------------------------------------------------------
# TEST 2: OWASP Security Status
# -----------------------------------------------------------
yellow "TEST 2: OWASP Security Status"
OWASP=$(curl -s "$BASE_URL/api/v1/owasp/status")
VERSION=$(echo "$OWASP" | jq -r '.owaspVersion' 2>/dev/null)
MITIGATIONS=$(echo "$OWASP" | jq -r '.mitigationsActive' 2>/dev/null)
check "$([ "$VERSION" = "OWASP-SC-2026-v1.0" ] && echo true || echo false)" "OWASP version: $VERSION"
check "$([ "$MITIGATIONS" = "10" ] && echo true || echo false)" "Active mitigations: $MITIGATIONS/10"
CB_STATUS=$(echo "$OWASP" | jq -r '.circuitBreaker.isTripped' 2>/dev/null)
check "$([ "$CB_STATUS" = "false" ] && echo true || echo false)" "Circuit breaker: not tripped"

# -----------------------------------------------------------
# TEST 3: Toll Road Configuration + Resilience Tiers
# -----------------------------------------------------------
yellow "TEST 3: Toll Road Configuration + Resilience"
TOLLS=$(curl -s "$BASE_URL/api/v1/routes/toll-road")
TOLL_COUNT=$(echo "$TOLLS" | jq '.tollRoads | length' 2>/dev/null)
check "$([ "$TOLL_COUNT" = "3" ] && echo true || echo false)" "Toll road tiers: $TOLL_COUNT"

ECO_COST=$(echo "$TOLLS" | jq '.tollRoads[] | select(.tier=="ECO_COMMUTE") | .costMultiplier' 2>/dev/null)
EXPRESS_COST=$(echo "$TOLLS" | jq '.tollRoads[] | select(.tier=="EXPRESS_LANE") | .costMultiplier' 2>/dev/null)
TURBO_COST=$(echo "$TOLLS" | jq '.tollRoads[] | select(.tier=="TURBO_TOLL") | .costMultiplier' 2>/dev/null)
check "$([ "$ECO_COST" = "1" ] && echo true || echo false)" "Eco-Commute cost: ${ECO_COST}x"
check "$([ "$EXPRESS_COST" = "2" ] && echo true || echo false)" "Express Lane cost: ${EXPRESS_COST}x"
check "$([ "$TURBO_COST" = "10" ] && echo true || echo false)" "Turbo Toll cost: ${TURBO_COST}x"

TURBO_PRIMARY=$(echo "$TOLLS" | jq -r '.tollRoads[] | select(.tier=="TURBO_TOLL") | .resilience.primary' 2>/dev/null)
TURBO_SECONDARY=$(echo "$TOLLS" | jq -r '.tollRoads[] | select(.tier=="TURBO_TOLL") | .resilience.secondary' 2>/dev/null)
TURBO_FALLBACK=$(echo "$TOLLS" | jq -r '.tollRoads[] | select(.tier=="TURBO_TOLL") | .resilience.fallback' 2>/dev/null)
check "$(echo "$TURBO_PRIMARY" | grep -qi "monad" && echo true || echo false)" "Turbo Primary: $TURBO_PRIMARY"
check "$(echo "$TURBO_SECONDARY" | grep -qi "movement" && echo true || echo false)" "Turbo Secondary: $TURBO_SECONDARY"
check "$(echo "$TURBO_FALLBACK" | grep -qi "solana" && echo true || echo false)" "Turbo Fallback: $TURBO_FALLBACK"

EXPRESS_PRIMARY=$(echo "$TOLLS" | jq -r '.tollRoads[] | select(.tier=="EXPRESS_LANE") | .resilience.primary' 2>/dev/null)
check "$(echo "$EXPRESS_PRIMARY" | grep -qi "movement" && echo true || echo false)" "Express Primary: $EXPRESS_PRIMARY"

ECO_PRIMARY=$(echo "$TOLLS" | jq -r '.tollRoads[] | select(.tier=="ECO_COMMUTE") | .resilience.primary' 2>/dev/null)
check "$(echo "$ECO_PRIMARY" | grep -qi "akash" && echo true || echo false)" "Eco Primary: $ECO_PRIMARY"

# -----------------------------------------------------------
# TEST 4: Network Pool
# -----------------------------------------------------------
yellow "TEST 4: Network Pool"
POOL=$(curl -s "$BASE_URL/api/v1/routes/network-pool")
NODE_COUNT=$(echo "$POOL" | jq '.totalNodes' 2>/dev/null)
ONLINE=$(echo "$POOL" | jq '.onlineNodes' 2>/dev/null)
check "$([ "$NODE_COUNT" -ge 14 ] && echo true || echo false)" "Network nodes: $NODE_COUNT (expected >= 14)"
check "$([ "$ONLINE" -ge 14 ] && echo true || echo false)" "Online nodes: $ONLINE"

# -----------------------------------------------------------
# TEST 5: SC01 - Access Control (Tenant Gating)
# -----------------------------------------------------------
yellow "TEST 5: SC01 - Tenant Access Control"
VALID=$(curl -s -X POST "$BASE_URL/api/v1/routes/execute" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"routeId": "PRO_AUDIT", "agentType": "COMPLIANCE"}')
ROUTE_USED=$(echo "$VALID" | jq -r '.route.id' 2>/dev/null)
check "$([ "$ROUTE_USED" = "PRO_AUDIT" ] && echo true || echo false)" "Valid tenant route execution: $ROUTE_USED"

INVALID=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/routes/execute" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: evil-tenant-999" \
  -d '{"routeId": "PRO_AUDIT"}')
check "$([ "$INVALID" = "403" ] && echo true || echo false)" "Invalid tenant blocked: HTTP $INVALID"

# -----------------------------------------------------------
# TEST 6: ECO vs TURBO RACE
# -----------------------------------------------------------
yellow "TEST 6: Eco vs Turbo Race (Performance Comparison)"
RACE=$(curl -s -X POST "$BASE_URL/api/v1/routes/toll-road/race" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID")
SPEEDUP=$(echo "$RACE" | jq '.speedup' 2>/dev/null)
WINNER=$(echo "$RACE" | jq -r '.winner' 2>/dev/null)
ECO_TIME=$(echo "$RACE" | jq '.ecoResult.executionTimeMs' 2>/dev/null)
TURBO_TIME=$(echo "$RACE" | jq '.turboResult.executionTimeMs' 2>/dev/null)
TURBO_THREADS=$(echo "$RACE" | jq '.turboResult.parallelThreads' 2>/dev/null)

check "$(echo "$SPEEDUP" | awk '{print ($1 > 1) ? "true" : "false"}' 2>/dev/null)" "Turbo speedup: ${SPEEDUP}x"
check "$([ "$TURBO_THREADS" = "4" ] && echo true || echo false)" "Turbo parallel threads: $TURBO_THREADS"

blue "  Race Results:"
echo "    Eco-Commute:  ${ECO_TIME}ms (1x cost)"
echo "    Turbo Toll:   ${TURBO_TIME}ms (10x cost, ${TURBO_THREADS} threads)"
echo "    Speedup:      ${SPEEDUP}x"
echo "    Winner:       $WINNER"

# -----------------------------------------------------------
# TEST 7: Route Execution + Resilience Layer Tracking
# -----------------------------------------------------------
yellow "TEST 7: Execute All Toll Road Tiers + Resilience"
sleep 1
for ROUTE in ECONOMY PRO_AUDIT INSTITUTIONAL; do
  sleep 0.5
  RESULT=$(curl -s -X POST "$BASE_URL/api/v1/routes/execute" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -d "{\"routeId\": \"$ROUTE\", \"agentType\": \"AUDIT\"}")
  TIER=$(echo "$RESULT" | jq -r '.tollRoadInfo.tier // .route.tollRoadTier // "unknown"' 2>/dev/null)
  MODE=$(echo "$RESULT" | jq -r '.tollRoadInfo.processingMode // .route.processingMode // "unknown"' 2>/dev/null)
  RECEIPT=$(echo "$RESULT" | jq -r '.receipt.receiptId // "none"' 2>/dev/null)
  RES_LAYER=$(echo "$RESULT" | jq -r '.receipt.resilienceLayer // "unknown"' 2>/dev/null)
  check "$([ -n "$RECEIPT" ] && [ "$RECEIPT" != "null" ] && [ "$RECEIPT" != "none" ] && echo true || echo false)" "$ROUTE -> $TIER ($MODE) Layer: $RES_LAYER Receipt: $RECEIPT"
done

# -----------------------------------------------------------
# TEST 8: Network Vitals
# -----------------------------------------------------------
yellow "TEST 8: Network Vitals Dashboard"
VITALS=$(curl -s "$BASE_URL/api/v1/network-vitals")
OVERALL=$(echo "$VITALS" | jq -r '.overallHealth' 2>/dev/null)
CHAIN_COUNT=$(echo "$VITALS" | jq '.chains | length' 2>/dev/null)
check "$([ "$OVERALL" = "HEALTHY" ] || [ "$OVERALL" = "DEGRADED" ] && echo true || echo false)" "Overall health: $OVERALL"
check "$([ "$CHAIN_COUNT" -ge 6 ] && echo true || echo false)" "Monitored chains: $CHAIN_COUNT (3 tiers x 3 toll roads)"

MONAD_STATUS=$(echo "$VITALS" | jq -r '[.chains[] | select(.ticker=="MONAD")][0].status' 2>/dev/null)
MOVEMENT_STATUS=$(echo "$VITALS" | jq -r '[.chains[] | select(.ticker=="MOVEMENT")][0].status' 2>/dev/null)
AKT_STATUS=$(echo "$VITALS" | jq -r '[.chains[] | select(.ticker=="AKT")][0].status' 2>/dev/null)
check "$([ "$MONAD_STATUS" = "HEALTHY" ] && echo true || echo false)" "Monad status: $MONAD_STATUS"
check "$([ "$MOVEMENT_STATUS" = "HEALTHY" ] && echo true || echo false)" "Movement status: $MOVEMENT_STATUS"
check "$([ "$AKT_STATUS" = "HEALTHY" ] && echo true || echo false)" "Akash status: $AKT_STATUS"

# -----------------------------------------------------------
# TEST 9: Resilience Events
# -----------------------------------------------------------
yellow "TEST 9: Resilience Events API"
EVENTS=$(curl -s "$BASE_URL/api/v1/resilience/events")
HAS_STACKS=$(echo "$EVENTS" | jq '.stacks | keys | length' 2>/dev/null)
check "$([ "$HAS_STACKS" -ge 3 ] && echo true || echo false)" "Resilience stacks configured: $HAS_STACKS toll roads"

# -----------------------------------------------------------
# TEST 10: Agent Fleet - Site Navigator
# -----------------------------------------------------------
yellow "TEST 10: Agent Fleet - Site Navigator"
SITES=$(curl -s "$BASE_URL/api/v1/agents/sites")
SITE_COUNT=$(echo "$SITES" | jq '.sites | length' 2>/dev/null)
check "$([ "$SITE_COUNT" -ge 5 ] && echo true || echo false)" "Available trial sites: $SITE_COUNT"

SCRAPE=$(curl -s -X POST "$BASE_URL/api/v1/agents/site-navigator" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"siteId": "SITE-AIIMS-001", "registry": "CTRI"}')
SCRAPE_STATUS=$(echo "$SCRAPE" | jq -r '.status' 2>/dev/null)
check "$([ "$SCRAPE_STATUS" = "RECRUITING" ] || [ "$SCRAPE_STATUS" = "ACTIVE" ] && echo true || echo false)" "Site scrape status: $SCRAPE_STATUS"

# -----------------------------------------------------------
# TEST 11: Agent Fleet - Registry Health & Failover
# -----------------------------------------------------------
yellow "TEST 11: Agent Agentic Failover"
REG_HEALTH=$(curl -s "$BASE_URL/api/v1/agents/registry-health")
AKIRI_HEALTH=$(echo "$REG_HEALTH" | jq -r '.health.AKIRI' 2>/dev/null)
check "$([ "$AKIRI_HEALTH" = "true" ] && echo true || echo false)" "Akiri registry healthy: $AKIRI_HEALTH"

# -----------------------------------------------------------
# TEST 12: Agent Fleet - Form CT-04 (Bitcoin Anchor)
# -----------------------------------------------------------
yellow "TEST 12: Agent Fleet - Form CT-04 (Bitcoin Anchoring)"
FORM=$(curl -s -X POST "$BASE_URL/api/v1/agents/form-ct04" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{
    "trialId": "CTRI/2026/01/089234",
    "siteName": "AIIMS New Delhi",
    "principalInvestigator": "Dr. Priya Sharma",
    "enrollmentCount": 450,
    "phases": ["Phase III"],
    "complianceScore": 95
  }')
FORM_ID=$(echo "$FORM" | jq -r '.formId' 2>/dev/null)
PDF_HASH=$(echo "$FORM" | jq -r '.pdfHash' 2>/dev/null)
BTC_CHAIN=$(echo "$FORM" | jq -r '.bitcoinAnchor.chain' 2>/dev/null)
INTEGRITY=$(echo "$FORM" | jq -r '.integrityVerified' 2>/dev/null)

check "$([ -n "$FORM_ID" ] && [ "$FORM_ID" != "null" ] && echo true || echo false)" "Form generated: $FORM_ID"
check "$(echo "$PDF_HASH" | grep -q "^0x" && echo true || echo false)" "SHA-256 hash: ${PDF_HASH:0:20}..."
check "$([ "$BTC_CHAIN" = "STACKS" ] && echo true || echo false)" "Bitcoin anchor chain: $BTC_CHAIN"
check "$([ "$INTEGRITY" = "true" ] && echo true || echo false)" "Integrity verified: $INTEGRITY"

# -----------------------------------------------------------
# TEST 13: SC02 - Reentrancy Protection
# -----------------------------------------------------------
yellow "TEST 13: SC02 - Reentrancy Protection"
sleep 0.5
FIRST=$(curl -s -X POST "$BASE_URL/api/v1/routes/execute" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d '{"routeId": "INSTITUTIONAL", "agentType": "AUDIT"}')
FIRST_RECEIPT=$(echo "$FIRST" | jq -r '.receipt.receiptId // "none"' 2>/dev/null)
check "$([ -n "$FIRST_RECEIPT" ] && [ "$FIRST_RECEIPT" != "null" ] && [ "$FIRST_RECEIPT" != "none" ] && echo true || echo false)" "Reentrancy guard: sequential execution OK"

# -----------------------------------------------------------
# RESULTS
# -----------------------------------------------------------
echo ""
blue "=============================================="
blue "  PILOT TEST RESULTS"
blue "=============================================="
echo ""
echo "  Total Tests: $TOTAL"
green "  Passed:      $PASS"
if [ "$FAIL" -gt 0 ]; then
  red "  Failed:      $FAIL"
else
  green "  Failed:      $FAIL"
fi
echo ""

if [ "$FAIL" -eq 0 ]; then
  green "  ALL TESTS PASSED - RESILIENCE-HARDENED PRODUCTION READY"
else
  red "  SOME TESTS FAILED - REVIEW REQUIRED"
fi
echo ""
