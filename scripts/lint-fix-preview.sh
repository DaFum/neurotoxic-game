#!/usr/bin/env bash
set -euo pipefail

# lint-fix-preview.sh
# Usage: ./scripts/lint-fix-preview.sh
# Produces comment.md and writes outputs to $GITHUB_OUTPUT for GitHub Actions.

marker='<!-- lint-fix-preview: do-not-edit -->'

# Detect roots: prefer src/app, then src, then repo root
if [[ -d "src/app" ]]; then
	roots=("src/app")
elif [[ -d "src" ]]; then
	roots=("src")
else
	roots=(".")
fi

# Detect tooling and scripts
has_prettier=0
has_eslint=0
has_format_script=0
has_lint_fix_script=0

has_package_script() {
	node -e "const fs=require('fs'); const scripts=JSON.parse(fs.readFileSync('package.json','utf8')).scripts || {}; process.exit(Object.hasOwn(scripts, process.argv[1]) ? 0 : 1)" "$1"
}

if has_package_script format; then
	has_format_script=1
fi
if has_package_script "lint:fix"; then
	has_lint_fix_script=1
fi

if pnpm exec prettier --version >/dev/null 2>&1; then
	has_prettier=1
fi
if pnpm exec eslint --version >/dev/null 2>&1; then
	has_eslint=1
fi

# Run auto-fixers — sie modifizieren den Working Tree
format_status=skipped
lint_fix_status=skipped
if [[ "$has_format_script" == "1" ]]; then
	echo "Running: pnpm run format"
	rc=0
	pnpm run format 2>&1 | tee format.log || rc=$?
	format_status=$rc
else
	echo "No format script detected (skipping 'pnpm run format')"
fi

if [[ "$has_lint_fix_script" == "1" ]]; then
	echo "Running: pnpm run lint:fix"
	rc=0
	pnpm run lint:fix 2>&1 | tee lint-fix.log || rc=$?
	lint_fix_status=$rc
else
	echo "No lint:fix script detected (skipping 'pnpm run lint:fix')"
fi

fix_failed=0
if [[ "$format_status" != "skipped" && "$format_status" != "0" ]] || [[ "$lint_fix_status" != "skipped" && "$lint_fix_status" != "0" ]]; then
	fix_failed=1
fi

# FIX: Diff gegen HEAD (letzter Commit auf dem PR-Branch) statt gegen origin/<base_ref>.
# Zeigt ausschließlich was die Formatter/Linter geändert haben — nicht den gesamten Branch-Diff.
# Capture every tracked file the repository-wide fixers can change.
git diff --no-color HEAD >diff.patch || true

# Keep only the last 4000 lines to limit comment size
tail -n 4000 diff.patch >diff.tail || true

# Write the fixed report header separately
{
	echo "$marker"
	echo "## Lint Fix Preview"
	echo
} >header.md

missing=()
[[ "$has_prettier" == "1" ]] || missing+=("prettier dependency")
[[ "$has_eslint" == "1" ]] || missing+=("eslint dependency")
[[ "$has_format_script" == "1" ]] || missing+=("format script")
[[ "$has_lint_fix_script" == "1" ]] || missing+=("lint:fix script")

if [[ "${#missing[@]}" -gt 0 ]]; then
	{
		echo "> Informational: auto-fix preview may be incomplete because the following are missing: **${missing[*]}**."
		echo
		echo "Expected scripts (if present in your package.json):"
		echo "- \`pnpm run format\`"
		echo "- \`pnpm run lint:fix\`"
		echo
	} >>header.md
fi

{
	echo "Target roots:"
	for r in "${roots[@]}"; do
		if [[ "$r" == "." ]]; then
			echo "- \`(repo root)\`"
		else
			echo "- \`${r}/\`"
		fi
	done
	echo
} >>header.md

report_status() {
	case "$2" in
		skipped) echo "- \`pnpm run $1\`: skipped" ;;
		0) echo "- \`pnpm run $1\`: passed" ;;
		*) echo "- \`pnpm run $1\`: failed (exit $2)" ;;
	esac
}

report_failed_log() {
	echo "<details>"
	echo "<summary>$1 log tail (last 60 lines, at most 4000 characters)</summary>"
	echo
	echo '<pre>'
	# Escape tool output so it cannot close the details block or a Markdown fence.
	tail -n 60 "$2" | node -e '
    const fs = require("fs");
    const text = Array.from(fs.readFileSync(0, "utf8")).slice(-4000).join("");
    console.log(text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"));
  '
	echo '</pre>'
	echo '</details>'
	echo
}

{
	echo "### Autofix status"
	echo
	report_status format "$format_status"
	report_status lint:fix "$lint_fix_status"
	echo
	if [[ "$fix_failed" == "1" ]]; then
		echo "> Unresolved errors remain; the run did not pass. The patch contains only fixes applied before the tools stopped. Later lint:fix steps such as Stylelint CSS fixes may not have run."
		echo
		if [[ "$format_status" != "skipped" && "$format_status" != "0" ]]; then
			report_failed_log format format.log
		fi
		if [[ "$lint_fix_status" != "skipped" && "$lint_fix_status" != "0" ]]; then
			report_failed_log lint:fix lint-fix.log
		fi
	fi
} >>header.md

has_diff=0
if [[ -s diff.patch ]]; then
	has_diff=1
fi

# Duplicate code — the analyzer is the only reader of jscpd-report.
# Fail closed: only exit 0 with the line `status=ok total=<n>` is a result.
# A missing report (jscpd writes one even when it finds nothing), an invalid
# report, or any other analyzer output sets dup_failed=1 and leaves dup_total
# empty, so a failed analysis never reads as zero duplicates.
has_dup=0
dup_total=""
dup_failed=0
: >dup.md

dup_rc=0
dup_result=$(node ./scripts/analyze-duplicates.js --markdown-file dup.md) || dup_rc=$?
ok_re='^status=ok total=(0|[1-9][0-9]*)$'
failed_re='^status=(missing|invalid)$'
if [[ "$dup_rc" == "0" && "$dup_result" =~ $ok_re ]]; then
	dup_status=ok
	dup_total="${BASH_REMATCH[1]}"
	if [[ "$dup_total" != "0" ]]; then
		has_dup=1
	fi
elif [[ "$dup_rc" != "0" && "$dup_result" =~ $failed_re ]]; then
	dup_status="${BASH_REMATCH[1]}"
	dup_failed=1
else
	dup_status=error
	dup_failed=1
fi
if [[ "$dup_failed" == "1" ]]; then
	{
		echo "### Duplicate code"
		echo
		echo "> Duplicate analysis failed (status: \`${dup_status}\`). The duplicate count is unknown, not zero; see the workflow log."
	} >dup.md
fi
echo >>dup.md

run_link=""
if [[ -n "${GITHUB_SERVER_URL:-}" && -n "${GITHUB_REPOSITORY:-}" && -n "${GITHUB_RUN_ID:-}" ]]; then
	run_link="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
fi
node ./scripts/render-lint-fix-preview.js header.md diff.patch dup.md "$has_diff" "$run_link" "$fix_failed" >comment.md

should_comment=0
if [[ "$has_diff" == "1" || "$has_dup" == "1" || "$dup_failed" == "1" || "$fix_failed" == "1" || "${#missing[@]}" -gt 0 ]]; then
	should_comment=1
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
	{
		echo "fix_failed=${fix_failed}"
		echo "format_status=${format_status}"
		echo "lint_fix_status=${lint_fix_status}"
		echo "has_diff=${has_diff}"
		echo "has_dup=${has_dup}"
		echo "dup_total=${dup_total}"
		echo "dup_status=${dup_status}"
		echo "dup_failed=${dup_failed}"
		echo "should_comment=${should_comment}"

		delimiter="COMMENT_$(head -c 8 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 8)"
		echo "comment<<${delimiter}"
		cat comment.md
		echo "${delimiter}"
	} >>"$GITHUB_OUTPUT"
fi

cat comment.md

exit 0
