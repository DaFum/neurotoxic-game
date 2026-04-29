# src/ui/bandhq - Agent Instructions

Agent Instructions here apply to AI assistants, automated tools, and human operators changing Band HQ UI surfaces. Their purpose is to keep catalog, purchase, and effect flows aligned with shared reducers and engines; they are limited to `src/ui/bandhq/**`, expected to produce UI-safe inputs/outputs, and must respect i18n, shared types, and safety constraints. Use these agents for Band HQ UI and hook changes, not for unrelated economy engine rewrites.

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
