# tests — Agent Instructions

## Scope
Applies to `tests/**`.

## Runner Selection
- Choose runner by directory conventions of neighboring tests (not by extension alone).
- Do not mix `node:test` and Vitest patterns inside one file.

## Required Commands
- Full gate before PR: `pnpm run test:all`.
- Legacy logic suites: `pnpm run test`.
- UI/migrated suites: `pnpm run test:ui`.

## Mocking Gotchas
- For Vitest localStorage assertions, mock and restore `window.localStorage.setItem` inside `try/finally`.
- For `react-i18next` mocks, include:
  `initReactI18next: { type: '3rdParty', init: () => {} }`.
- Populate lookup maps (e.g., `SONGS_BY_ID`) explicitly in mocked fixture data when tests depend on ID resolution.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

