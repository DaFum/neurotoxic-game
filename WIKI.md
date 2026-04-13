# Project Wiki Index

This file is the quick-entry wiki hub for the NEUROTOXIC codebase.

## Core Documentation

- [README](README.md)
- [Codebase Docs Master](docs/CODEBASE_DOCS_MASTER.md)

## Exploration Reports

- [Codebase Docs Master](docs/CODEBASE_DOCS_MASTER.md)

## Agent & Instruction Sources

- [Root AGENTS](AGENTS.md)
- [Copilot Instructions](.github/copilot-instructions.md)
- [Claude Instructions](CLAUDE.md)

## Security

- [Codebase Docs Master](docs/CODEBASE_DOCS_MASTER.md)

_Last updated: 2026-04-13._

## Localization & Review Update

- Treat all user-facing strings as localized content; use namespaced keys (`ui:*`, `events:*`, etc.) instead of hardcoded text.
- When introducing new i18n keys, update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.
- Keep interpolation placeholders consistent across languages (e.g., `{{cost}}`, `{{location}}`).
- For non-visual error/toast paths, prefer resilient fallbacks (`defaultValue`) so missing keys do not surface raw key names to players.
- In React callbacks/hooks, keep translation usage consistent with hook dependency expectations (`t` included in callback deps when used in callback scope).
- Before merging localization work, run the project test commands (`pnpm run test` and `pnpm run test:ui`) and include results in the PR summary.
