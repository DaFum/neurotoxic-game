# Neurotoxic Codebase Audit — Logic & Feature Review

**Scope:** read-only audit of `src/` (509 source files) + `public/locales/`. Skipped `node_modules/`, `dist/`, `public/` assets, and test files (except where tests reference deleted/renamed symbols).
**Method:** five parallel audit agents, one per methodology, each grounded in root + nested `AGENTS.md`/`CLAUDE.md` conventions and cross-checked against `symbols.json` (`usedBy`/`dependencies` graph). Every orphan was Grep-verified; every duplicate was confirmed by reading both implementations.

**Headline:** The codebase is unusually clean. The action pipeline is fully wired (all 66 `ActionTypes` emitted + handled; all 62 action creators dispatched; all 66 hooks called; all 218 components mounted). Locale key/placeholder parity is perfect across all 10 EN/DE pairs. No hardcoded colors, no `forwardRef`, no `propTypes`, no `@ts-ignore`/`@ts-nocheck`, no stale reducer cases, no broken imports (both typechecks pass). Findings are concentrated in a single orphaned selector, one reducer clamp gap, dead locale keys, and minor utility re-rolls.

---

## Category 1: Duplicates

No exact copy-paste of nontrivial logic exists. Currency/number formatting, state clamps, finite-number guards, UUID/RNG, color resolution, localStorage wrappers, and forbidden-key checks are all centralized and broadly reused. Action-creator/reducer-handler name pairs are the project's intentional convention, not duplication.

### Near

- **[MED]** `applyReputationDelta` (src/domain/questEffects.ts:44) ⇄ `applyVenueReputationDelta` (src/domain/questEffects.ts:63) — Structurally identical immutable-delta appliers (`finiteNumberOr(...) → clampReputation(prev + amount) → spread back`); diverge only by target slice (`reputationByRegion` vs `reputationByVenue`). Trivially parameterizable. — **Action:** MERGE
- **[LOW]** `handleError` (src/utils/errorHandler.ts:450) ⇄ `handleError` (src/utils/eventEngine/helpers.ts:23) — Same exported name, different intent (general logger+toast vs tiny event-condition logger). Name collision is a grep/readability hazard, not redundant logic. — **Action:** INTEGRATE (rename event-engine one to `logEventError` or delegate)
- **[LOW]** inline plain-object guard (src/data/postOptions.ts:56-66) ⇄ `isPlainRecord` (src/utils/objectUtils.ts:56) — Inline guard reproduces `isPlainRecord`, differing only by additionally accepting a null prototype. — **Action:** INTEGRATE

### Re-implemented utilities

- **[LOW]** Reputation-key validation tail repeated 3× inside src/domain/questEffects.ts — `getVenueReputationKey` (:20), `getRegionReputationKey` (:36), `getBrandReputationKey` (:87) all end with the same `typeof key === 'string' && key.length > 0 && !isForbiddenKey(key) ? key : undefined`. — **Action:** INTEGRATE (extract `validReputationKey`)
- **[LOW]** Inline `finiteNumberOr` re-roll — src/utils/merchUtils.ts:49 computes `typeof value === 'number' && Number.isFinite(value) ? value : 0`, exactly `finiteNumberOr(value, 0)` (CLAUDE.md discourages this inline form). — **Action:** INTEGRATE
- **[LOW]** Inline Fisher–Yates shuffle duplicated — src/utils/eventEngine/eventSelection.ts:171 ⇄ src/scenes/kabelsalat/hooks/useKabelsalatShuffle.ts:52. Same algorithm; diverge on sparse-hole handling (throw vs continue). No shared shuffle util exists. — **Action:** INTEGRATE (shared `fisherYatesShuffle(arr, rng)`)
- **[LOW]** Inline `clamp01` (`Math.max(0, Math.min(1, x))`) repeated across ~15 sites (ui/shared/VolumeSlider.tsx:22, ui/settings/AudioSettings.tsx:41, utils/audio/playback.ts:91/102, utils/audio/midiPlayback.ts:159/603, utils/audio/AudioManager.ts:157/362/397, utils/assetTicks.ts:46-48, utils/economy/gigLogic.ts:733, hooks/minigames/useAmpLogic.ts:201/228, …). No `clamp`/`clamp01` util exists. — **Action:** INTEGRATE (add `clamp01`/`clamp` helper, likely in gameStateUtils.ts)

---

## Category 2: Orphaned / Unintegrated Exports

214 of 215 zero-cross-file-consumer symbols are legitimate (same-file Props/Return types, barrel re-exports, dynamic `import()` scene/phase components mounted via `m.Name`, internally-used consts). Exactly one true orphan:

- **[MED]** `selectLiabilitiesMap` (src/utils/assetSelectors.ts:644) — Exported memoized `Map<assetId, Liability>` selector with ZERO references in `src/` or `tests/`. Sibling of the live, wired `selectAssetSlotsMap` (:600); produced by the "optimize-liabilities" work but never adopted — callers still iterate `Object.values(state.liabilities)` directly (assetSelectors.ts:297, :576). Its memo cache vars `lastLiabilitiesForMap` (:583) and `liabilitiesMapCache` (:584) are dead with it. **Flagged independently by both the orphan and dead-code agents.** — **Action:** INTEGRATE (replace direct `state.liabilities` iterations) or DELETE if optimization abandoned

---

## Category 3: Inconsistencies (Convention Violations)

i18n key parity, placeholder parity, hardcoded colors, `||`-vs-`??`, `Tone.now()`, `forwardRef`, `propTypes`, hand-written action objects, `assertNever`/exhaustiveness, and `@ts-ignore`/`@ts-nocheck` were all checked and are **clean** (see notes below). Real findings:

### State clamp skips

- **[MED]** Raw money writes skip `clampPlayerMoney` — src/context/reducers/assetReducer.ts:124, 199, 309, 389, 447, 485, 562 — `money: state.player.money - <cost>` written raw. Every other money-mutating reducer (clinicReducer, playerReducer, socialReducer, minigameReducer) wraps writes with `clampPlayerMoney` (floors at 0, collapses non-finite). assetReducer's six paths skip it, so a malformed/replayed dispatch bypassing the action-creator affordability check can drive `player.money` negative, and stored non-finite money won't be normalized. Violates the documented "reducers remain the final authority, re-clamp computed state" invariant. — **Action:** FIX (wrap each in `clampPlayerMoney`)

### Sanitizer type checks

- **[LOW]** Bare `typeof contrabandDelivered === 'number'` — src/context/reducers/minigameReducer.ts:582 — Bare typeof in a reducer where convention prefers `Number.isFinite`. Mitigated: input already normalized via `clampNonNegative(Number(...) || 0)` in the creator, and only gates a `> 0` quest emit (NaN fails `> 0`). Cosmetic. — **Action:** FIX (low priority)

### Arithmetic-then-persist without `finiteNumberOr`

- **[LOW]** `band[field] = (band[field] || 0) + value` — src/context/reducers/bandReducer.ts:299 — Additive band-field write without clamp and without wrapping the addend in `finiteNumberOr`. Mitigated: `value` is sourced from static config, not persisted save state, so the save-load corruption boundary doesn't apply (sibling at :571 does use `clampMemberMood(finiteNumberOr(...))`). — **Action:** FIX (defense-in-depth, low priority)

### Cleared (no violations)

Hardcoded colors (only `brandColors.ts` SoT + `rgb(var(--…))`), `||`-vs-`??` (all are `0`-fallbacks or post-`Number()` NaN-collapse), `Tone.now()` (only inside the audio engine layer that defines the timing primitive), `forwardRef` (none), `propTypes` (none), hand-written action objects (the only inline `dispatch({type})` targets a _local_ `useReducer` for rhythm-minigame UI, out of scope), `assertNever` (root reducer + bandReducer switch both trap exhaustively; sub-reducers use `Object.hasOwn` dispatch tables with no `default`), `@ts-ignore`/`@ts-nocheck` (none).

---

## Category 3/5: i18n Parity

**Key parity: PERFECT** across all 10 EN/DE pairs (assets 303, chatter 1158, economy 266, events 1042, items 204, minigame 11, traits 45, ui 1375, unlocks 1, venues 66 — identical counts both sides). **Placeholder parity: PERFECT** (no `{{…}}` mismatches). **`ui.json` hardcoded `€`: NONE** (bare `{{amount}}` convention intact). Only genuine findings are untranslated leftovers in the low-traffic feature-catalog panel:

- **[LOW]** `de.ui:featureList.sec13.items.2/3/4` — `"Deadlines"`, `"Rewards"`, `"Failure Penalties"` left in English while sibling list items are translated. — **Action:** FIX
- **[LOW]** `de.ui:featureList.sec15.items.2/3/4` — `"Loyalty"`, `"Zealotry"`, `"Controversy"` left in English while siblings translated. — **Action:** FIX

(The raw identical-value scan flagged ~300 more, but all are proper nouns, intentional English UI tokens like `SETLIST`/`FAME`, placeholders, or established German loanwords — not defects.)

---

## Category 4: Dead / Unreachable Code

No `if (false)`/`&& false` conditionals, no stale reducer cases (reducerMap exhaustively covers `ActionTypes`), no permanently-false feature gates (`VERCEL_TELEMETRY_ENABLED` etc. resolve from env at runtime), no broken imports (both typechecks pass).

### Unused declarations

- **[MED]** `selectLiabilitiesMap` + memo cache — src/utils/assetSelectors.ts:583-584, 638-657 — Dead exported selector and its module-level cache state (`lastLiabilitiesForMap`, `liabilitiesMapCache`), read/written only inside the dead function. Same finding as Category 2 (corroborated across two agents). Live equivalent is the sibling `selectAssetsMap`. — **Action:** DELETE (verify `Liability` type import still needed elsewhere in the file first)

### Commented-out code

- **[LOW]** Stale signature fragment — src/ui/bandhq/SetlistTab.tsx:110 — `// { setlist, setSetlist, addToast }) => {` leftover from a prior implementation, below the live destructure on :109. Only commented-out code fragment in `src/`. — **Action:** DELETE

---

## Category 5: Missing Integration

The action/hook/component/registry pipeline is **fully wired** — no action creator without a dispatch site, no reducer case without an emitting creator, no unmounted component, no uncalled hook, no orphaned registry entry. The only gaps are dead locale keys with no `t()` lookup (dynamic prefixes from `public/locales/AGENTS.md` accounted for):

- **[LOW]** `checklist.*` (7 keys: done, header, task1–task4, waiting) — public/locales/{en,de}/ui.json — No `t()`/dynamic-prefix reference; removed/unbuilt checklist UI. — **Action:** DELETE (or WIRE-UP if intended)
- **[LOW]** `setlistSelector.*` (7 keys: label, diffHard/diffExpert/diffInsane, track1–track3) — ui.json — Zero references. — **Action:** DELETE
- **[LOW]** `decryptor.*` (4 keys: click, locked_aria, unlocked, unlocked_aria) — ui.json — Zero references. — **Action:** DELETE
- **[LOW]** `confirm_delete`, `confirm_delete_text`, `hqNavigation`, `set_label_to_segment`, `sign_contract` — ui.json — Standalone keys, no `t()` lookup. — **Action:** DELETE
- **[LOW]** `assets:common.dailySuffix` — assets.json — Zero references. — **Action:** DELETE
- **[LOW]** HQ unlock-target keys `hq_coffee.*`, `hq_sofa.*`, `hq_label.*`, `hq_old_couch.*`, `hq_poster_wall.*`, `hq_cheap_beer_fridge.*`, `hq_diy_soundproofing.*` (14 keys) — items.json — Describe `unlock_hq` _target_ ids (never displayed; see hqItems.ts:560 "tracked for ownership only … pending implementation"), distinct from the rendered `hq_room_*` catalog ids. — **Action:** WIRE-UP (unlocked-HQ display is intended)
