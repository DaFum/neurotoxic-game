# Neurotoxic — Claude Code Instructions

@AGENTS.md

## Testing Supplements

- Vitest structural component mocks (`vi.mock`) must replicate core DOM hierarchy and forward layout props.
- Use `Object.hasOwn(obj, '__proto__')` to verify forbidden prototype keys are stripped.
- When testing React hooks that use pure logic, extract that logic for `node:test` instead.
