# Event Engine — Agent Instructions

## Selection

- `selectEvent` is the sole RNG boundary for shuffle and chance rolls. A functional `chance` may derive probability from the optimized state but must not consume randomness itself.
- Template venue context reads canonical `player.location`; `currentLocation` is not part of persisted player state.

## Paid options during a run

- Option `condition`s are evaluated against `withExpeditionSpendableCash(state)` (in `resolveChoice` and `EventModal`), so a money gate such as `money >= 45` cannot be met with protected cash.
- `isOptionAffordable` derives a direct money cost from the option's effects (`getOptionPreviewMoney`, percentage costs priced against the real balance) and refuses it when only protected cash could pay and a sibling option is still choosable. If none is, the cost stays payable (clipped at the floor) so an event can never lock. It runs in `resolveEventChoice` and in the modal, and is a no-op outside a run.

## Events

- `resolveChoice` skillCheck in `eventEngine.ts` must branch `stat === 'luck'` BEFORE the `gameState.band[stat]` fallthrough. `band.luck` exists (default 0), so checking band stats first turns the random luck roll into a static 0.

## triggerEvent

- `gig_intro` / `gig_mid` are the only trigger points that fire _during_ the GIG scene. `useEventSystem`'s `triggerEvent` deliberately exempts them from both the GIG-scene block and the daily `eventsTriggeredToday` cap (and does not increment that counter) — they are gig-moment beats, not part of the daily random-event budget. They are fired once each per gig from `useRhythmGameLogic`'s `update` wrapper via `maybeFireGigProgressEvent` in `rhythmGameLoopUtils.ts` (at gig start, then progress ≥ 50, guarded by the `gigIntroFired`/`gigMidFired` ref flags), limited to at most one _shown_ event per setlist song by the `lastGigEventSongIndex` ref flag — only a successful `triggerEvent` consumes the song slot; a missed chance roll spends that event's single attempt but lets the other event still try in the same song. The helper is inert while `songTransitioning` (progress is stale from the previous song) and after `hasSubmittedResults`, and `processRhythmGameTick` pauses audio while the resulting `activeEvent` modal is open. Do NOT re-block GIG-scene events or remove the exemption: the `src/data/events/gig.ts` events, the `showman` trait, and the `stage_diver` milestone all depend on it.
