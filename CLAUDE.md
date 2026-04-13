# Neurotoxic — Claude Code Instructions

@AGENTS.md

## Claude-Specific

- Use `pnpm` exclusively — never `npm` or `yarn`.
- Run `pnpm run test:all` before finalizing any PR.
- Prefer targeted refactoring over global formatting to minimize PR noise.

## Testing Supplements

- Vitest structural component mocks (`vi.mock`) must replicate core DOM hierarchy and forward layout props.
- Use `Object.hasOwn(obj, '__proto__')` to verify forbidden prototype keys are stripped.
- When testing React hooks that use pure logic, extract that logic for `node:test` instead.
