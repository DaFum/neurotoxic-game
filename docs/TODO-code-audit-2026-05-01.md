# TODO Audit — Code, Features, Logic, and Gameflow (2026-05-01)

This note collects concrete improvement opportunities found during a focused read of state flow, event handling, travel/arrival, and economy systems.

## 1) State + Reducer Reliability

- [ ] **Add exhaustive action safety in `gameReducer`**: replace the silent fallback (`return state`) with telemetry (dev warn/counter) for unknown actions so integration mistakes are visible early.
- [ ] **Strengthen `reducerMap` typing**: enforce a typed mapping from `ActionTypes` to exact handler signatures so payload drift is caught at compile time.
- [ ] **Add reducer-level invariants test suite**: validate post-action guarantees (money non-negative, harmony bounds, no invalid scene transitions).

## 2) Event System Robustness

- [ ] **Move event resolution into a pure domain service**: `useEventSystem` currently computes preview state and dispatches side effects in one path; extract a pure resolver returning `{actions, sideEffects}` to simplify testing and rollback safety.
- [ ] **Create deterministic replay tests for event deltas**: snapshot before/after event choices (including `flags.addQuest` + unlocks) to prevent regressions.
- [ ] **Add per-category daily caps**: current `eventsTriggeredToday >= 2` is global; consider category-based throttles to avoid starving rare event chains.
- [ ] **Add structured event analytics hooks**: count trigger attempts, trigger success rate, and skipped reasons (scene lock, cap reached, no match).

## 3) Travel + Arrival Gameflow

- [ ] **Make arrival idempotency explicit**: `useArrivalLogic` uses one-shot `isHandlingRef`; add a documented reset trigger (e.g., on node change or scene change) to avoid edge lockouts in long sessions.
- [ ] **Unify arrival routing contract**: move final scene routing responsibility fully into `handleNodeArrival` so hooks don’t split “business routing” vs “fallback routing.”
- [ ] **Expose cancellation odds UX**: low-harmony gig cancellation currently feels opaque; surface pre-travel warning text and % risk in UI.
- [ ] **Add property tests for travel outcomes**: verify rest-stop recovery and cancellation branches always respect clamp functions and never overshoot bounds.

## 4) Economy Balance + Explainability

- [ ] **Externalize tuning constants to a balance config**: `economyEngine` embeds many constants; move to one versioned tuning object for easier A/B balancing.
- [ ] **Add economy breakdown trace mode**: emit per-step contribution details (attendance, penalties, modifiers, caps) for debugging “why this net changed.”
- [ ] **Add anti-swing smoothing experiment**: prototype soft floor/ceiling around early-game losses/wins to reduce runaway failure spirals.
- [ ] **Add localization-ready labels for every breakdown line item**: ensures all gain/loss sources map to user-visible explanations.

## 5) Map Generation + Recovery UX

- [ ] **Introduce stable seed strategy**: `new MapGenerator(Date.now())` prevents reproducible bug reports; consider run seed + optional debug override.
- [ ] **Add incremental fallback for generation failures**: instead of returning to menu after retries, try a known-safe template map for graceful recovery.
- [ ] **Log map failure signatures**: include generation params and failed phase for easier root-cause analysis.

## 6) Testing Gaps to Prioritize

- [ ] **Golden-path simulation for day loop**: travel → arrival → event (optional) → gig start/cancel → postgig economy assertions.
- [ ] **Fuzz tests for hostile payloads**: especially event delta flags and quest payload shape coercions.
- [ ] **Performance regression check**: benchmark expensive calculations in `economyEngine` and event processing under long campaigns.

## 7) Feature Opportunities (Gameplay) — Comprehensive Backlog

### 7.1 Strategic Layer (Overworld / Tour Planning)

- [ ] **Band morale “forecast” panel**: show likely harmony/stamina impact before committing to destination.
- [ ] **Regional heatmap overlay**: visualize city-level demand, controversy risk, and prior-show fatigue to guide routing decisions.
- [ ] **Tour leg planner**: allow queuing 2–3 destinations with projected costs, downtime, and expected payout variance.
- [ ] **Venue relationship system**: repeated good/bad outcomes change venue trust, booking quality, and contract terms.
- [ ] **Travel budget assistant**: pre-travel prompt calculating guaranteed upkeep + fuel + repair risk window.

### 7.2 Pre-Gig Decisions

- [ ] **Dynamic promoter negotiation pre-gig**: short decision step affecting ticket price, turnout risk, and backlash odds.
- [ ] **Setlist risk/reward presets**: “safe”, “balanced”, “chaotic” templates changing hype curve and miss tolerance.
- [ ] **Soundcheck tradeoff events**: spend extra time/money for stability buffs vs less crowd pre-hype.
- [ ] **Local scene intel cards**: city-specific traits (genre bias, attention span, bar spend profile) before confirming.
- [ ] **Crew assignment choices**: assign members to prep tasks for temporary gig modifiers with opportunity costs.

### 7.3 Travel and Interstitial Gameplay

- [ ] **Travel incident mini-choices**: lightweight risk/reward forks during travel to increase strategic depth between gigs.
- [ ] **Road condition system**: weather/road states influencing travel minigame difficulty and van wear probability.
- [ ] **Supply stop encounters**: optional shops/black-market stalls with timed offers and reputation consequences.
- [ ] **Band banter outcomes**: inter-member dialog choices that can heal or worsen relationships.
- [ ] **Emergency detour contracts**: last-minute side gigs with high payout but high stress and cancellation risk.

### 7.4 Performance / Gig Moment-to-Moment

- [ ] **Adaptive crowd behavior**: crowd energy reacts to streaks, misses, and stage presence in near real time.
- [ ] **Encore decision mechanic**: optional overtime performance with extra payout and extra fatigue/gear penalties.
- [ ] **Heckler interaction windows**: player choices to ignore/counter hecklers, influencing hype and controversy.
- [ ] **Spotlight moments per band member**: short bonus windows tied to member traits and current mood/stamina.
- [ ] **Difficulty assist toggles**: optional aid modifiers that trade leaderboard scoring for accessibility.

### 7.5 Post-Gig, Progression, and Meta

- [ ] **Post-gig coaching prompts**: contextual suggestions from last performance misses/tempo stability to guide player improvement.
- [ ] **Performance debrief timeline**: chronological replay of key moments that explains where net gains/losses happened.
- [ ] **Fan segment progression**: track audience cohorts (casual, loyal, zealots) with different growth and churn rules.
- [ ] **Narrative consequence chains**: outcomes unlock follow-up storylets 1–3 days later for stronger campaign continuity.
- [ ] **Season goals and milestone rewards**: medium-term objectives that stabilize progression pacing.

### 7.6 Economy and Management Depth

- [ ] **Merch strategy screen**: choose inventory mix and pricing before shows with demand uncertainty.
- [ ] **Staff hiring system**: manager/driver/tech roles granting passive bonuses with weekly salary burden.
- [ ] **Insurance and warranty choices**: reduce catastrophic losses at recurring cost.
- [ ] **Sponsorship contract negotiation**: choose values-aligned or high-paying sponsors with social tradeoffs.
- [ ] **Debt and financing tools**: emergency loans with escalating pressure events if repayments slip.

### 7.7 Social, Reputation, and World Reactivity

- [ ] **Faction reputation tracks**: different subcultures react uniquely to choices, changing event pools and perks.
- [ ] **Media cycle simulation**: short news bursts amplify or suppress controversy effects for several days.
- [ ] **Rival band ecosystem**: AI bands compete for slots, trigger drama events, and influence demand.
- [ ] **Community action arcs**: charity/protest benefit gigs with delayed reputation and economy outcomes.
- [ ] **Dynamic city state changes**: cities evolve based on repeated player behavior (supportive, hostile, saturated).

### 7.8 Accessibility, UX, and Onboarding

- [ ] **Run advisor mode**: optional guidance highlighting likely bad decisions before irreversible confirmations.
- [ ] **Glossary with live examples**: explain core mechanics (harmony, hype, zealotry) using current run values.
- [ ] **Failure recovery nudges**: contextual “comeback plan” suggestions after consecutive poor outcomes.
- [ ] **Input timing calibration utility**: user-tunable timing offset flow for rhythm accuracy.
- [ ] **Replayable tutorials by subsystem**: short practice modules for travel, gig, economy, and events.

### 7.9 Live-Ops and Long-Term Replayability

- [ ] **Weekly challenge seeds**: fixed map/event seeds with leaderboard categories.
- [ ] **Mutator runs**: opt-in rulesets (fragile gear, chaotic crowds, strict budgets) for variety.
- [ ] **Legacy unlock track**: meta progression across runs unlocking cosmetic + strategic options.
- [ ] **Community event packs**: rotating event bundles to refresh narrative variety.
- [ ] **Endgame prestige loop**: retire successful runs for account-wide modifiers and harder remixed tours.

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
  - *Best practice*: separate mutable game state from append-only run history; write history to IndexedDB via the `StorageAdapter` and keep `localStorage` for just the active session snapshot.
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
