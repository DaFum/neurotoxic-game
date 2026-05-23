# Neurotoxic — Code Quality Audit Report

Scope: `src/**` (skipped `node_modules`, `dist`; spot-checked `tests/`).
Audit method: ripgrep verification of every orphan claim; EN/DE locale key diff via Node; `ActionTypes` ↔ reducer map ↔ creator parity check.

Overall health: very good. The reducer/action dispatch system is exhaustively wired (every `ActionTypes.*` member has both an `actionCreator` and a `reducerMap` entry), EN/DE locale key sets are perfectly aligned across all nine JSON files, and no top-level scenes/components are orphaned. Findings concentrate in (a) `||` vs `??` in numeric stat reads, (b) helper functions that are `export`ed only for tests, and (c) two parallel design-token fallback maps.

---

## 1. DUPLICATES

### HIGH

- **`src/components/overworld/OverworldMap.tsx:55-60` ↔ `src/components/stage/stageRenderUtils.ts:4-19`** — Two independent CSS-variable → hex fallback maps. Both list `--*-toxic-green = #00ff41`, `--*-void-black = #0a0a0a`, `--*-star-white = #ffffff`, `--*-ash-gray = #888888`. They use different key prefixes (`--color-` vs bare), but the underlying tokens are the same. Action: **MERGE** into one canonical fallback table re-exported from a token resolver module; have both call sites consume it.

### MED

- **Inline 0–100 clamp** `Math.max(0, Math.min(100, …))` at `src/utils/economyEngine.ts:342-343` while canonical `clamp0to100` lives in `src/utils/gameStateUtils.ts:199`. Action: **MERGE** — import `clamp0to100`.
- **`SongStat` interface (`src/utils/leaderboardUtils.ts:5-9`) ≈ `RhythmSongStatsEntry` (`src/types/rhythmGame.d.ts`)** — both describe `{ songId, score, accuracy }`. Action: **MERGE** — replace `SongStat` with the shared type or move `SongStat` into `src/types/`.
- **`Math.max(0, …)` for player-money clamp** at `src/context/reducers/clinicReducer.ts:54`, `clinicReducer.ts:57` reproduces what `clampPlayerMoney` / `clampPlayerFame` already do (`gameStateUtils.ts:132,231`). Action: **MERGE** — call the canonical clamps for consistency.

---

## 2. ORPHANED / UNINTEGRATED

All listed symbols verified via `rg "\bSYMBOL\b" src/` — match count is the *file count outside the defining file*.

### MED — orphans with no test coverage

- **`formatNumber` (`src/utils/numberUtils.ts:~)`** — 0 src usages; only `tests/node/numberUtils.test.js`. The codebase always uses `formatCurrency` or `entry.score.toLocaleString()` directly. Action: **DELETE** or **INTEGRATE** (e.g. use it in `LeaderboardTab.tsx` instead of bare `toLocaleString()`).
- **`GENERATED_IMAGE_OFFLINE_FALLBACK` (`src/utils/imageGen.ts:6`)** — `getGeneratedImageFallbackUrl()` (line 14) is the only consumer; nothing else imports the constant. Action: **MERGE** — make it a non-exported module local.
- **`TICKET_SALES_CONSTANTS` (`src/utils/economyEngine.ts:155)`** — only consumed inside `calculateTicketIncome` in the same file. Action: drop `export`.

### LOW — exported only for tests (intentional but flagged)

The following helpers are exported only because a `node:test` suite asserts them directly. Listed here so reviewers know the indirection exists; **no action required** unless the codebase moves toward integration-only tests.

- `src/utils/economyEngine.ts`: `calculateTicketIncome`, `calculateFuelCost`, `calculateVenueSplit`, `calculateGuarantee`, `calculateBarCut`, `calculateSponsorshipBonuses`, `calculateGigExpenses` — all internal to `calculateGigFinancials` (line 790+).
- `src/utils/postGigUtils.ts`: `calculateExcessMissMoneyPenalty` (582), `applyPostGigPerformancePenalty` (604) — internal to `calculatePostGigStateUpdates`.
- `src/utils/purchaseLogicUtils.ts`: `applyInventorySet`, `applyStatModifier`, `applyUnlockUpgrade`, `applyUnlockHQ`, `applyPassive`, `EFFECT_HANDLERS` — all internal to `processPurchaseEffect`.
- `src/utils/contrabandUtils.ts`: `pickRarity`, `pickRandomContrabandByRarity`, `DROP_BASE_CHANCE`, `LUCK_MOD_PER_POINT`, `MAX_DROP_CHANCE`, `BUST_CHANCE_BY_RARITY` — only `pickRandomContraband` and `computeDropChance` are consumed externally.
- `src/utils/socialEngine.ts`: `calculateViralityScore` — internal to event roll path (line 418).
- `src/utils/travelUtils.ts`: `resolveVenue` — internal helper only.
- `src/utils/unlockManager.ts`: `clearCache` — only used in tests (`tests/security/unlocksValidation.test.js`, `tests/node/unlockManager.test.js`), which is the intended seam.
- `src/utils/errorHandler.ts`: `initGlobalErrorHandling` — self-invoked at module load (`errorHandler.ts:` bottom); tests import to verify. OK.
- `src/hooks/useAudioControl.ts`: `executeAudioAction`, `createAudioHandlers`, `getAudioSnapshot`, `createAudioSubscriber` — exported only for unit-level testing.
- `src/hooks/useGigEffects.ts`: `calculateChaosStyle`, `playBandMemberAnimation`, `applyChaosJitter` — exported only for `tests/node/useGigEffects.test.js`.
- `src/utils/gameStateUtils.ts`: `FAME_PROGRESS_CONSTANTS`, `RELATIONSHIP_*` constants — used by tests for property-based assertions.

Recommendation: leave these alone unless the team prefers `@__INTERNAL__` JSDoc + integration testing only.

---

## 3. INCONSISTENCIES

### HIGH — `||` instead of `??` on numeric stats where 0 is a valid value

These coerce a legitimate `0` to the default — almost always a latent bug (e.g. a member with `stamina:0` reads as missing rather than depleted).

- `src/context/reducers/clinicReducer.ts:150` — `member.stamina || 0`. Action: **FIX** to `??`.
- `src/context/reducers/clinicReducer.ts:151` — `member.mood || 0`. **FIX**.
- `src/context/reducers/clinicReducer.ts:234` — `member.stamina || 0`. **FIX**.
- `src/utils/arrivalUtils.ts:239` — `player.fame || 0`. **FIX**.
- `src/utils/postGigUtils.ts:403, 506, 777` — `social?.loyalty || 0` / `updatedSocial.loyalty || 0`. **FIX**.
- `src/utils/eventEngine.ts:345` — `gameState.player.money || 0`. **FIX** (money can legally be 0 going into an event).
- `src/utils/simulationUtils.ts:212` — `m.stamina || 0` (skews simulation when any member is at 0). **FIX**.
- `src/utils/socialEngine.ts:794` — `(gameState.player.fame || 0) > 1000` — benign here (compares >0), but inconsistent. **FIX** for hygiene.
- `src/utils/economyEngine.ts:799` — `playerState?.fame || 0`. **FIX**.
- `src/data/postOptions.ts:312-314, 817-818` — `social?.controversyLevel || 0` and `social.loyalty || 0` used in gate conditions and reward math. **FIX**.
- `src/data/chatter/standardChatter.ts:1833, 1838, 1844` — `state.player.fame || 0` in chatter conditions; benign because compared against >0 thresholds, but inconsistent. **FIX**.
- `src/ui/bandhq/DetailedStatsTab.tsx:282` — `social.loyalty || 0` as the displayed value; 0 loyalty would render blank. **FIX**.

This is the largest cluster in the report. A repo-wide AGENTS.md guard already states "Preserve valid falsy values with nullish checks (`??`), not truthy fallbacks (`||`)" — these are direct violations.

### MED — locale-aware number formatting bypassed

- `src/ui/bandhq/LeaderboardTab.tsx:285, 287, 289` — uses bare `entry.score.toLocaleString()` instead of `formatNumber(entry.score, i18n?.language)` (`src/utils/numberUtils.ts:formatNumber`). Action: **INTEGRATE** `formatNumber` (also resolves the orphan reported in §2).

---

## 4. DEAD / UNREACHABLE

No dead reducer cases found. The `gameReducer` map (`src/context/gameReducer.ts:113-159`) contains exactly one entry per `ActionTypes` member (49 each, matching `actionCreators.ts`). The `assertNever(action as never)` at `gameReducer.ts:214` is a documented intentional runtime trap, not dead code.

No permanently-disabled feature flags found.

---

## 5. MISSING INTEGRATION

No fully built but un-wired features were found:

- All 16 scenes under `src/scenes/` are routed in `src/components/SceneRouter.tsx` (verified by name).
- All 32 hooks under `src/hooks/` are imported elsewhere in `src/`.
- All top-level components in `src/components/*.tsx` and `src/ui/*.tsx` are imported by a parent.
- Every `ActionTypes` member has matching `actionCreators` + `reducerMap` entry.
- EN/DE locale key sets are identical across `chatter, economy, events, items, minigame, traits, ui, unlocks, venues`.
- Event sub-modules (`SPECIAL_EVENTS`, `RELATIONSHIP_EVENTS`, …) are aggregated into `ALL_RAW_EVENTS` / `EVENTS_DB` via `src/data/events/index.ts`.

The closest thing to an integration gap is the `formatNumber` orphan + the bare `toLocaleString()` calls in `LeaderboardTab.tsx` — that helper appears designed for exactly this use but was never plugged in.

---

## Tests / orphan reference check

No `tests/` references to deleted src symbols found. The earlier "exported for tests only" cluster (§2 LOW) confirms tests still resolve every symbol they import.

---

## Suggested fix order

1. Sweep the §3 HIGH `||`→`??` cluster (15 sites, mechanical, AGENTS.md-mandated).
2. Wire `formatNumber` into `LeaderboardTab.tsx`; drop the orphan.
3. Merge the two design-token fallback maps (`OverworldMap.tsx` ↔ `stageRenderUtils.ts`).
4. Replace inline 0–100 clamps with `clamp0to100` in `economyEngine.ts`.
5. Decide whether the "test-only" exports in §2 LOW are acceptable; if not, switch their tests to integration form.

Total findings: ~30 (15 HIGH, ~7 MED, ~8 LOW). No HIGH-severity dead code or missing-integration findings — the codebase is well-wired.
