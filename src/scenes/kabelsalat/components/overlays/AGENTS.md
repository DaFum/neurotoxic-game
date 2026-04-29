# src/scenes/kabelsalat/components/overlays - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/overlays/**`.

## Agent role and limitations

Overlay agents coordinate overlay state, i18n key usage, and continuation controls while following the rules below for "Overlay actions..." and "Consume Escape/...". They must not access external services, mutate global game state outside provided callbacks, or replace manual controls with hidden automation. Use them for overlay lifecycle, error recovery, and keyed copy placeholders; use manual scene handlers for non-overlay gameplay flow.

## Rules

- Overlay actions must preserve both automatic and manual continuation paths.
- Consume Escape/click handlers consistently so overlay controls do not race scene-level handlers.
- Keep overlay copy in i18n keys.

## Gotchas

- Manual continue tests should assert the final scene transition, not just overlay text.
