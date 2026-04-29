# src/scenes/mainmenu - Agent Instructions

## Scope

Applies to `src/scenes/mainmenu/**`.

## Rules

- Keep menu actions reachable through keyboard and pointer flows.
- Use i18n keys for all visible menu copy.
- Preserve audio/settings callback contracts shared with UI settings.

## Gotchas

- Main menu chatter uses `MENU`; do not accidentally classify it as generic overworld chatter.
