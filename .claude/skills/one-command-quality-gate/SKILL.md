---
name: one-command-quality-gate
description: run the full test and lint suite. Trigger when preparing to commit, submitting a PR, or verifying a change. Runs lint, test, and build in order.
---

# One-Command Quality Gate

Enforce code quality standards by running the canonical check suite.

## Usage

Run the bundled script:

```bash
.claude/skills/one-command-quality-gate/scripts/quality-gate.sh
```

## Workflow

The script executes these checks in order:

1.  **Lint**: `npm run lint`. Checks code style and errors.
2.  **Test**: `npm run test`. Runs the test suite.
3.  **Build**: `npm run build`. Verifies production build.

## Rules

*   **Stop on Failure**: If any step fails, the gate fails immediately. Do not proceed.
*   **Clean Output**: Report the specific step that failed and the error message.

## Example

**Input**: "I finished the feature. Is it ready?"

**Action**:
Run `.claude/skills/one-command-quality-gate/scripts/quality-gate.sh`.

**Output**:
(Note: "Running..." text denotes additional successful check output.)
```text
[LINT] Running linters... OK
[TEST] Running tests... FAIL
  Test failed: 'Game should start with 100 money'
```
"Quality gate failed at the Test step. Please fix the money initialization regression."

_Skill sync: compatible with React 19.2.4 / Vite 7.3.1 baseline as of 2026-02-17._
