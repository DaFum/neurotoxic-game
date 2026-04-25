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

## Nested TypeScript Notes

- Build fixtures using canonical state keys (for example, settings whitelist keys) so tests mirror runtime sanitizers.
- Add regression assertions when optionality changes in shared types (for example, optional props and fallback behavior).
- Prefer explicit helper return types in reusable test utilities to prevent silent `any` leakage into assertions.

## Recent Findings (2026-04)

- When UI controls are reorganized (category menus, tabs, accordions), add/adjust reachability assertions so hidden-but-mounted features do not silently become dead paths.
