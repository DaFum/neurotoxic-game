---
name: mega-lint-snapshot
description: Run a comprehensive linting suite (MegaLinter style). Trigger when asked to check code quality, security, or style across multiple languages.
---

# Mega Lint Snapshot

Generate a detailed quality report for the repository, covering linting, security, and formatting.

## Usage

Run the bundled script to generate the report.

```bash
.claude/skills/mega-lint-snapshot/scripts/run-mega-lint.sh
```

To apply fixes (where available):

```bash
.claude/skills/mega-lint-snapshot/scripts/run-mega-lint.sh --fix
```

## Workflow

1.  **Execute the Script**
    The script runs configured linters defined in `assets/mega-lint.config.json`.
    *   **ESLint**: JavaScript/React.
    *   **Prettier**: Formatting.
    *   **Gitleaks**: Secret detection.
    *   **ShellCheck**: Bash scripts.

2.  **Analyze the Report**
    *   **ERROR**: Blocking issues. Must fix.
    *   **WARN**: Potential issues. Review.
    *   **INFO**: Formatting or style notes.

3.  **Fix Issues**
    *   If `--fix` works, commit the changes.
    *   If not, manually address the errors reported in the log.

## Example

**Input**: "Check the codebase for any linting errors."

**Action**:
Run `.claude/skills/mega-lint-snapshot/scripts/run-mega-lint.sh`.

**Output**:
```text
[INFO] Starting MegaLinter Snapshot...
[INFO] Running ESLint... [PASS]
[ERROR] Running Gitleaks... [FAIL]
  - hardcoded_secret in src/utils/api.js:20
[INFO] Running Prettier... [PASS]
```
"Found a hardcoded secret in `api.js`. Please remove it."
