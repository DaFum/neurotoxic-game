#!/usr/bin/env bash
set -euo pipefail

# lint-fix-preview.sh
# Usage: ./scripts/lint-fix-preview.sh <base_ref>
# Produces comment.md and writes outputs to $GITHUB_OUTPUT for GitHub Actions.

marker='<!-- lint-fix-preview: do-not-edit -->'
base_ref="${1:-main}"

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

# Detect npm scripts (non-failing checks)
if npm run -s format >/dev/null 2>&1; then
  has_format_script=1
fi
if npm run -s "lint:fix" >/dev/null 2>&1; then
  has_lint_fix_script=1
fi

# Detect installed CLIs via npx (non-installing invocation).
if npx --no-install prettier --version >/dev/null 2>&1; then
  has_prettier=1
fi
if npx --no-install eslint --version >/dev/null 2>&1; then
  has_eslint=1
fi

# Ensure origin/<base_ref> exists locally. Try targeted fetch then full fetch fallback.
git fetch --no-tags --prune origin "+refs/heads/${base_ref}:refs/remotes/origin/${base_ref}" || true

if ! git rev-parse --verify "origin/${base_ref}" >/dev/null 2>&1; then
  echo "Warning: origin/${base_ref} not found after targeted fetch — fetching origin full history as fallback"
  git fetch --no-tags --prune origin || true
fi

# Build pathspecs for diff
diff_args=()
for r in "${roots[@]}"; do
  if [[ "$r" == "." ]]; then
    diff_args+=("**/*.js" "**/*.jsx" "**/*.ts" "**/*.tsx")
  else
    diff_args+=("${r}/**/*.js" "${r}/**/*.jsx" "${r}/**/*.ts" "${r}/**/*.tsx")
  fi
done

# Run auto-fixers (preview by modifying working tree, then diff against origin/<base_ref>)
if [[ "$has_format_script" == "1" ]]; then
  echo "Running: npm run format"
  npm run format
else
  echo "No format script detected (skipping 'npm run format')"
fi

if [[ "$has_lint_fix_script" == "1" ]]; then
  echo "Running: npm run lint:fix"
  npm run lint:fix
else
  echo "No lint:fix script detected (skipping 'npm run lint:fix')"
fi

# Create a patch of what changed versus origin/<base_ref>
if git rev-parse --verify "origin/${base_ref}" >/dev/null 2>&1; then
  git diff --no-color "origin/${base_ref}...HEAD" -- "${diff_args[@]}" > diff.patch || true
else
  echo "Base ref origin/${base_ref} is not available — skipping git diff" > diff.patch
fi

# Keep only the last 4000 lines to limit comment size
tail -n 4000 diff.patch > diff.tail || true

# Compose comment.md
{
  echo "$marker"
  echo "## Lint Fix Preview"
  echo
} > comment.md

# Declare missing array early so set -u doesn't bite us
missing=()
[[ "$has_prettier" == "1" ]] || missing+=("prettier dependency")
[[ "$has_eslint" == "1" ]] || missing+=("eslint dependency")
[[ "$has_format_script" == "1" ]] || missing+=("format script")
[[ "$has_lint_fix_script" == "1" ]] || missing+=("lint:fix script")

if [[ "${#missing[@]}" -gt 0 ]]; then
  {
    echo "> Informational: auto-fix preview may be incomplete because the following are missing:  **${missing[*]}**."
    echo
    echo "Expected scripts (if present in your package.json):"
    echo "- \`npm run format\`"
    echo "- \`npm run lint:fix\`"
    echo
  } >> comment.md
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
} >> comment.md

has_diff=0
if [[ -s diff.tail ]]; then
  # Check for real diff hunks (+ or -)
  if grep -qE '^\+|^-' diff.tail; then
    has_diff=1
  fi
fi

if [[ "$has_diff" == "1" ]]; then
  {
    echo "### Patch preview"
    echo
    echo "(Showing last 4000 lines if larger.)"
    echo
    echo '```diff'
    cat diff.tail
    echo '```'
    echo
  } >> comment.md
else
  {
    echo "No changes would be made by running either formatting or lint auto-fixes."
    echo
  } >> comment.md
fi

# Duplicate code recommendations — examine jscpd JSON(s)
has_dup=0
dup_total=0

# FIX: use find instead of ls-glob to safely check for JSON reports
if find ./jscpd-report -maxdepth 1 -name '*.json' -print -quit 2>/dev/null | grep -q .; then
  # FIX: pipe through xargs to strip any trailing newlines/whitespace from node output
  dup_total=$(node -e "
    const fs = require('fs');
    const p = './jscpd-report';
    try {
      const files = fs.readdirSync(p).filter(f => f.endsWith('.json'));
      let total = 0;
      for (const f of files) {
        const data = JSON.parse(fs.readFileSync(\`\${p}/\${f}\`, 'utf8'));
        if (Array.isArray(data.duplicates)) total += data.duplicates.length;
        else if (Array.isArray(data.clones)) total += data.clones.length;
        else if (Array.isArray(data.result?.clones)) total += data.result.clones.length;
      }
      console.log(total);
    } catch (e) {
      console.log(0);
    }
  " | tr -d '[:space:]')
  # FIX: ensure dup_total is always a valid integer with a default fallback
  dup_total="${dup_total:-0}"

  if [[ "$dup_total" -gt 0 ]]; then
    has_dup=1
  fi

  # Run analyzer script (it prints Markdown).
  node ./scripts/analyze-duplicates.js >> dup.md || true
  cat dup.md >> comment.md
  echo >> comment.md
fi

should_comment=0
if [[ "$has_diff" == "1" || "$has_dup" == "1" || "${#missing[@]}" -gt 0 ]]; then
  should_comment=1
fi

# Emit outputs for GitHub Actions
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "has_diff=${has_diff}" >> "$GITHUB_OUTPUT"
  echo "has_dup=${has_dup}" >> "$GITHUB_OUTPUT"
  # FIX: always write a clean integer, never empty
  echo "dup_total=${dup_total:-0}" >> "$GITHUB_OUTPUT"
  echo "should_comment=${should_comment}" >> "$GITHUB_OUTPUT"

  # FIX: use random delimiter instead of EOF to avoid collision if comment.md contains "EOF"
  delimiter="COMMENT_$(head -c 8 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 8)"
  echo "comment<<${delimiter}" >> "$GITHUB_OUTPUT"
  cat comment.md >> "$GITHUB_OUTPUT"
  echo "${delimiter}" >> "$GITHUB_OUTPUT"
fi

# Print comment.md to job log for transparency
cat comment.md

exit 0
