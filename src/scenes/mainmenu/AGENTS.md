# src/scenes/mainmenu - Agent Instructions

## Rules

- Keep menu actions reachable through keyboard and pointer flows.
- Use i18n keys for all visible menu copy.
- Preserve audio/settings callback signatures and behavior shared with UI settings; menu audio setup stays fire-and-forget and must not block scene transitions.

## Gotchas

- Main menu chatter uses `MENU`; do not accidentally classify it as generic overworld chatter.
