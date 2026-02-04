#!/bin/bash
# =============================================================================
# POLAR UNIVERSAL - Dual-Remote Repository Sync Script
# =============================================================================
# Purpose: Synchronize code between private (sentinel-core-private) and 
#          public (polarGRC) repositories with automatic sanitization.
#
# Workflow:
# 1. Push full codebase to PRIVATE repo (origin)
# 2. Run sanitization to strip sensitive data
# 3. Push sanitized version to PUBLIC repo
# =============================================================================

set -e

# Configuration
PRIVATE_REMOTE="origin"           # Points to sentinel-core-private
PUBLIC_REMOTE="public"            # Points to polarGRC
BRANCH="main"
TEMP_BRANCH="sanitized-public"
SANITIZE_SCRIPT="./scripts/sanitize-for-public.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  POLAR UNIVERSAL - Dual-Remote Sync${NC}"
echo -e "${BLUE}=============================================${NC}"

# Function: Check if remote exists
check_remote() {
    if ! git remote get-url "$1" &>/dev/null; then
        echo -e "${RED}Error: Remote '$1' not found${NC}"
        echo "Configure with: git remote add $1 <repository-url>"
        return 1
    fi
    return 0
}

# Function: Verify .gitignore protection
verify_gitignore() {
    echo -e "\n${YELLOW}[1/5] Verifying .gitignore protection...${NC}"
    
    local required_patterns=(
        ".env"
        ".env.local"
        ".env.production"
        "sentinel-vault/"
        "*.pem"
        "*.key"
    )
    
    local missing=0
    for pattern in "${required_patterns[@]}"; do
        if ! grep -q "$pattern" .gitignore 2>/dev/null; then
            echo -e "${RED}  Missing: $pattern${NC}"
            missing=1
        else
            echo -e "${GREEN}  Found: $pattern${NC}"
        fi
    done
    
    if [ $missing -eq 1 ]; then
        echo -e "${RED}Critical: .gitignore is missing required patterns!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}  .gitignore verified${NC}"
}

# Function: Check for secrets in staged files
check_secrets() {
    echo -e "\n${YELLOW}[2/5] Scanning for exposed secrets...${NC}"
    
    local secret_patterns=(
        "PRIVATE_KEY"
        "API_KEY"
        "SECRET"
        "PASSWORD"
        "sk_live"
        "sk_test"
        "-----BEGIN.*PRIVATE KEY-----"
    )
    
    local found_secrets=0
    for pattern in "${secret_patterns[@]}"; do
        if git diff --cached --name-only | xargs grep -l "$pattern" 2>/dev/null | head -5; then
            echo -e "${RED}  Potential secret found matching: $pattern${NC}"
            found_secrets=1
        fi
    done
    
    if [ $found_secrets -eq 1 ]; then
        echo -e "${RED}Warning: Potential secrets detected. Review before pushing.${NC}"
        read -p "Continue anyway? (y/N): " confirm
        if [ "$confirm" != "y" ]; then
            exit 1
        fi
    else
        echo -e "${GREEN}  No exposed secrets detected${NC}"
    fi
}

# Function: Push to private repository
push_private() {
    echo -e "\n${YELLOW}[3/5] Pushing to PRIVATE repository...${NC}"
    
    if check_remote "$PRIVATE_REMOTE"; then
        git push "$PRIVATE_REMOTE" "$BRANCH" --force-with-lease
        echo -e "${GREEN}  Pushed to $PRIVATE_REMOTE/$BRANCH${NC}"
    fi
}

# Function: Sanitize and push to public using isolated worktree
push_public() {
    echo -e "\n${YELLOW}[4/5] Creating sanitized worktree for PUBLIC repository...${NC}"
    
    local WORKTREE_DIR="/tmp/polar-public-sanitized"
    local CURRENT_COMMIT=$(git rev-parse HEAD)
    
    # Clean up any existing worktree
    rm -rf "$WORKTREE_DIR" 2>/dev/null || true
    git worktree prune 2>/dev/null || true
    
    # Create isolated worktree for sanitization
    git worktree add "$WORKTREE_DIR" "$BRANCH" --detach 2>/dev/null || {
        # Fallback: copy files instead of worktree
        echo -e "${YELLOW}  Worktree not available, using copy method${NC}"
        mkdir -p "$WORKTREE_DIR"
        git archive HEAD | tar -x -C "$WORKTREE_DIR"
    }
    
    # Apply sanitization in the isolated directory
    pushd "$WORKTREE_DIR" > /dev/null
    
    echo -e "${YELLOW}  Removing sensitive directories...${NC}"
    rm -rf sentinel-vault/ 2>/dev/null || true
    rm -rf .secrets/ 2>/dev/null || true
    rm -rf internal-docs/ 2>/dev/null || true
    rm -rf private-keys/ 2>/dev/null || true
    rm -f .env* 2>/dev/null || true
    rm -f *.pem *.key 2>/dev/null || true
    
    # Run full sanitization if script exists
    if [ -f "$SANITIZE_SCRIPT" ]; then
        chmod +x "$SANITIZE_SCRIPT"
        "$SANITIZE_SCRIPT" || true
    fi
    
    # Commit sanitized changes in worktree
    git add -A 2>/dev/null || true
    git commit -m "Sanitized for public release - $(date -u +%Y-%m-%dT%H:%M:%SZ)" --allow-empty 2>/dev/null || true
    
    popd > /dev/null
    
    echo -e "\n${YELLOW}[5/5] Pushing sanitized version to PUBLIC repository...${NC}"
    
    if check_remote "$PUBLIC_REMOTE"; then
        # Push from the sanitized worktree
        pushd "$WORKTREE_DIR" > /dev/null
        git push "$PUBLIC_REMOTE" HEAD:"$BRANCH" --force-with-lease 2>/dev/null || {
            echo -e "${RED}  Failed to push sanitized version${NC}"
            popd > /dev/null
            rm -rf "$WORKTREE_DIR"
            return 1
        }
        popd > /dev/null
        echo -e "${GREEN}  Pushed sanitized version to $PUBLIC_REMOTE/$BRANCH${NC}"
    fi
    
    # Cleanup worktree
    rm -rf "$WORKTREE_DIR"
    git worktree prune 2>/dev/null || true
}

# Function: Display sync summary
show_summary() {
    echo -e "\n${GREEN}=============================================${NC}"
    echo -e "${GREEN}  Sync Complete!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo -e "  Private: $(git remote get-url $PRIVATE_REMOTE 2>/dev/null || echo 'not configured')"
    echo -e "  Public:  $(git remote get-url $PUBLIC_REMOTE 2>/dev/null || echo 'not configured')"
    echo -e "  Branch:  $BRANCH"
    echo -e "  Time:    $(date)"
}

# Main execution
main() {
    # Verify we're in a git repository
    if ! git rev-parse --git-dir &>/dev/null; then
        echo -e "${RED}Error: Not in a git repository${NC}"
        exit 1
    fi
    
    verify_gitignore
    check_secrets
    push_private
    push_public
    show_summary
}

# Parse arguments
case "${1:-}" in
    --private-only)
        verify_gitignore
        push_private
        ;;
    --public-only)
        verify_gitignore
        push_public
        ;;
    --verify)
        verify_gitignore
        check_secrets
        ;;
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --private-only    Push to private repo only"
        echo "  --public-only     Push to public repo only (with sanitization)"
        echo "  --verify          Verify .gitignore and scan for secrets"
        echo "  --help            Show this help message"
        echo ""
        echo "Without options, syncs to both repositories."
        ;;
    *)
        main
        ;;
esac
