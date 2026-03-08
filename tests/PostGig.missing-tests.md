# PostGig Missing Test Inventory

This list tracks **currently untested or under-tested PostGig behaviors** based on `src/scenes/PostGig.jsx`, `tests/PostGig.component.test.jsx`, and `tests/PostGig.leaderboard.test.jsx`.

## 1) Event trigger chain on mount

- [ ] Covers `triggerEvent('financial', 'post_gig')` returning `null` and then successfully triggering `special`.
- [ ] Covers both `financial` and `special` returning `null`, then triggering `band`.
- [ ] Verifies no extra trigger calls once one event type resolves.

## 2) Initialization guards and early returns

- [ ] Verifies financial/post option initialization does **not** rerun when `financials` is already set.
- [ ] Verifies `currentGig` missing short-circuits mount effects without trigger attempts.
- [ ] Verifies `lastGigStats` missing prevents financial calculation and post option generation.

## 3) Social post resolution branches

- [ ] `result.success = false` keeps viral increment at `+0` (except gig viral bonus rules).
- [ ] No cross-post fan gain when post fails.
- [ ] `result.reputationCooldownSet` overrides `social.reputationCooldown`.
- [ ] `result.egoClear` forces `egoFocus = null`.
- [ ] `result.egoDrop` sets `egoFocus` when `egoClear` is false.
- [ ] `option.id === 'comm_sellout_ad'` disables `sponsorActive`.
- [ ] `allMembersStaminaChange` branch updates all members and clamps stamina `0..100`.
- [ ] `allMembersMoodChange` branch updates all members and clamps mood `0..100`.
- [ ] Influencer update path where influencer ID is missing keeps `influencers` unchanged.

## 4) Brand deal phase behavior

- [ ] Accepting one deal while multiple offers remain stays in `DEALS` phase.
- [ ] Accepting a deal with no `offer.duration` yields expected `remainingGigs` behavior.
- [ ] Penalty clamping for loyalty/controversy at lower bound `0` on large negative values.
- [ ] Alignment update clamping at upper bound `100` for brand reputation.

## 5) Spin story and complete phase guards

- [ ] Spin story action is absent when controversy is `<= 50`.
- [ ] Spin story action is absent when `pr_manager_contract` is missing.
- [ ] `handleContinue` no-op when `financials` is null.
- [ ] Fame gain upper bound: verifies `MAX_FAME_GAIN` cap at `500`.

## 6) Leaderboard submission edge/error handling

- [ ] Missing `playerName` skips leaderboard submissions (currently only missing `playerId` is covered).
- [ ] Unknown `songId` (not found in `SONGS_DB`) is skipped gracefully (no fetch call for that entry).
- [ ] Mixed `songStats` list submits known songs and skips unknown songs.
- [ ] `fetch` non-OK response path logs submit failure via `logger.error`.
- [ ] `fetch` rejection path logs submit failure via `logger.error`.

## 7) Scene transition timing/ordering robustness

- [ ] In non-bankruptcy path, verifies `saveGame(false)` and `changeScene(OVERWORLD)` happen through `setTimeout` callback explicitly.
- [ ] In bankruptcy path, verifies no deferred overworld transition is scheduled.
