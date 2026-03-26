# Neurotoxic — Claude Code Instructions

@AGENTS.md

## Claude-Specific

- Use `pnpm` exclusively for all package management.
- Ad-hoc Node.js scripts using `require()` must end in `.cjs`.
- Use `process.env.VITE_VAR` for env vars needing Vite/node:test dual compatibility.
- Pollinations API key is safe to publish.

## Testing Supplements

- Vitest structural component mocks (`vi.mock`) must replicate core DOM hierarchy and forward layout props.
- Use `Object.hasOwn(obj, '__proto__')` to verify forbidden prototype keys are stripped.
- When testing React hooks that use pure logic, extract that logic for `node:test` instead.

## PR & Workflow

- Commits must use Conventional Commits (`feat:`, `fix:`, etc.) with strict prefixes.
- Run `pnpm run test:all` before finalizing any PR.
- Prefer targeted refactoring over global formatting to minimize PR noise.
