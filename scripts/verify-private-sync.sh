#!/bin/bash
# Verify private repo has all required files

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}  Private Repo Sync Verification${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""

echo -e "${YELLOW}[1/4] Local file count by folder:${NC}"
echo "----------------------------------------"
for d in server client contracts sentinel-vault enterprise_core scripts core config docs; do
    if [ -d "$d" ]; then
        COUNT=$(find "$d" -type f 2>/dev/null | wc -l)
        printf "  %-20s %5d files\n" "$d/" "$COUNT"
    fi
done
echo ""

echo -e "${YELLOW}[2/4] Git status (uncommitted changes):${NC}"
echo "----------------------------------------"
CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
if [ "$CHANGES" -eq 0 ]; then
    echo -e "  ${GREEN}✓ All changes committed${NC}"
else
    echo -e "  ${RED}⚠ $CHANGES uncommitted changes:${NC}"
    git status --short | head -10
fi
echo ""

echo -e "${YELLOW}[3/4] Commits ahead/behind origin:${NC}"
echo "----------------------------------------"
git fetch origin 2>/dev/null
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
echo "  Local is $AHEAD commits ahead of origin"
echo "  Local is $BEHIND commits behind origin"
if [ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ]; then
    echo -e "  ${GREEN}✓ Fully synced with private repo${NC}"
elif [ "$AHEAD" != "0" ]; then
    echo -e "  ${YELLOW}⚠ Run: git push origin main${NC}"
fi
echo ""

echo -e "${YELLOW}[4/4] Critical files in git:${NC}"
echo "----------------------------------------"
CRITICAL="server/services/cdsco-engine.ts server/services/vault.ts server/routes.ts client/src/App.tsx package.json README.md"
MISSING=0
for f in $CRITICAL; do
    if git ls-files --error-unmatch "$f" &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $f"
    else
        echo -e "  ${RED}✗${NC} $f (not tracked)"
        ((MISSING++))
    fi
done
echo ""

if [ "$MISSING" -eq 0 ] && [ "$AHEAD" = "0" ]; then
    echo -e "${GREEN}=============================================${NC}"
    echo -e "${GREEN}  ✓ PRIVATE REPO IS FULLY SYNCED${NC}"
    echo -e "${GREEN}=============================================${NC}"
else
    echo -e "${YELLOW}=============================================${NC}"
    echo -e "${YELLOW}  ⚠ ACTION NEEDED - See above${NC}"
    echo -e "${YELLOW}=============================================${NC}"
fi
