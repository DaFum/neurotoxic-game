# Roguelite Expedition Tour — Design Specification

**Status:** Approved design draft for user review  
**Date:** 2026-09-03  
**Repository:** `DaFum/neurotoxic-game`  
**Scope:** New tour-centered management/roguelite layer built around the existing map, gig, minigame, event, social, contraband, quest, asset, sponsor, and progression systems.

## 1. Product Goal

Transform the current touring loop into a short, intense roguelite expedition in which preparation, route choice, resource pressure, active performance, and extraction decisions matter more than simply maximizing gig count.

The target experience is:

> Prepare a build, commit to a dangerous route, adapt to escalating problems, decide when to extract, and turn successful runs into broader future options rather than runaway permanent power.

A standard run should last roughly **20–30 minutes** and contain approximately **7–9 meaningful map nodes**. Each node should create a strategically relevant decision, gameplay challenge, or consequence. The player should rarely face a single obviously dominant option.

The design intentionally addresses current balance observations without solving them primarily by reducing gig income or globally increasing prices. Cash may remain generous when a run goes well; the difference is that cash becomes a tool for controlling risk and preserving future options.

## 2. Design Pillars

### 2.1 Management creates the situation; skill determines the outcome

Strategic choices determine the player's risk profile, available tools, and modifiers. Active gameplay, especially gigs and repair/minigame interactions, determines how efficiently the player converts those opportunities into rewards.

A strong player should be able to rescue a weak plan sometimes. A strong build should make success more likely but must not make active performance irrelevant.

### 2.2 Short runs, dense decisions

The mode must avoid long stretches of routine maintenance. A 20–30 minute run should contain a small number of consequential choices instead of many low-impact clicks.

Systems that do not produce a meaningful trade-off are abstracted. There is no detailed oil-change, tire-pressure, or payroll simulator.

### 2.3 Success creates pressure

Strong runs must not only become easier. More success should raise **Exposure**, attract more demanding sponsors and rivals, and create stronger opportunities with stronger consequences.

### 2.4 Meta progression expands possibility, not raw power

Permanent progression primarily unlocks new crew, modules, chassis, regions, sponsors, contracts, songs, events, rivalries, and starting configurations. Permanent stat inflation remains deliberately small.

### 2.5 Failure hurts but does not erase the player's time

The extraction model is deliberately hybrid. Failed or aborted runs retain part of their cash/fame and milestone progress, while high-value run loot and multipliers require successful extraction or completion.

## 3. High-Level Loop

The mode is structured as:

`META HUB -> LOADOUT -> EXPEDITION MAP -> NODE -> CONSEQUENCE -> PRESSURE -> EXTRACT OR CONTINUE -> BOSS/FINALE -> META PROGRESS`

### 3.1 Meta Hub

The player prepares from a persistent career layer containing unlocked options, persistent crew relationships, rivals, region access, and HQ facilities.

### 3.2 Loadout

Before the tour, the player commits to a constrained expedition build consisting of:

- band/setlist choices,
- vehicle chassis and modules,
- equipment,
- crew,
- cargo,
- supplies and spare parts,
- contraband where applicable,
- sponsor/contract choices,
- tour perk or starting modifier,
- starting cash/fuel allocation.

Slot and capacity limits are mandatory. The player must not be able to bring every solution.

### 3.3 Expedition

The player advances through a branching map. Each visited node consumes time and/or resources and may produce a gig, event, repair opportunity, rival encounter, supply action, rest action, or special decision chain.

### 3.4 Extraction

At designated points, the player may leave the run early and secure a portion of rewards. Continuing increases potential rewards and rare unlock chances but also increases the probability that accumulated damage, stress, heat, or obligations become decisive.

## 4. Run Structure

### 4.1 Length

A standard tour should contain approximately 7–9 significant nodes and target 20–30 minutes of real play time.

Suggested pacing:

- **Early run:** establish build identity, gather initial resources, low-to-moderate risk.
- **Mid run:** first serious trade-offs, equipment wear, crew stress, contracts, rivals, targeted drafts.
- **Late run:** high-value opportunities, escalating pressure, scarce repair/recovery windows.
- **Finale:** one of several context-sensitive boss/finale encounters, or earlier extraction.

### 4.2 Branching map with local event chains

The map remains visibly branching, but nodes may open short local decisions or event chains. This preserves strategic route selection while allowing narrative surprises.

Node classes include at minimum:

- Club/Gig
- Festival
- Finale/Boss Gig
- Supply Stop
- Rest Stop
- Special
- Rival Encounter
- Underground/Black Market variants where the region/build allows them

The existing map system remains the structural anchor rather than being replaced by a purely linear event deck.

## 5. Hybrid Fog of War

The map exposes enough information to support planning while preserving uncertainty.

### Always visible

- node type,
- rough danger tier,
- rough reward tier,
- reachable edges.

### Hidden by default

- exact payout,
- exact wear/health cost,
- exact event identity,
- rival presence,
- police/control risk,
- hidden repair/sponsor opportunities.

### Information sources

Additional detail may be revealed by:

- Scout crew,
- Manager/contacts,
- Social intel,
- reputation,
- specific vehicle modules,
- region perks,
- temporary run perks.

Information is therefore a build resource. A player who invests in scouting sacrifices another form of protection or throughput.

## 6. Core Resources

The mode uses a **hybrid resource model**: only the most important values remain permanently visible.

### Persistent run HUD resources

- **Cash** — purchasing, repairs, bribes, supplies, emergency safety.
- **Fuel** — route viability and travel pressure.
- **Stamina** — immediate physical performance capacity.
- **Harmony** — band cohesion and certain gig/crew outcomes.
- **Equipment Condition** — summarized technical readiness.
- **Heat** — negative attention and high-risk opportunity pressure.

### Contextual resources/statuses

Shown only when relevant:

- Mood,
- injuries,
- crew stress,
- contraband risk,
- sponsor pressure,
- rival status,
- individual hidden defects,
- active obligations.

This prevents the run HUD from becoming a permanent dashboard of 10–12 bars.

## 7. Multiple Fail States

A run can fail through different systems. No single resource should be the universal failure axis.

Possible failure families:

- **Economic:** inability to satisfy required costs with no rescue option.
- **Mobility:** vehicle/fuel state prevents viable continuation.
- **Band condition:** critical injury, exhaustion, or band collapse.
- **Harmony/crew:** severe conflict, required member loss, or breakdown at a critical moment.
- **Pressure:** a Heat/authority crisis that cannot be resolved.
- **Contractual:** only when a specific high-risk contract explicitly defines failure as tour-ending; ordinary contract failures should normally impose consequences rather than end the run.

Critical states should generally present a recoverable decision before terminating the run. A single opaque random roll must not erase a 20–30 minute run.

## 8. Hybrid Extraction

Extraction is a central push-your-luck decision.

### Early/voluntary extraction

The exact percentages are tuning values, but the initial design target is:

- roughly **50–70% of run Cash/Fame secured**,
- milestone/quest/rival progress retained when the milestone itself was achieved,
- only secured or explicitly extracted rare items retained,
- unextracted high-tier modules/perks/contracts lost,
- persistent consequences such as injuries, debt, relationship changes, or Heat may carry out when applicable.

### Successful finale

- 100% eligible Cash/Fame,
- all secured run rewards,
- boss/region reward,
- run completion multiplier,
- highest chance for rare/legendary unlocks.

### Failure

Failure still preserves a meaningful portion of ordinary rewards, but loses the main upside of greed: unextracted rare rewards and completion bonuses.

The player should regularly feel that extracting now is defensible while continuing is tempting.

## 9. Hybrid Drafting

The start build matters strongly. The mode does **not** interrupt the player with constant generic upgrade choices.

Temporary run drafts occur at selected high-value moments such as:

- boss or major gig completion,
- rare event resolution,
- Rival Encounter rewards,
- premium Supply Stops,
- crew development moments.

Drafts should usually offer a small choice set of meaningful rule changes rather than incremental `+5%` bonuses.

Temporary run traits disappear after extraction/failure unless a reward explicitly unlocks a persistent option for the meta pool.

## 10. Crew System

### 10.1 Crew as constrained loadout

The player has fewer crew slots than useful crew roles. Example roles:

- Roadie
- Technician
- Driver
- Manager
- Scout
- Security

Each role must solve different problems. The player should be choosing which classes of risk to accept, not simply selecting the highest numeric bonuses.

### 10.2 Individual crew identity

Persistent crew members contain:

- role,
- talent,
- one or more personality traits,
- vice/complication where relevant,
- loyalty,
- relationship state,
- story progression,
- optional signature trait unlocked through meta progression.

### 10.3 Stress

Crew stress is primarily a contextual run state. Internally it may use a numeric scale, but the normal UI presents semantic states such as `calm`, `strained`, `critical`, and `breaking`.

Stress may increase through:

- repeated gigs without recovery,
- damaged equipment,
- dangerous travel,
- poor performance,
- unpaid/violated commitments,
- band conflict,
- Heat/contraband events.

### 10.4 Crew crises

High stress produces decision events rather than only passive debuffs. A crisis should offer multiple responses, often trading Cash, time, condition, relationship, or future risk.

### 10.5 Relationships

Use a deliberately compact relationship vocabulary such as:

- Bonded
- Neutral
- Tense
- Hostile

Relationships exist between relevant band/crew pairs and influence which events are eligible and which resolutions are available. This is not a full life-simulation system.

### 10.6 Injuries

Injuries escalate through stages rather than appearing as instant run killers:

`strain -> light injury -> serious injury -> critical/run-ending risk`

The player should normally receive at least one opportunity to respond through rest, supplies, treatment, route change, or risk acceptance.

### 10.7 No random crew permadeath

Crew may be injured, unavailable, quit, or be recruited away through understandable consequences. Random permanent death is out of scope.

## 11. Vehicle, Equipment, Condition and Cargo

### 11.1 Condition

Condition is grouped at the decision level, for example:

- Vehicle
- PA
- Instruments
- Stage Gear

Individual component detail becomes visible only when a specific defect matters.

Suggested condition bands:

- **70–100:** Good
- **40–69:** Worn
- **20–39:** Critical
- **0–19:** Breaking

The values are initial tuning categories, not locked balance constants.

### 11.2 Wear comes from behavior

Wear should be explainable by player choices rather than a flat daily tax.

Vehicle wear may depend on route length, road quality, cargo load, driving style, driver skill, and events.

Equipment wear may depend on venue size, stage quality, performance intensity, crew coverage, song/set choices, and prior improvised repairs.

### 11.3 Field Repairs

A defect should normally offer several resolution classes:

- professional repair: expensive and reliable,
- field repair: consumes spare parts and restores moderate condition,
- improvisation: cheap/free but creates risk,
- cannibalization: sacrifice one component to restore another,
- continue broken: keep resources but accept active gameplay/reputation risk.

### 11.4 Spare Parts and Supplies

Spare parts are finite run consumables and occupy cargo capacity. Supplies compete with Merch, Contraband, technical gear, and other cargo.

Cargo capacity is therefore a strategic build constraint, not a decorative stat.

### 11.5 Chassis archetypes

Chassis should define playstyles rather than form a linear numeric ladder. Example archetypes:

- **DIY Van:** efficient field repairs, moderate capacity/reliability.
- **Tour Bus:** large capacity and low crew stress, high fuel cost.
- **Speed Van:** extra route flexibility, lower reliability/capacity.
- **Armored Van:** strong Heat/contraband interactions, high operating cost.

Exact names may follow existing content conventions.

### 11.6 Modules change rules

Prefer rule-changing module effects:

- free field repair once per run,
- hidden contraband compartment,
- sleeping berths that trade capacity for recovery,
- suspension that neutralizes poor-road wear,
- turbo that changes map reach at a fuel cost,
- mobile studio that enables song work at Rest Stops.

Avoid building the module pool primarily from small additive percentages.

### 11.7 Hidden Defects

Improvised repairs and critical wear can create hidden defects. A summarized condition value may therefore look acceptable while an undiscovered fault remains.

Defects can be revealed through inspections, specific crew, or events. This is the technical analogue of map Fog of War.

### 11.8 Inspections

Large gigs may offer optional checks:

- quick check: low information, free,
- crew inspection: requires relevant crew,
- full service: paid, high-confidence inspection plus limited repair.

### 11.9 Insurance

Insurance is an optional risk-management sink, not mandatory upkeep. Different policies cover different failure classes and may contain exclusions, especially around Contraband/Heat.

### 11.10 Total loss

Condition reaching zero normally disables an asset for the run rather than deleting it permanently. Permanent loss should be rare, telegraphed, and tied to explicit high-risk outcomes.

## 12. Active Gameplay Integration

The management layer modifies active gameplay conditions rather than replacing active play.

Examples:

- low Stamina makes sustaining performance harder,
- damaged PA creates timing/audio hazards,
- missing technical crew removes recovery options,
- high crowd hype increases combo upside,
- injury changes specific performance constraints,
- repair minigame quality controls how much Condition is restored.

Existing Roadie, cable, amp, travel, and gig interactions should be reused where they naturally represent the management consequence.

The system must avoid hidden modifiers that make player skill feel invalid. Material gameplay effects should be surfaced before or during the encounter.

## 13. Pressure System

Three concepts drive success-related pressure:

### 13.1 Heat

Negative/illegal attention generated by actions such as Contraband, scandals, sabotage, aggressive social choices, authority conflict, or contract violations.

Heat is not purely bad. High-Heat builds may gain access to Underground nodes, rare drops, infamy rewards, or specific perks.

### 13.2 Exposure

Visibility and relevance. Exposure increases through successful/high-profile activity and unlocks larger opportunities while raising expectations, rival activity, press attention, and consequences.

High Fame/Exposure should therefore not mean only easier access to more rewards.

### 13.3 Obligations

The set of active promises and constraints the player has voluntarily accepted, including sponsors, venue commitments, crew promises, and special contracts.

A compact UI shows active obligations and their current status.

## 14. Authorities and Heat Encounters

Police/authority events are decision encounters, not flat random fines.

Potential responses depend on build state, including:

- comply,
- use Manager/Security,
- pay/bribe where narratively appropriate,
- use vehicle/contraband modules,
- take a costly route detour,
- surrender cargo,
- accept a future obligation.

High-risk encounters must be telegraphed enough that the player understands why they occurred.

## 15. Rival Bands and Nemesis Progression

### 15.1 Persistent rivals

Rivals persist between runs with:

- identity/style,
- strength,
- relationship state,
- preferred regions,
- signature behaviors/traits,
- progression level.

### 15.2 Relationship path

A rival can develop roughly through:

`Unknown -> Competitive -> Rival -> Nemesis`

but may also move toward `Respect` or `Alliance` through appropriate decisions.

### 15.3 Rival encounters

Rivals can produce:

- double-booking battles,
- social conflicts,
- sponsor competition,
- sabotage opportunities,
- cooperative gigs,
- territory/region pressure,
- boss/finale variants.

### 15.4 Nemesis escalation

Higher rivalry levels unlock stronger rule changes, not just numeric difficulty:

- more frequent appearances,
- sponsor interference,
- altered venue availability,
- dedicated quest chains,
- Rival Hunt finale.

## 16. Sponsors and Contracts

Sponsors are deliberate trade-offs rather than passive income.

A contract grants a meaningful immediate or run-wide advantage in return for an obligation.

Contract families:

- **Performance:** maintain required gig outcomes.
- **Route:** visit or finish specific map locations.
- **Behavior:** keep Heat within a range, avoid Contraband, post socially, etc.
- **High Risk:** accept unusual restrictions for premium rewards.

The player may stack several obligations. Stronger reward multipliers are available when accepting more constraints, but contradictions and route pressure become possible.

Mid-run `double down` offers should support push-your-luck escalation.

## 17. Social Integration

Social activity should serve more than raw Fame generation.

It can influence:

- map intelligence,
- Exposure,
- Heat,
- sponsor interest,
- rival behavior,
- crowd hype,
- event eligibility,
- monetization opportunities.

A viral moment should create a strategic choice such as pushing it for Fame/Exposure, monetizing it for Cash, suppressing it to control Heat, or using it against a rival.

## 18. Pressure Director

A lightweight director may bias eligible content based on the current run state.

Inputs can include:

- Heat,
- Exposure,
- Cash,
- Equipment Condition,
- Crew Stress,
- active Obligations,
- Rival state,
- remaining route depth.

The director does **not** force outcomes or secretly normalize success. It only adjusts eligibility/weights among valid encounters.

Anti-frustration requirements:

- major negative events use repeat protection/cooldowns,
- severe risk is telegraphed,
- most crises retain at least one expensive but safe escape,
- a bad event should temporarily reduce the likelihood of another severe event unless the player deliberately stays in a high-risk state.

## 19. Context-Sensitive Finales

The final encounter should reflect the run rather than always being the same boss gig.

Possible finale families:

- Corporate/Sponsor Arena
- Rival Battle
- High-Heat Illegal Show
- Disaster/Improvisation Gig
- Region-specific Headliner
- contract-defined special finale

The final type may be influenced by dominant run state, route, active rivalries, and accepted obligations.

## 20. Meta Progression

### 20.1 Career ranks

Use a career progression such as:

`Unknown -> Local Noise -> Underground Act -> Rising Band -> Touring Force -> Headliner -> Cult Legend`

Exact labels are content decisions. Progression must require combinations of accomplishments rather than raw Fame alone.

Possible requirements include:

- successful extractions,
- boss completions,
- region completions,
- rival milestones,
- sponsor milestones,
- quest chains,
- challenge achievements.

### 20.2 Regions as gameplay biomes

Regions change rules, pools, and incentives.

Candidate archetypes:

- **Industrial Belt:** repair-friendly, harsh roads, equipment events.
- **Festival Circuit:** high payouts/wear, rival/sponsor pressure.
- **Corporate Route:** premium contracts, strict Heat tolerance.
- **Underground Network:** Contraband, high Heat, rare items, authority pressure.

Regions must differ mechanically, not only visually.

### 20.3 Tour archetypes

Unlocked tour templates allow the player to choose what kind of run they want:

- Standard Tour
- Blitz Tour
- Underground Run
- Corporate Circuit
- Rival Hunt
- Survival Tour

Each changes route composition and rule pressure rather than merely applying a percentage difficulty modifier.

### 20.4 Unlock sets instead of linear stat trees

Permanent progression should unlock connected gameplay packages, e.g. a mechanic network that adds workshop functionality, mechanic crew, salvage events, repair modules, and related Supply Stop options.

### 20.5 Meta currencies

Use at most two dedicated long-term currencies beyond existing gameplay values. Candidate roles:

- career/reputation progression,
- permanent roguelite unlock purchases.

Do not proliferate multiple overlapping meta currencies.

### 20.6 Fame

Fame remains primarily a gameplay/career signal. It should affect access, Exposure, expectations, sponsor quality, and rival attention rather than serving as the sole universal permanent-upgrade currency.

### 20.7 Tour Archive

A persistent discovery archive may track discovered content across categories such as:

- crew,
- modules,
- chassis,
- rivals,
- sponsors,
- regions,
- boss finales,
- special events,
- Contraband.

This is a discovery/progression surface, not a mandatory 100% grind requirement.

### 20.8 Crew persistence

Crew may retain:

- Loyalty,
- relationship/story progress,
- a small number of signature unlocks.

Temporary run traits do not persist.

### 20.9 Rival persistence

Rival identity, relationship, level, and major history persist between runs and may affect future region/encounter pools.

### 20.10 Between-tour events

Keep the meta pause short: normally 1–3 consequential decisions, then return to `Start Tour`.

## 21. HQ as Meta Hub

The HQ should transition away from being primarily an early numeric purchase and become the main persistent feature hub.

Possible facilities:

- **Workshop:** vehicle/equipment/module unlocks.
- **Rehearsal Room:** songs/setlist traits.
- **Management Office:** sponsor/contract pools.
- **Garage:** chassis.
- **Black Market Contact:** Contraband/Underground options.
- **Crew Lounge:** crew relationships/story events.

Mandatory decorative base-building is out of scope for this design. Cosmetics may be added separately later.

## 22. Ascension / Tour Pressure

Post-career replayability uses modular rule modifiers rather than simple health/damage scaling.

Examples:

- **Bad Roads:** more vehicle wear, increased reward.
- **Media Frenzy:** Exposure rises faster, increased reward.
- **No Safety Net:** extraction retains less, increased reward.
- **Union Trouble:** crew stress rises faster, increased reward.
- **Hostile Territory:** rival pressure rises, increased reward.

Players may combine modifiers to increase a run reward multiplier.

Strong builds therefore unlock harder, more rewarding opportunities instead of making the game permanently trivial.

## 23. Legendary Rewards

Rare endgame rewards should usually change rules or enable new builds.

Examples:

- a module that converts high-Heat roadblocks into Underground encounters,
- a crew specialist who can erase one contract violation per run,
- a chassis that changes map-edge rules,
- a sponsor trait that transforms Extraction terms.

Avoid using legendary rewards mainly as large universal stat boosts.

## 24. Anti-Snowball Rules

Permanent progression must obey:

1. Unlocks broaden the option pool more than they increase baseline stats.
2. Strong options include meaningful trade-offs.
3. Exposure/Pressure scales opportunity difficulty with success.
4. High-end builds face new constraints rather than only larger numbers.
5. Run-specific drafts carry much of the explosive temporary power.
6. Permanent numeric bonuses remain small enough that base content still matters.

## 25. Relationship to Existing Systems

The design is additive and should reuse current foundations where possible:

| Existing system | New primary role                                      |
| --------------- | ----------------------------------------------------- |
| Map             | Branching expedition route                            |
| Gigs            | High-reward/high-cost active encounters               |
| Rhythm gameplay | Skill conversion of management preparation            |
| Travel          | Mobility, Fuel, Condition, route risk                 |
| Minigames       | Resource-saving and repair/recovery execution         |
| Events          | Contextual run consequences and Pressure responses    |
| Social          | Intel, Exposure, Heat, sponsors, rivals               |
| Contraband      | High-Heat/high-reward build path                      |
| Sponsors        | Conditional risk contracts                            |
| Quests          | Run goals, rival chains, meta unlock objectives       |
| Chassis/modules | Expedition build archetypes                           |
| HQ              | Persistent meta hub                                   |
| Fame            | Career/Exposure signal rather than only shop currency |
| Harmony         | Run stability and crew/band consequence driver        |

## 26. Balance Intent

The new layer is explicitly intended to correct the current pattern where repeated gigs can dominate decision-making.

The balancing strategy is **not** primarily to lower gig payouts. Instead:

- profitable gigs create wear and recovery pressure,
- Cash competes with repairs, supplies, crew resolution, insurance, obligations, and extraction safety,
- route choice changes expected cost and reward,
- high Fame/Exposure increases expectation pressure,
- frequent gigging increases accumulated technical/physical/relationship risk,
- alternative builds gain viable ways to convert information, contracts, Heat, repair skill, and route control into value.

A successful economy should let a player feel rich for a moment while still presenting attractive and defensible uses for that money.

## 27. Initial Success Criteria

These are design targets for later calibration, not hard-coded constants.

### Run pacing

- Standard successful run: roughly 20–30 minutes.
- Approximately 7–9 meaningful nodes.
- Most nodes produce a real trade-off, active challenge, or meaningful consequence.

### Economy

- HQ should no longer function as an automatic Day-1 run purchase; its main value moves to meta progression.
- Vehicle/equipment safety should require real trade-offs rather than routine full maintenance.
- A large portion of run Cash should have credible optional uses before the finale.
- High gig income may remain viable, but dense gig routes should accumulate visible physical, technical, contractual, or Pressure costs.

### Strategy diversity

At minimum, viable distinct build families should emerge around:

- clean sponsor/contract play,
- high-Heat/Underground play,
- repair/DIY resilience,
- scouting/information control,
- performance-focused high-Exposure play,
- rival-focused play.

No single family should dominate both safety and maximum reward.

### Risk

- Early mistakes are recoverable.
- Repeatedly ignored warnings can become run-ending.
- Failure reasons are attributable to visible player decisions/state.
- Voluntary extraction is regularly competitive with continuing.

## 28. Simulation and Telemetry Requirements

The existing balance simulator should eventually be extended so this design can be validated rather than judged only by anecdotal playtests.

Required future measurements include:

### Run structure

- run duration estimate / node count,
- route depth and extraction point,
- extraction vs finale completion rates,
- node-type visitation.

### Economy

- Cash earned and spent by sink category,
- Cash retained at extraction/failure,
- repair/insurance/supply spend,
- optional safety purchases skipped vs taken.

### Condition

- Condition distribution by route depth,
- defect incidence,
- field/professional/improvised repair use,
- disabled asset incidence.

### Crew

- stress distributions,
- crisis frequency,
- injury escalation,
- crew-slot pick rates,
- relationship-event incidence.

### Pressure

- Heat and Exposure trajectories,
- contract acceptance/completion/failure,
- authority/rival encounter rates,
- Obligation stack size.

### Strategy diversity

- build archetype pick rates,
- success/extraction/reward by archetype,
- dominant chassis/module/crew combinations,
- whether a single route/gig-density policy dominates.

### Fog of War

- scouting investment,
- revealed information usage,
- route choice differences with/without information.

### Active gameplay

- performance outcomes under management modifiers,
- whether skilled play meaningfully reduces repair/resource burden,
- whether management debuffs are too strong to overcome through skill.

The simulator must preserve holdout validation and should distinguish hard safety gates from non-blocking design corridors.

## 29. Data and State Boundaries

Implementation should keep major subsystems isolated behind explicit state/action boundaries consistent with repository conventions.

Conceptual domains:

- `expedition/run` — route depth, extraction state, run-only modifiers.
- `resources` — Cash/Fuel and summarized run resources.
- `condition` — asset condition, defects, repair outcomes.
- `crew` — persistent identity + run stress/status.
- `pressure` — Heat, Exposure, Obligations.
- `rivals` — persistent rivalry/meta state + run encounters.
- `contracts` — accepted obligations, progress, resolution.
- `meta` — unlock pools, career rank, regions, archive, HQ facilities.

Exact file locations and action shapes belong in the implementation plan. This design requires the domains to remain independently understandable/testable and to use the repository's typed action-creator/reducer patterns for state changes.

## 30. Error and Edge-Case Principles

- No route may become silently unwinnable due to a generated map with no legal continuation unless the player knowingly accepted an explicit no-safety-net challenge.
- Crisis events must expose the resource or state that caused them.
- Failed contract resolution must be deterministic given the recorded outcome; no duplicate payouts or penalties.
- Extraction must be idempotent: rewards are secured once.
- Persistent rewards must not be granted before successful resolution of the event/extraction that owns them.
- Run-only traits must not leak into persistent state.
- Persistent crew/rival/meta state must survive run reset while temporary stress/modifiers reset appropriately.
- Random selection must preserve repeat protection for severe events.
- Existing save data should remain loadable; newly added persistent fields require safe defaults/sanitization. A separate save migration system is not required unless implementation proves the current persistence layer cannot safely default missing fields.

## 31. Validation Strategy

Implementation is not complete until the following classes of validation exist:

### Deterministic logic tests

- extraction reward retention,
- fail-state transitions,
- condition bands and repair outcomes,
- cargo/slot constraints,
- obligation progress/resolution,
- Heat/Exposure boundaries,
- persistent-vs-run reset behavior,
- unlock eligibility,
- director eligibility/repeat protection.

### Integration tests

- route -> travel -> node -> gig/event -> consequence -> next route,
- condition modifiers reaching active gameplay,
- crew/contract responses changing available event choices,
- successful/failing extraction persistence,
- rival/meta progression across multiple runs.

### Balance simulation

- multiple build archetypes,
- calibration and holdout seeds,
- strategy diversity and dominance checks,
- extraction curve,
- economic sink composition,
- run-ending cause distribution.

### UI/UX validation

- core HUD stays readable with only the six permanent run resources,
- contextual statuses appear only when actionable,
- Fog-of-War information differences are understandable,
- severe risk is telegraphed before irreversible decisions,
- extraction consequences are explicit before confirmation.

## 32. Non-Goals

This design does not require:

- full employee/payroll simulation,
- detailed vehicle maintenance simulation,
- mandatory HQ decoration,
- random permanent crew death,
- a dozen permanent currencies,
- constant draft interruptions,
- full relationship/life simulation,
- purely numeric difficulty scaling,
- replacing the existing map or rhythm game with a new engine,
- reducing every system to a single universal risk score.

## 33. Recommended System Boundaries for Implementation Planning

The approved design should be implemented as several bounded subsystems rather than one monolithic feature:

1. **Expedition Core + Extraction**
2. **Condition / Repairs / Cargo**
3. **Crew / Stress / Relationships**
4. **Pressure / Rivals / Contracts**
5. **Meta Hub / Unlocks / Regions / Ascension**

This list defines domain boundaries, not implementation order or pull-request structure. The detailed dependency order and verification steps belong in the subsequent implementation plan after this specification is reviewed.

## 34. Final Design Summary

The new mode is a **short, intense roguelite expedition built around touring**.

The player prepares a constrained loadout, navigates a partially known branching map, performs active gigs/minigames, accumulates wear and social pressure, manages crew and obligations, and repeatedly decides whether to spend resources for safety, continue for a stronger reward, or extract.

Long-term progression unlocks broader strategies rather than overwhelming permanent power. Strong runs create stronger opportunities and stronger pressure. Existing Neurotoxic systems become interconnected parts of one loop instead of parallel feature catalogs.

The central design test for every future mechanic is:

> Does this create a meaningful decision about what to risk, what to spend, what to reveal, or when to stop?

If not, it should not be part of the expedition core.
