# src/scenes/gameover - Agent Instructions

## Scope

Applies to `src/scenes/gameover/**`.

## Rules

- Do not introduce heavy reducer mutations from this scope.
- Preserve button-group reachability for retry/menu fallbacks.

## Gotchas

- Game-over recovery actions must remain reachable through the existing button group; do not hide retry/menu actions behind conditional rendering without explicit fallback.
- Stats/header/background are intentionally split for composability; keep data formatting in the stats component and avoid duplicating score/date formatting in siblings.
