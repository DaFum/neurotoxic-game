# Neurotoxic — Deep Logic Audit

Date: 2026-10-21  
Repository: `DaFum/neurotoxic-game`  
Reviewed commit: `1f867be0ffc684afb3e583263e6084236163de87`  
Application code changes: none.

## Assessment

**11 findings: 5 high and 6 medium severity.** Seven were reproduced locally against production helpers/reducers. Four were verified by tracing the relevant caller, reducer, or API paths. The highest-impact issues involve lost event effects after loading, non-durable terminal outcomes, discarded event penalties, mutable committed chassis, and client-trusted leaderboard submissions.

This report contains every supported finding identified in this audit. It does not claim that every possible defect has been discovered.

## Scope and method

Reviewed the root reducer and relevant paths through event resolution, persistence, expedition commitment/travel, cash-floor enforcement, daily obligations, post-gig settlement, quest lifecycle/rewards, asset upgrades, maintenance, and leaderboard submission/storage. Large domains were sampled around these boundaries, not exhaustively line-reviewed. UI hooks were traced where dispatch order and acceptance affect correctness.

Followed the repository's systematic-debugging workflow: trace root causes, construct concrete reproductions, and separate observed behavior from recommendations. No live leaderboard writes or external service mutations were performed.

Severity definitions:

- **High:** lost core effects/progression, bypassed terminal outcomes or committed-build rules, or compromised public ranking integrity.
- **Medium:** materially incorrect eligibility, resource estimates, recovery behavior, or published state under specific conditions.

## Findings index

| ID  | Severity | Finding                                                      | Evidence                                 |
| --- | -------- | ------------------------------------------------------------ | ---------------------------------------- |
| F01 | High     | Loading an active event deletes composite effects            | Reproduced                               |
| F02 | High     | Terminal event outcomes can be escaped by loading            | Reproduced                               |
| F03 | High     | Protected cash cancels unrelated event consequences          | Reproduced                               |
| F04 | High     | Chassis upgrades bypass active-run commitment and tier gates | Reproduced                               |
| F05 | High     | Leaderboards trust client identity and results               | Code-path verified; existing risk        |
| F06 | Medium   | Restored events lose conditions and conflict tags            | Reproduced                               |
| F07 | Medium   | Travel eligibility and settlement use different fuel costs   | Reproduced                               |
| F08 | Medium   | Reloading loses current supply-stop access                   | Persistence reproduced; UI path verified |
| F09 | Medium   | Maintenance reports success after rejected purchases         | Code-path verified                       |
| F10 | Medium   | Current-stat boards retain the day's first snapshot          | Code-path verified                       |
| F11 | Medium   | Older leaderboard requests can overwrite newer state         | Code-path verified                       |

## Detailed findings

### F01 — Loading an active event deletes composite effects

**High severity; high confidence.**

**Locations:** `src/context/reducers/sanitizers/stateSanitizers.ts:157`, `:1569`, `:1590`; `src/utils/eventEngine/applyResult.ts`.

`sanitizeActiveEventOption()` copies `effect` through `copySafeEffectPayload()`, which preserves only primitive object properties. For `{ type: 'composite', effects: [...] }`, this keeps `type` but drops the nested effect array. Resolution treats the absent array as empty.

**Reproduction:** Save/reload an active `reststop_night_coffee` event with €100. Before serialization, the first option produces money `-45` and member stamina `+15`. After loading, it is `{ type: 'composite' }` and produces an empty delta.

**Impact:** Reloads silently remove rewards, costs, confiscations, and other compound consequences. Restoring an unresolved event can bypass its negative outcomes.

**Suggestion:** Persist canonical event/occurrence identity and required context, then reconstruct options from the registry. If serialized effects must remain supported, validate/copy the complete recursive effect union with depth, cycle, and forbidden-key protections.

**Regression tests:** Round-trip every registered direct composite choice through JSON and `handleLoadGame`, then compare deltas using identical state and deterministic RNG. Explicitly handle or reject nested composites according to the supported schema.

### F02 — Terminal event outcomes can be escaped by loading

**High severity; high confidence.**

**Locations:** `src/domain/eventResolver.ts:265–276`; `src/context/useEventSystem.ts` (`runSideEffects`); `src/context/reducers/systemReducer.ts:266`.

The terminal event branch clears the active event, requests a save, and only then changes the scene to `GAMEOVER`. The saved snapshot contains no terminal outcome. Independently, the load reducer initializes the scene to `OVERWORLD`, so simply swapping save/navigation order would not fully resolve this defect.

**Reproduction:** Resolve the failed all-or-nothing choice in `deal_devil` using deterministic RNG. Side effects are `gameOverToast → saveGame → changeScene`. JSON-round-tripping the saved state restores `OVERWORLD` with `activeEvent: null`.

**Impact:** The terminal gamble ends play only until reload; its consequence is absent from durable state.

**Suggestion:** Atomically record a persistent terminal result/reason with event resolution. Save the committed result and derive load routing from it. For active expeditions, integrate the appropriate run-failure settlement so retention and career consequences also occur.

**Regression tests:** Terminal event → save → fresh load → terminal screen, including repeated loads. Also test already-settled bankruptcy and career-victory saves as related routing cases; the reproduction here specifically verified the event path.

### F03 — Protected cash cancels unrelated event consequences

**High severity; high confidence.**

**Locations:** `src/domain/expedition/loadout.ts:996–1051`; `src/domain/eventResolver.ts`; `src/data/events/transport.ts` (`police_contraband`).

`enforceExpeditionCashFloor()` reverts the entire result of an action whose money debit crosses the protected boundary. An event's cash, time, controversy, and confiscation are bundled into `APPLY_EVENT_DELTA`. The resolver still dispatches cooldown/event-clear actions after that delta is rejected.

**Reproduction:** Start a legal expedition with €1,000 total and €900 protected. Fail the second police-contraband option, requesting `money: -450`, `time: -3`, `controversyLevel: +30`, and a context-dependent confiscation. Money stays €1,000, controversy stays unchanged, and the event closes. The probe did not contain actual contraband; confiscation loss was traced rather than asserted.

**Impact:** Protecting money also grants immunity to unrelated penalties. The displayed outcome can disagree with committed state.

**Suggestion:** Separate optional purchases from mandatory consequences. Refuse unaffordable purchases before resolving them. For unavoidable outcomes, preserve non-cash effects and explicitly settle the affordable amount and remaining obligation. Consume the event atomically with the accepted outcome.

**Regression tests:** Mixed-effect events just above/at/below the cash boundary, verifying payment, shortfall, confiscation, time, controversy, cooldown, and event closure together.

### F04 — Chassis upgrades bypass active-run commitment and tier gates

**High severity; high confidence. Reproduced through normal action creators.**

**Locations:** `src/context/assetActionCreators.ts:299`; `src/context/reducers/assetReducer.ts:428`; `src/domain/expedition/buildCommitment.ts:75`; `src/domain/expedition/effectiveRules.ts:154`; `src/components/assets/UpgradeConfirmModal.tsx`.

Module installation/removal checks `isExpeditionChassisCommitmentLocked()`, but tier upgrades do not. Effective expedition rules read the live asset tier. START's higher-tier capability check can therefore be bypassed by beginning with tier 1 and upgrading the committed chassis afterwards.

**Reproduction:** Buy a legitimate tier-1 tourbus with a sufficiently funded fresh career, start a valid expedition with it, and dispatch `upgradeChassisTier(assetId, 2, state)` through `gameReducer`. The commitment predicate returns true, yet the tier becomes 2. The effective fuel multiplier changes from `0.85` to `1.2`; the career owns no unlock sets.

**Impact:** Vehicle-dependent rules can change after build commitment, and higher-tier expedition access no longer follows the intended unlock gate.

**Suggestion:** Reject upgrades to the active run's committed chassis using the shared commitment predicate. Mirror this restriction in the creator and UI. If mid-tour upgrades are intended, implement an explicit expedition operation with capability checks and loadout/cargo reconciliation.

**Regression tests:** Active committed chassis, unrelated chassis, prepared state, and finalized run. On rejection, money, tier, slots, and effective rules must remain unchanged.

### F05 — Leaderboards trust client identity and results

**High severity for public ranking integrity; high confidence from endpoint inspection. Existing known risk.**

**Locations:** `lib/leaderboard.js` (`validateLeaderboardPlayer`); `api/leaderboard/song.js`; `api/leaderboard/stats.js:80–124`.

Endpoints validate names, ID formatting, and numeric ranges, then use the submitted `playerId` as the Redis member. They do not authenticate ID ownership or verify the gameplay behind submitted results. Song scores up to 10,000,000 and large clamped stats remain client assertions.

Opaque public references reduce ID disclosure; rate limits constrain request frequency. Neither proves ownership or authentic gameplay. The stats endpoint already documents the remaining authorization weakness.

**Scenario:** Submit a valid-format new ID with fabricated in-range results. No further proof is checked before writing. If another player's raw ID is independently obtained, the same mechanism permits rewriting their name/current stats or increasing their song best. No live submission was attempted in this audit.

**Suggestion:** Authenticate players and bind writes to their identities. Competitive integrity additionally needs server-issued run/session proofs or validated replay evidence, plausible-score constraints, and replay protection. Authentication alone does not validate client-generated scores. If honor-based ranking is intentional, label that limitation clearly.

**Regression tests:** Mismatched identities, invalid/replayed run proofs, and impossible score submissions; ensure public responses never expose write credentials. Use mocked/local Redis.

### F06 — Restored events lose conditions and conflict tags

**Medium severity; high confidence.**

**Locations:** `src/context/reducers/sanitizers/stateSanitizers.ts:1569–1677`; `src/utils/eventEngine/resolveChoice.ts`.

JSON removes option `condition` functions, and loading does not restore them from the registry. The active-event sanitizer also omits `tags`. Resolution reads those conditions and uses conflict tags for conflict progression and Bandleader rescue behavior.

**Reproduction:** At €10, the paid `reststop_night_coffee` option is `rejected` before saving and `direct` after loading. Event tags disappear. F01 also removes that option's composite effects, but the eligibility discrepancy is independently observable.

**Impact:** Restored eligibility differs from live play. Skill-check payloads retain their nested data while losing conditions, so inventory/affordability gates are especially important to reconstruct. Restored conflict events lose tag-dependent behavior.

**Suggestion:** Rehydrate registry-owned conditions/tags using canonical event and option identity. Persist occurrence context, not executable definitions. Re-evaluate eligibility at final resolution and define recovery for unknown/removed IDs.

**Regression tests:** Unaffordable choice, full-stash choice, and conflict event with/without Bandleader; verify save/load eligibility and deterministic outcome parity.

### F07 — Travel eligibility and settlement use different fuel costs

**Medium severity; high confidence. Arithmetic reproduced with explicit chassis rules; production callers traced.**

**Locations:** `src/hooks/travel/actions/useHandleTravel.ts:237–252`; `src/utils/travelUtils.ts`; `src/domain/expedition/travel.ts:158`; `src/context/reducers/minigameReducer.ts` (`handleCompleteTravelMinigame`).

Travel confirmation/resource checks use legacy `calculateTravelExpenses()` fuel. Completion additionally applies the effective expedition fuel multiplier. The preview does not receive expedition state and cannot apply the same profile.

**Reproduction:** Base cost 10 L, available fuel 9 L, compact multiplier `0.85`, zero pickups: settlement requires 8.5 L, but the gate rejects travel for requiring 10 L. A coach multiplier of `1.2` can conversely make actual consumption exceed an approved trip's fuel; completion clamps the remaining tank at zero.

**Impact:** Feasible journeys can be blocked and more expensive journeys approved. Resource prompts and softlock predictions can disagree with actual expedition rules.

**Suggestion:** Share one expedition-aware quote across display, eligibility, softlock analysis, and settlement. Keep deterministic trip cost separate from minigame pickups, which should be settled exactly once.

**Regression tests:** Every chassis archetype and non-neutral region/module, with fuel just below/equal/above quoted cost. Compare zero-pickup preview/settlement, then add pickup adjustment cases.

### F08 — Reloading loses current supply-stop access

**Medium severity; high confidence. Persistence reproduced; UI branch traced.**

**Locations:** `src/context/usePersistence.ts:66–103`; `src/hooks/useArrivalLogic.ts:262`; `src/hooks/overworld/useSupplyStopModal.ts`; `src/hooks/travel/actions/useHandleTravel.ts:111–155`.

Arrival opens the shop through `pendingSupplyStopInventory`. That field is absent from the persistence whitelist; a fresh load has `null`. Clicking the current supply node only shows a current-location toast, rather than reopening the shop.

**Reproduction:** Serialize state with pending supply inventory and load into a fresh state. The saved object lacks the field and the loaded field is `null`. The current-node branch for `SUPPLY_STOP` has no shop recovery path.

**Impact:** Reloading the arrival save before shopping can forfeit the stop's shop access and a needed recovery opportunity.

**Suggestion:** Persist shop occurrence/inventory/purchase state or reconstruct it deterministically from run/node identity. Permit same-node reopening without replaying day ticks, arrival rewards, or drafts. Explicitly reset transient shop state when loading over an existing session.

**Regression tests:** Arrival → autosave → reload → reopen; purchase → save → reload must not restore stock or reroll offers. Reopening must not advance the day.

### F09 — Maintenance reports success after rejected purchases

**Medium severity; high confidence from the dispatch path. Browser interaction not executed.**

**Locations:** `src/hooks/travel/useVanMaintenance.ts:64–90`, `:110–145`; `src/domain/expedition/loadout.ts:996`.

Refuel/repair checks compare their cost against total money, dispatch an absolute money/van update, then immediately display success. They do not account for protected cash or observe accepted state. The root cash-floor guard can reject the entire update.

**Scenario:** Cost exceeds expedition-spendable cash but not total cash. The hook passes its check and says refueled/repaired; the reducer retains original cash and fuel/condition.

**Impact:** Recovery appears successful while the van remains unchanged, without explaining that funds are protected.

**Suggestion:** Use `canSpendExpeditionCash()` for UI eligibility and an authoritative maintenance action deriving price from committed state. Emit success only for an accepted operation.

**Regression tests:** Hook with real reducer/provider, protected/unprotected balances, matching toast and resulting van state, and repeated clicks before commit.

### F10 — Current-stat boards retain the day's first snapshot

**Medium severity; high confidence from hook/API contract tracing.**

**Locations:** `src/hooks/useLeaderboardSync.ts:189–226`; `api/leaderboard/stats.js:33–37`.

The API explicitly stores current stats, including decreasing money. The hook stores last-synced day and suppresses all subsequent changes that day. Fame gains, purchases, social posts, and settlements after the first successful sync do not reach the board until the next day. Changes during an in-flight same-day request are also discarded rather than queued.

**Scenario:** Sync day 5 at €500, spend €200 or gain fame without changing day. The effect reruns but exits at `day <= lastSyncedDay`.

**Impact:** Current rankings remain stale. Final-day achievements may never be published if the run ends without another day tick.

**Suggestion:** Debounce/coalesce changes while retaining the latest dirty snapshot. Flush durable milestones/terminal settlement using revision/content markers rather than day alone, respecting API rate limits. Alternatively, deliberately define and label these as daily-snapshot boards.

**Regression tests:** Same-day increases/decreases, state changes during a pending request, and final settlement on an already-synced day. Assert final payload content, not only request counts.

### F11 — Older leaderboard requests can overwrite newer state

**Medium severity; high confidence from concurrency and server-write semantics.**

**Locations:** `src/hooks/useLeaderboardSync.ts:199–226`; `api/leaderboard/stats.js:68–124`.

In-flight keys use `playerId:day`, allowing consecutive days to overlap. The client keeps its local marker monotonic, but the server ignores submitted day and unconditionally overwrites current stats.

**Scenario:** Delay a day-5 write, advance to day 6, and let day 6 commit first. The late day-5 write replaces the newer stats. The client marker still says day 6 and prevents a corrective same-day sync.

**Impact:** Published progress can regress and remain incorrect despite the client believing the latest state was synced. Redis `GT` is not a valid fix because newer balances can legitimately decrease.

**Suggestion:** Use authenticated run/session identity plus monotonic snapshot revision; atomically reject older revisions with the Redis update. Client serialization/coalescing helps but does not replace server ordering across tabs/devices. Day alone is insufficient across run resets.

**Regression tests:** Reverse request completion order; retain the newer revision even when its money value is lower. Cover same-day revisions and new-run/reset behavior.

## Recommended implementation order

1. Restore save semantics: **F01, F06, F02, F08**. Prefer canonical reconstruction and durable terminal records.
2. Make transaction acceptance authoritative: **F03, F09**. Separate mandatory consequences from optional purchases.
3. Unify expedition rules: **F04, F07**. Freeze committed chassis and share resource quotes.
4. Define/enforce leaderboard semantics: **F05, F10, F11**. Decide honor-based versus verified ranking, then implement ownership and revisioned snapshots accordingly.

## Validation

- `pnpm --config.verifyDepsBeforeRun=false run typecheck:core`: **passed**.
- Fast suite's Vitest logic/API/security stage: **48 files, 843 tests passed**.
- Targeted leaderboard UI tests: **2 files, 17 tests passed** (`useLeaderboardSync`, `PostGig.leaderboard`). API paths also supplied to this UI-config invocation were excluded by its configuration; API coverage came from the logic stage above.
- Audit probes: **seven findings reproduced**, F01/F02/F03/F04/F06/F07/F08. Assertions verify the defective behavior, not a fix.
- Full fast Node stage: **interrupted before completion (exit 130)** after partial execution. Its partial output does not establish an overall pass; no full-fast-suite pass is claimed. The completed Vitest stage is reported separately above.

The first plain pnpm invocation was blocked by automatic dependency refresh requiring a TTY. The subsequent invocation disabled that refresh and used installed dependencies; no dependency versions were changed.

Probes use the repository's test loader, including Vite-import adaptations. These are not full browser end-to-end tests. No complete browser playthrough, full UI suite, live Redis test, production deployment, or audio-device/performance certification was performed. Existing passing checks do not cover every cross-boundary condition reproduced here.

## Reproduction evidence

Audit-session scratch script: `work/audit-probes.mjs` (not committed with this report). The command below records how the local probes were executed; it requires that session artifact.

```sh
node --import tsx --import ./tests/setup.mjs work/audit-probes.mjs
```

The actual persistence round-trip uses:

```js
handleLoadGame(
  createInitialState({ rngSeed: 123, runSeed: 4242, savedSettings: {} }),
  JSON.parse(JSON.stringify(createPersistedState(state)))
)
```

Observed results:

```text
F01: before = money -45, stamina +15
     after = empty delta; loaded effect = { type: 'composite' }
F02: terminal side effects = gameOverToast, saveGame, changeScene
     saved scene = OVERWORLD; loaded scene = OVERWORLD; event = null
F03: requested money -450, time -3, controversy +30
     actual money 1000 -> 1000; controversy unchanged; event closed
F04: committed tier 1 -> 2; unlocked sets = []
     effective fuel multiplier 0.85 -> 1.2
F06: paid choice with 10 euros: rejected before save, direct after load
     event tags disappear
F07: base 10 L, available 9 L, settlement 8.5 L; UI gate rejects
F08: shop inventory absent from save; fresh load value = null
```

## Source snapshot

Locations refer to the [reviewed immutable commit](https://github.com/DaFum/neurotoxic-game/tree/1f867be0ffc684afb3e583263e6084236163de87). Line numbers may shift after fixes.
