# Codebase Cleanup Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate duplicate symbols, centralize the scene registry, add a general event schema validator, add a balance simulation harness, and introduce a minigame registry — in that order, each producing working, testable software independently.

**Architecture:** Each task is a standalone refactor with no cross-task dependencies until Task 9 (minigame registry), which depends on GAME_PHASES from the scene registry. Rename changes (GigStats → PostGigSummary, MapNode component → MapNodeView) propagate through the whole codebase via search-and-replace, verified by TypeScript after each step. The balance harness is a dev-only Node script with no runtime imports.

**Tech Stack:** TypeScript 5, React 19, Vite 8, Vitest, `node:test`, `pnpm`.

---

## FILE MAP

| File                                      | Change                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `src/types/game.d.ts`                     | Remove duplicate `ActionType`; rename `GigStats` → `PostGigSummary`               |
| `src/types/rhythmGame.d.ts`               | No change — this `GigStats` is the authoritative rhythm-game shape                |
| `src/components/MapNode.tsx`              | Rename exported component `MapNode` → `MapNodeView`; add `displayName`            |
| `src/components/MapNode.tsx` (file)       | Rename file to `MapNodeView.tsx`                                                  |
| `src/scenes/MainMenu.tsx`                 | Add named export `MainMenu` to match all other scene files                        |
| `src/context/gameConstants.ts`            | Move `ALLOWED_SCENE_VALUES` here from sceneReducer; keep `PRACTICE_RETURN_SCENES` |
| `src/context/reducers/sceneReducer.ts`    | Import `ALLOWED_SCENE_VALUES` from gameConstants instead of defining it           |
| `src/utils/eventValidator.ts`             | Add `validateGameEvent()` general validator and per-category validators           |
| `tests/eventValidator.test.js`            | New: validate every event in EVENTS_DB passes the general validator               |
| `scripts/balanceSimulation.cjs`           | New: dev-only balance runner (CommonJS for direct Node execution)                 |
| `src/context/reducers/minigameReducer.ts` | Import scene+action values from new registry instead of hardcoding                |
| `src/utils/minigameRegistry.ts`           | New: `MINIGAME_REGISTRY` typed const                                              |
| `tests/minigameRegistry.test.js`          | New: verify each registry entry has valid scene, actionTypes, and calculateResult |

---

## Task 1: Remove duplicate ActionType in game.d.ts

**Files:**

- Modify: `src/types/game.d.ts` (top of file, around line 5-7)

The file currently defines `ActionType` itself using `ActionTypes[keyof ActionTypes]`. The canonical definition already lives in `src/context/actionTypes.ts` as `export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes]`. Removing the local definition and re-exporting eliminates the duplicate without changing any consuming code.

- [ ] **Step 1: Verify the current state**

```bash
grep -n "ActionType" src/types/game.d.ts
grep -n "export type ActionType" src/context/actionTypes.ts
```

Expected: game.d.ts shows `export type ActionType = ActionTypes[keyof ActionTypes]` and actionTypes.ts shows the canonical definition.

- [ ] **Step 2: Remove the duplicate definition from game.d.ts**

Find this block near the top of `src/types/game.d.ts`:

```typescript
import type { ActionTypes } from '../context/actionTypes'
// ...
export type ActionType = ActionTypes[keyof ActionTypes]
```

Replace the type definition line with a re-export:

```typescript
export type { ActionType } from '../context/actionTypes'
```

If the `import type { ActionTypes }` is no longer used elsewhere in the file after this change, remove it too.

- [ ] **Step 3: Type-check**

```bash
pnpm run typecheck:core
```

Expected: zero new errors. If errors appear, search for any file that imported `ActionType` from `src/types/game.d.ts` and verify those imports still resolve (they should, since we re-export).

- [ ] **Step 4: Run the fast test gate**

```bash
pnpm run test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/types/game.d.ts
git commit -m "refactor: re-export ActionType from actionTypes instead of redefining"
```

---

## Task 2: Rename GigStats in game.d.ts to PostGigSummary

**Files:**

- Modify: `src/types/game.d.ts`
- Modify: any file that imports `GigStats` from `src/types/game.d.ts` or `src/types/index.ts`

`src/types/rhythmGame.d.ts` already owns the name `GigStats` for the live rhythm-game stats object (score, misses, perfectHits, maxCombo, etc.). The `GigStats` in `game.d.ts` is a different, stored post-gig summary shape (score, misses, accuracy, combo, health, overload). Renaming it `PostGigSummary` removes the ambiguity.

- [ ] **Step 1: Find all consumers of the game.d.ts GigStats**

```bash
grep -rn "GigStats" src/ tests/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "rhythmGame"
```

Record every file path and line number. These are the files you need to update in Step 3.

- [ ] **Step 2: Rename the interface in game.d.ts**

Find in `src/types/game.d.ts`:

```typescript
export interface GigStats extends UnknownRecord {
  score?: number
  misses?: number
  accuracy?: number
  combo?: number
  health?: number
  overload?: number
}
```

Replace with:

```typescript
export interface PostGigSummary extends UnknownRecord {
  score?: number
  misses?: number
  accuracy?: number
  combo?: number
  health?: number
  overload?: number
}
```

Also check whether `LastGigStats` in the same file is structurally identical to `PostGigSummary`. If it is, delete `LastGigStats` and replace all its usages with `PostGigSummary` in Step 3.

- [ ] **Step 3: Update every consumer found in Step 1**

In each file, replace `GigStats` (from game.d.ts) with `PostGigSummary`. Do not touch any import from `rhythmGame.d.ts` — the rhythm-game `GigStats` keeps its name.

Typical changes look like:

```typescript
// Before
import type { GigStats } from '../types/game'
// After
import type { PostGigSummary } from '../types/game'
```

And in type annotations:

```typescript
// Before
gigStats: GigStats
// After
gigStats: PostGigSummary
```

- [ ] **Step 4: Type-check**

```bash
pnpm run typecheck:core
```

Expected: zero errors. If `GigStats` still appears in errors, the grep in Step 1 missed something — track down the remaining occurrences.

- [ ] **Step 5: Run the full test suite**

```bash
pnpm run test:all
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -p
git commit -m "refactor: rename GigStats→PostGigSummary in game.d.ts to avoid clash with rhythmGame.d.ts"
```

---

## Task 3: Rename MapNode component to MapNodeView

**Files:**

- Rename: `src/components/MapNode.tsx` → `src/components/MapNodeView.tsx`
- Modify: all files that import from `src/components/MapNode`

The type `MapNode` in `src/types/game.d.ts` is the authoritative data shape. The React component in `MapNode.tsx` also exports a `MapNode` symbol, which currently forces consumers to alias the import (`import { MapNode as GameMapNode }`). Renaming the component export and file to `MapNodeView` removes the collision.

- [ ] **Step 1: Find all importers of the MapNode component**

```bash
grep -rn "from.*components/MapNode" src/ tests/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
grep -rn "MapNode" src/ tests/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "game.d.ts" | grep -v "rhythmGame"
```

Record every importer.

- [ ] **Step 2: Rename the export inside the file**

In `src/components/MapNode.tsx`, find:

```typescript
export const MapNode = memo(
  (props: MapNodeProps) => {
```

Replace with:

```typescript
export const MapNodeView = memo(
  (props: MapNodeProps) => {
```

Also update the displayName line:

```typescript
// Before
MapNode.displayName = 'MapNode'
// After
MapNodeView.displayName = 'MapNodeView'
```

- [ ] **Step 3: Rename the file**

```bash
git mv src/components/MapNode.tsx src/components/MapNodeView.tsx
```

- [ ] **Step 4: Update all importers**

For each file found in Step 1, update the import path and the symbol name. Example:

```typescript
// Before
import { MapNode as GameMapNode } from '../components/MapNode'
// After
import { MapNodeView } from '../components/MapNodeView'
```

And replace all usages of `GameMapNode` with `MapNodeView` in those files.

- [ ] **Step 5: Type-check**

```bash
pnpm run typecheck:core
```

Expected: zero errors.

- [ ] **Step 6: Run the fast test gate**

```bash
pnpm run test:all
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: rename MapNode component→MapNodeView to resolve collision with MapNode type"
```

---

## Task 4: Add named export to MainMenu.tsx

**Files:**

- Modify: `src/scenes/MainMenu.tsx`

Every other scene file (Overworld, Gig, PostGig, AmpCalibrationScene, etc.) exports both a named export and a default export. MainMenu currently only exports a default. This breaks the convention and causes auto-import tools to behave differently for this one file.

- [ ] **Step 1: Verify the current state**

```bash
grep -n "export" src/scenes/MainMenu.tsx
```

Expected: only `export default` found, no `export const MainMenu`.

- [ ] **Step 2: Add the named export**

Find the component definition in `src/scenes/MainMenu.tsx`. It will look like one of:

```typescript
// Pattern A – function declaration
export default function MainMenu() {
```

```typescript
// Pattern B – const arrow function
const MainMenu = () => {
// ...
export default MainMenu
```

For Pattern A, add a named export by extracting:

```typescript
export function MainMenu() {
  // ... same body ...
}
export default MainMenu
```

For Pattern B, add `export` to the const declaration:

```typescript
export const MainMenu = () => {
// ...
export default MainMenu
```

- [ ] **Step 3: Type-check**

```bash
pnpm run typecheck:core
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/MainMenu.tsx
git commit -m "refactor: add named export to MainMenu to match scene convention"
```

---

## Task 5: Move ALLOWED_SCENE_VALUES to gameConstants.ts

**Files:**

- Modify: `src/context/gameConstants.ts`
- Modify: `src/context/reducers/sceneReducer.ts`

`ALLOWED_SCENE_VALUES` is currently defined in `sceneReducer.ts` by calling `Object.values(GAME_PHASES)`. It belongs in `gameConstants.ts` alongside `GAME_PHASES` and `PRACTICE_RETURN_SCENES` so all scene-related truth lives in one place.

- [ ] **Step 1: Add ALLOWED_SCENE_VALUES to gameConstants.ts**

In `src/context/gameConstants.ts`, after the `GAME_PHASES` block and the `GamePhase` type, add:

```typescript
export const ALLOWED_SCENE_VALUES = Object.freeze(
  Object.values(GAME_PHASES) as GamePhase[]
)
```

- [ ] **Step 2: Remove the definition from sceneReducer.ts and import it**

In `src/context/reducers/sceneReducer.ts`, find:

```typescript
export const ALLOWED_SCENE_VALUES = Object.freeze(
  Object.values(GAME_PHASES) as GamePhase[]
)
```

Delete that block. Add `ALLOWED_SCENE_VALUES` to the import from `gameConstants`:

```typescript
import { GAME_PHASES, ALLOWED_SCENE_VALUES } from '../gameConstants'
```

Note: if `ALLOWED_SCENE_VALUES` was exported from `sceneReducer.ts` and other files imported it from there, find those importers with:

```bash
grep -rn "ALLOWED_SCENE_VALUES" src/ tests/ --include="*.ts" --include="*.tsx"
```

Update each to import from `gameConstants` instead.

- [ ] **Step 3: Type-check**

```bash
pnpm run typecheck:core
```

Expected: zero errors.

- [ ] **Step 4: Run the fast test gate**

```bash
pnpm run test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/context/gameConstants.ts src/context/reducers/sceneReducer.ts
git commit -m "refactor: move ALLOWED_SCENE_VALUES to gameConstants alongside GAME_PHASES"
```

---

## Task 6: Add validateGameEvent() general event validator

**Files:**

- Modify: `src/utils/eventValidator.ts`

`validateCrisisEvent` in `eventValidator.ts` validates only crisis events. All other categories (transport, band, gig, financial, special, consequences, relationship, quest) have no validator. Add a `validateGameEvent()` that covers the shared base shape every event must have, plus per-category rules.

The base shape every event must satisfy:

- `id`: non-empty string
- `title`: non-empty string starting with `'events:'`
- `description`: non-empty string starting with `'events:'`
- `options`: non-empty array where each option has a non-empty `label` string and either an `effect` object or a `skillCheck` object, and a non-empty `outcomeText` string

Per-category rules:

- `transport` / `travel`: trigger must be `'travel'`
- `crisis`: id must start with `'crisis_'`, tags must include `'crisis'`, chance must be 0–1
- `consequences`: must have a non-empty `prerequisiteEventId` string
- `quest`: must have a non-empty `questId` string

- [ ] **Step 1: Write the failing test first**

Create `tests/eventValidator.test.js` with these tests (run with `node:test`):

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateGameEvent } from '../src/utils/eventValidator.ts'

describe('validateGameEvent', () => {
  const baseEvent = {
    id: 'test_event',
    category: 'band',
    title: 'events:test.title',
    description: 'events:test.desc',
    options: [
      {
        label: 'events:test.opt1.label',
        outcomeText: 'events:test.opt1.outcome',
        effect: { type: 'stat', stat: 'harmony', value: -5 }
      }
    ]
  }

  it('accepts a valid base event', () => {
    assert.strictEqual(validateGameEvent(baseEvent), true)
  })

  it('throws when id is missing', () => {
    const e = { ...baseEvent, id: '' }
    assert.throws(() => validateGameEvent(e), /id/)
  })

  it('throws when title does not start with events:', () => {
    const e = { ...baseEvent, title: 'Bad Title' }
    assert.throws(() => validateGameEvent(e), /title/)
  })

  it('throws when options is empty', () => {
    const e = { ...baseEvent, options: [] }
    assert.throws(() => validateGameEvent(e), /options/)
  })

  it('throws when an option has no label', () => {
    const e = {
      ...baseEvent,
      options: [{ label: '', outcomeText: 'events:x.outcome', effect: {} }]
    }
    assert.throws(() => validateGameEvent(e), /label/)
  })

  it('throws when an option has no effect and no skillCheck', () => {
    const e = {
      ...baseEvent,
      options: [{ label: 'events:x.label', outcomeText: 'events:x.outcome' }]
    }
    assert.throws(() => validateGameEvent(e), /effect/)
  })

  it('throws when crisis event id does not start with crisis_', () => {
    const e = {
      ...baseEvent,
      category: 'crisis',
      tags: ['crisis'],
      id: 'bad_id',
      chance: 0.1,
      trigger: 'random'
    }
    assert.throws(() => validateGameEvent(e), /crisis_/)
  })

  it('throws when consequence event has no prerequisiteEventId', () => {
    const e = { ...baseEvent, category: 'consequences' }
    assert.throws(() => validateGameEvent(e), /prerequisiteEventId/)
  })

  it('throws when quest event has no questId', () => {
    const e = { ...baseEvent, category: 'quest' }
    assert.throws(() => validateGameEvent(e), /questId/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/eventValidator.test.js
```

Expected: FAIL — `validateGameEvent is not a function` or similar.

- [ ] **Step 3: Implement validateGameEvent in eventValidator.ts**

Add this to `src/utils/eventValidator.ts` (below the existing `validateCrisisEvent`):

```typescript
export const validateGameEvent = (event: unknown): boolean => {
  if (!event || typeof event !== 'object') {
    throw new Error('Event must be an object')
  }

  const e = event as Record<string, unknown>

  if (typeof e.id !== 'string' || e.id.trim() === '') {
    throw new Error(
      `Event id must be a non-empty string (got: ${JSON.stringify(e.id)})`
    )
  }

  if (typeof e.title !== 'string' || !e.title.startsWith('events:')) {
    throw new Error(
      `Event "${e.id}": title must start with 'events:' (got: ${JSON.stringify(e.title)})`
    )
  }

  if (
    typeof e.description !== 'string' ||
    !e.description.startsWith('events:')
  ) {
    throw new Error(
      `Event "${e.id}": description must start with 'events:' (got: ${JSON.stringify(e.description)})`
    )
  }

  if (!Array.isArray(e.options) || e.options.length === 0) {
    throw new Error(`Event "${e.id}": options must be a non-empty array`)
  }

  for (let i = 0; i < e.options.length; i++) {
    const opt = e.options[i] as Record<string, unknown>
    if (typeof opt.label !== 'string' || opt.label.trim() === '') {
      throw new Error(
        `Event "${e.id}" option[${i}]: label must be a non-empty string`
      )
    }
    if (typeof opt.outcomeText !== 'string' || opt.outcomeText.trim() === '') {
      throw new Error(
        `Event "${e.id}" option[${i}]: outcomeText must be a non-empty string`
      )
    }
    if (!opt.effect && !opt.skillCheck) {
      throw new Error(
        `Event "${e.id}" option[${i}]: must have either an effect or a skillCheck`
      )
    }
  }

  // Per-category rules
  const category = e.category

  if (category === 'crisis') {
    if (typeof e.id !== 'string' || !e.id.startsWith('crisis_')) {
      throw new Error(
        `Crisis event id must start with 'crisis_' (got: ${JSON.stringify(e.id)})`
      )
    }
    const tags = e.tags
    if (!Array.isArray(tags) || !(tags as string[]).includes('crisis')) {
      throw new Error(`Crisis event "${e.id}": tags must include 'crisis'`)
    }
    const chance = e.chance
    if (typeof chance !== 'number' || chance < 0 || chance > 1) {
      throw new Error(
        `Crisis event "${e.id}": chance must be a number in [0, 1]`
      )
    }
  }

  if (category === 'consequences') {
    if (
      typeof e.prerequisiteEventId !== 'string' ||
      e.prerequisiteEventId.trim() === ''
    ) {
      throw new Error(
        `Consequence event "${e.id}": must have a non-empty prerequisiteEventId`
      )
    }
  }

  if (category === 'quest') {
    if (typeof e.questId !== 'string' || e.questId.trim() === '') {
      throw new Error(`Quest event "${e.id}": must have a non-empty questId`)
    }
  }

  return true
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/eventValidator.test.js
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/eventValidator.ts tests/eventValidator.test.js
git commit -m "feat: add validateGameEvent() general event validator with per-category rules"
```

---

## Task 7: Validate every event in EVENTS_DB

**Files:**

- Modify: `tests/eventValidator.test.js`

This task adds a test that loads every event from every category in `EVENTS_DB` and asserts they pass `validateGameEvent`. It catches malformed events added in the future.

- [ ] **Step 1: Add EVENTS_DB validation tests**

Append to `tests/eventValidator.test.js`:

```javascript
import { EVENTS_DB } from '../src/data/events/index.ts'

describe('EVENTS_DB — all events pass validateGameEvent', () => {
  for (const [category, events] of Object.entries(EVENTS_DB)) {
    it(`all ${category} events are valid`, () => {
      assert.ok(Array.isArray(events), `${category} must be an array`)
      for (const event of events) {
        try {
          validateGameEvent(event)
        } catch (err) {
          const e = event as Record<string, unknown>
          assert.fail(`${category} event "${e.id ?? '(no id)'}" failed validation: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    })
  }
})
```

- [ ] **Step 2: Run to find violations**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/eventValidator.test.js
```

Expected: either all pass, or specific events fail with informative messages. If events fail, fix them in their data files (e.g., add missing `prerequisiteEventId` to consequence events, fix non-namespaced titles). Do not weaken the validator to make events pass — fix the data.

- [ ] **Step 3: Commit**

```bash
git add tests/eventValidator.test.js src/data/events/
git commit -m "test: validate every EVENTS_DB entry against validateGameEvent"
```

---

## Task 8: Balance simulation harness

**Files:**

- Create: `scripts/balanceSimulation.cjs`

This is a dev-only CommonJS script (`.cjs` because it uses `require()` per project convention). It simulates multiple tours using the pure calculation functions and prints a summary table to stdout. It has zero imports from the React or Vite layer — only pure utility functions.

Because the source files are TypeScript/ESM, we run the script via `tsx` so it can import them directly.

- [ ] **Step 1: Create the simulation script**

Create `scripts/balanceSimulation.cjs`:

```javascript
// Dev-only balance simulation runner.
// Usage: node --import tsx/cjs scripts/balanceSimulation.cjs [--tours N] [--days N]
//
// Simulates N tours of D days each using pure economy/social/fame functions.
// Prints a per-playstyle summary table and flags balance concerns.

const { calculateGigFinancials } = require('../src/utils/economyEngine.ts')
const {
  calculateFameGain,
  clampMoney,
  clampHarmony
} = require('../src/utils/gameStateUtils.ts')
const { calculateSocialGrowth } = require('../src/utils/socialEngine.ts')
const { calculateDailyUpdates } = require('../src/utils/simulationUtils.ts')

const TOURS = parseInt(
  process.argv[process.argv.indexOf('--tours') + 1] || '100',
  10
)
const DAYS_PER_TOUR = parseInt(
  process.argv[process.argv.indexOf('--days') + 1] || '30',
  10
)

const PLAYSTYLES = {
  conservative: {
    perfMean: 70,
    perfVariance: 10,
    socialActivity: 0.3,
    spendMultiplier: 0.7
  },
  aggressive: {
    perfMean: 55,
    perfVariance: 25,
    socialActivity: 0.9,
    spendMultiplier: 1.3
  },
  highControversy: {
    perfMean: 65,
    perfVariance: 15,
    socialActivity: 1.0,
    spendMultiplier: 1.0,
    controversyBias: 30
  },
  noSocial: {
    perfMean: 72,
    perfVariance: 8,
    socialActivity: 0.0,
    spendMultiplier: 0.9
  }
}

function randomNormal(mean, variance) {
  // Box–Muller approximation
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(0, Math.min(100, mean + z * Math.sqrt(variance)))
}

function makeInitialState() {
  return {
    money: 500,
    fame: 100,
    harmony: 75,
    followers: 0,
    controversy: 10,
    vanCondition: 80,
    vanFuel: 80,
    day: 1,
    bankruptcyCount: 0
  }
}

function simulateTour(playstyle) {
  const s = makeInitialState()
  const history = []
  const {
    perfMean,
    perfVariance,
    socialActivity,
    spendMultiplier,
    controversyBias = 0
  } = playstyle

  for (let d = 0; d < DAYS_PER_TOUR; d++) {
    const perf = randomNormal(perfMean, perfVariance)

    // Gig every 2 days
    if (d % 2 === 0) {
      const gigData = { capacity: 100, ticketPrice: 10, feeFixed: 30 }
      const financials = calculateGigFinancials({
        gigData,
        performanceScore: perf,
        modifiers: {},
        bandInventory: {},
        playerState: {
          fameLevel: Math.floor(s.fame / 100),
          money: s.money,
          van: { condition: s.vanCondition, fuel: s.vanFuel }
        },
        gigStats: {},
        context: {}
      })
      const net =
        (financials.totalIncome || 0) -
        (financials.totalExpenses || 0) * spendMultiplier
      s.money = clampMoney(s.money + net)
      s.fame = calculateFameGain(perf * 0.5, s.fame)
      if (s.money <= 0) s.bankruptcyCount++
    }

    // Social
    if (Math.random() < socialActivity) {
      const growth = calculateSocialGrowth(
        'instagram',
        perf,
        s.followers,
        false,
        s.controversy + controversyBias,
        50
      )
      s.followers = Math.max(0, s.followers + growth)
      s.controversy = Math.min(
        100,
        s.controversy + (controversyBias > 0 ? 2 : -0.5)
      )
    }

    // Daily decay
    s.harmony = clampHarmony(s.harmony - 0.3)
    s.vanCondition = Math.max(0, s.vanCondition - 0.5)
    s.day++

    history.push({
      day: s.day,
      money: s.money,
      fame: s.fame,
      followers: s.followers,
      harmony: s.harmony
    })
  }

  return { final: s, history }
}

function runBatch(playstyleName, playstyle) {
  const results = []
  for (let t = 0; t < TOURS; t++) {
    results.push(simulateTour(playstyle))
  }
  const finals = results.map(r => r.final)
  const avg = key =>
    finals.reduce((sum, f) => sum + (f[key] || 0), 0) / finals.length
  const pct = (key, threshold) =>
    (
      (finals.filter(f => f[key] >= threshold).length / finals.length) *
      100
    ).toFixed(1) + '%'

  return {
    style: playstyleName,
    avgMoney: avg('money').toFixed(0),
    avgFame: avg('fame').toFixed(0),
    avgFollowers: avg('followers').toFixed(0),
    avgHarmony: avg('harmony').toFixed(1),
    bankruptcyRate: pct('bankruptcyCount', 1),
    richRate: pct('money', 2000)
  }
}

console.log(`\nBalance Simulation — ${TOURS} tours × ${DAYS_PER_TOUR} days\n`)
console.log(
  'Style            | AvgMoney | AvgFame | AvgFollowers | AvgHarmony | Bankruptcy% | Rich%'
)
console.log(
  '-----------------|----------|---------|--------------|------------|-------------|------'
)

for (const [name, style] of Object.entries(PLAYSTYLES)) {
  const r = runBatch(name, style)
  console.log(
    `${r.style.padEnd(16)} | ${String(r.avgMoney).padStart(8)} | ${String(r.avgFame).padStart(7)} | ${String(r.avgFollowers).padStart(12)} | ${String(r.avgHarmony).padStart(10)} | ${r.bankruptcyRate.padStart(11)} | ${r.richRate}`
  )
}

console.log('\nBalance concerns to watch:')
console.log(
  '  - If bankruptcyRate > 40% for any style, economy is too punishing.'
)
console.log('  - If richRate > 60% for conservative, economy is too rewarding.')
console.log('  - If avgHarmony < 20 after 30 days, harmony decay is too fast.')
console.log(
  '  - If noSocial richRate >> conservative richRate, social is irrelevant.'
)
```

- [ ] **Step 2: Run the simulation**

```bash
node --import tsx/cjs scripts/balanceSimulation.cjs --tours 200 --days 30
```

Expected: a summary table prints to stdout. No errors. If imports fail because `calculateGigFinancials` or other functions have changed signatures, fix the argument shapes in the simulation to match the actual function signatures (do not modify the source functions).

- [ ] **Step 3: Commit**

```bash
git add scripts/balanceSimulation.cjs
git commit -m "feat: add dev-only balance simulation harness (scripts/balanceSimulation.cjs)"
```

---

## Task 9: Create MINIGAME_REGISTRY

**Files:**

- Create: `src/utils/minigameRegistry.ts`
- Modify: `src/context/reducers/minigameReducer.ts`
- Create: `tests/minigameRegistry.test.js`

The four start/complete handler pairs in `minigameReducer.ts` each hardcode scene values and action type strings. A central registry makes the wiring explicit and testable, and makes adding a fifth minigame a matter of adding one entry.

- [ ] **Step 1: Write the failing test first**

Create `tests/minigameRegistry.test.js`:

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MINIGAME_REGISTRY } from '../src/utils/minigameRegistry.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { GAME_PHASES } from '../src/context/gameConstants.ts'

describe('MINIGAME_REGISTRY', () => {
  const KNOWN_MINIGAMES = ['travel', 'roadie', 'ampCalibration', 'kabelsalat']

  it('has an entry for every known minigame', () => {
    for (const key of KNOWN_MINIGAMES) {
      assert.ok(
        Object.hasOwn(MINIGAME_REGISTRY, key),
        `Missing registry entry for "${key}"`
      )
    }
  })

  for (const [key, entry] of Object.entries(MINIGAME_REGISTRY)) {
    it(`${key}: startAction references a valid ActionType`, () => {
      const values = Object.values(ActionTypes)
      assert.ok(
        values.includes(entry.startAction),
        `startAction "${entry.startAction}" not in ActionTypes`
      )
    })

    it(`${key}: completeAction references a valid ActionType`, () => {
      const values = Object.values(ActionTypes)
      assert.ok(
        values.includes(entry.completeAction),
        `completeAction "${entry.completeAction}" not in ActionTypes`
      )
    })

    it(`${key}: scene references a valid GAME_PHASES value`, () => {
      const phases = Object.values(GAME_PHASES)
      assert.ok(
        phases.includes(entry.scene),
        `scene "${entry.scene}" not in GAME_PHASES`
      )
    })

    it(`${key}: calculateResult is a function`, () => {
      assert.strictEqual(typeof entry.calculateResult, 'function')
    })
  }
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/minigameRegistry.test.js
```

Expected: FAIL — `MINIGAME_REGISTRY` not found.

- [ ] **Step 3: Create src/utils/minigameRegistry.ts**

```typescript
import { ActionTypes } from '../context/actionTypes'
import { GAME_PHASES } from '../context/gameConstants'
import {
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult,
  calculateAmpCalibrationResult,
  calculateKabelsalatMinigameResult
} from './economyEngine'

export interface MinigameRegistryEntry {
  startAction: string
  completeAction: string
  scene: string
  calculateResult: (...args: unknown[]) => unknown
}

export const MINIGAME_REGISTRY = {
  travel: {
    startAction: ActionTypes.START_TRAVEL_MINIGAME,
    completeAction: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
    scene: GAME_PHASES.TRAVEL_MINIGAME,
    calculateResult: calculateTravelMinigameResult
  },
  roadie: {
    startAction: ActionTypes.START_ROADIE_MINIGAME,
    completeAction: ActionTypes.COMPLETE_ROADIE_MINIGAME,
    scene: GAME_PHASES.PRE_GIG_MINIGAME,
    calculateResult: calculateRoadieMinigameResult
  },
  ampCalibration: {
    startAction: ActionTypes.START_AMP_CALIBRATION,
    completeAction: ActionTypes.COMPLETE_AMP_CALIBRATION,
    scene: GAME_PHASES.PRE_GIG_MINIGAME,
    calculateResult: calculateAmpCalibrationResult
  },
  kabelsalat: {
    startAction: ActionTypes.START_KABELSALAT_MINIGAME,
    completeAction: ActionTypes.COMPLETE_KABELSALAT_MINIGAME,
    scene: GAME_PHASES.PRE_GIG_MINIGAME,
    calculateResult: calculateKabelsalatMinigameResult
  }
} as const satisfies Record<string, MinigameRegistryEntry>

export type MinigameKey = keyof typeof MINIGAME_REGISTRY
```

Note: if roadie/ampCalibration/kabelsalat use a different scene value than `PRE_GIG_MINIGAME`, check `minigameReducer.ts` for the exact scene each handler sets and use that value here. The test will tell you if there is a mismatch.

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/minigameRegistry.test.js
```

Expected: all pass. If any `scene` test fails, look up the actual `currentScene` value set in the corresponding `handleStart*` function in `minigameReducer.ts` and use that value in the registry.

- [ ] **Step 5: Update minigameReducer.ts to use registry values**

In `src/context/reducers/minigameReducer.ts`, import the registry:

```typescript
import { MINIGAME_REGISTRY } from '../../utils/minigameRegistry'
```

For each `handleStart*` function, replace the hardcoded scene string with the registry value. Example for travel:

```typescript
// Before (approximate)
return {
  ...state,
  currentScene: 'TRAVEL_MINIGAME',
  minigame: { ...state.minigame, type: MINIGAME_TYPES.TOURBUS, active: true }
}

// After
return {
  ...state,
  currentScene: MINIGAME_REGISTRY.travel.scene,
  minigame: { ...state.minigame, type: MINIGAME_TYPES.TOURBUS, active: true }
}
```

Do the same for the other three start handlers. Do not change the complete handlers' state logic — only the scene string references.

- [ ] **Step 6: Run the full test suite**

```bash
pnpm run test:all
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/utils/minigameRegistry.ts src/context/reducers/minigameReducer.ts tests/minigameRegistry.test.js
git commit -m "feat: add MINIGAME_REGISTRY; update minigameReducer to use registry scene values"
```

---

## Self-Review

**Spec coverage check:**

| Spec item                                                     | Covered by |
| ------------------------------------------------------------- | ---------- |
| Remove ActionType duplicate                                   | Task 1     |
| Rename GigStats → PostGigSummary                              | Task 2     |
| Rename MapNode component → MapNodeView                        | Task 3     |
| Standardize scene named exports                               | Task 4     |
| Single scene registry (ALLOWED_SCENE_VALUES in gameConstants) | Task 5     |
| General event schema validator                                | Task 6     |
| Tests for every event in EVENTS_DB                            | Task 7     |
| Balance simulation harness                                    | Task 8     |
| Minigame registry                                             | Task 9     |

**Potential issues:**

- Task 2: `LastGigStats` in game.d.ts may or may not be identical to `PostGigSummary` — the plan instructs checking this before removing it.
- Task 8: The `clampMoney` and `clampHarmony` functions may have different export names. If the simulation script fails to import them, look for the actual clamp helper names in `gameStateUtils.ts` and update the require statements.
- Task 9: The scene values for roadie/ampCalibration/kabelsalat minigames — the exploration showed all three use `PRE_GIG_MINIGAME` but the actual handlers must be verified. The registry tests will catch any mismatch.
