---
name: one-command-quality-gate
description: Run the repository quality gate in order (lint, test, build) and summarize results with next steps. Use when asked to run the quality gate, verify changes, or diagnose failing checks.
---

# Run the Quality Gate

## Workflow

1. Ensure dependencies are installed (`npm install`) if needed.
2. Run lint, test, then build in that order.
3. Summarize pass/fail and surface next-step suggestions based on failures.

## Command

- Prefer the bundled script: `./.claude/skills/one-command-quality-gate/scripts/quality-gate.sh`
- Direct commands: `npm run lint`, `npm run test`, `npm run build`

## Output

- Provide a short summary of results and any actionable next steps.

## Related Skills

- `one-command-doctor` — for broader healthcheck including Node version and npm install
- `ci-hardener` — for enforcing the same checks in CI
- `refactor-with-safety` — always run this gate after refactors
