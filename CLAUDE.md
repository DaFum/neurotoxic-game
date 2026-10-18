# Neurotoxic — Claude Code Instructions

@AGENTS.md

## Open Items

- Every open item that is not fixed in the current change (deferred review findings, design questions, missing tests, follow-ups) gets a GitHub issue. Search for duplicates first, link the originating PR in the issue, and mention the issue numbers in the final report.

## Testing Supplements

- Vitest structural component mocks (`vi.mock`) must replicate core DOM hierarchy and forward layout props.
- Use `Object.hasOwn(obj, '__proto__')` to verify forbidden prototype keys are stripped.
- When testing React hooks that use pure logic, extract that logic for `node:test` instead.
