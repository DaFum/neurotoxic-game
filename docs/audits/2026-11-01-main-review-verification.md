# Main Review Verification Record

Date: 2026-11-01
Source: issue #3499 ("Main review: all identified issues", 26 findings and 2 additional paths)
Reviewed revision: `be37bc70bf1699017674f26f30a67818972bf6c5`
Verified revision: `83a017971fc588a3327728eb9c27dacc4ac3ae00` (merge of #3497; `be37bc7` is an ancestor, 23 commits apart)

---

## 1. Scope and Method

Every finding was re-read against the source at the verified revision, tracing the code path and quoting the deciding lines. Line numbers below are at `83a0179`; they differ from the review's links (`be37bc7`). No reproduction was re-run: the review's reproductions are traced in source, not executed. No source file was changed in this phase.

Status values: **Confirmed**, **Partially confirmed**, **Superseded in part**, **Conditional**, **Unconfirmed**.

Between the two revisions none of the files cited for findings 1 to 13 changed except `src/components/assets/LiabilitiesPanel.tsx` (refinance fee gating, unrelated to finding 12).

## 2. Status Map

### 2.1 Gameplay and State (1 to 10)

| #   | Status                                     | Basis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Current source (83a0179)                                                                                                                                                                                                                                          |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Confirmed                                  | The donation check is a one-shot `if/else if` (marrow only, or blood only, each payout used once). No per-day donation limit exists, so donations can repeat while harmony and stamina allow it. Marrow (500) then blood (100) is EUR 600 at fame 0 (needs harmony above 55 and every member at stamina 100). The reproduction traces.                                                                                                                                                     | `src/utils/mapUtils.ts:385-409`; `src/utils/bloodBankUtils.ts:12-25` (validate), `37-41` (payout); `src/hooks/useBloodBank.ts:40-56` (no limit); `src/context/reducers/clinicReducer.ts:294-300`; `src/context/gameConstants.ts:108-117`                          |
| 2   | Confirmed (reachable)                      | `getSellableAssets` keeps only `!blocked && net > 0`. The sell reducer rejects only `blocked` (`gross === null \|\| net < 0`), so a sale at `net === 0` is accepted and removes the asset and its liabilities, lowering daily obligations. The creator fails only when `grossSale < totalPrincipalRemaining`.                                                                                                                                                                              | `src/utils/travelSoftlockUtils.ts:32`; `src/context/reducers/assets/assetReducer.ts:553-569`; `src/utils/assets/assetSelectors/assetSaleQuote.ts:50-53`; `src/context/assets/assetActionCreators.ts:412-417`                                                      |
| 3   | Confirmed                                  | Rest in van exists (`handleRestInVan` calls `advanceDay()`) and `getTotalDailyObligations` goes negative when revenue exceeds costs, but `checkSoftlock` has no wait or rest scenario and clamps negative obligations away. The detector input also differs from the real tick (early-game obligation multiplier, YouTube revenue, newsletter perk).                                                                                                                                       | `src/utils/mapUtils.ts:170-176, 282, 364-383`; `src/hooks/travel/effects/useSoftlockEffect.ts:103-128`; `src/utils/dailyTickLogic.ts:49-73`; `src/hooks/travel/useVanMaintenance.ts:173-220`; `src/utils/assets/assetSelectors/stateAggregation.ts:73-97`         |
| 4   | Superseded in part                         | **Fixed on main:** when a packed item is confiscated the manifest is debited in the same commit (`debitPackedContraband`, then `expedition.cargo` is rewritten). **Remains:** (a) eligibility and choice of item use the whole stash (`computeStashBustRisk(state.band?.stash)`), not the manifest; (b) `delete nextBand.stash[itemId]` runs whether or not the item is packed, so an HQ-only item, or the HQ share beyond the packed count, is confiscated. The fine itself is by design. | `src/data/events/transport.ts:240-245`; `src/utils/eventEngine/eventEffectHandlers.ts:248-259`; `src/utils/gameState/delta.ts:961-1016` (debit `997-1008`, delete `1009`)                                                                                         |
| 5   | Confirmed (source trace; probe not re-run) | The ticker is added only after `await this.setup()`, which awaits `Promise.all` of loads wrapped in `withTimeout` (10 s default). `initializeGigState` calls `audioEngine.playSongSequence` with no stage-ready gate; no ready signal exists in rhythmGame or stage. The loop reads `audioEngine.getGigTimeMs()`, so a late first tick sees elapsed song time.                                                                                                                             | `src/components/stage/BaseStageController.ts:142-147`; `src/components/PixiStageController.ts:79-83`; `src/components/stage/stageRenderUtils.ts:115-125`; `src/hooks/rhythmGame/useRhythmGameAudio.ts:390-398`; `src/hooks/rhythmGame/useRhythmGameLoop.ts:88-89` |
| 6   | Confirmed                                  | The Expedition node literal has no `shopInventory` and `map.ts` never sets it (only the Career generator does). On arrival and re-entry a missing inventory becomes `[]`.                                                                                                                                                                                                                                                                                                                  | `src/domain/expedition/map.ts:404-415`; `src/utils/arrivalUtils.ts:237-249`; `src/hooks/travel/actions/useHandleTravel.ts:151-157`; contrast `src/utils/mapGenerator.ts:279-282`                                                                                  |
| 7   | Confirmed                                  | The Tourbus drop calls `addContrabandHelper`, which changes only the stash. During an active run, use rejects items that are not packed (`isActiveRun && packedIndex === -1`). Crafting, by contrast, credits the manifest.                                                                                                                                                                                                                                                                | `src/context/reducers/minigameReducer.ts:390-403`; `src/context/reducers/bandReducer.ts:455-461, 767-775` (crafting credit `600-615`)                                                                                                                             |
| 8   | Confirmed                                  | `completeQuest` emits only money and fame quest events; the harmony reward is applied in `applyQuestRewards` with no event. Band Pact advances on `band.harmonyChanged` (`thresholdField: band.harmony`); Best Before rewards harmony +10.                                                                                                                                                                                                                                                 | `src/domain/questComplete.ts:143-158`; `src/domain/questRewards.ts:260-271`; `src/data/quests/quest_band_pact.ts:10-15`; `src/data/quests/quest_best_before.ts:21`                                                                                                |
| 9   | Confirmed                                  | `stateRef.current = state` is set during render. `advanceDay()` dispatches and `processTravelEvents(currentNode, triggerEvent)` runs in the same tick; `triggerEvent` reads the previous day, checks `>= 2` and writes `eventsTriggeredToday + 1` after the reducer reset it to 0. Both effects in the review follow.                                                                                                                                                                      | `src/context/GameState.tsx:209-210`; `src/hooks/useArrivalLogic.ts:283, 330`; `src/context/useEventSystem.ts:209, 221-225, 257-260`; `src/context/useGameDispatchActions.ts:732-736`; `src/context/reducers/systemReducer.ts:933`                                 |
| 10  | Confirmed                                  | `previewLoadGame().status === 'terminal' ? 'ending' : 'available'`, so `missing` and `unavailable` count as available; `handleRetry` then sends the player to MENU when the load fails.                                                                                                                                                                                                                                                                                                    | `src/scenes/GameOver.tsx:41-62`; `src/context/usePersistence.ts:983-999`                                                                                                                                                                                          |

Notes: the softlock effect returns early while an Expedition is active (`useSoftlockEffect.ts:80-84`), so findings 1 to 3 apply to Career only. Findings 1 and 3 interact: rest (+50 stamina, `useVanMaintenance.ts:200-208`) can make a donation possible again, so enumerating donation sequences alone still misses rest followed by a donation. Finding 3's "passive income" is accurate only when net obligations are negative; the early-game multiplier mismatch is a second inaccuracy.

### 2.2 UI and Accessibility (11 to 19)

| #   | Status                                            | Basis                                                                                                                                                                                                                                                                                                                             | Current source (83a0179)                                                                                                                                                                                                     |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Confirmed                                         | The footer shows only the price; the profile grid shows only `termDays` and `interestRate`. No daily payment, upkeep or total repayment before purchase.                                                                                                                                                                          | `src/components/assets/ChassisAcquisitionModal.tsx:127-145, 256-258`; `src/components/assets/LoanProfileModal.tsx:58-67`                                                                                                     |
| 12  | Confirmed                                         | The grid renders every profile with no `isLoanProfileEligible` check (no `.tsx` uses it). `coop` needs `minScenePresenceRequired: 50`. Purchase `onConfirm` calls `purchaseChassis` then `onClose()` unconditionally; refinance closes right after `onSelect`. Creators fail with `LOAN_PROFILE_INELIGIBLE`.                      | `src/components/assets/LoanProfileModal.tsx:33-67, 91-95`; `src/components/assets/ChassisAcquisitionModal.tsx:68-81`; `src/utils/assets/loanProfiles.ts:51-57, 87-103`; `src/context/assets/assetActionCreators.ts:202, 494` |
| 13  | Confirmed (source; physical touch not tested)     | Below 360 px, labels of reachable nodes get `max-[359px]:hidden` unless hovered or pending. On touch, pointerdown shows the label but pointerup hides it (`pointerType !== 'mouse'`), and the click calls `handleTravel`, which sets the pending node and a 5 s timeout. A code comment accepts "names appear only on tap/focus". | `src/components/MapNodeView.tsx:458, 476-487, 524-541, 586-591`; `src/hooks/travel/actions/useHandleTravel.ts:297-319`                                                                                                       |
| 14  | Confirmed (bounded)                               | The second click calls `startTravelSequence`, which calls `clearPendingTravel`; that clears the timeout and pending ref but never `removeToast`. The global `ToastOverlay` removes each toast on its own 3000 ms timer, so the "click again" toast stays up to about 3 s into TRAVEL_MINIGAME.                                    | `src/hooks/travel/actions/useHandleTravel.ts:297-299, 305-318`; `useStartTravelSequence.ts:42`; `useClearPendingTravel.ts:18-25`; `src/ui/ToastOverlay.tsx:71-76`; `src/App.tsx:158`                                         |
| 15  | Confirmed                                         | The buttons are `text-transparent [@media(pointer:coarse)]:text-star-white/30`. The only steering hint is `GamepadHint`, which returns null unless the input source is `gamepad`. Keyboard and mouse users see no instruction.                                                                                                    | `src/components/minigames/tourbus/TourbusControls.tsx:21, 31`; `TourbusHUD.tsx:17-19`; `src/ui/gamepad/InputHint.tsx:61-62`                                                                                                  |
| 16  | Confirmed (source; pixel measurements not re-run) | There are 11 tabs. Below `sm` the strip keeps `overflow-x-auto touch-pan-x scrollbar-hidden` with no overflow cue (the comment at 56-61 says the mobile swipe was kept on purpose). Tabs use `py-2 text-xs`, about 32 px high.                                                                                                    | `src/ui/bandhq/BandHQTabsList.tsx:25-41, 56-62`; `src/ui/bandhq/HQTabButton.tsx:43`                                                                                                                                          |
| 17  | Confirmed (source; 2,089 px not re-measured)      | In the single-column layout below `lg`, `GigModifiersBlock` renders before `SetlistBlock`, and Start comes after the Expedition panels. The disabled reason appears only inside `<Tooltip>`.                                                                                                                                      | `src/scenes/PreGig.tsx:117-143, 183-189`; `src/components/pregig/PreGigStartButton.tsx:29-37, 63-64`                                                                                                                         |
| 18  | Partially confirmed                               | Token arithmetic reproduces the review's ratios on an assumed `#0a0a0a` background: HQ Leave `text-blood-red` #cc0000 about 3.36; FAME `text-ash-gray/70` about 3.26; NRG `text-ash-gray/50` about 2.20. Computed styles were NOT measured, so the historical axe ratios are not re-measured (see 3.3).                           | `src/ui/BandHQ.tsx:81-88`; `src/ui/overworld/OverworldHUD.tsx:107-111`; `src/components/pregig/SetlistBlock.tsx:88-90`; `src/index.css:129, 139, 149`                                                                        |
| 19a | Superseded in part (HUD overlap)                  | The obstacle selector includes `[data-chatter-avoid]`, set on StatsOverlay, GigHUD, PreGigHeader, MapNodeView and OverworldMap, plus `data-chatter-avoid-compact` on minigames. HUD readouts are therefore avoided on main.                                                                                                       | `src/components/ChatterOverlay.tsx:337-344, 490-494`; `src/components/chatterPlacement.ts:23-30`; `StatsOverlay.tsx:32`; `GigHUD.tsx:76`; `PreGigHeader.tsx:27`; `OverworldMap.tsx:310`; `MinigameSceneFrame.tsx:48`         |
| 19b | Confirmed (chatter overlap, investments summary)  | The `AssetsStatusStrip` `<header>` has no avoid attribute and contains no button or tab, so it is never an obstacle. Phone suppression applies only when the chatter is blocked by an obstacle.                                                                                                                                   | `src/components/assets/AssetsStatusStrip.tsx:72-107`; `src/components/ChatterOverlay.tsx:337-344`                                                                                                                            |

### 2.3 Deployment, Security, Performance and CI (20 to 26)

| #   | Status                                            | Basis                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Current source (83a0179)                                                                                                                                                                            |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20  | Confirmed                                         | The build job runs `pnpm run build` and uploads `./dist` only; there is no `vercel.json` and Pages hosts no `api/` handlers. Client calls use absolute `/api/leaderboard/...` paths while `base: './'`, so on Pages they hit the host root and answer 404. The behaviour of a separate API-capable deployment is not established. Note: the Pages workflow is currently disabled in the repository settings (owner decision: it stays off).                                                       | `.github/workflows/deploy.yml:19-39`; `src/ui/bandhq/leaderboard/LeaderboardTab.tsx:68, 76`; `src/utils/leaderboardUtils.ts:100`; `src/utils/leaderboardSyncController.ts:300`; `vite.config.js:80` |
| 21  | Conditional                                       | `define` inlines `import.meta.env.VITE_FLUX_KEY` from `loadEnv(mode, process.cwd(), '').Flux ?? ''` (the empty prefix loads every env var, not only `VITE_*`). `getGenImageUrl` appends `&key=...` to `https://gen.pollinations.ai/image/...` URLs used as img src, CSS and Pixi URLs, so the key is readable in the bundle, DOM and network requests. This is a risk only if `Flux` is a secret or billable; deployed values were not inspected.                                                 | `vite.config.js:115-124`; `src/utils/imageGen.ts:12, 18-24, 56-60`                                                                                                                                  |
| 22  | Confirmed                                         | `signature = login:cleanBody.substring(0,80)`. A duplicate signature does `return null` before `newThreadIds.add(t.id)` and before the `newThreads` push, so a later thread with the same prefix is missing from the summary and stored IDs and never reaches `core.setFailed`.                                                                                                                                                                                                                   | `.github/workflows/pr-comment-tracker.yml:132-163, 210-213`                                                                                                                                         |
| 23  | Confirmed                                         | The job has no fork guard. Reported state is read back from the bot comment and a failed create/update is only `core.warning`; a fork PR's read-only token can never persist the IDs, so every run re-reports all open threads as new and fails again.                                                                                                                                                                                                                                            | `.github/workflows/pr-comment-tracker.yml:3-22, 39-51, 187-207, 210-213`                                                                                                                            |
| 24  | Confirmed                                         | Both reports use `comments.find(c => c.body && c.body.includes(marker))` with no author check, and `updateComment` is not wrapped in try/catch, so a planted marker comment makes the job fail. Siblings with the same pattern: `.github/actions/post-test-failure-comment/action.yml:87` (first match, no author check) and `pr-comment-tracker.yml:40-42` (any `user.type === "Bot"`). Fork detection to reuse: `github.event.pull_request.head.repo.full_name == github.repository`.           | `.github/workflows/dead-code-report.yml:78, 91-112`; `.github/workflows/lint-fix-preview.yml:85, 106-116`; `.github/actions/post-test-failure-comment/action.yml:87`                                |
| 25  | Unconfirmed                                       | What the code does: `loadTexture` has no in-flight dedup and each fallback `onload` runs `_imageTextureCache.set(url, texture)`, overwriting a concurrent result. `createEdgeKeyedTexture` calls `Texture.from(canvas)`, which pixi.js 8.22.0 stores in the global `Cache` (`textureFrom.mjs:37-38`) until the texture is destroyed; Tourbus teardown destroys sprites and containers, not textures. The trace fits the claim, but the evidence is mocked ordering only: no browser heap profile. | `src/components/stage/stageRenderUtils.ts:349-354, 369-390, 392, 406-446`; `src/components/stage/TourbusStageController.ts:202, 362-377`                                                            |
| 26  | Confirmed applicable, pending maintainer approval | `"i18next-http-backend": "4.0.2"` is under `dependencies` (a production dependency); the lockfile resolves 4.0.2. It is used as `.use(httpBackend)` with `supportedLngs ['en','de']`, `load: 'languageOnly'`, a static `ns` list and `loadPath` from `BASE_URL`. Exploitability was not demonstrated. See section 4.                                                                                                                                                                              | `package.json:74`; `pnpm-lock.yaml:26, 3417, 8630`; `src/i18n.ts:4-7, 12-14, 29-32`                                                                                                                 |

### 2.4 Additional Paths

| Path                     | Status                                    | Basis                                                                                                                                                                                                                                                                                                                                               | Current source (83a0179)                                                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Failed purchase fallback | Conditional (snapshot divergence)         | A refused write puts the debited snapshot, with its purchase marker, into the session-only fallback store; the rollback that follows is never saved. A same-session load prefers the fallback and completes the purchase on load. Normal UI reachability stays open: known Load routes save first, and any successful save overwrites the fallback. | `src/context/useGameDispatchActions.ts:888-915`; `src/context/usePersistence.ts:754-760, 832-839`; `src/utils/storage.ts:149-157, 175-180`; `src/context/reducers/careerReducer.ts:323, 385-399`; `src/context/reducers/systemReducer.ts:249`; `src/context/reducers/meta.ts:365-377` |
| Pages image generation   | Unconfirmed (untested provider behaviour) | The Pages build step has no `env:` and the workflow configures no `Flux`, so `VITE_FLUX_KEY` is `''` and image URLs go out without `&key=`. Whether the provider accepts keyless requests, and how a live deployment behaves, were not tested.                                                                                                      | `.github/workflows/deploy.yml:34-35`; `vite.config.js:121-123`; `src/utils/imageGen.ts:58-60`                                                                                                                                                                                         |

Reproduction steps for the failed purchase fallback (snapshot divergence):

1. Use a Career with enough Tour Tokens in a browser where the save write is refused (quota exceeded or private mode); `LocalStorageAdapter.set` then returns false.
2. Buy an Expedition unlock set. `purchaseExpeditionUnlockSet` dispatches the begin action (`useGameDispatchActions.ts:888`), which debits the tokens and sets `pendingUnlockPurchase` (`careerReducer.ts:323`).
3. `saveGameAfterStateCommit` (`useGameDispatchActions.ts:909`) triggers the save effect (`usePersistence.ts:832-839`). `saveGame` calls `writeStorageItem`, which stores the debited snapshot with the marker in the fallback store and returns false (`storage.ts:149-157`); the listener receives `saved=false` (`usePersistence.ts:754-760`).
4. The failure branch dispatches the rollback (`useGameDispatchActions.ts:910-915`): live state is refunded, the marker is cleared (`careerReducer.ts:385-399`) and the "purchase failed" toast shows. No save is requested, so the fallback still holds the snapshot from step 3.
5. In the same session, run `loadGame` before any other save. `readStorageItem` prefers the fallback (`storage.ts:175-180`; `usePersistence.ts:471`) and `settleExpeditionUnlockJournalOnLoad` (`systemReducer.ts:249`; `meta.ts:365-377`) grants the set. The player owns, and has paid for, a set they were told had failed.

Common cause of findings 20, 21 and the Pages image path: the Pages deploy is static-only, while the leaderboard API and the image key assume a Vercel-style host.

## 3. Baseline at the Verified Revision

All commands ran in a detached worktree at `83a017971fc588a3327728eb9c27dacc4ac3ae00` (`git rev-parse HEAD` checked) with no source changes. Every run completed; none was interrupted.

### 3.1 Node Tests

```
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/mapUtils.test.js tests/node/travelSoftlockSellableAssets.test.js \
  tests/node/gameStateUtils.test.js tests/node/eventContrabandStash.test.js \
  tests/node/supplyStop.test.js tests/node/travelDrop.test.js \
  tests/node/workflowScripts.test.js tests/node/bloodBankUtils.test.js \
  tests/node/clinicReducer.test.js tests/node/domain/questRewardEvents.test.js \
  tests/node/clinicLogic.test.js tests/node/socialClinicQuestIntegration.test.js \
  tests/node/actionCreators.test.js tests/node/overworldServiceValidators.test.js \
  tests/node/actionCreatorSerialization.test.js
```

Result (exit 0): `# tests 329`, `# suites 64`, `# pass 329`, `# fail 0`, `# cancelled 0`, `# skipped 0`, `# todo 0`, `# duration_ms 47380`. The last five files are the remaining Node files that reference the blood bank (`grep -rl -i -E "BLOOD_BANK|bloodBank" tests/node tests/context tests/logic`); `tests/context` and `tests/logic` have no matches.

### 3.2 Focused Hook Suites

```
pnpm exec vitest run tests/hooks/useBloodBank.test.jsx \
  tests/hooks/travel/useHandleTravel.test.jsx tests/ui/useArrivalLogic.realReducer.test.jsx \
  tests/hooks/useEventSystem.test.jsx tests/hooks/travel/useSoftlockEffect.toast.test.jsx \
  tests/ui/useArrivalLogic.test.jsx tests/ui/useRhythmGameAudio.test.jsx \
  tests/ui/useRhythmGameLogic.rival.test.jsx
```

Result (exit 0): `Test Files 8 passed (8)`, `Tests 102 passed (102)`, duration 4.29 s.

### 3.3 Not Measured: Contrast Ratios

The historical axe ratios of finding 18 (HQ Leave 3.36:1, overworld FAME 3.24:1, pre-gig NRG 2.19:1) were not re-measured. Computed-style checks needed, at 320 px and desktop:

- HQ Leave (`BandHQ.tsx:81-88`): `color`; inherited `font-size` (no size class); `font-weight` 700; background of the header (`bg-void-black`, `BandHQ.tsx:68`); any ancestor `opacity` from the modal entry animation; also the hover state, which inverts to `bg-blood-red` / `text-void-black`.
- Overworld FAME label (`OverworldHUD.tsx:109-111`): `color` rgba(136,136,136,0.7); `font-size` 10 px (`text-xxs`); weight 400; background of the accessory (`bg-void-black`, line 107); also the LVL and KM labels (lines 115-121).
- Pre-gig NRG label (`SetlistBlock.tsx:88-90`): `color` rgba(136,136,136,0.5); 10 px; weight 400; effective background per row state (unselected panel background, selected `bg-toxic-green/10`, locked `bg-blood-red/10`); ancestor `opacity` from motion transitions.

### 3.3.1 Not Run

The full Node suite, the full Vitest UI/Logic suites and Playwright were not run in this phase (CI runs them). The focused runs above are not a full-suite pass.

## 4. Dependency Advisory (Finding 26): Maintainer Approval Requested

`pnpm audit --prod --json` at `83a0179` (exit 1: two advisories, no network failure):

```json
{
  "advisories": {
    "1243619": {
      "findings": [
        {
          "version": "4.0.2",
          "paths": [".>i18next-http-backend"],
          "dev": false,
          "optional": false,
          "bundled": false
        }
      ],
      "id": 1243619,
      "title": "i18next-http-backend: Query-parameter injection through & and = in lng when loadPath/addPath puts {{lng}} in the query string",
      "module_name": "i18next-http-backend",
      "vulnerable_versions": "<4.0.4",
      "patched_versions": ">=4.0.4",
      "severity": "low",
      "cwe": "CWE-74",
      "github_advisory_id": "GHSA-3cmx-xjww-583x",
      "url": "https://github.com/advisories/GHSA-3cmx-xjww-583x"
    },
    "1243668": {
      "findings": [
        {
          "version": "4.0.2",
          "paths": [".>i18next-http-backend"],
          "dev": false,
          "optional": false,
          "bundled": false
        }
      ],
      "id": 1243668,
      "title": "i18next-http-backend: Namespace value starting with / forms a protocol-relative URL when loadPath/addPath places {{ns}} right after a / (bypass of the // check added for GHSA-xvq9-wjp8-hwqf)",
      "module_name": "i18next-http-backend",
      "vulnerable_versions": "<4.0.3",
      "patched_versions": ">=4.0.3",
      "severity": "low",
      "cwe": "CWE-74",
      "github_advisory_id": "GHSA-9jhj-wvmw-cfx5",
      "url": "https://github.com/advisories/GHSA-9jhj-wvmw-cfx5"
    }
  },
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 2,
      "moderate": 0,
      "high": 0,
      "critical": 0
    },
    "dependencies": 44,
    "devDependencies": 0,
    "optionalDependencies": 3,
    "totalDependencies": 47
  }
}
```

Summary: package `i18next-http-backend`, installed `4.0.2` (path `.>i18next-http-backend`, production), two low advisories.

| Advisory                                                                        | Vulnerable range | Patched range |
| ------------------------------------------------------------------------------- | ---------------- | ------------- |
| GHSA-3cmx-xjww-583x (query-parameter injection through `&`/`=` in `lng`)        | `<4.0.4`         | `>=4.0.4`     |
| GHSA-9jhj-wvmw-cfx5 (namespace starting with `/` forms a protocol-relative URL) | `<4.0.3`         | `>=4.0.3`     |

Version `4.0.4` fixes both. The application uses a static locale list and a relative `loadPath` (`src/i18n.ts`); exploitability was not demonstrated.

**Request:** dependencies are pinned and must not change without discussion. Please approve bumping `i18next-http-backend` to exactly `4.0.4` (or later) in `package.json`, with `pnpm-lock.yaml` refreshed by pnpm under the repository's `minimumReleaseAge`, followed by the i18n tests and `pnpm audit --prod`. No dependency has been changed.

## 5. Remediation Tracking

Fixes for the findings above are tracked in issue #3499 and the pull request that follows this record. This section is updated with the final dispositions (fixed, not reachable, or follow-up issue) once those changes land.
