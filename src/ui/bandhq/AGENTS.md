# src/ui/bandhq — Agent Instructions

## Scope

Applies to `src/ui/bandhq/**` unless a deeper `AGENTS.md` overrides it.

## Domain Responsibilities

- Band HQ modules coordinate shop/clinic/stats UX and should remain reducer-action driven.
- Keep economy/social-facing UI messages synchronized with actual applied deltas and clamped values.

## TypeScript Notes

- This domain is in stricter CheckJS scope; guard indexed access and optional object branches explicitly.
- Reuse shared domain contracts (`src/types/game.d.ts`, `src/types/components.d.ts`) instead of ad-hoc local shapes.
- For purchasable/effect payloads, prefer explicit discriminated unions and avoid widening to generic records.

## Domain Gotchas

- Bounded-state guidance should follow canonical helpers in `src/utils/gameStateUtils.ts`: `player.money >= 0` and `band.harmony` clamped to `1..100`.
- Do not bypass centralized cost/effect engines when deriving UI decisions.
- `CatalogTab` callback prop names (`*Callback`) are part of the shared contract; renaming requires same-PR updates for all tab consumers and PropTypes.

## Recent Findings (2026-04)

- Band HQ navigation should remain independent from Overworld action regrouping; HQ open behavior must not depend on category ordering side effects.
- Settings-related tab props should consume shared audio contracts from `src/types/audio.d.ts` to avoid drift between `useAudioControl` output and tab signatures.
- `CatalogTab` PropTypes wrappers must forward the full validator arg list (`...rest`) to wrapped validators; partial forwarding degrades dev warnings and breaks diagnostics.
- `ShopItem`/catalog labels must never pass non-string values into `t(...)`; fallback to `ui:shop.messages.unknownItem` for malformed names and keep EN/DE locale keys unique (no duplicates).
- Keep `CatalogTab` custom PropTypes validators readable by retaining explicit `location`/`propFullName` parameters while still forwarding the full arg list.
