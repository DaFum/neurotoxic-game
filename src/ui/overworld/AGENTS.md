# src/ui/overworld - Agent Instructions

## Scope

Applies to `src/ui/overworld/**`.

## Agent Role

Overworld UI agents compose header/HUD/menu/event-log presentation, keep these surfaces view-focused, and ensure localized/tokenized UI updates align with parent `src/ui/AGENTS.md` contracts.

## Agent Limits

- Keep gameplay derivation and side-effectful mutations outside view components; consume precomputed props/state.
- Preserve append-safe event-log behavior and avoid storing pre-translated strings in state.
- Follow parent UI rules for i18n keys, styling tokens, and shared type contracts.

## When to Use

Use this scope for overworld HUD/header/menu rendering changes, event-log presentation behavior, and localized UI copy/layout updates. Use higher-level scene/context docs for routing, reducer, persistence, or gameplay-state transition logic.

## Gotchas

- Overworld header/HUD/menu split is intentional; keep gameplay state derivation outside these view components and pass precomputed props.
- Event log entries should stay append-safe and localization-friendly; avoid storing pre-translated strings in state.
