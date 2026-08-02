# Code Audit Prioritization (2026-05-01)

Prioritization of every open item in [TODO-code-audit-2026-05-01.md](TODO-code-audit-2026-05-01.md). Verification date: 2026-08-02.

## Scoring model

**Priority**

- **P0 — Risk:** correctness, data-loss, or security problem. Do this before new features.
- **P1 — Foundation:** unblocks several other items or eliminates an entire bug class.
- **P2 — Quality:** observability, test depth, maintainability. Ongoing, alongside other work.
- **P3 — Optional:** worthwhile, but with no leverage on other work.
- **F1–F4** — feature backlog (§7), separate scale; see below.

**Effort:** S = small, M = medium, L = large.

Items already completed (§1 invariants suite, §2 pure resolver, §3 idempotency/routing/cancellation odds) are omitted here.

## P0 — do first

| #      | Item                                                       | Effort | Rationale                                                                                                                          |
| ------ | ---------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1.1a   | Narrow `logger.warn` in `gameReducer` to `action.type`     | S      | The default branch still passes the full payload; money amounts and player names reach the console. One-line fix.                  |
| 8.5.1  | `schemaVersion` + migration chain in the save              | L      | Without a version, every save-format change risks destroying player runs. The most expensive failure in this document.             |
| 8.5.6  | Catch migration failures → `createInitialState()`          | S      | Mandatory companion to 8.5.1; a throwing migration must not block boot.                                                            |
| 8.5.3  | Partial/corrupt save recovery tests                        | S      | `saveValidator` tests already cover `__proto__`; add missing keys and truncated JSON.                                              |
| 5.1    | Stable `runSeed` instead of `Date.now()`                   | M      | Blocks reproducible bug reports, map fuzzing (8.6.4), seed sharing (7.13), and weekly seeds (7.9). Highest leverage in this group. |
| 6.2    | Fuzz harness for hostile payloads                          | M      | `checkInvariants` now exists (§1) — the expensive half is built; only the generator in front of it is missing.                     |
| 8.10.7 | StorageAdapter fallback for private browsing               | S      | `localStorage.setItem` throws a `DOMException` in private mode — today a hard crash class.                                         |
| 8.10.6 | Audit `postMessage` / `BroadcastChannel` origin validation | S      | Pure audit; any unvalidated origin is an injection surface.                                                                        |

## P1 — foundation

Each of these unblocks several others. Table order is the recommended sequence.

| #      | Item                                                      | Effort | Unblocks / prevents                                                    |
| ------ | --------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| 4.1    | Balance config (`src/config/balance.ts`, `configVersion`) | L      | 2.3 daily caps, 4.3 smoothing, 7.2 setlist presets, 7.1 cost estimates |
| 8.10.3 | Clock service (`IClock`)                                  | M      | deterministic tests everywhere; counterpart to 5.1                     |
| 8.10.1 | `StorageAdapter` abstraction                              | M      | makes 8.5.x testable without a DOM; the clean form of 8.10.7           |
| 8.4.1  | `IAudioEngine` + `NullAudioEngine`                        | M      | 8.4.2–8.4.6, audio-free CI runs                                        |
| 6.1    | Pure golden-path driver (`applySequence`)                 | M      | fast regression base for every economy/travel change                   |
| 8.7.1  | Flag registry (`FLAGS` as const)                          | M      | kills orphaned flag writes — a silent bug class with no coverage today |
| 8.7.2  | Strictly type `QuestPayload`                              | M      | the quest domain is 14 modules wide and the largest untyped boundary   |
| 5.2    | Fallback template map                                     | M      | prevents run loss on generation failure (today: back to menu)          |
| 8.6.1  | Schema validation after generation                        | M      | prerequisite for 5.2 to be reachable at all                            |
| 8.6.5  | Validate the fallback map too                             | S      | otherwise the fallback can silently become invalid                     |
| 8.6.2  | Exhaustiveness test `MapNode` ↔ `handleNodeArrival`       | S      | a new node type without a handler is a silent fallback today           |
| 4.4    | `BREAKDOWN_LABEL_KEYS`                                    | S      | reduces 8.8.4 to a one-liner; prevents unlabelled economy lines        |
| 8.8.4  | i18n key test for all breakdown labels                    | S      | ship together with 4.4                                                 |
| 8.8.3  | Currency formatting tests across locale switches          | S      | `formatCurrency` is mandated by `AGENTS.md` but untested               |
| 8.8.6  | Boundary test for `NaN` / `Infinity` / `-0`               | S      | fits the existing `finiteNumberOr` convention                          |
| 8.2.5  | Keep action payloads serializable (test)                  | S      | protects 8.5.x — non-serializable payloads break saves silently        |
| 8.4.2  | Gig clock drift tolerance test                            | S      | gig timing is core gameplay and has no contract test today             |
| 8.4.3  | `withAudioContext(fn)` guard                              | S      | autoplay-policy failures are a real, user-visible failure class        |
| 8.5.2  | Round-trip serialization tests per slice                  | S      | cheap insurance for the migration work in 8.5.1                        |
| 8.9.7  | Dead-code detection (`knip`/`ts-prune`) in CI             | S      | very cheap, high signal, usable immediately                            |

## P2 — quality and observability

Ongoing; no fixed order.

**Reducer & actions:** 1.1b dev metric for unknown actions (identical to 8.2.4 — implement as one item) · 8.2.1 derive `ActionPayloadMap` · 8.2.2 snapshot tests per action creator

**Events:** 2.2 replay fixtures for event deltas · 2.3 category-based `dailyCaps` (after 4.1) · 8.7.3 multi-step chain integration test · 8.7.4 resolver re-entry guard

**Economy:** 4.2 trace mode · 8.8.1 complete the typed `EconomyBreakdown` DTO · 8.8.5 determinism contract test

**Travel & map:** 3.4 property tests for travel outcomes · 5.3 structured map failure signatures · 8.6.4 map fuzz across 1,000 seeds (after 5.1)

**Hooks:** 8.3.1 ban raw `dispatch` · 8.3.2 `renderHook` integration tests · 8.3.3 tear-down contracts · 8.3.4 selector identity tests · 8.3.6 concurrent dispatch tests

**Audio:** 8.4.4 cross-module event ordering · 8.4.5 latency budget for `scheduleNote` · 8.4.6 version audio session state separately

**Persistence:** 8.5.5 max save size check

**Modules & CI:** 8.1.3 extend `no-restricted-imports` to further domain folders (base already exists) · 8.1.6 dependency graph / cycle check · 8.9.1 split unit/integration/e2e · 8.9.2 boundary check in the standard lint step · 8.9.3 pinned fixtures, no network fetches · 8.9.5 per-module coverage thresholds · 8.9.6 test duration budget · 6.3 perf budgets

**External boundaries:** 8.10.2 environment service · 8.10.4 document browser API fallbacks · 8.10.5 weekly dependency freshness check

**Docs:** 9.2 design-intent comments · 9.3 cross-module contracts note

## P3 — optional

1.2 `satisfies ReducerMap` (marked "intentional" in the audit) · 2.4 `IEventAnalytics` · 4.3 anti-swing smoothing · 8.1.1 `_` prefix convention · 8.1.2 `src/contracts/` · 8.1.4 contract violation tests · 8.1.5 breaking-change policy · 8.2.3 `assertNever` typetest · 8.2.6 commands/events renaming (large rename, small return) · 8.5.4 save checksum · 8.6.6 map render golden snapshot · 8.7.5 flag write audit log · 8.7.6 `MAX_FLAGS_PER_RESOLUTION` · 8.8.2 visual regression snapshots · 8.9.4 schema drift job · 9.1 structured TODO IDs

## Feature backlog (§7)

A separate scale, because player value rather than risk decides here. Items within a tier are unordered.

### F1 — best value per effort, reuses existing systems

- **7.1 band morale forecast** — `calcCancellationRisk` already exists (§3); the panel is almost pure UI.
- **7.1 travel budget assistant** — one pure function plus a prompt; makes the game's most opaque decision legible.
- **7.5 post-gig coaching prompts** — derives entirely from the existing `EconomyBreakdown`.
- **7.19 what-changed diff cards** and **mechanic explainers** — same data source as the 4.2 trace.
- **7.8 glossary with live examples**, **failure recovery nudges**, **input timing calibration** — accessibility with a small footprint.
- **7.12 transparent penalty inspector**, **bad-luck protection window** — directly address the opacity the audit calls out.
- **7.3 travel incident minichoices** and **7.2 soundcheck tradeoff events** — run entirely through the existing event system; no new subsystem.

### F2 — real systemic depth, medium effort

7.1 venue relationships · tour leg planner · regional heatmap overlay | 7.2 promoter negotiation · setlist presets (after 4.1) · local scene intel · crew assignment | 7.4 encore decision · adaptive crowd · spotlight moments · difficulty assists · heckler interaction windows (projectile hazard exists, the decision window does not) | 7.5 fan segment progression · narrative consequence chains · season goals · debrief timeline | 7.6 merch strategy · staff hiring · insurance · sponsorship · debt tools | 7.3 road conditions · supply stops · band banter · emergency detours

### F3 — flavour and variance, after F1/F2

7.7 factions/media/rivals/community/city state · 7.10 narrative & characters · 7.11 band identity · 7.15 audio & stagecraft · 7.16 procedural variance · 7.17 gear & crafting · 7.21 chaos comedy · 7.22 meme culture · 7.23 venue weirdness · 7.24 off-stage life

### F4 — blocked or infrastructure-dependent

- **7.9 live-ops** — needs 5.1 `runSeed` plus a seed distribution strategy.
- **7.13 creator tools** — seed share cards also depend on 5.1.
- **7.18 social & competition** — `useLeaderboardSync` is a starting point; the rest needs backend decisions.
- **7.14 platform & session** — overlaps heavily with 8.5.x; only sensible after the persistence work.
- **7.20 experimental modes** — worth doing once F1/F2 have stabilised the core loop.

### Architecture caveat

**7.8 run advisor mode** is described in the audit as a "middleware check before dispatch". That conflicts with the `AGENTS.md` rule that all state changes flow through typed action creators with the reducer as the authority. Redesign it as a pure selector over state rather than a dispatch interceptor before implementing.

## Recommended sequence

1. **All of P0** — starting with 1.1a (one-liner), then the persistence block 8.5.1/8.5.6/8.5.3, then 5.1.
2. **P1 foundation** in table order; the S-effort items at the end of the table are cheap pickups.
3. **F1 features** in parallel — they need almost no new infrastructure and make progress visible.
4. **P2** ongoing, preferably in the same PR as the change the item relates to.
5. **F2**, then **P3** and **F3/F4** as needed.
