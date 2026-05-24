# Long-Term Assets — Plan 5: Merch-Werkstatt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merch-Werkstatt-Sektion spielbar machen: 3 Chassis-Tiers, 16 Module, Förderband-Seitenansicht im Ultrawide-Format (21:9), Stationen entlang des Bands, Akzent-Token `warning-yellow`.

**Architecture:** Plan-1-Foundation + Sektion-Pattern aus Plan 2–4. `WorkshopProductionLineView` rendert 21:9-Background mit Stationen als horizontale Slot-Sequenz. Spezialfall: `requiredOtherModuleInstalled` mit OR-Array (für `mw_eco_ink_supply`).

**Tech Stack:** wie Plan 1.

**Spec-Referenz:** §4.1, §4.6 (Merch-Pool), §7.5 Visual.

**Voraussetzung:** Plan 1 abgeschlossen.

---

## File Structure

**Neu:**
- `src/components/assets/sections/MerchWorkshopSection.tsx`
- `src/components/assets/sections/WorkshopProductionLineView.tsx`
- `src/utils/assetSections/workshopConfig.ts`
- `src/utils/assetSections/workshopModules.ts`

**Modifiziert:**
- `src/utils/assetConfig.ts`
- `src/utils/assetModuleRegistry.ts`
- `src/components/assets/sectionRegistry.ts`
- Locale-Dateien

---

## Task 1: Slot-Konstanten + Förderband-Layout

**Files:**
- Create: `src/utils/assetSections/workshopConfig.ts`

- [ ] **Step 1:** Slot-Listen und Station-Positionen (21:9, horizontal sequenziell):

```ts
import type { SlotType } from '../../types/assets'

export const WORKSHOP_T1_SLOTS = ['mw_print', 'mw_drying', 'mw_storage'] as const
export const WORKSHOP_T2_SLOTS = [...WORKSHOP_T1_SLOTS, 'mw_cutting', 'mw_packaging'] as const
export const WORKSHOP_T3_SLOTS = [...WORKSHOP_T2_SLOTS, 'mw_specialty', 'mw_sales', 'mw_automation'] as const

// 21:9: x horizontal entlang Förderband (links → rechts), y vertikal
export const WORKSHOP_SLOT_ZONES: Partial<Record<SlotType, { x: number; y: number; w: number; h: number }>> = {
  mw_print:      { x: 0.10, y: 0.50, w: 0.15, h: 0.50 },
  mw_drying:     { x: 0.28, y: 0.50, w: 0.12, h: 0.50 },
  mw_cutting:    { x: 0.43, y: 0.50, w: 0.12, h: 0.50 },
  mw_packaging:  { x: 0.58, y: 0.50, w: 0.12, h: 0.50 },
  mw_storage:    { x: 0.73, y: 0.50, w: 0.12, h: 0.50 },
  // Vertikal angeflanscht
  mw_specialty:  { x: 0.40, y: 0.15, w: 0.18, h: 0.20 },   // oberhalb des Bands
  mw_automation: { x: 0.65, y: 0.15, w: 0.15, h: 0.20 },
  mw_sales:      { x: 0.90, y: 0.50, w: 0.15, h: 0.80 },   // Versand-Tor rechts
}
```

- [ ] **Step 2: Commit** — `feat(assets/workshop): add slot constants and production line layout`

## Task 2: Chassis-Konfig befüllen

**Files:**
- Modify: `src/utils/assetConfig.ts`

- [ ] **Step 1: Test analog**
- [ ] **Step 2:** Konfig:

```ts
import { WORKSHOP_T1_SLOTS, WORKSHOP_T2_SLOTS, WORKSHOP_T3_SLOTS } from './assetSections/workshopConfig'

const WORKSHOP_LEGIT = {
  1: { price: 3500,  upkeep: 18, revenue: 15, slots: WORKSHOP_T1_SLOTS, baseRiskEventChance: 0.003 },
  2: { price: 8000,  upkeep: 30, revenue: 40, slots: WORKSHOP_T2_SLOTS, baseRiskEventChance: 0.003 },
  3: { price: 16000, upkeep: 50, revenue: 90, slots: WORKSHOP_T3_SLOTS, baseRiskEventChance: 0.003 },
} as const

// merch_workshop_chassis: { legit: WORKSHOP_LEGIT, diy: { 1: buildDiyTier(WORKSHOP_LEGIT[1]), ... } }
```

- [ ] **Step 3: Commit** — `feat(assets/workshop): populate chassis config`

## Task 3: Modul-Registry + Prompts (16 Module)

**Files:**
- Create: `src/utils/assetSections/workshopModules.ts`
- Test: `tests/node/workshopModules.test.js`

- [ ] **Step 1: Test** — 16 Module, alle Prompts, `mw_eco_ink_supply` mit OR-Modul-Requirement.
- [ ] **Step 2:** Module aus Spec §4.6:

```ts
const MODULES: AssetModule[] = [
  { id: 'mw_4color_carousel', ownerKind: 'merch_workshop_chassis', slotType: 'mw_print', flavor: 'legit',
    cost: 3500, installCost: 400, removalRefundFraction: 0.3,
    boni: { merchCostMultiplier: 0.75 }, unlock: { minMoney: 3500 },
    imagePromptKey: 'mw_4color_carousel' },
  { id: 'mw_manual_press', ownerKind: 'merch_workshop_chassis', slotType: 'mw_print', flavor: 'diy',
    cost: 400, installCost: 80, removalRefundFraction: 0.2,
    boni: { merchCostMultiplier: 0.90 }, unlock: {},
    imagePromptKey: 'mw_manual_press' },
  { id: 'mw_eco_ink_supply', ownerKind: 'merch_workshop_chassis', slotType: 'mw_print', flavor: 'legit',
    cost: 500, installCost: 0, removalRefundFraction: 0.2,
    boni: { avgMerchSalePriceBonus: 0.03 },
    unlock: {
      minScenePresence: 40,
      requiredOtherModuleInstalled: ['mw_4color_carousel', 'mw_manual_press'],  // OR-Modus
    },
    imagePromptKey: 'mw_eco_ink_supply' },
  { id: 'mw_conveyor_dryer', ownerKind: 'merch_workshop_chassis', slotType: 'mw_drying', flavor: 'legit',
    cost: 1500, installCost: 200, removalRefundFraction: 0.3,
    boni: { merchCapacityBonus: 30 }, unlock: { minMoney: 1500 },
    imagePromptKey: 'mw_conveyor_dryer' },
  { id: 'mw_heat_press_box', ownerKind: 'merch_workshop_chassis', slotType: 'mw_drying', flavor: 'diy',
    cost: 300, installCost: 50, removalRefundFraction: 0.2,
    boni: { merchCostMultiplier: 0.95 }, unlock: {},
    imagePromptKey: 'mw_heat_press_box' },
  { id: 'mw_vinyl_cutter', ownerKind: 'merch_workshop_chassis', slotType: 'mw_cutting', flavor: 'legit',
    cost: 1200, installCost: 150, removalRefundFraction: 0.3,
    boni: { enablesLimitedEditions: true }, unlock: { minMoney: 1200 },
    imagePromptKey: 'mw_vinyl_cutter' },
  { id: 'mw_embroidery_machine', ownerKind: 'merch_workshop_chassis', slotType: 'mw_cutting', flavor: 'legit',
    cost: 1800, installCost: 200, removalRefundFraction: 0.3,
    boni: { avgMerchSalePriceBonus: 0.05 }, unlock: { minFame: 30 },
    imagePromptKey: 'mw_embroidery_machine' },
  { id: 'mw_badge_press', ownerKind: 'merch_workshop_chassis', slotType: 'mw_specialty', flavor: 'legit',
    cost: 400, installCost: 50, removalRefundFraction: 0.3,
    boni: { avgMerchSalePriceBonus: 0.03 }, unlock: {},
    imagePromptKey: 'mw_badge_press' },
  { id: 'mw_hot_foil_station', ownerKind: 'merch_workshop_chassis', slotType: 'mw_specialty', flavor: 'legit',
    cost: 2200, installCost: 250, removalRefundFraction: 0.3,
    boni: { avgMerchSalePriceBonus: 0.10 }, unlock: { minFame: 50 },
    imagePromptKey: 'mw_hot_foil_station' },
  { id: 'mw_cassette_dubber', ownerKind: 'merch_workshop_chassis', slotType: 'mw_specialty', flavor: 'diy',
    cost: 350, installCost: 50, removalRefundFraction: 0.2,
    boni: { baseDailyRevenueDelta: 20 }, unlock: { requiredStoryFlags: ['tape_culture_revival'] },
    imagePromptKey: 'mw_cassette_dubber' },
  { id: 'mw_sticker_bot', ownerKind: 'merch_workshop_chassis', slotType: 'mw_specialty', flavor: 'legit',
    cost: 600, installCost: 80, removalRefundFraction: 0.3,
    boni: { baseDailyRevenueDelta: 10 }, unlock: {},
    imagePromptKey: 'mw_sticker_bot' },
  { id: 'mw_storage_racks', ownerKind: 'merch_workshop_chassis', slotType: 'mw_storage', flavor: 'legit',
    cost: 800, installCost: 100, removalRefundFraction: 0.3,
    boni: { merchCapacityBonus: 60 }, unlock: {},
    imagePromptKey: 'mw_storage_racks' },
  { id: 'mw_mailorder_script', ownerKind: 'merch_workshop_chassis', slotType: 'mw_automation', flavor: 'legit',
    cost: 0, installCost: 100, removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 30 }, unlock: { requiredMemberSkill: { skill: 'tech', tier: 1 } },
    imagePromptKey: 'mw_mailorder_script' },
  { id: 'mw_bandcamp_bot', ownerKind: 'merch_workshop_chassis', slotType: 'mw_sales', flavor: 'legit',
    cost: 0, installCost: 50, removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 25 }, unlock: { minFame: 20 },
    imagePromptKey: 'mw_bandcamp_bot' },
  { id: 'mw_darkweb_vendor', ownerKind: 'merch_workshop_chassis', slotType: 'mw_sales', flavor: 'diy',
    cost: 0, installCost: 200, removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 50 }, riskEventTypes: ['scam_or_bust', 'police_check'],
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 3 } },
    imagePromptKey: 'mw_darkweb_vendor' },
  { id: 'mw_hype_drop_machine', ownerKind: 'merch_workshop_chassis', slotType: 'mw_automation', flavor: 'legit',
    cost: 1500, installCost: 200, removalRefundFraction: 0.2,
    boni: { avgMerchSalePriceBonus: 0.08 }, unlock: { minFame: 70 },
    imagePromptKey: 'mw_hype_drop_machine' },
]

const PROMPTS: Record<string, string> = {
  mw_4color_carousel: 'pixel art 4-color screen printing carousel press merch production workshop',
  mw_manual_press: 'pixel art manual single-color screen printing press tabletop diy',
  mw_eco_ink_supply: 'pixel art eco-friendly ink bottles plant-based supplies green leaves',
  mw_conveyor_dryer: 'pixel art conveyor belt drying tunnel for screen printed shirts',
  mw_heat_press_box: 'pixel art tabletop heat press box for vinyl transfers diy',
  mw_vinyl_cutter: 'pixel art vinyl cutting plotter cutting band logo decals',
  mw_embroidery_machine: 'pixel art embroidery machine stitching band patch logo',
  mw_badge_press: 'pixel art badge button press maker pin manufacturing',
  mw_hot_foil_station: 'pixel art hot foil stamping station gold metallic finish premium',
  mw_cassette_dubber: 'pixel art cassette tape duplicator dubbing machine retro audio',
  mw_sticker_bot: 'pixel art automated sticker cutting and printing robot',
  mw_storage_racks: 'pixel art warehouse storage racks full of band merch boxes',
  mw_mailorder_script: 'pixel art computer running mailorder fulfillment script terminal screen',
  mw_bandcamp_bot: 'pixel art laptop with bandcamp interface automated shop manager',
  mw_darkweb_vendor: 'pixel art dark web vendor terminal black market merch interface ominous',
  mw_hype_drop_machine: 'pixel art limited drop hype machine countdown timer announcement screen',
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
```

- [ ] **Step 3:** Sicherstellen dass `isModuleUnlocked` in Plan 1 das `requiredOtherModuleInstalled`-Array-OR-Verhalten korrekt implementiert (siehe Plan 1 Task 10). Wenn nicht, hier ergänzen — Spec §3.1 verlangt `string | readonly string[]`.
- [ ] **Step 4: Tests grün. Commit** — `feat(assets/workshop): register 16 modules with prompts`

## Task 4: `WorkshopProductionLineView`

**Files:**
- Create: `src/components/assets/sections/WorkshopProductionLineView.tsx`
- Test: `tests/ui/WorkshopProductionLineView.test.tsx`

- [ ] **Step 1: Test**

```tsx
test('renders 21:9 ultrawide background', () => { /* ... */ })
test('stations laid out horizontally along production line', () => { /* ... */ })
test('automation/sales/specialty render above and right of main line', () => { /* ... */ })
```

- [ ] **Step 2: Komponente** — Pattern wie `StudioFloorplanView`, aber:
  - Aspect-Ratio `21:9`
  - Akzent `var(--color-warning-yellow)`
  - Optional: dünne animierte CSS-Linie zwischen Haupt-Station-Slots (Förderband-Andeutung)

```tsx
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt, resolveGenImageUrl, getModuleImagePrompt } from '../../../utils/imageGen'
import { WORKSHOP_SLOT_ZONES } from '../../../utils/assetSections/workshopConfig'
import type { LongTermAsset } from '../../../types/assets'

interface Props { asset: LongTermAsset; onSlotClick: (slotId: string) => void }

export const WorkshopProductionLineView = ({ asset, onSlotClick }: Props) => (
  <div className="workshop-production-line-view" style={{ position: 'relative' }}>
    <GeneratedImagePanel
      prompt={getSectionBackgroundPrompt('merch_workshop_chassis', asset.chassisFlavor)}
      alt="Workshop production line" aspectRatio="21:9"
      sizeHint={{ width: 1680, height: 720 }}
    />
    {/* Förderband-Linie als Dekoration */}
    <div style={{
      position: 'absolute', left: '5%', right: '15%', top: '55%',
      height: 4, background: 'var(--color-warning-yellow)', opacity: 0.4,
    }} aria-hidden />
    {asset.slots.map(slot => {
      const zone = WORKSHOP_SLOT_ZONES[slot.slotType]
      if (!zone) return null
      const installed = slot.installedModuleId
      return (
        <button
          key={slot.id} onClick={() => onSlotClick(slot.id)}
          aria-label={`station ${slot.slotType}`}
          style={{
            position: 'absolute',
            left: `${(zone.x - zone.w / 2) * 100}%`,
            top: `${(zone.y - zone.h / 2) * 100}%`,
            width: `${zone.w * 100}%`, height: `${zone.h * 100}%`,
            border: '2px solid var(--color-warning-yellow)',
            background: installed ? 'transparent' : 'rgba(0,0,0,0.5)',
          }}
        >
          {installed && (
            <img
              src={resolveGenImageUrl(getModuleImagePrompt(installed)) + '&width=256&height=256'}
              alt={installed} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </button>
      )
    })}
  </div>
)
```

- [ ] **Step 3: Commit** — `feat(assets/workshop): add production line view`

## Task 5: `MerchWorkshopSection` + Registry

**Files:**
- Create: `src/components/assets/sections/MerchWorkshopSection.tsx`
- Modify: `src/components/assets/sectionRegistry.ts`

- [ ] **Step 1:** Komponente analog
- [ ] **Step 2:** `SECTION_VIEWS.merch_workshop_chassis = { Component: MerchWorkshopSection, accent: 'var(--color-warning-yellow)' }`
- [ ] **Step 3: Commit** — `feat(assets/workshop): register section view`

## Task 6: Locale-Keys

**Files:**
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`

- [ ] **Step 1:** Ergänzen:

```json
{
  "assets": {
    "kind": { "merch_workshop_chassis": "Merch Workshop" },
    "slot": {
      "mw_print": "Print station", "mw_drying": "Drying",
      "mw_cutting": "Cutting/Sewing", "mw_packaging": "Packaging",
      "mw_storage": "Storage", "mw_specialty": "Specialty",
      "mw_sales": "Sales channel", "mw_automation": "Automation"
    },
    "module": {
      "mw_4color_carousel": { "name": "4-color carousel", "description": "-25% merch cost" },
      "mw_manual_press": { "name": "Manual press", "description": "-10% merch cost" },
      "mw_eco_ink_supply": { "name": "Eco-ink supply", "description": "+3% avg merch price (needs press)" },
      "mw_conveyor_dryer": { "name": "Conveyor dryer", "description": "+30 merch capacity" },
      "mw_heat_press_box": { "name": "Heat press box", "description": "-5% merch cost" },
      "mw_vinyl_cutter": { "name": "Vinyl cutter", "description": "Enables limited editions" },
      "mw_embroidery_machine": { "name": "Embroidery machine", "description": "+5% avg merch price" },
      "mw_badge_press": { "name": "Badge press", "description": "+3% avg merch price" },
      "mw_hot_foil_station": { "name": "Hot foil station", "description": "+10% avg merch price" },
      "mw_cassette_dubber": { "name": "Cassette dubber", "description": "+20 EUR/day" },
      "mw_sticker_bot": { "name": "Sticker bot", "description": "+10 EUR/day" },
      "mw_storage_racks": { "name": "Storage racks", "description": "+60 merch capacity" },
      "mw_mailorder_script": { "name": "Mailorder script", "description": "+30 EUR/day" },
      "mw_bandcamp_bot": { "name": "Bandcamp bot", "description": "+25 EUR/day" },
      "mw_darkweb_vendor": { "name": "Dark web vendor", "description": "+50 EUR/day, scam and police risk" },
      "mw_hype_drop_machine": { "name": "Hype drop machine", "description": "+8% merch price on gig days" }
    }
  }
}
```

- [ ] **Step 2:** DE-Übersetzungen
- [ ] **Step 3: Commit** — `feat(i18n/workshop): add workshop locale keys`

## Task 7: Integrations-Tests

**Files:**
- Test: `tests/node/workshopEconomyIntegration.test.js`

- [ ] **Step 1:**

```js
test('mw_4color_carousel installed → calculateMerchIncome uses merchCostMultiplier 0.75', () => { /* ... */ })
test('mw_vinyl_cutter installed → enablesLimitedEditions flag is true', () => { /* ... */ })
test('mw_eco_ink_supply unlock requires mw_4color_carousel OR mw_manual_press installed', () => {
  const state = makeState({ /* no press */ })
  assert.equal(isModuleUnlocked(MODULE_REGISTRY.mw_eco_ink_supply, state), false)
  const stateWithManual = makeState({ installedModules: ['mw_manual_press'] })
  assert.equal(isModuleUnlocked(MODULE_REGISTRY.mw_eco_ink_supply, stateWithManual), true)
})
test('mw_darkweb_vendor triggers scam_or_bust event on RNG roll', () => { /* ... */ })
test('multiple revenue modules (mailorder + bandcamp + sticker) stack additively', () => {
  // baseDailyRevenueDelta: 30 + 25 + 10 = 65
})
```

- [ ] **Step 2: Commit** — `test(assets/workshop): integration tests for OR-unlock and additive revenue`

## Task 8: Finale Integrations-Smoke-Tests

**Files:**
- Test: `tests/node/allSectionsIntegrationSmoke.test.js`

- [ ] **Step 1:** Test dass nach allen vier Sektion-Plänen kein `MODULE_REGISTRY`-Eintrag fehlt, alle Slot-Typen exakt einmal in Sektion-Konfig verwendet werden, kein Slot-Typ ohne `position`/`zone`:

```js
test('every SlotType from union has a position/zone in some section config', () => {
  const allZones = { ...TOURBUS_SLOT_POSITIONS, ...STUDIO_SLOT_ZONES, ...BANDHAUS_SLOT_ZONES, ...WORKSHOP_SLOT_ZONES }
  const SlotTypes = ['tb_roof','tb_front', /* ... alle 33 ... */]
  for (const t of SlotTypes) {
    assert.ok(allZones[t], `Slot ${t} has no position/zone defined in any section`)
  }
})

test('every AssetKind has exactly one SECTION_VIEWS entry', () => {
  for (const k of ['tourbus_chassis','studio_chassis','bandhaus_chassis','merch_workshop_chassis']) {
    assert.ok(SECTION_VIEWS[k], `${k} has no view`)
  }
})

test('MODULE_REGISTRY has 62 modules total (16+14+16+16)', () => {
  assert.equal(Object.keys(MODULE_REGISTRY).length, 62)
})
```

- [ ] **Step 2: Commit** — `test(assets): cross-section integration smoke tests`

---

## Self-Review

- [ ] 16 Module aus Spec §4.6 vollständig, inkl. `mw_eco_ink_supply` mit OR-Modul-Requirement
- [ ] `isModuleUnlocked` behandelt `requiredOtherModuleInstalled` als String oder Array
- [ ] `WORKSHOP_SLOT_ZONES` deckt alle 8 Werkstatt-Slot-Typen
- [ ] Akzent-Token `warning-yellow` verifiziert
- [ ] EN + DE Locale-Parität

## Acceptance Criteria

- Werkstatt-Tab zeigt 21:9-Ultrawide-Förderband mit horizontalen Stationen
- `mw_eco_ink_supply` ist erst unlocked nach Installation eines Druckmoduls (legit oder DIY)
- `mw_4color_carousel` aktiviert Merch-Kostenreduktion in `calculateMerchIncome`
- Cross-Section-Smoke-Test grün: 62 Module gesamt, alle Slot-Typen gemappt, alle 4 Sektionen registriert
- `pnpm run test:all` grün
- Golden-Path-Cycle-Test mit beliebigem Asset-Kombi grün

---

## Abschluss-Gesamtsystem

Nach Abschluss aller 5 Pläne ist das System komplett:

- 4 Asset-Kategorien × 3 Tiers × 2 Flavors = 24 Chassis-Varianten
- 62 Module mit individuellen Bildern
- Vier eigenständige Sektion-Visuals (16:9 Vehikel, 4:3 Studio, 3:4 Bandhaus, 21:9 Werkstatt)
- Drei Erwerbspfade (cash/loan/crowdfund) mit deterministischer Crowdfund-Auswertung
- Tägliche Tick-Logik mit deterministischem RNG-Stream
- Bankrott-Check inkl. Asset-Upkeep und -Revenue
- Vollständige EN+DE Lokalisierung
- Test-Suite über alle Layer (Sanitizer, Reducer, Selektoren, UI, Golden-Path)
