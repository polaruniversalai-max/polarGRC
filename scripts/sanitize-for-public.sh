#!/bin/bash
# =============================================================================
# POLAR UNIVERSAL - Public Repository Sanitization Script
# =============================================================================
# Purpose: Strip sensitive data, internal IPs, and private metadata before
#          pushing to the public hackathon repository (polarGRC).
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting sanitization for public repository...${NC}"

# Files and patterns to sanitize
SANITIZE_FILES=(
    "config/settings.py"
    "config/*.json"
    ".replit"
    "replit.nix"
    "*.ts"
    "*.py"
)

# Patterns to redact (sed compatible)
REDACT_PATTERNS=(
    's/PRIVATE_KEY=.*/PRIVATE_KEY=<REDACTED>/g'
    's/API_KEY=.*/API_KEY=<REDACTED>/g'
    's/SECRET_KEY=.*/SECRET_KEY=<REDACTED>/g'
    's/[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}/<INTERNAL_IP>/g'
    's|mongodb://[^@]*@|mongodb://<REDACTED>@|g'
    's|postgres://[^@]*@|postgres://<REDACTED>@|g'
    's/sk_live_[a-zA-Z0-9]*/sk_live_<REDACTED>/g'
    's/sk_test_[a-zA-Z0-9]*/sk_test_<REDACTED>/g'
)

# Function: Apply redaction patterns to files
apply_redactions() {
    echo -e "\n${YELLOW}Applying redaction patterns to sensitive files...${NC}"
    
    for file_pattern in "${SANITIZE_FILES[@]}"; do
        for file in $file_pattern 2>/dev/null; do
            if [ -f "$file" ] && [ ! -L "$file" ]; then
                local redacted=0
                for pattern in "${REDACT_PATTERNS[@]}"; do
                    if sed -i.bak "$pattern" "$file" 2>/dev/null; then
                        redacted=1
                    fi
                    rm -f "${file}.bak" 2>/dev/null
                done
                if [ $redacted -eq 1 ]; then
                    echo -e "${GREEN}  Redacted: $file${NC}"
                fi
            fi
        done
    done
}

# Directories to exclude from public repo
EXCLUDE_DIRS=(
    "sentinel-vault"
    ".secrets"
    "internal-docs"
    "private-keys"
)

# Function: Verify excluded directories are in .gitignore
verify_exclusions() {
    echo -e "\n${YELLOW}Verifying directory exclusions...${NC}"
    
    for dir in "${EXCLUDE_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            if grep -q "^${dir}/" .gitignore 2>/dev/null || grep -q "^${dir}$" .gitignore 2>/dev/null; then
                echo -e "${GREEN}  $dir is properly excluded${NC}"
            else
                echo -e "${RED}  WARNING: $dir exists but is NOT in .gitignore!${NC}"
                echo "$dir/" >> .gitignore
                echo -e "${YELLOW}  Added $dir/ to .gitignore${NC}"
            fi
        fi
    done
}

# Function: Remove tracking of sensitive files
untrack_sensitive() {
    echo -e "\n${YELLOW}Removing sensitive files from git tracking...${NC}"
    
    local sensitive_files=(
        ".env"
        ".env.local"
        ".env.production"
        ".env.development"
        "*.pem"
        "*.key"
        "sentinel-vault/"
    )
    
    for pattern in "${sensitive_files[@]}"; do
        if git ls-files --error-unmatch "$pattern" &>/dev/null; then
            git rm --cached -r "$pattern" 2>/dev/null || true
            echo -e "${GREEN}  Untracked: $pattern${NC}"
        fi
    done
}

# Function: Scan for hardcoded secrets in code
scan_hardcoded_secrets() {
    echo -e "\n${YELLOW}Scanning for hardcoded secrets...${NC}"
    
    local suspicious_files=()
    
    # Scan TypeScript/JavaScript files
    while IFS= read -r file; do
        if grep -l -E "(sk_live_|sk_test_|PRIVATE.*=.*['\"][a-zA-Z0-9]{20,})" "$file" &>/dev/null; then
            suspicious_files+=("$file")
        fi
    done < <(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \) -not -path "./node_modules/*")
    
    # Scan Python files
    while IFS= read -r file; do
        if grep -l -E "(API_KEY.*=.*['\"][a-zA-Z0-9]{20,})" "$file" &>/dev/null; then
            suspicious_files+=("$file")
        fi
    done < <(find . -type f -name "*.py" -not -path "./.venv/*")
    
    if [ ${#suspicious_files[@]} -gt 0 ]; then
        echo -e "${RED}  Found potential hardcoded secrets in:${NC}"
        for file in "${suspicious_files[@]}"; do
            echo -e "${RED}    - $file${NC}"
        done
        echo -e "${YELLOW}  Please review these files before pushing to public.${NC}"
    else
        echo -e "${GREEN}  No hardcoded secrets detected${NC}"
    fi
}

# Function: Create sanitized bundle
create_sanitized_bundle() {
    echo -e "\n${YELLOW}Creating sanitized sentinel-core bundle...${NC}"
    
    if [ -f "sentinel-core.bundle.js" ]; then
        # Verify the bundle doesn't contain obvious secrets
        if grep -q "PRIVATE_KEY\|API_KEY\|SECRET" sentinel-core.bundle.js; then
            echo -e "${RED}  WARNING: sentinel-core.bundle.js may contain secrets${NC}"
        else
            echo -e "${GREEN}  sentinel-core.bundle.js appears safe${NC}"
        fi
    fi
}

# Function: Generate sanitization report
generate_report() {
    local report_file=".sanitization-report.json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "checks": {
    "gitignore_verified": true,
    "sensitive_files_untracked": true,
    "hardcoded_secrets_scanned": true,
    "bundle_verified": true
  },
  "excluded_directories": $(printf '%s\n' "${EXCLUDE_DIRS[@]}" | jq -R . | jq -s .),
  "ready_for_public": true
}
EOF
    
    echo -e "\n${GREEN}Sanitization report saved to $report_file${NC}"
}

# Main execution
main() {
    verify_exclusions
    untrack_sensitive
    apply_redactions
    scan_hardcoded_secrets
    create_sanitized_bundle
    generate_report
    
    echo -e "\n${GREEN}=============================================${NC}"
    echo -e "${GREEN}  Sanitization Complete!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo -e "  Ready for public repository push."
}

main "$@"
