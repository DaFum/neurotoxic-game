# Project Wiki Index

This file is the quick-entry wiki hub for the NEUROTOXIC codebase.

## Core Documentation

- [README](README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [State Transitions](docs/STATE_TRANSITIONS.md)
- [Coding Standards](docs/CODING_STANDARDS.md)
- [Tailwind v4 Patterns](docs/TAILWIND_V4_PATTERNS.md)
- [Agent Knowledge Update](docs/agent_knowledge_update.md)

## Exploration Reports

- [Game Codebase Exploration](docs/Game_Codebase_Exploration_Report.md)
- [System & State Management Exploration](docs/System_&_State_Management_Exploration_Report.md)

## Agent & Instruction Sources

- [Root AGENTS](AGENTS.md)
- [Copilot Instructions](.github/copilot-instructions.md)
- [Claude Instructions](CLAUDE.md)

## Security

- [Threat Model](neurotoxic-game-threat-model.md)
- [Security Best Practices Report](security_best_practices_report.md)

_Last updated: 2026-02-23._

## Localization & Review Update

- Treat all user-facing strings as localized content; use namespaced keys (`ui:*`, `events:*`, etc.) instead of hardcoded text.
- When introducing new i18n keys, update both `public/locales/en/*.json` and `public/locales/de/*.json` in the same change.
- Keep interpolation placeholders consistent across languages (e.g., `{{cost}}`, `{{location}}`).
- For non-visual error/toast paths, prefer resilient fallbacks (`defaultValue`) so missing keys do not surface raw key names to players.
- In React callbacks/hooks, keep translation usage consistent with hook dependency expectations (`t` included in callback deps when used in callback scope).
- Before merging localization work, run the project test commands (`npm run test` and `npm run test:ui`) and include results in the PR summary.
