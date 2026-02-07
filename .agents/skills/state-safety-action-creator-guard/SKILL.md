---
name: state-safety-action-creator-guard
description: Review or refactor state updates to enforce invariants (money >= 0, harmony > 0) and prefer action creators/ActionTypes. Use when reviewing PRs for state safety or adjusting reducers/hooks.
---

# Enforce State Safety and Action Creators

## Workflow

1. Identify state mutations in reducers, hooks, and utils.
2. Ensure money deductions clamp at zero and harmony stays above zero.
3. Prefer ActionTypes enums and action creators over string literals.
4. Add/adjust unit tests to cover negative-value clamps.

## Output

- Provide a short list of violations and fixes.
- Update tests for any behavior change.
