# Neurotoxic Codebase Audit — Categorized Findings (2026-06-10)

**Scope:** all of `src/` (tests checked only for orphan references). No files were modified.
**Method:** `symbols.json` exported-symbol index (verified current via `pnpm run symbols:check`) for orphan detection; four parallel deep-search passes (duplicates, inconsistencies, dead code, missing integration); every reported finding re-verified by hand with ripgrep + source reading. Findings the search passes raised that did **not** survive verification are listed under "Rejected candidates" so the fix pass doesn't chase them.

**Headline:** the codebase remains very clean at the import/export level (the prior audit in `AUDIT_FINDINGS.md` still holds there), but this pass found one substantial **missing-integration** gap below the import level: a large slice of the contraband catalog buys stat effects that no gameplay system ever reads.

| # | Severity | Category | Finding | Action |
|---|----------|----------|---------|--------|
| 5.1 | HIGH | Missing integration | 8 additive band stats + `stress` written by contraband effects, never read | INTEGRATE |
| 5.2 | MED | Missing integration | `clumsy` trait has effect + unlock hint but no unlock path | INTEGRATE |
| 3.1 | MED | Inconsistency | `clinicReducer` heal gains not `finiteNumberOr`-wrapped (Infinity passes) | FIX |
| 1.1 | MED | Duplicate | `selectRandomItem` logic inlined twice in `postOptions.ts` | MERGE |
| 3.2 | LOW | Inconsistency | `\|\|` on numeric fields in `minigameReducer` (convention drift, no bug) | FIX |
| 2.1 | LOW | Orphan | `TravelCostsParams` exported interface unused | DELETE |
| 2.2 | LOW | Orphan | Test-only re-export aliases in `useTourbusLogic.ts` | FIX |
| 2.3 | LOW | Orphan | `isOnCooldown` re-export alias in `eventEngineCore.ts` has no consumer | DELETE |

---

## 1. Duplicates

### 1.1 — MED — `selectRandomItem` bounds-checked selection re-implemented inline (×2)

- `src/data/postOptions.ts:353-354` (`perf_smashed_gear` resolve)
- `src/data/postOptions.ts:677-678` (`drama_crowdsurf_fail` resolve)
- Canonical: `src/utils/audio/selectionUtils.ts:18-19` (`selectRandomItem`)

Both sites inline the identical two-line pattern (`Math.floor(roll * len)` then `Math.min(Math.max(0, i), len - 1)`) that `selectRandomItem` already implements. Since these sites hold a precomputed `diceRoll` rather than an RNG function, reuse is `selectRandomItem(members, () => diceRoll)`.

**Action: MERGE.** Note `selectionUtils.ts` lives under `utils/audio/` despite being generic — if the fix pass touches this, consider whether the helper belongs in a neutral `utils/` location (a move, not a copy), but a plain import also works.

Related stylistic-only observation (no action required): `src/data/postOptions.ts:982` bounds the same selection with `% affordableIds.length` instead — correct, just a third style for the same operation.

### Verified clean

- No exact function/constant/type duplicates across files (exported-name collision sweep). Known non-duplicates re-confirmed: `isOnCooldown` (re-export of the `checks.ts` impl), `safeStorageOperation`/`runSafeStorageOperation` (facade), `useAudioControl` (TS overloads), audio barrel/AudioManager layering.
- `finiteNumberOr`/`isFiniteNumber`: no private copies or bare `typeof v === 'number'` re-implementations found.
- `BRAND_COLOR_HEX`: properly the single source for Pixi/SVG hex fallbacks; no re-inlined brand hex.
- Clamp helpers: no inline `Math.min(Math.max(...))` clamps outside the canonical utils (the `postOptions.ts` sites above are the selection pattern, not a value clamp).
- No duplicated economy/threshold magic numbers across files.

---

## 2. Orphaned / Unintegrated Exports

The symbols index is current and shows only 11 candidates; ripgrep verification cleared 8 of them (audio functions consumed via `import * as audioEngine` namespace access). Three survive:

### 2.1 — LOW — `TravelCostsParams` — `src/utils/travelUtils.ts:325`

Exported interface with zero references anywhere in `src/` or `tests/`. The adjacent `calculateTravelCostsAndImpact` takes positional parameters and never uses it; `TravelCostsResult` (same file) *is* used. Looks like a leftover from a refactor to positional args. **Action: DELETE** (then `pnpm run symbols:update`).

### 2.2 — LOW — Test-only re-export aliases `MAX_SPEED`, `SPAWN_RATE_MS` — `src/hooks/minigames/useTourbusLogic.ts:39-40`

`useTourbusLogic.ts` re-exports `TOURBUS_MAX_SPEED as MAX_SPEED` and `TOURBUS_SPAWN_RATE_MS as SPAWN_RATE_MS`; the only consumer is `tests/ui/useTourbusLogic.test.jsx:41-42`. Exporting internals for tests is a deliberate pattern here (`BASE_SPEED`, `TARGET_DISTANCE` likewise), so this is acceptable as-is; the cheapest cleanup is having the test import the `TOURBUS_*` constants from `minigameConstants.ts` directly and dropping the aliases. **Action: FIX (optional).**

### 2.3 — LOW — `isOnCooldown` re-export alias — `src/utils/eventEngine/eventEngineCore.ts:92`

`export const isOnCooldown = isOnCooldownShared` is re-exported through `src/utils/eventEngine/index.ts:2`, but every consumer (`src/data/events/consequences.ts:7` etc.) imports it from `src/utils/gameState` instead. Unused public-API alias. **Action: DELETE** the alias and the barrel re-export (verify `usedByTests` first; keep if a test pins the eventEngine surface intentionally).

### Verified clean

All 50 action creators, all 72 hooks, all scene components, and all runtime/type exports otherwise have verified consumers.

---

## 3. Inconsistencies

### 3.1 — MED — `clinicReducer` heal gains let `Infinity` through to the clamp

- `src/context/reducers/clinicReducer.ts:155-156`: `const staminaGain = Number(payload.staminaGain) || 0` / `const moodGain = Number(payload.moodGain) || 0`
- Used at `:162-166` in `clampMemberStamina(prevStamina + staminaGain, ...)` / `clampMemberMood(prevMood + moodGain)`.

`Number(v) || 0` collapses `NaN` (sanctioned) but **passes `Infinity`/`-Infinity`**, which the clamps then pin to max/0 — a hostile payload becomes a silent full-heal/zero-heal instead of being rejected. The sibling pattern at `src/utils/gameState/delta.ts:350-361` wraps deltas with `finiteNumberOr(...)`, which AGENTS.md designates as the canonical guard for arithmetic-then-clamp addends. **Action: FIX** — `const staminaGain = finiteNumberOr(payload.staminaGain, 0)` (likewise `moodGain`); `finiteNumberOr` already handles the NaN case, so the `Number(...) || 0` step becomes redundant.

### 3.2 — LOW — `||` on numeric fields where `??` is the convention

- `src/context/reducers/minigameReducer.ts:179`: `(state.player.stats?.totalDistance || 0) + dist`
- `src/context/reducers/minigameReducer.ts:203`: `const luck = newState.band?.luck || 0`

No behavioral bug in either (the only falsy numeric value is `0` and the fallback is `0`), but AGENTS.md mandates `??` for valid-falsy preservation, and `||` here also masks `NaN` differently than sibling sites that use `finiteNumberOr`. **Action: FIX** to `?? 0` (or `finiteNumberOr(..., 0)` to match `delta.ts:381`).

### Verified clean (with searches run)

- **Payload sanitization:** no bare `typeof v === 'number'` in arithmetic paths in creators/reducers; `Number.isFinite`/`finiteNumberOr` used throughout.
- **Colors:** `rg '#[0-9a-fA-F]{3,8}\b' src/components src/ui src/scenes` — no hardcoded hex; no invented var aliases (`--color-void`, `--color-blood`, opacity suffixes absent).
- **i18n:** EN/DE key parity is exact across all 10 locale files (programmatic flatten/diff). No hardcoded `€` in components or locale templates; no English literals in JSX where `t()` is the norm.
- **`Object.hasOwn`:** all untrusted property checks compliant (systemReducer, bandReducer, actionCreators spot-verified).
- **`currentGig` gotcha:** zero `currentGig?.venue` accesses.
- **Toast currency baking:** every `formatCurrency` call in reducers/creators passes `i18n.language` (clinicReducer.ts:282, socialReducer.ts:456/571/674); component calls use `useTranslation()` locale.

---

## 4. Dead / Unreachable Code

**No findings.** Verified:

- All 72 action types in `src/context/actionTypes.ts` have reducer handlers (gameReducer map, bandReducer switch with `assertNever` default, asset routing); no `case` labels without a constant, and no constants without a handler.
- No `if (false)` / `if (true)` / hardcoded feature-flag gates anywhere in `src/`.
- `SceneRouter.tsx` routes all 13 `GAME_PHASES` values; all 4 minigame types reachable.
- Story flags (`saw_crisis_50`, `saw_crisis_80`, `comeback_triggered`, etc.) are all both set and checked; quest conditions (`minFame`, `harmonyBelow`, `maxTiktok`, …) all evaluated in `questOfferEngine.ts`.
- No commented-out production code blocks >10 lines; **zero** `TODO`/`FIXME` markers in `src/`.

---

## 5. Missing Integration (primary interest)

### 5.1 — HIGH — Contraband additive band stats are written, reverted, persisted — and never read

**The wiring that exists:**
- `src/data/contraband.ts` defines ~14 items whose `effectType` is one of `tempo` (:84), `crit` (:98), `tour_success` (:124, :216, :295, :362), `crowd_control` (:152, :308), `gig_modifier` (:165, :336), `practice_gain` (:230), `affinity` (:256), `style` (:322), `stress` (:377).
- `USE_CONTRABAND` (bandReducer.ts:728) applies them: `ADDITIVE_BAND_EFFECT_FIELDS` (`src/context/reducers/bandReducer.ts:250-260`) maps each effect type onto a `band.<field>` (`crit`, `crowdControl`, `affinity`, `style`, `tourSuccess`, `gigModifier`, `tempo`, `practiceGain`); `stress` is applied at `bandReducer.ts:528-533` via `clampBandStress`.
- Durations are tracked in `band.activeContrabandEffects`, and `EFFECT_REVERTERS` (`src/context/reducers/systemReducer.ts:1747-1830`) symmetrically reverts every one of these fields on expiry. Save/load sanitization round-trips them (systemReducer.ts:876-892).

**The wire that's missing:** outside the apply/revert reducers, **none of these 9 fields is ever read** — no gig score, practice, tour, crowd, or event calculation consumes them (`rg 'band\??\.(stress|tempo|gigModifier|practiceGain|crit|affinity|crowdControl|style|tourSuccess)\b' src` excluding the two reducers: zero hits). By contrast `band.luck` — the one other field in the same map — **is** consumed (`minigameReducer.ts:203` contraband drop chance, `delta.ts:380-383`), proving the intended consumption pattern. The member-level effect types (`stamina`, `mood`, `stamina_max`, `guitar_difficulty`) also work.

**Player impact:** buying and using most of the contraband catalog costs money/risk and produces a buff that does nothing. Tests/docs treat the apply/revert machinery as intentional (it's carefully symmetric and persisted), so this reads as a built feature awaiting its consumption side, not dead code.

**Action: INTEGRATE** — wire each field into the system its name implies (e.g. `gigModifier`/`crit`/`crowdControl` into gig scoring, `practiceGain` into practice, `tourSuccess` into travel/tour outcomes, `stress` into mood/infighting), or, where a stat is judged out of scope, remove the item + applier + reverter triplet together. Also declare whichever fields survive in `BandState` (`src/types/band.d.ts`) — today they ride through the `as number` escape hatch, so the type system can't catch regressions (see 5.3).

### 5.2 — MED — `clumsy` trait: gameplay effect and unlock hint exist, unlock logic doesn't

- Defined: `src/data/characters.ts:86-90` (`effect: 'stunt_fail_risk'`, `unlockHint: 'traits:clumsy.unlockHint'`).
- Locale promises: `public/locales/en/traits.json:34` — "Requires 2 failed stage dives." (DE equivalent present).
- Consumed if owned: `src/data/postOptions.ts:686` checks `hasMemberWithTrait([targetObj], 'clumsy')` in the crowdsurf-fail resolution — the effect side works.
- Granted: **nowhere.** `checkTraitUnlocks` (`src/utils/unlockCheck.ts:41-193`) covers virtuoso/perfektionist/showman/bandleader/grudge-holder/peacemaker etc., but no branch awards `clumsy`, and no event/quest grants it (`rg clumsy src/data/events src/utils/unlockCheck.ts`: zero hits).

**Action: INTEGRATE** — track failed stage dives (analogous to the existing successful-stage-dive counter used for `showman`) and add the `clumsy` unlock branch to `checkTraitUnlocks` per the hint ("2 failed stage dives"). Per AGENTS.md, the eligibility logic belongs in `unlockCheck.ts` only (persistence stays in `unlockManager.ts`).

### 5.3 — MED — Companion type gap to 5.1

The fields in 5.1 are absent from `BandState` (`src/types/band.d.ts`) and accessed via `(band.crit as number)`-style assertions in both reducers. Whatever 5.1's resolution is, the surviving fields must be declared so checkJS can see them. **Action: FIX** (fold into 5.1's resolution).

### Verified clean

- All action creators have runtime dispatch sites; `createAdvanceDayAction` is correctly only reached through the typed `advanceDay(state)` wrapper.
- All modals, hooks, and scenes are mounted; all minigame and asset flows wired end-to-end.
- Schemas under `src/schemas/` are invoked at their intended boundaries.

---

## Rejected candidates (verified false positives — do not "fix")

| Candidate | Why it's fine |
|---|---|
| `playSFX`, `setMusicVolume`, `setSFXVolume`, `playRandomAmbientMidi/Ogg`, `isAmbientOggPlaying`, `setDestinationMute` "orphans" | Consumed via `import * as audioEngine` namespace access in `AudioManager.ts`/`audioService.ts`; the index's `referencedBy` pass missed only these barrel-mediated cases. |
| `minigameReducer.ts:127` "unsafe indexed read" | Guarded by `if (hitMember)` immediately after the read. |
| Inline `arr[Math.floor(rng() * len)]` sites (useGlitchEffect.ts:17, useChatterLogic.ts:40, proceduralMetal.ts:29, contrabandUtils.ts:107, rivalEngine.ts:24) | All have `??`/`\|\|` fallbacks or guards; converging them on `selectRandomItem` is optional style, not a defect. |
| `Number(payload.x) \|\| 0` in socialReducer | Sanctioned post-`Number()` NaN-collapse per AGENTS.md (clinicReducer 3.1 is flagged only because Infinity reaches an arithmetic-then-clamp path that siblings guard with `finiteNumberOr`). |

---

## Suggested fix-pass order

1. **5.1 + 5.3** — decide per-stat integrate-vs-remove for contraband effects; this is the only finding with real player-facing impact and touches `contraband.ts`, `bandReducer.ts`, `systemReducer.ts`, `band.d.ts`, plus whichever consuming systems get the new reads. Each integrated stat needs reducer-side clamping per convention.
2. **3.1** — two-line `finiteNumberOr` fix in `clinicReducer.ts` + a hostile-payload test (`Infinity` heal).
3. **5.2** — `clumsy` unlock (stat tracking + `unlockCheck.ts` branch + test).
4. **1.1, 3.2, 2.1-2.3** — small mechanical cleanups; run `pnpm run symbols:update && pnpm run symbols:check` after export changes.
