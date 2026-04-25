# api/leaderboard — Agent Instructions

## Scope

Applies to `api/leaderboard/**`.

## API Responsibilities

- Keep leaderboard endpoint payload contracts stable and backward compatible.
- Validate and normalize incoming IDs before persistence/lookup.

## TypeScript Notes

- Treat request payloads as `unknown` at the boundary and narrow through explicit parsing/guards.
- Prefer explicit response body types for success/error shapes used by UI/tests.

## Gotchas

- Song IDs may require canonical mapping before submission; avoid trusting raw client IDs.
- Maintain deterministic error payloads so tests and clients can branch predictably.

## Recent Findings (2026-04)

- Leaderboard submissions should stay decoupled from Overworld menu organization; UI nav changes must not affect song ID resolution or submit payload shape.
