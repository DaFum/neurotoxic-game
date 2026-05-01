# src/scenes/gameover - Agent Instructions

## Scope

Applies to `src/scenes/gameover/**`.

## What agents do

Gameover agents present loss-state UI, keep retry/menu actions reachable, feed/format stats for gameover presentation, and orchestrate recovery-oriented callbacks already exposed by the scene layer.

## Limitations

- UI-layer only: do not introduce heavy reducer mutations from this scope.
- Preserve button-group reachability for retry/menu fallbacks.
- Follow parent `src/scenes/AGENTS.md` callback/routing constraints for all scene transitions.

## When to use

Use this scope for retry/menu interaction flows, gameover stats presentation updates, and recovery UX adjustments. Use parent scene docs for broader transition architecture or cross-scene flow changes.

## Gotchas

- Game-over recovery actions must remain reachable through the existing button group; do not hide retry/menu actions behind conditional rendering without explicit fallback.
- Stats/header/background are intentionally split for composability; keep data formatting in the stats component and avoid duplicating score/date formatting in siblings.
