# tests/security - Agent Instructions

- Folder is adversarial-only: assert malformed payloads are rejected before state mutation; happy-path duplicate checks belong in core unit suites.
- Prototype-pollution probes must include `__proto__`, `constructor`, and `prototype` at nested object/array levels.
- Use raw JSON strings for `__proto__` probes so hostile keys are actually serialized.
- API hardening tests assert both status code and stable error shape.
- Hostile-payload shapes live in the shared fixture `tests/utils/hostilePayloadCases.js`, driven through parser boundaries by `tests/utils/hostilePayloadDriver.js` and asserted in both `tests/security/hostilePayloadFuzz.test.js` and `tests/node/hostilePayloadFuzz.test.js`. Extend the fixture instead of adding inline hostile arrays, and always pair "did not throw" with `checkInvariants(state)` from `tests/utils/checkInvariants.js`.
