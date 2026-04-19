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

## Nested TypeScript Hinweise

- Datenmodule bleiben schema-stabil: IDs und Feldnamen nicht ohne Migration ändern.
- Event-`condition`-Signaturen explizit typisieren (`(state: GameState) => ...`), um CheckJS-`any`-Leaks zu vermeiden.
