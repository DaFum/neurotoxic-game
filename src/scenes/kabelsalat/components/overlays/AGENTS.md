# src/scenes/kabelsalat/components/overlays - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/overlays/**`.

## Rules

- Overlay actions must preserve both automatic and manual continuation paths.
- Consume Escape/click handlers consistently so overlay controls do not race scene-level handlers.
- Keep overlay copy in i18n keys.

## Gotchas

- Manual continue tests should assert the final scene transition, not just overlay text.
