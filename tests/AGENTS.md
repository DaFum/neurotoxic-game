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

## Nested TypeScript Hinweise

- Bei Test-Fixtures nur erlaubte Keys setzen (z. B. `settings`-Whitelist), damit CheckJS- und Sanitizer-Tests aussagekräftig bleiben.
- Typ-/Runtime-Verträge gemeinsam testen: Wenn Props optional werden, Assertions für Fallback-Pfade ergänzen.
