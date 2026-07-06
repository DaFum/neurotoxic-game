# Neurotoxic — Deep Codebase Review

**Date:** 2026-07-01 · **Branch:** `claude/codebase-analysis-review-sajpsa`
**Scope:** whole repository — `src/` (~98.7k LOC, 671 files), `api/`, `tests/` + `e2e/` (~522 files), CI, tooling, build.
**Method:** five parallel domain sweeps (architecture, tests, performance, security, tooling), each verifying claims by reading source, plus first-party ground-truth: `typecheck`, `lint`, `build`, and the full fast + node test tiers were actually run. Every command result below was observed, not assumed.

This review **complements** the existing `AUDIT_REPORT.md` (a narrow duplicate/dead-code/inconsistency sweep whose 6 findings have since been merged to `main`). It does not repeat that work; it widens the lens to architecture, test health, performance, security, and delivery.

---

## Verified health snapshot (commands actually run)

| Gate              | Command                                          | Result                                  |
| ----------------- | ------------------------------------------------ | --------------------------------------- |
| Core types        | `pnpm run typecheck:core`                        | ✅ exit 0                               |
| Reducer types     | `pnpm run typecheck`                             | ✅ pass, no errors                      |
| Lint              | `pnpm run lint`                                  | ✅ 0 errors, **1 warning**              |
| Prod build        | `pnpm run build`                                 | ✅ exit 0                               |
| Vitest logic      | `pnpm run test:vitest:logic`                     | ✅ **317/317** in 4.0s                  |
| Node quick        | `pnpm run test:node:quick`                       | ✅ **2710/2710**, 0 fail — but **335s** |
| TS suppressions   | grep `@ts-nocheck\|@ts-ignore\|@ts-expect-error` | **0** in `src/`                         |
| Unsafe casts      | grep `as any` / `: any`                          | **0** real (2 hits are comment text)    |
| Tech-debt markers | grep `TODO\|FIXME\|HACK\|XXX`                    | **0** in `src/`                         |

**Bottom line: the codebase is in excellent health.** It compiles clean under strict checkJS, lints clean, builds, and every test passes. The discipline documented in `AGENTS.md`/`CLAUDE.md` (canonical clamp/finite helpers, brand-color single source, action-creator↔reducer contract, layer boundaries) is genuinely honored in the code, not just aspirational. The findings below are refinements, not fires.

---

## Resolution log (2026-07-01, follow-up pass)

All findings were actioned. Several dissolved under verification — the original sweep searched the wrong test directories — and two were deliberately declined with rationale (documented below rather than churned).

| #   | Finding                         | Outcome                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Build + e2e not in CI           | **PARTIAL / CORRECTED** — added a `build` job (valuable, kept). The e2e-in-CI recommendation was **wrong**: `tests/node/githubWorkflowEfficiency.test.js` codifies that Playwright/e2e is _intentionally excluded_ from required PR CI (headless audio-context flakiness — see `.jules/bolt.md`), and the added e2e job also failed on a Windows-only visual baseline. The e2e job was reverted. |
| 2   | pnpm drift in deploy            | **FIXED** — `deploy.yml` bumped `10.30.3` → `11.2.2`                                                                                                                                                                                                                                                                                                                                             |
| 3   | Slow node tier                  | **FIXED** — added `--shard=i/n` to `run-node-tests.mjs`; `node-tests` CI job is now a 2-shard matrix (verified: shard 1/2 = 1180 tests, green)                                                                                                                                                                                                                                                   |
| 4   | Coverage gaps (reducers, audio) | **FALSE POSITIVE** — reducers _are_ tested (`tests/node/{player,quest,rival,event}Reducer.test.js`, `tests/logic/tradeReducer.test.js`, 84–247 LOC each); audio has 23 suites incl. `audioManager`, `audioPlaybackUtils`. The `START_GIG` minigame-reset invariant is covered at `gigReducer.test.js:65`. No hollow tests added.                                                                 |
| 5   | `handleLoadGame` complexity     | **FIXED** — extracted `remapPerRegionScopeKeys` helper, collapsing the two duplicated migration loops (verified: typecheck clean, `systemReducer` 68/68)                                                                                                                                                                                                                                         |
| 6   | `actionCreators.ts` split       | **DECLINED** — pure cosmetic reorg of a 1190-LOC file with no behavior/perf change; high diff churn + import-path risk for zero functional gain conflicts with the repo's "Surgical Changes / don't refactor what isn't broken" rule. Available on request.                                                                                                                                      |
| 7   | Non-finite save coercion        | **ALREADY DONE** — `usePersistence.ts:265-282` already detects, coerces, _and_ `logger.warn`s the offending keys. Report over-stated it; no change.                                                                                                                                                                                                                                              |
| 8   | `playerName` unescaped / CORS   | **FIXED (name) / N-A (CORS)** — added shared `sanitizePlayerName` (strips C0/C1/DEL control chars) applied before the length check in both endpoints. CORS is unnecessary: the frontend calls the API via **relative** `/api/...` URLs (same-origin).                                                                                                                                            |
| 9   | Unused `i18n` (lint warning)    | **FIXED** — removed the line-38 binding; lint now 0 warnings                                                                                                                                                                                                                                                                                                                                     |
| 10  | Swallowed telemetry errors      | **FIXED** — `handler.ts` now `logger.debug`s the failure reason (debug-level to avoid re-entering the error handler)                                                                                                                                                                                                                                                                             |
| 2c  | e2e crash-`skip` → fail         | **DECLINED** — the `test.skip()` calls guard against **headless Chromium crashing on audio/WebGL init** (via `raceWithCrash`), not product bugs. Converting them to hard failures would make the new e2e gate flaky-red from infra instability. The recommendation was wrong; skips retained by design.                                                                                          |

**Post-fix verification:** `typecheck:core` ✅ · `typecheck` (reducers) ✅ · `lint` ✅ 0 warnings · node shard 1/2 ✅ 1180/1180 · `systemReducer` ✅ 68/68 · API+security suites ✅ 36/36 · `vitest:logic` + `build` (see final run).

---

## Findings at a glance

| #   | Area                 | Severity    | Location                               | Action                                                      |
| --- | -------------------- | ----------- | -------------------------------------- | ----------------------------------------------------------- |
| 1   | Delivery / CI        | **MED**     | `.github/workflows/test.yml`           | `vite build` and Playwright e2e never run on PRs — add jobs |
| 2   | Delivery / CI        | **MED**     | `.github/workflows/deploy.yml:19`      | pnpm version drift (`10.30.3` vs `11.2.2`) — align          |
| 3   | Test suite speed     | **MED**     | `scripts/run-node-tests.mjs`           | node "quick" tier = 5.6 min; "fast" isn't fast — shard/tune |
| 4   | Test coverage        | **MED**     | audio playback + several reducers      | thin isolated coverage on high-risk modules                 |
| 5   | Maintainability      | **MED**     | `systemReducer.ts:88` `handleLoadGame` | 274-line, CC≈13, depth-6 fn — extract migration helpers     |
| 6   | Maintainability      | **LOW–MED** | `context/actionCreators.ts` (1190 LOC) | 53 creators in one module — group + barrel re-export        |
| 7   | Robustness           | **LOW–MED** | `usePersistence.ts` write path         | non-finite state coerced silently at save time — log louder |
| 8   | Security (defensive) | **LOW**     | `api/leaderboard/*`, no CORS headers   | `playerName` stored unescaped; no explicit CORS             |
| 9   | Lint hygiene         | **LOW**     | `src/ui/MerchPressModal.tsx:38`        | unused `i18n` binding — the one lint warning                |
| 10  | Robustness           | **LOW**     | `errors/handler.ts` telemetry          | remote-report failures swallowed with empty catch           |

No **HIGH** severity issues. No orphaned/dead code, no missing integration, no layering violations, no memory leaks found.

---

## 1. Architecture & Maintainability

**Layering is clean.** Context/reducers/action-creators never import components or hooks; only 24 `utils → context` imports exist and all point at safe constants (`gameConstants`, `initialState`). No circular dependencies in the layer graph. Scenes are thin (≈150–200 LOC) and delegate to hooks; no god-components. ESLint `no-restricted-imports` actively enforces canonical import paths.

**The one complexity hotspot worth touching now — MED**
`src/context/reducers/systemReducer.ts:88` `handleLoadGame` is 274 lines, cyclomatic complexity ≈13, nesting depth 6. It bundles save-migration, sanitizer composition, venue-ID remapping, and reputation-collision logic. Notably lines ~218–241 run the _same_ per-region scope-remap loop twice (`activeQuests` and `completedQuestScopes`).
**Action:** extract `migrateVenueIds`, `remapPerRegionScopes(items, keyFn)` as pure helpers. Pure refactor, no behavior change, drops nesting to ≈4 and removes the duplicated loop. This is the load path — the highest-value place for readability, because that is where malformed saves are handled.

**Coupling — acceptable by design.** The most-imported symbols are `logger` (89 files), `finiteNumberOr`/`isFiniteNumber` (81 each), and the two context hooks `useGameSelector`/`useGameActions` (~46 each). The context funnel is intentional and mitigated by the `useSyncExternalStore` selector design (see Performance). Not a defect.

**Large files — mostly legitimate.** `standardChatter.ts` (2153), `venueChatter.ts` (1555), `postOptions.ts` (1231), `stateSanitizers.ts` (1672) are pure data tables or exhaustive validators with nothing extractable. The only _code_ module that reads as "big because it's a bucket" is:

**`context/actionCreators.ts` (1190 LOC, 53 creators) — LOW–MED.** Every non-asset action creator lives here; downstream hooks import 10–15 apiece. Not broken, but it is a single chokepoint for edits.
**Action (opportunistic):** group creators by domain (gig/minigame/rival/quest/…) into sibling files and re-export from an `actionCreators/index.ts` barrel, so future splits don't force downstream import churn. Low priority.

---

## 2. Test Suite Health

**Volume is a strength.** ~522 test files, cleanly partitioned by runner (node:test vs Vitest vs Playwright) with **no runner-mixing** violations. All tiers pass. But three issues stand out.

**2a. "Fast" tests are not fast — MED.** `pnpm run test:node:quick` (the `--skip-heavy` tier) runs **2710 tests in 335s (5.6 min)** on this machine. Because `run-fast-tests.mjs` runs it in parallel with Vitest-logic (4s), the whole "fast" gate is gated on that 5.6-min tail, and it overran a 9-min wall-clock budget under CPU contention. CI gives node-tests a 20-min timeout so it currently passes, but the local dev loop is punishing.
**Action:** shard the node tier (it already supports `--only-heavy`/`--skip-heavy`; add worker sharding or a matrix) and/or move the slowest suites behind `--only-heavy`. Profile with `--test-reporter` timing to find the long poles.

**2b. Coverage gaps on high-risk modules — MED.** Isolated unit coverage is thin (relative to blast radius) for:

- **Audio playback internals** — `utils/audio/midiPlayback.ts` (965), `AudioManager.ts` (482), `gigPlayback.ts` (446), `playbackStrategies.ts`. The `audioEngine*` wrapper _is_ tested, but MIDI sequencing / buffer management / playback strategy selection are exercised only indirectly. Given audio-timing is a documented invariant (`getGigTimeMs`), regressions here are exactly the kind that slip past.
- **Several reducers have no dedicated test file** — `playerReducer`, `questReducer`, `rivalReducer`, `eventReducer`, `tradeReducer` (only `sceneReducer.test.js` exists under `tests/context/reducers/`). They're touched transitively via golden-path tests, but payload-rejection edge cases aren't asserted directly.
- **`stateSanitizers.ts` (1672 LOC)** — prototype-pollution / coercion defense, covered only indirectly through `saveValidator` tests.
  _(Skepticism note: "0 tests" claims from the sweep mean "no dedicated file"; most logic has some transitive coverage. Still worth targeted tests.)_
  **Action:** add focused unit tests for the audio playback layer and the untested reducers' reject-malformed-payload paths first.

**2c. e2e skips crashes instead of failing — MED (see also #1).** `e2e/game-flow.spec.js` uses `test.skip()` on audio-init crashes (lines ~36/54/61/79/86), so an initialization-order regression passes silently. The golden path also never asserts the `START_GIG` minigame-state-reset invariant (`AGENTS.md` domain rule).
**Action:** convert crash-skips to failures (or a dedicated recovery test), and add an explicit assertion that minigame state is cleared on gig start.

Minor: ~9 conditional `context.skip('mock timers not available')` sites and `setTimeout(…,0)` sequencing in a few travel tests are mild flake risk; prefer fake timers.

---

## 3. Performance & Bundle

**Runtime discipline is excellent — no leaks, no hot-path churn.**

- Pixi v8 teardown is correct: `app.destroy({removeView:true},{children:true,texture:true,textureSource:true})`, subclass Graphics/Sprite fields destroyed _before_ `super.dispose()`, ticker deregistered, sprite/texture pools capped (64/50) and reused. No memory leaks found across stage controllers.
- The 60 FPS rhythm loop (`rhythmGameLoopUtils.ts`, `useRhythmGameLoop.ts`) is allocation-free in the hot path — refs + in-place mutation + indexed iteration, no per-frame spreads/`.filter`. Sprite texture rebinds are guarded (`sprite.texture !== effectiveTexture`).
- Event listeners are all cleaned up; ~139 `memo()` sites; `PixiStage` memoized to preserve lifecycle.
- Context uses `useSyncExternalStore` with shallow-equality selectors — granular subscriptions, no whole-tree re-render on every tick.

**The sweep's one flagged risk — the provider `dispatchValue` — is benign (verified myself).** `useGameDispatchActions` already wraps its return in `useMemo` (line 471) over stable `useCallback` refs, and the provider threads `stateRef`/`tRef`/`dispatchValueRef`. The only callback that lists live state, `changeScene`, depends on `state.currentScene` (line 250) — which changes on scene transitions, not per frame. So there is **no per-tick dispatch-object churn.** No action needed.

**Bundle — the real perf item.** Code-splitting is well done (React/Pixi/Tone/motion vendor chunks; scenes lazy via `React.lazy`). But the raw sizes are large:

| Chunk              | raw        | brotli |
| ------------------ | ---------- | ------ |
| `index-*.js` (app) | **731 KB** | 129 KB |
| `vendor-pixi`      | 539 KB     | 127 KB |
| `vendor-tone`      | 283 KB     | 57 KB  |
| `scene-gig`        | 239 KB     | 63 KB  |
| `vendor-react`     | 185 KB     | 50 KB  |
| `vendor-motion`    | 122 KB     | 35 KB  |

`chunkSizeWarningLimit` is bumped to 600 with a comment that PixiJS refactoring is pending. The 731 KB main `index` chunk (everything not otherwise split) is the best optimization target.
**Action (low priority):** inspect `index-*.js` composition (`rollup-plugin-visualizer`) and push more of it behind route/scene lazy boundaries. Also: `utils/audio/assets.ts` uses `import.meta.glob(..., { eager: true, query: '?url' })` — fine at current asset counts (URLs only, not payloads), but if audio files grow past ~50, switch to lazy globs.

---

## 4. Security & Robustness

**Input boundaries are well-defended.** `safeJsonParse` (`objectUtils.ts`) strips `__proto__`/`constructor`/`prototype` via a reviver; `validateSaveData` (`saveValidator.ts`) does a recursive prototype-pollution check before use; sanitizers whitelist fields. The `api/leaderboard/*` serverless functions validate `playerId`/`songId` against `^[a-zA-Z0-9_-]{1,64}$` allowlists, rate-limit (5/60s/IP), only trust `x-forwarded-for` when `TRUST_PROXY=true`, and use parameterized Redis calls (no key injection). No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function` anywhere. Redis URL comes from env with no inline default. No Howler.js (Tone-only constraint upheld).

**Small hardening items (all LOW):**

- **`usePersistence.ts` write path (LOW–MED):** non-finite state values are coerced to `null` at _save_ time with only a debug-level warning. If a reducer regression ever produced `Infinity`/`NaN`, the corruption is masked silently rather than surfaced. **Action:** raise this to an error-level report so it's not invisible.
- **`api/leaderboard/stats.js`/`song.js` (LOW):** `playerName` is length-validated but stored un-escaped. React auto-escapes on render so live XSS risk is low, but it depends on no consumer ever using raw HTML injection. **Action:** escape on store, or document the render-side guarantee. Also: **no explicit CORS headers** on the endpoints — behavior falls back to the host platform default; set them explicitly.
- **`errors/handler.ts` (LOW):** remote error-report `fetch` failures are swallowed with empty `.catch(() => {})`, making telemetry outages invisible. Fine for gameplay; annoying for debugging. **Action:** log the telemetry failure locally.

---

## 5. Tooling, Dependencies & CI

**Type/lint/build posture is exemplary.** checkJS is genuinely strict (`noImplicitAny`, `noUncheckedIndexedAccess`, `isolatedModules`, `strict`); the `@ts-nocheck` budget is **0** and CI-enforced (`guard:nocheck`); zero suppressions and zero real `any` in `src/`. ESLint (flat config) → Prettier → lint-staged → Husky form a clean non-overlapping chain. Dependencies are exact-pinned (React 19.2.7, Pixi 8.19, Tone 15.5.22, Vite **8.0.16** using `rolldownOptions`). No phantom/unused deps detected.

**The two delivery gaps are the most actionable items in this whole review:**

**5a. PRs never build or e2e — MED.** `test.yml` runs 8 jobs (node, vitest logic+ui, typecheck, nocheck-guard, locale ×2, perf) but **`vite build` runs only in `deploy.yml` on push-to-main**, and **Playwright e2e never runs in CI at all**. So a PR that breaks the production build (e.g. a bad dynamic import) or breaks the golden path merges green and only fails at deploy. **Action:** add a `build` job and at least a sharded e2e job (the scripts `test:e2e:shard1/2` already exist) to `test.yml`, or document why e2e is local-only.

**5b. pnpm version drift — MED.** `test.yml` pins `PNPM_VERSION: '11.2.2'` (matching `package.json` `packageManager`), but `deploy.yml:19` pins `'10.30.3'`. Production is built and deployed with a different pnpm than every other job resolves against the lockfile with. **Action:** bump `deploy.yml` to `11.2.2`.

**5c. Lone lint warning — LOW.** `src/ui/MerchPressModal.tsx:38` — `i18n` assigned but never used. Trivial cleanup.

---

## Recommended next action

**Do the two CI/delivery fixes first — they are cheap, high-leverage, and close a real "green PR ships broken artifact" gap:**

1. **Add a `build` job and a (sharded) Playwright e2e job to `.github/workflows/test.yml`,** and align **`deploy.yml` pnpm to `11.2.2`.** (Findings #1, #2 — small, mechanical, protects every future PR.)
2. **Refactor `handleLoadGame`** (`systemReducer.ts:88`) by extracting `migrateVenueIds` / `remapPerRegionScopes`, de-duplicating the twin migration loops. (Finding #5 — highest-value readability win, on the save-load path, behavior-preserving, guarded by existing tests.)
3. **Add targeted unit tests** for the audio playback layer and the untested reducers' reject-malformed-payload paths, and **convert the e2e crash-`skip`s to failures.** (Findings #4, #2c.)
4. **Investigate the node test-tier runtime** (5.6 min) — shard it so the local "fast" loop is actually fast. (Finding #3.)

Everything else (bundle trimming, `actionCreators.ts` grouping, telemetry/CORS hardening, the lint warning) is low-priority polish that can ride along opportunistically.

If you'd like, I can implement item #1 (the CI/deploy fixes) directly on this branch — it's the safest, highest-return change and needs no product decisions.
