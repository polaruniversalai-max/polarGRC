#!/bin/bash

echo "============================================"
echo "  Sentinel OS - Compliance Test Suite"
echo "  NDCT 2026 Amendment Verification"
echo "============================================"
echo ""

BASE_URL="${BASE_URL:-http://localhost:5000}"
PASSED=0
FAILED=0

test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected="$5"
  
  echo -n "Testing: $name... "
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s "$BASE_URL$endpoint")
  else
    response=$(curl -s -X POST "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data")
  fi
  
  if echo "$response" | grep -q "$expected"; then
    echo "PASSED"
    ((PASSED++))
  else
    echo "FAILED"
    echo "  Expected: $expected"
    echo "  Got: $response"
    ((FAILED++))
  fi
}

echo "--- CDSCO Engine Tests ---"
echo ""

test_endpoint "HIGH_RISK Drug (Cytotoxic) → 45-Day License" \
  "POST" "/api/v1/cdsco/evaluate-trial" \
  '{"drugProfile":{"name":"Cytoxan Injectable","category":"cytotoxic","indication":"oncology"}}' \
  '"startDelay":45'

test_endpoint "HIGH_RISK → 45-Day Milestone" \
  "POST" "/api/v1/cdsco/evaluate-trial" \
  '{"drugProfile":{"name":"Narcotic Compound","category":"narcotic","indication":"pain"}}' \
  '"mechanism":"45_DAY_TEST_LICENSE"'

test_endpoint "Low Risk Drug → Prior Intimation (0-Day)" \
  "POST" "/api/v1/cdsco/evaluate-trial" \
  '{"drugProfile":{"name":"Paracetamol Generic","category":"Low Risk"}}' \
  '"startDelay":0'

test_endpoint "Generic Injectable → Prior Intimation (0-Day)" \
  "POST" "/api/v1/cdsco/evaluate-trial" \
  '{"drugProfile":{"name":"Metformin 500mg","category":"generic","isGenericInjectable":true}}' \
  '"startDelay":0'

test_endpoint "BA/BE Study → Prior Intimation (0-Day)" \
  "POST" "/api/v1/cdsco/evaluate-trial" \
  '{"drugProfile":{"name":"Atorvastatin","category":"bioequivalence","trialPhase":"BA/BE"}}' \
  '"startDelay":0'

test_endpoint "0-Day Milestone Dates Match" \
  "POST" "/api/v1/cdsco/evaluate-trial" \
  '{"drugProfile":{"name":"Generic Test Drug","category":"generic"}}' \
  '"mechanism":"PRIOR_INTIMATION"'

echo ""
echo "--- Vault PII Masking Tests ---"
echo ""

test_endpoint "Aadhaar Masking" \
  "POST" "/api/v1/vault/mask" \
  '{"data":{"aadhaar":"123456789012"}}' \
  'MASKED_AADHAAR'

test_endpoint "PAN Card Masking" \
  "POST" "/api/v1/vault/mask" \
  '{"data":{"pan":"ABCDE1234F"}}' \
  'MASKED_PAN'

test_endpoint "Email Masking" \
  "POST" "/api/v1/vault/mask" \
  '{"data":{"email":"patient@hospital.com"}}' \
  'MASKED_EMAIL'

test_endpoint "Phone Masking" \
  "POST" "/api/v1/vault/mask" \
  '{"data":{"phone":"+919876543210"}}' \
  'MASKED_PHONE'

echo ""
echo "--- Miro Integration Tests ---"
echo ""

test_endpoint "Miro Status Endpoint" \
  "GET" "/api/v1/miro/status" \
  "" \
  '"available":true'

echo ""
echo "============================================"
echo "  Results: $PASSED passed, $FAILED failed"
echo "============================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
exit 0
