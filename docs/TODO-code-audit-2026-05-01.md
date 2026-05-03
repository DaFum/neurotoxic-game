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
- [ ] **Co-locate integration contracts as TypeScript interface files**: `src/contracts/` holding the shape that `arrivalUtils`, `eventEngine`, and `economyEngine` promise to callers, separate from implementation.
- [ ] **Enforce barrel-only imports via ESLint `no-restricted-imports`**: prevent cross-module deep imports (`../eventEngine/internalHelper`) that bypass the declared boundary.
- [ ] **Add contract violation tests**: lightweight tests that `import` only the public barrel and assert missing exports are `undefined`, protecting against accidental removals.

### 8.2 Action Creator ↔ Reducer Integration

- [ ] **Generate action-type ↔ payload mapping at build time**: derive `ActionPayloadMap` from `actionCreators` return types so the reducer's `Extract<GameAction, …>` unions always stay in sync without manual maintenance.
- [ ] **Add snapshot tests for every action creator output**: one fixture per action type asserting exact shape; any payload drift fails CI immediately.
- [ ] **Enforce `assertNever` coverage automatically**: a type-level test file that imports the reducer and verifies the default branch receives `never` when all cases are handled.
- [ ] **Reject unknown action types in production via telemetry stub**: replace the silent fallback with a lightweight `reportUnknownAction(type)` stub (no-op in prod, warn in dev) so integration mistakes surface in monitoring.

### 8.3 Hook ↔ Store Integration

- [ ] **Forbid direct `dispatch` inside domain hooks**: all hooks that compute state deltas must call named action creators exclusively; raw `dispatch({ type: '…' })` is a lint error.
- [ ] **Add render-free integration tests for hooks via `renderHook`**: test `useEventSystem`, `useArrivalLogic`, and `useEconomyEngine` with a real (non-mocked) store to catch selector/dispatch mismatches.
- [ ] **Document and test hook tear-down contracts**: each hook's `useEffect` cleanup must be verified to not leave orphan subscriptions or in-flight state refs after unmount.
- [ ] **Add `useSelector` selector identity tests**: assert that selectors for hot paths (gig state, player money, harmony) return referentially stable values when unrelated state changes, preventing cascade re-renders.

### 8.4 Audio Engine Integration

- [ ] **Isolate `audioEngine` behind a typed service interface**: consumers depend on `IAudioEngine`, not the concrete Tone.js class, enabling test doubles and future engine swaps without touching call sites.
- [ ] **Add integration test for gig timing contract**: verify that `audioEngine.getGigTimeMs()` values used in scoring windows are within acceptable drift tolerance of wall-clock time under simulated load.
- [ ] **Guard all Tone.js `start`/`stop` calls with lifecycle assertions**: assert that `AudioContext` is in `running` state before any playback attempt; log a structured warning otherwise rather than silently failing.
- [ ] **Add cross-module event ordering test**: confirm that `setlistCompleted` fires before `isNearTrackEnd` is consulted so end-detection logic is never inverted by async ordering.

### 8.5 State Persistence Integration

- [ ] **Version the persisted state schema explicitly**: embed `schemaVersion` in saved state; add a migration chain (`migrations/v1→v2.ts`) invoked on load before the reducer sees the data.
- [ ] **Add round-trip serialization tests**: `serialize(deserialize(serialize(state))) === serialize(state)` for all game state slices.
- [ ] **Test partial/corrupt save recovery**: simulate truncated JSON, missing top-level keys, and hostile `__proto__` injections; assert the loader returns a valid initial state without throwing.
- [ ] **Encrypt or sign save data checksum**: prevent trivial client-side cheating while keeping the format debuggable; log a warning on checksum mismatch and fall back to defaults.

### 8.6 Map Generation ↔ Game Engine Integration

- [ ] **Validate generated map against a JSON schema before use**: run a lightweight schema check after `MapGenerator` returns; reject and retry rather than propagating a malformed map silently.
- [ ] **Add contract test for `MapNode` ↔ travel system**: every node type that exists in the generator must be handled by `handleNodeArrival`; an exhaustiveness test asserts no node type falls through.
- [ ] **Seed the PRNG from a deterministic run ID**: expose `runSeed` in persisted state so any session can be reproduced exactly from save data for bug reports.
- [ ] **Add map-generation fuzz harness**: run the generator with 1 000 random seeds in CI and assert structural invariants (connected graph, start node reachable, no duplicate IDs).

### 8.7 Event System ↔ Quest/Flag Integration

- [ ] **Assert no orphaned flag writes**: lint or test that every `flags.addQuest` / `flags.set` written by event resolvers has a corresponding reader somewhere in the codebase.
- [ ] **Type quest payload strictly**: `QuestPayload` must be a discriminated union; unknown shapes must be caught at the resolver boundary and logged, not silently ignored.
- [ ] **Add integration test for multi-step event chains**: trigger event A → assert flag set → trigger event B that depends on that flag → assert final state delta.
- [ ] **Guard against event resolver re-entry**: if the same event fires while its async side effects are in flight, queue rather than re-execute; add a test that verifies no duplicate dispatches.

### 8.8 Economy Engine ↔ UI Integration

- [ ] **Expose a typed `EconomyBreakdown` DTO** from `economyEngine` instead of raw number deltas so UI components never manually re-derive line items from raw values.
- [ ] **Add visual regression snapshots for breakdown panels**: capture the economy breakdown UI with known fixture data; fail CI on layout drift.
- [ ] **Test currency formatting under locale change**: assert formatted money strings are stable across `en`, `de`, and other supported locales without altering raw values.
- [ ] **Ensure all breakdown labels have i18n keys**: a lint rule or test that rejects any `EconomyBreakdown` label literal not present in both `en/` and `de/` locale files.

### 8.9 CI / Integration Gate Hardening

- [ ] **Separate unit, integration, and e2e test jobs**: unit tests should be fast (<30 s); integration tests run against a real store + mocked I/O; e2e (Playwright/golden path) run last gating merge.
- [ ] **Add a module-boundary check step in CI**: run the `no-restricted-imports` ESLint rule in a dedicated CI step so boundary violations block PRs explicitly.
- [ ] **Pin external test fixture files in version control**: avoid network fetches in tests; any fixture that calls `fetch` must be replaced with a committed JSON stub.
- [ ] **Add a schema-drift check job**: compare TypeScript-derived JSON schemas for `GameState` and `MapNode` against committed golden files; fail CI on any unreviewed change.
- [ ] **Enforce test coverage thresholds per integration module**: set per-file branch coverage floors in `vitest.config` for `economyEngine`, `eventEngine`, and `arrivalUtils`; block merges that regress coverage.

### 8.10 Third-Party / External Integration Boundaries

- [ ] **Wrap all `localStorage` / `sessionStorage` access in a single `StorageAdapter` interface**: allows swap to IndexedDB or in-memory stub in tests without touching call sites.
- [ ] **Centralize `window`/`document` access behind an environment service**: enables Node-safe test execution and future SSR compatibility without scattered `typeof window` guards.
- [ ] **Mock `Date.now()` at the integration boundary**: inject a clock service so travel timers, event cooldowns, and daily caps are deterministic in tests.
- [ ] **Document and test browser API fallbacks explicitly**: Web Audio, `localStorage`, `ResizeObserver`; each must have a graceful-degradation path with a test that simulates the API being absent.

## 9) Technical Debt Tracking

- [ ] **Tag all high-risk paths with structured TODO IDs** (`TODO[STATE-###]`, `TODO[FLOW-###]`) and link to issues.
- [ ] **Add “design intent” comments for non-obvious mechanics** (e.g., cancellation math, capped penalties) to avoid accidental rebalance.
- [ ] **Document cross-module contracts** (`arrivalUtils` ↔ `useArrivalLogic`, `eventEngine` ↔ `useEventSystem`) in a short architecture note.
