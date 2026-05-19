# Neurotoxic Code-Quality Audit Findings

Scope: `src/` primary audit, with targeted `tests/` ripgrep checks for orphan
verification. Orphan claims below were verified with `rg`.

## Resolution Status (this pass)

Branch: `claude/fix-branddeal-i18n-FgUJo`. Commits: `c9d7dfe`, `57c419a`,
`c14eea5`.

### Fixed

- **brandDealI18n null-input guard** — `getTranslatedBrandDealDisplay` now
  returns `null` for non-object `deal` before dereferencing fields.
- **`createUpdateRivalBandAction` powerLevel sanitization** — coerce to
  finite non-negative number in the action creator.
- **`createAdvanceQuestAction` amount sanitization** — coerce to finite
  non-negative number in the action creator.
- **Hardcoded `€` currency strings** — switched to locale-aware
  `formatCurrency(value, i18n.language)` in `GigModifierButton`,
  `MerchPressModal`, `BloodBankModal`, `DarkWebLeakModal`, `bandhq/StatsTab`,
  `bandhq/ShopItem`, `bandhq/CatalogTab`, `bandhq/DetailedStatsTab`,
  `bandhq/LeaderboardTab`, `overworld/OverworldHUD`, and `effectFormatter`
  (with a `language` parameter threaded from `EventModal`). Test
  expectations updated accordingly.
- **`MinigameKey` unused type export** — deleted.
- **`DEFAULT_RIVAL_BAND_STATE` made file-local** — `export` dropped.
- **`createPersistedState` made file-local** — `export` dropped.
- **Audio import boundary** — `getScheduledHitTimeMs` now imported through
  `audioEngine.ts` (it was already re-exported via `* from './timingUtils'`).
- **Hardcoded RGBA shadow color** — `SupplyStopModal` now uses
  `var(--color-toxic-green-10)`.
- **Hardcoded Pixi lane color fallbacks** — removed redundant hex args in
  `useRhythmGameState.ts`; the centralized `PIXI_TOKEN_FALLBACKS` table
  already supplies token-specific fallbacks.

### Skipped (with reason)

- **`CrisisModal`, `BrutalToggle`, `BrutalTabs`, `StatBlock`, `BrutalFader`,
  `BrutalSlot`, `VoidLoader`, icon exports (`MoneyIcon`, `SkullIcon`,
  `GearIcon`, `BiohazardIcon`, `CorporateSeal`)** — these UI primitives have
  dedicated Vitest coverage in `tests/ui/`. Deleting them removes intentional
  library surface; integrating requires product direction. Out of scope for
  a mechanical audit pass.
- **`CONNECTOR_TYPES` (Kabelsalat)** — same: unclear if this is intentional
  forward-looking content for validation logic.
- **`formatNumber` (numberUtils)** — already used as a helper by
  `formatCurrency` chain; wiring it into every numeric display is a
  feature-scope refactor.
- **`VAN_DAMAGED` / `RENTAL_VAN` story flags** — written by events but never
  read. Either remove the writes (drops content) or integrate consequences
  (feature work). Needs product decision.
- **`@ts-expect-error` and `assertNever(action as never)` in reducers** —
  source-commented as intentional. The first is a known TS limitation around
  index narrowing of the reducer map; the second is an unreachable-by-guard
  default. Removing requires deeper reducer-typing rework.
- **Audio submodule imports inside `src/utils/audio/rhythmGameAudioUtils`
  consumers** — re-exporting `rhythmGameAudioUtils` symbols through
  `audioEngine.ts` transitively pulled the module into all `audioEngine`
  consumers and broke several `mock.module(...)` setups across
  `tests/node/`. Kept the direct submodule imports for these specific
  helpers; routed only the trivially safe re-exports through the hub.

## DUPLICATES

No remaining findings in this section after the selected cleanup pass.

## ORPHANED / UNINTEGRATED CODE

| Severity | Location                                                                      | Finding                                                                                                                                                              | Recommended action                                                       |
| -------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| HIGH     | `src/ui/shared/BrutalistUI.tsx:964`                                           | `CrisisModal` is fully built but has no `src/` consumer except the shared barrel export. Looks intended for crisis events but is never rendered.                     | INTEGRATE into crisis/event flow or DELETE.                              |
| MED      | `src/ui/shared/BrutalistUI.tsx:743`, `:833`, `:892`, `:909`, `:1170`, `:1213` | `BrutalToggle`, `BrutalTabs`, `StatBlock`, `BrutalFader`, `BrutalSlot`, and `VoidLoader` are exported only through `src/ui/shared/index.tsx`; no real app consumers. | move to story/demo-only surface.        |
| LOW      | `src/ui/shared/BrutalistUI.tsx:304`, `:406`, `:485`, `:623`, `:678`           | `MoneyIcon`, `SkullIcon`, `GearIcon`, `BiohazardIcon`, `CorporateSeal` are not used by app code. `MoneyIcon` has tests only.                                         | integrate intentionally.                   |
| LOW      | `src/scenes/kabelsalat/kabelsalatConstants.ts:97`                             | `CONNECTOR_TYPES` is exported and covered by local AGENTS guidance, but has no code or test references.                                                              | INTEGRATE into Kabelsalat validation/UI.                |
| ~~LOW~~  | ~~`src/utils/minigameRegistry.ts:26`~~                                        | ~~`MinigameKey` exported type is unused.~~                                                                                                                           | **FIXED** — removed.                                                     |
| ~~LOW~~  | ~~`src/context/initialState.ts:76`~~                                          | ~~`DEFAULT_RIVAL_BAND_STATE` is exported but only used inside `initialState.ts`.~~                                                                                   | **FIXED** — made file-local.                                             |
| ~~LOW~~  | ~~`src/context/usePersistence.ts:74`~~                                        | ~~`createPersistedState` is exported but only used inside `usePersistence.ts`.~~                                                                                     | **FIXED** — made file-local.                                             |
| LOW      | `src/utils/numberUtils.ts:22`                                                 | `formatNumber` has tests but no `src/` consumers; UI still formats many numbers inline.                                                                              | INTEGRATE into numeric UI.                       |

## INCONSISTENCIES

| Severity | Location                                                                                                                                                                         | Finding                                                                                                                                               | Recommended action                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| HIGH     | `src/hooks/rhythmGame/useRhythmGameAudio.ts:14`, `src/hooks/rhythmGame/useRhythmGameScoring.ts:18`, `src/components/pregig/SetlistBlock.tsx:4`, `src/hooks/usePreGigLogic.ts:20` | Files outside `src/utils/audio/` import audio submodules directly. Routed `getSongId` and `getScheduledHitTimeMs` through `audioEngine.ts`. **Partial: `rhythmGameAudioUtils` kept as direct submodule import** because re-exporting via the hub broke `mock.module(...)` setups in `tests/node/` (transitive load pulled `simulationUtils`, `errorHandler.AudioError`, etc.). | **PARTIAL FIX** — surface-level helpers re-routed; deeper rhythm-game helpers left as-is.                   |
| ~~MED~~  | ~~`src/context/actionCreators.ts:650`~~                                                                                                                                          | ~~`createAdvanceQuestAction` passes raw `amount`.~~                                                                                                   | **FIXED** — coerce to finite non-negative.                                                                  |
| ~~MED~~  | ~~`src/context/actionCreators.ts:566`~~                                                                                                                                          | ~~`createUpdateRivalBandAction` `powerLevel` copied raw.~~                                                                                            | **FIXED** — coerce to finite non-negative.                                                                  |
| ~~MED~~  | ~~`src/ui/GigModifierButton.tsx:41`, `src/ui/bandhq/StatsTab.tsx:24`, `src/ui/BloodBankModal.tsx:68`, `src/ui/DarkWebLeakModal.tsx:41`, `src/ui/bandhq/ShopItem.tsx:117`~~       | ~~Money rendered with raw `€` strings.~~                                                                                                              | **FIXED** — use `formatCurrency`.                                                                           |
| ~~MED~~  | ~~`src/ui/bandhq/DetailedStatsTab.tsx:104`, `src/ui/bandhq/CatalogTab.tsx:8`, `src/ui/bandhq/LeaderboardTab.tsx:281`, `src/ui/overworld/OverworldHUD.tsx:186`, `src/ui/MerchPressModal.tsx:121`, `src/ui/MerchPressModal.tsx:166`, `src/utils/effectFormatter.ts:44`~~ | ~~Additional hardcoded `€` displays.~~                                                                                                                | **FIXED** — use `formatCurrency`; `effectFormatter` threads `language`.                                     |
| MED      | `src/context/gameReducer.ts:172`, `src/context/gameReducer.ts:212`, `src/context/reducers/bandReducer.ts:541`                                                                    | `@ts-expect-error` and `assertNever(action as never)` weaken strict typing.                                                                           | Skipped — source-commented as intentional; rework requires deeper reducer-typing changes.                   |
| ~~LOW~~  | ~~`src/ui/SupplyStopModal.tsx:86`~~                                                                                                                                              | ~~Hardcoded Tailwind arbitrary RGBA shadow color.~~                                                                                                   | **FIXED** — use `var(--color-toxic-green-10)`.                                                              |
| ~~LOW~~  | ~~`src/hooks/rhythmGame/useRhythmGameState.ts:180`~~                                                                                                                             | ~~Lane colors pass hardcoded hex fallbacks.~~                                                                                                         | **FIXED** — drop fallback arg; rely on centralized `PIXI_TOKEN_FALLBACKS`.                                  |
| LOW      | `src/components/stage/stageRenderUtils.ts:9`                                                                                                                                     | Pixi color fallbacks duplicate hardcoded token hex values (central table).                                                                            | Skipped — central fallback table is the documented design pattern; needed for SSR/test contexts.            |

## DEAD / UNREACHABLE CODE

| Severity | Location                                                              | Finding                                                                                                                             | Recommended action                                                 |
| -------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| MED      | `src/data/events/transport.ts:98`, `src/data/events/transport.ts:146` | Story flags `VAN_DAMAGED` and `RENTAL_VAN` are written but never read. Consequences are inert.                                      | INTEGRATE flag checks into van/rental systems. (Skipped — needs product decision.) |
| MED      | `src/ui/shared/BrutalistUI.tsx:833`                                   | `BrutalTabs` renders placeholder "Loading module" panels but has no app consumer.                                                   | replace with real integrated tabs.                       |
| LOW      | `src/scenes/kabelsalat/kabelsalatConstants.ts:97`                     | `CONNECTOR_TYPES` is derived but not consumed by code.                                                                              | wire into validation/render logic.                       |

## MISSING INTEGRATION

| Severity | Location                                                                             | Finding                                                                                                                                                  | Recommended action                                                            |
| -------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| HIGH     | `src/data/events/transport.ts:98`, `src/data/events/transport.ts:146`                | Transport event outcomes set durable consequences, but `VAN_DAMAGED` and `RENTAL_VAN` are never used by travel, economy, van condition, or UI.           | INTEGRATE into van condition/rental logic. (Skipped — feature work.)          |
| HIGH     | `src/ui/shared/BrutalistUI.tsx:964`                                                  | `CrisisModal` looks like a completed feature surface, but crisis events currently flow through generic event handling instead.                           | INTEGRATE with crisis thresholds/events. (Skipped — feature work.)            |
| MED      | `src/utils/numberUtils.ts:22`                                                        | Tested number formatter is not wired into stats, shop, leaderboard, or HUD numeric display paths.                                                        | INTEGRATE into numeric display components if locale formatting is desired.    |
| MED      | `src/utils/audio/audioEngine.ts:54`, `src/utils/audio/audioEngine.ts:55`, `src/hooks/rhythmGame/useRhythmGameAudio.ts:14` | Audio hub re-exports `songUtils` and `timingUtils`. `rhythmGameAudioUtils` kept as direct submodule import because hub re-export broke test mocks. | **PARTIAL FIX**.                                                              |

## Checks With No Findings

- EN/DE locale key comparison found no missing keys between `public/locales/en` and `public/locales/de`.
- Literal `t('namespace:key')` lookups scanned from `src/` had no missing locale keys.
- `ActionTypes` were present in both reducer mapping and action creator coverage.
- No direct Tone.js timing reads outside the audio layer were found for gameplay timing.
