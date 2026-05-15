# Neurotoxic Game Codebase Audit Report

## 1. DUPLICATES

* **MED** - src/utils/audio/rhythmGameAudioUtils.ts [211:5 - 218:27] <--> src/utils/audio/rhythmGameAudioUtils.ts [187:7 - 194:23]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/utils/audio/playback.ts [609:42 - 616:66] <--> src/utils/audio/playback.ts [586:42 - 593:65]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/ui/settings/AudioSettings.tsx [36:25 - 41:18] <--> src/ui/settings/AudioSettings.tsx [26:27 - 31:20]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/data/events/relationshipEvents.ts [110:7 - 117:31] <--> src/data/events/relationshipEvents.ts [47:7 - 54:31]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/socialReducer.ts [293:3 - 309:15] <--> src/context/reducers/socialReducer.ts [172:58 - 188:14]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/socialReducer.ts [357:3 - 367:6] <--> src/context/reducers/socialReducer.ts [229:3 - 239:6]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/socialReducer.ts [384:3 - 400:19] <--> src/context/reducers/socialReducer.ts [257:3 - 272:12]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/socialReducer.ts [401:79 - 434:25] <--> src/context/reducers/socialReducer.ts [278:75 - 311:29]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/socialReducer.ts [434:25 - 461:2] <--> src/context/reducers/socialReducer.ts [311:29 - 338:2]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/minigameReducer.ts [343:3 - 360:70] <--> src/context/reducers/minigameReducer.ts [281:3 - 298:75]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/bandReducer.ts [278:63 - 288:39] <--> src/context/reducers/bandReducer.ts [196:9 - 205:42]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/bandReducer.ts [298:5 - 304:43] <--> src/context/reducers/bandReducer.ts [191:12 - 197:55]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/context/reducers/bandReducer.ts [303:9 - 309:11] <--> src/context/reducers/bandReducer.ts [212:68 - 219:4]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/utils/simulationUtils.ts [162:3 - 167:9] <--> src/utils/simulationUtils.ts [107:3 - 112:4]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/ui/QuestsModal.tsx [58:47 - 196:19] <--> src/ui/QuestsModal.tsx [50:45 - 98:33]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/ui/BloodBankModal.tsx [196:36 - 207:76] <--> src/ui/BloodBankModal.tsx [126:30 - 137:62]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/ui/BloodBankModal.tsx [218:37 - 228:37] <--> src/ui/BloodBankModal.tsx [148:31 - 158:31]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

* **MED** - src/scenes/Overworld.tsx [218:54 - 256:40] <--> src/components/overworld/OverworldModals.tsx [91:44 - 127:42]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Re-implement OverworldModals to remove inline modals in Overworld.tsx.

* **MED** - src/context/actionCreators.ts [840:34 - 869:4] <--> src/context/actionCreators.ts [736:37 - 759:4]
  - Description: Near-duplicate blocks found via jscpd.
  - Recommendation: MERGE - Extract into a shared helper function/component.

## 2. ORPHANED / UNINTEGRATED CODE

* **HIGH** - `src/ui/prototypes/VisualPrototypes.tsx:4`
  - Description: Entire prototype UI file `VisualPrototypes` is unused.
  - Recommendation: DELETE - Remove prototype code if not meant for production.

* **MED** - `src/utils/imageGen.ts:60`
  - Description: Exports `clearImageCache` is never called. Note that `fetchGenImage` is used internally in the same file.
  - Recommendation: DELETE - Remove `clearImageCache` if caching is managed elsewhere.

* **LOW** - `src/components/stage/NoteSpritePool.ts:13`
  - Description: Multiple unintegrated constants (`NOTE_JITTER_RANGE`, `NOTE_INITIAL_Y`, etc) and the `NoteSpriteFactory`.
  - Recommendation: DELETE - Remove unused rhythm game constants.

## 3. INCONSISTENCIES

* **HIGH** - `src/context/actionCreators.ts:250` vs `src/context/reducers/socialReducer.ts:114`
  - Description: In `src/context/actionCreators.ts` and various reducers, clamps are sometimes applied in the action creator (violating the project rule defined in AGENTS.md. Note: Agents are AI assistants used to maintain the codebase, and AGENTS.md provides them with strict architectural rules, context limitations, and usage guidelines for autonomous modifications. Specifically, the rule states that reducers are the final authority for bounded state and action creators should sanitize early but reducers must still apply canonical clamps) and sometimes omitted in the reducer.
  - Recommendation: FIX - Apply `Math.max` early in action creators, but always use canonical clamps in reducers.

* **MED** - `src/ui/settings/AudioSettings.tsx:20`
  - Description: Found hardcoded colors in some UI components instead of using CSS vars like `var(--color-toxic-green)`.
  - Recommendation: FIX - Replace hardcoded colors with `getPixiColorFromToken` or CSS variables.

## 4. DEAD / UNREACHABLE CODE

* **MED** - `src/hooks/usePreGigLogic.ts:18` - `_resetLastMinigameFallback`
  - Description: This fallback function is never invoked. (The minigame it relates to, `kabelsalat`, is integrated properly via `MINIGAME_REGISTRY.kabelsalat.scene`.)
  - Recommendation: DELETE - Remove dead fallback logic.

* **MED** - `src/utils/errorHandler.ts:131` - `withRetry`
  - Description: The `withRetry` error handling wrapper is exported but never utilized anywhere.
  - Recommendation: INTEGRATE - Wrap flaky async calls with `withRetry` or DELETE.

## 5. MISSING INTEGRATION

* **NONE FOUND**
