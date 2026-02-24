# AGENTS.md — `src/utils/`

Scope: Applies to all files under `src/utils/`.

Nested override: `src/utils/audio/AGENTS.md` takes precedence for `src/utils/audio/*`.

## Purpose

Utility modules provide shared engines/helpers for gameplay math, state application, logging, and runtime services.

Representative domains:

- Economy/simulation/social: `economyEngine.js`, `simulationUtils.js`, `socialEngine.js`
- Events/state application: `eventEngine.js`, `gameStateUtils.js`, `saveValidator.js`
- Map/rhythm/gig helpers: `mapGenerator.js`, `rhythmUtils.js`, `gigStats.js`, `hecklerLogic.js`
- Audio orchestration wrappers: `audioEngine.js`, `AudioManager.js` (facades for `src/utils/audio/`)
- Infra: `logger.js`, `errorHandler.js`, `lazySceneLoader.js`, etc.

## Key Gig-Domain Contracts

- **`economyEngine.js`** exports `MODIFIER_COSTS` as the single source of truth for PreGig modifier costs. **Refactor Note**: Travel only consumes fuel liters and food money; gas money is paid only via Refuel. `calculateGigExpenses` excludes travel transport/food.
- **`mapGenerator.js`** assigns `FESTIVAL` type for venues with capacity ≥ 1000.
- **`gigStats.js`** exports `calculateAccuracy(perfectHits, misses)` and `buildGigStatsSnapshot`; the snapshot now includes `accuracy` (0–100). Tests in `tests/gigStats.test.js` verify this contract.
- **`simulationUtils.js`** returns daily passive updates, including Harmony drains from `social.egoFocus`, passive Platform Perks based on follower counts, and van degradation. `calculateGigPhysics` returns modifiers used by audio logic.
- **`socialEngine.js`** checks virality via `checkViralEvent`, assigns dynamic post combinations via `generatePostOptions`, and resolves complex `POST_OPTIONS` side actions (`resolvePost`) impacting Band/Player/Social state.

## Code-Aligned Rules

1. Prefer pure, deterministic helpers for balance-critical logic.
2. Keep side effects isolated to modules that explicitly own them (audio, logging, image generation).
3. Do not bypass save validation or sanitize/load guardrails.
4. Preserve idempotent event-resolution behavior per trigger cycle.
5. Avoid unsafe HTML/DOM sinks in utility outputs.

## Security & Reliability

- Validate/sanitize incoming save-like payloads before use.
- Keep failure handling explicit and non-sensitive in logs.
- Avoid introducing hidden mutable global state in non-audio utils.

## Validation & Test Targets

When utility behavior changes, verify relevant suites, e.g.:

- `tests/eventEngine.test.js`
- `tests/eventEngine_resolver.test.js`
- `tests/mapGenerator.test.js`
- `tests/simulationUtils.test.js`
- `tests/goldenPath.test.js`

Then run:

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-24._
