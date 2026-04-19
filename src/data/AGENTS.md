# src/data — Agent Instructions

## Scope

Applies to `src/data/**`.

## Data Authoring Rules

- Keep data modules deterministic and side-effect free.
- Preserve stable IDs; do not rename IDs used by saves/tests unless migration support is added.
- For user-facing copy keys, use i18n keys only (no raw UI strings in data objects).

## Event/Data Gotchas

- `events/special` entries require unique IDs, `category: 'special'`, `events:` i18n keys, and a valid `options` array.
- `hqItems` entries use singular `effect` object shape.
- Consumables should use `inventory_add` effects and remain multi-purchase capable.

## Migration Rules

- Keep schema shape backward compatible for save/test fixtures.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

