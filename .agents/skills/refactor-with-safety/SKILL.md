---
name: refactor-with-safety
description: Perform refactors with safety checks (types, extracted modules, lint/test/build verification). Use when asked to refactor without behavior changes.
---

# Refactor with Safety

## Quality Gate

Run in order after every refactor: `npm run lint` → `npm run test` → `npm run build`

## Key Files

- `src/*/AGENTS.md` — domain-specific rules that must be preserved during refactoring
- `tests/` — test files covering reducers, engines, audio, and game logic
- `package.json` — quality gate scripts

## Workflow

1. Identify refactor boundaries by reading the relevant `src/*/AGENTS.md` for domain rules.
2. List all affected modules and their public exports.
3. Preserve public interfaces and behavior — do not change function signatures without updating callers.
4. Run the full quality gate: `npm run lint` → `npm run test` → `npm run build`.
5. If tests fail, fix the refactor — do not modify tests to match broken behavior.
6. Summarize risks, verification results, and any behavior changes (should be none).

## Output

- Provide a short risk report and validation status.

## Related Skills

- `one-command-quality-gate` — automates the validation step
- `golden-path-test-author` — for adding regression coverage before risky refactors
- `change-plan-conventional-commits` — for structuring the refactor into clean commits
