#!/bin/bash
# =============================================================================
# SENTINEL OS - DUAL REPOSITORY SYNC SCRIPT
# =============================================================================
# Version: 1.2.0
# Purpose: Sync code to private (full) and public (sanitized) repositories
#
# REMOTES:
#   private: https://github.com/polaruniversalai-max/sentinel-core-private
#   public:  https://github.com/polaruniversalai-max/polarGRC
#
# SECURITY:
#   - Private repo gets 100% of code including /sentinel-vault
#   - Public repo gets sanitized code WITHOUT /sentinel-vault
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  SENTINEL OS - DUAL REPOSITORY SYNC        ${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Configuration
PRIVATE_REMOTE="https://github.com/polaruniversalai-max/sentinel-core-private.git"
PUBLIC_REMOTE="https://github.com/polaruniversalai-max/polarGRC.git"
MAIN_BRANCH="main"
CLEAN_BRANCH="public-clean"

# Step 0: Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}ERROR: Must run from project root directory${NC}"
    exit 1
fi

# Step 0.5: Configure remotes if not already set
echo -e "${YELLOW}[SETUP] Configuring git remotes...${NC}"

# Check if private remote exists
if git remote get-url private &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Private remote already configured"
else
    git remote add private "$PRIVATE_REMOTE"
    echo -e "  ${GREEN}✓${NC} Added private remote"
fi

# Check if public remote exists
if git remote get-url public &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Public remote already configured"
else
    git remote add public "$PUBLIC_REMOTE"
    echo -e "  ${GREEN}✓${NC} Added public remote"
fi

echo ""
echo -e "${YELLOW}Current remotes:${NC}"
git remote -v
echo ""

# ============================================================================
# STEP A: PRIVATE BACKUP (Full code including vault)
# ============================================================================
echo -e "${BLUE}[STEP A] PRIVATE BACKUP - Full code with vault${NC}"
echo -e "  Target: $PRIVATE_REMOTE"
echo ""

# Temporarily unstage sentinel-vault from .gitignore for private push
echo -e "  ${YELLOW}→${NC} Preparing full codebase..."

# Save current .gitignore
cp .gitignore .gitignore.backup

# Create temporary .gitignore without sentinel-vault exclusion
grep -v "^sentinel-vault" .gitignore.backup > .gitignore.private || true
mv .gitignore.private .gitignore

# Stage everything including vault
git add -A
git commit -m "Full backup: $(date '+%Y-%m-%d %H:%M:%S')" --allow-empty

# Restore .gitignore
mv .gitignore.backup .gitignore

echo -e "  ${YELLOW}→${NC} Pushing to private repository..."
echo -e "  ${YELLOW}  You may be prompted for GitHub credentials${NC}"
git push private $MAIN_BRANCH --force

echo -e "  ${GREEN}✓${NC} Private backup complete!"
echo ""

# ============================================================================
# STEP B: PUBLIC PUSH (Sanitized - NO vault)
# ============================================================================
echo -e "${BLUE}[STEP B] PUBLIC PUSH - Sanitized for hackathon${NC}"
echo -e "  Target: $PUBLIC_REMOTE"
echo -e "  ${RED}EXCLUDING: /sentinel-vault (proprietary code)${NC}"
echo ""

# Create or switch to clean branch
echo -e "  ${YELLOW}→${NC} Creating sanitized branch..."
git checkout -B $CLEAN_BRANCH

# Remove sentinel-vault from this branch's index
echo -e "  ${YELLOW}→${NC} Removing proprietary files from public branch..."
git rm -r --cached sentinel-vault/ 2>/dev/null || true

# Commit the sanitized state
git commit -m "Public release: Sentinel OS v1.2 (sanitized) - $(date '+%Y-%m-%d')" --allow-empty

echo -e "  ${YELLOW}→${NC} Force-pushing to public repository..."
echo -e "  ${YELLOW}  You may be prompted for GitHub credentials${NC}"
git push public $CLEAN_BRANCH:$MAIN_BRANCH --force

echo -e "  ${GREEN}✓${NC} Public push complete!"
echo ""

# ============================================================================
# STEP C: CLEANUP - Return to main branch
# ============================================================================
echo -e "${BLUE}[STEP C] CLEANUP - Restoring workspace${NC}"

# Switch back to main branch
git checkout $MAIN_BRANCH

# Delete the temporary clean branch locally
git branch -D $CLEAN_BRANCH 2>/dev/null || true

echo -e "  ${GREEN}✓${NC} Workspace restored to main branch"
echo ""

# ============================================================================
# VERIFICATION
# ============================================================================
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  SYNC COMPLETE                             ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "  ${GREEN}✓${NC} Private repo: Full code backed up"
echo -e "  ${GREEN}✓${NC} Public repo: Sanitized code pushed"
echo -e "  ${GREEN}✓${NC} Local workspace: Unchanged (main branch)"
echo ""
echo -e "${YELLOW}Verify at:${NC}"
echo -e "  Private: https://github.com/polaruniversalai-max/sentinel-core-private"
echo -e "  Public:  https://github.com/polaruniversalai-max/polarGRC"
echo ""
