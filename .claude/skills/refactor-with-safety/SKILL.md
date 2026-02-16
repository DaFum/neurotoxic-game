---
name: refactor-with-safety
description: refactor code without breaking functionality. Trigger when asked to clean up, restructure, or optimize code. Enforces test coverage and quality gates.
---

# Refactor with Safety

Perform structural changes while preserving behavior and stability.

## Workflow

1.  **Preparation**
    *   **Audit**: Read `AGENTS.md` for domain constraints.
    *   **Baseline**: Run tests (`npm test`) to ensure everything passes *before* you start.
    *   **Coverage**: If tests are missing for the target, add them first (use `golden-path-test-author`).

2.  **Execution**
    *   **Small Steps**: Refactor one function/component at a time.
    *   **Interface Preservation**: Keep function signatures stable if possible.
    *   **Linting**: Run `npm run lint` frequently to catch syntax errors.

3.  **Verification**
    *   **Test**: Run `npm test` after each change.
    *   **Build**: Run `npm run build` to ensure no circular dependencies or export errors.
    *   **Review**: Check if the logic is actually simpler/better.

## Rules

*   **No Behavior Change**: Unless explicitly requested, refactoring should not alter logic.
*   **Fix the Code, Not the Test**: If a test fails, the refactor is wrong (unless the test was testing implementation details).
*   **Commit Often**: Use `change-plan-conventional-commits`.

## Example

**Input**: "Refactor `calculateScore` to be more readable."

**Action**:
1.  Run `tests/score.test.js`. (Passes).
2.  Break `calculateScore` into `getBaseScore` and `getMultipliers`.
3.  Run `tests/score.test.js`. (Passes).
4.  Run `npm run lint`. (Passes).

**Output**:
"Extracted helper functions `getBaseScore` and `getMultipliers`. Tests pass. Logic is unchanged but clearer."
