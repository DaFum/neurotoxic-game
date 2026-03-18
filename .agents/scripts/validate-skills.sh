#!/bin/bash
# Skill Health Validator - Agent Skills Specification compliance checker

SKILLS_DIR=".agents/skills"
OUTPUT_REPORT="skill-validation-report.csv"
EXIT_CODE=0

echo "🔍 Validating ${SKILLS_DIR}..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TOTAL_SKILLS=0
VALID_SKILLS=0
WARNINGS=0
ERRORS=0

# Initialize report
echo "skill,name_valid,description_valid,compatibility,metadata,license,has_scripts,status" > "$OUTPUT_REPORT"

for skill_dir in "$SKILLS_DIR"/*; do
    [ -d "$skill_dir" ] || continue
    
    skill_name=$(basename "$skill_dir")
    skill_md="$skill_dir/SKILL.md"
    TOTAL_SKILLS=$((TOTAL_SKILLS + 1))
    
    # Initialize checks
    has_name=0
    has_desc=0
    has_compat=0
    has_meta=0
    has_license=0
    has_scripts=0
    status="COMPLIANT"
    
    # Check files exist
    if [ ! -f "$skill_md" ]; then
        status="MISSING"
        ERRORS=$((ERRORS + 1))
    else
        # Check frontmatter fields
        if grep -q "^name:" "$skill_md"; then has_name=1; fi
        if grep -q "^description:" "$skill_md"; then has_desc=1; fi
        if grep -q "^compatibility:" "$skill_md"; then has_compat=1; fi
        if grep -q "^metadata:" "$skill_md"; then has_meta=1; fi
        if grep -q "^license:" "$skill_md"; then has_license=1; fi
        
        [ -d "$skill_dir/scripts" ] && has_scripts=1
        
        # Determine status
        if [ $has_name -eq 0 ] || [ $has_desc -eq 0 ]; then
            status="INVALID_REQUIRED"
            ERRORS=$((ERRORS + 1))
        elif [ $has_compat -eq 0 ] || [ $has_meta -eq 0 ] || [ $has_license -eq 0 ]; then
            status="NEEDS_OPTIONAL"
            WARNINGS=$((WARNINGS + 1))
        else
            status="COMPLIANT"
            VALID_SKILLS=$((VALID_SKILLS + 1))
        fi
    fi
    
    # Print status
    if [ "$status" = "COMPLIANT" ]; then
        echo -e "${GREEN}✓${NC} $skill_name"
    elif [ "$status" = "NEEDS_OPTIONAL" ]; then
        echo -e "${YELLOW}⚠${NC} $skill_name (missing optional fields)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} $skill_name ($status)"
    fi
    
    echo "$skill_name,$has_name,$has_desc,$has_compat,$has_meta,$has_license,$has_scripts,$status" >> "$OUTPUT_REPORT"
done

echo ""
echo "==================== VALIDATION SUMMARY ===================="
echo "Total skills: $TOTAL_SKILLS"
echo "Fully compliant: $VALID_SKILLS"
echo "Warnings: $WARNINGS"
echo "Errors: $ERRORS"
echo "Compliance: $(( VALID_SKILLS * 100 / TOTAL_SKILLS ))%"
echo "Report: $OUTPUT_REPORT"
echo "==========================================================="

exit $EXIT_CODE
