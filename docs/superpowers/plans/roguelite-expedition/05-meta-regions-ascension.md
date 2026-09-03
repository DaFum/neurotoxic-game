# Meta Hub, Regions, Tour Types, Unlocks, and Ascension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Expedition career loop with short between-tour progression, mechanically distinct regions/tour archetypes, HQ facilities, discovery archive, persistent unlock sets, starter/legendary rule-changing perks, and modular Tour Pressure modifiers that broaden strategic options without turning permanent progression into runaway stat power.

**Architecture:** Capability unlocks remain in the existing unlock system (`unlockManager` + `state.unlocks`); `career` stores counters, rank, Tour Tokens, facility levels, archive/discovery, crew/rival progression, and Ascension state. Starter perks are selected through the existing `expedition.loadout.starterPerkId`; their effects are composed by the owning domain helpers rather than inspected inside reducers. Legendary finale rewards persist as direct namespaced unlock markers and never become large universal stat boosts. Band HQ gains one Expedition meta tab rather than a duplicate base-management scene. Region/tour definitions feed `TourPrep`, map generation, pressure/wear/reward profiles, and the simulator. `MapGenerator` gets optional node-type weights while preserving the current default branch exactly when no profile is supplied.

**Tech Stack:** React 19, TypeScript 6, existing Band HQ UI, current unlock manager/storage adapter, existing assets/map generator, reducer/action architecture, i18next, Node/Vitest/Playwright, balance simulator.

---

## Depends On

- G4 Pressure/Rivals/Contracts merged.
- Run Summary and `PREPARE_NEXT_EXPEDITION` lifecycle exist.
- Career save state exists.
- Existing unlock persistence and Band HQ remain stable.

## File Structure

**Create:**

- `src/types/meta.d.ts`
- `src/data/expedition/regions.ts` (extend baseline file from G1)
- `src/data/expedition/tourTypes.ts` (extend baseline file from G1)
- `src/data/expedition/pressureModifiers.ts`
- `src/data/expedition/unlockSets.ts`
- `src/data/expedition/starterPerks.ts`
- `src/domain/expedition/career.ts`
- `src/domain/expedition/regionProfile.ts`
- `src/domain/expedition/tourPressure.ts`
- `src/domain/expedition/archive.ts`
- `src/domain/expedition/starterPerks.ts`
- `src/ui/bandhq/ExpeditionMetaTab.tsx`
- `src/ui/expedition/CareerProgress.tsx`
- `src/ui/expedition/RegionPicker.tsx`
- `src/ui/expedition/TourTypePicker.tsx`
- `src/ui/expedition/PressureModifierPicker.tsx`
- `src/ui/expedition/TourArchive.tsx`
- `tests/node/expeditionCareer.test.js`
- `tests/node/expeditionRegionProfile.test.js`
- `tests/node/expeditionTourPressure.test.js`
- `tests/node/expeditionUnlockSets.test.js`
- `tests/node/expeditionStarterPerks.test.js`
- `tests/node/expeditionArchive.test.js`
- `tests/ui/ExpeditionMetaTab.test.tsx`
- `tests/ui/ExpeditionRegionPicker.test.tsx`
- `tests/ui/ExpeditionPressureModifierPicker.test.tsx`
- `tests/golden-path/expeditionMetaLoop.test.js`

**Modify:**

- `src/types/index.ts`
- `src/types/career.d.ts`
- `src/types/expedition.d.ts`
- `src/utils/mapGenerator.ts`
- `src/utils/mapGenerator/types.ts`
- `src/context/useMapGeneration.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/careerActionCreators.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/useGameDispatchActions.ts`
- `src/context/actionCreators.ts`
- `src/ui/bandhq/BandHQTabsList.tsx`
- `src/ui/bandhq/BandHQContentArea.tsx`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/RunSummaryCard.tsx`
- `src/scenes/RunSummary.tsx`
- `src/scenes/TourPrep.tsx`
- `src/hooks/postGig/handlers/continueHandlerUtils.ts`
- `src/utils/assetConfig.ts` only if HQ facility display needs existing chassis metadata; do not duplicate chassis prices
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/unlocks.json`
- `public/locales/de/unlocks.json`
- `scripts/game-balance-simulation.mjs`
- `scripts/utils/balance-report-metadata.mjs`
- map/BandHQ/unlock/save tests

---

### Task 1: Add Career Counters and Explicit HQ Facility Levels

**Files:**
- Modify: `src/types/career.d.ts`
- Create: `src/types/meta.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionCareer.test.js`
- Test: `tests/node/saveSliceRoundTrip.test.js`

- [ ] **Step 1: Write failing default/sanitizer tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createDefaultCareerState } from '../../src/domain/expedition/defaults.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'

test('career has bounded progression counters and six HQ facilities', () => {
  const career = createDefaultCareerState()
  assert.deepEqual(career.stats, {
    successfulExtractions: 0,
    finaleCompletions: 0,
    failedRuns: 0,
    regionsCompleted: {}
  })
  assert.deepEqual(career.hqFacilityLevels, {
    workshop: 0,
    rehearsal: 0,
    management: 0,
    garage: 0,
    blackMarket: 0,
    crewLounge: 0
  })
  assert.deepEqual(career.settledRunIds, [])
})

test('career sanitizer rejects hostile facility keys and negative counters', () => {
  const career = sanitizeCareerState({
    stats: { successfulExtractions: -5 },
    hqFacilityLevels: { workshop: 2, __proto__: 99 }
  })
  assert.equal(career.stats.successfulExtractions, 0)
  assert.equal(career.hqFacilityLevels.workshop, 2)
  assert.equal(Object.hasOwn(career.hqFacilityLevels, '__proto__'), false)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/saveSliceRoundTrip.test.js
```

Expected: FAIL because stats/facility schema is not complete.

- [ ] **Step 3: Add exact types**

`src/types/meta.d.ts`:

```ts
export type ExpeditionCareerRankId =
  | 'unknown'
  | 'local_noise'
  | 'underground_act'
  | 'rising_band'
  | 'touring_force'
  | 'headliner'
  | 'cult_legend'

export type HqFacilityId =
  | 'workshop'
  | 'rehearsal'
  | 'management'
  | 'garage'
  | 'blackMarket'
  | 'crewLounge'

export interface ExpeditionCareerStats {
  successfulExtractions: number
  finaleCompletions: number
  failedRuns: number
  regionsCompleted: Record<string, number>
}
```

Update `CareerState`:

```ts
rankId: ExpeditionCareerRankId
stats: ExpeditionCareerStats
hqFacilityLevels: Record<HqFacilityId, number>
settledRunIds: string[]
```

Default all counters/facilities to zero and `settledRunIds` to `[]`. Facility levels clamp to integer `0..3`; the sanitizer accepts only non-empty string run ids, deduplicates them, and keeps the newest 64.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/meta.d.ts src/types/career.d.ts src/types/index.ts src/domain/expedition/defaults.ts src/context/reducers/careerSanitizers.ts tests/node/expeditionCareer.test.js tests/node/saveSliceRoundTrip.test.js
git commit -m "feat(expedition): add career stats and HQ facilities"
```

---

### Task 2: Define Rank Progression From Mixed Career Achievements

**Files:**
- Create: `src/domain/expedition/career.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Test: `tests/node/expeditionCareer.test.js`

- [ ] **Step 1: Add failing rank tests**

```js
import {
  calculateCareerRank,
  getRunCareerReward
} from '../../src/domain/expedition/career.ts'

test('rank cannot be farmed from fame alone', () => {
  assert.equal(calculateCareerRank({
    successfulExtractions: 0,
    finaleCompletions: 0,
    failedRuns: 0,
    regionsCompleted: {},
    rivalMilestones: 0
  }), 'unknown')
})

test('mixed accomplishments advance rank', () => {
  assert.equal(calculateCareerRank({
    successfulExtractions: 3,
    finaleCompletions: 1,
    failedRuns: 2,
    regionsCompleted: { home: 1 },
    rivalMilestones: 0
  }), 'local_noise')
  assert.equal(calculateCareerRank({
    successfulExtractions: 12,
    finaleCompletions: 6,
    failedRuns: 4,
    regionsCompleted: { home: 2, industrial: 2, festival: 2 },
    rivalMilestones: 2
  }), 'touring_force')
})

test('run career reward favors completion but gives extraction progress', () => {
  assert.deepEqual(getRunCareerReward('extracted'), { tourTokens: 1 })
  assert.deepEqual(getRunCareerReward('completed'), { tourTokens: 3 })
  assert.deepEqual(getRunCareerReward('failed'), { tourTokens: 0 })
})
```

- [ ] **Step 2: Implement exact rank thresholds**

Use ordered requirements:

```ts
const RANK_REQUIREMENTS = [
  { id: 'cult_legend', extractions: 30, finales: 20, regions: 4, rivals: 4 },
  { id: 'headliner', extractions: 24, finales: 14, regions: 4, rivals: 3 },
  { id: 'touring_force', extractions: 12, finales: 6, regions: 3, rivals: 2 },
  { id: 'rising_band', extractions: 8, finales: 3, regions: 2, rivals: 1 },
  { id: 'underground_act', extractions: 5, finales: 2, regions: 1, rivals: 0 },
  { id: 'local_noise', extractions: 3, finales: 1, regions: 1, rivals: 0 }
] as const
```

A region counts when `regionsCompleted[id] > 0`. Rival milestones count persistent rivals at `rival`/`nemesis`/`respect`/`alliance` with encounterCount `>=3`.

- [ ] **Step 3: Add `RECORD_EXPEDITION_CAREER_RESULT` action**

Payload is derived from `expedition.outcome` and current region:

```ts
export interface RecordExpeditionCareerResultPayload {
  outcome: 'extracted' | 'completed' | 'failed'
  regionId: string
  tourTokens: number
  nextRankId: ExpeditionCareerRankId
}
```

Reducer increments one matching counter, region completion only for `completed`, adds Tour Tokens, and sets calculated rank. Replay is prevented by adding `careerResultRecorded: boolean` to `ExpeditionOutcome` or a top-level settlement marker; reuse the same idempotence pattern as Extraction.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/career.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/types/actions.d.ts src/types/expedition.d.ts tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): record career progression"
```

---

### Task 3: Persist Unlock Sets Atomically Through One Existing Unlock Marker

**Files:**
- Create: `src/data/expedition/unlockSets.ts`
- Modify: `src/types/career.d.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/useGameDispatchActions.ts`
- Modify: `src/context/actionCreators.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionUnlockSets.test.js`
- Test: `tests/node/unlockManager.test.js`, `tests/utils/unlockManager.test.ts`, `tests/security/unlocksValidation.test.js`

The existing unlock storage writes one marker at a time. Do **not** persist every capability in a set independently: a mid-loop storage failure would grant a partially free set. Persist exactly one `expedition.set.*` marker per purchased set and derive its capabilities in pure code.

- [ ] **Step 1: Add failing unlock-set and capability tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_UNLOCK_SETS,
  isExpeditionCapabilityUnlocked
} from '../../src/data/expedition/unlockSets.ts'

test('every unlock set owns one namespaced marker', () => {
  const markers = EXPEDITION_UNLOCK_SETS.map(set => set.unlockId)
  assert.ok(markers.every(id => id.startsWith('expedition.set.')))
  assert.equal(new Set(markers).size, markers.length)
})

test('a purchased set expands to its capabilities without extra storage markers', () => {
  assert.equal(
    isExpeditionCapabilityUnlocked(
      ['expedition.set.mechanic_network'],
      'expedition.region.industrial'
    ),
    true
  )
  assert.equal(
    isExpeditionCapabilityUnlocked([], 'expedition.region.industrial'),
    false
  )
})
```

- [ ] **Step 2: Define exact initial sets**

```ts
export const EXPEDITION_UNLOCK_SETS = Object.freeze([
  {
    id: 'mechanic_network',
    unlockId: 'expedition.set.mechanic_network',
    tokenCost: 4,
    requiredRank: 'local_noise',
    capabilityIds: [
      'expedition.region.industrial',
      'expedition.tour.survival',
      'expedition.perk.mechanic_kit'
    ]
  },
  {
    id: 'industry_network',
    unlockId: 'expedition.set.industry_network',
    tokenCost: 5,
    requiredRank: 'underground_act',
    capabilityIds: [
      'expedition.crew.crew_leyla_manager',
      'expedition.region.corporate',
      'expedition.tour.corporate',
      'expedition.perk.press_pass'
    ]
  },
  {
    id: 'underground_network',
    unlockId: 'expedition.set.underground_network',
    tokenCost: 5,
    requiredRank: 'underground_act',
    capabilityIds: [
      'expedition.crew.crew_saskia_security',
      'expedition.region.underground',
      'expedition.tour.underground',
      'expedition.perk.underground_contact'
    ]
  },
  {
    id: 'festival_network',
    unlockId: 'expedition.set.festival_network',
    tokenCost: 5,
    requiredRank: 'rising_band',
    capabilityIds: [
      'expedition.region.festival',
      'expedition.tour.blitz'
    ]
  },
  {
    id: 'rival_network',
    unlockId: 'expedition.set.rival_network',
    tokenCost: 6,
    requiredRank: 'touring_force',
    capabilityIds: ['expedition.tour.rival_hunt']
  }
] as const)
```

- [ ] **Step 3: Add one pure capability resolver**

```ts
export const isExpeditionCapabilityUnlocked = (
  unlocks: readonly string[],
  capabilityId: string
): boolean => {
  if (unlocks.includes(capabilityId)) return true
  return EXPEDITION_UNLOCK_SETS.some(
    set => unlocks.includes(set.unlockId) && set.capabilityIds.includes(capabilityId)
  )
}
```

G2/G3/G5 loadout availability uses this helper for Expedition capabilities. Baseline `home`, `standard`, and the four starter crew remain explicit always-available exceptions; do not add fake unlock markers for them.

- [ ] **Step 4: Add a recoverable Begin/Complete/Rollback purchase transaction**

Extend `CareerState`:

```ts
pendingUnlockSetPurchase: {
  setId: string
  unlockId: string
  tokenCost: number
} | null
```

Add typed actions:

```ts
BEGIN_EXPEDITION_UNLOCK_SET_PURCHASE
COMPLETE_EXPEDITION_UNLOCK_SET_PURCHASE
ROLLBACK_EXPEDITION_UNLOCK_SET_PURCHASE
```

The reducer behavior is:

```ts
// BEGIN: revalidate canonical set, rank, tokens, and not already unlocked;
// subtract exact canonical token cost and store pending transaction.
// COMPLETE: clear pending only when setId/unlockId match pending.
// ROLLBACK: restore pending.tokenCost exactly once, then clear pending.
```

The sanitizer validates `setId` against `EXPEDITION_UNLOCK_SETS`, recomputes `unlockId`/`tokenCost` from the registry, and never trusts persisted cost values.

- [ ] **Step 5: Persist the single set marker between BEGIN and COMPLETE**

Expose one namespaced persistent-unlock helper in `useGameDispatchActions.ts`:

```ts
const addPersistentUnlock = useCallback(
  (unlockId: string): boolean => {
    if (typeof unlockId !== 'string' || !unlockId.startsWith('expedition.')) return false
    if (state.unlocks.includes(unlockId)) return true
    if (!addUnlock(unlockId, storage)) return false
    dispatch(createAddUnlockAction(unlockId))
    return true
  },
  [dispatch, state.unlocks, storage]
)
```

`useCareerDispatchActions` orchestrates:

```ts
beginUnlockSetPurchase(setId)
// after reducer exposes pendingUnlockSetPurchase
const ok = addPersistentUnlock(pending.unlockId)
if (ok) completeUnlockSetPurchase(pending.setId)
else rollbackUnlockSetPurchase(pending.setId)
```

A loaded save with a pending transaction retries the same single marker. If the marker already exists, `addPersistentUnlock` treats that as success and completes rather than charging twice. This makes a storage interruption recoverable without partial capability markers.

- [ ] **Step 6: Run unlock/storage/failure tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionUnlockSets.test.js \
  tests/node/unlockManager.test.js \
  tests/security/unlocksValidation.test.js
pnpm run typecheck:core
```

Test these failure cases explicitly: storage write fails -> tokens restored; reload with pending + marker already written -> transaction completes; duplicate click -> only one BEGIN changes tokens.

- [ ] **Step 7: Commit**

```bash
git add src/data/expedition/unlockSets.ts src/types/career.d.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/useGameDispatchActions.ts src/context/actionCreators.ts src/context/careerActionCreators.ts src/context/useCareerDispatchActions.ts src/context/reducers/careerReducer.ts src/context/reducers/careerSanitizers.ts tests/node/expeditionUnlockSets.test.js tests/node/unlockManager.test.js tests/security/unlocksValidation.test.js
git commit -m "feat(expedition): persist atomic unlock sets"
```

---

### Task 4: Add Starter Perks and Deterministic Legendary Finale Unlocks

**Files:**
- Create: `src/data/expedition/starterPerks.ts`
- Create: `src/domain/expedition/starterPerks.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/repairs.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/scenes/RunSummary.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Modify: `public/locales/en/unlocks.json`
- Modify: `public/locales/de/unlocks.json`
- Test: `tests/node/expeditionStarterPerks.test.js`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/ui/TourPrep.test.tsx`
- Test: `tests/ui/RunSummary.test.tsx`

Starter perks are optional build-defining rules selected before the run. They must not add another progression currency or a second perk-state store. Legendary perks are unlocked only by successful context-sensitive finales and are persisted through the existing `addPersistentUnlock` boundary.

- [ ] **Step 1: Write failing registry/profile tests**

`tests/node/expeditionStarterPerks.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  STARTER_PERKS,
  getStarterPerkDefinition,
  getLegendaryUnlockForFinale
} from '../../src/data/expedition/starterPerks.ts'
import { getStarterPerkProfile } from '../../src/domain/expedition/starterPerks.ts'

test('starter perks are rule-changing and namespaced', () => {
  for (const perk of Object.values(STARTER_PERKS)) {
    assert.ok(perk.unlockId.startsWith('expedition.'))
    assert.equal(getStarterPerkDefinition(perk.id), perk)
  }
  assert.equal(STARTER_PERKS.mechanic_kit.flatStatBonus, undefined)
})

test('mechanic kit trades an unlock for safer repair economy', () => {
  assert.deepEqual(getStarterPerkProfile('mechanic_kit'), {
    startingSpareParts: 1,
    startingHeat: 0,
    repairCostMultiplier: 0.9,
    nodeIntelFloor: 0,
    exposureGainMultiplier: 1,
    authorityEventWeightMultiplier: 1,
    contractPenaltyMultiplier: 1,
    contractRewardMultiplier: 1,
    rivalEventWeightMultiplier: 1,
    rivalRewardMultiplier: 1,
    technicalWearMultiplier: 1,
    rareRewardMultiplier: 1,
    finaleRewardMultiplier: 1
  })
})

test('every context-sensitive finale maps to exactly one legendary unlock', () => {
  assert.equal(getLegendaryUnlockForFinale('regional_headliner'), 'expedition.perk.legendary.headliner_pass')
  assert.equal(getLegendaryUnlockForFinale('corporate_showcase'), 'expedition.perk.legendary.the_fixer')
  assert.equal(getLegendaryUnlockForFinale('rival_battle'), 'expedition.perk.legendary.nemesis_dossier')
  assert.equal(getLegendaryUnlockForFinale('illegal_show'), 'expedition.perk.legendary.ghost_route')
  assert.equal(getLegendaryUnlockForFinale('disaster_gig'), 'expedition.perk.legendary.disaster_artist')
})
```

- [ ] **Step 2: Run the tests and verify the new modules are missing**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionStarterPerks.test.js
```

Expected: FAIL because the starter-perk registry/profile modules do not exist.

- [ ] **Step 3: Create the exact starter/legendary registry**

`src/data/expedition/starterPerks.ts`:

```ts
import type { ExpeditionFinaleType } from '../../types/expedition'

export const STARTER_PERKS = Object.freeze({
  mechanic_kit: Object.freeze({
    id: 'mechanic_kit',
    unlockId: 'expedition.perk.mechanic_kit',
    nameKey: 'unlocks:expedition.perks.mechanicKit.name',
    descriptionKey: 'unlocks:expedition.perks.mechanicKit.description'
  }),
  press_pass: Object.freeze({
    id: 'press_pass',
    unlockId: 'expedition.perk.press_pass',
    nameKey: 'unlocks:expedition.perks.pressPass.name',
    descriptionKey: 'unlocks:expedition.perks.pressPass.description'
  }),
  underground_contact: Object.freeze({
    id: 'underground_contact',
    unlockId: 'expedition.perk.underground_contact',
    nameKey: 'unlocks:expedition.perks.undergroundContact.name',
    descriptionKey: 'unlocks:expedition.perks.undergroundContact.description'
  }),
  headliner_pass: Object.freeze({
    id: 'headliner_pass',
    unlockId: 'expedition.perk.legendary.headliner_pass',
    nameKey: 'unlocks:expedition.perks.headlinerPass.name',
    descriptionKey: 'unlocks:expedition.perks.headlinerPass.description'
  }),
  the_fixer: Object.freeze({
    id: 'the_fixer',
    unlockId: 'expedition.perk.legendary.the_fixer',
    nameKey: 'unlocks:expedition.perks.theFixer.name',
    descriptionKey: 'unlocks:expedition.perks.theFixer.description'
  }),
  nemesis_dossier: Object.freeze({
    id: 'nemesis_dossier',
    unlockId: 'expedition.perk.legendary.nemesis_dossier',
    nameKey: 'unlocks:expedition.perks.nemesisDossier.name',
    descriptionKey: 'unlocks:expedition.perks.nemesisDossier.description'
  }),
  ghost_route: Object.freeze({
    id: 'ghost_route',
    unlockId: 'expedition.perk.legendary.ghost_route',
    nameKey: 'unlocks:expedition.perks.ghostRoute.name',
    descriptionKey: 'unlocks:expedition.perks.ghostRoute.description'
  }),
  disaster_artist: Object.freeze({
    id: 'disaster_artist',
    unlockId: 'expedition.perk.legendary.disaster_artist',
    nameKey: 'unlocks:expedition.perks.disasterArtist.name',
    descriptionKey: 'unlocks:expedition.perks.disasterArtist.description'
  })
} as const)

export type StarterPerkId = keyof typeof STARTER_PERKS

export const getStarterPerkDefinition = (id: string) =>
  Object.hasOwn(STARTER_PERKS, id) ? STARTER_PERKS[id as StarterPerkId] : null

const LEGENDARY_FINALE_UNLOCKS: Readonly<Record<ExpeditionFinaleType, string>> = Object.freeze({
  regional_headliner: STARTER_PERKS.headliner_pass.unlockId,
  corporate_showcase: STARTER_PERKS.the_fixer.unlockId,
  rival_battle: STARTER_PERKS.nemesis_dossier.unlockId,
  illegal_show: STARTER_PERKS.ghost_route.unlockId,
  disaster_gig: STARTER_PERKS.disaster_artist.unlockId
})

export const getLegendaryUnlockForFinale = (finaleType: ExpeditionFinaleType): string =>
  LEGENDARY_FINALE_UNLOCKS[finaleType]
```

- [ ] **Step 4: Add one pure composed perk profile**

`src/domain/expedition/starterPerks.ts`:

```ts
import { getStarterPerkDefinition } from '../../data/expedition/starterPerks'

export interface StarterPerkProfile {
  startingSpareParts: number
  startingHeat: number
  repairCostMultiplier: number
  nodeIntelFloor: 0 | 1 | 2
  exposureGainMultiplier: number
  authorityEventWeightMultiplier: number
  contractPenaltyMultiplier: number
  contractRewardMultiplier: number
  rivalEventWeightMultiplier: number
  rivalRewardMultiplier: number
  technicalWearMultiplier: number
  rareRewardMultiplier: number
  finaleRewardMultiplier: number
}

const BASE: StarterPerkProfile = Object.freeze({
  startingSpareParts: 0,
  startingHeat: 0,
  repairCostMultiplier: 1,
  nodeIntelFloor: 0,
  exposureGainMultiplier: 1,
  authorityEventWeightMultiplier: 1,
  contractPenaltyMultiplier: 1,
  contractRewardMultiplier: 1,
  rivalEventWeightMultiplier: 1,
  rivalRewardMultiplier: 1,
  technicalWearMultiplier: 1,
  rareRewardMultiplier: 1,
  finaleRewardMultiplier: 1
})

const PROFILES: Readonly<Record<string, Partial<StarterPerkProfile>>> = Object.freeze({
  mechanic_kit: { startingSpareParts: 1, repairCostMultiplier: 0.9 },
  press_pass: { nodeIntelFloor: 1, exposureGainMultiplier: 1.1 },
  underground_contact: { startingHeat: 15, rareRewardMultiplier: 1.15 },
  headliner_pass: { finaleRewardMultiplier: 1.15, exposureGainMultiplier: 1.15 },
  the_fixer: { contractPenaltyMultiplier: 0.5, contractRewardMultiplier: 0.9 },
  nemesis_dossier: { rivalEventWeightMultiplier: 1.25, rivalRewardMultiplier: 1.2 },
  ghost_route: { authorityEventWeightMultiplier: 0.5, startingHeat: 10 },
  disaster_artist: { technicalWearMultiplier: 1.15, rareRewardMultiplier: 1.25 }
})

export const getStarterPerkProfile = (id: string | null): StarterPerkProfile => {
  if (!id || !getStarterPerkDefinition(id)) return { ...BASE }
  return { ...BASE, ...PROFILES[id] }
}
```

The stronger profiles intentionally include a cost or pressure trade-off: `press_pass` and `headliner_pass` increase Exposure gain, `the_fixer` sacrifices contract payout, `ghost_route` starts hot, and `disaster_artist` increases technical wear. Do not turn these into permanent raw player-stat increases.

- [ ] **Step 5: Enforce unlock ownership in the canonical loadout validator**

In `validateExpeditionLoadout`:

```ts
const perk = candidate.starterPerkId
  ? getStarterPerkDefinition(candidate.starterPerkId)
  : null

if (candidate.starterPerkId && !perk) {
  return { valid: false, reason: 'invalid_starter_perk' }
}
if (perk && !isExpeditionCapabilityUnlocked(state.unlocks, perk.unlockId)) {
  return { valid: false, reason: 'locked_starter_perk' }
}
```

`null` stays valid for every player. Legendary perk markers are direct `state.unlocks` entries, so the same capability resolver handles both purchased-set capabilities and directly earned legendary markers.

Add sanitizer coverage so an unknown persisted `starterPerkId` becomes `null`; never coerce arbitrary values to strings.

- [ ] **Step 6: Materialize only one-time starting effects at `START_EXPEDITION`**

The reducer may materialize only stateful starting resources; multiplier effects stay pure and are recomputed by their owning helpers:

```ts
const perkProfile = getStarterPerkProfile(payload.loadout.starterPerkId)
const cargo = {
  ...payload.loadout.cargo,
  spareParts: payload.loadout.cargo.spareParts + perkProfile.startingSpareParts
}
const heat = clampExpeditionHeat(perkProfile.startingHeat)
```

Validate cargo capacity **after** starter perk expansion. If `mechanic_kit` would exceed the selected chassis capacity, `validateExpeditionLoadout` must reject the loadout instead of silently dropping the bonus part.

- [ ] **Step 7: Compose perk effects at the existing owning helpers**

Use `getStarterPerkProfile(state.expedition.loadout.starterPerkId)` at these seams only:

```text
repairs.ts              repairCost *= repairCostMultiplier
nodeIntel.ts             intel = max(intel, nodeIntelFloor)
pressure.ts              positive Exposure deltas *= exposureGainMultiplier
contracts.ts             rewards *= contractRewardMultiplier; penalties *= contractPenaltyMultiplier
pressureDirector.ts      authority/rival tag weights *= their corresponding multipliers
condition.ts             technical (not vehicle road) wear *= technicalWearMultiplier
extraction.ts/finale     finale secured reward *= finaleRewardMultiplier; rare roll weight *= rareRewardMultiplier
rival reward resolver    rival reward *= rivalRewardMultiplier
```

Do not put perk-id conditionals in reducers and do not apply the same multiplier in both the event producer and reducer.

- [ ] **Step 8: Unlock one deterministic legendary perk only after a successful finale**

Use the already-resolved `expedition.finaleType`; do not reroll the reward:

```ts
const legendaryUnlockId = outcome.kind === 'completed' && expedition.finaleType
  ? getLegendaryUnlockForFinale(expedition.finaleType)
  : null
```

In `RunSummary`, integrate this into the existing idempotent career-settlement path:

```ts
if (legendaryUnlockId && !state.unlocks.includes(legendaryUnlockId)) {
  const persisted = addPersistentUnlock(legendaryUnlockId)
  if (!persisted) return // surface retry; do not settle this run yet
}
recordExpeditionCareerResult(outcome)
```

Because `addPersistentUnlock` treats an already stored marker as success and the career settlement has its own bounded `settledRunIds`, rerender/reload cannot duplicate the legendary reward or double-award Tour Tokens. Failure and voluntary extraction never award a legendary finale marker.

- [ ] **Step 9: Add Tour Prep and Run Summary UX**

`TourPrepLoadout` renders only `null` plus starter perks whose `unlockId` passes `isExpeditionCapabilityUnlocked`. Each option displays its upside **and** its cost/pressure trade-off:

```tsx
const availableStarterPerks = Object.values(STARTER_PERKS).filter(perk =>
  isExpeditionCapabilityUnlocked(unlocks, perk.unlockId)
)

<StarterPerkPicker
  value={draft.starterPerkId}
  options={availableStarterPerks}
  onChange={starterPerkId => updateDraft({ starterPerkId })}
/>
```

`RunSummary` displays the newly earned legendary perk exactly once when the marker was not already owned; subsequent summaries may show it as already owned but must not present another unlock animation:

```tsx
{newLegendaryUnlockId ? (
  <LegendaryUnlockNotice unlockId={newLegendaryUnlockId} />
) : null}
```

Update matching English and German locale keys in the same commit.

- [ ] **Step 10: Run focused starter/legendary tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionStarterPerks.test.js \
  tests/node/expeditionLoadout.test.js \
  tests/node/expeditionExtraction.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx tests/ui/RunSummary.test.tsx
pnpm run typecheck:core
```

Expected: PASS, including locked-perk rejection, cargo overflow rejection, deterministic finale mapping, storage-failure retry, and rerender idempotence.

- [ ] **Step 11: Commit**

```bash
git add src/data/expedition/starterPerks.ts src/domain/expedition/starterPerks.ts src/types/expedition.d.ts src/domain/expedition/loadout.ts src/context/reducers/expeditionReducer.ts src/context/reducers/expeditionSanitizers.ts src/domain/expedition/condition.ts src/domain/expedition/repairs.ts src/domain/expedition/nodeIntel.ts src/domain/expedition/pressure.ts src/domain/expedition/contracts.ts src/domain/expedition/pressureDirector.ts src/domain/expedition/extraction.ts src/ui/expedition/TourPrepLoadout.tsx src/scenes/RunSummary.tsx public/locales/en/ui.json public/locales/de/ui.json public/locales/en/unlocks.json public/locales/de/unlocks.json tests/node/expeditionStarterPerks.test.js tests/node/expeditionLoadout.test.js tests/node/expeditionExtraction.test.js tests/ui/TourPrep.test.tsx tests/ui/RunSummary.test.tsx
git commit -m "feat(expedition): add starter and legendary perks"
```

---

### Task 5: Define Mechanically Distinct Region Profiles

**Files:**
- Create/Modify: `src/data/expedition/regions.ts`
- Create: `src/domain/expedition/regionProfile.ts`
- Test: `tests/node/expeditionRegionProfile.test.js`

- [ ] **Step 1: Write failing profile tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { REGIONS } from '../../src/data/expedition/regions.ts'

test('regions differ mechanically, not only by labels', () => {
  assert.equal(REGIONS.home.roadWearMultiplier, 1)
  assert.equal(REGIONS.industrial.roadWearMultiplier, 1.25)
  assert.equal(REGIONS.festival.technicalWearMultiplier, 1.2)
  assert.equal(REGIONS.corporate.contractRewardMultiplier, 1.2)
  assert.equal(REGIONS.underground.heatGainMultiplier, 1.3)
})
```

- [ ] **Step 2: Add exact profiles**

```ts
export interface ExpeditionRegionDefinition {
  id: string
  nameKey: string
  unlockId: string | null
  nodeTypeWeights: { rest: number; supply: number; special: number }
  roadWearMultiplier: number
  technicalWearMultiplier: number
  repairCostMultiplier: number
  gigRewardMultiplier: number
  contractRewardMultiplier: number
  heatGainMultiplier: number
  rareRewardMultiplier: number
}
```

Definitions:

```ts
home: {
  nodeTypeWeights: { rest: 0.10, supply: 0.10, special: 0.10 },
  roadWearMultiplier: 1,
  technicalWearMultiplier: 1,
  repairCostMultiplier: 1,
  gigRewardMultiplier: 1,
  contractRewardMultiplier: 1,
  heatGainMultiplier: 1,
  rareRewardMultiplier: 1
}
industrial: {
  nodeTypeWeights: { rest: 0.10, supply: 0.20, special: 0.15 },
  roadWearMultiplier: 1.25,
  technicalWearMultiplier: 1,
  repairCostMultiplier: 0.8,
  gigRewardMultiplier: 1,
  contractRewardMultiplier: 1,
  heatGainMultiplier: 1,
  rareRewardMultiplier: 1.05
}
festival: {
  nodeTypeWeights: { rest: 0.08, supply: 0.07, special: 0.10 },
  roadWearMultiplier: 1,
  technicalWearMultiplier: 1.2,
  repairCostMultiplier: 1.1,
  gigRewardMultiplier: 1.15,
  contractRewardMultiplier: 1.05,
  heatGainMultiplier: 1.05,
  rareRewardMultiplier: 1.1
}
corporate: {
  nodeTypeWeights: { rest: 0.15, supply: 0.10, special: 0.10 },
  roadWearMultiplier: 1,
  technicalWearMultiplier: 0.95,
  repairCostMultiplier: 1.1,
  gigRewardMultiplier: 1.05,
  contractRewardMultiplier: 1.2,
  heatGainMultiplier: 1.25,
  rareRewardMultiplier: 1
}
underground: {
  nodeTypeWeights: { rest: 0.08, supply: 0.08, special: 0.24 },
  roadWearMultiplier: 1.1,
  technicalWearMultiplier: 1.1,
  repairCostMultiplier: 1.15,
  gigRewardMultiplier: 1.1,
  contractRewardMultiplier: 0.9,
  heatGainMultiplier: 1.3,
  rareRewardMultiplier: 1.25
}
```

`home` is always available; other regions require their `unlockId` in `state.unlocks`.

- [ ] **Step 3: Add pure combined-region helpers**

Implement the helper boundary in `src/domain/expedition/regionProfile.ts`; callers pass only the persisted region id plus the canonical `state.unlocks` string list. Persisted multiplier objects are never accepted:

```ts
import { REGIONS } from '../../data/expedition/regions'
import type { ExpeditionRegionDefinition } from '../../data/expedition/regions'

export const getRegionDefinition = (
  id: unknown
): ExpeditionRegionDefinition => {
  if (typeof id !== 'string' || !Object.hasOwn(REGIONS, id)) {
    return REGIONS.home
  }
  return REGIONS[id as keyof typeof REGIONS]
}

export const getAvailableRegions = (
  unlocks: readonly string[]
): ExpeditionRegionDefinition[] => {
  const owned = new Set(unlocks.filter((id): id is string => typeof id === 'string'))
  return Object.values(REGIONS).filter(
    region => region.unlockId === null || owned.has(region.unlockId)
  )
}
```

Add assertions that `getRegionDefinition('__proto__')` and an unknown id both return the exact `home` definition, and that a region appears only after its namespaced unlock id is present.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRegionProfile.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/expedition/regions.ts src/domain/expedition/regionProfile.ts tests/node/expeditionRegionProfile.test.js
git commit -m "feat(expedition): add mechanical region profiles"
```

---

### Task 6: Extend MapGenerator With Optional Region Node Weights While Preserving Default Maps

**Files:**
- Modify: `src/utils/mapGenerator/types.ts`
- Modify: `src/utils/mapGenerator.ts`
- Modify: `src/context/useMapGeneration.ts`
- Test: `tests/node/mapGenerator.test.js`
- Test: `tests/node/expeditionRegionProfile.test.js`

- [ ] **Step 1: Add determinism/default-preservation tests**

Record one existing known seed/depth node-type snapshot before implementation. Add assertions:

```js
const legacy = new MapGenerator(12345).generateMap(8)
const explicitDefault = new MapGenerator(12345).generateMap(8, undefined)
assert.deepEqual(explicitDefault, legacy)

const industrialA = new MapGenerator(12345).generateMap(8, {
  nodeTypeWeights: { rest: 0.10, supply: 0.20, special: 0.15 }
})
const industrialB = new MapGenerator(12345).generateMap(8, {
  nodeTypeWeights: { rest: 0.10, supply: 0.20, special: 0.15 }
})
assert.deepEqual(industrialA, industrialB)
```

- [ ] **Step 2: Add exact generation option**

```ts
export interface MapGenerationOptions {
  nodeTypeWeights?: {
    rest: number
    supply: number
    special: number
  }
}
```

Change signature:

```ts
generateMap(depth: number = 10, options?: MapGenerationOptions): MapGeneratorState
```

Store/forward `options` only within this generation call; do not persist them on generator instance.

- [ ] **Step 3: Preserve the old `_rollNodeType` when options are absent**

```ts
_rollNodeType(venue: Venue, weights?: MapGenerationOptions['nodeTypeWeights']): GeneratedMapNode['type'] {
  const typeRoll = this.random()
  if (!weights) {
    let nodeType: GeneratedMapNode['type'] = 'GIG'
    if (typeRoll > 0.9) nodeType = 'SPECIAL'
    else if (typeRoll > 0.8) nodeType = 'SUPPLY_STOP'
    else if (typeRoll > 0.7) nodeType = 'REST_STOP'
    else if ((venue.capacity ?? 0) >= 1000) nodeType = 'FESTIVAL'
    return nodeType
  }
  const rest = Math.max(0, Math.min(0.5, weights.rest))
  const supply = Math.max(0, Math.min(0.5, weights.supply))
  const special = Math.max(0, Math.min(0.5, weights.special))
  const nonGig = rest + supply + special
  if (nonGig >= 0.8) throw new StateError('Expedition map node weights leave insufficient gig probability')
  if (typeRoll < special) return 'SPECIAL'
  if (typeRoll < special + supply) return 'SUPPLY_STOP'
  if (typeRoll < special + supply + rest) return 'REST_STOP'
  return (venue.capacity ?? 0) >= 1000 ? 'FESTIVAL' : 'GIG'
}
```

- [ ] **Step 4: Pass region profile from `useMapGeneration` only for active Expedition**

Resolve the canonical region definition only when the run is active, and preserve the existing generator call for `home`/legacy paths:

```ts
const isActiveExpedition = expedition.status === 'active'
const region = isActiveExpedition
  ? getRegionDefinition(expedition.loadout.regionId)
  : REGIONS.home

const generationOptions =
  isActiveExpedition && region.id !== 'home'
    ? { nodeTypeWeights: region.nodeTypeWeights }
    : undefined

const map = new MapGenerator(runSeed).generateMap(mapDepth, generationOptions)
```

The default branch therefore still calls `generateMap(depth, undefined)`, which Task 5's snapshot test pins to the pre-Expedition node mapping.

- [ ] **Step 5: Run map/fallback tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/mapGenerator.test.js tests/node/fallbackMap.test.js tests/node/expeditionRegionProfile.test.js
pnpm run typecheck:core
```

Expected: PASS; default snapshot unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/utils/mapGenerator src/context/useMapGeneration.ts tests/node/mapGenerator.test.js tests/node/expeditionRegionProfile.test.js
git commit -m "feat(expedition): vary map nodes by region"
```

---

### Task 7: Define Six Tour Archetypes With Explicit Run Profiles

**Files:**
- Modify: `src/data/expedition/tourTypes.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Test: `tests/node/expeditionCareer.test.js`

- [ ] **Step 1: Add failing tour profile test**

```js
assert.deepEqual(
  Object.fromEntries(Object.entries(TOUR_TYPES).map(([id, v]) => [id, v.mapDepth])),
  {
    standard: 8,
    blitz: 6,
    underground: 8,
    corporate: 8,
    rival_hunt: 8,
    survival: 9
  }
)
```

- [ ] **Step 2: Define exact profile contract**

```ts
export interface TourTypeDefinition {
  id: string
  nameKey: string
  unlockId: string | null
  mapDepth: number
  extractionSteps: readonly number[]
  voluntaryRetentionRate: number
  failureRetentionRate: number
  completionMultiplier: number
  startingHeat: number
  allowedRegionIds: readonly string[] | null
  forcedRival: boolean
}
```

Exact initial values:

```text
standard: depth8, extraction[3,6], retention .70/.50, completion 1.35, heat0
blitz: depth6, extraction[2,4], retention .65/.45, completion 1.45, heat5
underground: depth8, extraction[3,6], retention .60/.40, completion 1.55, heat35, allowed underground
corporate: depth8, extraction[3,6], retention .75/.55, completion 1.35, heat0, allowed corporate
rival_hunt: depth8, extraction[3,6], retention .65/.45, completion 1.50, heat10, forcedRival true
survival: depth9, extraction[3,6], retention .60/.40, completion 1.60, heat0
```

- [ ] **Step 3: Availability uses `state.unlocks`**

Extend the G1 `TourTypeDefinition` in place and keep `TOUR_TYPES.standard` as the baseline object. Add pure availability/compatibility helpers to `src/domain/expedition/loadout.ts`:

```ts
export const getAvailableTourTypes = (
  unlocks: readonly string[]
): TourTypeDefinition[] => {
  const owned = new Set(unlocks.filter((id): id is string => typeof id === 'string'))
  return Object.values(TOUR_TYPES).filter(
    tour => tour.unlockId === null || owned.has(tour.unlockId)
  )
}

export const isTourRegionCompatible = (
  tour: TourTypeDefinition,
  regionId: string
): boolean =>
  tour.allowedRegionIds === null || tour.allowedRegionIds.includes(regionId)
```

`standard` uses `unlockId: null` and `allowedRegionIds: null`; every other tour uses a namespaced unlock id. `validateExpeditionLoadout` rejects a locked tour or a tour/region mismatch before `START_EXPEDITION`.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/expedition/tourTypes.ts src/domain/expedition/loadout.ts tests/node/expeditionCareer.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add tour archetypes"
```

---

### Task 8: Implement Modular Tour Pressure / Ascension Modifiers

**Files:**
- Create: `src/data/expedition/pressureModifiers.ts`
- Create: `src/domain/expedition/tourPressure.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Test: `tests/node/expeditionTourPressure.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionPressure.test.js`

- [ ] **Step 1: Write failing modifier tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { TOUR_PRESSURE_MODIFIERS } from '../../src/data/expedition/pressureModifiers.ts'
import { calculateTourPressureProfile } from '../../src/domain/expedition/tourPressure.ts'

test('three approved pressure modifiers add reward bonus linearly', () => {
  const result = calculateTourPressureProfile([
    'bad_roads', 'media_frenzy', 'hostile_territory'
  ])
  assert.equal(result.rewardMultiplier, 1.55)
  assert.equal(result.roadWearMultiplier, 1.3)
  assert.equal(result.exposureGainMultiplier, 2)
  assert.equal(result.rivalWeightMultiplier, 1.5)
})
```

- [ ] **Step 2: Add exact modifier definitions**

```ts
export const TOUR_PRESSURE_MODIFIERS = Object.freeze({
  bad_roads: {
    rewardBonus: 0.15,
    roadWearMultiplier: 1.3
  },
  media_frenzy: {
    rewardBonus: 0.20,
    exposureGainMultiplier: 2
  },
  no_safety_net: {
    rewardBonus: 0.25,
    extractionRetentionMultiplier: 0.75
  },
  union_trouble: {
    rewardBonus: 0.15,
    crewStressMultiplier: 1.25
  },
  hostile_territory: {
    rewardBonus: 0.20,
    rivalWeightMultiplier: 1.5
  }
} as const)
```

- [ ] **Step 3: Implement combined profile**

```ts
export interface TourPressureProfile {
  rewardMultiplier: number
  roadWearMultiplier: number
  exposureGainMultiplier: number
  extractionRetentionMultiplier: number
  crewStressMultiplier: number
  rivalWeightMultiplier: number
}

export const calculateTourPressureProfile = (
  ids: readonly string[]
): TourPressureProfile => {
  const unique = [...new Set(ids)]
  let rewardBonus = 0
  let roadWearMultiplier = 1
  let exposureGainMultiplier = 1
  let extractionRetentionMultiplier = 1
  let crewStressMultiplier = 1
  let rivalWeightMultiplier = 1
  for (const id of unique) {
    const mod = TOUR_PRESSURE_MODIFIERS[id as keyof typeof TOUR_PRESSURE_MODIFIERS]
    if (!mod) continue
    rewardBonus += mod.rewardBonus
    roadWearMultiplier *= mod.roadWearMultiplier ?? 1
    exposureGainMultiplier *= mod.exposureGainMultiplier ?? 1
    extractionRetentionMultiplier *= mod.extractionRetentionMultiplier ?? 1
    crewStressMultiplier *= mod.crewStressMultiplier ?? 1
    rivalWeightMultiplier *= mod.rivalWeightMultiplier ?? 1
  }
  return {
    rewardMultiplier: 1 + rewardBonus,
    roadWearMultiplier,
    exposureGainMultiplier,
    extractionRetentionMultiplier,
    crewStressMultiplier,
    rivalWeightMultiplier
  }
}
```

Limit selection to maximum three modifiers initially. Pressure modifiers are available only when `career.ascensionUnlocked === true`.

- [ ] **Step 4: Wire profile into existing helpers**

Add small composition helpers in `src/domain/expedition/tourPressure.ts` so the owning domains do not read modifier registries themselves:

```ts
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

export const applyTourPressureRetention = (
  baseRate: number,
  profile: TourPressureProfile
): number => clamp01(baseRate * profile.extractionRetentionMultiplier)

export const applyTourPressureReward = (
  reward: number,
  profile: TourPressureProfile
): number => Math.max(0, reward) * profile.rewardMultiplier

export const applyTourPressureRoadWear = (
  wear: number,
  profile: TourPressureProfile
): number => Math.max(0, wear) * profile.roadWearMultiplier

export const applyTourPressureCrewStress = (
  delta: number,
  profile: TourPressureProfile
): number => delta > 0 ? delta * profile.crewStressMultiplier : delta

export const applyTourPressureExposureGain = (
  delta: number,
  profile: TourPressureProfile
): number => delta > 0 ? delta * profile.exposureGainMultiplier : delta
```

Then compose at the canonical owners:

```ts
// extraction.ts: apply before FINALIZE_EXPEDITION computes the secured amount.
const retention = applyTourPressureRetention(baseRetention, pressureProfile)

// condition.ts: compose after region/crew/vehicle base wear is known.
const roadWear = applyTourPressureRoadWear(baseRoadWear, pressureProfile)

// crewStress.ts: only positive stress gains are amplified.
const stressDelta = applyTourPressureCrewStress(baseStressDelta, pressureProfile)

// pressure.ts: only positive Exposure gain is amplified.
const exposureDelta = applyTourPressureExposureGain(baseExposureDelta, pressureProfile)
```

Pass `pressureProfile.rivalWeightMultiplier` into `getPressureEventChanceMultiplier` / the rival-tag branch in `pressureDirector.ts`. Apply `applyTourPressureReward` only to successful extraction/finale settlement; never multiply losses, refunds, failure retention, or already-paid Brand Deal payouts. Add one focused assertion for each composition seam.

- [ ] **Step 5: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionTourPressure.test.js tests/node/expeditionExtraction.test.js tests/node/expeditionPressure.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/expedition/pressureModifiers.ts src/domain/expedition/tourPressure.ts src/types/expedition.d.ts src/domain/expedition tests/node/expeditionTourPressure.test.js tests/node/expeditionExtraction.test.js tests/node/expeditionPressure.test.js
git commit -m "feat(expedition): add modular tour pressure"
```

---

### Task 9: Turn Band HQ Into the Expedition Meta Hub Without Removing Existing Tabs

**Files:**
- Create: `src/ui/bandhq/ExpeditionMetaTab.tsx`
- Create: `src/ui/expedition/CareerProgress.tsx`
- Create: `src/ui/expedition/TourArchive.tsx`
- Modify: `src/ui/bandhq/BandHQTabsList.tsx`
- Modify: `src/ui/bandhq/BandHQContentArea.tsx`
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionMetaTab.test.tsx`
- Test: `tests/ui/BandHQ.test.jsx`, `tests/node/useBandHQModal.test.js`, `tests/ui/bandhq/hooks/useBandHQLogic.test.jsx`

- [ ] **Step 1: Add failing Band HQ tests**

Assert a new tab id `EXPEDITION` exists, is never order-coupled to menu behavior, and renders:

```text
Career rank
Tour Tokens
HQ Facilities
Unlock Sets
Tour Archive
Rivals/Crew summary
```

Existing `SHOP`, `UPGRADES`, `SETLIST`, `BRAND_DEALS`, etc. remain functional.

- [ ] **Step 2: Add tab entry**

In `BandHQTabsList.tsx` add:

```ts
{ id: 'EXPEDITION', key: 'tabs.expedition' }
```

No index-based behavior; active tab remains string-id based.

- [ ] **Step 3: Add content branch**

Import the new tab into `src/ui/bandhq/BandHQContentArea.tsx`, select only the two required slices, and render by the existing string tab id:

```tsx
import { ExpeditionMetaTab } from './ExpeditionMetaTab.tsx'

const career = useGameSelector(state => state.career)
const unlocks = useGameSelector(state => state.unlocks)

// inside the existing Suspense panel
{currentTab === 'EXPEDITION' && (
  <ExpeditionMetaTab career={career} unlocks={unlocks} />
)}
```

`ExpeditionMetaTab` invokes the typed career/unlock dispatch hooks for facility purchases and unlock-set purchases; it must not write storage directly. Keep every existing `STATS`/`SHOP`/`UPGRADES`/`SETLIST`/`BRAND_DEALS`/`SETTINGS` branch untouched.

- [ ] **Step 4: Implement facility upgrades**

Facility levels 0..3 cost Tour Tokens:

```ts
export const HQ_FACILITY_TOKEN_COSTS = [2, 4, 7] as const
```

Facility effects are capability unlock gates, not big global stats:

```text
Workshop L1: mechanic unlock set available
Garage L1: chassis/tour type meta options visible
Management L1: industry unlock set available
Black Market L1: underground unlock set available
Crew Lounge L1: signature trait progression enabled
Rehearsal L1: future run-trait/song unlock set available
```

A facility purchase changes only `career.hqFacilityLevels` and eligibility; concrete capability ids still persist through `unlockManager`.

- [ ] **Step 5: Run Band HQ/i18n tests**

```bash
pnpm run test:ui
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/bandhq src/ui/expedition/CareerProgress.tsx src/ui/expedition/TourArchive.tsx public/locales tests/ui/ExpeditionMetaTab.test.tsx
git commit -m "feat(expedition): add Band HQ meta hub"
```

---

### Task 10: Implement Tour Archive as Discovery, Not Unlock Ownership

**Files:**
- Create: `src/domain/expedition/archive.ts`
- Modify: `src/types/career.d.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionArchive.test.js`

- [ ] **Step 1: Add failing archive tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { addArchiveDiscovery } from '../../src/domain/expedition/archive.ts'

test('archive discovery deduplicates ids and does not imply unlock', () => {
  const archive = emptyArchive()
  const next = addArchiveDiscovery(archive, 'rivalIds', 'rival_123')
  const again = addArchiveDiscovery(next, 'rivalIds', 'rival_123')
  assert.deepEqual(again.rivalIds, ['rival_123'])
})
```

- [ ] **Step 2: Implement exact helper**

```ts
export const addArchiveDiscovery = <K extends keyof CareerArchive>(
  archive: CareerArchive,
  key: K,
  id: string
): CareerArchive => {
  if (typeof id !== 'string' || id.length === 0 || id === '__proto__') return archive
  const current = archive[key]
  if (current.includes(id)) return archive
  return { ...archive, [key]: [...current, id] }
}
```

- [ ] **Step 3: Add one typed discovery action and dispatch only from observation seams**

Add the action contract:

```ts
export const RECORD_EXPEDITION_ARCHIVE_DISCOVERY =
  'RECORD_EXPEDITION_ARCHIVE_DISCOVERY' as const

export interface RecordExpeditionArchiveDiscoveryPayload {
  key: keyof CareerArchive
  id: string
}

export const createRecordExpeditionArchiveDiscoveryAction = (
  payload: RecordExpeditionArchiveDiscoveryPayload
) => ({ type: RECORD_EXPEDITION_ARCHIVE_DISCOVERY, payload })
```

The reducer delegates to `addArchiveDiscovery`; the dispatcher exposes `recordArchiveDiscovery(key, id)`. Call it only when content was actually observed/used:

```ts
recordArchiveDiscovery('crewIds', selectedCrewId)       // run start
recordArchiveDiscovery('chassisIds', activeChassisId)  // run start
recordArchiveDiscovery('moduleIds', installedModuleId) // run start
recordArchiveDiscovery('rivalIds', rivalBand.id)       // encounter shown
recordArchiveDiscovery('sponsorIds', deal.id)          // offer shown
recordArchiveDiscovery('regionIds', region.id)         // Expedition start
recordArchiveDiscovery('finaleIds', finaleType)        // finale resolved
recordArchiveDiscovery('eventIds', event.id)           // special Expedition event shown
recordArchiveDiscovery('contrabandIds', item.id)       // item used/encountered
```

Use only keys that exist on the `CareerArchive` type defined in G1/G5; add the missing category there if one of the listed keys is not yet present. Do not populate the archive from registries on load.

- [ ] **Step 4: Run archive/save tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionArchive.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/archive.ts src/types/career.d.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/context/reducers/careerSanitizers.ts tests/node/expeditionArchive.test.js tests/node/saveSliceRoundTrip.test.js
git commit -m "feat(expedition): track Tour Archive discoveries"
```

---

### Task 11: Build Region, Tour Type, and Pressure Modifier Selection in Tour Prep

**Files:**
- Create: `src/ui/expedition/RegionPicker.tsx`
- Create: `src/ui/expedition/TourTypePicker.tsx`
- Create: `src/ui/expedition/PressureModifierPicker.tsx`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/scenes/TourPrep.tsx`
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`, `public/locales/en/unlocks.json`, `public/locales/de/unlocks.json`
- Test: `tests/ui/ExpeditionRegionPicker.test.tsx`
- Test: `tests/ui/ExpeditionPressureModifierPicker.test.tsx`
- Test: `tests/ui/TourPrep.test.tsx`

- [ ] **Step 1: Add failing selection tests**

Pin the user-visible constraints instead of snapshotting markup:

```tsx
render(<TourPrepHarness unlocks={[]} ascensionUnlocked={false} />)
expect(screen.getByRole('button', { name: /home/i })).toBeEnabled()
expect(screen.getByRole('button', { name: /standard/i })).toBeEnabled()
expect(screen.queryByText(/reward multiplier/i)).not.toBeInTheDocument()

render(<TourPrepHarness
  unlocks={['expedition.region.corporate', 'expedition.tour.underground']}
  ascensionUnlocked={true}
/>)
fireEvent.click(screen.getByRole('button', { name: /corporate/i }))
fireEvent.click(screen.getByRole('button', { name: /underground/i }))
expect(screen.getByRole('button', { name: /start tour/i })).toBeDisabled()

for (const label of [/bad roads/i, /media frenzy/i, /hostile territory/i]) {
  fireEvent.click(screen.getByRole('checkbox', { name: label }))
}
expect(screen.getByText(/x1[.,]55/i)).toBeInTheDocument()
expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(3)
```

Also assert a fourth Pressure modifier cannot be selected and that locked region/tour cards use the same disabled-control convention as Band HQ.

- [ ] **Step 2: Implement pickers from canonical definitions**

Each picker receives canonical ids, not arbitrary definition objects, and resolves availability through domain helpers:

```ts
const regions = getAvailableRegions(unlocks)
const tours = getAvailableTourTypes(unlocks)
const pressure = career.ascensionUnlocked
  ? Object.values(TOUR_PRESSURE_MODIFIERS)
  : []

const startDecision = validateExpeditionLoadout({
  ...draftLoadout,
  regionId: selectedRegionId,
  tourTypeId: selectedTourTypeId,
  pressureModifierIds: selectedPressureIds
}, { unlocks, career })
```

The Start button is enabled only when `startDecision.ok === true`. Do not infer an unlock merely from career rank or discovery archive membership.

- [ ] **Step 3: Make Tour Prep display mechanical trade-offs**

For region/tour cards show only authored player-facing modifiers:

```text
Industrial: cheaper repairs, harsher roads, more Supply Stops
Festival: higher Gig payout, more technical wear, fewer Supply Stops
Corporate: better contract rewards, Heat escalates faster
Underground: more Special nodes, rare rewards, more Heat
```

Do not reveal exact hidden event odds.

- [ ] **Step 4: Run UI/i18n tests**

```bash
pnpm exec vitest run tests/ui/ExpeditionRegionPicker.test.tsx tests/ui/ExpeditionPressureModifierPicker.test.tsx tests/ui/TourPrep.test.tsx
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/expedition src/scenes/TourPrep.tsx public/locales tests/ui/ExpeditionRegionPicker.test.tsx tests/ui/ExpeditionPressureModifierPicker.test.tsx tests/ui/TourPrep.test.tsx
git commit -m "feat(expedition): select regions tours and pressure"
```

---

### Task 12: Make Run Summary the Short Between-Tour Progression Loop

**Files:**
- Modify: `src/scenes/RunSummary.tsx`
- Modify: `src/ui/expedition/RunSummaryCard.tsx`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Test: `tests/ui/RunSummary.test.tsx`
- Test: `tests/golden-path/expeditionMetaLoop.test.js`

- [ ] **Step 1: Add failing next-tour golden path**

Golden path:

```text
TourPrep -> active Expedition -> successful finale -> RunSummary
-> record career result once -> optional open Band HQ Expedition tab
-> PREPARE_NEXT_EXPEDITION -> new runSeed + idle/preparing Expedition
-> TourPrep with career/crew/rival/unlocks preserved and run-only state reset
```

Assert a repeated Render/Continue click cannot grant Tour Tokens twice.

- [ ] **Step 2: Record career result before presenting spendable progression**

Add an idempotent settlement action keyed by the finalized run id. `RunSummary` dispatches it once, then renders the returned/persisted career delta:

```ts
export interface RecordExpeditionCareerResultPayload {
  runId: string
  outcome: 'extracted' | 'completed' | 'failed'
  regionId: string
  tourTokensEarned: number
}

export const recordExpeditionCareerResult = (
  state: CareerState,
  payload: RecordExpeditionCareerResultPayload
): CareerState => {
  if (state.settledRunIds.includes(payload.runId)) return state
  return {
    ...state,
    settledRunIds: [...state.settledRunIds, payload.runId],
    tourTokens: state.tourTokens + payload.tourTokensEarned,
    stats: applyCareerOutcome(state.stats, payload)
  }
}
```

`careerSanitizers.ts` bounds and deduplicates `settledRunIds`; keep only the most recent 64 ids to prevent unbounded save growth. The RunSummary shows secured Cash/Fame, Tour Tokens earned, rank change, discoveries, persistent injury/crew/rival consequences, plus `Band HQ` and `Next Tour`. No mandatory multi-screen sequence is inserted.

- [ ] **Step 3: Ascension unlock condition**

Set `career.ascensionUnlocked = true` when rank becomes `cult_legend`. The initial implementation deliberately avoids a parallel hidden story flag:

```ts
const nextRankId = calculateCareerRank(nextCareer)
return {
  ...nextCareer,
  rankId: nextRankId,
  ascensionUnlocked: nextCareer.ascensionUnlocked || nextRankId === 'cult_legend'
}
```

Do not clear an already unlocked Ascension state if future rank logic changes.

- [ ] **Step 4: Run golden path/UI tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/golden-path/expeditionMetaLoop.test.js
pnpm exec vitest run tests/ui/RunSummary.test.tsx tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/RunSummary.tsx src/ui/expedition/RunSummaryCard.tsx src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts tests/ui/RunSummary.test.tsx tests/golden-path/expeditionMetaLoop.test.js
git commit -m "feat(expedition): complete between-tour meta loop"
```

---

### Task 13: Add G5 Region/Tour/Pressure/Meta Metrics to Balance Simulation

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report fields**

Require comparison output for:

```js
[
  'regionId',
  'tourTypeId',
  'pressureModifierIds',
  'securedRewardMean',
  'securedRewardMedian',
  'completionRate',
  'voluntaryExtractionRate',
  'failureRate',
  'avgRouteDepth',
  'avgRewardMultiplier',
  'strategyDominanceStatus'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: new report contract fails.

- [ ] **Step 3: Import canonical region/tour/pressure definitions**

Use production definitions in the simulator instead of copying profile numbers:

```js
import { REGIONS } from '../src/data/expedition/regions.ts'
import { TOUR_TYPES } from '../src/data/expedition/tourTypes.ts'
import { TOUR_PRESSURE_MODIFIERS } from '../src/data/expedition/pressureModifiers.ts'
import { getRegionDefinition } from '../src/domain/expedition/regionProfile.ts'
import { calculateTourPressureProfile } from '../src/domain/expedition/tourPressure.ts'
```

When building each representative simulator profile, resolve `mapDepth`, extraction steps/retention, region multipliers/node weights, and Pressure multipliers from these imports. Add the five production files above to the frozen source list in `scripts/utils/balance-report-metadata.mjs` if they are not already present.

- [ ] **Step 4: Add a bounded scenario matrix**

Do not multiply every possible combination. Use these representative combinations:

```text
standard/home/no pressure
survival/industrial/bad_roads
blitz/festival/media_frenzy
corporate/corporate/no pressure
underground/underground/no_safety_net
rival_hunt/home/hostile_territory
standard/home/three modifiers (bad_roads + media_frenzy + hostile_territory)
```

Each keeps 2,000 calibration runs + 2,000 disjoint holdout runs.

- [ ] **Step 5: Add explicit strategy-dominance report**

Add a pure classifier to the simulator report builder and unit-test it with a clearly dominant fixture:

```js
const classifyMetaProfileDominance = (row, rows) => {
  const rewards = rows.map(r => r.securedRewardMean).sort((a, b) => a - b)
  const failures = rows.map(r => r.failureRate).sort((a, b) => a - b)
  const rewardCut = rewards[Math.max(0, Math.ceil(rewards.length * 0.9) - 1)]
  const safetyCut = failures[Math.max(0, Math.floor(failures.length * 0.1))]
  const hasCompensatingPressure =
    row.avgConditionAtFinale < 40 ||
    row.p90CrewStressAtExtraction >= 70 ||
    row.avgHeatAtExtraction >= 75
  return row.securedRewardMean >= rewardCut &&
    row.failureRate <= safetyCut &&
    !hasCompensatingPressure
      ? 'dominant_warning'
      : 'ok'
}
```

Render the classifier beside secured reward, completion/failure, condition/stress/Heat pressure, and route depth. This G5 classifier is diagnostic/non-blocking; G6 replaces it with the final calibration+holdout dominance gate.

- [ ] **Step 6: Run G5 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: PASS; representative meta profiles appear in calibration and holdout report.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): compare expedition meta profiles"
```

---

## G5 Exit Criteria

- Career progress is based on mixed accomplishments, not Fame alone.
- Tour Tokens are the only new spendable meta currency in this plan.
- `state.unlocks`/unlockManager is the only capability-unlock registry; purchased sets persist one marker and legendary finales persist one direct marker.
- Starter perks are optional, build-defining rule profiles with explicit trade-offs; no large permanent raw-stat perks are added.
- Every successful contextual finale maps deterministically to one legendary perk unlock, with idempotent storage/retry semantics.
- Band HQ gets one Expedition meta tab; existing management surfaces remain.
- Five regions differ mechanically.
- Six tour archetypes change run structure/risk rather than only labels.
- Default map generation remains byte-for-byte/deterministically equivalent when no profile is supplied.
- Ascension modifiers change rules and reward, with a maximum of three selected.
- Tour Archive tracks discovery only; it cannot unlock content by itself.
- Run Summary settles career once and returns quickly to Tour Prep/Band HQ.
- Simulator compares representative region/tour/pressure profiles before final recalibration.
