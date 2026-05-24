# Long-Term Assets — Plan 4: Bandhaus

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bandhaus-Sektion spielbar machen: 3 Chassis-Tiers, 16 Module, Dollhouse-Querschnitt im Portrait-Format (3:4), Mural-Fassaden-Effekt, Akzent-Token `cosmic-purple`.

**Architecture:** Folgt Plan-1-Foundation und dem Sektion-Pattern aus Plan 2/3. `BandhausCrossSectionView` rendert vertikalen 3:4-Querschnitt mit Räumen als Slot-Zonen. Tier 3 schaltet `bh_secret` (Keller) sichtbar frei.

**Tech Stack:** wie Plan 1.

**Spec-Referenz:** §4.1, §4.5 (Bandhaus-Pool), §7.4 Visual.

**Voraussetzung:** Plan 1 abgeschlossen.

---

## File Structure

**Neu:**
- `src/components/assets/sections/BandhausSection.tsx`
- `src/components/assets/sections/BandhausCrossSectionView.tsx`
- `src/utils/assetSections/bandhausConfig.ts`
- `src/utils/assetSections/bandhausModules.ts`

**Modifiziert:**
- `src/utils/assetConfig.ts`
- `src/utils/assetModuleRegistry.ts`
- `src/components/assets/sectionRegistry.ts`
- Locale-Dateien

---

## Task 1: Slot-Konstanten + Raum-Layout

**Files:**
- Create: `src/utils/assetSections/bandhausConfig.ts`

- [ ] **Step 1:** Slot-Listen und Raum-Zonen (3:4-Portrait, Etagen von unten nach oben):

```ts
import type { SlotType } from '../../types/assets'

export const BANDHAUS_T1_SLOTS = ['bh_stage', 'bh_kitchen', 'bh_sleeping'] as const
export const BANDHAUS_T2_SLOTS = [...BANDHAUS_T1_SLOTS, 'bh_lounge', 'bh_backyard'] as const
export const BANDHAUS_T3_SLOTS = [...BANDHAUS_T2_SLOTS, 'bh_security', 'bh_identity', 'bh_secret'] as const

// Vertikales Hauslayout: y = 0 oben, y = 1 unten
// Etagen: Dach (0..0.15), OG (0.15..0.45), EG (0.45..0.75), Keller (0.75..0.95), Vorgarten (0..1 außen)
export const BANDHAUS_SLOT_ZONES: Partial<Record<SlotType, { x: number; y: number; w: number; h: number }>> = {
  bh_identity:  { x: 0.50, y: 0.10, w: 0.80, h: 0.15 },   // Hausfront / Mural
  bh_sleeping:  { x: 0.30, y: 0.30, w: 0.40, h: 0.20 },   // OG links
  bh_lounge:    { x: 0.70, y: 0.30, w: 0.40, h: 0.20 },   // OG rechts
  bh_stage:     { x: 0.30, y: 0.55, w: 0.40, h: 0.20 },   // EG links
  bh_kitchen:   { x: 0.70, y: 0.55, w: 0.40, h: 0.20 },   // EG rechts
  bh_backyard:  { x: 0.93, y: 0.55, w: 0.14, h: 0.30 },   // außen rechts
  bh_security:  { x: 0.50, y: 0.78, w: 0.20, h: 0.10 },   // Vortür
  bh_secret:    { x: 0.50, y: 0.88, w: 0.50, h: 0.10 },   // Keller (Tier 3)
}
```

- [ ] **Step 2: Commit** — `feat(assets/bandhaus): add slot constants and room layout`

## Task 2: Chassis-Konfig befüllen

**Files:**
- Modify: `src/utils/assetConfig.ts`

- [ ] **Step 1: Test analog zu Tourbus/Studio**
- [ ] **Step 2:** Konfig:

```ts
import { BANDHAUS_T1_SLOTS, BANDHAUS_T2_SLOTS, BANDHAUS_T3_SLOTS } from './assetSections/bandhausConfig'

const BANDHAUS_LEGIT = {
  1: { price: 8000,  upkeep: 30, revenue: 0, slots: BANDHAUS_T1_SLOTS, baseRiskEventChance: 0.004 },
  2: { price: 18000, upkeep: 55, revenue: 0, slots: BANDHAUS_T2_SLOTS, baseRiskEventChance: 0.004 },
  3: { price: 35000, upkeep: 90, revenue: 0, slots: BANDHAUS_T3_SLOTS, baseRiskEventChance: 0.004 },
} as const

// bandhaus_chassis: { legit: BANDHAUS_LEGIT, diy: { 1: buildDiyTier(BANDHAUS_LEGIT[1]), ... } }
```

- [ ] **Step 3: Commit** — `feat(assets/bandhaus): populate chassis config`

## Task 3: Modul-Registry + Prompts (16 Module)

**Files:**
- Create: `src/utils/assetSections/bandhausModules.ts`
- Test: `tests/node/bandhausModules.test.js`

- [ ] **Step 1: Test** — 16 Module, alle Prompts, mehrere mit `bh_secret` slotType erfordern Tier 3 (über `chassisTier`-Constraint, der über Slot-Existenz erzwungen wird).
- [ ] **Step 2:** Module aus Spec §4.5:

```ts
const MODULES: AssetModule[] = [
  { id: 'bh_pro_pa_system', ownerKind: 'bandhaus_chassis', slotType: 'bh_stage', flavor: 'legit',
    cost: 2200, installCost: 200, removalRefundFraction: 0.4,
    boni: { trainingCostMultiplier: 0.85 }, unlock: { minMoney: 2200 },
    imagePromptKey: 'bh_pro_pa_system' },
  { id: 'bh_salvaged_pa', ownerKind: 'bandhaus_chassis', slotType: 'bh_stage', flavor: 'diy',
    cost: 400, installCost: 100, removalRefundFraction: 0.2,
    boni: { trainingCostMultiplier: 0.95 }, unlock: {},
    imagePromptKey: 'bh_salvaged_pa' },
  { id: 'bh_soundproofing', ownerKind: 'bandhaus_chassis', slotType: 'bh_stage', flavor: 'legit',
    cost: 800, installCost: 300, removalRefundFraction: 0.2,
    boni: { infightingDamper: true }, unlock: {},
    imagePromptKey: 'bh_soundproofing' },
  { id: 'bh_bunk_beds', ownerKind: 'bandhaus_chassis', slotType: 'bh_sleeping', flavor: 'legit',
    cost: 600, installCost: 100, removalRefundFraction: 0.4,
    boni: { staminaRegenBonusPerDay: 3 }, unlock: {},
    imagePromptKey: 'bh_bunk_beds' },
  { id: 'bh_stocked_kitchen', ownerKind: 'bandhaus_chassis', slotType: 'bh_kitchen', flavor: 'legit',
    cost: 900, installCost: 150, removalRefundFraction: 0.4,
    boni: { staminaRegenBonusPerDay: 2, bandMoodPerDay: 1 }, unlock: { minMoney: 800 },
    imagePromptKey: 'bh_stocked_kitchen' },
  { id: 'bh_weed_garden', ownerKind: 'bandhaus_chassis', slotType: 'bh_backyard', flavor: 'diy',
    cost: 300, installCost: 100, removalRefundFraction: 0.1,
    boni: { bandMoodPerDay: 2 }, riskEventTypes: ['raid'],
    unlock: {}, imagePromptKey: 'bh_weed_garden' },
  { id: 'bh_bouncer_dog', ownerKind: 'bandhaus_chassis', slotType: 'bh_security', flavor: 'legit',
    cost: 500, installCost: 100, removalRefundFraction: 0.0,
    boni: { baseRiskChanceMultiplier: 0.5 }, unlock: { minFame: 40 },
    imagePromptKey: 'bh_bouncer_dog' },
  { id: 'bh_security_cam_mesh', ownerKind: 'bandhaus_chassis', slotType: 'bh_security', flavor: 'legit',
    cost: 800, installCost: 200, removalRefundFraction: 0.3,
    boni: { baseRiskChanceMultiplier: 0.7 }, unlock: { minMoney: 800 },
    imagePromptKey: 'bh_security_cam_mesh' },
  { id: 'bh_wall_mural', ownerKind: 'bandhaus_chassis', slotType: 'bh_identity', flavor: 'legit',
    cost: 0, installCost: 200, removalRefundFraction: 0.0,
    boni: { famePassivePerDay: 0.5 }, unlock: { requiredStoryFlags: ['saved_local_venue'] },
    imagePromptKey: 'bh_wall_mural' },
  { id: 'bh_basement_bar', ownerKind: 'bandhaus_chassis', slotType: 'bh_lounge', flavor: 'legit',
    cost: 1500, installCost: 300, removalRefundFraction: 0.3,
    boni: { baseDailyRevenueDelta: 25 }, unlock: { minFame: 60 },
    imagePromptKey: 'bh_basement_bar' },
  { id: 'bh_hot_tub', ownerKind: 'bandhaus_chassis', slotType: 'bh_lounge', flavor: 'legit',
    cost: 4000, installCost: 500, removalRefundFraction: 0.3,
    boni: { bandMoodPerDay: 2, infightingDamper: true }, unlock: { minMoney: 4000 },
    imagePromptKey: 'bh_hot_tub' },
  { id: 'bh_art_sublet', ownerKind: 'bandhaus_chassis', slotType: 'bh_identity', flavor: 'legit',
    cost: 0, installCost: 100, removalRefundFraction: 0.0,
    boni: { baseDailyRevenueDelta: 35 }, unlock: { minFame: 30, minScenePresence: 25 },
    imagePromptKey: 'bh_art_sublet' },
  { id: 'bh_zine_library', ownerKind: 'bandhaus_chassis', slotType: 'bh_lounge', flavor: 'diy',
    cost: 100, installCost: 50, removalRefundFraction: 0.1,
    boni: { bandMoodPerDay: 0.5, famePassivePerDay: 0.1 }, unlock: {},
    imagePromptKey: 'bh_zine_library' },
  { id: 'bh_vinyl_press_corner', ownerKind: 'bandhaus_chassis', slotType: 'bh_secret', flavor: 'diy',
    cost: 3500, installCost: 400, removalRefundFraction: 0.3,
    boni: { merchCapacityBonus: 50, baseDailyRevenueDelta: 20 }, unlock: { minFame: 70 },
    imagePromptKey: 'bh_vinyl_press_corner' },
  { id: 'bh_pirate_radio_antenna', ownerKind: 'bandhaus_chassis', slotType: 'bh_secret', flavor: 'diy',
    cost: 600, installCost: 150, removalRefundFraction: 0.1,
    boni: { famePassivePerDay: 1.0 }, riskEventTypes: ['police_check'],
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'bh_pirate_radio_antenna' },
  { id: 'bh_squat_dog', ownerKind: 'bandhaus_chassis', slotType: 'bh_security', flavor: 'diy',
    cost: 0, installCost: 0, removalRefundFraction: 0.0,
    boni: { baseRiskChanceMultiplier: 0.7 }, unlock: {},
    imagePromptKey: 'bh_squat_dog' },
]

const PROMPTS: Record<string, string> = {
  bh_pro_pa_system: 'pixel art professional PA system stack stage rehearsal room',
  bh_salvaged_pa: 'pixel art salvaged PA system mismatched speakers diy rehearsal',
  bh_soundproofing: 'pixel art soundproofing foam wall thick padding band practice',
  bh_bunk_beds: 'pixel art bunk beds 4 berths punk band sleeping room',
  bh_stocked_kitchen: 'pixel art stocked band kitchen fridge full beer snacks',
  bh_weed_garden: 'pixel art indoor weed garden hydroponics secret room green glow',
  bh_bouncer_dog: 'pixel art big mean bouncer dog guarding band house entrance',
  bh_security_cam_mesh: 'pixel art security camera mesh band house exterior surveillance',
  bh_wall_mural: 'pixel art massive punk wall mural band house facade graffiti art',
  bh_basement_bar: 'pixel art basement bar band house lounge dim lights',
  bh_hot_tub: 'pixel art hot tub band house backyard lounge punk luxury',
  bh_art_sublet: 'pixel art art space sublet band house rentable studio room',
  bh_zine_library: 'pixel art zine library shelf full of punk magazines lounge corner',
  bh_vinyl_press_corner: 'pixel art small vinyl pressing machine secret basement corner',
  bh_pirate_radio_antenna: 'pixel art pirate radio antenna rooftop band house transmitter',
  bh_squat_dog: 'pixel art scrappy squatter dog mutt guarding band house diy',
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets/bandhaus): register 16 modules with prompts`

## Task 4: `BandhausCrossSectionView`

**Files:**
- Create: `src/components/assets/sections/BandhausCrossSectionView.tsx`
- Test: `tests/ui/BandhausCrossSectionView.test.tsx`

- [ ] **Step 1: Test**

```tsx
test('renders 3:4 portrait background', () => { /* ... */ })
test('renders rooms as zones', () => { /* ... */ })
test('mural module overlays entire identity zone on house facade', () => { /* ... */ })
test('secret room is only rendered when tier >= 3', () => { /* ... */ })
```

- [ ] **Step 2: Komponente** — Pattern wie `StudioFloorplanView`, aber:
  - Aspect-Ratio `3:4`
  - Akzent `var(--color-cosmic-purple)`
  - `bh_identity`-Slot mit Mural-Modul rendert das Modul-Bild als großes Overlay über die ganze Hausfront (statt nur als 64×64-Thumbnail). Erkennbar an Slot-Größe (`w: 0.80, h: 0.15`)
  - Geheime Räume (`bh_secret`) nur sichtbar wenn `asset.chassisTier === 3`

```tsx
{asset.slots.map(slot => {
  if (slot.slotType === 'bh_secret' && asset.chassisTier < 3) return null
  const zone = BANDHAUS_SLOT_ZONES[slot.slotType]
  if (!zone) return null
  const installed = slot.installedModuleId
  const isMural = slot.slotType === 'bh_identity' && installed
  return (
    <button
      key={slot.id} onClick={() => onSlotClick(slot.id)}
      style={{
        position: 'absolute',
        left: `${(zone.x - zone.w / 2) * 100}%`,
        top: `${(zone.y - zone.h / 2) * 100}%`,
        width: `${zone.w * 100}%`, height: `${zone.h * 100}%`,
        border: '2px dashed var(--color-cosmic-purple)',
        background: installed && !isMural ? 'transparent' : 'rgba(0,0,0,0.4)',
      }}
    >
      {installed && (
        <img
          src={resolveGenImageUrl(getModuleImagePrompt(installed)) + (isMural ? '&width=512&height=128' : '&width=256&height=256')}
          alt={installed}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </button>
  )
})}
```

- [ ] **Step 3: Commit** — `feat(assets/bandhaus): add cross-section view with mural overlay`

## Task 5: `BandhausSection` + Registry

**Files:**
- Create: `src/components/assets/sections/BandhausSection.tsx`
- Modify: `src/components/assets/sectionRegistry.ts`

- [ ] **Step 1:** Komponente analog Tourbus/Studio
- [ ] **Step 2:** `SECTION_VIEWS.bandhaus_chassis = { Component: BandhausSection, accent: 'var(--color-cosmic-purple)' }`
- [ ] **Step 3: Commit** — `feat(assets/bandhaus): register section view`

## Task 6: Locale-Keys

**Files:**
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`

- [ ] **Step 1:** Ergänzen (16 Modul-Keys + Slot-Keys + Kind-Key):

```json
{
  "assets": {
    "kind": { "bandhaus_chassis": "Band House" },
    "slot": {
      "bh_stage": "Stage area", "bh_sleeping": "Sleeping quarters",
      "bh_kitchen": "Kitchen", "bh_lounge": "Lounge", "bh_backyard": "Backyard",
      "bh_security": "Security", "bh_identity": "House identity", "bh_secret": "Secret room"
    },
    "module": {
      "bh_pro_pa_system": { "name": "Pro PA system", "description": "-15% training cost" },
      "bh_salvaged_pa": { "name": "Salvaged PA", "description": "-5% training cost" },
      "bh_soundproofing": { "name": "Soundproofing", "description": "Neighbors stay quiet" },
      "bh_bunk_beds": { "name": "Bunk beds", "description": "+3 stamina regen/day" },
      "bh_stocked_kitchen": { "name": "Stocked kitchen", "description": "+2 stamina, +1 mood" },
      "bh_weed_garden": { "name": "Weed garden", "description": "+2 mood, raid risk" },
      "bh_bouncer_dog": { "name": "Bouncer dog", "description": "Halves break-in chance" },
      "bh_security_cam_mesh": { "name": "Security cameras", "description": "Reduces theft" },
      "bh_wall_mural": { "name": "Wall mural", "description": "+0.5 fame/day" },
      "bh_basement_bar": { "name": "Basement bar", "description": "+25 EUR/day" },
      "bh_hot_tub": { "name": "Hot tub", "description": "+2 mood, dampens infighting" },
      "bh_art_sublet": { "name": "Art sublet", "description": "+35 EUR/day" },
      "bh_zine_library": { "name": "Zine library", "description": "Small mood and fame trickle" },
      "bh_vinyl_press_corner": { "name": "Vinyl press corner", "description": "+50 merch capacity, +20 EUR/day" },
      "bh_pirate_radio_antenna": { "name": "Pirate radio antenna", "description": "+1 fame/day, police risk" },
      "bh_squat_dog": { "name": "Squat dog", "description": "Reduces risk, free" }
    }
  }
}
```

- [ ] **Step 2:** DE-Übersetzungen
- [ ] **Step 3: Commit** — `feat(i18n/bandhaus): add bandhaus locale keys`

## Task 7: Integrations-Tests

**Files:**
- Test: `tests/node/bandhausEconomyIntegration.test.js`

- [ ] **Step 1:**

```js
test('bh_weed_garden triggers raid event deterministically', () => {
  // dispatch ADVANCE_DAY mit RNG-Stream der das Event garantiert
})
test('bh_wall_mural unlock requires saved_local_venue story flag', () => {
  // isModuleUnlocked → false without flag, true with
})
test('bh_hot_tub aggregates infightingDamper flag in AssetModifiers', () => { /* ... */ })
test('tier-3 chassis exposes bh_secret slot, tier-2 does not', () => { /* ... */ })
```

- [ ] **Step 2: Commit** — `test(assets/bandhaus): integration tests`

---

## Self-Review

- [ ] 16 Module aus Spec §4.5 vollständig
- [ ] `bh_wall_mural` rendert als Fassaden-Overlay (große Bildgröße)
- [ ] `bh_secret`-Slots nur ab Tier 3 sichtbar
- [ ] Akzent-Token `cosmic-purple` verifiziert in `brandColors.ts`
- [ ] EN + DE Locale-Parität

## Acceptance Criteria

- Bandhaus-Tab zeigt vertikalen Haus-Querschnitt (3:4)
- Mit installiertem `bh_wall_mural` ist das Modul-Bild als Fassaden-Element sichtbar
- Tier-Upgrade von 2 auf 3 fügt `bh_secret`-Slot hinzu
- DIY-Module mit Risk-Events (`bh_weed_garden`, `bh_pirate_radio_antenna`) triggern korrekt
- `pnpm run test:all` grün
