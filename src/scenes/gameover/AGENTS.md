# src/scenes/gameover - Agent Instructions

## Recovery

- Game-over recovery actions must remain reachable through `GameOverButtons`. If conditional rendering is added, render replacement retry/menu buttons that call the same handlers and remain discoverable by role/text.

## Composition

- Stats/header/background are intentionally split for composability; keep data formatting in the stats component and avoid duplicating score/date formatting in siblings.
- If layout changes conflict with composability, keep recovery actions reachable first and keep score/day/fame formatting owned by `GameOverStats`.
