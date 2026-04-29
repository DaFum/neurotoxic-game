## Agent Explanation

Main menu agents cover automated UI behavior, event routing, save/load entry points, and menu-adjacent data fetching. They do not own business logic validation, long-running background work, authentication, or security decisions. Consult this file for `src/scenes/mainmenu/**` changes; use shared UI, context, or API docs when behavior crosses those boundaries.

# src/scenes/mainmenu - Agent Instructions

## Scope

Applies to `src/scenes/mainmenu/**`.

## Rules

- Keep menu actions reachable through keyboard and pointer flows.
- Use i18n keys for all visible menu copy.
- Preserve audio/settings callback contracts shared with UI settings.

## Gotchas

- Main menu chatter uses `MENU`; do not accidentally classify it as generic overworld chatter.
