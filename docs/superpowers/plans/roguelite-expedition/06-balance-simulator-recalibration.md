# Expedition Balance Simulator Recalibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebase Neurotoxic's production balance harness from the current depth-10/day-10 touring model onto the shipped Roguelite Expedition semantics, preserve a frozen pre-Expedition baseline, add calibration/holdout coverage for extraction/condition/crew/pressure/build diversity, and make the final release gate fail closed on structural safety errors and reproducible strategy dominance.

**Architecture:** Keep `scripts/game-balance-simulation.mjs` as the authoritative full-report runner so all existing report/provenance tooling still has one source of truth, but move Expedition-specific scenario/profile definitions and derived metrics into focused utility modules. Bump the report contract and seed namespace when the horizon semantics change; never compare v14's 10-day results as if they were paired v15 Expedition results. Add a separate deterministic `game-balance-expedition-probe.mjs` for paired push-your-luck experiments such as extract-now versus continue, because those counterfactual branches answer a different question than the main population report.

**Tech Stack:** Node.js ESM, TypeScript production helpers loaded via `--import tsx`, existing deterministic `MapGenerator`, production reducer/domain helpers, 2,000-run calibration and holdout cohorts, Node test runner, existing Markdown/JSON report pipeline.

---

## Depends On

This plan starts only after G5 is green:

1. Expedition Core/Extraction exists and is deterministic.
2. Condition/Cargo/Repairs exists.
3. Crew/Stress/Relationships exists.
4. Heat/Exposure/Obligations/Rivals/Contracts exists.
5. Regions/Tour Types/Pressure Modifiers/Meta loadouts exist.
6. The six canonical strategy archetypes can be constructed through production registries/helpers rather than simulator-only fake state.

Do not use this plan to hide missing production behavior inside the simulator. If a production helper is missing, fix the owning G1-G5 domain first and then import it here.

---

## File Structure

**Create:**

- `scripts/utils/expedition-balance-profiles.mjs`
- `scripts/utils/expedition-balance-metrics.mjs`
- `scripts/game-balance-expedition-probe.mjs`
- `tests/node/expedition-balance-profiles.test.js`
- `tests/node/expedition-balance-metrics.test.js`
- `tests/node/game-balance-expedition-probe.test.js`

**Modify:**

- `scripts/game-balance-simulation.mjs`
- `scripts/game-balance-experiments.mjs`
- `scripts/game-balance-experiment-config.mjs`
- `scripts/utils/balance-report-metadata.mjs`
- `package.json`
- `tests/node/game-balance-simulation.test.js`
- `tests/node/game-balance-experiments.test.js`
- `tests/node/balanceSourceFiles.test.js`
- `reports/game-balance-simulation-results.json`
- `reports/game-balance-simulation-analysis.md`
- `reports/game-balance-simulation-baseline.json`
- `reports/game-balance-experiments-results.json`
- `reports/game-balance-experiments-analysis.md`

**Verify as existing historical evidence created by G1 Task 0:**

- `reports/game-balance-simulation-pre-expedition-v14.json`
- `reports/game-balance-simulation-pre-expedition-v14.md`

The pre-Expedition files are immutable snapshots. Do not regenerate or overwrite them after Expedition work begins.

---

## Locked Simulator Decisions

### A. Report v14 and v15 are not paired populations

The current report defines a run as 10 map hops / 10 days. Expedition defines a run by tour type, route depth, extraction/failure/finale outcome, and may end before the maximum map depth. Therefore v15 must use:

```js
reportVersion: 15,
seedNamespace: '#roguelite-expedition-v1'
```

The old namespace `#first-income-full-reports-v1` remains attached only to the frozen v14 artifacts.

### B. Production profile config drives the horizon

Do not keep `daysPerRun: 10` as the controlling Expedition horizon. The main loop obtains `mapDepth` and extraction windows from the selected production tour type. Use a defensive simulation iteration ceiling only as an invariant guard, not as gameplay timing.

### C. Main report = population behavior; paired probe = counterfactual value

The main report answers: "What happens when canonical strategies play the shipped mode?"

The paired probe answers: "At the same extraction state, what is the measured trade-off between cashing out and continuing?"

Do not infer extraction decision value from two unrelated scenario populations.

### D. Hard gates and design hypotheses remain separate

Blocking G6 gates cover correctness/reproducibility/safety and clear dominance. Desired pacing/risk bands are reported as non-blocking hypotheses until playtest evidence confirms their final product targets.

---

### Task 1: Verify the Frozen v14 Baseline Before Changing Horizon Semantics

**Files:**
- Read: `reports/game-balance-simulation-pre-expedition-v14.json`
- Read: `reports/game-balance-simulation-pre-expedition-v14.md`
- Test: `tests/node/preExpeditionBalanceBaseline.test.js`
- Modify: `tests/node/game-balance-simulation.test.js`

The immutable snapshot is created by Task 0 of `01-expedition-core-extraction.md` **before any Expedition work starts**. G6 must verify it, never recreate it from the then-current live report.

- [ ] **Step 1: Run the historical-baseline test from G1**

```bash
node --test tests/node/preExpeditionBalanceBaseline.test.js
```

Expected: PASS with report version 14, namespace `#first-income-full-reports-v1`, 10-day horizon, and 2,000 runs per scenario.

- [ ] **Step 2: Add a guard that the live simulator is no longer allowed to overwrite the historical filenames**

Add to `tests/node/game-balance-simulation.test.js`:

```js
test('live report filenames do not target the frozen pre-expedition artifacts', () => {
  assert.notEqual(
    SIMULATION_CONSTANTS.outputJson,
    'game-balance-simulation-pre-expedition-v14.json'
  )
  assert.notEqual(
    SIMULATION_CONSTANTS.outputMarkdown,
    'game-balance-simulation-pre-expedition-v14.md'
  )
})
```

- [ ] **Step 3: Run the focused tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/preExpeditionBalanceBaseline.test.js \
  tests/node/game-balance-simulation.test.js
```

Expected: PASS.

- [ ] **Step 4: Commit only the guard test if it changed**

```bash
git add tests/node/game-balance-simulation.test.js
git commit -m "test(balance): protect frozen pre-expedition baseline"
```

---

### Task 2: Define Canonical Expedition Balance Profiles

**Files:**
- Create: `scripts/utils/expedition-balance-profiles.mjs`
- Create: `tests/node/expedition-balance-profiles.test.js`
- Modify: `scripts/game-balance-simulation.mjs`

The simulator must stop treating the six new strategy families as loose comments/behavior flags. Each profile pins a production-valid region/tour/loadout policy and a decision policy.

- [ ] **Step 1: Write the failing profile-contract test**

`tests/node/expedition-balance-profiles.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_BALANCE_PROFILES,
  getExpeditionBalanceProfile
} from '../../scripts/utils/expedition-balance-profiles.mjs'

const REQUIRED_IDS = [
  'clean_sponsor',
  'underground_heat',
  'diy_repair',
  'scout_intel',
  'high_exposure_performance',
  'rival_hunter'
]

test('expedition balance profiles cover every approved strategy family once', () => {
  assert.deepEqual(
    EXPEDITION_BALANCE_PROFILES.map(profile => profile.id).sort(),
    [...REQUIRED_IDS].sort()
  )
  assert.equal(new Set(EXPEDITION_BALANCE_PROFILES.map(p => p.id)).size, 6)
})

test('each profile has explicit loadout and deterministic decision policy', () => {
  for (const profile of EXPEDITION_BALANCE_PROFILES) {
    assert.equal(typeof profile.tourTypeId, 'string')
    assert.equal(typeof profile.regionId, 'string')
    assert.ok(profile.starterPerkId === null || typeof profile.starterPerkId === 'string')
    assert.ok(profile.insurancePolicyId === null || typeof profile.insurancePolicyId === 'string')
    assert.ok(Array.isArray(profile.crewRolePreference))
    assert.equal(typeof profile.decisionPolicy, 'object')
    assert.equal(typeof profile.decisionPolicy.extractionRiskTolerance, 'number')
    assert.ok(profile.decisionPolicy.extractionRiskTolerance >= 0)
    assert.ok(profile.decisionPolicy.extractionRiskTolerance <= 1)
    assert.strictEqual(getExpeditionBalanceProfile(profile.id), profile)
  }
})
```

- [ ] **Step 2: Run the test and verify module-not-found**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-profiles.test.js
```

Expected: FAIL because the profile module does not exist.

- [ ] **Step 3: Create the exact profile registry**

`scripts/utils/expedition-balance-profiles.mjs`:

```js
const freezeProfile = profile =>
  Object.freeze({
    ...profile,
    crewRolePreference: Object.freeze([...profile.crewRolePreference]),
    pressureModifierIds: Object.freeze([...profile.pressureModifierIds]),
    decisionPolicy: Object.freeze({ ...profile.decisionPolicy })
  })

export const EXPEDITION_BALANCE_PROFILES = Object.freeze([
  freezeProfile({
    id: 'clean_sponsor',
    name: 'Clean Sponsor',
    tourTypeId: 'corporate',
    regionId: 'corporate',
    starterPerkId: 'press_pass',
    insurancePolicyId: 'touring',
    crewRolePreference: ['manager', 'driver', 'technician'],
    pressureModifierIds: [],
    decisionPolicy: {
      heatPreference: 'low',
      repairPreference: 'safe',
      contractPreference: 'sponsor',
      intelPreference: 'medium',
      extractionRiskTolerance: 0.45
    }
  }),
  freezeProfile({
    id: 'underground_heat',
    name: 'Underground Heat',
    tourTypeId: 'underground',
    regionId: 'underground',
    starterPerkId: 'underground_contact',
    insurancePolicyId: null,
    crewRolePreference: ['security', 'driver', 'technician'],
    pressureModifierIds: ['media_frenzy'],
    decisionPolicy: {
      heatPreference: 'high',
      repairPreference: 'balanced',
      contractPreference: 'high_risk',
      intelPreference: 'low',
      extractionRiskTolerance: 0.75
    }
  }),
  freezeProfile({
    id: 'diy_repair',
    name: 'DIY Repair',
    tourTypeId: 'standard',
    regionId: 'industrial',
    starterPerkId: 'mechanic_kit',
    insurancePolicyId: 'equipment',
    crewRolePreference: ['technician', 'roadie', 'driver'],
    pressureModifierIds: ['bad_roads'],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'field',
      contractPreference: 'neutral',
      intelPreference: 'medium',
      extractionRiskTolerance: 0.6
    }
  }),
  freezeProfile({
    id: 'scout_intel',
    name: 'Scout Intel',
    tourTypeId: 'standard',
    regionId: 'home',
    starterPerkId: null,
    insurancePolicyId: 'roadside',
    crewRolePreference: ['scout', 'driver', 'technician'],
    pressureModifierIds: [],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'balanced',
      contractPreference: 'neutral',
      intelPreference: 'high',
      extractionRiskTolerance: 0.55
    }
  }),
  // `festival` is a region, not a tour type; this profile intentionally uses
  // the registered `standard` tour and lets the region provide festival behavior.
  freezeProfile({
    id: 'high_exposure_performance',
    name: 'High Exposure Performance',
    tourTypeId: 'standard',
    regionId: 'festival',
    starterPerkId: 'headliner_pass',
    insurancePolicyId: 'equipment',
    crewRolePreference: ['roadie', 'manager', 'technician'],
    pressureModifierIds: ['media_frenzy'],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'balanced',
      contractPreference: 'performance',
      intelPreference: 'medium',
      extractionRiskTolerance: 0.7
    }
  }),
  freezeProfile({
    id: 'rival_hunter',
    name: 'Rival Hunter',
    tourTypeId: 'rival_hunt',
    regionId: 'home',
    starterPerkId: 'nemesis_dossier',
    insurancePolicyId: null,
    crewRolePreference: ['scout', 'security', 'roadie'],
    pressureModifierIds: ['hostile_territory'],
    decisionPolicy: {
      heatPreference: 'medium',
      repairPreference: 'balanced',
      contractPreference: 'rival',
      intelPreference: 'high',
      extractionRiskTolerance: 0.8
    }
  })
])

export const getExpeditionBalanceProfile = id =>
  EXPEDITION_BALANCE_PROFILES.find(profile => profile.id === id) ?? null
```

These ids must match the G2/G5 production registries. Profiles using a legendary starter perk represent an explicitly seeded late-career loadout and must add that exact marker to the simulated `state.unlocks` before validating the loadout. Profiles must still pass the production `validateExpeditionLoadout`; never bypass unlock validation or add a simulator-only alias.

- [ ] **Step 4: Import profiles into the main simulator**

Add:

```js
import { EXPEDITION_BALANCE_PROFILES } from './utils/expedition-balance-profiles.mjs'
```

Do not yet replace `SCENARIOS`; Task 4 does the horizon cutover atomically.

- [ ] **Step 5: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-profiles.test.js

git add scripts/utils/expedition-balance-profiles.mjs scripts/game-balance-simulation.mjs tests/node/expedition-balance-profiles.test.js
git commit -m "test(balance): define expedition strategy profiles"
```

---

### Task 3: Add Pure Expedition Metric Accumulators

**Files:**
- Create: `scripts/utils/expedition-balance-metrics.mjs`
- Create: `tests/node/expedition-balance-metrics.test.js`

The main simulator is already large. Keep new counters and summary math in a focused module instead of adding another several hundred inline arithmetic branches.

- [ ] **Step 1: Write failing metric tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createExpeditionMetrics,
  recordExpeditionSpend,
  summarizeExpeditionRuns
} from '../../scripts/utils/expedition-balance-metrics.mjs'

test('spend attribution preserves one canonical sink bucket', () => {
  const metrics = createExpeditionMetrics()
  recordExpeditionSpend(metrics, 'repair', 250)
  recordExpeditionSpend(metrics, 'supply', 100)
  assert.deepEqual(metrics.spendByCategory, {
    repair: 250,
    supply: 100,
    insurance: 0,
    crew: 0,
    contract: 0,
    fuel: 0,
    other: 0
  })
})

test('summary keeps extraction, completion and failure disjoint', () => {
  const summary = summarizeExpeditionRuns([
    { expeditionOutcome: 'extracted', securedReward: 500 },
    { expeditionOutcome: 'completed', securedReward: 900 },
    { expeditionOutcome: 'failed', securedReward: 200 }
  ])
  assert.equal(summary.extractedPct, 33.33)
  assert.equal(summary.completedPct, 33.33)
  assert.equal(summary.failedPct, 33.33)
  assert.equal(summary.avgSecuredReward, 533.33)
})
```

- [ ] **Step 2: Run and verify module-not-found**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-metrics.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement exact accumulator shape**

The module exports:

```js
export const EXPEDITION_SPEND_CATEGORIES = Object.freeze([
  'repair',
  'supply',
  'insurance',
  'crew',
  'contract',
  'fuel',
  'other'
])

export const createExpeditionMetrics = () => ({
  routeSteps: 0,
  expeditionOutcome: null,
  extractionStep: null,
  grossReward: 0,
  securedReward: 0,
  spendByCategory: Object.fromEntries(
    EXPEDITION_SPEND_CATEGORIES.map(key => [key, 0])
  ),
  conditionMinimums: {
    vehicle: 100,
    pa: 100,
    instruments: 100,
    stageGear: 100
  },
  defectsCreated: 0,
  assetsDisabled: 0,
  professionalRepairs: 0,
  fieldRepairs: 0,
  improvisedRepairs: 0,
  insuranceClaims: 0,
  starterPerkId: null,
  legendaryUnlocksEarned: 0,
  crewCrises: 0,
  seriousInjuries: 0,
  breakingCrewMembers: 0,
  obligationsAccepted: 0,
  obligationsCompleted: 0,
  obligationsFailed: 0,
  rivalEncounters: 0,
  authorityEncounters: 0,
  revealedIntelNodes: 0,
  routeChoicesUsingRevealedIntel: 0,
  draftsOffered: 0,
  draftsAccepted: 0,
  runTraitPickCounts: {},
  heatTimeline: [],
  exposureTimeline: []
})
```

`recordExpeditionSpend` rejects non-finite/negative values with `RangeError`. Increment `insuranceClaims` only on the canonical one-shot insurance-claim transition, set `starterPerkId` from the validated loadout once at run start, and increment `legendaryUnlocksEarned` only when a completed finale produces a previously unowned legendary marker. `summarizeExpeditionRuns` returns rates rounded to two decimals and never turns missing samples into a successful 0% result; for an empty array, rate fields are `null`.

- [ ] **Step 4: Add edge-case tests**

```js
assert.throws(
  () => recordExpeditionSpend(createExpeditionMetrics(), 'repair', -1),
  /non-negative finite/
)
assert.equal(summarizeExpeditionRuns([]).failedPct, null)
```

- [ ] **Step 5: Run and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-metrics.test.js

git add scripts/utils/expedition-balance-metrics.mjs tests/node/expedition-balance-metrics.test.js
git commit -m "test(balance): add expedition metric accumulators"
```

---

### Task 4: Cut the Main Simulator Over to Expedition Horizon Semantics

**Files:**
- Modify: `scripts/game-balance-simulation.mjs:229-260, 2519-3720, 3862-4940, 6032-7040, 7063-7268`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add failing report-contract assertions**

Add:

```js
test('expedition report contract uses route semantics, not the legacy day horizon', () => {
  assert.equal(SIMULATION_CONSTANTS.reportVersion, 15)
  assert.equal(SIMULATION_CONSTANTS.seedNamespace, '#roguelite-expedition-v1')
  assert.deepEqual(SIMULATION_CONSTANTS.progressionCheckpointSteps, [2, 4, 6])
  assert.equal('daysPerRun' in SIMULATION_CONSTANTS, false)
})
```

And add a deterministic standard-profile test:

```js
test('same expedition profile and seed reproduces the same outcome', () => {
  const profile = EXPEDITION_BALANCE_PROFILES[0]
  const a = runSingleSimulation(profile, 123456)
  const b = runSingleSimulation(profile, 123456)
  assert.deepEqual(a, b)
})
```

- [ ] **Step 2: Run the focused simulation tests and verify they fail on v14 constants**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js
```

Expected: FAIL because report version/namespace/day contract are still v14.

- [ ] **Step 3: Replace the horizon constants atomically**

Use:

```js
export const SIMULATION_CONSTANTS = {
  reportVersion: 15,
  runsPerScenario: 2000,
  seedNamespace: '#roguelite-expedition-v1',
  progressionCheckpointSteps: [2, 4, 6],
  defensiveMaxIterations: 20,
  homeVenueId: 'stendal_proberaum',
  randomModifierChance: 0.22,
  fameLossBadGig: BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG,
  brandDealEvalChance: 0.14,
  postPulseChance: 0.18,
  trendShiftChance: 0.12,
  contrabandDropChance: 0.11,
  gigEventChance: 0.3,
  assetInvestChance: 0.12,
  moduleInstallChance: 0.15,
  crowdfundChance: 0.04,
  outputJson: REPORT_FILES.outputJson,
  outputMarkdown: REPORT_FILES.outputMarkdown
}
```

Remove code/comments whose correctness depends on `daysPerRun` or `baseGigGapDays`. Do not leave compatibility aliases that make an old test accidentally pass.

- [ ] **Step 4: Make `runSingleSimulation(profile, seed, tuning)` create the production Expedition loadout**

The runner must:

1. create state with `createInitialState()`;
2. grant only the unlock ids required by the profile setup in the simulation state;
3. call the same loadout validator/default builders as Tour Prep;
4. choose production tour/region definitions;
5. generate map depth from the production tour type;
6. start Expedition through the same reducer/action semantics used by production;
7. stop only on `extracted`, `completed`, or `failed`;
8. throw if `defensiveMaxIterations` is reached without a terminal outcome.

Use an invariant guard:

```js
if (iterations >= SIMULATION_CONSTANTS.defensiveMaxIterations) {
  throw new Error(
    `Expedition simulation exceeded ${SIMULATION_CONSTANTS.defensiveMaxIterations} iterations for ${profile.id}`
  )
}
```

Do not classify this as an ordinary run failure; it is a simulator/production logic error and must fail the report generation.

- [ ] **Step 5: Replace day checkpoints with route-step checkpoints**

Timeline checkpoints record the first state at or beyond route step 2, 4, and 6:

```js
for (const step of SIMULATION_CONSTANTS.progressionCheckpointSteps) {
  if (metrics.routeSteps >= step && !checkpointByStep.has(step)) {
    checkpointByStep.set(step, snapshotExpeditionCheckpoint(state, metrics))
  }
}
```

No report field may still label those values as "Tag 3/5/7".

- [ ] **Step 6: Use `EXPEDITION_BALANCE_PROFILES` as the authoritative top-level scenario set**

Replace the population loop with:

```js
for (const profile of EXPEDITION_BALANCE_PROFILES) {
  const runs = []
  for (let runIndex = 0; runIndex < SIMULATION_CONSTANTS.runsPerScenario; runIndex++) {
    const seed = createScenarioSeed(
      `${profile.id}${SIMULATION_CONSTANTS.seedNamespace}`,
      runIndex
    )
    runs.push(runSingleSimulation(profile, seed))
  }
  results.push(buildExpeditionProfileResult(profile, runs))
}
```

Keep the old exported name `SCENARIOS` only if external tests/scripts still import it; if retained, make it a direct alias:

```js
export const SCENARIOS = EXPEDITION_BALANCE_PROFILES
```

Do not keep both independent arrays.

- [ ] **Step 7: Run deterministic simulator tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expedition-balance-profiles.test.js \
  tests/node/expedition-balance-metrics.test.js \
  tests/node/game-balance-simulation.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit the semantic cutover**

```bash
git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "refactor(balance): simulate expedition route horizon"
```

---

### Task 5: Instrument Extraction, Condition, Crew and Pressure in Every Run

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/expedition-balance-metrics.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add a failing telemetry-shape test**

For one deterministic run, assert:

```js
const run = runSingleSimulation(EXPEDITION_BALANCE_PROFILES[0], 123)
assert.ok(['extracted', 'completed', 'failed'].includes(run.expeditionOutcome))
assert.equal(Number.isInteger(run.routeSteps), true)
assert.equal(Number.isFinite(run.securedReward), true)
assert.equal(typeof run.spendByCategory, 'object')
assert.equal(typeof run.conditionMinimums, 'object')
assert.equal(Number.isInteger(run.insuranceClaims), true)
assert.ok(run.starterPerkId === null || typeof run.starterPerkId === 'string')
assert.equal(Number.isInteger(run.legendaryUnlocksEarned), true)
assert.equal(Number.isInteger(run.crewCrises), true)
assert.ok(Array.isArray(run.heatTimeline))
assert.ok(Array.isArray(run.exposureTimeline))
```

- [ ] **Step 2: Record metrics at production ownership points**

Record only after the production action/reducer succeeds. Add these local simulator helpers next to `runSingleSimulation`; they observe settled state and never reimplement production math:

```js
const recordAppliedSpend = (metrics, category, beforeMoney, afterMoney) => {
  const spend = beforeMoney - afterMoney
  if (spend > 0) recordExpeditionSpend(metrics, category, spend)
}

const recordConditionMinimums = (metrics, expedition) => {
  for (const key of ['vehicle', 'pa', 'instruments', 'stageGear']) {
    const value = expedition.condition[key]
    if (Number.isFinite(value)) {
      metrics.conditionMinimums[key] = Math.min(
        metrics.conditionMinimums[key],
        value
      )
    }
  }
}

const recordPressureSnapshot = (metrics, expedition) => {
  metrics.heatTimeline.push(expedition.pressure.heat)
  metrics.exposureTimeline.push(expedition.pressure.exposure)
}
```

Use them only after the owning transition, e.g.:

```js
const beforeRepairMoney = state.player.money
state = gameReducer(state, createResolveExpeditionRepairAction(repairPayload))
recordAppliedSpend(metrics, 'repair', beforeRepairMoney, state.player.money)
recordConditionMinimums(metrics, state.expedition)

const beforePressure = state.expedition.pressure
state = gameReducer(state, pressureAction)
if (state.expedition.pressure !== beforePressure) {
  recordPressureSnapshot(metrics, state.expedition)
}
```

Ownership table:

| Metric | Record after |
|---|---|
| `routeSteps` | successful `RECORD_EXPEDITION_ARRIVAL` |
| `grossReward` | gig/event/contract reward is applied |
| `securedReward` | `FINALIZE_EXPEDITION` result is known |
| repair spend | repair purchase action succeeds |
| supply spend | supply/cargo purchase succeeds |
| insurance premium spend | `START_EXPEDITION` commits `insurancePremiumPaid` |
| insurance claim | `insuranceClaimUsed` transitions `false -> true` |
| starter perk | validated loadout is committed at `START_EXPEDITION` |
| legendary unlock | completed finale persists a previously unowned `expedition.perk.legendary.*` marker |
| condition minima | travel/gig/repair transition settles |
| defects/disabled assets | Condition reducer transition |
| crew crisis/injury | Crew reducer/event settlement |
| Heat/Exposure | pressure reducer transition |
| obligation counts | obligation action transitions |
| rival/authority encounters | event becomes the selected/settled event |
| intel usage | selected route had a revealed detail not available at intel 0 |
| draft offered | `OFFER_EXPEDITION_DRAFT` is accepted by the reducer |
| draft accepted / trait pick | `SELECT_EXPEDITION_DRAFT` appends a new `draftTraitId` |

For the premium, call `recordExpeditionSpend(metrics, 'insurance', state.expedition.insurancePremiumPaid)` once at run start. Do not infer claims from a Condition increase or legendary unlocks from `finaleType`; count the canonical one-shot state/storage transition only.

Never increment a simulator counter before the corresponding production mutation. This prevents the report from claiming an interaction occurred when production rejected it.

- [ ] **Step 3: Preserve ledger reconciliation**

Add:

```js
run.expeditionReconciled =
  Number.isFinite(run.securedReward) &&
  Math.abs(run.securedReward - run.settlementLedger.securedTotal) < 0.01
```

All 2,000 runs in every profile must reconcile. Do not average reconciliation errors away.

- [ ] **Step 4: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js tests/node/expedition-balance-metrics.test.js

git add scripts/game-balance-simulation.mjs scripts/utils/expedition-balance-metrics.mjs tests/node
git commit -m "feat(balance): instrument expedition run systems"
```

---

### Task 6: Replace Legacy KPI Gates with Expedition Safety Gates and Soft Design Review

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

The old `KPI_TARGETS` contain 10-day money bands and Fame-per-gig assumptions. They must not silently remain blocking after the horizon changes.

- [ ] **Step 1: Write failing safety-gate tests**

Add exported definitions:

```js
export const EXPEDITION_SAFETY_GATES = Object.freeze({
  clean_sponsor: Object.freeze({ failureMaxPct: 35 }),
  underground_heat: Object.freeze({ failureMaxPct: 50 }),
  diy_repair: Object.freeze({ failureMaxPct: 40 }),
  scout_intel: Object.freeze({ failureMaxPct: 35 }),
  high_exposure_performance: Object.freeze({ failureMaxPct: 40 }),
  rival_hunter: Object.freeze({ failureMaxPct: 45 })
})
```

Test every profile has exactly one hard failure ceiling and that missing profile coverage fails closed.

These ceilings are broad **playability safety limits**, not desired risk targets.

- [ ] **Step 2: Add invariant hard gates**

For calibration and holdout, hard failure occurs when any profile has:

```text
invalidRouteCount > 0
settlementReconciliationPct < 100
nonFiniteStateCount > 0
negativeProtectedResourceCount > 0
extractionDoubleSettlementCount > 0
staleRunStateAfterResetCount > 0
contractDoubleSettlementCount > 0
severeRepeatProtectionViolationCount > 0
failurePct > profile.failureMaxPct
```

`protectedResource` means values whose production sanitizers require non-negative state (cash after clamp, fuel, condition, cargo counts, supplies/spare parts, stress bounds as applicable). Do not classify intended signed deltas as protected state.

- [ ] **Step 3: Add non-blocking design hypothesis corridors**

Export:

```js
export const EXPEDITION_DESIGN_HYPOTHESES = Object.freeze({
  clean_sponsor: Object.freeze({
    extractedPct: [15, 45],
    completedPct: [40, 75],
    failedPct: [5, 25]
  }),
  underground_heat: Object.freeze({
    extractedPct: [10, 40],
    completedPct: [25, 60],
    failedPct: [15, 40]
  }),
  diy_repair: Object.freeze({
    extractedPct: [15, 45],
    completedPct: [35, 70],
    failedPct: [10, 30]
  }),
  scout_intel: Object.freeze({
    extractedPct: [15, 45],
    completedPct: [40, 75],
    failedPct: [5, 25]
  }),
  high_exposure_performance: Object.freeze({
    extractedPct: [10, 40],
    completedPct: [30, 65],
    failedPct: [10, 30]
  }),
  rival_hunter: Object.freeze({
    extractedPct: [10, 40],
    completedPct: [25, 65],
    failedPct: [10, 35]
  })
})
```

These values express the approved product intent (Extraction should be a real option; finale should be common but not automatic; risky builds should fail more often). A breach creates a design warning, **not** a failing process exit.

- [ ] **Step 4: Add non-blocking subsystem health bands**

Report warnings for:

```js
export const EXPEDITION_SYSTEM_HEALTH = Object.freeze({
  disabledAssetRunsPct: [3, 25],
  crewCrisisRunsPct: [5, 30],
  seriousInjuryRunsPct: [2, 20],
  obligationFailurePct: [10, 50],
  intelInfluencedRoutePctForScout: [15, 80]
})
```

The lower bounds catch systems that technically exist but never matter; upper bounds catch systems that overwhelm every run.

- [ ] **Step 5: Rename report logic so hard vs soft cannot be confused**

Use two exported builders:

```js
buildExpeditionSafetyValidation(...)
buildExpeditionDesignReview(...)
```

Remove expedition use of legacy `checkKpi()`/`KPI_TARGETS`. Leave legacy functions only if another legacy-only report imports them; otherwise delete them and update tests in the same commit.

- [ ] **Step 6: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js

git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "feat(balance): gate expedition safety separately from design"
```

---

### Task 7: Preserve Disjoint 2,000-Run Holdout Validation Under the New Namespace

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add failing holdout contract test**

Assert report metadata states:

```js
assert.equal(holdout.runsPerScenario, 2000)
assert.equal(
  holdout.seedStrategy,
  'profile-id-plus-roguelite-expedition-v1-plus-holdout-marker-plus-run-index'
)
assert.equal(holdout.profileResults.length, EXPEDITION_BALANCE_PROFILES.length)
```

- [ ] **Step 2: Generate holdout seeds with an explicit disjoint marker**

```js
createScenarioSeed(
  `${profile.id}${SIMULATION_CONSTANTS.seedNamespace}#holdout`,
  runIndex
)
```

Do not reuse calibration runs for design warnings or hard safety evaluation.

- [ ] **Step 3: Evaluate hard gates on both cohorts**

The aggregate `passes` value is true only when:

```js
calibrationSafety.passes && holdoutSafety.passes
```

Missing holdout profile data is a hard failure, not `0%` or an empty success.

- [ ] **Step 4: Report stability of soft classifications without blocking on it**

For each soft metric, show calibration classification, holdout classification and whether they agree. A disagreement is a warning requiring investigation/re-run, not an automatic balance change.

- [ ] **Step 5: Run and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js

git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "test(balance): validate expedition on disjoint holdout seeds"
```

---

### Task 8: Build a Paired Extraction Decision Probe

**Files:**
- Create: `scripts/game-balance-expedition-probe.mjs`
- Create: `tests/node/game-balance-expedition-probe.test.js`
- Modify: `package.json`

The main report cannot prove that Extraction is a meaningful decision because players who extract and players who continue reach different states. This probe evaluates both choices from the **same deterministic snapshot**.

- [ ] **Step 1: Write the failing paired-probe test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildExtractionProbeSeed,
  evaluateExtractionPair
} from '../../scripts/game-balance-expedition-probe.mjs'

test('paired extraction branches share the same pre-decision seed identity', () => {
  assert.equal(
    buildExtractionProbeSeed('clean_sponsor', 3, 12),
    buildExtractionProbeSeed('clean_sponsor', 3, 12)
  )
})

test('paired extraction result reports both secured outcomes', () => {
  const result = evaluateExtractionPair({
    extractSecuredReward: 700,
    continueSecuredReward: 900,
    continueFailed: false
  })
  assert.deepEqual(result, {
    extractSecuredReward: 700,
    continueSecuredReward: 900,
    continueFailed: false,
    continuePremium: 200,
    continuePremiumPct: 28.57
  })
})
```

- [ ] **Step 2: Add the probe seed namespace**

Use:

```js
export const EXTRACTION_PROBE_NAMESPACE =
  '#roguelite-expedition-v1#paired-extraction'
export const EXTRACTION_PROBE_RUNS_PER_PROFILE = 2000
```

At each configured extraction step, capture a serializable state snapshot and deterministic RNG continuation token. Branch A finalizes extraction immediately. Branch B continues from the same snapshot with the profile's normal policy. The two branches must not share mutable objects.

- [ ] **Step 3: Add `structuredClone` boundary test**

Pin branch isolation in `tests/node/game-balance-expedition-probe.test.js`:

```js
test('paired extraction branches do not share mutable state', () => {
  const source = makeProbeSnapshot({
    money: 1200,
    expedition: {
      routeStep: 3,
      cargo: { spareParts: 2, supplies: 1 },
      pressure: { heat: 35, exposure: 20 }
    }
  })
  const extractBranch = structuredClone(source)
  const continueBranch = structuredClone(source)

  continueBranch.expedition.cargo.spareParts = 0
  continueBranch.expedition.pressure.heat = 90

  assert.equal(extractBranch.expedition.cargo.spareParts, 2)
  assert.equal(extractBranch.expedition.pressure.heat, 35)
  assert.deepEqual(source, extractBranch)
})
```

The production probe must create both branches with `structuredClone(snapshot)` before either branch runs. RNG continuation state is copied into each branch separately as part of the snapshot.

- [ ] **Step 4: Report extraction decision metrics**

For each profile/extraction step report:

- immediate secured reward,
- continue secured reward,
- Continue failure probability,
- Continue reward premium absolute and percent,
- P10/P50/P90 premium,
- share where Continue wins,
- share where Extract wins,
- share where rewards are within 10%.

The desired outcome is **not** 50/50. The hard diagnostic only flags dominance when one decision wins on secured reward in `>= 90%` of paired states in both calibration and holdout at every extraction window.

- [ ] **Step 5: Add package script**

```json
"simulate:balance:expedition-probe": "node --import tsx scripts/game-balance-expedition-probe.mjs"
```

The script writes:

```text
reports/game-balance-expedition-probe-results.json
reports/game-balance-expedition-probe-analysis.md
```

- [ ] **Step 6: Run focused test and probe smoke mode**

Support `--runs 20` for local smoke execution without changing the default 2,000-run report contract:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-expedition-probe.test.js
node --import tsx scripts/game-balance-expedition-probe.mjs --runs 20
```

Expected: PASS; smoke report contains all six profiles and configured extraction windows.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-expedition-probe.mjs tests/node/game-balance-expedition-probe.test.js package.json
git commit -m "feat(balance): add paired expedition extraction probe"
```

---

### Task 9: Add Strategy-Dominance Detection

**Files:**
- Modify: `scripts/utils/expedition-balance-metrics.mjs`
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/expedition-balance-metrics.test.js`

A strategy is a release blocker only when it is **materially better on reward and safety** in both calibration and holdout. Small rank changes are not dominance.

- [ ] **Step 1: Write failing dominance tests**

```js
const dominant = {
  id: 'a',
  avgSecuredReward: 1250,
  failedPct: 10
}
const weaker = {
  id: 'b',
  avgSecuredReward: 1000,
  failedPct: 17
}
assert.equal(isMateriallyDominant(dominant, weaker), true)

assert.equal(
  isMateriallyDominant(
    { id: 'a', avgSecuredReward: 1080, failedPct: 10 },
    weaker
  ),
  false
)
```

- [ ] **Step 2: Implement the exact materiality rule**

```js
export const STRATEGY_DOMINANCE_THRESHOLDS = Object.freeze({
  securedRewardAdvantagePct: 20,
  failureRateAdvantagePoints: 5
})
```

`A` dominates `B` only if:

```text
A.avgSecuredReward >= B.avgSecuredReward * 1.20
AND
A.failedPct <= B.failedPct - 5 percentage points
```

A **blocking** dominance finding requires the same ordered pair `A > B` in both calibration and holdout.

This intentionally catches obvious best-of-both-worlds builds without pretending six deliberately different strategies should have identical expected value.

- [ ] **Step 3: Report a Pareto table**

Markdown columns:

```text
Profile | Avg Secured Reward | Failure % | Extraction % | Completion % | Calibration Dominates | Holdout Dominates | Gate
```

- [ ] **Step 4: Run and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-balance-metrics.test.js tests/node/game-balance-simulation.test.js

git add scripts/utils/expedition-balance-metrics.mjs scripts/game-balance-simulation.mjs tests/node
git commit -m "feat(balance): detect expedition strategy dominance"
```

---

### Task 10: Convert Experiments from Legacy Day Levers to Expedition Levers

**Files:**
- Modify: `scripts/game-balance-experiment-config.mjs`
- Modify: `scripts/game-balance-experiments.mjs`
- Modify: `tests/node/game-balance-experiments.test.js`

The current experiment config encodes `through day 3/5`, repeat-gig windows, and legacy 10-day controls. Those levers no longer answer the Expedition design question after v15.

- [ ] **Step 1: Replace the legacy experiment inventory test**

Pin these candidate families:

```text
extraction_retention
road_wear
repair_cost
crew_stress
exposure_gain
pressure_event_rate
```

Each family must include a neutral no-op candidate and at least two bounded interventions.

- [ ] **Step 2: Define bounded candidates**

Use these initial candidate values:

```js
export const EXPEDITION_EXPERIMENTS = Object.freeze({
  extractionRetention: [
    { id: 'retention-none', multiplier: 1 },
    { id: 'retention-90', multiplier: 0.9 },
    { id: 'retention-80', multiplier: 0.8 }
  ],
  roadWear: [
    { id: 'road-wear-none', multiplier: 1 },
    { id: 'road-wear-115', multiplier: 1.15 },
    { id: 'road-wear-130', multiplier: 1.3 }
  ],
  repairCost: [
    { id: 'repair-cost-none', multiplier: 1 },
    { id: 'repair-cost-115', multiplier: 1.15 },
    { id: 'repair-cost-130', multiplier: 1.3 }
  ],
  crewStress: [
    { id: 'crew-stress-none', multiplier: 1 },
    { id: 'crew-stress-110', multiplier: 1.1 },
    { id: 'crew-stress-125', multiplier: 1.25 }
  ],
  exposureGain: [
    { id: 'exposure-none', multiplier: 1 },
    { id: 'exposure-115', multiplier: 1.15 },
    { id: 'exposure-130', multiplier: 1.3 }
  ],
  pressureEventRate: [
    { id: 'pressure-events-none', multiplier: 1 },
    { id: 'pressure-events-115', multiplier: 1.15 },
    { id: 'pressure-events-130', multiplier: 1.3 }
  ]
})
```

- [ ] **Step 3: Preserve selection discipline**

Keep the search/validation flow explicit in `scripts/game-balance-experiments.mjs`:

```js
const calibrationResults = candidates.map(candidate => ({
  candidate,
  result: evaluateCandidate(candidate, { seedStream: 'calibration' })
}))

const selected = selectCandidateFromCalibration(calibrationResults, {
  preferNeutralCandidate: true
})

const validation = evaluateCandidate(selected.candidate, {
  seedStream: 'validation',
  abortOnBreach: false
})

return { calibrationResults, selected: selected.candidate, validation }
```

`selectCandidateFromCalibration` never accepts validation rows. If validation breaches a hard cap, emit the existing `no-production-recommendation-final-validation-failed` result and stop; do not search for a replacement on the validation stream.

- [ ] **Step 4: Change experiment acceptance metrics**

Replace legacy end-money/day objectives with explicit v15 selectors in `scripts/game-balance-experiment-config.mjs`:

```js
export const EXPEDITION_EXPERIMENT_OBJECTIVES = Object.freeze({
  roadWear: {
    primaryMetric: 'avgRepairInteractions',
    guardrailMetric: 'failureRate',
    direction: 'increase_primary_without_guardrail_breach'
  },
  repairCost: {
    primaryMetric: 'repairSpendSharePct',
    guardrailMetric: 'professionalRepairUsagePct',
    direction: 'increase_primary_keep_guardrail_nonzero'
  },
  crewStress: {
    primaryMetric: 'crewCrisisRunsPct',
    guardrailMetric: 'crewRoleConcentrationPct',
    direction: 'increase_primary_limit_concentration'
  },
  exposureGain: {
    primaryMetric: 'pressureEventDifferentiationPct',
    guardrailMetric: 'completionRate',
    direction: 'increase_primary_without_guardrail_breach'
  },
  extractionRetention: {
    primaryMetric: 'continueDecisionWinSharePct',
    guardrailMetric: 'continueFailurePct',
    direction: 'avoid_decision_dominance'
  }
})
```

`game-balance-experiments.mjs` resolves these metrics from the v15 report/probe result; missing or non-finite metrics fail the candidate closed instead of being treated as zero. Candidate selection remains calibration-only, then the selected configuration is measured once on holdout.

- [ ] **Step 5: Run experiments tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-experiments.test.js tests/node/game-balance-simulation.test.js
```

Expected: PASS; no test refers to day 3/day 5 legacy windows.

- [ ] **Step 6: Commit**

```bash
git add scripts/game-balance-experiment-config.mjs scripts/game-balance-experiments.mjs tests/node/game-balance-experiments.test.js
git commit -m "refactor(balance): retarget experiments to expedition systems"
```

---

### Task 11: Update Report Rendering for Decision-Relevant Expedition Sections

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`

- [ ] **Step 1: Add a Markdown snapshot assertion for required headings**

The generated report must contain exactly these new analytical sections:

```text
## Expedition-Ergebnisübersicht
## Extraction & Push-your-Luck
## Cash-Sinks nach Kategorie
## Insurance & Starter-Perks
## Condition, Defekte & Reparaturen
## Crew-Stress & Verletzungen
## Heat, Exposure & Obligations
## Rivalen, Behörden & Finales
## Fog-of-War & Scouting
## Strategie-Paretovergleich
## Harte Expedition-Sicherheitsgrenzen (Holdout)
## Weiche Expedition-Designhypothesen
```

- [ ] **Step 2: Remove legacy labels that would misstate the new horizon**

The v15 report must not contain:

```text
Tage je Run
Geld Tag 3
Geld Tag 5
Geld Tag 7
10-Tage-Tour
```

Historical v14 files keep those terms unchanged.

- [ ] **Step 3: Render route-step progression**

Use:

```text
Ø Geld/Condition/Heat nach Schritt 2
Ø ... nach Schritt 4
Ø ... nach Schritt 6
```

and show sample size for profiles that ended before a checkpoint. Do not treat missing late checkpoints as zero.

- [ ] **Step 4: Render insurance/perk trade-offs explicitly**

For each profile show `starterPerkId`, insurance policy/take rate, average insurance premium spend, claim-run percentage, completion/failure rate, secured reward, and legendary unlock incidence. Also render an aggregate starter-perk comparison. A zero-insurance profile remains a valid row; never divide only by insured runs when reporting the overall claim-run percentage.

```js
const insuranceAndPerkRows = profileResults.map(row => ({
  profileId: row.profileId,
  starterPerkId: row.starterPerkId ?? 'none',
  insurancePolicyId: row.insurancePolicyId ?? 'none',
  avgInsuranceSpend: row.avgInsuranceSpend,
  insuranceClaimRunsPct: row.insuranceClaimRunsPct,
  completedPct: row.completedPct,
  failedPct: row.failedPct,
  avgSecuredReward: row.avgSecuredReward,
  legendaryUnlockRate: row.legendaryUnlockRate
}))
```

Pass these rows to the existing Markdown table helper; do not introduce a second report renderer.

- [ ] **Step 5: Render distribution statistics, not only means**

At minimum for secured reward, minimum vehicle condition, max Heat and crew stress include:

```text
Mean | Median | P10 | P90
```

- [ ] **Step 6: Run focused test and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js

git add scripts/game-balance-simulation.mjs tests/node/game-balance-simulation.test.js
git commit -m "feat(balance): report expedition decision metrics"
```

---

### Task 12: Expand Provenance Coverage to Every Expedition Balance Source

**Files:**
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Modify: `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing required-source assertions**

Add the exact new production/report sources to `REQUIRED_SOURCES`, including at minimum:

```js
[
  'src/data/expedition/tourTypes.ts',
  'src/data/expedition/regions.ts',
  'src/data/expedition/crew.ts',
  'src/data/expedition/contracts.ts',
  'src/data/expedition/pressureModifiers.ts',
  'src/data/expedition/insurance.ts',
  'src/data/expedition/starterPerks.ts',
  'src/data/expedition/runTraits.ts',
  'src/domain/expedition/runDrafts.ts',
  'src/domain/expedition/extraction.ts',
  'src/domain/expedition/loadout.ts',
  'src/domain/expedition/nodeIntel.ts',
  'src/domain/expedition/insurance.ts',
  'src/domain/expedition/starterPerks.ts',
  'src/domain/expedition/condition.ts',
  'src/domain/expedition/repairs.ts',
  'src/domain/expedition/crew.ts',
  'src/domain/expedition/pressure.ts',
  'src/domain/expedition/contracts.ts',
  'src/domain/expedition/finale.ts',
  'src/utils/mapGenerator.ts',
  'src/utils/eventEngine/eventSelection.ts',
  'src/utils/assetConfig.ts',
  'src/utils/assetModuleRegistry.ts',
  'scripts/utils/expedition-balance-profiles.mjs',
  'scripts/utils/expedition-balance-metrics.mjs',
  'scripts/game-balance-expedition-probe.mjs'
]
```

The paths above are the canonical paths defined by G1-G5. A missing path is a failing provenance test, not a reason to add a compatibility stub.

- [ ] **Step 2: Add all influencing sources to `BALANCE_SOURCE_FILES`**

`BALANCE_SOURCE_FILES` is already `Object.freeze([...])`. Insert these exact literals into that existing array **before its closing `])`**; do not mutate the frozen export at runtime:

```js
  'src/data/expedition/tourTypes.ts',
  'src/data/expedition/regions.ts',
  'src/data/expedition/crew.ts',
  'src/data/expedition/contracts.ts',
  'src/data/expedition/pressureModifiers.ts',
  'src/data/expedition/insurance.ts',
  'src/data/expedition/starterPerks.ts',
  'src/data/expedition/runTraits.ts',
  'src/domain/expedition/runDrafts.ts',
  'src/domain/expedition/extraction.ts',
  'src/domain/expedition/loadout.ts',
  'src/domain/expedition/nodeIntel.ts',
  'src/domain/expedition/vehicle.ts',
  'src/domain/expedition/cargo.ts',
  'src/domain/expedition/insurance.ts',
  'src/domain/expedition/starterPerks.ts',
  'src/domain/expedition/condition.ts',
  'src/domain/expedition/repairs.ts',
  'src/domain/expedition/crew.ts',
  'src/domain/expedition/crewStress.ts',
  'src/domain/expedition/injuries.ts',
  'src/domain/expedition/pressure.ts',
  'src/domain/expedition/pressureDirector.ts',
  'src/domain/expedition/contracts.ts',
  'src/domain/expedition/rivals.ts',
  'src/domain/expedition/finale.ts',
  'src/domain/expedition/regionProfile.ts',
  'src/domain/expedition/tourPressure.ts',
  'src/utils/mapGenerator.ts',
  'src/utils/eventEngine/eventSelection.ts',
  'src/utils/eventEngine/eventEffectHandlers.ts',
  'src/utils/assetConfig.ts',
  'src/utils/assetModuleRegistry.ts',
  'scripts/utils/expedition-balance-profiles.mjs',
  'scripts/utils/expedition-balance-metrics.mjs',
```

Before committing, sort/position them consistently with the existing source-group comments and remove literals already present (`src/utils/mapGenerator.ts`, `src/utils/eventEngine/eventSelection.ts`, `src/utils/eventEngine/eventEffectHandlers.ts`, `src/utils/assetConfig.ts`, or `src/utils/assetModuleRegistry.ts` if the current list already contains them). The test must assert the final frozen list has no duplicate strings. Keep UI/localization files out because the simulator does not read them.

- [ ] **Step 3: Update generator fingerprints**

Main report generator paths:

```js
[
  'scripts/game-balance-simulation.mjs',
  'scripts/utils/expedition-balance-profiles.mjs',
  'scripts/utils/expedition-balance-metrics.mjs',
  'scripts/utils/balance-report-metadata.mjs'
]
```

Paired probe generator paths also include `scripts/game-balance-expedition-probe.mjs`.

- [ ] **Step 4: Run provenance tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/balanceSourceFiles.test.js
```

Expected: every listed file exists, no duplicates, source hash stable.

- [ ] **Step 5: Commit**

```bash
git add scripts/utils/balance-report-metadata.mjs tests/node/balanceSourceFiles.test.js
git commit -m "chore(balance): fingerprint expedition balance sources"
```

---

### Task 13: Generate Fresh v15 Calibration, Holdout and Paired-Probe Artifacts

**Files:**
- Regenerate: `reports/game-balance-simulation-results.json`
- Regenerate: `reports/game-balance-simulation-analysis.md`
- Regenerate: `reports/game-balance-simulation-baseline.json`
- Regenerate: `reports/game-balance-experiments-results.json`
- Regenerate: `reports/game-balance-experiments-analysis.md`
- Create/Regenerate: `reports/game-balance-expedition-probe-results.json`
- Create/Regenerate: `reports/game-balance-expedition-probe-analysis.md`

- [ ] **Step 1: Generate the authoritative v15 report**

```bash
pnpm run simulate:balance
```

Expected:

- 6/6 profiles have 2,000 calibration runs;
- 6/6 profiles have 2,000 holdout runs;
- report version is 15;
- seed namespace is `#roguelite-expedition-v1`;
- hard safety section has no missing profile coverage.

- [ ] **Step 2: Generate the paired extraction probe**

```bash
pnpm run simulate:balance:expedition-probe
```

Expected: every configured extraction window has 2,000 paired states per applicable profile; no branch-shared-state failure.

- [ ] **Step 3: Run experiment selection**

```bash
pnpm run simulate:balance:experiments
```

Expected: experiment report uses Expedition candidate families and disjoint selection/holdout semantics.

- [ ] **Step 4: Write a v15 baseline only after reviewing the report**

```bash
pnpm run simulate:balance:baseline
```

The written baseline is v15 and becomes the future regression comparator. The frozen v14 historical artifacts remain untouched.

- [ ] **Step 5: Verify baseline comparison is self-consistent**

```bash
pnpm run simulate:balance:compare
```

Expected: freshly generated v15 report compared to the freshly written v15 baseline has zero regression deltas within deterministic precision.

- [ ] **Step 6: Commit generated artifacts**

```bash
git add reports package.json
git commit -m "chore(balance): publish expedition v15 baseline"
```

---

### Task 14: Add the Final G6 Release Gate

**Files:**
- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `tests/node/game-balance-expedition-probe.test.js`
- Modify: `package.json` only if a dedicated aggregate script is preferred

- [ ] **Step 1: Make generated-artifact safety status testable**

Add a test that reads the committed v15 report and asserts:

```js
assert.equal(report.constants.reportVersion, 15)
assert.equal(report.holdoutSafetyValidation.passes, true)
assert.equal(report.strategyDominance.blockingFindings.length, 0)
assert.equal(report.metadata.runsPerScenario, 2000)
assert.equal(report.metadata.seedNamespace, '#roguelite-expedition-v1')
```

- [ ] **Step 2: Make extraction dominance testable**

Read the committed paired-probe report and assert:

```js
assert.equal(probe.runsPerProfile, 2000)
assert.equal(probe.blockingDecisionDominance.length, 0)
```

If this fails, do **not** relax the 90% dominance definition in the test. Investigate/tune the production retention/reward/risk mechanics through the experiment workflow.

- [ ] **Step 3: Run targeted balance tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expedition-balance-profiles.test.js \
  tests/node/expedition-balance-metrics.test.js \
  tests/node/game-balance-expedition-probe.test.js \
  tests/node/game-balance-simulation.test.js \
  tests/node/game-balance-experiments.test.js \
  tests/node/balanceSourceFiles.test.js
```

Expected: PASS.

- [ ] **Step 4: Run repository-wide release gates**

```bash
pnpm run typecheck:core
pnpm run typecheck
pnpm run test:all
pnpm run test:additional
pnpm run deadcode:check
pnpm run deadcode:budget
pnpm run symbols:update
pnpm run symbols:check
pnpm run test:e2e
```

Expected:

- all commands exit 0;
- `symbols:check` is clean after update;
- dead-code budget does not regress unexpectedly;
- Expedition core journey remains playable in E2E.

- [ ] **Step 5: Re-run authoritative reports from the exact release tree**

```bash
pnpm run simulate:balance
pnpm run simulate:balance:expedition-probe
pnpm run simulate:balance:experiments
```

Expected: generated source/generator fingerprints match the final release tree and `workingTreeDirty` is false when run from the clean branch.

- [ ] **Step 6: Commit only if regenerated artifacts are from the final source state**

```bash
git add reports tests scripts package.json
git commit -m "test(balance): enforce expedition release gates"
```

If the final report says `workingTreeDirty: true`, do not treat the artifacts as release evidence; commit source changes first, regenerate on the clean commit, then commit the generated report in the intended artifact commit flow used by this repository.

---

## G6 Exit Criteria

G6 is complete only when all of the following are true:

- Report v14 remains preserved as immutable pre-Expedition historical evidence.
- Main balance report is v15 with `#roguelite-expedition-v1` and no legacy `daysPerRun` horizon semantics.
- Six canonical strategy profiles use production-valid loadout/region/tour ids.
- Every profile has 2,000 calibration and 2,000 disjoint holdout runs.
- Extraction, Condition, Crew, Pressure, Rival, Fog-of-War and obligation metrics are present and reconciled.
- No hard safety gate fails on calibration or holdout.
- No profile materially dominates another by both `>=20%` secured reward and `>=5pp` lower failure in both calibration and holdout.
- No Extract/Continue choice wins `>=90%` of paired states at every extraction window in both cohorts.
- Soft design-hypothesis warnings are explicitly visible and are not mislabeled as safety failures.
- Experiment selection is calibration-only and holdout remains validation-only.
- Every production source that can move report output is included in the source fingerprint.
- Fresh v15 baseline compares deterministically to itself.
- Full type/test/dead-code/symbol/E2E gates pass.
- Final report/probe fingerprints correspond to the exact release source state.

---

## Recalibration Decision Rule After G6

Do not tune production numbers merely because a soft band is red. Use this order:

1. **Correctness first:** fix any invariant/reconciliation/provenance failure.
2. **Dominance second:** if one build or extraction choice is clearly dominant under the blocking definitions, run the bounded experiment family that owns that lever.
3. **System activity third:** if a mechanic is below its soft lower bound, raise its opportunity/frequency before increasing punishment magnitude.
4. **Overload fourth:** if a mechanic is above its soft upper bound, reduce repeat frequency/cooldown pressure before reducing player agency.
5. **Playtest validation:** only promote soft design hypotheses into hard product corridors after real-player sessions confirm that the measured ranges correspond to the intended 20–30 minute tension curve.

This keeps the simulator as evidence for design decisions rather than allowing the simulator's own initial assumptions to become self-fulfilling balance targets.
