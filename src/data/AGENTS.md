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

## Nested TypeScript Notes

- Keep event/data module contracts stable; do not rename IDs or shape keys without migration support.
- Annotate condition callbacks explicitly (`(state: GameState) => ...`) in data event pools to avoid implicit-`any` failures in CheckJS.
- Use narrow literal unions/const assertions for category/type fields to preserve downstream type narrowing.
