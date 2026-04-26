# tests/ui — Agent Instructions

## Scope

Applies to `tests/ui/**` unless a deeper `AGENTS.md` overrides it.

## Test Responsibilities

- Use Vitest + React testing patterns consistent with neighboring UI tests.
- Validate rendered behavior and wiring, not reducer internals already covered in node tests.

## TypeScript Notes

- Keep component mock props aligned with shared type contracts and prop optionality.
- Prefer typed helper builders for repeated render setups to avoid ad-hoc fixture drift.

## Gotchas

- If runtime `propTypes` optionality changes, add/update UI coverage for missing-prop fallback behavior.
- Keep i18n mocks consistent with repo conventions (`initReactI18next` stub).

## Recent Findings (2026-04)

- Add assertions that each legacy action remains reachable after menu redesigns (not just that modal components can render when force-opened).
- For Kabelsalat regressions, assert both timeout-loss and fully-wired win paths eventually call `changeScene('GIG')`; validating only overlays/text is insufficient to guarantee scene routing.
- For Kabelsalat game-end hooks, include a StrictMode replay case plus a manual-overlay-continue click case to guard both automatic and fallback transition paths.
