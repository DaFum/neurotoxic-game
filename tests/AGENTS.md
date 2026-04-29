# tests - Agent Instructions

## Scope

Applies to `tests/**` unless a deeper `AGENTS.md` overrides it.

## Runner Rules

- Choose runner by neighboring tests, not extension alone.
- Do not mix `node:test` and Vitest idioms in one file.
- Full PR gate: `pnpm run test:all`.
- Legacy logic suites: `pnpm run test`.
- UI/migrated suites: `pnpm run test:ui`.
- Node split for triage: `pnpm run test:node:quick` and `pnpm run test:node:heavy`.

## Mocking

- Vitest localStorage assertions must mock/restore `window.localStorage.setItem` in `try/finally`.
- `react-i18next` mocks require `initReactI18next: { type: '3rdParty', init: () => {} }`.
- Populate lookup maps such as `SONGS_BY_ID` explicitly in mocked data.

## Gotchas

- Keep `tests/security/**` adversarial-only.
- Keep `tests/events/**` on event-data contracts and condition gating; reducer math belongs in node/reducer suites.
- Build fixtures with canonical state keys so tests mirror runtime sanitizers.
- Add reachability assertions when UI controls are reorganized.
- Keep fixture-transform tests separate from real-dataset contract tests.
