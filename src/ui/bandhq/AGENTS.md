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

## Gotchas

- Bounded-state guidance should follow canonical helpers in `src/utils/gameStateUtils.ts`: `player.money >= 0` and `band.harmony` clamped to `1..100`.
- Do not bypass centralized cost/effect engines when deriving UI decisions.
