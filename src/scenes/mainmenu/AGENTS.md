# src/scenes/mainmenu — Agent Instructions

## Scope

Applies to `src/scenes/mainmenu/**`.

## Domain Gotchas

- Runtime guards for translated feature sections must validate nested string arrays (`items`, `headers`, and table row cells) before render.
- Treat translation-object payloads as untrusted input from locale files; reject malformed structures early.

## Recent Findings (2026-04)

- Failing loudly on malformed feature-table rows prevents silent rendering glitches and surfaces locale/schema regressions during development.
