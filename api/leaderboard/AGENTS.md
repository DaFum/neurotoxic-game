# api/leaderboard - Agent Instructions

## Scope

Applies to `api/leaderboard/**`.

## Rules

- Keep leaderboard payload contracts stable and backward compatible.
- Validate and normalize incoming IDs before persistence or lookup.
- Resolve submitted song IDs through the canonical song/leaderboard mapping; do not persist raw UI song IDs.
- Type request payloads as `unknown` at the boundary and narrow through explicit parsing or guards.
- Prefer explicit success/error response body types used by UI and tests.

## Gotchas

- Do not expose internal storage keys through public response shapes.
- Keep failure responses deterministic for security and node tests.
