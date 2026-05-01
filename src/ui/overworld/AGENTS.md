# src/ui/overworld - Agent Instructions

## Scope

Applies to `src/ui/overworld/**`.

## Rules

- Follow parent `src/ui/AGENTS.md` for i18n, styling tokens, and shared type contracts.

## Gotchas

- Overworld header/HUD/menu split is intentional; keep gameplay state derivation outside these view components and pass precomputed props.
- Event log entries should stay append-safe and localization-friendly; avoid storing pre-translated strings in state.
