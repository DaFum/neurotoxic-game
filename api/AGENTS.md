# api - Agent Instructions

## Agents

Agents in `api/**` help maintain automated request/response orchestration, validators, and endpoint contracts. They must preserve backward-compatible response shapes, treat inputs as `unknown` until validated, and cannot cover UI-only flows. Use these instructions when changing route handlers, payload validation, or API test expectations; regular handlers remain the place for simple business logic.

## Scope

Applies to `api/**`.

## API Rules

- Keep endpoint response shapes backward compatible with current client and test contracts unless the change is explicitly versioned.
- Treat request bodies and query params as `unknown` at route boundaries; narrow with explicit validators before use.
- Use concrete response interfaces or `Record<string, unknown>` with narrowing. Do not widen handler data to `Record<string, any>`.
- Keep API error bodies stable in the `{ error: string }` style so node/UI suites can assert deterministic failure paths.

## Gotchas

- Leaderboard and song-adjacent endpoints must normalize IDs consistently with `/api/leaderboard/**`; do not accept raw UI IDs without normalization.
- Avoid backend endpoints for features that are not reachable in current UI flows; dead client paths create misleading API expectations.
