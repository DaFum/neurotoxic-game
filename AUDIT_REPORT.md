# Neurotoxic Codebase Audit — Logic & Feature Review

**Date:** 2026-05-29 · **Branch:** `Audits` · **Mode:** Read-only audit (no files modified)
**Stack:** React 19 + TypeScript (CheckJS strict) + Pixi.js + Tone.js
**Scope:** everything under `src/` (+ `public/locales/` for i18n parity). Tests skipped for primary audit.

## Method

Conventions loaded from root `AGENTS.md` / `CLAUDE.md` and all 43 nested `AGENTS.md` files. The audit
fanned out across six directory partitions (`utils`+`schemas`, `context`, `hooks`+`domain`, `components`,
`scenes`+`ui`, `types`+`data`+i18n). Every orphan was Grep-verified for zero non-self imports across `src/`;
every duplicate was confirmed by reading both implementations; i18n parity was computed by flattening and
diffing all 10 EN/DE namespace pairs. The two highest-impact behavioral findings (#1, #2 below) were
independently re-verified by reading the source.

## Headline

The codebase is in **strong shape against the documented invariants**. Verified clean (zero violations):
no `React.forwardRef`, no `.propTypes` blocks, no hardcoded hex/rgb/`0x` colors or invented color aliases,
no `Tone.now()` leaks outside the audio engine, no direct state mutation / hand-written action objects,
no `any`/`@ts-ignore` at boundaries, no payloadless `createAdvanceDayAction()` callers, `assertNever` traps
present in `gameReducer` + `bandReducer`, all four minigame completion handlers preserve `currentScene`,
prototype-pollution branches return identical references, and **i18n EN↔DE parity is exact (3,128 keys,
zero asymmetry)**. The findings below are concentrated in a few real bugs, orphaned UI primitives, and
`typeof x === 'number'` boundary nits.

---

## 1. DUPLICATES

### MED

- **`MinigameType`** — [SceneRouter.tsx:57](src/components/SceneRouter.tsx:57) re-derives `(typeof MINIGAME_TYPES)[…]` while the canonical union lives at [game.d.ts:49](src/types/game.d.ts:49). Two definitions of one union; can drift. → **MERGE** (import shared type).
- **`GigModifiers`** — local `type GigModifiers = Partial<Record<keyof typeof MODIFIER_COSTS, boolean>> & EconomyRecord` at [economyEngine.ts:72](src/utils/economyEngine.ts:72) shadows the canonical interface at [gig.d.ts:1](src/types/gig.d.ts:1). → **MERGE**.
- **`LoanProfileModal`** — [LoanProfileModal.tsx:18](src/components/assets/LoanProfileModal.tsx:18) re-implements the `LOAN_PROFILES`-mapped profile-select UI already rendered inline in [ChassisAcquisitionModal.tsx](src/components/assets/ChassisAcquisitionModal.tsx). (Also an orphan — see §2.) → **MERGE** the picker into one shared sub-component, or **DELETE**.
- **`isFiniteNumber`** — byte-identical private type-guard duplicated at [bloodBankUtils.ts:3](src/utils/bloodBankUtils.ts:3) and [darkWebLeakUtils.ts:15](src/utils/darkWebLeakUtils.ts:15) (a 3rd copy in `data/chatter/standardChatter.ts:50`). CLAUDE.md forbids private copies. → **MERGE** to shared `finiteNumber.ts`.

### LOW

- **`BrandAlignment`** — local union at [DealCard.tsx:27](src/components/postGig/DealCard.tsx:27) duplicates shared union at [social.d.ts:123](src/types/social.d.ts:123). → **MERGE**.
- **`StashItem`** — local object type at [ContrabandStash.tsx:33](src/ui/ContrabandStash.tsx:33) overlaps shared minimal `StashItem` at [band.d.ts:19](src/types/band.d.ts:19). → **MERGE/clarify**.
- **`readFiniteNumber`** — two distinct helpers with the same name at [pirateRadioUtils.ts:11](src/utils/pirateRadioUtils.ts:11) (value→`null`) and [assetSelectors.ts:241](src/utils/assetSelectors.ts:241) (object+key→`undefined`), both overlapping canonical `finiteNumberOr`. → **MERGE/RENAME**.
- **`toFiniteNumber`** — [numberUtils.ts:6](src/utils/numberUtils.ts:6) is a thin re-wrapper of `finiteNumberOr` ([finiteNumber.ts:8](src/utils/finiteNumber.ts:8)); two public names for one helper. → **MERGE**.
- **Settings glue** — [Settings.tsx:17](src/scenes/Settings.tsx:17) and [SettingsTab.tsx:22](src/ui/bandhq/SettingsTab.tsx:22) independently wire `useSettingsActions` + identical `SettingsPanel` prop-spread. → low-risk; **MERGE** only if a shared wrapper is wanted.
- **`createUpdatePlayerAction` ↔ `handleUpdatePlayer`** — money/fame clamp + fameLevel-derive logic duplicated across [actionCreators.ts:99](src/context/actionCreators.ts:99) and [playerReducer.ts:17](src/context/reducers/playerReducer.ts:17). **Intentional** per the two-layer payload-safety model. → **KEEP** (awareness only — do not merge).

---

## 2. ORPHANED / UNINTEGRATED EXPORTS

> All Grep-verified: appear only at their definition site (+ barrel/tests), zero runtime importers.

### MED

- **`buildMidiTrackEvents`** — [midiUtils.ts:42](src/utils/audio/midiUtils.ts:42), tested but unused; `midiPlayback.ts` rolls its own inline `processMidiTrackNotes`. Parallel/superseded MIDI-event builder. → **DELETE** or **INTEGRATE**.
- **`CrisisModal`** — [BrutalistUI.tsx:977](src/ui/shared/BrutalistUI.tsx:977), exported + barreled, no consumers. → **DELETE** or **WIRE-UP**.
- **`BrutalSlot`** — [BrutalistUI.tsx:1183](src/ui/shared/BrutalistUI.tsx:1183), no consumers. → **DELETE**.
- **`VoidLoader`** — [BrutalistUI.tsx:1226](src/ui/shared/BrutalistUI.tsx:1226), no consumers (App uses its own `SceneLoadingFallback`). → **DELETE**.
- **`StatBlock`** — [BrutalistUI.tsx:896](src/ui/shared/BrutalistUI.tsx:896), no consumers. → **DELETE**.
- **`BrutalTabs`** — [BrutalistUI.tsx:837](src/ui/shared/BrutalistUI.tsx:837), no consumers (BandHQ rolls its own `HQTabButton`). → **DELETE**.
- **`LoanProfileModal`** — [LoanProfileModal.tsx:18](src/components/assets/LoanProfileModal.tsx:18), no import/mount/test; docstring admits "kept for a future refinance flow." → **WIRE-UP** or **DELETE** (recoverable from git).

### LOW

- Decorative/icon primitives in [BrutalistUI.tsx](src/ui/shared/BrutalistUI.tsx) with zero consumers: **`CorporateSeal`** (:682), **`BiohazardIcon`** (:627), **`WarningStripe`** (:601), **`GearIcon`** (:489), **`SkullIcon`** (:410). → **DELETE**.
- Test-only BrutalistUI exports (referenced only by their own `tests/ui/*`): **`HexBorder`, `CrosshairIcon`, `MoneyIcon`, `BrutalFader`, `BrutalToggle`** (last two are legacy shims delegating to `SegmentedSlider`/`ToggleSwitch`). → **DELETE** component+test if the shim contract is dead.
- **`isValidMidiNote`** — [midiUtils.ts:33](src/utils/audio/midiUtils.ts:33), tested, zero src importers (callers use `normalizeMidiPitch(...) !== null`). → **DELETE**.
- **`clearCache`** — [unlockManager.ts:20](src/utils/unlockManager.ts:20), referenced only in tests. → **KEEP** if intentional test seam, else **DELETE**.
- **`handleCompleteQuest` / `handleFailQuests`** — [questReducer.ts:12-14](src/context/reducers/questReducer.ts:12), re-exports of `QuestLifecycle.*` with no production importer (consumers call `QuestLifecycle.*` directly). → **DELETE** re-exports or test against the lifecycle module.
- **`handleUpdateBand`** — [bandReducer.ts:40](src/context/reducers/bandReducer.ts:40), named export unused outside tests (routed internally via the reducer switch). → drop `export` if no test contract relies on it.
- Orphaned locale keys (no `t()` ref, dynamic prefixes checked first), all in `events.json` EN+DE: **`gear_theft.opt3.label/.outcome/.d_6b9d`**, **`gear_theft.opt2.d_8026`**, **`van_breakdown_tire.opt2.d_bb01`** (source `gear_theft` has no opt3; these sub-keys are unreferenced). → **DELETE** (EN+DE together).

---

## 3. INCONSISTENCIES (convention violations)

### MED

- **`handleUpdateSocial` skips loyalty clamp** — [socialReducer.ts:140](src/context/reducers/socialReducer.ts:140) re-clamps `zealotry` + `controversyLevel` but **not** `loyalty` (despite `clampLoyalty` imported at :18 and used at :290/:310), nor the follower metrics. A direct `UPDATE_SOCIAL` dispatch with out-of-range `loyalty` is accepted unclamped, violating the "reducer is final clamp authority" rule. **Verified.** → **FIX** (apply `clampLoyalty`).
- **`asNumber` lets `Infinity` through** — [eventEngine.ts:83](src/utils/eventEngine.ts:83) uses bare `typeof value === 'number'` (no `Number.isFinite`), feeding `delta.player.money/fuel/fame = asNumber(...) + asNumber(eff.value)`. Reducer clamps short-circuit `NaN` but not `Infinity`. Violates the explicit "sanitizers must use `Number.isFinite`" rule. → **FIX** (`finiteNumberOr(v, 0)`).
- **`checkSoftlock` reads persisted fields with bare `typeof`** — [mapUtils.ts:123,139,143,150,181](src/utils/mapUtils.ts:123) on `van.fuel/condition/breakdownChance`, `money/fameLevel`. `Infinity` fuel passes through and falsely reports "can reach any neighbor," masking a softlock. → **FIX** (`finiteNumberOr`).
- **`TourbusTrailerOverlay` hardcoded `alt='Trailer'`** — [TourbusTrailerOverlay.tsx:21](src/components/assets/sections/TourbusTrailerOverlay.tsx:21), user-facing screen-reader text not localized (siblings route `alt` through `t()`). → **FIX** (i18n key).
- **`Credits` role/name strings hardcoded** — [Credits.tsx:22-44](src/scenes/Credits.tsx:22) renders English strings via `CreditEntry` (siblings `CreditHeader`/`CreditFooter` are i18n'd). → **FIX** or confirm intentional band-joke list.
- **MainMenu footer duplicates an i18n'd string** — [MainMenu.tsx:218](src/scenes/MainMenu.tsx:218) hardcodes `© 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL`, duplicating `ui:creditFooter.subtitle`. → **FIX** (use existing key).

### LOW

- **`rivalReducer` toast mixes i18n key + hardcoded English** — [rivalReducer.ts:23](src/context/reducers/rivalReducer.ts:23) sets both `messageKey: 'ui:travel.rivalEncounter'` and a baked English `message`. DE users may get English. → **FIX** (drop `message`, use `options.rivalName`).
- **`TourbusTrailerOverlay` aria-label leaks internal token** — [TourbusTrailerOverlay.tsx:29](src/components/assets/sections/TourbusTrailerOverlay.tsx:29) `aria-label={`slot ${slot.slotType}`}` not i18n'd. → **FIX**.
- **MainMenu version badge hardcoded** — [MainMenu.tsx:140](src/scenes/MainMenu.tsx:140) `'v3.0 // EARLY ACCESS'`. → **FIX** (i18n key).
- **`i18n?.language` vs `i18n?.language ?? 'en'` inconsistency** across post-gig/clinic/pregig currency calls (`ClinicMemberCard.tsx:90`, `GigModifiersBlock.tsx:95`, `PreGigHeader.tsx:34`, `FinancialList.tsx:28`, `NetResult.tsx:16`, etc.). Not a live bug (render-time `i18n` is defined); `?.` is dead defensiveness. → **FIX** (standardize on `i18n.language`).
- **`computeSkillCheckValue` bare typeof** — [eventEngine.ts:550](src/utils/eventEngine.ts:550) `if (typeof bandStat === 'number') return bandStat / 10` yields `Infinity/10` on non-finite. → **FIX**.
- **`effectFormatter` bare typeof + unguarded keys** — [effectFormatter.ts:37](src/utils/effectFormatter.ts:37) (`addStatLine` lacks `Number.isFinite` while sibling `addCurrencyLine` has it) and [:147](src/utils/effectFormatter.ts:147) iterates untrusted inventory keys without `Object.hasOwn`. Display-only. → **FIX**.
- **`usePirateRadio`/`useDarkWebLeak` divergent defensiveness** — [usePirateRadio.ts:30](src/hooks/usePirateRadio.ts:30) try/catch-wraps `validatePirateBroadcast`; [useDarkWebLeak.ts:30](src/hooks/useDarkWebLeak.ts:30) calls its validator unguarded. Same pattern, divergent. → **FIX**.
- **Success-toast key field divergence** — [useDarkWebLeak.ts:49](src/hooks/useDarkWebLeak.ts:49) uses `successToast.messageKey` while `usePirateRadio`/`useBloodBank`/`useMerchPress` use `successToast.message`. Both translated; cosmetic. → **FIX** (standardize on `messageKey`).
- **`useChatterLogic` unguarded indexed read** — [useChatterLogic.ts:31](src/hooks/useChatterLogic.ts:31) reads `bandMembers[i].name` without guarding `bandMembers[i]: BandMember | undefined`. Safe at runtime; diverges from the noUncheckedIndexedAccess rule. → **FIX**.
- **`useGigVisuals` reads both `diff` and `difficulty`** — [useGigVisuals.ts:35](src/hooks/useGigVisuals.ts:35) hedges two field names for one concept (unsettled `Venue` shape). → **FIX** (settle the type).
- **`rivalReducer` impurity** — [rivalReducer.ts:5-44](src/context/reducers/rivalReducer.ts:5) calls `secureRandom` + `getSafeUUID` inside the reducer (creators are payloadless). Contradicts the determinism pattern asset/`advanceDay` reducers follow. → **FIX** (optional — pre-roll in creator).
- **`createClinicEnhanceAction` lone unsanitized creator** — [actionCreators.ts:812](src/context/actionCreators.ts:812) passes payload raw (safe — no player-supplied numerics), but is the only unsanitized creator. → **FIX** (doc comment).
- **`milestones.wealth_*` hardcoded `€` in toast strings** — `public/locales/{en,de}/ui.json:1128` (`€25,000/€5,000/€1,000`) violate the "bare `{{amount}}`, no hardcoded `€`" rule. Fixed thresholds, no interpolation, EN/DE consistent. → **FIX** (optional).
- **Event-label static currency literals** — many `events.json *.optN.label` (e.g. `[-50€]`) + `items.json:99`. Pre-existing, EN/DE consistent. → **LEAVE/track**.

---

## 4. DEAD / UNREACHABLE CODE

### LOW

- **Stale comment block in `useTourbusLogic`** — [useTourbusLogic.ts:218-241](src/hooks/minigames/useTourbusLogic.ts:218) contains leftover reasoning comments ("SFX Triggers moved…", "Check items collected logic requires…") describing code paths not present. → **DELETE** comments only.
- **`gear_theft.opt3.*` dead locale content** — reads as a removed/never-implemented third option (no opt3 in source or engine). → **DELETE** (covered in §2).
- **`handleAdvanceDay` `payload?.rng` branch** — [systemReducer.ts:1769](src/context/reducers/systemReducer.ts:1769) supports an `rng` override + payloadless path reachable only from tests (`advanceDay(state)` always supplies `dayRngStream`). Not strictly dead (tests exercise it). → **KEEP** (test seam — documented to avoid mis-flagging).

> No provably-false conditionals, removed-`ActionType` switch cases, dead imports, or components behind permanently-false flags found. The `actionTypes ↔ reducerMap ↔ creators` three-way contract is fully consistent.

---

## 5. MISSING INTEGRATION

### MED

- **`big_combo` milestone breaks after save/reload** — [milestones.ts:89](src/data/milestones/milestones.ts:89) reads `state.lastGigStats?.maxCombo`, but `sanitizeLastGigStats` ([systemReducer.ts:1379](src/context/reducers/systemReducer.ts:1379)) preserves only `score/misses/accuracy/combo/health/overload` — **`maxCombo` is dropped on `LOAD_GAME`**. Works in-session (snapshot writes `maxCombo`), but after any reload `maxCombo` is `undefined → 0`, so the milestone can never fire. `postGigUtils.ts:225` already works around it with `maxCombo ?? combo`. **Verified by reading source.** → **FIX** (add `maxCombo` to the preserved keys, or standardize snapshot/milestone on `combo`).
- **`buildMidiTrackEvents` never wired** — fully built + tested MIDI-event builder that `midiPlayback.ts` doesn't consume (rolls its own). → **INTEGRATE** or **DELETE** (also §2).

> No other built-but-unwired features. Every scene is mounted by `SceneRouter` (← `App.tsx`); every overworld
> modal is rendered via `OverworldModals.tsx` + `useOverworldModals`; every exported hook has a live caller;
> all config registries (`EVENTS_DB`, `MILESTONES`, traits, HQ items, songs, venues, brand deals, contraband,
> `MODULE_REGISTRY`) are wired and consumed. Kabelsalat is intentionally a scene-local hook cluster, not a gap.

---

## Summary

| Category                   | HIGH  | MED    | LOW    | Total  |
| -------------------------- | ----- | ------ | ------ | ------ |
| 1. Duplicates              | 0     | 4      | 5      | 9      |
| 2. Orphaned / Unintegrated | 0     | 7      | 12     | 19     |
| 3. Inconsistencies         | 0     | 6      | 14     | 20     |
| 4. Dead / Unreachable      | 0     | 0      | 3      | 3      |
| 5. Missing Integration     | 0     | 2      | 0      | 2      |
| **Total**                  | **0** | **19** | **34** | **53** |

No HIGH-severity findings: there are no crashes, security holes, or broken core-loop transitions. The most
impactful items are localized behavioral bugs and architectural drift.

### Top 10 highest-impact items

1. **`big_combo` milestone unreachable after save/reload** — `maxCombo` dropped by `sanitizeLastGigStats` ([systemReducer.ts:1379](src/context/reducers/systemReducer.ts:1379)). **FIX.**
2. **`handleUpdateSocial` skips `loyalty` clamp** — out-of-range loyalty accepted unclamped ([socialReducer.ts:140](src/context/reducers/socialReducer.ts:140)). **FIX.**
3. **`asNumber` lets `Infinity` into money/fuel/fame deltas** ([eventEngine.ts:83](src/utils/eventEngine.ts:83)). **FIX.**
4. **`checkSoftlock` masks softlocks on non-finite van fuel** ([mapUtils.ts:123](src/utils/mapUtils.ts:123)). **FIX.**
5. **`buildMidiTrackEvents` parallel/unused MIDI path** ([midiUtils.ts:42](src/utils/audio/midiUtils.ts:42)). **INTEGRATE/DELETE.**
6. **`LoanProfileModal` orphan + duplicate of inline picker** ([LoanProfileModal.tsx:18](src/components/assets/LoanProfileModal.tsx:18)). **WIRE-UP/DELETE.**
7. **10 orphaned `BrutalistUI` primitives** (`CrisisModal`, `BrutalSlot`, `VoidLoader`, `StatBlock`, `BrutalTabs`, + 5 icons) ([BrutalistUI.tsx](src/ui/shared/BrutalistUI.tsx)). **DELETE.**
8. **`MinigameType` / `GigModifiers` type clones** drift-risk vs canonical `src/types` ([SceneRouter.tsx:57](src/components/SceneRouter.tsx:57), [economyEngine.ts:72](src/utils/economyEngine.ts:72)). **MERGE.**
9. **Hardcoded user-facing strings** — `Credits` roles, `MainMenu` footer/version badge, `TourbusTrailerOverlay` alt — not i18n'd / no DE ([Credits.tsx:22](src/scenes/Credits.tsx:22), [MainMenu.tsx:140](src/scenes/MainMenu.tsx:140)). **FIX.**
10. **`rivalReducer` impurity + hardcoded English toast** — RNG/UUID in reducer, baked English `message` ([rivalReducer.ts:5](src/context/reducers/rivalReducer.ts:5)). **FIX.**

### Cross-cutting theme

The single recurring violation worth a sweep is **bare `typeof x === 'number'` at payload/persisted-value
boundaries** (findings #3, #4, and several LOWs) where the canonical `finiteNumberOr` should be used per
CLAUDE.md. A focused pass replacing these with `finiteNumberOr` / `Number.isFinite` would close most of the
INCONSISTENCIES category.
