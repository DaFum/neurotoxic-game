# src/ui/bandhq - Agent Instructions

## Scope

Applies to `src/ui/bandhq/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Band HQ UI remains reducer-action driven; do not bypass centralized cost/effect engines.
- Display economy/social messages from resolved effects and clamped state.
- Use shared game/component/audio contracts from `src/types/**`.
- Keep purchasable/effect payloads as explicit discriminated unions, not generic records.

## Gotchas

- `CatalogTab` callback prop names (`*Callback`) are shared contracts; rename only with all tab consumers and PropTypes updated.
- `CatalogTab` custom PropTypes wrappers must keep readable `location`/`propFullName` parameters and forward `...rest`.
- Shop/catalog labels must pass strings to `t(...)`; use `ui:shop.messages.unknownItem` for malformed names.
- Band HQ open behavior must not depend on Overworld category ordering.
