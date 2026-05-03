# TODO Audit — Code, Features, Logic, and Gameflow (2026-05-01)

This note collects concrete improvement opportunities found during a focused read of state flow, event handling, travel/arrival, and economy systems.

## 1) State + Reducer Reliability

- [ ] **Harden exhaustive action safety in `gameReducer`**: the default branch already calls `logger.warn` and `assertNever`; extend it with a structured telemetry counter (not just a log line) so unknown-action frequency is observable in monitoring, not only in the dev console.
  - *Best practice*: gate the metric increment behind `process.env.NODE_ENV !== 'production'` and a `logLevel >= 'warn'` check; the counter itself should write to a dev-only ring buffer that the debug overlay can surface and reset between sessions.
  - *Pattern*: `default: { logger.warn(…); devMetrics.increment('unknownAction', action.type); return assertNever(action as never); }` — `devMetrics` is a `NullMetrics` no-op in production and a real counter in dev/test; the counter shape is `Record<string, number>`.
  - *Pitfall*: logging the full action object leaks sensitive payload data (money amounts, player names) to the console in dev builds accessible to end users; `logger.warn` must log only `action.type` and the reducer name, never the payload.

- [ ] **Replace `as ReducerMap` cast with `satisfies ReducerMap` on the handler map**: `gameReducer.ts` already uses a typed `ReducerMap` mapped type, but seals it with an `as` cast that suppresses assignment errors; switching to `satisfies` retains narrowing while surfacing any handler whose payload type has drifted.
  - *Best practice*: `satisfies` checks the object literal's shape without widening the inferred type, meaning handler bodies continue to receive the narrowest possible action type; `as` suppresses both the error and the narrowing benefit.
  - *Pattern*: keep each handler as a named function in its own file (`handlers/setMoney.ts`) and import them into the handler map; per-handler unit tests then require no reducer import.
  - *Pitfall*: the existing `as ReducerMap` cast means a handler added with the wrong payload type compiles silently; the cast must be removed or replaced before the typed map provides any compile-time safety.

- [ ] **Add reducer-level invariants test suite**: validate post-action guarantees (money non-negative, harmony bounds, no invalid scene transitions).
  - *Best practice*: model invariants as a `checkInvariants(state: GameState): InvariantViolation[]` pure function and call it in two places: as an assertion in the invariants test suite, and optionally in the reducer's `default` branch in dev mode as a post-action audit.
  - *Pattern*: parameterise the test over all action types — for each action creator, generate a valid payload, apply it to `createInitialState()`, and run `checkInvariants`; one loop covers the whole surface rather than one test per action.
  - *Pitfall*: testing invariants only against happy-path payloads misses the edge cases that actually violate bounds; always include boundary inputs (`money: 0`, `harmony: 1`, `harmony: 100`) and adversarial inputs (`money: -1`, `harmony: 0`, `harmony: 101`) in the invariants suite.
  - *Pitfall*: re-clamping inside the reducer masks the real bug (the action creator sent an out-of-range value); invariant tests must fail loudly when an out-of-range value reaches the reducer, not silently pass because the reducer corrected it.

## 2) Event System Robustness

- [ ] **Move event resolution into a pure domain service**: `useEventSystem` currently computes preview state and dispatches side effects in one path; extract a pure resolver returning `{actions, sideEffects}` to simplify testing and rollback safety.
  - *Best practice*: model the resolver signature as `resolveEvent(event: GameEvent, state: GameState, rng: PRNG): EventResolution` where `EventResolution = { actions: GameAction[]; sideEffects: SideEffect[] }` — no dispatch, no React context, no imports from the hook layer; the function is a pure transformation testable in Node without a DOM.
  - *Pattern*: apply the returned `actions` via `actions.forEach(dispatch)` in the hook after the pure resolver returns; apply `sideEffects` via a side-effect runner that can be stubbed in tests — this separates "what should happen" (pure, tested exhaustively) from "how it is triggered" (effectful, tested with one integration smoke test).
  - *Pitfall*: a resolver that calls `dispatch` internally makes rollback impossible — if a second action in the resolution fails or is vetoed, the first action has already mutated state with no way to undo it; the batch-then-dispatch pattern is the only safe option.

- [ ] **Create deterministic replay tests for event deltas**: snapshot before/after event choices (including `flags.addQuest` + unlocks) to prevent regressions.
  - *Best practice*: store snapshots as committed JSON fixtures (`tests/fixtures/events/<eventId>.<choiceIndex>.json`) with `{ before: GameState, choice: string, after: GameState }` shape; run the resolver against the `before` fixture and assert the output equals `after` using `toStrictEqual` — changes to event logic produce a visible diff in the fixture file.
  - *Pattern*: add a `pnpm run fixtures:update` script that regenerates all event fixtures from the current resolver logic; developers run it intentionally when changing event outcomes, creating a deliberate audit trail in the git diff.
  - *Pitfall*: snapshotting the entire `GameState` in fixtures makes tests brittle to unrelated state shape changes; snapshot only the diff (`{ changedKeys: { money: [before, after], flags: { added: [], removed: [] } } }`) so a rename elsewhere does not break every event test.

- [ ] **Add per-category daily caps**: current `eventsTriggeredToday >= 2` is global; consider category-based throttles to avoid starving rare event chains.
  - *Best practice*: store caps as `dailyCaps: Record<EventCategory, number>` in the balance config (see §4), not hardcoded in the event engine — this allows tuning without code changes and makes the cap policy visible and reviewable.
  - *Pattern*: initialise `eventsTriggeredByCategory: Partial<Record<EventCategory, number>>` in game state and reset it on day advance; the engine checks `(eventsTriggeredByCategory[category] ?? 0) >= dailyCaps[category]` before triggering.
  - *Pitfall*: adding a new event category without adding a corresponding cap entry causes `undefined >= 2` to evaluate to `false` (never blocked), allowing the new category to fire unlimited times; default the cap lookup to `dailyCaps.default ?? 1` rather than to `Infinity`.

- [ ] **Add structured event analytics hooks**: count trigger attempts, trigger success rate, and skipped reasons (scene lock, cap reached, no match).
  - *Best practice*: define an `IEventAnalytics` interface with `recordAttempt`, `recordTrigger`, `recordSkip(reason: SkipReason)` methods; inject a `NullEventAnalytics` (all no-ops) in production and a `RecordingEventAnalytics` in tests and dev — analytics calls never affect game logic.
  - *Pattern*: define `SkipReason` as a string-literal union (`'scene_lock' | 'daily_cap' | 'no_match' | 'cooldown'`) rather than a free string so the analytics consumer can exhaustively handle all reasons without a catch-all branch.
  - *Pitfall*: logging analytics inside the pure resolver couples it to a side-effectful dependency; analytics calls belong in the hook layer after the resolver returns, not inside the resolver itself.

## 3) Travel + Arrival Gameflow

- [ ] **Make arrival idempotency explicit**: `useArrivalLogic` uses one-shot `isHandlingRef`; add a documented reset trigger (e.g., on node change or scene change) to avoid edge lockouts in long sessions.
  - *Best practice*: make the reset condition a named constant and test it explicitly — `ARRIVAL_REF_RESET_TRIGGER = ‘nodeId’` documented in the hook’s JSDoc; a test verifies that navigating to a second node after a failed arrival attempt processes the new arrival correctly without requiring a full page reload.
  - *Pattern*: reset `isHandlingRef.current = false` in a `useEffect` cleanup keyed on `[nodeId]` so the ref resets automatically when the node changes — no manual reset call needed, no edge case where a stale `true` value blocks the next arrival.
  - *Pitfall*: using a boolean `useRef` for idempotency guards works for single-node arrivals but breaks if two rapid node changes arrive before the first `useEffect` runs (React batches renders); use the `nodeId` as the idempotency key rather than a boolean, and store it in the ref: `isHandlingRef.current === nodeId` means “already handling this node.”

- [ ] **Unify arrival routing contract**: move final scene routing responsibility fully into `handleNodeArrival` so hooks don’t split “business routing” vs “fallback routing.”
  - *Best practice*: define `ArrivalResult = { scene: SceneId; actions: GameAction[] }` as the return type of `handleNodeArrival`; the hook applies `actions` and navigates to `scene` — no routing logic lives in the hook body.
  - *Pattern*: model each node type handler as a pure function `handleGigNode(node, state) => ArrivalResult`, `handleRestNode(node, state) => ArrivalResult`, etc., registered in a `nodeHandlers` map — adding a new node type is one new entry in the map, not a new `if`/`else` branch in the hook.
  - *Pitfall*: a “fallback” scene in the hook is a silent catch-all that hides unhandled node types; replace the fallback with an `assertNever`-equivalent log + metrics call and an explicit `OVERWORLD` return, so unhandled node types are visible in analytics rather than silently swallowed.

- [ ] **Expose cancellation odds UX**: low-harmony gig cancellation currently feels opaque; surface pre-travel warning text and % risk in UI.
  - *Best practice*: extract the cancellation probability formula into a pure `calcCancellationRisk(harmony: number, modifiers: CancellationModifiers): number` function in `gameStateUtils.ts`; the UI calls the same function the engine uses — there is never a discrepancy between the displayed risk and the actual roll.
  - *Pattern*: display the risk as a colour-coded badge (`< 10%` green, `10–30%` amber, `> 30%` red) computed from the current harmony value via the shared function; update the badge reactively as harmony changes in the pre-travel summary without requiring a separate API call.
  - *Pitfall*: displaying a rounded percentage (“~25%”) while the engine uses a precise float creates player distrust when a “25% risk” gig cancels three times in a row; show the exact one-decimal value and explain the sample size (“1 in 4 chance per attempt”) to calibrate expectations.

- [ ] **Add property tests for travel outcomes**: verify rest-stop recovery and cancellation branches always respect clamp functions and never overshoot bounds.
  - *Best practice*: use fast-check or a hand-rolled property harness to generate arbitrary `(harmony, stamina, modifier)` triples across the full valid range and assert that every output satisfies `harmony >= 1 && harmony <= 100 && money >= 0`; a single property test covers more ground than dozens of hand-picked example tests.
  - *Pattern*: define the property as a named invariant function (`travelOutcomeIsValid(outcome: TravelOutcome): boolean`) and call it both in property tests and as a dev-mode assertion inside the travel resolver — same invariant, two enforcement points.
  - *Pitfall*: property tests that only generate “reasonable” inputs (e.g., `harmony` between 10 and 90) miss the boundary cliffs where real bugs live; always include the exact boundary values (1, 100, 0) as explicit seed cases in the property harness so they are always exercised regardless of random sampling.

## 4) Economy Balance + Explainability

- [ ] **Externalize tuning constants to a balance config**: `economyEngine` embeds many constants; move to one versioned tuning object for easier A/B balancing.
  - *Best practice*: define `BalanceConfig` as a typed object with grouped sub-sections (`attendance`, `penalties`, `modifiers`, `caps`) and a `configVersion: number`; store it in `src/config/balance.ts` imported by the engine — swapping configs for an A/B test is a single import change, not a multi-file grep.
  - *Pattern*: validate the config at startup with a `parseBalanceConfig(raw: unknown): BalanceConfig` guard; if the config is invalid (e.g., a cap below its floor), throw a descriptive error at boot rather than silently producing nonsense economy results at runtime.
  - *Pitfall*: extracting constants to a config object but still importing them with `const { TICKET_BASE } = balanceConfig` at module scope defeats tree-shaking and couples tests to the live config values; always pass the config as a parameter to engine functions so tests can inject a known-good test config without side effects.

- [ ] **Add economy breakdown trace mode**: emit per-step contribution details (attendance, penalties, modifiers, caps) for debugging “why this net changed.”
  - *Best practice*: model the trace as an optional accumulator argument: `calculateGigEconomy(state, config, trace?: BreakdownTrace)` — when `trace` is provided the engine appends step entries; when absent, the path is zero-overhead with no branching cost in production.
  - *Pattern*: define `BreakdownTrace = { steps: Array<{ label: string; value: number; running: number }> }` so the debug overlay can render a waterfall chart directly from the trace without further transformation; `label` is an i18n key, not a raw string.
  - *Pitfall*: building the trace string inline (`\`attendance * baseRate = ${attendance * baseRate}\``) conflates computation with presentation and makes the trace non-localisable; always store structured `{ label: string; inputs: Record<string, number>; output: number }` and format for display in the UI layer.

- [ ] **Add anti-swing smoothing experiment**: prototype soft floor/ceiling around early-game losses/wins to reduce runaway failure spirals.
  - *Best practice*: implement smoothing as an opt-in `applySwingSmoothing(delta: number, state: GameState, config: BalanceConfig): number` wrapper around the raw delta — the engine's core calculation is unchanged; the wrapper is toggled by a balance config flag, making it easy to A/B test without touching the engine.
  - *Pattern*: define the soft floor as a curve rather than a hard cap: `smoothedDelta = delta * (1 - exp(-|delta| / SWING_HALF_LIFE))` — this reduces extreme swings proportionally rather than cutting them off abruptly, which feels fairer to players and avoids the “why did I get exactly −50?” frustration of hard caps.
  - *Pitfall*: smoothing that affects both gains and losses equally penalises skilled play; consider asymmetric smoothing (dampen catastrophic losses, leave large gains intact) so the mechanic functions as a safety net without removing the reward ceiling.

- [ ] **Add localization-ready labels for every breakdown line item**: ensures all gain/loss sources map to user-visible explanations.
  - *Best practice*: define a `BREAKDOWN_LABEL_KEYS` constant object (`{ TICKET_REVENUE: 'economy.breakdown.ticketRevenue', HARMONY_PENALTY: 'economy.breakdown.harmonyPenalty', … }`) and use only keys from this object in `EconomyBreakdown` line items — the i18n consistency checker can then lint `Object.values(BREAKDOWN_LABEL_KEYS)` against locale files in a single pass.
  - *Pattern*: add a `description` field alongside each `labelKey` in the breakdown DTO that provides a one-sentence mechanic explanation (also an i18n key); this powers both the live breakdown panel and the in-game glossary without duplicating strings.
  - *Pitfall*: adding a new economy formula step without adding a corresponding `BREAKDOWN_LABEL_KEYS` entry causes the step to appear in the debug trace but not in the player-facing breakdown — enforce the mapping with a test that asserts `Object.keys(traceSteps)` is a subset of `Object.values(BREAKDOWN_LABEL_KEYS)`.

## 5) Map Generation + Recovery UX

- [ ] **Introduce stable seed strategy**: `new MapGenerator(Date.now())` prevents reproducible bug reports; consider run seed + optional debug override.
  - *Best practice*: generate the seed once at run creation (`runSeed = crypto.getRandomValues(new Uint32Array(1))[0]`), persist it in `GameState`, and pass it to `MapGenerator`; the seed is then part of every bug report automatically because it is in the save file.
  - *Pattern*: read a `?seed=<n>` URL query parameter in dev/staging builds and pass it to `MapGenerator` as an override — no code path change needed for production, QA can reproduce any reported seed by pasting the URL, and the override is never active in prod because the parameter is ignored.
  - *Pitfall*: using `Date.now()` as the seed means two sessions started within the same millisecond (e.g., in automated tests) produce the same map — use `crypto.getRandomValues` instead, which is available in all modern browsers and in Node ≥ 15.

- [ ] **Add incremental fallback for generation failures**: instead of returning to menu after retries, try a known-safe template map for graceful recovery.
  - *Best practice*: commit the template map as a static JSON file (`src/data/fallbackMap.json`) validated against `MapSchema` on every CI run — the fallback can never silently become invalid because the schema check runs automatically.
  - *Pattern*: implement a three-tier recovery: (1) retry generation up to `MAX_RETRIES` times with the same seed but a different sub-seed offset; (2) if all retries fail, load the template map and emit a telemetry event; (3) only return to menu if the template map also fails to validate — prevents the player from losing their run due to a transient generation bug.
  - *Pitfall*: a fallback map that contains only one route (e.g., straight line of gig nodes) is boring but technically valid; define minimum diversity requirements (at least `N` branch points, at least `M` non-gig nodes) in the schema so the fallback provides a real gameplay experience.

- [ ] **Log map failure signatures**: include generation params and failed phase for easier root-cause analysis.
  - *Best practice*: structure the failure log as `{ seed, attempt, phase: GenerationPhase, nodeCount, edgeCount, errorMessage, stack }` and emit it via the same structured logger used elsewhere — a consistent shape makes log aggregation and filtering trivial.
  - *Pattern*: define `GenerationPhase` as a string-literal union (`'nodeLayout' | 'edgeConnection' | 'validation' | 'invariantCheck'`) so the phase field is always one of a known set; a free-string `phase` field produces unqueryable log entries.
  - *Pitfall*: logging the full generated node graph on failure can produce multi-megabyte log entries that overwhelm the log buffer and obscure other errors; log only the structural summary (counts, seed, phase) and offer a separate debug-mode flag that appends the full graph to a local file.

## 6) Testing Gaps to Prioritize

- [ ] **Golden-path simulation for day loop**: travel → arrival → event (optional) → gig start/cancel → postgig economy assertions.
  - *Best practice*: write the simulation as a pure state-machine driver: `applySequence(initialState, [travelAction, arrivalAction, gigStartAction, postgigAction])` returning the final state — no DOM, no hooks, no async; the full day loop runs in <5 ms.
  - *Pattern*: define the golden-path fixture as a table with columns `[stepName, actionCreator, expectedStateDelta]`; each row asserts only the fields it owns so a regression in economy does not break the travel assertion and vice versa.
  - *Pitfall*: writing the golden-path test as a Playwright e2e test makes it 50× slower and dependent on browser timing; reserve e2e for the UI smoke test; use the pure state-machine driver for the logic assertions that run in every PR gate.

- [ ] **Fuzz tests for hostile payloads**: especially event delta flags and quest payload shape coercions.
  - *Best practice*: generate hostile payloads using a structural fuzzer rather than hand-written cases — for each schema field, generate `null`, `undefined`, the wrong type, an empty string, `Number.MAX_SAFE_INTEGER`, and prototype-polluting keys (`__proto__`, `constructor`, `toString`); run all combinations through the parser boundary and assert no exception escapes and no state corruption occurs.
  - *Pattern*: maintain a `HOSTILE_PAYLOAD_CASES` fixture file with at least 20 known-hostile shapes; run it as a parameterised test in both the `node:test` and Vitest suites so coverage applies to both environments.
  - *Pitfall*: fuzz tests that only assert "no exception thrown" pass even when the hostile input silently corrupts state; always follow the fuzz call with `checkInvariants(state)` to catch state corruption that does not throw.

- [ ] **Performance regression check**: benchmark expensive calculations in `economyEngine` and event processing under long campaigns.
  - *Best practice*: define a performance budget per function (`calcGigEconomy < 2 ms`, `resolveEvent < 1 ms`) in a committed `perf-budgets.json` file; the benchmark runner fails CI when any budget is exceeded on two consecutive runs (single-run outliers are noise).
  - *Pattern*: simulate a "long campaign" by running 100 consecutive day-loop cycles in the benchmark harness with realistic state growth (accumulated flags, history entries, faction scores); this catches O(n²) complexity bugs that only manifest after the player's 50th gig.
  - *Pitfall*: running performance benchmarks in the same Vitest process as unit tests produces noisy results due to JIT warm-up and garbage collection interactions; use a dedicated benchmark runner (`vitest bench` or a separate `node --prof` script) isolated from the test suite.

## 7) Feature Opportunities (Gameplay) — Comprehensive Backlog

### 7.1 Strategic Layer (Overworld / Tour Planning)

- [ ] **Band morale “forecast” panel**: show likely harmony/stamina impact before committing to destination.
  - *Best practice*: reuse `calcCancellationRisk` and the travel outcome resolver (see §3) to produce the forecast — the panel must call the exact same pure functions the engine will use, not a separate approximation, so displayed predictions are always accurate.
  - *Pitfall*: a forecast that diverges from actual outcomes by more than rounding erodes player trust faster than no forecast at all; share one code path, not two.

- [ ] **Regional heatmap overlay**: visualize city-level demand, controversy risk, and prior-show fatigue to guide routing decisions.
  - *Best practice*: store per-city state (`demand`, `fatigue`, `controversy`) as a `CityState` slice in `GameState` updated by gig outcome actions — the heatmap reads from the store, never from a separate derived cache that can go stale.
  - *Pattern*: normalise all three metrics to a `0..1` range before rendering so the heatmap component is independent of the absolute scale of any one metric.

- [ ] **Tour leg planner**: allow queuing 2–3 destinations with projected costs, downtime, and expected payout variance.
  - *Best practice*: model the queue as `plannedRoute: NodeId[]` in `GameState`; apply `PLAN_ROUTE` / `CLEAR_ROUTE` actions through the normal action creator + reducer path so the planner is undo-safe and replayable.
  - *Pitfall*: computing projected costs eagerly for all queued destinations on every render is O(n) economy calculations per frame; memoize with `useMemo` keyed on the `plannedRoute` array reference.

- [ ] **Venue relationship system**: repeated good/bad outcomes change venue trust, booking quality, and contract terms.
  - *Best practice*: store relationship scores as `venueRelationships: Record<VenueId, number>` clamped to `0..100` in `GameState` using `clamp` from `gameStateUtils.ts`; apply changes only via action creators so every score change is auditable in the action log.
  - *Pitfall*: never initialise a venue's relationship score lazily inside a selector — missing keys cause inconsistent defaults across call sites; initialise all venue scores to `50` when the map is generated.

- [ ] **Travel budget assistant**: pre-travel prompt calculating guaranteed upkeep + fuel + repair risk window.
  - *Best practice*: expose a `calcTravelCostEstimate(route: NodeId[], state: GameState, config: BalanceConfig): CostEstimate` pure function usable by both the UI prompt and automated tests — the prompt is just a React wrapper around this function.
  - *Pattern*: `CostEstimate = { guaranteed: number; expectedRisk: number; worstCase: number }` — show all three figures so players understand the variance range, not just the expected value.

### 7.2 Pre-Gig Decisions

- [ ] **Dynamic promoter negotiation pre-gig**: short decision step affecting ticket price, turnout risk, and backlash odds.
  - *Best practice*: model each negotiation option as an immutable `NegotiationOffer` value object (`{ ticketPriceMultiplier, turnoutRiskDelta, backlashOddsDelta }`) selected via a `SELECT_PROMOTER_OFFER` action; the gig resolver reads the chosen offer from state rather than having the UI pass deltas directly into the engine.
  - *Pitfall*: generating offer values with `Math.random()` at render time means the player sees different offers on each re-render; generate offers once via the seeded PRNG when the PREGIG scene is entered and store them in state.

- [ ] **Setlist risk/reward presets**: “safe”, “balanced”, “chaotic” templates changing hype curve and miss tolerance.
  - *Best practice*: define presets in the balance config as `SetlistPreset = { id: string; hypeCurveMultiplier: number; missToleranceDelta: number; labelKey: string }` — the engine reads the active preset from state; adding a new preset is a config change, not a code change.
  - *Pitfall*: applying preset multipliers inside the gig renderer (UI layer) rather than in the economy engine means the preset has no effect in headless tests or replays.

- [ ] **Soundcheck tradeoff events**: spend extra time/money for stability buffs vs less crowd pre-hype.
  - *Best practice*: treat soundcheck as an optional `PREGIG` sub-event using the existing event system (see §2) — it is just a structured choice with a cost action and a buff action; no new system is needed.
  - *Pattern*: apply the stability buff by extending the existing `gigModifiers: GigModifiers` object (the modifier shape already used by the gig engine) rather than introducing a separate list; add a `soundcheckBonus` field to `GigModifiers` and clear it in the postgig reducer.

- [ ] **Local scene intel cards**: city-specific traits (genre bias, attention span, bar spend profile) before confirming.
  - *Best practice*: store city traits as part of the `CityState` slice generated at map creation time (using the run PRNG for procedural traits) — the intel card is a read-only view of existing state, not a new data fetch.
  - *Pitfall*: generating city traits at the point of displaying the intel card means a player who opens and closes the card multiple times sees different traits; generate once, store in state.

- [ ] **Crew assignment choices**: assign members to prep tasks for temporary gig modifiers with opportunity costs.
  - *Best practice*: model crew assignments as `crewAssignments: Record<BandMemberId, PrepTask | null>` in `GameState`; validate on `GIG_START` that no member is assigned to two tasks; clear assignments in the postgig reducer.
  - *Pitfall*: never add a band member to their own `relationships` map (per `AGENTS.md`); similarly, never assign a member as both performer and crew for the same gig — add a reducer-level guard that rejects such a state.

### 7.3 Travel and Interstitial Gameplay

- [ ] **Travel incident mini-choices**: lightweight risk/reward forks during travel to increase strategic depth between gigs.
  - *Best practice*: reuse the existing event system (§2) for travel incidents — a travel incident is just an event scoped to the `TRAVEL` scene; no new mechanism is needed, and all existing caps, cooldowns, and analytics apply automatically.
  - *Pitfall*: spawning travel incidents via a separate ad-hoc system creates two parallel event code paths that diverge over time; if the event engine handles scene-scoped events, use it.

- [ ] **Road condition system**: weather/road states influencing travel minigame difficulty and van wear probability.
  - *Best practice*: store `roadCondition: RoadCondition` as part of the current travel segment's state, generated from the run PRNG when the segment begins; the travel minigame reads it as a modifier, not as a live fetch — eliminates network dependency mid-travel.
  - *Pattern*: define `RoadCondition` as a discriminated union (`{ type: 'clear' } | { type: 'wet'; wearMultiplier: number } | { type: 'storm'; difficultyDelta: number; wearMultiplier: number }`) so the engine exhaustively handles all conditions without a catch-all branch.

- [ ] **Supply stop encounters**: optional shops/black-market stalls with timed offers and reputation consequences.
  - *Best practice*: model supply stops as a specialised `MapNode` type (`type: 'supplyStop'`) with a `shopInventory: ShopItem[]` field generated at map creation time — the shop contents are deterministic from the run seed, not randomly regenerated on each visit.
  - *Pitfall*: consumables purchased at supply stops must use `inventory_add` (per `AGENTS.md`) and must never be displayed as `OWNED`; assert this in a test that verifies the item type after purchase.

- [ ] **Band banter outcomes**: inter-member dialog choices that can heal or worsen relationships.
  - *Best practice*: implement banter as relationship-delta events with a `source: 'banter'` tag; clamp resulting relationship values in the action creator using `gameStateUtils.ts`, never in the reducer; the self-relationship guard (per `AGENTS.md`) must be validated by a unit test that passes a member-to-self banter payload and asserts it is rejected.
  - *Pitfall*: storing banter dialog text in `GameState` bloats the save file; store only the outcome (`{ member1, member2, delta, timestamp }`) and derive dialog from i18n keys.

- [ ] **Emergency detour contracts**: last-minute side gigs with high payout but high stress and cancellation risk.
  - *Best practice*: model detour contracts as a special `TravelEvent` that injects a temporary `MapNode` into the route; after the detour resolves, the node is removed and travel continues to the original destination — no permanent map mutation, no orphaned nodes.
  - *Pattern*: set a `detourAccepted: boolean` flag in travel state and clear it in the arrival reducer so the temporary node is never persisted into the long-term map structure.

### 7.4 Performance / Gig Moment-to-Moment

- [ ] **Adaptive crowd behavior**: crowd energy reacts to streaks, misses, and stage presence in near real time.
- [ ] **Encore decision mechanic**: optional overtime performance with extra payout and extra fatigue/gear penalties.
- [ ] **Heckler interaction windows**: player choices to ignore/counter hecklers, influencing hype and controversy.
- [ ] **Spotlight moments per band member**: short bonus windows tied to member traits and current mood/stamina.
- [ ] **Difficulty assist toggles**: optional aid modifiers that trade leaderboard scoring for accessibility.

### 7.5 Post-Gig, Progression, and Meta

- [ ] **Post-gig coaching prompts**: contextual suggestions from last performance misses/tempo stability to guide player improvement.
  - *Best practice*: derive coaching prompts from the existing `EconomyBreakdown` trace (§4) and a `PerformanceMetrics` struct emitted by the gig engine — no new data collection is needed; the prompts are just a read-only UI over already-computed data.
  - *Pattern*: define `CoachingRule = { condition: (metrics: PerformanceMetrics) => boolean; labelKey: string; priority: number }` and store rules in a data file; the postgig screen runs all rules and shows the highest-priority matching prompt — adding new advice is a data change, not a code change.

- [ ] **Performance debrief timeline**: chronological replay of key moments that explains where net gains/losses happened.
  - *Best practice*: accumulate `TimelineEvent[]` during the gig as an append-only log in gig state (`{ timestampMs, type, delta }`); serialise this log into the postgig state snapshot so the debrief screen can render it without the audio engine being active.
  - *Pitfall*: do not store the timeline in `audioEngine` internal state — it must survive the engine teardown that happens when the gig scene exits; write timeline events to the store via actions during the gig.

- [ ] **Fan segment progression**: track audience cohorts (casual, loyal, zealots) with different growth and churn rules.
  - *Best practice*: model fan segments as `fanSegments: { casual: number; loyal: number; zealot: number }` clamped to non-negative integers in `GameState`; derive total fans as `casual + loyal + zealot` in a selector — never store a separate `totalFans` field that can go out of sync.
  - *Pitfall*: updating all three segment counts in one action creator is fine, but updating them in three separate dispatches risks an intermediate render showing inconsistent totals; batch all segment changes into a single `UPDATE_FAN_SEGMENTS` action.

- [ ] **Narrative consequence chains**: outcomes unlock follow-up storylets 1–3 days later for stronger campaign continuity.
  - *Best practice*: implement delayed storylets as scheduled events: `{ eventId, triggerAfterDay: currentDay + offset }` stored in `pendingStorylets: ScheduledEvent[]`; the event engine checks on each day advance whether any scheduled events should be promoted to the active event pool — no new scheduler mechanism needed.
  - *Pitfall*: referencing a storylet by a free string `eventId` without validating it exists in the event registry at scheduling time means a typo silently drops a consequence chain; validate `eventId` against the event registry in the action creator.

- [ ] **Season goals and milestone rewards**: medium-term objectives that stabilize progression pacing.
  - *Best practice*: define milestones as `{ id, condition: (state: GameState) => boolean, rewardAction: GameAction, labelKey: string }` in a data file; the day-advance reducer checks all uncompleted milestones and dispatches reward actions for newly completed ones — milestone logic is declarative and testable without UI.
  - *Pitfall*: checking all milestone conditions on every render rather than only on day advance is an O(milestones) computation per frame; gate the check behind the day-advance action in the reducer.

### 7.6 Economy and Management Depth

- [ ] **Merch strategy screen**: choose inventory mix and pricing before shows with demand uncertainty.
  - *Best practice*: model merch inventory as consumable items using the existing `inventory_add` path (per `AGENTS.md`); merch revenue is a `EconomyBreakdown` line item calculated in `economyEngine` from `currentInventory * soldFraction * unitPrice` — no separate merch engine needed.
  - *Pitfall*: storing merch revenue as a separate parallel number outside `EconomyBreakdown` causes the postgig summary to show inconsistent totals; always route all money deltas through the breakdown DTO.

- [ ] **Staff hiring system**: manager/driver/tech roles granting passive bonuses with weekly salary burden.
  - *Best practice*: model hired staff as `activeStaff: StaffMember[]` in `GameState`; their passive bonuses extend `gigModifiers: GigModifiers` (the existing modifier object) by adding staff-specific fields on hire — no parallel modifier list needed; the gig engine already reads `gigModifiers` at scoring time.
  - *Pattern*: salary deduction is a weekly recurring action scheduled the same way as narrative consequence chains (§7.5) — a `DEDUCT_SALARY` action dispatched on the correct day advance, not a separate timer.

- [ ] **Insurance and warranty choices**: reduce catastrophic losses at recurring cost.
  - *Best practice*: implement insurance as a field on `gigModifiers: GigModifiers` (e.g., `insurancePenaltyCap: number | null`) that limits negative deltas on specific breakdown line items; the economy engine reads the cap from `gigModifiers` at calculation time — insurance is a data value, not a special-case code branch.
  - *Pitfall*: hard-coding insurance effects inside the cancellation resolver couples two separate concerns; insurance should be a cap value that the resolver reads, not special-case logic in the resolver.

- [ ] **Sponsorship contract negotiation**: choose values-aligned or high-paying sponsors with social tradeoffs.
  - *Best practice*: model active sponsorships as `activeContracts: SponsorContract[]` with `{ sponsorId, moneyPerGig, factionReputationDelta: Record<FactionId, number>, expiresAfterGig: number }` — revenue and reputation effects are applied in the postgig economy and faction update actions respectively.
  - *Pitfall*: faction reputation changes from sponsorships must go through the same `clamp(1, 100)` guard as all other reputation changes; apply the clamp in the `UPDATE_FACTION_REPUTATION` action creator, not inline in the sponsorship resolver.

- [ ] **Debt and financing tools**: emergency loans with escalating pressure events if repayments slip.
  - *Best practice*: model debt as `activeDebts: Debt[]` with `{ principal, interestRatePerDay, repaymentDueDay, pressureEventId }`; on each day advance the reducer accrues interest and checks whether repayment is overdue — overdue debts schedule a `pressureEventId` entry in `pendingStorylets` (§7.5) rather than firing immediately, preserving the player's agency.
  - *Pitfall*: accruing interest as a floating-point multiplication over many days introduces cumulative rounding error; store debt amounts as integer cents or use a `Decimal` wrapper, and round only at display time.

### 7.7 Social, Reputation, and World Reactivity

- [ ] **Faction reputation tracks**: different subcultures react uniquely to choices, changing event pools and perks.
- [ ] **Media cycle simulation**: short news bursts amplify or suppress controversy effects for several days.
- [ ] **Rival band ecosystem**: AI bands compete for slots, trigger drama events, and influence demand.
- [ ] **Community action arcs**: charity/protest benefit gigs with delayed reputation and economy outcomes.
- [ ] **Dynamic city state changes**: cities evolve based on repeated player behavior (supportive, hostile, saturated).

### 7.8 Accessibility, UX, and Onboarding

- [ ] **Run advisor mode**: optional guidance highlighting likely bad decisions before irreversible confirmations.
  - *Best practice*: implement advisor checks as `AdvisorRule = { condition: (state: GameState, proposedAction: GameAction) => boolean; warningKey: string }` evaluated synchronously before dispatch — the advisor intercepts the action in a middleware layer, shows the warning, and lets the player confirm or cancel.
  - *Pitfall*: running advisor rules inside React event handlers (not middleware) makes them skip when actions are dispatched programmatically (e.g., from tests or replays); always enforce via middleware so the check is universal.

- [ ] **Glossary with live examples**: explain core mechanics (harmony, hype, zealotry) using current run values.
  - *Best practice*: define glossary entries as `{ termKey: string; descriptionKey: string; liveValueSelector: (state: GameState) => string | null }` — the `liveValueSelector` renders the current run's value inline in the description; a `null` return means no live example is available for this term.
  - *Pitfall*: rendering live selectors in a modal that re-renders every frame causes jitter if the selector is not memoized; wrap each live value in `useMemo` keyed on the relevant state slice.

- [ ] **Failure recovery nudges**: contextual “comeback plan” suggestions after consecutive poor outcomes.
  - *Best practice*: detect “fragile recovery” state via a selector that checks `consecutiveLosses >= RECOVERY_THRESHOLD` (a balance config constant); the POSTGIG scene conditionally mounts the nudge component only when this selector is `true` — no new state field needed.
  - *Pattern*: suggestions are `RecoveryNudge[]` filtered from a static data file by `condition(state: GameState)` predicates, same pattern as coaching prompts (§7.5) — share the rule-matching infrastructure.

- [ ] **Input timing calibration utility**: user-tunable timing offset flow for rhythm accuracy.
  - *Best practice*: store `timingOffsetMs: number` (clamped to `±200 ms`) in the `settings` slice of `GameState` alongside `crtEnabled` and `tutorialSeen` (per `AGENTS.md` `createInitialState` rules); apply it as a constant addend in the scoring window calculation inside the gig engine.
  - *Pitfall*: `createInitialState` settings sanitization keeps only `crtEnabled`, `tutorialSeen`, and `logLevel` (per `AGENTS.md`); `timingOffsetMs` must be explicitly added to the allowlist before it can be persisted safely.

- [ ] **Replayable tutorials by subsystem**: short practice modules for travel, gig, economy, and events.
  - *Best practice*: implement tutorials as scripted event sequences using the existing event engine with `scene: 'TUTORIAL'` scope — the tutorial is just a specially flagged event chain that cannot be daily-capped and always triggers when `tutorialMode: subsystem` is active in settings.
  - *Pitfall*: tutorials that share state with the live run (modifying `GameState` directly) can corrupt a real campaign if the player exits mid-tutorial; run tutorials against an isolated `tutorialState` copy that is discarded on exit.

### 7.9 Live-Ops and Long-Term Replayability

- [ ] **Weekly challenge seeds**: fixed map/event seeds with leaderboard categories.
  - *Best practice*: deliver challenge seeds as a static JSON file fetched once on session start (with a stale-while-revalidate strategy) and cached in `localStorage` directly (or via the `StorageAdapter` abstraction once §8.10 is implemented); the game never blocks on network availability to start the challenge.
  - *Pitfall*: generating weekly challenges client-side from the current date produces different seeds across timezones; always derive the challenge seed server-side (or from a UTC-normalised week number) and distribute it explicitly.

- [ ] **Mutator runs**: opt-in rulesets (fragile gear, chaotic crowds, strict budgets) for variety.
  - *Best practice*: model mutators as `activeMutators: MutatorId[]` in `GameState`; each mutator is a named `Modifier` or a `BalanceConfig` override stored in a `mutatorRegistry` data file — combining mutators is composing their modifier lists, not writing new code paths.
  - *Pitfall*: mutators that directly modify the base `BalanceConfig` object (mutating a shared reference) bleed effects across tests and across runs; always create a new config object via `applyMutators(baseConfig, activeMutators)` rather than mutating in place.

- [ ] **Legacy unlock track**: meta progression across runs unlocking cosmetic + strategic options.
  - *Best practice*: store legacy progress outside `GameState` in a separate `LegacyProfile` persisted to a different `localStorage` key (or `StorageAdapter` key once §8.10 is implemented) — legacy data survives run resets and must not be wiped by `createInitialState`.
  - *Pattern*: define unlocks as `{ id, condition: (runSummary: RunSummary) => boolean; rewardType: 'cosmetic' | 'modifier' }` evaluated at run-end against an immutable `RunSummary` snapshot — legacy logic never reads live `GameState`, only finished-run summaries.

- [ ] **Community event packs**: rotating event bundles to refresh narrative variety.
  - *Best practice*: validate incoming event pack JSON against the same `EventSchema` used for built-in events before merging into the event pool — a malformed community pack must not crash the event engine or corrupt flags.
  - *Pitfall*: community event IDs that collide with built-in event IDs cause the wrong event to resolve when both are in the pool; namespace community event IDs with a `community:` prefix and enforce uniqueness at pack load time.

- [ ] **Endgame prestige loop**: retire successful runs for account-wide modifiers and harder remixed tours.
  - *Best practice*: implement prestige as a `RETIRE_RUN` action that copies selected `GameState` fields into `LegacyProfile` and then calls `createInitialState()` — the reducer handles the transition atomically; no special "prestige mode" flag needed.
  - *Pitfall*: prestige modifiers that stack multiplicatively across retirements create exponential power curves; cap the total prestige bonus at a maximum per modifier type and test the cap explicitly with a fixture that simulates 10 consecutive retirements.

### 7.10 Narrative, Characters, and Emotional Stakes

- [ ] **Band member personal arcs**: multi-step stories per member with loyalty/harmony consequences.
- [ ] **Relationship crisis interventions**: dedicated conflict-resolution scenes before infighting cascades.
- [ ] **Manager/mentor NPC layer**: recurring advisors with imperfect guidance and hidden agendas.
- [ ] **Branching rivalry storyline**: long-form feud arc with multiple resolution routes.
- [ ] **Memory callbacks in dialog**: later scenes reference prior risky/safe player choices.

### 7.11 Systems Depth for Band Identity

- [ ] **Genre identity stance**: pick stylistic direction that influences fan growth and sponsor fit.
- [ ] **Signature move system**: unlockable stage techniques that modify hype generation patterns.
- [ ] **Member specialization trees**: lightweight role builds (frontperson, technician, strategist, social magnet).
- [ ] **Practice session minigame**: optional between-gig training for consistency improvements.
- [ ] **Band culture values**: explicit values slider (authenticity, ambition, chaos) affecting event outcomes.

### 7.12 Fairness, Anti-Frustration, and Recovery Mechanics

- [ ] **Bad-luck protection window**: reduce consecutive catastrophic chains after repeated losses.
- [ ] **Comeback contract offers**: occasional guaranteed-stability gigs after financial collapse thresholds.
- [ ] **Transparent penalty inspector**: hoverable explanation of every major negative modifier.
- [ ] **Soft fail-state alternatives**: fallback routes before hard game-over.
- [ ] **Adaptive event pacing**: lower punitive event density during fragile recovery phases.

### 7.13 Creator/Community Tooling

- [ ] **Seed share cards**: export/import run seeds with compact challenge metadata.
- [ ] **Photo mode for moments**: capture and share post-gig highlights with stat overlays.
- [ ] **Run summary export**: machine-readable JSON/CSV for community analysis.
- [ ] **Custom challenge rule editor**: create local modifiers with safety validation.
- [ ] **Community playlist curation events**: rotating curated tracks that bias setlist modifiers.

### 7.14 Platform & Session Experience

- [ ] **Suspend/resume reliability pass**: harden persistence across tab sleep/mobile interruptions.
- [ ] **Session-length presets**: short/standard/long run modes with tuned pacing.
- [ ] **Offline-first daily mode**: local challenge that syncs when connectivity returns.
- [ ] **Cross-device profile handoff**: optional cloud save continuity with conflict resolution UX.
- [ ] **Battery/performance mode**: reduced effects path for low-power devices.


### 7.15 Audio, Stagecraft, and Performance Atmosphere

- [ ] **Crowd singalong peaks**: timed call-and-response moments that boost hype if hit cleanly.
- [ ] **Stage hazard modifiers**: cables/lights/feedback incidents requiring quick mitigation choices.
- [ ] **Venue acoustics profiles**: room-specific timing feel and monitor quality affecting consistency.
- [ ] **Lighting cue mini-system**: simple cue timing that can amplify or dampen crowd momentum.
- [ ] **Ambient-to-gig transition polish**: richer scene/audio transitions tied to venue identity.

### 7.16 Procedural Content and Run Variety

- [ ] **Procedural city quirks**: generated city traits that alter economy/event probabilities per run.
- [ ] **Venue mutation tags**: temporary venue rule twists (strict curfew, rowdy crowd, low-tech setup).
- [ ] **Dynamic objective cards**: rotating short-term goals with optional bonus rewards.
- [ ] **Remix event outcomes**: multi-variant consequence tables to reduce narrative repetition.
- [ ] **Seasonal world modifiers**: per-week global shifts (fuel spike, media craze, crackdown).

### 7.17 Collection, Crafting, and Itemization

- [ ] **Gear wear and servicing loop**: equipment condition affects reliability until repaired or replaced.
- [ ] **Pedal/rig customization**: modular loadouts that tweak scoring windows or risk profiles.
- [ ] **Consumable crafting**: combine scavenged parts into temporary buffs with tradeoffs.
- [ ] **Artifact synergy sets**: combo bonuses for themed contraband/item collections.
- [ ] **Inventory auto-pack presets**: one-click packing profiles for safe/profit/risk-heavy tours.

### 7.18 Social Features and Shared Competition

- [ ] **Asynchronous rival ghosts**: compare performance traces from friends/community runs.
- [ ] **Club/crew systems**: small player groups with shared weekly objectives.
- [ ] **Bounty board challenges**: public challenge contracts with rotating reward pools.
- [ ] **Theme-week leaderboards**: scoreboards with special scoring rules and modifiers.
- [ ] **Friendly duel mode**: one-song challenge invites using mirrored settings.

### 7.19 Education, Transparency, and Debuggability for Players

- [ ] **Outcome sandbox simulator**: preview likely financial outcomes given selected modifiers.
- [ ] **Mechanic explainers in-context**: inline rationale when the game applies hidden formulas.
- [ ] **What-changed diff cards**: day-to-day stat deltas with root-cause grouping.
- [ ] **Player-visible randomness log**: optional panel for major RNG rolls and ranges.
- [ ] **Auto-generated run journal**: chronological digest of pivotal events and decisions.

### 7.20 Experimental Modes and Cross-Genre Variants

- [ ] **Narrative-only campaign mode**: reduced rhythm difficulty focused on decisions/story arcs.
- [ ] **Hardcore permadebt mode**: stricter economy with no bailout events.
- [ ] **Co-op local pass-and-play mode**: shared campaign decisions between two players.
- [ ] **Speedrun seed mode**: deterministic short campaign optimized for routing races.
- [ ] **Director mode**: spectate AI-managed band and intervene at key decision nodes.


### 7.21 Chaotic Comedy and Emergent Band Disasters

- [ ] **The cursed fog machine**: random over-fog events that hide notes but massively boost crowd hype if survived.
- [ ] **Stage-dive insurance fraud event chain**: morally questionable payouts with escalating legal consequences.
- [ ] **Mysterious raccoon roadie**: occasional helper NPC who gives strong buffs plus weird side effects.
- [ ] **Wrong-city booking fiasco**: accidental gigs in bizarre venues (weddings, tech expos, dog shows).
- [ ] **Amplifier possessed-by-feedback arc**: recurring “haunted amp” storyline with risky power spikes.

### 7.22 Fan Culture, Memes, and Internet Mayhem

- [ ] **Meme stock fame spikes**: sudden viral trends that temporarily inflate turnout and backlash risk.
- [ ] **Fan chant builder**: unlockable chants that modify crowd momentum patterns.
- [ ] **Clip-of-the-night mechanic**: one standout moment can go viral and alter next-day events.
- [ ] **Comment-section roulette**: choose response tone to influencer drama for different reputation outcomes.
- [ ] **Bootleg merch wars**: deal with counterfeit sellers via legal, shady, or humorous options.

### 7.23 Venue Oddities and World Flavor

- [ ] **Absurd venue generator**: procedurally spawn strange locations (floating barge stage, abandoned mall dojo).
- [ ] **Local superstition modifiers**: city myths create odd buffs/debuffs (lucky socks, cursed encore).
- [ ] **Audience archetype nights**: themed crowds (metal dads, art-school cryptids, corporate interns).
- [ ] **Power-grid instability mode**: rolling blackouts create rhythm shifts and high-risk bonus windows.
- [ ] **Surprise guest chaos**: random cameo artists who can rescue or derail the gig.

### 7.24 Off-Stage Life Sim and Band Personality

- [ ] **Band-house chaos events**: fridge wars, noise complaints, rent panic, and bonding opportunities.
- [ ] **Pet mascot system**: adopt a mascot (lizard, pigeon, robot cat) that gives quirky passive effects.
- [ ] **Merch design mini-studio**: create ridiculous shirt slogans with risk of PR disaster.
- [ ] **Sleep-deprived interview mode**: press interactions where truthfulness, sarcasm, or nonsense have consequences.
- [ ] **Tour documentary crew**: optional film crew captures your choices and affects fame/controversy arcs.

## 8) Integration Best Practices

### 8.1 Module Contract Enforcement

- [ ] **Declare explicit public APIs per module**: mark internal helpers with a naming convention or barrel re-export pattern so callers never bind to implementation details directly.
  - *Best practice*: prefix truly internal functions with `_` and enforce via ESLint `no-underscore-dangle` (allow-pattern) so leakage shows up as a lint error, not a runtime surprise.
  - *Pitfall*: TypeScript `export` alone does not mean "public API" — re-exporting from a barrel is the contract; exporting from the file is just visibility.
- [ ] **Co-locate integration contracts as TypeScript interface files**: `src/contracts/` holding the shape that `arrivalUtils`, `eventEngine`, and `economyEngine` promise to callers, separate from implementation.
  - *Best practice*: keep contracts in a dependency-free sub-package so any consumer (tests, mocks, alternative implementations) can import the type without pulling in the full module graph.
  - *Pattern*: `interface IEventEngine { resolve(event: GameEvent, state: GameState): EventResolution }` — the module implements the interface; callers depend only on the interface.
- [ ] **Enforce barrel-only imports via ESLint `no-restricted-imports`**: prevent cross-module deep imports (`../eventEngine/internalHelper`) that bypass the declared boundary.
  - *Best practice*: add the rule with a `patterns` block per domain folder (`src/eventEngine/**` forbidden except `src/eventEngine/index.ts`); run it as a CI-blocking step separate from the regular lint pass so the signal is unambiguous.
  - *Pitfall*: IDE auto-import silently adds deep paths; the lint rule must run on save (via `eslint --fix` watch mode) to catch them before commit.
- [ ] **Add contract violation tests**: lightweight tests that `import` only the public barrel and assert missing exports are `undefined`, protecting against accidental removals.
  - *Best practice*: use a `describe('public surface')` block per module listing every intended export by name; the test fails immediately when a rename or deletion breaks a caller's assumptions.
  - *Pattern*: combine with TypeScript `satisfies` to assert the export matches the declared interface at compile time, not just at runtime.
- [ ] **Document breaking-change policy for each module boundary**: add a one-line `@breaking-change` JSDoc tag on any function whose signature is consumed by more than one module; changes to tagged functions must update all callers atomically.
  - *Pitfall*: gradual migrations that leave old and new signatures coexisting lead to dual-maintenance debt; prefer a single coordinated rename via `git mv` + global find-and-replace rather than aliasing.
- [ ] **Generate a module dependency graph and commit it as a CI artifact**: use `madge` or `dependency-cruiser` to render a DOT graph of inter-module edges; fail CI when new cycles appear and archive the graph so PRs can visually diff boundary changes.

### 8.2 Action Creator ↔ Reducer Integration

- [ ] **Generate action-type ↔ payload mapping at build time**: derive `ActionPayloadMap` from `actionCreators` return types so the reducer's `Extract<GameAction, …>` unions always stay in sync without manual maintenance.
  - *Best practice*: use `ReturnType<typeof actionCreators[keyof typeof actionCreators]>` as the `GameAction` union source of truth; never hand-write the union separately.
  - *Pitfall*: if `actionCreators` is split across files and composed with `Object.assign`, TypeScript may widen the union; keep all creators in a single `const actionCreators = { … }` object to preserve the narrowed `ReturnType` inference.
- [ ] **Add snapshot tests for every action creator output**: one fixture per action type asserting exact shape; any payload drift fails CI immediately.
  - *Best practice*: snapshot the serialised JSON, not the object reference, so tests catch accidental `undefined` field omissions that `toEqual` with optional fields would miss.
  - *Pattern*: `expect(JSON.stringify(createSetMoney(500))).toMatchSnapshot()` — trivial to write, catches regressions in seconds.
- [ ] **Enforce `assertNever` coverage automatically**: a type-level test file that imports the reducer and verifies the default branch receives `never` when all cases are handled.
  - *Best practice*: write a compile-time-only test file (`reducerExhaustive.typetest.ts`) that calls the reducer with a value typed as the full `GameAction` union and asserts the return is `GameState` — TypeScript will error if any case is unhandled before the `assertNever`.
  - *Pitfall*: adding a new `ActionTypes` constant without adding a reducer case only causes a compile error if `assertNever` is present; without it the new action silently falls through and returns stale state.
- [ ] **Reject unknown action types in production via telemetry stub**: replace the silent fallback with a lightweight `reportUnknownAction(type)` stub (no-op in prod, warn in dev) so integration mistakes surface in monitoring.
  - *Best practice*: gate the warning behind `process.env.NODE_ENV !== 'production'` and also behind a feature flag so it can be toggled on in a canary release without shipping console noise to all users.
- [ ] **Keep action payloads serialisable at all times**: enforce a `noFunctions` JSON-schema check on every action payload in tests — non-serialisable values break time-travel debugging, persist/restore, and replay tests.
  - *Pitfall*: passing a `Date` object, a `Set`, or a callback inside an action payload is a common source of hydration bugs; always convert to primitives before dispatching.
- [ ] **Separate command actions from event actions**: commands (`SET_MONEY`, `ADD_ITEM`) represent intent and are dispatched by UI; events (`MONEY_CHANGED`, `ITEM_ADDED`) represent facts and are dispatched by reducers/middleware — mixing the two makes the action log ambiguous and complicates replays.
  - *Pattern*: adopt a naming convention (`do*` for commands, `on*` or past-tense for events) enforced by a lint rule on `ActionTypes` key names.

### 8.3 Hook ↔ Store Integration

- [ ] **Forbid direct `dispatch` inside domain hooks**: all hooks that compute state deltas must call named action creators exclusively; raw `dispatch({ type: '…' })` is a lint error.
  - *Best practice*: create a custom `useGameDispatch` wrapper that only exposes typed action creator calls; hooks receive this wrapper, not the raw `dispatch` reference.
  - *Pitfall*: passing `dispatch` down through component props (prop-drilling) instead of using the context hook creates hidden coupling and makes action-creator enforcement impossible to verify statically.
- [ ] **Add render-free integration tests for hooks via `renderHook`**: test `useEventSystem`, `useArrivalLogic`, and `useEconomyEngine` with a real (non-mocked) store to catch selector/dispatch mismatches.
  - *Best practice*: wrap `renderHook` in a helper that provides a pre-configured store with a known initial state fixture; this eliminates per-test store boilerplate and ensures consistent baselines.
  - *Pattern*: `const { result } = renderHook(() => useEventSystem(), { wrapper: createTestStoreWrapper(initialState) })` — assert `result.current.pendingEvents` shape, then `act(()=>result.current.resolveEvent(…))` and assert store state changed correctly.
  - *Pitfall*: testing hooks with a fully mocked store (jest.fn dispatch) only tests the hook's internal logic, not whether the dispatched action actually mutates state as expected — use a real store for integration tests and mocked stores only for isolated unit tests.
- [ ] **Document and test hook tear-down contracts**: each hook's `useEffect` cleanup must be verified to not leave orphan subscriptions or in-flight state refs after unmount.
  - *Best practice*: add a `afterEach(() => { expect(leakDetector.count).toBe(0) })` assertion using a test-only subscription counter injected via the environment service.
  - *Pitfall*: `useEffect` cleanup that only clears a timeout but not an ongoing `fetch` or Tone.js transport listener will leak across test runs, causing order-dependent test failures.
- [ ] **Add `useSelector` selector identity tests**: assert that selectors for hot paths (gig state, player money, harmony) return referentially stable values when unrelated state changes, preventing cascade re-renders.
  - *Best practice*: use `reselect`'s `createSelector` for any selector that derives a new object or array; plain `state => state.player.money` is already stable, but `state => state.band.members.filter(…)` creates a new array every render.
  - *Pattern*: in tests, dispatch an unrelated action (e.g., `setLogLevel`) and assert `prevResult === nextResult` using `Object.is` to confirm the selector did not recompute.
- [ ] **Add a hook complexity budget**: hooks exceeding ~80 lines or calling more than 3 other hooks are a refactor signal; enforce via a custom ESLint rule counting `use*` call sites per hook body.
  - *Best practice*: extract multi-concern hooks into a coordinator hook that composes single-concern hooks (`useEventTrigger`, `useEventResolver`, `useEventAnalytics`) so each is independently testable.
- [ ] **Test concurrent dispatch sequences explicitly**: dispatch two actions in the same `act()` block and assert the final state reflects both, not just the last — guards against reducers that accidentally re-read stale closure state.

### 8.4 Audio Engine Integration

- [ ] **Isolate `audioEngine` behind a typed service interface**: consumers depend on `IAudioEngine`, not the concrete Tone.js class, enabling test doubles and future engine swaps without touching call sites.
  - *Best practice*: define `IAudioEngine` with only the methods that game logic actually calls (`getGigTimeMs`, `startGig`, `stopGig`, `scheduleNote`); keep Tone.js-specific APIs (transport, synth chains) hidden behind the implementation.
  - *Pattern*: provide a `NullAudioEngine` that satisfies `IAudioEngine` with no-ops and `getGigTimeMs() => 0` for use in headless tests and CI environments where `AudioContext` is unavailable.
  - *Pitfall*: injecting the concrete `audioEngine` singleton through module-level import (not via a React context or constructor parameter) makes it impossible to substitute a test double without patching the module loader.
- [ ] **Add integration test for gig timing contract**: verify that `audioEngine.getGigTimeMs()` values used in scoring windows are within acceptable drift tolerance of wall-clock time under simulated load.
  - *Best practice*: define an explicit tolerance constant (`GIG_CLOCK_DRIFT_TOLERANCE_MS = 10`) in the engine contract and assert it in tests; any consumer assuming tighter tolerance documents that assumption explicitly.
  - *Pitfall*: Tone.js transport time and `performance.now()` diverge under CPU pressure; scoring logic that assumes zero drift will produce unfair windows on low-end devices — always apply the tolerance buffer.
- [ ] **Guard all Tone.js `start`/`stop` calls with lifecycle assertions**: assert that `AudioContext` is in `running` state before any playback attempt; log a structured warning otherwise rather than silently failing.
  - *Best practice*: wrap every Tone.js call in a `withAudioContext(fn)` helper that checks `Tone.context.state`, resumes if `suspended`, and rejects gracefully if `closed` — keeps call sites clean and the policy centralised.
  - *Pitfall*: calling `Tone.Transport.start()` on a `closed` context throws synchronously and can crash the React render cycle if uncaught; always wrap in a try/catch at the engine boundary.
- [ ] **Add cross-module event ordering test**: confirm that `setlistCompleted` fires before `isNearTrackEnd` is consulted so end-detection logic is never inverted by async ordering.
  - *Best practice*: write the test as an explicit sequence assertion using a recorded event log: `['noteScheduled', 'setlistCompleted', 'isNearTrackEnd:true']` — assert the log order matches exactly, not just membership.
  - *Pattern*: inject an event recorder into the audio engine during tests; subscribe to all emitted events and snapshot the sequence after a simulated full-setlist playback.
- [ ] **Add a latency budget test for note scheduling**: assert that `scheduleNote(time)` is called at least `NOTE_LOOKAHEAD_MS` ahead of the target transport time under normal conditions; a violation means notes are being scheduled too late and will be dropped by the browser.
  - *Pitfall*: React state updates inside audio callbacks introduce unpredictable scheduling delays; audio callback paths must be free of React dispatch calls — dispatch only from `useEffect` reactions to audio state changes.
- [ ] **Version the audio session state separately from game state**: `audioEngine` internal state (transport position, loaded tracks) is transient and must not be serialised into the save file; add a test that restores a save and asserts the engine starts in a clean initial state regardless of the previous session.

### 8.5 State Persistence Integration

- [ ] **Version the persisted state schema explicitly**: embed `schemaVersion` in saved state; add a migration chain (`migrations/v1→v2.ts`) invoked on load before the reducer sees the data.
  - *Best practice*: model migrations as a pure function array `migrations: Array<(old: unknown) => unknown>` indexed by version number; apply `migrations.slice(savedVersion)` sequentially on load — this is idempotent, testable in isolation, and trivially extensible.
  - *Pitfall*: running the reducer's initial state merge instead of explicit migrations silently drops new required fields that weren't in the old save, or carries over fields that were intentionally removed.
- [ ] **Add round-trip serialization tests**: `serialize(deserialize(serialize(state))) === serialize(state)` for all game state slices.
  - *Best practice*: test every state slice independently (player, band, map, flags) rather than the full `GameState` object; smaller fixtures make failures easier to diagnose and avoid masking bugs in a large snapshot diff.
  - *Pitfall*: `JSON.stringify` key ordering is not guaranteed across environments; always compare parsed objects with `expect(parsed).toStrictEqual(original)` rather than comparing raw strings.
- [ ] **Test partial/corrupt save recovery**: simulate truncated JSON, missing top-level keys, and hostile `__proto__` injections; assert the loader returns a valid initial state without throwing.
  - *Best practice*: use `Object.hasOwn(parsed, '__proto__')` and `Object.hasOwn(parsed, 'constructor')` checks at the deserialisation boundary and strip any such keys before merging into state.
  - *Pattern*: maintain a `LOAD_FUZZ_CASES` fixture array covering `null`, `undefined`, `[]`, `{ __proto__: { isAdmin: true } }`, and a valid save with an extra unknown key; run the loader against all cases in a single parameterised test.
- [ ] **Encrypt or sign save data checksum**: prevent trivial client-side cheating while keeping the format debuggable; log a warning on checksum mismatch and fall back to defaults.
  - *Best practice*: use `SubtleCrypto.digest('SHA-256', encoded)` for a deterministic, dependency-free checksum; store it alongside the payload as `{ data: '…', checksum: '…' }` so tools can inspect the raw data without needing to know the signing key.
  - *Pitfall*: HMAC-based signing requires a secret key, which in a browser context is trivially extractable — prefer a tamper-evidence approach (checksum mismatch → warn and reset) over a security claim.
- [ ] **Define and enforce a maximum save file size**: add a byte-length assertion in the serialiser that warns (dev) or silently trims old run history (prod) when the payload exceeds a threshold — prevents `localStorage` quota errors mid-session.
  - *Best practice*: separate mutable game state from append-only run history; write history to IndexedDB (via the `StorageAdapter` abstraction planned in §8.10) and keep `localStorage` for just the active session snapshot — `usePersistence.ts` currently writes both to `localStorage` directly, which is the gap to close.
- [ ] **Test migration failures explicitly**: if a migration throws, the loader must catch it, log the version mismatch and error, and return `createInitialState()` — a corrupt migration must never crash the app or render a blank screen.

### 8.6 Map Generation ↔ Game Engine Integration

- [ ] **Validate generated map against a JSON schema before use**: run a lightweight schema check after `MapGenerator` returns; reject and retry rather than propagating a malformed map silently.
  - *Best practice*: define the schema as a TypeScript type and derive a runtime validator with `zod` or a hand-written guard; the validator is the canonical definition — do not maintain a separate JSON schema file that can drift.
  - *Pattern*: `const result = MapSchema.safeParse(raw); if (!result.success) { logMapError(result.error, seed); return fallbackMap(); }` — keep the guard at the generation boundary so downstream code can assume a valid map.
- [ ] **Add contract test for `MapNode` ↔ travel system**: every node type that exists in the generator must be handled by `handleNodeArrival`; an exhaustiveness test asserts no node type falls through.
  - *Best practice*: derive the exhaustiveness test from the same `NodeType` enum that the generator uses — if a new type is added to the enum, the test fails unless a handler is also added, closing the feedback loop at compile time.
  - *Pitfall*: handling unknown node types with a default `OVERWORLD` redirect hides integration gaps; the default branch should log a structured error and be tested explicitly with an unknown type fixture.
- [ ] **Seed the PRNG from a deterministic run ID**: expose `runSeed` in persisted state so any session can be reproduced exactly from save data for bug reports.
  - *Best practice*: use a splittable PRNG (e.g., Mulberry32 or xoshiro128**) that can be forked for independent subsystems (map gen, event selection, economy variance) without one subsystem consuming another's entropy.
  - *Pattern*: `const [mapSeed, eventSeed] = splitSeed(runSeed)` — each subsystem gets its own PRNG stream, so adding new random calls to the event system does not retroactively change map layout for existing seeds.
  - *Pitfall*: `Math.random()` is not seedable and its sequence is implementation-defined; any call to `Math.random()` in a seeded path will break reproducibility silently.
- [ ] **Add map-generation fuzz harness**: run the generator with 1 000 random seeds in CI and assert structural invariants (connected graph, start node reachable, no duplicate IDs).
  - *Best practice*: run the fuzz harness in a separate CI job with a fixed seed for the seed-generator itself so the 1 000 seeds are reproducible across runs — otherwise a flaky structural bug only surfaces on some CI runs.
  - *Pitfall*: asserting only "no exceptions thrown" in the fuzz harness is insufficient; always assert semantic invariants (minimum node count, at least one gig node, start node has outgoing edges) to catch silent generation degradation.
- [ ] **Test the incremental fallback map for completeness**: the safe template map used after generation failures must itself be validated against the same schema and contract tests — a broken fallback that crashes on arrival is worse than a generation failure.
- [ ] **Add a map-render integration test**: take a generated map with a known seed, serialise the node graph to an adjacency-list fixture, and assert it matches a committed golden snapshot — catches generator logic regressions that don't violate structural invariants but do change the layout.

### 8.7 Event System ↔ Quest/Flag Integration

- [ ] **Assert no orphaned flag writes**: lint or test that every `flags.addQuest` / `flags.set` written by event resolvers has a corresponding reader somewhere in the codebase.
  - *Best practice*: maintain a `flags.registry.ts` that exports a `const FLAGS = { QUEST_X_STARTED: 'quest_x_started', … } as const` object; all writers and readers reference `FLAGS.QUEST_X_STARTED` rather than string literals — any orphaned key triggers a TypeScript unused-variable warning.
  - *Pattern*: write a test that diffs `Object.values(FLAGS)` against all flag reads found by `grep`; any value in `FLAGS` with no read is reported as an orphan.
  - *Pitfall*: dynamic flag keys (`flags.set(\`quest_${id}_complete\`\)`) escape static analysis entirely — prefer a typed key union over template literals.
- [ ] **Type quest payload strictly**: `QuestPayload` must be a discriminated union; unknown shapes must be caught at the resolver boundary and logged, not silently ignored.
  - *Best practice*: use `zod` or a hand-written `parseQuestPayload(raw: unknown): QuestPayload | ParseError` guard at every point where quest data crosses a trust boundary (load from storage, receive from event delta).
  - *Pitfall*: widening `QuestPayload` to `Record<string, unknown>` to accommodate future fields causes the discriminated union to stop narrowing correctly; add optional fields to each variant explicitly instead.
- [ ] **Add integration test for multi-step event chains**: trigger event A → assert flag set → trigger event B that depends on that flag → assert final state delta.
  - *Best practice*: write the chain test as a table of `[eventId, expectedFlagsBefore, expectedFlagsAfter, expectedStateDelta]` rows so adding a new chain step is one row, not a new test file.
  - *Pattern*: use `vi.useFakeTimers()` to collapse real-time cooldowns in the chain test — the test then runs deterministically without sleeps and remains fast enough for the standard gate.
  - *Pitfall*: testing event chains only via UI simulation (clicking buttons) makes the test brittle and slow; test the pure domain service directly and add a single thin e2e smoke test that covers the UI path.
- [ ] **Guard against event resolver re-entry**: if the same event fires while its async side effects are in flight, queue rather than re-execute; add a test that verifies no duplicate dispatches.
  - *Best practice*: implement the re-entry guard as a `Set<string>` of in-flight event IDs rather than a boolean lock; a Set allows multiple *different* events to be resolved concurrently while still blocking the same event from overlapping.
  - *Pitfall*: clearing the in-flight Set in a `finally` block is correct — but if the async path throws and the error is swallowed upstream, the Set may never be cleared, permanently blocking the event; always pair `finally` with a structured error log.
- [ ] **Add a flag-write audit log in dev mode**: every `flags.set` call emits a structured entry `{ key, value, eventId, timestamp }` to a dev-only ring buffer; expose this buffer in the debug overlay for QA investigation of unexpected flag states.
- [ ] **Enforce maximum flag count per event resolution**: cap the number of flags a single event can write in one resolution (e.g., `MAX_FLAGS_PER_RESOLUTION = 10`); log a warning and truncate if exceeded — prevents runaway event chains from bloating state.

### 8.8 Economy Engine ↔ UI Integration

- [ ] **Expose a typed `EconomyBreakdown` DTO** from `economyEngine` instead of raw number deltas so UI components never manually re-derive line items from raw values.
  - *Best practice*: shape the DTO as `{ lineItems: Array<{ labelKey: string; delta: number; sign: '+' | '-' | '=' }>, total: number }` — the UI renders it without arithmetic; all arithmetic stays in the engine.
  - *Pitfall*: if the UI computes `total = lineItems.reduce(…)` independently, rounding differences between the engine's running total and the UI's sum produce display inconsistencies; always include the authoritative `total` in the DTO.
- [ ] **Add visual regression snapshots for breakdown panels**: capture the economy breakdown UI with known fixture data; fail CI on layout drift.
  - *Best practice*: use a deterministic fixture that covers all sign variants (`+`, `-`, `=`), a zero-value line, and a maximum-length label string — this catches layout overflow bugs that only appear at extremes.
  - *Pattern*: run Playwright screenshots in a Docker container with a pinned font and GPU settings so snapshots are pixel-stable across different CI runner hardware.
- [ ] **Test currency formatting under locale change**: assert formatted money strings are stable across `en`, `de`, and other supported locales without altering raw values.
  - *Best practice*: use `Intl.NumberFormat` with explicit `currencyDisplay: 'symbol'` and `minimumFractionDigits: 0` options rather than relying on environment defaults; hardcode these options at the formatting boundary so locale changes affect separators/symbol position but not precision.
  - *Pitfall*: `Intl.NumberFormat` output varies between Node versions and browser engines for the same locale string; pin the locale test assertions to a known Node version in CI to avoid flakiness.
- [ ] **Ensure all breakdown labels have i18n keys**: a lint rule or test that rejects any `EconomyBreakdown` label literal not present in both `en/` and `de/` locale files.
  - *Best practice*: store label keys as a `const BREAKDOWN_LABELS = { TICKET_REVENUE: 'economy.breakdown.ticketRevenue', … } as const` enum; the i18n consistency checker then only needs to verify `Object.values(BREAKDOWN_LABELS)` against locale files, rather than scanning all string literals.
  - *Pattern*: run the i18n consistency check in a pre-commit hook (fast, <1 s) so missing keys are caught before they reach CI.
- [ ] **Add a contract test asserting `economyEngine` output is deterministic**: given the same input state and PRNG seed, `calculateGigEconomy` must return byte-identical output on every call — prevents hidden statefulness bugs in the engine.
  - *Best practice*: call the function twice in the same test with the same arguments and assert `JSON.stringify(result1) === JSON.stringify(result2)`; any internal `Date.now()` or `Math.random()` call will break this immediately.
- [ ] **Add a boundary test for extreme economy values**: verify the engine handles `money = 0`, `money = Number.MAX_SAFE_INTEGER`, `harmony = 1`, `harmony = 100`, and `attendance = 0` without NaN, Infinity, or negative-zero in the output.
  - *Pitfall*: `0 / 0` and `x / 0` produce `NaN` and `Infinity` silently in JavaScript; any division in the economy engine needs an explicit denominator guard (`denom > 0 ? … : 0`).

### 8.9 CI / Integration Gate Hardening

- [ ] **Separate unit, integration, and e2e test jobs**: unit tests should be fast (<30 s); integration tests run against a real store + mocked I/O; e2e (Playwright/golden path) run last gating merge.
  - *Best practice*: label test files with a naming convention (`*.unit.test.ts`, `*.integration.test.ts`, `*.e2e.test.ts`) and configure `vitest.config` workspaces to pick them up with separate `include` globs — one config file, three profiles, zero duplication.
  - *Pitfall*: mixing unit and integration tests in the same job means a single slow integration test can block all unit-test feedback; keep jobs independent so a failing e2e test doesn't prevent a fast unit-test green signal.
- [ ] **Add a module-boundary check step in CI**: run the `no-restricted-imports` ESLint rule in a dedicated CI step so boundary violations block PRs explicitly.
  - *Best practice*: run this step before type-checking and tests so boundary violations are the first thing reported — a developer sees the highest-signal error first without waiting for the full test suite.
  - *Pattern*: `eslint --rule '{"no-restricted-imports": ["error", …]}' --max-warnings 0 src/` as a named CI step with a clear label like `Check module boundaries`.
- [ ] **Pin external test fixture files in version control**: avoid network fetches in tests; any fixture that calls `fetch` must be replaced with a committed JSON stub.
  - *Best practice*: use `msw` (Mock Service Worker) for integration tests that exercise fetch-dependent hooks; `msw` intercepts at the network layer without patching globals, making tests portable across Node and browser environments.
  - *Pitfall*: `vi.spyOn(global, 'fetch')` patches the global and can bleed into other tests if not restored; prefer `msw` server setup/teardown in `beforeAll`/`afterAll`.
- [ ] **Add a schema-drift check job**: compare TypeScript-derived JSON schemas for `GameState` and `MapNode` against committed golden files; fail CI on any unreviewed change.
  - *Best practice*: generate schemas with `ts-json-schema-generator` as part of the build and diff them against the committed golden with `git diff --exit-code`; the author of a schema-changing PR is forced to update the golden explicitly, creating a visible audit trail.
  - *Pitfall*: generating schemas only locally (developer runs a script manually) means the golden file frequently drifts in; the generation must be part of CI so the check is authoritative.
- [ ] **Enforce test coverage thresholds per integration module**: set per-file branch coverage floors in `vitest.config` for `economyEngine`, `eventEngine`, and `arrivalUtils`; block merges that regress coverage.
  - *Best practice*: start thresholds conservatively (e.g., 70% branch coverage) and ratchet them upward by 5% per sprint as coverage is added — setting them too high immediately causes devs to write meaningless coverage-padding tests.
  - *Pitfall*: line coverage at 100% with zero branch coverage is a false signal; always require both `branches` and `functions` thresholds, not just `lines`.
- [ ] **Add a test-duration budget check**: fail CI if any single test exceeds 5 seconds; tests that hit the budget must be moved to the integration or e2e tier or refactored to use fakes — prevents slow tests from silently creeping into the fast unit tier.
- [ ] **Add a dead-code elimination check**: run `ts-prune` or `knip` in CI to detect exported symbols with no consumers; unreferenced exports signal incomplete integration (the caller was removed but the implementation wasn't).

### 8.10 Third-Party / External Integration Boundaries

- [ ] **Wrap all `localStorage` / `sessionStorage` access in a single `StorageAdapter` interface**: allows swap to IndexedDB or in-memory stub in tests without touching call sites.
  - *Best practice*: define `IStorageAdapter { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void; clear(): void }` and provide three implementations: `LocalStorageAdapter` (prod), `InMemoryAdapter` (tests), `NoopAdapter` (private/incognito fallback).
  - *Pattern*: inject `IStorageAdapter` via React context so components and hooks never import `localStorage` directly; the context default is `LocalStorageAdapter` in browser and `InMemoryAdapter` in test environments.
  - *Pitfall*: calling `localStorage.setItem` in a module-level side effect (outside a function) means the adapter cannot be substituted before the call happens; always access storage lazily inside functions.
- [ ] **Centralize `window`/`document` access behind an environment service**: enables Node-safe test execution and future SSR compatibility without scattered `typeof window` guards.
  - *Best practice*: create `src/platform/environment.ts` exporting `getWindow(): Window | null` and `getDocument(): Document | null`; test environments return `null` (or a jsdom stub); production returns the real globals.
  - *Pitfall*: `typeof window !== 'undefined'` guards scattered across 30 files are impossible to audit and easy to miss — centralisation makes the guard a single policy decision.
- [ ] **Mock `Date.now()` at the integration boundary**: inject a clock service so travel timers, event cooldowns, and daily caps are deterministic in tests.
  - *Best practice*: define `IClock { now(): number; today(): string }` and inject it via context; use `vi.useFakeTimers()` only in Vitest tests, `FakeClock` implementations in node:test suites — do not mix the two approaches in the same codebase.
  - *Pattern*: `FakeClock` starts at a fixed epoch (`2026-01-01T00:00:00Z`) and advances only when `clock.advance(ms)` is called; this makes timer-dependent logic fully controllable without relying on `setInterval` mock internals.
  - *Pitfall*: `new Date()` and `Date.now()` are separate APIs — mocking one does not mock the other in all environments; always route both through the `IClock` interface.
- [ ] **Document and test browser API fallbacks explicitly**: Web Audio, `localStorage`, `ResizeObserver`; each must have a graceful-degradation path with a test that simulates the API being absent.
  - *Best practice*: maintain a `BROWSER_API_REQUIREMENTS` record listing each API, its polyfill strategy, and its fallback behaviour (`localStorage` → `InMemoryAdapter`; `ResizeObserver` → no-op; `AudioContext` → `NullAudioEngine`); link each entry to the implementation and test that covers it.
  - *Pattern*: write a test that `delete`s `window.ResizeObserver` before mounting a component and asserts the component renders without throwing and shows a graceful placeholder rather than a blank panel.
- [ ] **Add a dependency freshness check for pinned third-party packages**: run a weekly CI job that reports which pinned packages have patch/minor updates available (not as a blocker, but as a visibility signal) — prevents security-relevant packages from going unnoticed for months.
  - *Best practice*: use `pnpm outdated --json` piped to a Slack/GitHub notification script; never auto-upgrade, only notify — upgrading pinned dependencies requires a deliberate discussion as per `AGENTS.md`.
- [ ] **Audit all `postMessage` / `BroadcastChannel` usage for origin validation**: if any integration with iframes or service workers uses `postMessage`, every `message` event listener must validate `event.origin` before processing the payload — a missing check is a cross-origin injection vector.
  - *Pitfall*: `event.source === window` does not guarantee the same origin in all browser configurations; always check `event.origin` explicitly against an allowlist.
- [ ] **Test the `StorageAdapter` fallback path for private browsing mode**: `localStorage.setItem` throws a `DOMException` in some browsers when storage is full or in strict private mode; the adapter's `set` method must catch this exception and fall back to the in-memory store without crashing the caller.

## 9) Technical Debt Tracking

- [ ] **Tag all high-risk paths with structured TODO IDs** (`TODO[STATE-###]`, `TODO[FLOW-###]`) and link to issues.
- [ ] **Add “design intent” comments for non-obvious mechanics** (e.g., cancellation math, capped penalties) to avoid accidental rebalance.
- [ ] **Document cross-module contracts** (`arrivalUtils` ↔ `useArrivalLogic`, `eventEngine` ↔ `useEventSystem`) in a short architecture note.
