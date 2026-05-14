# src/ui/overworld - Agent Instructions

## Scope

Applies to `src/ui/overworld/**`.

## Agent Role & Usage

Overworld UI agents compose header/HUD/menu/event-log presentation, keep these surfaces view-focused, and ensure localized/tokenized UI updates align with parent `src/ui/AGENTS.md` contracts. Use this scope for localized UI copy/layout updates and event-log presentation. Use higher-level scene docs for routing or gameplay-state logic.

## Rules

- Keep gameplay derivation and side-effectful mutations outside view components; consume precomputed props/state.
- Preserve append-safe event-log behavior and avoid storing pre-translated strings in state.
- Follow parent UI rules for i18n keys, styling tokens, and shared type contracts.

## Gotchas

- Overworld header/HUD/menu split is intentional; keep gameplay state derivation outside these view components and pass precomputed props.
- Event log entries should stay append-safe and localization-friendly; avoid storing pre-translated strings in state.
