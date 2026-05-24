# Long-Term Assets — Plan 2: Tourbus

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tourbus-Sektion vollständig spielbar machen: 3 Chassis-Tiers (legit + DIY), 16 Module mit Bildern, Vehikel-Seitenansicht mit Slot-Hotspots, Trailer-Overlay für `tb_trailer_hitch`.

**Architecture:** Erweitert die Plan-1-Foundation. `CHASSIS_CONFIG.tourbus_chassis` wird konkretisiert, `MODULE_REGISTRY` mit 16 Tourbus-Modulen ergänzt, `TourbusSection.tsx` registriert sich im `SECTION_VIEWS`-Plug-Point.

**Tech Stack:** TypeScript, React 19, Tailwind v4, `GeneratedImagePanel` aus Plan 1.

**Spec-Referenz:** `docs/superpowers/specs/2026-05-24-long-term-assets-design.md` (§3.3 Trailer-Stacking, §4.1 Chassis-Konfig, §4.3 Tourbus-Pool, §7.2 Visual)

**Voraussetzung:** Plan 1 abgeschlossen.

---

## File Structure

**Neu:**
- `src/components/assets/sections/TourbusSection.tsx`
- `src/components/assets/sections/TourbusVehicleView.tsx`
- `src/components/assets/sections/TourbusTrailerOverlay.tsx`
- `src/utils/assetSections/tourbusConfig.ts` — Slot-Konstanten, Slot-Positionen
- `src/utils/assetSections/tourbusModules.ts` — Modul-Definitionen + Prompts (registriert in `MODULE_REGISTRY` und `MODULE_PROMPTS`)

**Modifiziert:**
- `src/utils/assetConfig.ts` — `tourbus_chassis`-Konfig befüllen
- `src/utils/assetModuleRegistry.ts` — `import './assetSections/tourbusModules'` (Side-Effect-Registrierung) oder Object.assign-Pattern
- `src/components/assets/AssetsScene.tsx` — `SECTION_VIEWS.tourbus_chassis = { Component: TourbusSection, accent: 'var(--color-toxic-green)' }`
- `public/locales/en/ui.json` + `public/locales/de/ui.json` — Modul-Keys, Slot-Keys, Kind-Key

---

## Task 1: Slot-Konstanten + Positionen

**Files:**
- Create: `src/utils/assetSections/tourbusConfig.ts`

- [ ] **Step 1:** Slot-Listen und Hotspot-Positionen (normalisiert 0..1 über das 16:9-Background-Bild):

```ts
import type { SlotType } from '../../types/assets'

export const TOURBUS_T1_SLOTS = ['tb_roof','tb_front','tb_interior_driver','tb_audio'] as const
export const TOURBUS_T2_SLOTS = [...TOURBUS_T1_SLOTS, 'tb_side','tb_interior_cabin'] as const
export const TOURBUS_T3_SLOTS = [...TOURBUS_T2_SLOTS, 'tb_decal','tb_trailer_mount'] as const

// Position relativ zum Van-Seitenansichts-Background (16:9, links=0, rechts=1)
export const TOURBUS_SLOT_POSITIONS: Record<SlotType, { x: number; y: number }> = {
  tb_roof:             { x: 0.50, y: 0.18 },
  tb_front:            { x: 0.85, y: 0.55 },
  tb_side:             { x: 0.55, y: 0.45 },
  tb_interior_driver:  { x: 0.70, y: 0.55 },
  tb_interior_cabin:   { x: 0.35, y: 0.50 },
  tb_audio:            { x: 0.45, y: 0.65 },
  tb_decal:            { x: 0.50, y: 0.80 },
  tb_trailer_mount:    { x: 0.10, y: 0.60 },
  tb_trailer_addon:    { x: -0.15, y: 0.50 },  // links neben Van, Overlay-Bereich
  // Andere SlotTypes nicht in Tourbus relevant — Plan 3-5 setzen sie
} as Partial<Record<SlotType, { x: number; y: number }>> as Record<SlotType, { x: number; y: number }>
```

- [ ] **Step 2:** Commit — `feat(assets/tourbus): add slot constants and positions`

## Task 2: Chassis-Konfig befüllen

**Files:**
- Modify: `src/utils/assetConfig.ts`
- Test: `tests/node/tourbusChassisConfig.test.js`

- [ ] **Step 1: Test**

```js
test('tourbus legit tier1 has 4 slots from T1_SLOTS', () => {
  assert.equal(CHASSIS_CONFIG.tourbus_chassis.legit[1].slots.length, 4)
})
test('tourbus diy tier1 has half price', () => {
  assert.equal(
    CHASSIS_CONFIG.tourbus_chassis.diy[1].price,
    Math.round(CHASSIS_CONFIG.tourbus_chassis.legit[1].price * 0.5)
  )
})
```

- [ ] **Step 2: Konfig setzen** (Spec §4.1, Platzhalterwerte):

```ts
import { TOURBUS_T1_SLOTS, TOURBUS_T2_SLOTS, TOURBUS_T3_SLOTS } from './assetSections/tourbusConfig'

const TOURBUS_LEGIT = {
  1: { price: 4000,  upkeep: 20, revenue: 0, slots: TOURBUS_T1_SLOTS, baseRiskEventChance: 0.005 },
  2: { price: 9000,  upkeep: 35, revenue: 0, slots: TOURBUS_T2_SLOTS, baseRiskEventChance: 0.005 },
  3: { price: 18000, upkeep: 55, revenue: 0, slots: TOURBUS_T3_SLOTS, baseRiskEventChance: 0.005 },
} as const

// CHASSIS_CONFIG.tourbus_chassis ersetzen
tourbus_chassis: {
  legit: TOURBUS_LEGIT,
  diy: {
    1: buildDiyTier(TOURBUS_LEGIT[1]),
    2: buildDiyTier(TOURBUS_LEGIT[2]),
    3: buildDiyTier(TOURBUS_LEGIT[3]),
  },
}
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets/tourbus): populate chassis config`

## Task 3: Modul-Registry + Prompts

**Files:**
- Create: `src/utils/assetSections/tourbusModules.ts`
- Modify: `src/utils/assetModuleRegistry.ts` — Side-effect-Import
- Test: `tests/node/tourbusModules.test.js`

- [ ] **Step 1: Test (16 Module, kein Self-Stacking, alle Prompts vorhanden)**

```js
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

test('all 16 tourbus modules registered', () => {
  const tb = Object.values(MODULE_REGISTRY).filter(m => m.ownerKind === 'tourbus_chassis')
  assert.equal(tb.length, 16)
})

test('tb_trailer_hitch slotType is tb_trailer_mount and addsSlots is tb_trailer_addon (anti-stacking)', () => {
  const hitch = MODULE_REGISTRY.tb_trailer_hitch
  assert.equal(hitch.slotType, 'tb_trailer_mount')
  assert.deepEqual(hitch.addsSlots, [{ slotType: 'tb_trailer_addon', count: 2 }])
  assert.equal(hitch.maxPerAsset, 1)
})
```

- [ ] **Step 2: Modul-Definitionen** (Spec §4.3, alle 16):

```ts
import type { AssetModule } from '../../types/assets'
import { MODULE_REGISTRY, MODULE_PROMPTS } from '../assetModuleRegistry'

const MODULES: AssetModule[] = [
  {
    id: 'tb_solar_panel', ownerKind: 'tourbus_chassis', slotType: 'tb_roof', flavor: 'legit',
    cost: 1200, installCost: 100, removalRefundFraction: 0.4,
    boni: { fuelMultiplier: 0.85 }, unlock: { minFame: 30 },
    imagePromptKey: 'tb_solar_panel',
  },
  {
    id: 'tb_roof_rack', ownerKind: 'tourbus_chassis', slotType: 'tb_roof', flavor: 'legit',
    cost: 400, installCost: 50, removalRefundFraction: 0.5,
    boni: { merchCapacityBonus: 30 }, unlock: {},
    imagePromptKey: 'tb_roof_rack',
  },
  {
    id: 'tb_subwoofer_stack', ownerKind: 'tourbus_chassis', slotType: 'tb_audio', flavor: 'diy',
    cost: 800, installCost: 100, removalRefundFraction: 0.3,
    boni: { tipBonusGigs: 0.10 }, unlock: { minFame: 20 },
    exclusiveWithGroup: 'tb_power_hog',
    imagePromptKey: 'tb_subwoofer_stack',
  },
  {
    id: 'tb_vintage_stereo', ownerKind: 'tourbus_chassis', slotType: 'tb_audio', flavor: 'legit',
    cost: 600, installCost: 50, removalRefundFraction: 0.5,
    boni: { bandMoodPerDay: 2 }, unlock: { requiredStoryFlags: ['found_record_collection'] },
    imagePromptKey: 'tb_vintage_stereo',
  },
  {
    id: 'tb_alloy_rims', ownerKind: 'tourbus_chassis', slotType: 'tb_decal', flavor: 'legit',
    cost: 1500, installCost: 200, removalRefundFraction: 0.4,
    boni: { famePassivePerDay: 0.5 }, unlock: { minMoney: 1500 },
    imagePromptKey: 'tb_alloy_rims',
  },
  {
    id: 'tb_fox_tail', ownerKind: 'tourbus_chassis', slotType: 'tb_decal', flavor: 'diy',
    cost: 30, installCost: 0, removalRefundFraction: 0.0,
    boni: { famePassivePerDay: 0.2 }, unlock: { minFame: 10 },
    imagePromptKey: 'tb_fox_tail',
  },
  {
    id: 'tb_neon_underglow', ownerKind: 'tourbus_chassis', slotType: 'tb_decal', flavor: 'diy',
    cost: 200, installCost: 50, removalRefundFraction: 0.3,
    boni: { famePassivePerDay: 0.4 }, unlock: { requiredStoryFlags: ['underground_show'] },
    imagePromptKey: 'tb_neon_underglow',
  },
  {
    id: 'tb_racing_seats', ownerKind: 'tourbus_chassis', slotType: 'tb_interior_driver', flavor: 'legit',
    cost: 900, installCost: 100, removalRefundFraction: 0.4,
    boni: { staminaRegenBonusPerDay: 3 }, unlock: {},
    imagePromptKey: 'tb_racing_seats',
  },
  {
    id: 'tb_sleeping_bunks', ownerKind: 'tourbus_chassis', slotType: 'tb_interior_cabin', flavor: 'legit',
    cost: 700, installCost: 150, removalRefundFraction: 0.5,
    boni: { travelStaminaRegen: 5 }, unlock: { minChassisTier: 2 },
    imagePromptKey: 'tb_sleeping_bunks',
  },
  {
    id: 'tb_mini_fridge', ownerKind: 'tourbus_chassis', slotType: 'tb_interior_cabin', flavor: 'legit',
    cost: 250, installCost: 30, removalRefundFraction: 0.5,
    boni: { bandMoodPerDay: 1 }, unlock: { minMoney: 600 },
    imagePromptKey: 'tb_mini_fridge',
  },
  {
    id: 'tb_espresso_machine', ownerKind: 'tourbus_chassis', slotType: 'tb_interior_cabin', flavor: 'legit',
    cost: 350, installCost: 40, removalRefundFraction: 0.5,
    boni: { travelStaminaRegen: 3 }, unlock: { requiredMemberSkill: { skill: 'barista', tier: 1 } },
    imagePromptKey: 'tb_espresso_machine',
  },
  {
    id: 'tb_cb_radio_mesh', ownerKind: 'tourbus_chassis', slotType: 'tb_front', flavor: 'legit',
    cost: 200, installCost: 40, removalRefundFraction: 0.4,
    boni: { fuelMultiplier: 0.95 }, unlock: { requiredMemberSkill: { skill: 'tech', tier: 1 } },
    imagePromptKey: 'tb_cb_radio_mesh',
  },
  {
    id: 'tb_gps_jammer', ownerKind: 'tourbus_chassis', slotType: 'tb_front', flavor: 'diy',
    cost: 400, installCost: 80, removalRefundFraction: 0.2,
    boni: { diyRiskMultiplier: 0.5 }, unlock: { requiredMemberSkill: { skill: 'tech', tier: 3 } },
    imagePromptKey: 'tb_gps_jammer',
  },
  {
    id: 'tb_trailer_hitch', ownerKind: 'tourbus_chassis', slotType: 'tb_trailer_mount', flavor: 'legit',
    cost: 1500, installCost: 200, removalRefundFraction: 0.4,
    boni: { merchCapacityBonus: 50 },
    addsSlots: [{ slotType: 'tb_trailer_addon', count: 2 }],
    maxPerAsset: 1,
    unlock: { minFame: 40, minChassisTier: 3 },
    imagePromptKey: 'tb_trailer_hitch',
  },
  {
    id: 'tb_fake_police_lights', ownerKind: 'tourbus_chassis', slotType: 'tb_front', flavor: 'diy',
    cost: 150, installCost: 30, removalRefundFraction: 0.2,
    boni: { tipBonusGigs: 0.05 }, riskEventTypes: ['police_check'],
    unlock: { minFame: 30 },
    imagePromptKey: 'tb_fake_police_lights',
  },
  {
    id: 'tb_smoke_screen', ownerKind: 'tourbus_chassis', slotType: 'tb_front', flavor: 'diy',
    cost: 350, installCost: 60, removalRefundFraction: 0.3,
    boni: { reducesTheftRiskTravel: true },
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'tb_smoke_screen',
  },
]

const PROMPTS: Record<string, string> = {
  tb_solar_panel: 'pixel art solar panel array mounted on tour van roof toxic green accents close-up',
  tb_roof_rack: 'pixel art roof rack with cargo box on tour van side view',
  tb_subwoofer_stack: 'pixel art massive subwoofer speaker stack inside van punk concert gear',
  tb_vintage_stereo: 'pixel art vintage tape deck stereo system retro tour van interior',
  tb_alloy_rims: 'pixel art shiny chrome alloy rims on tour van close-up',
  tb_fox_tail: 'pixel art fox tail antenna decoration on van side mirror trashy charm',
  tb_neon_underglow: 'pixel art neon underglow toxic green light beneath tour van night scene',
  tb_racing_seats: 'pixel art racing bucket seats tour van driver cockpit',
  tb_sleeping_bunks: 'pixel art sleeping bunks tour van interior cozy beds',
  tb_mini_fridge: 'pixel art mini fridge with beer in tour van interior',
  tb_espresso_machine: 'pixel art espresso machine on tour van counter coffee steam',
  tb_cb_radio_mesh: 'pixel art CB radio dashboard with route map tour van front',
  tb_gps_jammer: 'pixel art smuggled russian GPS jammer device blinking lights diy',
  tb_trailer_hitch: 'pixel art tour van with trailer hitch and small trailer attached side view',
  tb_fake_police_lights: 'pixel art tour van with fake police lights on top suspicious diy',
  tb_smoke_screen: 'pixel art tour van smoke screen ejection device fleeing scene',
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
```

- [ ] **Step 3:** `src/utils/assetModuleRegistry.ts` ergänzen um `import './assetSections/tourbusModules'` (Side-Effect-Import; alternative: explizites `registerTourbusModules()`-Call im App-Init).
- [ ] **Step 4: Tests grün. Commit** — `feat(assets/tourbus): register 16 modules with prompts`

## Task 4: `TourbusVehicleView`

**Files:**
- Create: `src/components/assets/sections/TourbusVehicleView.tsx`
- Test: `tests/ui/TourbusVehicleView.test.tsx`

- [ ] **Step 1: Test**

```tsx
test('renders hotspots at slot positions', () => {
  const asset = mockTourbusAsset({ tier: 2 })
  render(<TourbusVehicleView asset={asset} onSlotClick={jest.fn()} />)
  expect(screen.getAllByRole('button', { name: /slot/i })).toHaveLength(6)
})
test('installed module shows thumbnail not + icon', () => { /* ... */ })
test('clicking slot calls onSlotClick with slotId', () => { /* ... */ })
```

- [ ] **Step 2: Komponente:**

```tsx
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt, getModuleImagePrompt } from '../../../utils/imageGen'
import { TOURBUS_SLOT_POSITIONS } from '../../../utils/assetSections/tourbusConfig'
import { MODULE_REGISTRY } from '../../../utils/assetModuleRegistry'
import { TourbusTrailerOverlay } from './TourbusTrailerOverlay'
import type { LongTermAsset } from '../../../types/assets'

interface Props { asset: LongTermAsset; onSlotClick: (slotId: string) => void }

export const TourbusVehicleView = ({ asset, onSlotClick }: Props) => {
  const hasTrailer = asset.slots.some(s =>
    s.installedModuleId && MODULE_REGISTRY[s.installedModuleId]?.id === 'tb_trailer_hitch'
  )
  return (
    <div className="tourbus-vehicle-view" style={{ position: 'relative' }}>
      <GeneratedImagePanel
        prompt={getSectionBackgroundPrompt('tourbus_chassis', asset.chassisFlavor)}
        alt="Tourbus"
        aspectRatio="16:9"
        sizeHint={{ width: 1280, height: 720 }}
      />
      {hasTrailer && <TourbusTrailerOverlay asset={asset} onSlotClick={onSlotClick} />}
      {asset.slots
        .filter(s => s.slotType !== 'tb_trailer_addon')
        .map(slot => {
          const pos = TOURBUS_SLOT_POSITIONS[slot.slotType]
          const installed = slot.installedModuleId
          return (
            <button
              key={slot.id}
              role="button"
              aria-label={`slot ${slot.slotType}`}
              onClick={() => onSlotClick(slot.id)}
              style={{
                position: 'absolute',
                left: `${pos.x * 100}%`, top: `${pos.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 64, height: 64,
                border: '2px solid var(--color-toxic-green)',
                borderRadius: '50%',
                background: installed ? 'transparent' : 'rgba(0,0,0,0.5)',
                cursor: 'pointer',
              }}
            >
              {installed ? (
                <img
                  src={resolveGenImageUrl(getModuleImagePrompt(installed)) + '&width=128&height=128'}
                  alt={installed} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: 'var(--color-toxic-green)', fontSize: 24 }}>+</span>
              )}
            </button>
          )
        })}
    </div>
  )
}
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets/tourbus): add vehicle view with hotspots`

## Task 5: `TourbusTrailerOverlay`

**Files:**
- Create: `src/components/assets/sections/TourbusTrailerOverlay.tsx`
- Test: `tests/ui/TourbusTrailerOverlay.test.tsx`

- [ ] **Step 1: Test**

```tsx
test('renders only when tb_trailer_hitch installed', () => { /* ... */ })
test('shows 2 trailer-addon slot hotspots', () => { /* ... */ })
test('falls back to fallback SVG offline', () => { /* ... */ })
```

- [ ] **Step 2: Komponente** — zweites `GeneratedImagePanel` mit `getTrailerImagePrompt`, links neben Van angedockt, 2 zusätzliche Hotspots für `tb_trailer_addon`-Slots.

```tsx
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getTrailerImagePrompt } from '../../../utils/imageGen'
import type { LongTermAsset } from '../../../types/assets'

interface Props { asset: LongTermAsset; onSlotClick: (slotId: string) => void }

export const TourbusTrailerOverlay = ({ asset, onSlotClick }: Props) => {
  const addonSlots = asset.slots.filter(s => s.slotType === 'tb_trailer_addon')
  return (
    <div style={{ position: 'absolute', left: '-30%', top: '20%', width: '30%' }}>
      <GeneratedImagePanel
        prompt={getTrailerImagePrompt(asset.chassisFlavor)}
        alt="Trailer"
        aspectRatio="4:3"
        sizeHint={{ width: 640, height: 480 }}
      />
      {addonSlots.map((slot, i) => (
        <button
          key={slot.id}
          onClick={() => onSlotClick(slot.id)}
          style={{
            position: 'absolute',
            left: `${30 + i * 30}%`, top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48, height: 48,
            border: '2px dashed var(--color-toxic-green)',
            background: 'rgba(0,0,0,0.5)',
          }}
        >+</button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit** — `feat(assets/tourbus): add trailer overlay`

## Task 6: `TourbusSection` mit Picker-Integration

**Files:**
- Create: `src/components/assets/sections/TourbusSection.tsx`

- [ ] **Step 1: Komponente**

```tsx
import { useState } from 'react'
import { useGameState, useDispatch } from '../../../context/GameStateContext'
import { TourbusVehicleView } from './TourbusVehicleView'
import { ModulePickerModal } from '../ModulePickerModal'
import { ChassisAcquisitionModal } from '../ChassisAcquisitionModal'

export const TourbusSection = () => {
  const state = useGameState()
  const dispatch = useDispatch()
  const tourbusAssets = state.assets.filter(a => a.kind === 'tourbus_chassis')
  const [pickerSlot, setPickerSlot] = useState<{ assetId: string; slotId: string } | null>(null)
  const [acquireOpen, setAcquireOpen] = useState(false)

  return (
    <section className="tourbus-section">
      {tourbusAssets.length === 0 ? (
        <button onClick={() => setAcquireOpen(true)}>Tourbus erwerben</button>
      ) : (
        tourbusAssets.map(asset => (
          <TourbusVehicleView
            key={asset.id} asset={asset}
            onSlotClick={slotId => setPickerSlot({ assetId: asset.id, slotId })}
          />
        ))
      )}
      {pickerSlot && (
        <ModulePickerModal
          assetId={pickerSlot.assetId} slotId={pickerSlot.slotId}
          onClose={() => setPickerSlot(null)}
        />
      )}
      {acquireOpen && (
        <ChassisAcquisitionModal kind="tourbus_chassis" onClose={() => setAcquireOpen(false)} />
      )}
    </section>
  )
}
```

- [ ] **Step 2:** In `src/components/assets/sectionRegistry.ts`:

```ts
import { TourbusSection } from './sections/TourbusSection'
SECTION_VIEWS.tourbus_chassis = { Component: TourbusSection, accent: 'var(--color-toxic-green)' }
```

- [ ] **Step 3: Commit** — `feat(assets/tourbus): register section view`

## Task 7: Locale-Keys (EN + DE)

**Files:**
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`

- [ ] **Step 1:** Ergänzen:

```json
{
  "assets": {
    "kind": { "tourbus_chassis": "Tourbus" },
    "slot": {
      "tb_roof": "Roof", "tb_front": "Front", "tb_side": "Side",
      "tb_interior_driver": "Driver cockpit", "tb_interior_cabin": "Cabin",
      "tb_audio": "Audio", "tb_decal": "Decals",
      "tb_trailer_mount": "Trailer hitch", "tb_trailer_addon": "Trailer addon"
    },
    "module": {
      "tb_solar_panel": { "name": "Solar panel", "description": "Cuts fuel by 15%" },
      "tb_roof_rack": { "name": "Roof rack", "description": "+30 merch capacity" },
      "tb_subwoofer_stack": { "name": "Subwoofer stack", "description": "+10% tips at gigs" },
      "tb_vintage_stereo": { "name": "Vintage stereo", "description": "+2 band mood per day" },
      "tb_alloy_rims": { "name": "Alloy rims", "description": "+0.5 fame passive per day" },
      "tb_fox_tail": { "name": "Fox tail", "description": "+0.2 fame per day, pure flavor" },
      "tb_neon_underglow": { "name": "Neon underglow", "description": "+0.4 fame per day" },
      "tb_racing_seats": { "name": "Racing seats", "description": "+3 driver stamina regen" },
      "tb_sleeping_bunks": { "name": "Sleeping bunks", "description": "+5 stamina regen on travel" },
      "tb_mini_fridge": { "name": "Mini fridge", "description": "+1 band mood per day" },
      "tb_espresso_machine": { "name": "Espresso machine", "description": "+3 stamina regen on travel" },
      "tb_cb_radio_mesh": { "name": "CB radio mesh", "description": "Optimizes routes, -5% fuel" },
      "tb_gps_jammer": { "name": "GPS jammer", "description": "Halves police risk" },
      "tb_trailer_hitch": { "name": "Trailer hitch", "description": "Adds trailer with 2 addon slots, +50 merch capacity" },
      "tb_fake_police_lights": { "name": "Fake police lights", "description": "+5% tips, attracts police attention" },
      "tb_smoke_screen": { "name": "Smoke screen", "description": "Reduces theft risk on travel" }
    }
  }
}
```

- [ ] **Step 2:** DE-Übersetzungen parallel. `i18n-consistency-checker` ausführen.
- [ ] **Step 3: Commit** — `feat(i18n/tourbus): add tourbus locale keys`

## Task 8: Sektion-Tests

**Files:**
- Test: `tests/node/tourbusAntiStacking.test.js`
- Test: `tests/ui/TourbusSection.test.tsx`

- [ ] **Step 1:** Anti-Stacking-Integration-Test:

```js
test('installing tb_trailer_hitch twice fails with MAX_PER_ASSET', () => {
  // Setup asset with tb_trailer_mount slot
  // dispatch INSTALL_MODULE for tb_trailer_hitch → success
  // verify 2 tb_trailer_addon slots appear
  // attempt installing tb_trailer_hitch again on a (hypothetical) second tb_trailer_mount slot → MAX_PER_ASSET
})

test('tb_trailer_hitch cannot be installed in tb_trailer_addon slot', () => {
  // slotType mismatch
})
```

- [ ] **Step 2:** Golden-Path-Erweiterung "Trailer-Stacking":

```js
test('Golden-Path trailer-stacking: hitch adds slots, addon installs, no infinite stacking', () => { /* ... */ })
```

- [ ] **Step 3: Commit** — `test(assets/tourbus): integration tests for anti-stacking`

---

## Self-Review

- [ ] 16 Module aus Spec §4.3 alle vorhanden mit korrektem `slotType`, `flavor`, `boni`, `unlock`
- [ ] `tb_trailer_hitch.slotType === 'tb_trailer_mount'`, `addsSlots[0].slotType === 'tb_trailer_addon'`, `maxPerAsset: 1`
- [ ] Alle 16 Module haben `imagePromptKey`-Eintrag in `MODULE_PROMPTS`
- [ ] `TOURBUS_SLOT_POSITIONS` deckt alle Tourbus-Slot-Typen
- [ ] Locale-Keys EN + DE simultan, alle Modul-IDs mit `name` + `description`
- [ ] `SECTION_VIEWS.tourbus_chassis` registriert
- [ ] Trailer-Overlay rendert nur bei installiertem Hitch

## Acceptance Criteria

- `pnpm run test:all` grün inkl. neuer Tourbus-Tests
- Tourbus-Tab zeigt entweder Erwerb-Button oder Vehikel-Seitenansicht
- 16 Module sichtbar im `ModulePickerModal` (gefiltert nach Slot-Typ)
- Trailer-Hitch erweitert Slot-Set um 2 Addon-Slots, zweites Hitch-Install schlägt mit `MAX_PER_ASSET` fehl
- Bilder laden online über Pollinations, fallen offline auf Fallback-SVG zurück
