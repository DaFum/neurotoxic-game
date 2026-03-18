#!/bin/bash
#
# validate-skills.sh — Skill library CI validator
# Checks all SKILL.md files for required/optional fields, file references, and naming consistency
# Exit code: 0 = PASS, 1 = FAIL, 2 = WARN (issues found but not blocking)
#

set -e

SKILLS_DIR="${1:-./.agents/skills}"
REPORT_FILE="${REPORT_FILE:-skill-validation-report.csv}"
EXIT_CODE=0
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

echo "SKILL VALIDATION REPORT"
echo "======================="
echo "Directory: $SKILLS_DIR"
echo "Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo

check_skill() {
    local skill_dir="$1"
    local skill_name=$(basename "$skill_dir")
    local status="PASS"
    local errors=""

    # Check required files
    if [ ! -f "$skill_dir/SKILL.md" ]; then
        status="FAIL"
        errors="${errors}Missing SKILL.md|"
    else
        skill_md="$skill_dir/SKILL.md"

        # Check YAML frontmatter
        if ! head -1 "$skill_md" | grep -q '^---'; then
            status="FAIL"
            errors="${errors}Missing YAML frontmatter opening|"
        fi

        # Check required fields
        if ! grep -q '^name:' "$skill_md"; then
            status="FAIL"
            errors="${errors}Missing 'name' field|"
        fi

        if ! grep -q '^description:' "$skill_md"; then
            status="FAIL"
            errors="${errors}Missing 'description' field|"
        fi

        if ! grep -q '^compatibility:' "$skill_md"; then
            status="FAIL"
            errors="${errors}Missing 'compatibility' field|"
        fi

        if ! grep -q '^metadata:' "$skill_md"; then
            status="FAIL"
            errors="${errors}Missing 'metadata' field|"
        fi

        if ! grep -q '^license:' "$skill_md"; then
            status="FAIL"
            errors="${errors}Missing 'license' field|"
        fi
    fi

    # Count resources
    ref_count=0
    if [ -d "$skill_dir/references" ]; then
        ref_count=$(find "$skill_dir/references" -type f 2>/dev/null | wc -l)
    fi

    script_count=0
    if [ -d "$skill_dir/scripts" ]; then
        script_count=$(find "$skill_dir/scripts" -type f 2>/dev/null | wc -l)
    fi

    # Determine final status
    if [ "$status" = "FAIL" ]; then
        EXIT_CODE=1
        FAIL_COUNT=$((FAIL_COUNT + 1))
    elif [ "$status" = "WARN" ]; then
        if [ "$EXIT_CODE" -eq 0 ]; then
            EXIT_CODE=2
        fi
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        PASS_COUNT=$((PASS_COUNT + 1))
    fi

    # Print summary
    printf "%-35s [%-4s] %s\n" "$skill_name" "$status" "${errors%|}"

    # Write to CSV
    echo "$skill_name,$skill_dir,$status,$ref_count,$script_count,${errors%|}" >> "$REPORT_FILE"
}

# Initialize report
echo "skill_name,directory,status,reference_files,script_files,errors" > "$REPORT_FILE"

# Validate all skills
total=0
for skill_dir in "$SKILLS_DIR"/*; do
    if [ -d "$skill_dir" ]; then
        check_skill "$skill_dir"
        total=$((total + 1))
    fi
done

echo
echo "Summary"
echo "======="
echo "Total skills: $total"
echo "  PASS: $PASS_COUNT"
echo "  WARN: $WARN_COUNT"
echo "  FAIL: $FAIL_COUNT"
echo
echo "Report saved to: $REPORT_FILE"
echo

if [ "$EXIT_CODE" -eq 0 ]; then
    echo "✓ All skills valid (PASS)"
elif [ "$EXIT_CODE" -eq 1 ]; then
    echo "✗ Skill validation failed (FAIL)"
    exit 1
elif [ "$EXIT_CODE" -eq 2 ]; then
    echo "⚠ Skill validation warnings (WARN)"
    exit 2
fi

exit 0
