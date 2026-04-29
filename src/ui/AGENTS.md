# src/ui — Agent Instructions

## Scope

Applies to `src/ui/**` unless a deeper `AGENTS.md` overrides it.

## UI Layer Responsibilities

- Keep UI modules presentational and orchestration-focused; route state mutations through context action creators/hooks.
- All player-facing text must stay i18n-driven (`t('ns:key')` / `<Trans>`).
- Prefer shared UI primitives from `src/ui/shared` before adding one-off wrappers.

## TypeScript & CheckJS Notes

- Avoid `any` in UI props/helpers; use `unknown` at boundaries and narrow before use.
- Include `t` and all reactive dependencies in callbacks/effects to prevent stale closures in translated UI.
- Preserve nullish/falsy semantics in UI formatting (`??` over `||` when `0`/`''` are valid values).

## Gotchas

- Location labels should go through translation helpers (for example `translateLocation`) instead of raw string assumptions.
- Keep style tokens aligned with Tailwind v4 and project CSS variables.

## Recent Findings (2026-04)

- Re-adding a removed modal requires both trigger wiring and visible affordance updates; mounted-only modals are considered incomplete integrations.
- Event modal copy may arrive either as translation keys or raw display text. Use event-provided title/description as translation fallback defaults to preserve runtime content.
- If fallback translation keys are introduced for modal/event copy, add EN+DE locale entries in the same patch (`public/locales/en/ui.json` + `public/locales/de/ui.json`).
