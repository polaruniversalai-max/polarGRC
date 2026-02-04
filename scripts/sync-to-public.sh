#!/bin/bash
# =============================================================================
# POLAR UNIVERSAL - Clean Room Public Sync (Complete Wipe + Safe Push)
# =============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SOURCE_BRANCH="main"
TEMP_DIR="/tmp/polar-public-sync-$$"
WORK_DIR=$(pwd)

echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}  Sentinel OS - Clean Room Public Sync${NC}"
echo -e "${CYAN}  (Complete Wipe + Safe Files Only)${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""

echo -e "${YELLOW}[1/6] Verifying state...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo -e "${RED}ERROR: Must be on main branch${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ On main branch${NC}"

echo -e "${YELLOW}[2/6] Creating clean temp directory...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
echo -e "${GREEN}  ✓ Temp directory ready${NC}"

echo -e "${YELLOW}[3/6] Copying safe files only...${NC}"

# Copy everything first
cp -r . "$TEMP_DIR/" 2>/dev/null || true

# Remove excluded items
cd "$TEMP_DIR"

# Remove sensitive files/folders
rm -rf .git 2>/dev/null || true
rm -rf node_modules 2>/dev/null || true
rm -rf .cache 2>/dev/null || true
rm -rf .config 2>/dev/null || true
rm -rf .local 2>/dev/null || true
rm -rf .upm 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf secrets 2>/dev/null || true
rm -rf sentinel-vault 2>/dev/null || true
rm -rf __pycache__ 2>/dev/null || true
rm -f .env .env.local .env.development .env.production 2>/dev/null || true
rm -f .replit replit.nix replit.md 2>/dev/null || true
rm -f .gitignore 2>/dev/null || true
rm -f package-lock.json 2>/dev/null || true
rm -f *.log 2>/dev/null || true
rm -rf .temp* 2>/dev/null || true

# Remove any __pycache__ nested
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name ".DS_Store" -delete 2>/dev/null || true

FILE_COUNT=$(find . -type f | wc -l)
echo -e "${GREEN}  ✓ Prepared $FILE_COUNT safe files${NC}"

echo -e "${YELLOW}[4/6] Security scan...${NC}"
ISSUES=0

# Check for hardcoded OpenAI keys (sk-proj- or sk- followed by 40+ chars)
OPENAI_KEYS=$(grep -rE 'sk-[a-zA-Z0-9]{40,}' --include="*.ts" --include="*.js" --include="*.json" . 2>/dev/null | grep -v "process.env" | grep -v "import.meta" || true)
if [ -n "$OPENAI_KEYS" ]; then
    echo -e "${RED}  ⚠ OpenAI keys found:${NC}"
    echo "$OPENAI_KEYS" | head -3
    ((ISSUES++))
fi

# Check for AWS keys
AWS_KEYS=$(grep -rE 'AKIA[A-Z0-9]{16}' --include="*.ts" --include="*.js" --include="*.json" . 2>/dev/null || true)
if [ -n "$AWS_KEYS" ]; then
    echo -e "${RED}  ⚠ AWS keys found:${NC}"
    echo "$AWS_KEYS" | head -3
    ((ISSUES++))
fi

# Check for .env files that slipped through
if find . -name ".env*" -type f 2>/dev/null | head -1 | grep -q .; then
    echo -e "${RED}  ⚠ .env files found - removing${NC}"
    find . -name ".env*" -type f -delete
fi

# Double-check sentinel-vault removed
if [ -d "sentinel-vault" ]; then
    echo -e "${RED}  ⚠ sentinel-vault/ found - removing${NC}"
    rm -rf sentinel-vault
fi

if [ $ISSUES -gt 0 ]; then
    echo -e "${RED}ABORTED: Security issues detected${NC}"
    cd "$WORK_DIR"
    rm -rf "$TEMP_DIR"
    exit 1
fi
echo -e "${GREEN}  ✓ Security scan passed${NC}"

echo -e "${YELLOW}[5/6] Initializing fresh git repo...${NC}"
git init -q
git checkout -b main 2>/dev/null || true
git add -A
git commit -q -m "Sentinel OS v1.2 - Agentic GRC Platform (Production Release)

Triple-Zero Architecture: Zero-Downtime, Zero-Knowledge, Zero-Trust
- 5-Sector Compliance Engine (Pharma, Banking, Healthcare, AI, Privacy)
- NDCT 2026 Amendment compliant with Prior-Intimation mechanism
- PII Vault with 15+ masking patterns
- Movement Network (M1) integration ready

Hackathon: DeveloperWeek 2026 + IndiaAI SHAKTI Initiative"

COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "${GREEN}  ✓ Created fresh commit: $COMMIT_HASH${NC}"

echo -e "${YELLOW}[6/6] Force pushing to public repo...${NC}"
git remote add public https://github.com/polaruniversalai-max/polarGRC.git
git push public main --force

echo -e "${GREEN}  ✓ Pushed to polarGRC${NC}"

# Cleanup
cd "$WORK_DIR"
rm -rf "$TEMP_DIR"

echo ""
echo -e "${CYAN}=============================================${NC}"
echo -e "${GREEN}  ✓ PUBLIC SYNC COMPLETE${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""
echo -e "  Public repo now contains ONLY safe files."
echo -e "  Old history completely replaced."
echo ""
echo -e "  ${RED}Excluded from public:${NC}"
echo -e "    ✗ .env* / secrets/ / .replit"
echo -e "    ✗ sentinel-vault/ (proprietary)"
echo -e "    ✗ node_modules/ / dist/ / .cache/"
echo -e "    ✗ .config/ / .local/ / replit.*"
echo ""
