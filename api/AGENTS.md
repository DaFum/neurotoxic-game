# api — Agent Instructions

## Scope
Applies to `api/**`.

## API Rules
- Keep endpoints backward compatible with current client contracts unless versioned changes are introduced.
- Validate request payload assumptions explicitly and keep response shapes stable for tests.
- Avoid introducing hidden side effects in route handlers.

## Migration Rules
- TS migration changes in API files should be behavior-preserving and accompanied by updated API tests.

## Nested TypeScript Notes

- Treat request bodies and query params as `unknown` at the route boundary, then narrow with explicit validators before use.
- Keep API response shapes stable during type migrations; when a payload contract changes, update client consumers and API tests in the same PR.
- Avoid widening handler-local data to `Record<string, any>`; prefer concrete interfaces or `Record<string, unknown>` with narrowing.
