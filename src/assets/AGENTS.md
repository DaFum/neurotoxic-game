# src/assets — Agent Instructions

## Scope

Applies to `src/assets/**`.

## Asset Rules

- Keep asset references stable and consistent with loaders/import maps.
- Do not change asset naming/paths casually; test fixtures and loaders may depend on exact paths.
- Prefer additive asset updates over replacing/removing existing files in migration PRs.

## Migration Rules

- If asset path conventions change, update all loaders/tests in the same PR.

## Nested TypeScript Notes

- Keep asset metadata interfaces narrow and explicit; avoid loosely typed loader payloads.
- If asset key/path conventions change, update typed import maps and all consuming loaders/tests together.
- Prefer additive metadata fields over repurposing existing keys to preserve backward compatibility with save fixtures and tests.


## Domain Gotchas

- Keep changes in this scope aligned with upstream root and parent AGENTS constraints; avoid duplicating guidance already covered by adjacent scopes.
- When behavior contracts change here, update the closest tests/consumers in the same PR to keep scope boundaries trustworthy.

## Recent Findings (2026-04)

- Keep generated image prompts stable for map pins/icons during UI refactors; changing prompt keys can break perceived continuity even when paths still resolve.
