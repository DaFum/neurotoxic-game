# AGENTS Review (Nested Scope Audit)

## Result
I reviewed all `AGENTS.md` files in this repository tree.

- Files found: `AGENTS.md` (root only)
- Nested `AGENTS.md` files under subdirectories: **none**

## Scope Impact
Because only root `AGENTS.md` exists, its rules apply to the entire repository.

## Practical Follow-ups for TS/TSX Migration Work
1. Keep using `pnpm` only and run `pnpm run test:all` before finalizing migration PRs.
2. Preserve state/action coupling when touching migration-related context code (`actionTypes` + reducer + `actionCreators` together).
3. Respect audio and styling constraints while removing `@ts-nocheck` incrementally.

## Verification Command
```bash
rg --files -g 'AGENTS.md'
```
