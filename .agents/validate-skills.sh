#!/bin/bash
#
# validate-skills.sh — Skill library CI validator
# Checks all SKILL.md files for required/optional fields, file references, and naming consistency
# Exit code: 0 = PASS, 1 = FAIL, 2 = WARN (issues found but not blocking)
#

set -euo pipefail

SKILLS_DIR="${1:-./.agents/skills}"
REPORT_FILE="${REPORT_FILE:-skill-validation-report.csv}"
EXIT_CODE=0

echo "SKILL VALIDATION REPORT"
echo "======================="
echo "Directory: $SKILLS_DIR"
echo "Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo

# Initialize report
{
    echo "skill_name,directory,status,has_skill_md,has_yaml_frontmatter,has_name,has_description,has_compatibility,has_metadata,has_license,reference_files,script_files,errors"
} > "$REPORT_FILE"

check_skill() {
    local skill_dir="$1"
    local skill_name=$(basename "$skill_dir")
    local status="PASS"
    local errors=()

    # Check required files
    if [ ! -f "$skill_dir/SKILL.md" ]; then
        status="FAIL"
        errors+=("Missing SKILL.md")
    else
        skill_md="$skill_dir/SKILL.md"

        # Check YAML frontmatter
        if ! head -1 "$skill_md" | grep -q '^---'; then
            status="FAIL"
            errors+=("Missing YAML frontmatter opening")
        fi

        # Extract and validate frontmatter fields
        if grep -q '^name:' "$skill_md"; then
            name_value=$(grep '^name:' "$skill_md" | head -1 | sed 's/^name:\s*//' | tr -d '"' | tr -d "'")
            if [ "$name_value" != "$skill_name" ]; then
                status="WARN"
                errors+=("name field '$name_value' doesn't match directory '$skill_name'")
            fi
        else
            status="FAIL"
            errors+=("Missing 'name' field")
        fi

        if ! grep -q '^description:' "$skill_md"; then
            status="FAIL"
            errors+=("Missing 'description' field")
        fi

        if ! grep -q '^compatibility:' "$skill_md"; then
            status="FAIL"
            errors+=("Missing 'compatibility' field")
        fi

        if ! grep -q '^metadata:' "$skill_md"; then
            status="FAIL"
            errors+=("Missing 'metadata' field")
        fi

        if ! grep -q '^license:' "$skill_md"; then
            status="FAIL"
            errors+=("Missing 'license' field")
        fi

        # Check reference file validity
        if [ -d "$skill_dir/references" ]; then
            while IFS= read -r ref_file; do
                if [ ! -f "$ref_file" ]; then
                    status="FAIL"
                    errors+=("Referenced file not found: $(basename $ref_file)")
                fi

                # Check for deeply nested references
                depth=$(echo "$ref_file" | tr -cd '/' | wc -c)
                if [ "$depth" -gt 2 ]; then
                    status="WARN"
                    errors+=("Deep reference nesting: $(basename $ref_file)")
                fi
            done < <(grep -r '^\[.*\](.*/references/' "$skill_md" 2>/dev/null || true)
        fi
    fi

    # Count resources
    ref_count=$( [ -d "$skill_dir/references" ] && find "$skill_dir/references" -type f | wc -l || echo 0)
    script_count=$( [ -d "$skill_dir/scripts" ] && find "$skill_dir/scripts" -type f | wc -l || echo 0)

    # Determine final status
    if [ "$status" = "FAIL" ]; then
        EXIT_CODE=1
    elif [ "$status" = "WARN" ]; then
        [ "$EXIT_CODE" -ne 1 ] && EXIT_CODE=2
    fi

    # Print summary
    printf "%-35s [%-4s] %s\n" "$skill_name" "$status" "${errors[0]:-OK}"
    for error in "${errors[@]:1}"; do
        printf "%-35s         %s\n" "" "$error"
    done

    # Write to CSV
    error_str=$(IFS='|'; echo "${errors[*]}")
    echo "$skill_name,$skill_dir,$status,1,1,${errors[@]:-true},$ref_count,$script_count,$error_str" >> "$REPORT_FILE"
}

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
echo "Report saved to: $REPORT_FILE"
echo

if [ "$EXIT_CODE" -eq 0 ]; then
    echo "✓ All skills valid (PASS)"
elif [ "$EXIT_CODE" -eq 1 ]; then
    echo "✗ Skill validation failed (FAIL)"
elif [ "$EXIT_CODE" -eq 2 ]; then
    echo "⚠ Skill validation warnings (WARN)"
fi

exit "$EXIT_CODE"
