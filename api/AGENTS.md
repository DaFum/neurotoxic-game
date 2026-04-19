# api — Agent Instructions

## Scope
Applies to `api/**`.

## API Rules
- Keep endpoints backward compatible with current client contracts unless versioned changes are introduced.
- Validate request payload assumptions explicitly and keep response shapes stable for tests.
- Avoid introducing hidden side effects in route handlers.

## Migration Rules
- TS migration changes in API files should be behavior-preserving and accompanied by updated API tests.

## Nested TypeScript Hinweise

- API-Payloads als `unknown` behandeln und per Guard validieren; keine impliziten `any`-Shapes in Handlern.
- Stabilität vor Refactor: Response-Contracts bei Typmigrationen nicht stillschweigend ändern.
