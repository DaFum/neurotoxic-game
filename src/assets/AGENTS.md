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

- Asset filenames are part of implicit runtime contracts (loader maps, snapshot tests, generated URLs); renames require same-PR consumer updates.
- Generated/remote image sources should continue to route through existing loader helpers so Pixi parsing behavior remains stable across environments.

## Recent Findings (2026-04)

- Keep generated image prompts stable for map pins/icons during UI refactors; changing prompt keys can break perceived continuity even when paths still resolve.
