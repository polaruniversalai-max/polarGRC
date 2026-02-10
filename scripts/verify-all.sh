#!/bin/bash

echo "============================================"
echo "  Sentinel OS - Sovereign Verification"
echo "  Single-Checkpoint Validation Suite"
echo "============================================"
echo ""

BASE_URL="${BASE_URL:-http://localhost:5000}"
PASSED=0
FAILED=0
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_MONTH=$(date +%m)
CURRENT_YEAR=$(date +%Y)

test_check() {
  local name="$1"
  local result="$2"
  local expected="$3"
  
  echo -n "Verifying: $name... "
  
  if echo "$result" | grep -q "$expected"; then
    echo "VERIFIED"
    ((PASSED++))
    return 0
  else
    echo "FAILED"
    echo "  Expected pattern: $expected"
    echo "  Got: $result"
    ((FAILED++))
    return 1
  fi
}

echo "--- Phase 1: PII Vault Verification ---"
echo ""

VAULT_TEST=$(curl -s -X POST "$BASE_URL/api/v1/vault/mask" \
  -H "Content-Type: application/json" \
  -d '{"data":{"aadhaar":"234567890123","email":"test@example.com","pan":"ABCDE1234F"}}')

test_check "Aadhaar Masking Active" "$VAULT_TEST" "MASKED_AADHAAR"
test_check "Email Masking Active" "$VAULT_TEST" "MASKED_EMAIL"
test_check "PAN Masking Active" "$VAULT_TEST" "MASKED_PAN"

echo ""
echo "--- Phase 2: Deadline Verification ---"
echo ""

LOW_RISK=$(curl -s -X POST "$BASE_URL/api/v1/cdsco/evaluate-trial" \
  -H "Content-Type: application/json" \
  -d '{"drugProfile":{"name":"Generic Paracetamol","category":"generic"}}')

HIGH_RISK=$(curl -s -X POST "$BASE_URL/api/v1/cdsco/evaluate-trial" \
  -H "Content-Type: application/json" \
  -d '{"drugProfile":{"name":"Cytotoxic Agent","category":"cytotoxic"}}')

test_check "Low Risk → 0-Day Start Delay" "$LOW_RISK" '"startDelay":0'
test_check "Low Risk → Prior Intimation Mechanism" "$LOW_RISK" '"mechanism":"PRIOR_INTIMATION"'
test_check "High Risk → 45-Day Start Delay" "$HIGH_RISK" '"startDelay":45'
test_check "High Risk → Test License Mechanism" "$HIGH_RISK" '"mechanism":"45_DAY_TEST_LICENSE"'

echo ""
echo "--- Phase 3: Timeline Verification ---"
echo ""

if [ "$CURRENT_MONTH" == "02" ]; then
  test_check "Low Risk Deadline in Feb 2026 (14-day window)" "$LOW_RISK" "2026-02"
  test_check "High Risk Deadline in Mar 2026 (45-day window)" "$HIGH_RISK" "2026-03"
else
  echo "Note: Date-based tests skipped (current month: $CURRENT_MONTH)"
  echo "  Low Risk deadline should be ~14 days from application"
  echo "  High Risk deadline should be ~45 days from application"
fi

echo ""
echo "--- Phase 4: Miro Integration Check ---"
echo ""

MIRO_STATUS=$(curl -s "$BASE_URL/api/v1/miro/status")

test_check "Miro SDK Available" "$MIRO_STATUS" '"available":true'

echo ""
echo "--- Phase 5: NDCT Version Verification ---"
echo ""

test_check "NDCT 2026 Amendment Reference" "$LOW_RISK" "NDCT 2026"

echo ""
echo "============================================"
echo "  Verification Results: $PASSED passed, $FAILED failed"
echo "============================================"

if [ $PASSED -gt 0 ] && [ $FAILED -eq 0 ]; then
  echo ""
  echo "  STATUS: ALL VERIFICATIONS PASSED"
  echo "  Sentinel OS is ready for deployment."
  echo ""
  exit 0
else
  echo ""
  echo "  STATUS: VERIFICATION INCOMPLETE"
  echo "  Please review failed checks above."
  echo ""
  exit 1
fi
