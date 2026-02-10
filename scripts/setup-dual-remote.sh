#!/bin/bash
# =============================================================================
# POLAR UNIVERSAL - Dual-Remote Git Configuration Setup
# =============================================================================
# Purpose: Configure Git with two remotes for private/public repository workflow.
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default repository URLs (update these with actual URLs)
PRIVATE_REPO_URL="${PRIVATE_REPO_URL:-git@github.com:PolarUniversal/sentinel-core-private.git}"
PUBLIC_REPO_URL="${PUBLIC_REPO_URL:-git@github.com:PolarUniversal/polarGRC.git}"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  POLAR UNIVERSAL - Git Remote Setup${NC}"
echo -e "${BLUE}=============================================${NC}"

# Function: Configure remote
configure_remote() {
    local name=$1
    local url=$2
    
    if git remote get-url "$name" &>/dev/null; then
        echo -e "${YELLOW}  Updating remote '$name'...${NC}"
        git remote set-url "$name" "$url"
    else
        echo -e "${GREEN}  Adding remote '$name'...${NC}"
        git remote add "$name" "$url"
    fi
    
    echo -e "${GREEN}  $name: $url${NC}"
}

# Function: Configure .git/config for dual-push
configure_push_behavior() {
    echo -e "\n${YELLOW}Configuring push behavior...${NC}"
    
    # Set default push to private
    git config push.default current
    
    # Set up push refspec for both remotes
    git config remote.origin.push "refs/heads/*:refs/heads/*"
    git config remote.public.push "refs/heads/*:refs/heads/*"
    
    echo -e "${GREEN}  Push configuration complete${NC}"
}

# Function: Configure pre-push hooks
setup_hooks() {
    echo -e "\n${YELLOW}Setting up Git hooks...${NC}"
    
    local hooks_dir=".git/hooks"
    mkdir -p "$hooks_dir"
    
    # Pre-push hook for public remote
    cat > "$hooks_dir/pre-push" << 'EOF'
#!/bin/bash
# Pre-push hook: Verify no secrets before pushing

remote="$1"

if [[ "$remote" == "public" ]]; then
    echo "[Pre-Push Hook] Checking for secrets before public push..."
    
    # Check for common secret patterns
    if git diff --cached --name-only | xargs grep -l "PRIVATE_KEY\|API_KEY.*=.*['\"][a-zA-Z0-9]" 2>/dev/null; then
        echo "ERROR: Potential secrets detected. Push to public repo blocked."
        exit 1
    fi
    
    # Check sentinel-vault is excluded
    if git ls-files sentinel-vault/ 2>/dev/null | grep -q .; then
        echo "ERROR: sentinel-vault/ is tracked. Push to public repo blocked."
        exit 1
    fi
    
    echo "[Pre-Push Hook] Checks passed."
fi

exit 0
EOF
    
    chmod +x "$hooks_dir/pre-push"
    echo -e "${GREEN}  Pre-push hook installed${NC}"
}

# Function: Verify configuration
verify_config() {
    echo -e "\n${YELLOW}Verifying configuration...${NC}"
    
    echo -e "\n  Configured remotes:"
    git remote -v
    
    echo -e "\n  Push configuration:"
    echo "  Default push: $(git config push.default 2>/dev/null || echo 'not set')"
}

# Main execution
main() {
    # Verify we're in a git repository
    if ! git rev-parse --git-dir &>/dev/null; then
        echo -e "${RED}Error: Not in a git repository${NC}"
        exit 1
    fi
    
    echo -e "\n${YELLOW}Configuring remotes...${NC}"
    
    # Configure origin (private)
    configure_remote "origin" "$PRIVATE_REPO_URL"
    
    # Configure public
    configure_remote "public" "$PUBLIC_REPO_URL"
    
    configure_push_behavior
    setup_hooks
    verify_config
    
    echo -e "\n${GREEN}=============================================${NC}"
    echo -e "${GREEN}  Setup Complete!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo -e "  Private remote: origin"
    echo -e "  Public remote:  public"
    echo -e ""
    echo -e "  Usage:"
    echo -e "    git push origin main     # Push to private repo"
    echo -e "    git push public main     # Push to public repo (with hook check)"
    echo -e "    ./scripts/sync-repos.sh  # Sync both with sanitization"
}

main "$@"
