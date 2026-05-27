# Long-Term Assets — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Baue das Fundament des Long-Term-Asset-Systems: Typen, State, Reducer, Selektoren, RNG, generische UI-Komponenten und Hub-Szene — **ohne** sektion-spezifische Inhalte. Nach Abschluss dieses Plans existiert ein lauffähiges, getestetes Framework. Die Hub-Szene zeigt vier leere Tabs, das Action-Set funktioniert mit einer Test-Asset-Kategorie (`tourbus_chassis` als Platzhalter — wird in Plan 2 mit echten Inhalten gefüllt).

**Architecture:** Chassis + Slot + Modul, drei Erwerbsmodi, deterministischer RNG-Stream im `ADVANCE_DAY`-Payload, reine Reducer, memoisierte Selektoren. UI: brutalist Tailwind v4, eine `AssetsScene` mit Tabs, gemeinsame `GeneratedImagePanel`-Komponente für Pollinations-Bilder.

**Tech Stack:** TypeScript (strict), React 19, Tailwind v4, Vitest + node:test, Pollinations.ai über bestehende `imageGen.ts`, `react-window` (falls nicht vorhanden: progressive Loading-Fallback).

**Spec-Referenz:** `docs/superpowers/specs/2026-05-24-long-term-assets-design.md`

**Abhängigkeit auf andere Pläne:** keine (Foundation). Pläne 2–5 setzen diesen Plan voraus.

---

## File Structure

**Neu anzulegen**

- `src/types/assets.d.ts` — Alle Asset-Typen (`AssetKind`, `AssetFlavor`, `SlotType`, `LongTermAsset`, `AssetSlot`, `AssetBoni`, `AssetModule`, `ModuleUnlockReq`, `Liability`, `CrowdfundCampaign`, `RiskEventType`, `AssetModifiers`)
- `src/utils/assetConfig.ts` — `CHASSIS_CONFIG` Skelett (leer für Studio/Bandhaus/Workshop, minimal für Tourbus), `buildDiyTier` Helper, `UPGRADE_OVERHEAD` und `REPAIR_COST_PER_POINT` Konstanten
- `src/utils/loanProfiles.ts` — `LOAN_PROFILES` mit `shortTerm`/`mediumTerm`/`longTerm`/`loanShark`/`coop`
- `src/utils/assetModuleRegistry.ts` — `MODULE_REGISTRY: Record<string, AssetModule>` (leer); `MODULE_PROMPTS: Record<string, string>` (leer)
- `src/utils/assetSelectors.ts` — Selektoren (`getInstalledModules`, `getAssetAggregateBoni`, `getAssetTotalUpkeep`, `getAssetTotalDailyRevenue`, `getActiveAssetModifiers`, `getTotalDailyObligations`, `isModuleUnlocked`, `getModulePoolForAsset`, `getSlotConflicts`), `NEUTRAL_ASSET_MODIFIERS`
- `src/utils/assetTicks.ts` — Tick-Funktionen (`processAssetTick`, `processLiabilityTick`, `processCrowdfundTick`, `rollAssetRiskEvents`, `resolveCrowdfundProbability`)
- `src/utils/seededRng.ts` — `mulberry32`-Wrapper, `createRngStream(seed, length)`
- `src/context/actions/actionTypes.ts` — Erweitern um neue Action-Type-Konstanten
- `src/context/actions/assetActionCreators.ts` — Alle neuen Action-Creators
- `src/context/reducers/assetReducer.ts` — Reducer für Asset-Actions
- `src/ui/shared/GeneratedImagePanel.tsx` — Wiederverwendbares Bild-Panel
- `src/components/assets/AssetsScene.tsx` — Hub mit Tab-Routing
- `src/components/assets/AssetsTopBar.tsx` — Liquidität, Cashflow, Schulden
- `src/components/assets/ChassisAcquisitionModal.tsx`
- `src/components/assets/LoanProfileModal.tsx`
- `src/components/assets/CrowdfundSetupModal.tsx`
- `src/components/assets/CrowdfundCampaignCard.tsx`
- `src/components/assets/LiabilitiesPanel.tsx`
- `src/components/assets/RepairConfirmModal.tsx`
- `src/components/assets/SellConfirmModal.tsx`
- `src/components/assets/RiskEventModal.tsx`
- `src/components/assets/ForeclosureModal.tsx`
- `src/components/assets/ModulePickerModal.tsx`

**Zu modifizieren**

- `src/context/reducers/systemReducer.ts` — `sanitizeAssets`, `sanitizeLiabilities`, `sanitizeCrowdfundCampaigns`, `sanitizeRngSeed`
- `src/context/reducers/gameReducer.ts` — Asset-Reducer einbinden, `advanceDay`-Komposition
- `src/context/state/createInitialState.ts` (oder Äquivalent) — Felder `assets:[], liabilities:[], crowdfundCampaigns:[], rngSeed: number`
- `src/utils/gameStateUtils.ts` — `clampCondition(value: number): number`-Helper
- `src/utils/economyEngine.ts` — Bestehende Funktionen nehmen optionalen `AssetModifiers`-Parameter (`calculateFuelCost`, `calculateMerchIncome`, `calculateGigFinancials`)
- `src/utils/imageGen.ts` — Neue Helper (`getChassisImagePrompt`, `getModuleImagePrompt`, `getLoanProfileImagePrompt`, `getCrowdfundImagePrompt`, `getRiskEventImagePrompt`, `getSectionBackgroundPrompt`, `getRepairImagePrompt`, `getTrailerImagePrompt`)
- `src/utils/brandColors.ts` — Verifikation, dass benötigte Section-Accent-Tokens existieren (`toxic-green`, `electric-blue`, `cosmic-purple`, `warning-yellow`); falls fehlt → Plan-Bedingung (kein Implementieren neuer Brand-Tokens hier)
- `src/types/components.d.ts` — Prop-Typen für neue Komponenten
- `public/locales/en/ui.json` + `public/locales/de/ui.json` — Asset-Strukturkeys (siehe Task 28)
- `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js` — `BASE_STATE` ergänzen

---

## Task 1: Typdefinitionen

**Files:**

- Create: `src/types/assets.d.ts`

- [ ] **Step 1: Datei anlegen mit allen Typen aus Spec §3.1**

Kompletter Inhalt (1:1 aus Spec):

```ts
export type AssetKind =
  | 'tourbus_chassis'
  | 'studio_chassis'
  | 'bandhaus_chassis'
  | 'merch_workshop_chassis'

export type AssetFlavor = 'legit' | 'diy'
export type ChassisTier = 1 | 2 | 3
export type AcquisitionMode = 'cash' | 'loan' | 'crowdfund'

export type SlotType =
  | 'tb_roof'
  | 'tb_front'
  | 'tb_side'
  | 'tb_interior_driver'
  | 'tb_interior_cabin'
  | 'tb_audio'
  | 'tb_decal'
  | 'tb_trailer_mount'
  | 'tb_trailer_addon'
  | 'st_control'
  | 'st_outboard'
  | 'st_mic'
  | 'st_monitoring'
  | 'st_treatment'
  | 'st_software'
  | 'st_vibe'
  | 'st_iso'
  | 'bh_stage'
  | 'bh_sleeping'
  | 'bh_kitchen'
  | 'bh_lounge'
  | 'bh_backyard'
  | 'bh_security'
  | 'bh_identity'
  | 'bh_secret'
  | 'mw_print'
  | 'mw_drying'
  | 'mw_cutting'
  | 'mw_packaging'
  | 'mw_storage'
  | 'mw_specialty'
  | 'mw_sales'
  | 'mw_automation'

export interface AssetSlot {
  id: string
  slotType: SlotType
  position: { x: number; y: number }
  installedModuleId: string | null
  addedByModuleId?: string
}

export interface AssetBoni {
  baseDailyRevenueDelta?: number
  upkeepDelta?: number
  fuelMultiplier?: number
  merchCostMultiplier?: number
  songCostMultiplier?: number
  trainingCostMultiplier?: number
  staminaRegenBonusPerDay?: number
  travelStaminaRegen?: number
  merchCapacityBonus?: number
  songQualityBonus?: number
  avgMerchSalePriceBonus?: number
  famePassivePerDay?: number
  bandMoodPerDay?: number
  tipBonusGigs?: number
  baseRiskChanceMultiplier?: number
  infightingDamper?: boolean
  enablesReRecording?: boolean
  enablesLimitedEditions?: boolean
  enablesBulkProduction?: boolean
  reducesTheftRiskTravel?: boolean
  diyRiskMultiplier?: number
}

export interface ModuleUnlockReq {
  minFame?: number
  minMoney?: number
  minScenePresence?: number
  minChassisTier?: ChassisTier
  requiredStoryFlags?: readonly string[]
  requiredMemberSkill?: {
    memberId?: string
    skill: string
    tier: number
  }
  requiredOtherModuleInstalled?: string | readonly string[]
}

export interface AssetModule {
  id: string
  ownerKind: AssetKind
  slotType: SlotType
  flavor: AssetFlavor
  cost: number
  installCost: number
  removalRefundFraction: number
  boni: AssetBoni
  unlock: ModuleUnlockReq
  exclusiveWithGroup?: string
  addsSlots?: ReadonlyArray<{ slotType: SlotType; count: number }>
  maxPerAsset?: number
  riskEventTypes?: readonly RiskEventType[]
  imagePromptKey: string
}

export interface LongTermAsset {
  id: string
  kind: AssetKind
  chassisFlavor: AssetFlavor
  chassisTier: ChassisTier
  condition: number
  baseUpkeep: number
  baseDailyRevenue: number
  slots: AssetSlot[]
  acquiredOnDay: number
  acquisitionMode: AcquisitionMode
  baseRiskEventChance: number
}

export interface Liability {
  id: string
  source: 'loan' | 'crowdfund'
  assetId: string
  principalRemaining: number
  interestRate: number
  dailyPayment: number
  termDaysRemaining: number
  defaultCounter: number
  crowdfundFamePromised?: number
}

export interface CrowdfundCampaign {
  id: string
  assetSpec: {
    kind: AssetKind
    flavor: AssetFlavor
    chassisTier: ChassisTier
  }
  targetAmount: number
  fameStake: number
  daysRemaining: number
  plannedSuccessRoll: number // 0..1, gewürfelt beim Start
  resolvedOutcome?: 'success' | 'fail'
}

export type RiskEventType =
  | 'eviction'
  | 'fire'
  | 'theft'
  | 'police_check'
  | 'copyright_strike'
  | 'raid'
  | 'scam_or_bust'
  | 'paranormal'
  | 'foreclosure'

export interface AssetModifiers {
  fuelMultiplier: number
  merchCostMultiplier: number
  songCostMultiplier: number
  trainingCostMultiplier: number
  baseRiskChanceMultiplier: number
  staminaRegenBonusPerDay: number
  travelStaminaRegen: number
  merchCapacityBonus: number
  songQualityBonus: number
  avgMerchSalePriceBonus: number
  famePassivePerDay: number
  bandMoodPerDay: number
  tipBonusGigs: number
  flags: {
    infightingDamper: boolean
    enablesReRecording: boolean
    enablesLimitedEditions: boolean
    enablesBulkProduction: boolean
    reducesTheftRiskTravel: boolean
  }
}
```

- [ ] **Step 2: `pnpm run typecheck:core` läuft grün**
- [ ] **Step 3: Commit** — `feat(assets): add foundational type definitions`

## Task 2: `clampCondition`-Helper

**Files:**

- Modify: `src/utils/gameStateUtils.ts`
- Test: `tests/node/clampCondition.test.js`

- [ ] **Step 1: Failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { clampCondition } from '../../src/utils/gameStateUtils.ts'

test('clampCondition clamps to 0..100', () => {
  assert.equal(clampCondition(50), 50)
  assert.equal(clampCondition(-10), 0)
  assert.equal(clampCondition(150), 100)
  assert.equal(clampCondition(Number.NaN), 0)
  assert.equal(clampCondition(Number.POSITIVE_INFINITY), 100)
})
```

- [ ] **Step 2: `node --test tests/node/clampCondition.test.js` → FAIL**
- [ ] **Step 3: Implementation in `gameStateUtils.ts`:**

```ts
export const clampCondition = (value: number): number => {
  if (!Number.isFinite(value))
    return value === Number.POSITIVE_INFINITY ? 100 : 0
  return Math.max(0, Math.min(100, value))
}
```

- [ ] **Step 4: Test grün**
- [ ] **Step 5: Commit** — `feat(assets): add clampCondition helper`

## Task 3: Seeded RNG (`mulberry32`)

**Files:**

- Create: `src/utils/seededRng.ts`
- Test: `tests/node/seededRng.test.js`

- [ ] **Step 1: Failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mulberry32, createRngStream } from '../../src/utils/seededRng.ts'

test('mulberry32 is deterministic per seed', () => {
  const a = mulberry32(42)
  const b = mulberry32(42)
  assert.equal(a(), b())
  assert.equal(a(), b())
})

test('createRngStream returns N numbers in 0..1', () => {
  const stream = createRngStream(123, 5)
  assert.equal(stream.length, 5)
  for (const n of stream) {
    assert.ok(n >= 0 && n < 1, `out of range: ${n}`)
  }
})

test('createRngStream is reproducible', () => {
  const a = createRngStream(7, 10)
  const b = createRngStream(7, 10)
  assert.deepEqual(a, b)
})
```

- [ ] **Step 2: Implementation:**

```ts
export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const createRngStream = (seed: number, length: number): number[] => {
  const rng = mulberry32(seed)
  const out: number[] = new Array(length)
  for (let i = 0; i < length; i++) out[i] = rng()
  return out
}

export const nextSeed = (seed: number): number =>
  (mulberry32(seed)() * 2 ** 32) | 0
```

- [ ] **Step 3: Test grün. Commit** — `feat(assets): add seeded RNG helpers`

## Task 4: `assetConfig.ts` Skelett + DIY-Helper

**Files:**

- Create: `src/utils/assetConfig.ts`
- Test: `tests/node/assetConfig.test.js`

- [ ] **Step 1: Failing test für `buildDiyTier`**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDiyTier,
  UPGRADE_OVERHEAD,
  REPAIR_COST_PER_POINT
} from '../../src/utils/assetConfig.ts'

test('buildDiyTier applies multipliers', () => {
  const legit = {
    price: 1000,
    upkeep: 10,
    revenue: 0,
    slots: ['tb_roof'],
    baseRiskEventChance: 0.005
  }
  const diy = buildDiyTier(legit)
  assert.equal(diy.price, 500)
  assert.equal(diy.upkeep, 7)
  assert.equal(diy.baseRiskEventChance, 0.03)
  assert.deepEqual(diy.slots, ['tb_roof'])
})

test('constants are defined', () => {
  assert.equal(typeof UPGRADE_OVERHEAD, 'number')
  assert.equal(typeof REPAIR_COST_PER_POINT, 'number')
})
```

- [ ] **Step 2: Implementation:**

```ts
import type {
  AssetKind,
  AssetFlavor,
  ChassisTier,
  SlotType
} from '../types/assets'

export interface ChassisTierConfig {
  price: number
  upkeep: number
  revenue: number
  slots: readonly SlotType[]
  baseRiskEventChance: number
}

export type ChassisFlavorConfig = Record<ChassisTier, ChassisTierConfig>
export type ChassisKindConfig = Record<AssetFlavor, ChassisFlavorConfig>

export const DIY_PRICE_MULT = 0.5
export const DIY_UPKEEP_MULT = 0.7
export const DIY_RISK = 0.03
export const UPGRADE_OVERHEAD = 500
export const REPAIR_COST_PER_POINT = 8

export const buildDiyTier = (legit: ChassisTierConfig): ChassisTierConfig => ({
  price: Math.round(legit.price * DIY_PRICE_MULT),
  upkeep: Math.round(legit.upkeep * DIY_UPKEEP_MULT),
  revenue: legit.revenue,
  slots: legit.slots,
  baseRiskEventChance: DIY_RISK
})

// Sektion-Pläne (2-5) füllen diese Konfig.
// In diesem Plan: leere Stubs damit `Record<AssetKind, ChassisKindConfig>` compiliert.
const EMPTY_TIER: ChassisTierConfig = {
  price: 0,
  upkeep: 0,
  revenue: 0,
  slots: [],
  baseRiskEventChance: 0
}
const EMPTY_KIND: ChassisKindConfig = {
  legit: { 1: EMPTY_TIER, 2: EMPTY_TIER, 3: EMPTY_TIER },
  diy: { 1: EMPTY_TIER, 2: EMPTY_TIER, 3: EMPTY_TIER }
}

export const CHASSIS_CONFIG = {
  tourbus_chassis: EMPTY_KIND,
  studio_chassis: EMPTY_KIND,
  bandhaus_chassis: EMPTY_KIND,
  merch_workshop_chassis: EMPTY_KIND
} as const satisfies Record<AssetKind, ChassisKindConfig>
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets): add chassis config skeleton and DIY helper`

## Task 5: `loanProfiles.ts`

**Files:**

- Create: `src/utils/loanProfiles.ts`
- Test: `tests/node/loanProfiles.test.js`

- [ ] **Step 1: Test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LOAN_PROFILES,
  computeAmortization
} from '../../src/utils/loanProfiles.ts'

test('all profiles defined', () => {
  for (const id of [
    'shortTerm',
    'mediumTerm',
    'longTerm',
    'loanShark',
    'coop'
  ]) {
    assert.ok(LOAN_PROFILES[id], `missing ${id}`)
  }
})

test('computeAmortization returns positive daily payment', () => {
  const p = computeAmortization(10000, 0.08, 60)
  assert.ok(p > 0)
  assert.ok(p < 10000)
})

test('zero-interest amortization is principal/term', () => {
  assert.equal(computeAmortization(1000, 0, 100), 10)
})
```

- [ ] **Step 2: Implementation:**

```ts
export type LoanProfileId =
  | 'shortTerm'
  | 'mediumTerm'
  | 'longTerm'
  | 'loanShark'
  | 'coop'

export interface LoanProfile {
  id: LoanProfileId
  termDays: number
  interestRate: number
  labelKey: string
  minFameRequired?: number
  minScenePresenceRequired?: number
}

export const LOAN_PROFILES: Record<LoanProfileId, LoanProfile> = {
  shortTerm: {
    id: 'shortTerm',
    termDays: 60,
    interestRate: 0.08,
    labelKey: 'assets.loan.profile.shortTerm'
  },
  mediumTerm: {
    id: 'mediumTerm',
    termDays: 120,
    interestRate: 0.06,
    labelKey: 'assets.loan.profile.mediumTerm'
  },
  longTerm: {
    id: 'longTerm',
    termDays: 180,
    interestRate: 0.04,
    labelKey: 'assets.loan.profile.longTerm'
  },
  loanShark: {
    id: 'loanShark',
    termDays: 30,
    interestRate: 0.2,
    labelKey: 'assets.loan.profile.loanShark'
  },
  coop: {
    id: 'coop',
    termDays: 240,
    interestRate: 0.02,
    labelKey: 'assets.loan.profile.coop',
    minScenePresenceRequired: 50
  }
}

export const computeAmortization = (
  principal: number,
  annualInterestRate: number,
  termDays: number
): number => {
  if (annualInterestRate === 0) return principal / termDays
  const r = annualInterestRate / 365
  return (principal * (r * (1 + r) ** termDays)) / ((1 + r) ** termDays - 1)
}
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets): add loan profile catalog`

## Task 6: `assetModuleRegistry.ts` Skelett

**Files:**

- Create: `src/utils/assetModuleRegistry.ts`
- Test: `tests/node/assetModuleRegistry.test.js`

- [ ] **Step 1: Test (Spec §3.3 Anti-Stacking + Spec §8.3 Prompt-Key-Existenz)**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULE_REGISTRY,
  MODULE_PROMPTS
} from '../../src/utils/assetModuleRegistry.ts'

test('no module has self-referential addsSlots (anti-stacking)', () => {
  for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
    for (const a of m.addsSlots ?? []) {
      assert.notEqual(
        a.slotType,
        m.slotType,
        `${id} adds same slotType as it occupies — stacking exploit`
      )
    }
  }
})

test('every module imagePromptKey exists in MODULE_PROMPTS', () => {
  for (const [id, m] of Object.entries(MODULE_REGISTRY)) {
    assert.ok(
      MODULE_PROMPTS[m.imagePromptKey],
      `${id} references missing prompt key ${m.imagePromptKey}`
    )
  }
})
```

- [ ] **Step 2: Implementation (Skelett):**

```ts
import type { AssetModule } from '../types/assets'

// Sektion-Pläne 2–5 fügen Einträge hinzu via Object.assign oder direkter Mutation.
// Für TDD: erlaubt leeres Objekt zur Foundation-Zeit.
export const MODULE_REGISTRY: Record<string, AssetModule> = {}
export const MODULE_PROMPTS: Record<string, string> = {}
```

- [ ] **Step 3: Tests grün (trivial bei leerem Registry). Commit** — `feat(assets): add module registry skeleton`

## Task 7: State-Init + Sanitizer + BASE_STATE

**Files:**

- Modify: `src/context/state/createInitialState.ts` (oder existierende Init-Datei finden via `grep -rn 'rngSeed\|createInitialState' src/context`)
- Modify: `src/context/reducers/systemReducer.ts`
- Modify: `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- Test: `tests/node/assetPayloadSanitization.test.js`

- [ ] **Step 1: Failing test für Sanitizer (Spec §3.2)**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizeAssets,
  sanitizeLiabilities,
  sanitizeCrowdfundCampaigns
} from '../../src/context/reducers/systemReducer.ts'

test('sanitizeAssets strips prototype keys', () => {
  const hostile = JSON.parse(
    '{"__proto__":{"polluted":true},"id":"a","kind":"tourbus_chassis","chassisFlavor":"legit","chassisTier":1,"condition":50,"baseUpkeep":10,"baseDailyRevenue":0,"slots":[],"acquiredOnDay":1,"acquisitionMode":"cash","baseRiskEventChance":0.005}'
  )
  const out = sanitizeAssets([hostile])
  assert.ok(!Object.hasOwn({}, 'polluted'))
  assert.equal(out.length, 1)
})

test('sanitizeAssets drops unknown kind', () => {
  const out = sanitizeAssets([
    {
      id: 'a',
      kind: 'not_real',
      chassisFlavor: 'legit',
      chassisTier: 1,
      condition: 50,
      baseUpkeep: 10,
      baseDailyRevenue: 0,
      slots: [],
      acquiredOnDay: 1,
      acquisitionMode: 'cash',
      baseRiskEventChance: 0
    }
  ])
  assert.equal(out.length, 0)
})

test('sanitizeAssets clamps condition and finitizes numbers', () => {
  const out = sanitizeAssets([
    {
      id: 'a',
      kind: 'tourbus_chassis',
      chassisFlavor: 'legit',
      chassisTier: 1,
      condition: NaN,
      baseUpkeep: Infinity,
      baseDailyRevenue: 0,
      slots: [],
      acquiredOnDay: 1,
      acquisitionMode: 'cash',
      baseRiskEventChance: 0.005
    }
  ])
  assert.equal(out[0].condition, 0)
  assert.equal(out[0].baseUpkeep, 0)
})

test('sanitizeLiabilities drops orphans', () => {
  const assets = [{ id: 'a1' }]
  const out = sanitizeLiabilities(
    [
      {
        id: 'l1',
        source: 'loan',
        assetId: 'a1',
        principalRemaining: 100,
        interestRate: 0.05,
        dailyPayment: 1,
        termDaysRemaining: 60,
        defaultCounter: 0
      },
      {
        id: 'l2',
        source: 'loan',
        assetId: 'orphan',
        principalRemaining: 100,
        interestRate: 0.05,
        dailyPayment: 1,
        termDaysRemaining: 60,
        defaultCounter: 0
      }
    ],
    assets
  )
  assert.equal(out.length, 1)
  assert.equal(out[0].id, 'l1')
})
```

- [ ] **Step 2: Implementierung in `systemReducer.ts`** (gegen `finiteNumberOr`, `clampCondition`, `MODULE_REGISTRY`, `CHASSIS_CONFIG`):

```ts
import { finiteNumberOr, clampCondition } from '../../utils/gameStateUtils'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import type {
  LongTermAsset,
  Liability,
  CrowdfundCampaign,
  AssetSlot
} from '../../types/assets'

const VALID_KINDS = new Set([
  'tourbus_chassis',
  'studio_chassis',
  'bandhaus_chassis',
  'merch_workshop_chassis'
])
const VALID_FLAVORS = new Set(['legit', 'diy'])
const VALID_MODES = new Set(['cash', 'loan', 'crowdfund'])
const VALID_SOURCES = new Set(['loan', 'crowdfund'])

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const stripHostileKeys = <T extends Record<string, unknown>>(o: T): T => {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(o)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue
    if (Object.hasOwn(o, k)) out[k] = o[k]
  }
  return out as T
}

export const sanitizeAssets = (raw: unknown): LongTermAsset[] => {
  if (!Array.isArray(raw)) return []
  const out: LongTermAsset[] = []
  const seenIds = new Set<string>()
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const clean = stripHostileKeys(item)
    if (typeof clean.id !== 'string' || seenIds.has(clean.id)) continue
    if (!VALID_KINDS.has(clean.kind as string)) continue
    if (!VALID_FLAVORS.has(clean.chassisFlavor as string)) continue
    if (![1, 2, 3].includes(clean.chassisTier as number)) continue
    if (!VALID_MODES.has(clean.acquisitionMode as string)) continue
    const slots = sanitizeSlots(
      clean.slots,
      clean.kind as string,
      clean.chassisTier as number
    )
    out.push({
      id: clean.id,
      kind: clean.kind as LongTermAsset['kind'],
      chassisFlavor: clean.chassisFlavor as LongTermAsset['chassisFlavor'],
      chassisTier: clean.chassisTier as 1 | 2 | 3,
      condition: clampCondition(finiteNumberOr(clean.condition, 100)),
      baseUpkeep: finiteNumberOr(clean.baseUpkeep, 0),
      baseDailyRevenue: finiteNumberOr(clean.baseDailyRevenue, 0),
      slots,
      acquiredOnDay: finiteNumberOr(clean.acquiredOnDay, 0),
      acquisitionMode:
        clean.acquisitionMode as LongTermAsset['acquisitionMode'],
      baseRiskEventChance: finiteNumberOr(clean.baseRiskEventChance, 0)
    })
    seenIds.add(clean.id)
  }
  return out
}

const sanitizeSlots = (
  raw: unknown,
  kind: string,
  tier: number
): AssetSlot[] => {
  if (!Array.isArray(raw)) return []
  const out: AssetSlot[] = []
  const seenModuleIds = new Set<string>()
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const clean = stripHostileKeys(item)
    if (typeof clean.id !== 'string') continue
    if (typeof clean.slotType !== 'string') continue
    const moduleId =
      typeof clean.installedModuleId === 'string'
        ? clean.installedModuleId
        : null
    let validModuleId: string | null = null
    if (moduleId && Object.hasOwn(MODULE_REGISTRY, moduleId)) {
      const m = MODULE_REGISTRY[moduleId]
      if (m.slotType === clean.slotType && !seenModuleIds.has(moduleId)) {
        validModuleId = moduleId
        seenModuleIds.add(moduleId)
      }
    }
    const pos = isPlainObject(clean.position)
      ? {
          x: finiteNumberOr(clean.position.x, 0),
          y: finiteNumberOr(clean.position.y, 0)
        }
      : { x: 0, y: 0 }
    out.push({
      id: clean.id,
      slotType: clean.slotType as AssetSlot['slotType'],
      position: pos,
      installedModuleId: validModuleId,
      addedByModuleId:
        typeof clean.addedByModuleId === 'string' &&
        Object.hasOwn(MODULE_REGISTRY, clean.addedByModuleId)
          ? clean.addedByModuleId
          : undefined
    })
  }
  return out
}

export const sanitizeLiabilities = (
  raw: unknown,
  assets: { id: string }[]
): Liability[] => {
  if (!Array.isArray(raw)) return []
  const assetIds = new Set(assets.map(a => a.id))
  const out: Liability[] = []
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const clean = stripHostileKeys(item)
    if (typeof clean.id !== 'string') continue
    if (!VALID_SOURCES.has(clean.source as string)) continue
    if (typeof clean.assetId !== 'string' || !assetIds.has(clean.assetId))
      continue
    out.push({
      id: clean.id,
      source: clean.source as Liability['source'],
      assetId: clean.assetId,
      principalRemaining: finiteNumberOr(clean.principalRemaining, 0),
      interestRate: finiteNumberOr(clean.interestRate, 0),
      dailyPayment: finiteNumberOr(clean.dailyPayment, 0),
      termDaysRemaining: finiteNumberOr(clean.termDaysRemaining, 0),
      defaultCounter: finiteNumberOr(clean.defaultCounter, 0),
      crowdfundFamePromised:
        typeof clean.crowdfundFamePromised === 'number'
          ? finiteNumberOr(clean.crowdfundFamePromised, 0)
          : undefined
    })
  }
  return out
}

export const sanitizeCrowdfundCampaigns = (
  raw: unknown
): CrowdfundCampaign[] => {
  if (!Array.isArray(raw)) return []
  const out: CrowdfundCampaign[] = []
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const clean = stripHostileKeys(item)
    if (typeof clean.id !== 'string') continue
    if (!isPlainObject(clean.assetSpec)) continue
    const spec = clean.assetSpec
    if (!VALID_KINDS.has(spec.kind as string)) continue
    if (!VALID_FLAVORS.has(spec.flavor as string)) continue
    if (![1, 2, 3].includes(spec.chassisTier as number)) continue
    const outcome = clean.resolvedOutcome
    out.push({
      id: clean.id,
      assetSpec: {
        kind: spec.kind as any,
        flavor: spec.flavor as any,
        chassisTier: spec.chassisTier as 1 | 2 | 3
      },
      targetAmount: finiteNumberOr(clean.targetAmount, 0),
      fameStake: finiteNumberOr(clean.fameStake, 0),
      daysRemaining: finiteNumberOr(clean.daysRemaining, 0),
      plannedSuccessRoll: finiteNumberOr(clean.plannedSuccessRoll, 0),
      resolvedOutcome:
        outcome === 'success' || outcome === 'fail' ? outcome : undefined
    })
  }
  return out
}

export const sanitizeRngSeed = (raw: unknown): number => {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0)
    return raw | 0
  return Date.now() & 0xffffffff
}
```

- [ ] **Step 3: `createInitialState` ergänzen:**

```ts
// in createInitialState(): default zurückgeben
assets: [],
liabilities: [],
crowdfundCampaigns: [],
rngSeed: sanitizeRngSeed(undefined),
```

- [ ] **Step 4: BASE_STATE Fixture aktualisieren:**

```js
// .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js
const BASE_STATE = {
  ...existingFields,
  assets: [],
  liabilities: [],
  crowdfundCampaigns: [],
  rngSeed: 12345
}
```

- [ ] **Step 5: `tests/node/playwright-screenshot-fixture-validation.test.js` läuft grün**
- [ ] **Step 6: Commit** — `feat(assets): add state init + sanitizers + BASE_STATE`

## Task 8: Action-Types

**Files:**

- Modify: `src/context/actions/actionTypes.ts`

- [ ] **Step 1: Einträge ergänzen** (alle aus Spec §5.1):

```ts
export const ActionTypes = {
  ...existingTypes,
  PURCHASE_CHASSIS: 'PURCHASE_CHASSIS',
  PURCHASE_CHASSIS_FAILED: 'PURCHASE_CHASSIS_FAILED',
  UPGRADE_CHASSIS_TIER: 'UPGRADE_CHASSIS_TIER',
  SELL_CHASSIS: 'SELL_CHASSIS',
  SELL_CHASSIS_FAILED: 'SELL_CHASSIS_FAILED',
  REPAIR_CHASSIS: 'REPAIR_CHASSIS',
  INSTALL_MODULE: 'INSTALL_MODULE',
  INSTALL_MODULE_FAILED: 'INSTALL_MODULE_FAILED',
  REMOVE_MODULE: 'REMOVE_MODULE',
  START_CROWDFUND: 'START_CROWDFUND',
  RESOLVE_CROWDFUND: 'RESOLVE_CROWDFUND',
  ASSET_FORECLOSED: 'ASSET_FORECLOSED',
  ASSET_RISK_EVENT_TRIGGERED: 'ASSET_RISK_EVENT_TRIGGERED',
  ASSET_TICK: 'ASSET_TICK',
  LIABILITY_PAYMENT_TICK: 'LIABILITY_PAYMENT_TICK'
} as const
```

- [ ] **Step 2: GameAction Discriminated Union erweitern** in `src/types/actions.d.ts`:

```ts
export type GameAction =
  | existingActions
  | {
      type: typeof ActionTypes.PURCHASE_CHASSIS
      payload: {
        id: string
        kind: AssetKind
        flavor: AssetFlavor
        tier: ChassisTier
        mode: AcquisitionMode
        slotIds: string[]
        loanProfileId?: LoanProfileId
        crowdfundId?: string
        today: number
      }
    }
  | {
      type: typeof ActionTypes.PURCHASE_CHASSIS_FAILED
      payload: {
        reason:
          | 'DIY_LOAN_NOT_ALLOWED'
          | 'INSUFFICIENT_FUNDS'
          | 'LIABILITY_EXCEEDS_VALUE'
      }
    }
  | {
      type: typeof ActionTypes.UPGRADE_CHASSIS_TIER
      payload: {
        assetId: string
        targetTier: ChassisTier
        newSlotIds: { slotType: SlotType; id: string }[]
      }
    }
  | { type: typeof ActionTypes.SELL_CHASSIS; payload: { assetId: string } }
  | {
      type: typeof ActionTypes.SELL_CHASSIS_FAILED
      payload: { reason: 'LIABILITY_EXCEEDS_VALUE' }
    }
  | { type: typeof ActionTypes.REPAIR_CHASSIS; payload: { assetId: string } }
  | {
      type: typeof ActionTypes.INSTALL_MODULE
      payload: {
        assetId: string
        slotId: string
        moduleId: string
        newSlotIds?: { slotType: SlotType; id: string }[]
      }
    }
  | {
      type: typeof ActionTypes.INSTALL_MODULE_FAILED
      payload: {
        reason:
          | 'SLOT_TYPE_MISMATCH'
          | 'LOCKED'
          | 'EXCLUSIVITY'
          | 'MAX_PER_ASSET'
          | 'SLOT_OCCUPIED'
          | 'UNKNOWN_MODULE'
      }
    }
  | {
      type: typeof ActionTypes.REMOVE_MODULE
      payload: { assetId: string; slotId: string }
    }
  | {
      type: typeof ActionTypes.START_CROWDFUND
      payload: { campaign: CrowdfundCampaign }
    }
  | {
      type: typeof ActionTypes.RESOLVE_CROWDFUND
      payload: {
        campaignId: string
        outcome: 'success' | 'fail'
        newAssetId?: string
        newSlotIds?: { slotType: SlotType; id: string }[]
      }
    }
  | { type: typeof ActionTypes.ASSET_FORECLOSED; payload: { assetId: string } }
  | {
      type: typeof ActionTypes.ASSET_RISK_EVENT_TRIGGERED
      payload: {
        assetId: string
        eventType: RiskEventType
        conditionLoss: number
      }
    }
  | { type: typeof ActionTypes.ASSET_TICK; payload: { dayRngStream: number[] } }
  | {
      type: typeof ActionTypes.LIABILITY_PAYMENT_TICK
      payload: { day: number }
    }
```

- [ ] **Step 3: `pnpm run typecheck:core` grün. Commit** — `feat(assets): add action types and union extensions`

## Task 9: Action-Creators

**Files:**

- Create: `src/context/actions/assetActionCreators.ts`
- Test: `tests/node/assetActionCreators.test.js`

- [ ] **Step 1: Test (Spec §5.2 Validierungs-Pfade)**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  purchaseChassis,
  installModule
} from '../../src/context/actions/assetActionCreators.ts'
import { ActionTypes } from '../../src/context/actions/actionTypes.ts'

test('purchaseChassis returns FAILED for DIY+loan', () => {
  const a = purchaseChassis(
    { kind: 'tourbus_chassis', flavor: 'diy', tier: 1, mode: 'loan', today: 1 },
    mockState({ money: 99999 })
  )
  assert.equal(a.type, ActionTypes.PURCHASE_CHASSIS_FAILED)
  assert.equal(a.payload.reason, 'DIY_LOAN_NOT_ALLOWED')
})

test('purchaseChassis returns FAILED for insufficient funds', () => {
  const a = purchaseChassis(
    {
      kind: 'tourbus_chassis',
      flavor: 'legit',
      tier: 1,
      mode: 'cash',
      today: 1
    },
    mockState({ money: 0 })
  )
  assert.equal(a.type, ActionTypes.PURCHASE_CHASSIS_FAILED)
})

test('installModule returns FAILED for slot-type mismatch', () => {
  const state = mockStateWithAsset()
  const a = installModule(
    { assetId: 'a1', slotId: 'slot_roof', moduleId: 'module_for_audio' },
    state
  )
  assert.equal(a.type, ActionTypes.INSTALL_MODULE_FAILED)
  assert.equal(a.payload.reason, 'SLOT_TYPE_MISMATCH')
})

function mockState(overrides) {
  return {
    money: 0,
    band: { fame: 0, scenePresence: 0, members: [] },
    assets: [],
    liabilities: [],
    storyFlags: [],
    ...overrides
  }
}
function mockStateWithAsset() {
  /* ... */
}
```

- [ ] **Step 2: Implementation:**

Vollständiger Inhalt (kontrahiert — `installModule` zeigt Pattern, andere Creators analog):

```ts
import type { GameAction } from '../../types/actions'
import type { GameState } from '../../types/game'
import type {
  AssetKind,
  AssetFlavor,
  ChassisTier,
  AcquisitionMode,
  AssetSlot
} from '../../types/assets'
import { ActionTypes } from './actionTypes'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import { LOAN_PROFILES, type LoanProfileId } from '../../utils/loanProfiles'
import { isModuleUnlocked, getSlotConflicts } from '../../utils/assetSelectors'
import { finiteNumberOr } from '../../utils/gameStateUtils'
import { getSafeUUID } from '../../utils/safeUuid' // bestehender Helper

type Extract2<T, V> = Extract<T, { type: V }>

export const purchaseChassis = (
  raw: {
    kind: AssetKind
    flavor: AssetFlavor
    tier: ChassisTier
    mode: AcquisitionMode
    today: number
    loanProfileId?: LoanProfileId
  },
  state: GameState
): Extract2<
  GameAction,
  | typeof ActionTypes.PURCHASE_CHASSIS
  | typeof ActionTypes.PURCHASE_CHASSIS_FAILED
> => {
  if (raw.flavor === 'diy' && raw.mode === 'loan') {
    return {
      type: ActionTypes.PURCHASE_CHASSIS_FAILED,
      payload: { reason: 'DIY_LOAN_NOT_ALLOWED' }
    }
  }
  const cfg = CHASSIS_CONFIG[raw.kind]?.[raw.flavor]?.[raw.tier]
  if (!cfg)
    return {
      type: ActionTypes.PURCHASE_CHASSIS_FAILED,
      payload: { reason: 'INSUFFICIENT_FUNDS' }
    }
  if (raw.mode === 'cash' && state.money < cfg.price) {
    return {
      type: ActionTypes.PURCHASE_CHASSIS_FAILED,
      payload: { reason: 'INSUFFICIENT_FUNDS' }
    }
  }
  const slotIds = cfg.slots.map(() => getSafeUUID())
  return {
    type: ActionTypes.PURCHASE_CHASSIS,
    payload: {
      id: getSafeUUID(),
      kind: raw.kind,
      flavor: raw.flavor,
      tier: raw.tier,
      mode: raw.mode,
      slotIds,
      loanProfileId: raw.loanProfileId,
      today: finiteNumberOr(raw.today, 0)
    }
  }
}

export const installModule = (
  raw: { assetId: string; slotId: string; moduleId: string },
  state: GameState
): Extract2<
  GameAction,
  typeof ActionTypes.INSTALL_MODULE | typeof ActionTypes.INSTALL_MODULE_FAILED
> => {
  const module = MODULE_REGISTRY[raw.moduleId]
  if (!module)
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'UNKNOWN_MODULE' }
    }
  const asset = state.assets.find(a => a.id === raw.assetId)
  if (!asset)
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'UNKNOWN_MODULE' }
    }
  const slot = asset.slots.find(s => s.id === raw.slotId)
  if (!slot)
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'UNKNOWN_MODULE' }
    }
  if (slot.installedModuleId !== null)
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'SLOT_OCCUPIED' }
    }
  if (slot.slotType !== module.slotType)
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'SLOT_TYPE_MISMATCH' }
    }
  if (!isModuleUnlocked(module, state))
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'LOCKED' }
    }
  const conflicts = getSlotConflicts(asset, raw.moduleId)
  if (!conflicts.canInstall)
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'EXCLUSIVITY' }
    }
  const cap = module.maxPerAsset ?? 1
  const currentCount = asset.slots.filter(
    s => s.installedModuleId === raw.moduleId
  ).length
  if (currentCount >= cap)
    return {
      type: ActionTypes.INSTALL_MODULE_FAILED,
      payload: { reason: 'MAX_PER_ASSET' }
    }
  const newSlotIds = (module.addsSlots ?? []).flatMap(s =>
    Array.from({ length: s.count }, () => ({
      slotType: s.slotType,
      id: getSafeUUID()
    }))
  )
  return {
    type: ActionTypes.INSTALL_MODULE,
    payload: {
      assetId: raw.assetId,
      slotId: raw.slotId,
      moduleId: raw.moduleId,
      newSlotIds
    }
  }
}

// Analog: upgradeChassisTier, sellChassis, repairChassis, removeModule,
// startCrowdfund (zieht plannedSuccessRoll), advanceDay (mit dayRngStream)
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets): add action creators with validation`

## Task 10: Selektoren

**Files:**

- Create: `src/utils/assetSelectors.ts`
- Test: `tests/node/assetSelectors.test.js`

- [ ] **Step 1: Test (Spec §6)**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  NEUTRAL_ASSET_MODIFIERS,
  getActiveAssetModifiers,
  getAssetTotalUpkeep,
  getAssetTotalDailyRevenue,
  getTotalDailyObligations,
  isModuleUnlocked
} from '../../src/utils/assetSelectors.ts'

test('NEUTRAL_ASSET_MODIFIERS has 1.0 multipliers and 0 additives', () => {
  assert.equal(NEUTRAL_ASSET_MODIFIERS.fuelMultiplier, 1.0)
  assert.equal(NEUTRAL_ASSET_MODIFIERS.staminaRegenBonusPerDay, 0)
  assert.equal(NEUTRAL_ASSET_MODIFIERS.flags.infightingDamper, false)
})

test('getActiveAssetModifiers returns neutral for empty array', () => {
  assert.deepEqual(getActiveAssetModifiers([]), NEUTRAL_ASSET_MODIFIERS)
})

test('broken asset (condition<20) contributes nothing', () => {
  // mock asset with condition=10, installed module with fuelMultiplier 0.5
  // → modifier remains 1.0
})

test('isModuleUnlocked checks all unlock fields with AND', () => {
  /* ... */
})
```

- [ ] **Step 2: Implementation** (siehe Spec §6 für vollständige Signatures, hier Auszug):

```ts
import type {
  LongTermAsset,
  AssetModule,
  AssetModifiers,
  AssetBoni,
  ModuleUnlockReq
} from '../types/assets'
import type { GameState } from '../types/game'
import { MODULE_REGISTRY } from './assetModuleRegistry'
import { calculateGuaranteedDailyCost } from './economyEngine'

export const NEUTRAL_ASSET_MODIFIERS: AssetModifiers = {
  fuelMultiplier: 1.0,
  merchCostMultiplier: 1.0,
  songCostMultiplier: 1.0,
  trainingCostMultiplier: 1.0,
  baseRiskChanceMultiplier: 1.0,
  staminaRegenBonusPerDay: 0,
  travelStaminaRegen: 0,
  merchCapacityBonus: 0,
  songQualityBonus: 0,
  avgMerchSalePriceBonus: 0,
  famePassivePerDay: 0,
  bandMoodPerDay: 0,
  tipBonusGigs: 0,
  flags: {
    infightingDamper: false,
    enablesReRecording: false,
    enablesLimitedEditions: false,
    enablesBulkProduction: false,
    reducesTheftRiskTravel: false
  }
}

export const getInstalledModules = (asset: LongTermAsset): AssetModule[] =>
  asset.slots
    .map(s =>
      s.installedModuleId ? MODULE_REGISTRY[s.installedModuleId] : null
    )
    .filter((m): m is AssetModule => m !== null)

export const getAssetAggregateBoni = (asset: LongTermAsset): AssetBoni => {
  if (asset.condition < 20) return {}
  const modules = getInstalledModules(asset)
  const agg: AssetBoni = {}
  for (const m of modules) {
    for (const [k, v] of Object.entries(m.boni)) {
      const key = k as keyof AssetBoni
      if (typeof v === 'number') {
        const current = agg[key] as number | undefined
        if (key.endsWith('Multiplier') || key === 'diyRiskMultiplier') {
          ;(agg as any)[key] = (current ?? 1.0) * v
        } else {
          ;(agg as any)[key] = (current ?? 0) + v
        }
      } else if (typeof v === 'boolean') {
        ;(agg as any)[key] = (agg as any)[key] || v
      }
    }
  }
  return agg
}

export const getAssetTotalUpkeep = (asset: LongTermAsset): number =>
  asset.baseUpkeep + (getAssetAggregateBoni(asset).upkeepDelta ?? 0)

export const getAssetTotalDailyRevenue = (asset: LongTermAsset): number =>
  (asset.baseDailyRevenue +
    (getAssetAggregateBoni(asset).baseDailyRevenueDelta ?? 0)) *
  (asset.condition / 100)

export const getActiveAssetModifiers = (
  assets: LongTermAsset[]
): AssetModifiers => {
  const m = {
    ...NEUTRAL_ASSET_MODIFIERS,
    flags: { ...NEUTRAL_ASSET_MODIFIERS.flags }
  }
  for (const a of assets) {
    if (a.condition < 20) continue
    const b = getAssetAggregateBoni(a)
    if (b.fuelMultiplier) m.fuelMultiplier *= b.fuelMultiplier
    if (b.merchCostMultiplier) m.merchCostMultiplier *= b.merchCostMultiplier
    if (b.songCostMultiplier) m.songCostMultiplier *= b.songCostMultiplier
    if (b.trainingCostMultiplier)
      m.trainingCostMultiplier *= b.trainingCostMultiplier
    if (b.baseRiskChanceMultiplier)
      m.baseRiskChanceMultiplier *= b.baseRiskChanceMultiplier
    m.staminaRegenBonusPerDay += b.staminaRegenBonusPerDay ?? 0
    m.travelStaminaRegen += b.travelStaminaRegen ?? 0
    m.merchCapacityBonus += b.merchCapacityBonus ?? 0
    m.songQualityBonus += b.songQualityBonus ?? 0
    m.avgMerchSalePriceBonus += b.avgMerchSalePriceBonus ?? 0
    m.famePassivePerDay += b.famePassivePerDay ?? 0
    m.bandMoodPerDay += b.bandMoodPerDay ?? 0
    m.tipBonusGigs += b.tipBonusGigs ?? 0
    m.flags.infightingDamper ||= b.infightingDamper ?? false
    m.flags.enablesReRecording ||= b.enablesReRecording ?? false
    m.flags.enablesLimitedEditions ||= b.enablesLimitedEditions ?? false
    m.flags.enablesBulkProduction ||= b.enablesBulkProduction ?? false
    m.flags.reducesTheftRiskTravel ||= b.reducesTheftRiskTravel ?? false
  }
  return m
}

export const getTotalDailyObligations = (state: GameState): number => {
  const base = calculateGuaranteedDailyCost(state.band) // bestehende Funktion
  const upkeep = state.assets.reduce((s, a) => s + getAssetTotalUpkeep(a), 0)
  const revenue = state.assets.reduce(
    (s, a) => s + getAssetTotalDailyRevenue(a),
    0
  )
  const liabilityPayments = state.liabilities.reduce(
    (s, l) => s + l.dailyPayment,
    0
  )
  return base + upkeep - revenue + liabilityPayments
}

export const isModuleUnlocked = (
  module: AssetModule,
  state: GameState
): boolean => {
  const u = module.unlock
  if (u.minFame && state.band.fame < u.minFame) return false
  if (u.minMoney && state.money < u.minMoney) return false
  if (u.minScenePresence && state.band.scenePresence < u.minScenePresence)
    return false
  if (u.requiredStoryFlags) {
    for (const f of u.requiredStoryFlags) {
      if (!state.storyFlags.includes(f)) return false
    }
  }
  if (u.requiredMemberSkill) {
    const { memberId, skill, tier } = u.requiredMemberSkill
    const candidates = memberId
      ? state.band.members.filter(m => m.id === memberId)
      : state.band.members
    if (!candidates.some(m => (m.skills?.[skill] ?? 0) >= tier)) return false
  }
  if (u.requiredOtherModuleInstalled) {
    const required = Array.isArray(u.requiredOtherModuleInstalled)
      ? u.requiredOtherModuleInstalled
      : [u.requiredOtherModuleInstalled]
    const installed = state.assets.flatMap(a =>
      a.slots.map(s => s.installedModuleId)
    )
    if (!required.some(r => installed.includes(r))) return false
  }
  return true
}

export const getSlotConflicts = (
  asset: LongTermAsset,
  moduleId: string
): { canInstall: boolean; conflictingModuleIds: string[] } => {
  const target = MODULE_REGISTRY[moduleId]
  if (!target?.exclusiveWithGroup)
    return { canInstall: true, conflictingModuleIds: [] }
  const conflicting: string[] = []
  for (const s of asset.slots) {
    const m = s.installedModuleId ? MODULE_REGISTRY[s.installedModuleId] : null
    if (
      m &&
      m.exclusiveWithGroup === target.exclusiveWithGroup &&
      m.id !== moduleId
    ) {
      conflicting.push(m.id)
    }
  }
  return {
    canInstall: conflicting.length === 0,
    conflictingModuleIds: conflicting
  }
}

export const getModulePoolForAsset = (
  asset: LongTermAsset,
  state: GameState
): Array<{ module: AssetModule; unlocked: boolean; lockReasons: string[] }> => {
  return Object.values(MODULE_REGISTRY)
    .filter(m => m.ownerKind === asset.kind)
    .map(m => {
      const unlocked = isModuleUnlocked(m, state)
      const lockReasons: string[] = []
      if (!unlocked) {
        // Build human-readable reasons; deferred to UI layer for i18n keys
        if (m.unlock.minFame && state.band.fame < m.unlock.minFame)
          lockReasons.push(`minFame:${m.unlock.minFame}`)
        if (m.unlock.minMoney && state.money < m.unlock.minMoney)
          lockReasons.push(`minMoney:${m.unlock.minMoney}`)
        // ...
      }
      return { module: m, unlocked, lockReasons }
    })
}
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets): add selectors with NEUTRAL identity`

## Task 11: Tick-Funktionen

**Files:**

- Create: `src/utils/assetTicks.ts`
- Test: `tests/node/assetTicks.test.js`

- [ ] **Step 1: Tests (Spec §5.4, §5.5)**

```js
test('processAssetTick decays condition and floor at 0', () => {
  /* ... */
})
test('processLiabilityTick increments defaultCounter on shortfall', () => {
  /* ... */
})
test('processCrowdfundTick removes campaign on resolution', () => {
  /* ... */
})
test('rollAssetRiskEvents consumes dayRngStream deterministically', () => {
  /* ... */
})
test('resolveCrowdfundProbability formula is within MIN_P..MAX_P', () => {
  /* ... */
})
```

- [ ] **Step 2: Implementation** (Spec §5.4 Tick-Reihenfolge, §5.6 Bankrott, §8.6 Crowdfund-Formel):

```ts
import type {
  LongTermAsset,
  Liability,
  CrowdfundCampaign
} from '../types/assets'
import type { GameState } from '../types/game'
import { clampCondition, finiteNumberOr } from './gameStateUtils'
import {
  getAssetTotalUpkeep,
  getAssetTotalDailyRevenue,
  getAssetAggregateBoni
} from './assetSelectors'
import { MODULE_REGISTRY } from './assetModuleRegistry'

const CONDITION_DECAY_PER_DAY: Record<string, number> = {
  tourbus_chassis: 0.5,
  studio_chassis: 0.2,
  bandhaus_chassis: 0.3,
  merch_workshop_chassis: 0.3
}
const DEFAULT_THRESHOLD_DAYS = 7

export const processAssetTick = (state: GameState): GameState => {
  const assets = state.assets.map(a => ({
    ...a,
    condition: clampCondition(
      a.condition - (CONDITION_DECAY_PER_DAY[a.kind] ?? 0.3)
    )
  }))
  const moneyDelta = state.assets.reduce(
    (s, a) => s + getAssetTotalDailyRevenue(a) - getAssetTotalUpkeep(a),
    0
  )
  return { ...state, assets, money: state.money + moneyDelta }
}

export const processLiabilityTick = (state: GameState): GameState => {
  const newLiabilities: Liability[] = []
  let money = state.money
  const foreclosedAssetIds: string[] = []
  for (const l of state.liabilities) {
    if (money >= l.dailyPayment) {
      money -= l.dailyPayment
      const principal = Math.max(0, l.principalRemaining - l.dailyPayment)
      const term = Math.max(0, l.termDaysRemaining - 1)
      if (principal === 0 || term === 0) continue
      newLiabilities.push({
        ...l,
        principalRemaining: principal,
        termDaysRemaining: term,
        defaultCounter: 0
      })
    } else {
      const counter = l.defaultCounter + 1
      if (counter >= DEFAULT_THRESHOLD_DAYS) {
        foreclosedAssetIds.push(l.assetId)
        continue
      }
      newLiabilities.push({ ...l, defaultCounter: counter })
    }
  }
  const assets = state.assets.filter(a => !foreclosedAssetIds.includes(a.id))
  return { ...state, money, liabilities: newLiabilities, assets }
}

const CROWDFUND_CONSTANTS = {
  BASE: 0.3,
  FAME: 0.4,
  SCENE: 0.2,
  COST_PENALTY: 0.1,
  MIN_P: 0.05,
  MAX_P: 0.9
}

export const resolveCrowdfundProbability = (
  fame: number,
  scenePresence: number,
  targetAmount: number
): number => {
  const C = CROWDFUND_CONSTANTS
  const raw =
    C.BASE +
    (fame / Math.max(1, targetAmount / 100)) * C.FAME +
    (scenePresence / 100) * C.SCENE -
    (targetAmount / 10000) * C.COST_PENALTY
  return Math.max(C.MIN_P, Math.min(C.MAX_P, raw))
}

export const processCrowdfundTick = (state: GameState): GameState => {
  const active: CrowdfundCampaign[] = []
  let assets = state.assets
  let money = state.money
  let fame = state.band.fame
  for (const c of state.crowdfundCampaigns) {
    const remaining = c.daysRemaining - 1
    if (remaining > 0) {
      active.push({ ...c, daysRemaining: remaining })
      continue
    }
    // Resolution
    const prob = resolveCrowdfundProbability(
      state.band.fame,
      state.band.scenePresence,
      c.targetAmount
    )
    const success = c.plannedSuccessRoll < prob
    if (success) {
      money += c.targetAmount
      fame += c.fameStake // Bonus
      // Asset-Erstellung wird vom reducer ausgeführt via RESOLVE_CROWDFUND-Action
    } else {
      fame = Math.max(0, fame - c.fameStake)
    }
  }
  return {
    ...state,
    crowdfundCampaigns: active,
    money,
    band: { ...state.band, fame }
  }
}

export const rollAssetRiskEvents = (
  state: GameState,
  dayRngStream: number[]
): {
  state: GameState
  events: Array<{ assetId: string; eventType: string; conditionLoss: number }>
} => {
  let cursor = 0
  const events: Array<{
    assetId: string
    eventType: string
    conditionLoss: number
  }> = []
  for (const a of state.assets) {
    const modules = a.slots
      .map(s => s.installedModuleId)
      .filter(Boolean)
      .map(id => MODULE_REGISTRY[id as string])
    const boni = getAssetAggregateBoni(a)
    const eventTypes = Array.from(
      new Set(modules.flatMap(m => m.riskEventTypes ?? []))
    )
    if (eventTypes.length === 0) continue
    const chance =
      a.baseRiskEventChance *
      (boni.baseRiskChanceMultiplier ?? 1.0) *
      (boni.diyRiskMultiplier ?? 1.0)
    const roll = dayRngStream[cursor++] ?? 1.0
    if (roll < chance) {
      const eventRoll = dayRngStream[cursor++] ?? 0
      const eventType = eventTypes[Math.floor(eventRoll * eventTypes.length)]
      events.push({ assetId: a.id, eventType, conditionLoss: 15 })
    }
  }
  // Apply condition loss
  const assets = state.assets.map(a => {
    const e = events.find(e => e.assetId === a.id)
    return e
      ? { ...a, condition: clampCondition(a.condition - e.conditionLoss) }
      : a
  })
  return { state: { ...state, assets }, events }
}
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets): add tick functions (asset/liability/crowdfund/risk)`

## Task 12: Reducer

**Files:**

- Create: `src/context/reducers/assetReducer.ts`
- Modify: `src/context/reducers/gameReducer.ts`
- Test: `tests/node/assetsReducer.test.js`

- [ ] **Step 1: Reducer-Test**

```js
test('PURCHASE_CHASSIS adds asset with all slots', () => {
  /* ... */
})
test('INSTALL_MODULE places module in slot and appends addsSlots', () => {
  /* ... */
})
test('REMOVE_MODULE refunds and clears slot (and addedByModuleId slots)', () => {
  /* ... */
})
test('UPGRADE_CHASSIS_TIER appends new slots', () => {
  /* ... */
})
test('SELL_CHASSIS removes asset and credits refund', () => {
  /* ... */
})
test('REPAIR_CHASSIS sets condition to 100', () => {
  /* ... */
})
test('ASSET_TICK consumes dayRngStream and dispatches events', () => {
  /* ... */
})
test('assertNever default branch', () => {
  /* ... */
})
```

- [ ] **Step 2: Reducer implementieren** (Spec §5.3 für Upgrade/Sell/Repair-Semantik):

Vollständiger Code-Skelett:

```ts
import { ActionTypes } from '../actions/actionTypes'
import type { GameAction } from '../../types/actions'
import type { GameState } from '../../types/game'
import { assertNever } from '../../utils/assertNever'
import {
  CHASSIS_CONFIG,
  UPGRADE_OVERHEAD,
  REPAIR_COST_PER_POINT
} from '../../utils/assetConfig'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import { LOAN_PROFILES, computeAmortization } from '../../utils/loanProfiles'
import {
  processAssetTick,
  processLiabilityTick,
  processCrowdfundTick,
  rollAssetRiskEvents
} from '../../utils/assetTicks'
import { clampCondition, finiteNumberOr } from '../../utils/gameStateUtils'

export const assetReducer = (
  state: GameState,
  action: GameAction
): GameState => {
  switch (action.type) {
    case ActionTypes.PURCHASE_CHASSIS: {
      const p = action.payload
      const cfg = CHASSIS_CONFIG[p.kind][p.flavor][p.tier]
      const slots = cfg.slots.map((slotType, i) => ({
        id: p.slotIds[i],
        slotType,
        position: { x: 0, y: 0 }, // wird vom Section-Plan überschrieben
        installedModuleId: null
      }))
      const asset = {
        id: p.id,
        kind: p.kind,
        chassisFlavor: p.flavor,
        chassisTier: p.tier,
        condition: 100,
        baseUpkeep: cfg.upkeep,
        baseDailyRevenue: cfg.revenue,
        slots,
        acquiredOnDay: p.today,
        acquisitionMode: p.mode,
        baseRiskEventChance: cfg.baseRiskEventChance
      }
      let money = state.money
      const liabilities = [...state.liabilities]
      if (p.mode === 'cash') money -= cfg.price
      else if (p.mode === 'loan' && p.loanProfileId) {
        const profile = LOAN_PROFILES[p.loanProfileId]
        liabilities.push({
          id: `lia_${p.id}`,
          source: 'loan',
          assetId: p.id,
          principalRemaining: cfg.price,
          interestRate: profile.interestRate,
          dailyPayment: computeAmortization(
            cfg.price,
            profile.interestRate,
            profile.termDays
          ),
          termDaysRemaining: profile.termDays,
          defaultCounter: 0
        })
      }
      return { ...state, assets: [...state.assets, asset], money, liabilities }
    }
    case ActionTypes.PURCHASE_CHASSIS_FAILED:
    case ActionTypes.SELL_CHASSIS_FAILED:
    case ActionTypes.INSTALL_MODULE_FAILED:
      // Reducer-Purity: reine No-Op. Toast-Dispatch geschieht NICHT hier.
      // Der Action-Creator (`purchaseChassis` etc., §5.2) gibt die Failed-Action
      // zurück; eine Middleware oder ein Thunk-Wrapper im UI-Layer dispatched
      // den Toast als zusätzliche Action (z.B. ADD_TOAST). Reducer bleibt pure.
      return state
    case ActionTypes.INSTALL_MODULE: {
      const p = action.payload
      const module = MODULE_REGISTRY[p.moduleId]
      const assets = state.assets.map(a => {
        if (a.id !== p.assetId) return a
        const slots = a.slots.map(s =>
          s.id === p.slotId ? { ...s, installedModuleId: p.moduleId } : s
        )
        for (const ns of p.newSlotIds ?? []) {
          slots.push({
            id: ns.id,
            slotType: ns.slotType,
            position: { x: 0, y: 0 },
            installedModuleId: null,
            addedByModuleId: p.moduleId
          })
        }
        return { ...a, slots }
      })
      return {
        ...state,
        assets,
        money: state.money - module.cost - module.installCost
      }
    }
    case ActionTypes.REMOVE_MODULE: {
      const p = action.payload
      const assets = state.assets.map(a => {
        if (a.id !== p.assetId) return a
        const removed = a.slots.find(s => s.id === p.slotId)
        if (!removed?.installedModuleId) return a
        // Entferne den Slot-Eintrag selbst nicht (Original-Chassis-Slot),
        // aber addsSlot-Childs werden entfernt:
        const slots = a.slots
          .filter(s => s.addedByModuleId !== removed.installedModuleId)
          .map(s => (s.id === p.slotId ? { ...s, installedModuleId: null } : s))
        return { ...a, slots }
      })
      const slot = state.assets
        .find(a => a.id === p.assetId)
        ?.slots.find(s => s.id === p.slotId)
      const module = slot?.installedModuleId
        ? MODULE_REGISTRY[slot.installedModuleId]
        : null
      const refund = module ? module.cost * module.removalRefundFraction : 0
      return { ...state, assets, money: state.money + refund }
    }
    case ActionTypes.UPGRADE_CHASSIS_TIER: {
      const p = action.payload
      const assets = state.assets.map(a => {
        if (a.id !== p.assetId) return a
        const newCfg = CHASSIS_CONFIG[a.kind][a.chassisFlavor][p.targetTier]
        const existingSlotTypes = new Set(a.slots.map(s => s.slotType))
        const newSlots = p.newSlotIds
          .filter(s => !existingSlotTypes.has(s.slotType))
          .map(s => ({
            id: s.id,
            slotType: s.slotType,
            position: { x: 0, y: 0 },
            installedModuleId: null
          }))
        return {
          ...a,
          chassisTier: p.targetTier,
          baseUpkeep: newCfg.upkeep,
          slots: [...a.slots, ...newSlots]
        }
      })
      const oldCfg =
        CHASSIS_CONFIG[state.assets.find(a => a.id === p.assetId)!.kind][
          state.assets.find(a => a.id === p.assetId)!.chassisFlavor
        ]
      const cost =
        oldCfg[p.targetTier].price -
        oldCfg[state.assets.find(a => a.id === p.assetId)!.chassisTier].price +
        UPGRADE_OVERHEAD
      return { ...state, assets, money: state.money - cost }
    }
    case ActionTypes.SELL_CHASSIS: {
      const p = action.payload
      const asset = state.assets.find(a => a.id === p.assetId)
      if (!asset) return state
      const cfg =
        CHASSIS_CONFIG[asset.kind][asset.chassisFlavor][asset.chassisTier]
      const conditionFactor = asset.condition / 100
      const daysOwned = 0 // benötigt state.day - asset.acquiredOnDay; vereinfacht hier
      const depreciation = Math.max(0.4, 1 - (daysOwned / 365) * 0.4)
      const modulesRefund = asset.slots
        .map(s =>
          s.installedModuleId ? MODULE_REGISTRY[s.installedModuleId] : null
        )
        .filter(Boolean)
        .reduce((sum, m) => sum + m!.cost * m!.removalRefundFraction, 0)
      const grossSale =
        cfg.price * conditionFactor * depreciation + modulesRefund
      const liability = state.liabilities.find(l => l.assetId === p.assetId)
      const liabilityDebt = liability?.principalRemaining ?? 0
      if (grossSale < liabilityDebt) {
        return state // SELL_CHASSIS_FAILED wurde im Creator zurückgegeben
      }
      return {
        ...state,
        assets: state.assets.filter(a => a.id !== p.assetId),
        liabilities: state.liabilities.filter(l => l.assetId !== p.assetId),
        money: state.money + grossSale - liabilityDebt
      }
    }
    case ActionTypes.REPAIR_CHASSIS: {
      const p = action.payload
      const asset = state.assets.find(a => a.id === p.assetId)
      if (!asset) return state
      const cost = (100 - asset.condition) * REPAIR_COST_PER_POINT
      return {
        ...state,
        assets: state.assets.map(a =>
          a.id === p.assetId ? { ...a, condition: 100 } : a
        ),
        money: state.money - cost
      }
    }
    case ActionTypes.ASSET_TICK: {
      let s = processAssetTick(state)
      s = processLiabilityTick(s)
      s = processCrowdfundTick(s)
      const { state: s2 /*, events */ } = rollAssetRiskEvents(
        s,
        action.payload.dayRngStream
      )
      return s2
    }
    case ActionTypes.START_CROWDFUND:
      return {
        ...state,
        crowdfundCampaigns: [
          ...state.crowdfundCampaigns,
          action.payload.campaign
        ]
      }
    case ActionTypes.RESOLVE_CROWDFUND: {
      const p = action.payload
      const campaigns = state.crowdfundCampaigns.filter(
        c => c.id !== p.campaignId
      )
      // Bei success: asset wird in ähnlicher Form wie PURCHASE_CHASSIS angelegt
      return { ...state, crowdfundCampaigns: campaigns }
    }
    case ActionTypes.ASSET_FORECLOSED:
      return {
        ...state,
        assets: state.assets.filter(a => a.id !== action.payload.assetId),
        liabilities: state.liabilities.filter(
          l => l.assetId !== action.payload.assetId
        )
      }
    case ActionTypes.ASSET_RISK_EVENT_TRIGGERED: {
      const p = action.payload
      return {
        ...state,
        assets: state.assets.map(a =>
          a.id === p.assetId
            ? { ...a, condition: clampCondition(a.condition - p.conditionLoss) }
            : a
        )
      }
    }
    case ActionTypes.LIABILITY_PAYMENT_TICK:
      return state // wird von ASSET_TICK abgedeckt
    default:
      return assertNever(action as never)
  }
}
```

- [ ] **Step 3: In `gameReducer.ts` einhängen:**

```ts
// Nach existierenden Cases, vor default:
case ActionTypes.PURCHASE_CHASSIS:
case ActionTypes.PURCHASE_CHASSIS_FAILED:
case ActionTypes.UPGRADE_CHASSIS_TIER:
// ... alle Asset-Actions
  return assetReducer(state, action)
```

- [ ] **Step 4: Tests grün. Commit** — `feat(assets): add asset reducer with all action handlers`

## Task 13: `advanceDay`-Erweiterung

**Files:**

- Modify: existierende `advanceDay`-Stelle (`grep -rn 'ADVANCE_DAY' src/context`)

- [ ] **Step 1: Test (Spec §5.4)**

```js
test('advanceDay action creator prepares dayRngStream', () => {
  /* ... */
})
test('advanceDay reducer composes asset/liability/crowdfund/risk ticks', () => {
  /* ... */
})
```

- [ ] **Step 2: `advanceDay` Action-Creator zieht `dayRngStream` aus seeded RNG:**

```ts
import { createRngStream, nextSeed } from '../../utils/seededRng'

export const advanceDay = (state: GameState) => {
  const RNG_STREAM_LENGTH = 32 // genug für ~16 Assets × 2 Rolls
  const stream = createRngStream(state.rngSeed, RNG_STREAM_LENGTH)
  return {
    type: ActionTypes.ADVANCE_DAY,
    payload: { dayRngStream: stream, nextRngSeed: nextSeed(state.rngSeed) }
  }
}
```

- [ ] **Step 3: Reducer für ADVANCE_DAY** dispatched intern ASSET_TICK + alle Folge-Ticks, setzt neuen `rngSeed`.

- [ ] **Step 4: Bestehende `createAdvanceDayAction()`-Aufrufer migrieren**

Existierender Code dispatched `createAdvanceDayAction()` (payloadless). Suche alle Call-Sites:

```bash
grep -rn 'createAdvanceDayAction\|ADVANCE_DAY' src --include='*.ts' --include='*.tsx'
```

Erwartete Treffer (mindestens): `src/context/actionCreators.ts`, `src/context/useGameDispatchActions.ts`. Jede Stelle, die `dispatch(createAdvanceDayAction())` aufruft, ersetzen durch:

```ts
import { advanceDay } from '../context/actionCreators' // bzw. neuer Pfad
// Vorher: dispatch(createAdvanceDayAction())
// Nachher (Hook hat Zugriff auf den State):
dispatch(advanceDay(state))
```

In `useGameDispatchActions.ts` (oder dem Hook, der die Action dispatched) muss der Hook über `useGameState()` Zugriff auf den aktuellen State haben, damit `advanceDay(state)` den `rngSeed` lesen kann. Falls der Hook bisher keinen State-Zugriff hatte: ergänzen.

- [ ] **Step 5: Tests anpassen**

Bestehende Tests, die `createAdvanceDayAction()` direkt aufrufen oder die `ADVANCE_DAY`-Action-Shape assertieren, müssen `dayRngStream` und `nextRngSeed` im Payload erwarten:

```js
test('advanceDay action carries dayRngStream and nextRngSeed', () => {
  const action = advanceDay({ ...state, rngSeed: 42 })
  assert.ok(Array.isArray(action.payload.dayRngStream))
  assert.equal(action.payload.dayRngStream.length, 32)
  assert.equal(typeof action.payload.nextRngSeed, 'number')
})
```

Suche bestehende Tests, die das alte Action-Format prüfen: `grep -rn 'createAdvanceDayAction\|ADVANCE_DAY' tests`.

- [ ] **Step 6: Tests grün. Commit** — `feat(assets): wire advanceDay to asset ticks with deterministic RNG`

## Task 14: Economy-Engine-Erweiterung

**Files:**

- Modify: `src/utils/economyEngine.ts`
- Test: `tests/node/economyAssetModifiers.test.js`

- [ ] **Step 1: Tests pro modifizierte Funktion**

```js
test('calculateFuelCost applies fuelMultiplier', () => {
  const cost = calculateFuelCost(100, 1.0, { ...NEUTRAL, fuelMultiplier: 0.5 })
  assert.equal(cost, 50)
})
test('calculateMerchIncome applies merchCostMultiplier and avgMerchSalePriceBonus', () => {
  /* ... */
})
test('calculateGigFinancials applies tipBonusGigs', () => {
  /* ... */
})
```

- [ ] **Step 2: Funktionen erweitern um optionalen `AssetModifiers`-Parameter** (Default `NEUTRAL_ASSET_MODIFIERS`):

```ts
export const calculateFuelCost = (
  distance: number,
  baseRate: number,
  modifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
): number => distance * baseRate * modifiers.fuelMultiplier
```

(Analog für `calculateMerchIncome` und `calculateGigFinancials` — `tipBonusGigs` additiv auf ticket+merch, `merchCostMultiplier` und `avgMerchSalePriceBonus` in Merch-Pfad.)

- [ ] **Step 3: Bestehende Aufrufer durchsuchen** (`grep -rn 'calculateFuelCost\|calculateMerchIncome\|calculateGigFinancials' src`) und prüfen, dass alle bestehenden Tests grün bleiben (Default-Modifier sollte Identity sein).
- [ ] **Step 4: Commit** — `feat(economy): accept AssetModifiers in fuel/merch/gig calculations`

## Task 15: `imageGen.ts`-Helper

**Files:**

- Modify: `src/utils/imageGen.ts`
- Test: `tests/node/assetImagePrompts.test.js`

- [ ] **Step 1: Tests (Spec §8.3)**

```js
test('getChassisImagePrompt is non-empty for all combinations', () => {
  for (const k of [
    'tourbus_chassis',
    'studio_chassis',
    'bandhaus_chassis',
    'merch_workshop_chassis'
  ]) {
    for (const f of ['legit', 'diy']) {
      for (const t of [1, 2, 3]) {
        assert.ok(getChassisImagePrompt(k, f, t).length > 0)
      }
    }
  }
})

test('getModuleImagePrompt falls back to default when key missing', () => {
  // mock MODULE_REGISTRY with module having imagePromptKey 'missing'
  const out = getModuleImagePrompt('unknown_module')
  assert.match(out, /pixel art/)
})

test('getRepairImagePrompt varies with condition bands', () => {
  const a = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 10)
  const b = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 40)
  const c = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 80)
  assert.match(a, /severely damaged/)
  assert.match(b, /damaged worn/)
  assert.match(c, /needs maintenance/)
})
```

- [ ] **Step 2: Helper implementieren** (Spec §8.3):

```ts
import type {
  AssetKind,
  AssetFlavor,
  ChassisTier,
  RiskEventType
} from '../types/assets'
import { MODULE_REGISTRY, MODULE_PROMPTS } from './assetModuleRegistry'

const TIER_MODIFIERS: Record<ChassisTier, string> = {
  1: 'cramped minimal setup',
  2: 'expanded with extra gear',
  3: 'fully professional level'
}
const CHASSIS_PARTS: Record<AssetKind, Record<AssetFlavor, string>> = {
  tourbus_chassis: {
    legit: 'tour van side view band gear',
    diy: 'beat-up tour van duct tape repairs'
  },
  studio_chassis: {
    legit: 'recording studio control room',
    diy: 'cellar studio cables everywhere'
  },
  bandhaus_chassis: {
    legit: 'rented band house cross section',
    diy: 'squatted band house cross section graffiti'
  },
  merch_workshop_chassis: {
    legit: 'merch workshop production line',
    diy: 'garage merch printing workshop'
  }
}

export const getChassisImagePrompt = (
  kind: AssetKind,
  flavor: AssetFlavor,
  tier: ChassisTier
): string =>
  `pixel art ${CHASSIS_PARTS[kind][flavor]} ${TIER_MODIFIERS[tier]} dark moody toxic green accents`

const defaultModulePrompt = (id: string) =>
  `pixel art ${id.replace(/_/g, ' ')} dark moody toxic green accents`

export const getModuleImagePrompt = (moduleId: string): string => {
  const m = MODULE_REGISTRY[moduleId]
  if (!m) return defaultModulePrompt(moduleId)
  return MODULE_PROMPTS[m.imagePromptKey] ?? defaultModulePrompt(moduleId)
}

export const getLoanProfileImagePrompt = (profileId: string): string => {
  const flavorMap: Record<string, string> = {
    shortTerm: 'bank loan officer briefcase legit',
    mediumTerm: 'bank counter contract pen',
    longTerm: 'bank vault long-term security',
    loanShark: 'loan shark dark alley menacing',
    coop: 'punk cooperative community handshake'
  }
  return `pixel art ${flavorMap[profileId] ?? 'bank loan'} dark moody`
}

export const getCrowdfundImagePrompt = (
  kind: AssetKind,
  flavor: AssetFlavor
): string =>
  `pixel art crowdfunding campaign poster ${CHASSIS_PARTS[kind][flavor]} fans donating diy aesthetic`

export const getRiskEventImagePrompt = (eventType: RiskEventType): string => {
  const map: Record<RiskEventType, string> = {
    eviction: 'eviction notice landlord punks moving out',
    fire: 'small fire damage smoking equipment',
    theft: 'broken lock empty space stolen gear',
    police_check: 'police flashlight checking band gear night',
    copyright_strike: 'cease and desist letter angry lawyer',
    raid: 'police raid breaking down door band scene',
    scam_or_bust: 'dark web vendor revealed scam empty box',
    paranormal: 'ghostly figure haunted studio eerie green glow',
    foreclosure: 'foreclosure sign chained doors empty studio'
  }
  return `pixel art ${map[eventType]} dark moody punk`
}

export const getSectionBackgroundPrompt = (
  kind: AssetKind,
  flavor: AssetFlavor
): string =>
  `pixel art ${CHASSIS_PARTS[kind][flavor]} background wide shot atmospheric dark moody toxic green accents`

export const getTrailerImagePrompt = (flavor: AssetFlavor): string =>
  `pixel art trailer side view ${flavor === 'diy' ? 'self-welded diy duct tape' : 'certified rental'} band gear toxic green accents`

export const getRepairImagePrompt = (
  kind: AssetKind,
  flavor: AssetFlavor,
  tier: ChassisTier,
  condition: number
): string => {
  const base = getChassisImagePrompt(kind, flavor, tier)
  if (condition < 20) return `${base} severely damaged broken`
  if (condition < 50) return `${base} damaged worn`
  return `${base} needs maintenance`
}

// Sicheres Anhängen von Größen-Parametern an eine Bild-URL.
// Funktioniert sowohl für Pollinations-URLs (haben bereits `?model=...`)
// als auch für den Offline-Fallback-SVG-Pfad (hat keine Query).
export const appendImageSize = (
  url: string,
  width: number,
  height: number
): string => {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}width=${width}&height=${height}`
}
```

- [ ] **Step 3: Tests grün. Commit** — `feat(imageGen): add asset image prompt helpers`

## Task 16: `GeneratedImagePanel`

**Files:**

- Create: `src/ui/shared/GeneratedImagePanel.tsx`
- Modify: `src/types/components.d.ts`
- Test: `tests/ui/GeneratedImagePanel.test.tsx`

- [ ] **Step 1: Vitest-Test**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { GeneratedImagePanel } from '../../src/ui/shared/GeneratedImagePanel'

test('renders with prompt, applies sizeHint to url', async () => {
  render(
    <GeneratedImagePanel
      prompt='test'
      alt='test'
      sizeHint={{ width: 256, height: 256 }}
    />
  )
  const img = await screen.findByAltText('test')
  expect(img.getAttribute('src')).toContain('256')
})

test('falls back to offline url when navigator.onLine = false', () => {
  // override navigator.onLine
})

test('same prompt produces same URL (cache-friendly)', () => {
  // render twice, assert src identical
})
```

- [ ] **Step 2: Komponente:**

```tsx
import { useState, type CSSProperties } from 'react'
import {
  resolveGenImageUrl,
  getGeneratedImageFallbackUrl,
  isImageGenerationAvailable,
  appendImageSize
} from '../../utils/imageGen'

export interface GeneratedImagePanelProps {
  prompt: string
  alt: string
  aspectRatio?: '16:9' | '1:1' | '4:3' | '3:4' | '21:9'
  className?: string
  onLoad?: () => void
  variant?: 'card' | 'inline' | 'hotspot'
  seedOverride?: number
  sizeHint?: { width: number; height: number }
}

const ASPECT_CSS: Record<
  NonNullable<GeneratedImagePanelProps['aspectRatio']>,
  string
> = {
  '16:9': '16 / 9',
  '1:1': '1 / 1',
  '4:3': '4 / 3',
  '3:4': '3 / 4',
  '21:9': '21 / 9'
}

export const GeneratedImagePanel = ({
  prompt,
  alt,
  aspectRatio = '16:9',
  className = '',
  onLoad,
  variant = 'card',
  sizeHint
}: GeneratedImagePanelProps) => {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const available = isImageGenerationAvailable()
  let src = available
    ? resolveGenImageUrl(prompt)
    : getGeneratedImageFallbackUrl()
  if (sizeHint) src = appendImageSize(src, sizeHint.width, sizeHint.height)
  if (errored) src = getGeneratedImageFallbackUrl()
  const style: CSSProperties = {
    aspectRatio: ASPECT_CSS[aspectRatio],
    background: 'var(--color-void)',
    border: '2px solid var(--section-accent, var(--color-toxic-green))',
    boxShadow: '4px 4px 0 var(--color-void)'
  }
  return (
    <div
      className={`gen-image-panel gen-image-${variant} ${className}`}
      style={style}
    >
      {!loaded && !errored && (
        <div className='gen-image-skeleton' aria-hidden />
      )}
      <img
        src={src}
        alt={alt}
        loading='lazy'
        onLoad={() => {
          setLoaded(true)
          onLoad?.()
        }}
        onError={() => setErrored(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 200ms'
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Tests grün. Commit** — `feat(ui): add GeneratedImagePanel`

## Task 17: `AssetsScene` Hub + Tab-Routing

**Files:**

- Create: `src/components/assets/AssetsScene.tsx`
- Create: `src/components/assets/AssetsTopBar.tsx`
- Modify: Scene-Enum-Datei (`grep -rn "type Scene\\b" src/types`)

- [ ] **Step 1: Test (Vitest)**

```tsx
test('AssetsScene renders all four tabs', () => {
  /* ... */
})
test('Tab click switches active section', () => {
  /* ... */
})
test('Top bar shows totalDailyObligations', () => {
  /* ... */
})
```

- [ ] **Step 2: `Scene`-Enum ergänzen um `'ASSETS'`**
- [ ] **Step 3: Komponente:**

```tsx
import { useState } from 'react'
import { useGameState } from '../../context/GameStateContext'
import { useTranslation } from 'react-i18next'
import { AssetsTopBar } from './AssetsTopBar'
import type { AssetKind } from '../../types/assets'

type SectionKey = 'tourbus' | 'studio' | 'bandhaus' | 'workshop'
const SECTION_TO_KIND: Record<SectionKey, AssetKind> = {
  tourbus: 'tourbus_chassis',
  studio: 'studio_chassis',
  bandhaus: 'bandhaus_chassis',
  workshop: 'merch_workshop_chassis'
}
const SECTION_ACCENT: Record<SectionKey, string> = {
  tourbus: 'var(--color-toxic-green)',
  studio: 'var(--color-electric-blue)',
  bandhaus: 'var(--color-cosmic-purple)',
  workshop: 'var(--color-warning-yellow)'
}

export const AssetsScene = () => {
  const { t } = useTranslation()
  const [active, setActive] = useState<SectionKey>('tourbus')
  // Section-Views werden in Plänen 2-5 importiert. Hier: Platzhalter-Empty-State.
  return (
    <div
      className='assets-scene'
      style={
        { '--section-accent': SECTION_ACCENT[active] } as React.CSSProperties
      }
    >
      <AssetsTopBar />
      <nav className='assets-tabs' role='tablist'>
        {(['tourbus', 'studio', 'bandhaus', 'workshop'] as const).map(k => (
          <button
            key={k}
            role='tab'
            aria-selected={active === k}
            onClick={() => setActive(k)}
          >
            {t(`assets.section.${k}.title`)}
          </button>
        ))}
      </nav>
      <div className='assets-section-content'>
        {/* Sektion-Pläne 2-5 ersetzen diesen Platzhalter durch ihre View */}
        <div className='assets-section-placeholder'>
          {t('assets.section.placeholder')}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `AssetsTopBar.tsx`** zeigt `state.money`, `getTotalDailyObligations(state)`, Summe Schulden via `formatCurrency(value, i18n.language)`.
- [ ] **Step 5: Scene-Router ergänzen** (z.B. `src/App.tsx` oder `SceneRouter.tsx`): `case 'ASSETS': return <AssetsScene />`
- [ ] **Step 6: Tests grün. Commit** — `feat(assets): add hub scene and tab routing`

## Task 18–24: Gemeinsame Modale

Jeweils analog (Test → Component → Commit). Komponentenliste (Spec §7.6):

- **Task 18** `ChassisAcquisitionModal` — Flow `kind → flavor → tier → mode`, `GeneratedImagePanel` mit `getChassisImagePrompt`, DIY+loan-Button im UI deaktiviert
- **Task 19** `LoanProfileModal` — Liste der Profile aus `LOAN_PROFILES`, Bild pro Profil via `getLoanProfileImagePrompt`
- **Task 20** `CrowdfundSetupModal` + `CrowdfundCampaignCard` — `fameStake`-Slider, Erfolgswahrscheinlichkeit live aus `resolveCrowdfundProbability` berechnet, Bild via `getCrowdfundImagePrompt`
- **Task 21** `RepairConfirmModal` — Kosten via `(100 - condition) * REPAIR_COST_PER_POINT`, Bild via `getRepairImagePrompt`
- **Task 22** `SellConfirmModal` — Verkaufserlös-Vorschau, Bild via `getChassisImagePrompt`
- **Task 23** `RiskEventModal` / `ForeclosureModal` — Event-spezifisches Bild via `getRiskEventImagePrompt`
- **Task 24** `ModulePickerModal` — virtual scrolling via `react-window` (falls vorhanden, sonst progressive Load erste 8 Module + scroll-trigger), pro Modul `GeneratedImagePanel sizeHint={{width:256,height:256}}`, Lock-Reason-Badges, Exclusivity-Warnung. Filter: nur Module mit `slotType === currentSlot.slotType` und `ownerKind === asset.kind`

Jeder Task: failing test → component → commit.

## Task 25: Locale-Strukturkeys (EN + DE)

**Files:**

- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`

- [ ] **Step 1: Locale-Keys ergänzen** (Spec §9, nur Strukturkeys, keine Modul-IDs hier):

EN-Auszug:

```json
{
  "assets": {
    "scene": {
      "title": "Investments",
      "subtitle": "Long-term assets and finances",
      "placeholder": "Select a section to manage."
    },
    "section": {
      "tourbus": { "title": "Tourbus", "description": "Your rolling stage" },
      "studio": { "title": "Studio", "description": "Where the songs get cut" },
      "bandhaus": {
        "title": "Band House",
        "description": "HQ, sleep, weed garden"
      },
      "workshop": {
        "title": "Merch Workshop",
        "description": "Print, package, ship"
      }
    },
    "kind": {
      /* ... */
    },
    "flavor": { "legit": "Legit", "diy": "DIY" },
    "chassisTier": { "1": "Tier I", "2": "Tier II", "3": "Tier III" },
    "mode": { "cash": "Cash", "loan": "Loan", "crowdfund": "Crowdfund" },
    "actions": {
      "install": "Install",
      "remove": "Remove",
      "purchase": "Purchase",
      "upgrade": "Upgrade",
      "sell": "Sell",
      "repair": "Repair",
      "upgradeConfirm": "Confirm upgrade for {{amount}}?",
      "repairConfirm": "Repair for {{amount}}?",
      "sellConfirm": "Sell for {{amount}}?",
      "removeModuleConfirm": "Remove module (refund {{amount}})?"
    },
    "modulePicker": {
      "noModulesAvailable": "No modules available for this slot.",
      "lockedReason": "Locked: {{reason}}",
      "exclusivityConflict": "Conflicts with {{otherName}}",
      "installCost": "Install cost: {{amount}}",
      "removeRefund": "Refund: {{amount}}"
    },
    "loan": {
      "profile": {
        "shortTerm": "Short term (60d, 8%)",
        "mediumTerm": "Medium term (120d, 6%)",
        "longTerm": "Long term (180d, 4%)",
        "loanShark": "Loan shark (30d, 20%)",
        "coop": "Cooperative (240d, 2%)"
      },
      "dailyPayment": "{{amount}}/day",
      "defaultWarning": "Default in {{daysLeft}} days"
    },
    "liability": {
      "paymentDue": "Payment due: {{amount}}",
      "foreclosureNotice": "Foreclosure notice issued.",
      "amortizationSchedule": "Schedule"
    },
    "crowdfund": {
      "setup": "Start campaign",
      "success": "Campaign successful!",
      "fail": "Campaign failed.",
      "fameStake": "Fame stake: {{amount}}"
    },
    "risk": {
      "event": {
        "eviction": "Eviction!",
        "fire": "Fire!",
        "theft": "Theft!",
        "police_check": "Police check",
        "copyright_strike": "Copyright strike",
        "raid": "Raid!",
        "scam_or_bust": "Scam!",
        "paranormal": "Paranormal incident"
      }
    },
    "foreclosure": "Foreclosure",
    "condition": { "good": "Good", "warning": "Warning", "broken": "Broken" },
    "purchaseFailed": {
      "diy_loan_not_allowed": "DIY chassis can't be financed via loan.",
      "insufficient_funds": "Not enough money.",
      "liability_exceeds_value": "Outstanding debt exceeds sale value."
    },
    "module": {
      "unlock": {
        "fame": "Requires {{amount}} fame",
        "money": "Requires {{amount}} money",
        "story": "Requires story progress: {{flag}}",
        "skill": "Requires {{member}} {{skill}} tier {{tier}}",
        "skillAny": "Requires any member with {{skill}} tier {{tier}}",
        "scene": "Requires scene presence {{amount}}",
        "chassisTier": "Requires chassis tier {{tier}}",
        "otherModule": "Requires {{moduleName}}"
      },
      "conflict": "Conflicts with {{otherName}}"
    }
  }
}
```

- [ ] **Step 2: DE-Parität:** alle EN-Keys 1:1 mit deutscher Übersetzung
- [ ] **Step 3: `pnpm run test:additional` läuft Locale-Tests grün** (oder das vorhandene Locale-Validierungsskript)
- [ ] **Step 4: Commit** — `feat(i18n): add asset structure locale keys (EN+DE)`

## Task 26: Golden-Path-Cycle-Test-Framework

**Files:**

- Modify: bestehende Golden-Path-Test-Datei (`grep -rn 'golden.*path\|fullCycle' tests`)

- [ ] **Step 1: Variante "Loan-Pfad" hinzufügen** (Spec §10):

```js
test('Golden-Path: chassis bought via loan survives one full cycle', () => {
  // Setup: Band mit Cash > tier1-Preis
  // Dispatch PURCHASE_CHASSIS mit mode=loan
  // 30 mal advanceDay → kein Bankrott
  // Liability dailyPayment wird abgezogen, principalRemaining sinkt
})
```

- [ ] **Step 2: Variante "Crowdfund-Pfad"** + **"Risk-Event-Pfad"** (Spec §10 Test-Liste)
- [ ] **Step 3: Tests grün. Commit** — `test(assets): extend golden-path with loan/crowdfund/risk variants`

## Task 27: Sektion-Plug-Point-Interface

Damit die Sektion-Pläne 2–5 ihre Views/Konfigs ohne weiteres Foundation-Refactoring einklinken können:

**Files:**

- Modify: `src/components/assets/AssetsScene.tsx`

- [ ] **Step 1: Section-View-Registry**

```ts
// src/components/assets/sectionRegistry.ts
import type { ComponentType } from 'react'
import type { AssetKind } from '../../types/assets'

export interface SectionView {
  Component: ComponentType
  accent: string
}

// Sektion-Pläne registrieren ihre View hier durch direkten Import in AssetsScene
export const SECTION_VIEWS: Partial<Record<AssetKind, SectionView>> = {}
```

- [ ] **Step 2: `AssetsScene` rendert `SECTION_VIEWS[kind]?.Component ?? Placeholder`**
- [ ] **Step 3: Commit** — `feat(assets): add section-view registry plug point`

---

## Task 28: AGENTS.md aktualisieren

Nach Plan-Abschluss müssen alle berührten Domains in ihren `AGENTS.md`-Dateien dokumentiert werden, damit zukünftige Agenten die neuen Invarianten kennen.

**Files:**

- Modify: `src/types/AGENTS.md`
- Modify: `src/utils/AGENTS.md`
- Modify: `src/context/AGENTS.md`
- Modify: `src/context/reducers/AGENTS.md`
- Modify: `src/ui/shared/AGENTS.md`
- Create: `src/components/assets/AGENTS.md` (neue Domain)
- Modify: `tests/node/AGENTS.md`
- Modify: `tests/ui/AGENTS.md`
- Modify: root `AGENTS.md` (Top-Level-Gotchas für Asset-System)

- [ ] **Step 1: `src/types/AGENTS.md`** — ergänzen:
  - `assets.d.ts` ist Source of Truth für `AssetKind`, `SlotType`, `AssetModule`, `AssetBoni`, `Liability`, `CrowdfundCampaign`. Keine strukturellen Klone in anderen Dateien.
  - `ModuleUnlockReq.requiredOtherModuleInstalled` akzeptiert `string | readonly string[]` — Array hat OR-Semantik
  - `CrowdfundCampaign.plannedSuccessRoll` wird beim START gezogen, `resolvedOutcome` ist `undefined` solange Kampagne aktiv

- [ ] **Step 2: `src/utils/AGENTS.md`** — ergänzen:
  - `CHASSIS_CONFIG` (`assetConfig.ts`) ist die einzige Stelle für Chassis-Preise/Upkeep. DIY-Varianten programmatisch über `buildDiyTier`, nicht hand-eintragen.
  - `MODULE_REGISTRY` (`assetModuleRegistry.ts`) wird per Side-Effect-Import aus `assetSections/*Modules.ts` befüllt. Anti-Stacking-Invariante: kein Modul mit `slotType === addsSlots[i].slotType` (Build-Test fängt das).
  - `MODULE_PROMPTS` ist via `imagePromptKey` indexiert; mehrere Module dürfen denselben Key teilen
  - `NEUTRAL_ASSET_MODIFIERS` (`assetSelectors.ts`) ist die Identity für `AssetModifiers`-Aggregation. Multiplikative Felder = 1.0, additive = 0, Flags = false
  - `getTotalDailyObligations(state)` = `calculateGuaranteedDailyCost + assetUpkeep − assetRevenue + liabilityPayments` (Source of Truth für Bankrott-Check)
  - `seededRng.ts` (`mulberry32`, `createRngStream`): RNG-Stream wird im Action-Creator vorberechnet und im Payload mitgeschickt, **niemals** im Reducer
  - `imageGen.ts` neue Helper: `getChassisImagePrompt`, `getModuleImagePrompt`, `getRepairImagePrompt`, `getLoanProfileImagePrompt`, `getCrowdfundImagePrompt`, `getRiskEventImagePrompt`, `getSectionBackgroundPrompt`, `getTrailerImagePrompt`, `appendImageSize` (Query-safe Append, funktioniert für Pollinations-URLs und Offline-Fallback-SVG)
  - `loanProfiles.ts` (`LOAN_PROFILES`, `computeAmortization`): Parameter heißt `annualInterestRate` und wird intern durch 365 geteilt

- [ ] **Step 3: `src/context/AGENTS.md`** — ergänzen:
  - Asset-Action-Creators normalisieren Payloads via `finiteNumberOr` und strippen Prototyp-Keys via `Object.hasOwn`; DIY+loan → `PURCHASE_CHASSIS_FAILED` (typisiert, **nicht** `null`)
  - Slot-IDs für `addsSlots` werden im Creator generiert (`getSafeUUID()`) und als `newSlotIds: Array<{ slotType, id }>` im Payload übergeben — Reducer setzt 1:1 ein
  - `advanceDay(state)` zieht `dayRngStream` und `nextRngSeed` aus `seededRng` und legt sie in den Payload; alte payloadlose `createAdvanceDayAction()`-Aufrufer sind migriert auf `dispatch(advanceDay(state))`
  - `INSTALL_MODULE`-Validierung prüft: Slot existiert + leer + Slot-Typ-Match + Unlock + `exclusiveWithGroup` + `maxPerAsset`. Flavor-Mix (legit-Modul auf DIY-Chassis und umgekehrt) ist **erlaubt**

- [ ] **Step 4: `src/context/reducers/AGENTS.md`** — ergänzen:
  - `assetReducer.ts` ist Pure: keine RNG-Calls, keine ID-Generierung, keine Side-Effects. `*_FAILED`-Actions sind reine No-Ops; Toast-Dispatch geschieht im Middleware/UI-Layer
  - `advanceDay`-Reducer komponiert `processAssetTick → processLiabilityTick → processCrowdfundTick → rollAssetRiskEvents → applyBankruptcyCheck` und konsumiert den `dayRngStream` deterministisch
  - `condition < 20` → aggregierte Boni neutralisiert (Asset gilt als kaputt). `condition === 0` → dispatch `ASSET_FORECLOSED`
  - `sanitizeAssets`/`sanitizeLiabilities`/`sanitizeCrowdfundCampaigns` enforcen referenzielle Integrität: orphan Liabilities werden verworfen, ungültige `addedByModuleId` auf `undefined`, doppelte `installedModuleId` auf einem Asset reduziert auf einen Eintrag
  - `BASE_STATE` (Playwright-Fixture) muss `assets`, `liabilities`, `crowdfundCampaigns`, `rngSeed` enthalten

- [ ] **Step 5: `src/ui/shared/AGENTS.md`** — ergänzen:
  - `GeneratedImagePanel` ist die einzige Komponente, die direkt Pollinations-URLs lädt. UI-Aufrufer geben Prompts und `sizeHint`, nie selbst URL-Manipulation. Offline-Fallback via `getGeneratedImageFallbackUrl` ist in der Komponente gekapselt.
  - Pro Sektion wird `--section-accent` als CSS-Custom-Property gesetzt; `GeneratedImagePanel` und Asset-UI nutzen `var(--section-accent, var(--color-toxic-green))` für Borders

- [ ] **Step 6: `src/components/assets/AGENTS.md`** — neu anlegen:
  - Eine Hub-Szene `AssetsScene` mit vier Tabs. Sektion-Views registrieren sich über `sectionRegistry.ts` (`SECTION_VIEWS[kind] = { Component, accent }`). Foundation lässt das Registry leer; Sektion-Pläne 2–5 befüllen es.
  - Gemeinsame Modale (`ChassisAcquisitionModal`, `LoanProfileModal`, `CrowdfundSetupModal`, `RepairConfirmModal`, `SellConfirmModal`, `RiskEventModal`, `ForeclosureModal`, `ModulePickerModal`) sind sektion-agnostisch und nehmen `kind`/`asset`/`slot` als Props.
  - `ModulePickerModal` muss bei großen Pools (>12 Module) virtual scrolling oder progressive Loading nutzen (siehe Plan 1 Task 24); naives gleichzeitiges Laden aller Thumbnails ist zu teuer.
  - Slot-`position`/`zone`-Koordinaten sind 0..1-normalisiert relativ zum Section-Background-Bild — sektion-spezifisch und in `assetSections/<section>Config.ts` definiert.

- [ ] **Step 7: `tests/node/AGENTS.md`** — ergänzen:
  - Neue Test-Domains: `assetsReducer`, `assetTicks`, `assetSelectors`, `liabilitiesAmortization`, `bankruptcyWithLiabilities`, `crowdfundResolution`, `assetPayloadSanitization`, `assetModuleRegistry`, `assetImagePrompts`. RNG-abhängige Tests setzen `state.rngSeed` und assertieren deterministisch über vorbereiteten `dayRngStream`.
  - Anti-Stacking-Test in `assetModuleRegistry.test.js`: kein Modul mit `slotType === addsSlots[i].slotType`. Slot-Coverage-Test pro Sektion: jeder Slot-Typ in der Chassis-Konfig hat mindestens ein kompatibles Modul (außer dynamisch hinzugefügten Slot-Typen wie `tb_trailer_addon`).

- [ ] **Step 8: `tests/ui/AGENTS.md`** — ergänzen:
  - `GeneratedImagePanel`-Tests prüfen Seed-Determinismus (gleicher Prompt → gleiche URL) und Offline-Pfad. `ModulePickerModal`-Tests müssen Flavor-Mix-Erlaubnis verifizieren (legit-Modul auf DIY-Chassis sichtbar)

- [ ] **Step 9: Root `AGENTS.md`** — ergänzen unter neuem Abschnitt "Long-Term Assets":
  - Asset-Konfig (`CHASSIS_CONFIG`) und Modul-Konfig (`MODULE_REGISTRY`) sind eingefroren via `as const satisfies`; neue Chassis/Module bekommen ihre Werte über die etablierten Helper, nicht hand-eintragen
  - `advanceDay` muss über den Action-Creator dispatched werden, **nicht** mit payloadlosem `createAdvanceDayAction()` — RNG-Determinismus hängt davon ab
  - DIY-Chassis können nicht über Loan finanziert werden (nur `cash`/`crowdfund`); UI deaktiviert die Option, Action-Creator returnt `PURCHASE_CHASSIS_FAILED` als zweite Verteidigungslinie
  - Bankrott-Check (`shouldTriggerBankruptcy`) muss `getTotalDailyObligations(state)` aus `assetSelectors.ts` verwenden, niemals nur `calculateGuaranteedDailyCost` direkt

- [ ] **Step 10: Commit** — `docs(agents): document long-term assets foundation invariants`

## Self-Review-Checkliste vor Plan-Abschluss

- [ ] Alle Spec-§3.x-Typen in Task 1 abgedeckt
- [ ] Sanitization-Tests decken alle §3.2-Regeln (referenzielle Integrität, doppelte ModuleIds, Prototyp-Keys)
- [ ] RNG-Stream im Action-Creator, nicht im Reducer (Task 13)
- [ ] `PURCHASE_CHASSIS_FAILED` als typisierter Fehler statt `null`
- [ ] `getTotalDailyObligations` inkl. Asset-Upkeep UND -Revenue
- [ ] `NEUTRAL_ASSET_MODIFIERS` exportiert
- [ ] `react-window`-Verfügbarkeit vor Task 24 prüfen, sonst progressive Load
- [ ] Brand-Tokens `electric-blue`, `cosmic-purple`, `warning-yellow` in `brandColors.ts` verifizieren bevor `AssetsScene` finalisiert wird
- [ ] `BASE_STATE` enthält neue Felder
- [ ] Golden-Path-Test deckt Loan + Crowdfund + Risk-Event

## Acceptance Criteria

Nach Plan 1 ist erfüllt:

- `pnpm run test:all` grün
- `pnpm run typecheck` grün
- Scene `ASSETS` ist erreichbar, zeigt vier leere Tabs mit Akzent-Farbwechsel
- `ChassisAcquisitionModal` öffnet, alle Modals rendern (mit leerem Modul-Pool noch)
- `INSTALL_MODULE` validiert korrekt gegen leeres `MODULE_REGISTRY` (returns `INSTALL_MODULE_FAILED { reason: 'UNKNOWN_MODULE' }`)
- Golden-Path-Cycle-Test grün mit Loan/Crowdfund/Risk-Varianten

## Übergang zu Plan 2–5

Pläne 2–5 erweitern in dieser Reihenfolge:

- `CHASSIS_CONFIG[<kind>].legit.{1,2,3}` mit konkreten Werten und Slot-Listen
- `CHASSIS_CONFIG[<kind>].diy` via `buildDiyTier`
- `MODULE_REGISTRY` mit allen Modulen der Sektion
- `MODULE_PROMPTS` mit den `imagePromptKey`-Einträgen
- Section-View-Komponente, registriert in `SECTION_VIEWS`
- Slot-`position`-Daten (relativ zum Background-Bild)
- Locale-Keys `assets.module.<id>.name` / `.description` + `assets.kind.<kind>` + `assets.slot.<slotType>`

Jeder Sektion-Plan ist eigenständig durchführbar nach Plan 1.
