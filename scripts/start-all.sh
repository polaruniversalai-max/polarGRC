#!/bin/bash
echo "==================================="
echo " SENTINEL OS v1.2 - Full Stack Boot"
echo " Multi-Tenant SaaS Architecture"
echo "==================================="
echo ""

export DEFAULT_TENANT_ID="polar-hq"

echo "[1/2] Starting Web Dashboard (port 5000)..."
echo "  Default Tenant: $DEFAULT_TENANT_ID"
npm run dev &
WEB_PID=$!

echo "[2/2] Starting Mobile Bundler..."
if [ -d "mobile" ] && [ -f "mobile/package.json" ]; then
  cd mobile
  if [ ! -d "node_modules" ]; then
    echo "[Mobile] Installing dependencies..."
    npm install --silent
  fi
  npx expo start --web --port 8081 &
  MOBILE_PID=$!
  cd ..
else
  echo "[Mobile] mobile/ directory not found. Skipping."
fi

echo ""
echo "[Sentinel OS] All systems booting..."
echo "  Web:     http://localhost:5000"
echo "  Mobile:  http://localhost:8081"
echo "  Tenants: polar-hq, apollo-pharma, axis-bank, medanta-health"
echo ""
wait $WEB_PID $MOBILE_PID
