# Long-Term Assets — Plan 3: Studio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Studio-Sektion spielbar machen: 3 Chassis-Tiers, 14 Module mit Bildern, isometrische Top-Down-Floorplan-Ansicht mit Zonen-Slots, Akzent-Token `electric-blue`.

**Architecture:** Plan-1-Foundation + Plan-2-Pattern. `CHASSIS_CONFIG.studio_chassis` befüllen, 14 Module registrieren, `StudioFloorplanView` rendert Background + Zonen-Overlays mit gestrichelter Border statt runden Hotspots.

**Tech Stack:** wie Plan 1. Aspect-Ratio 4:3.

**Spec-Referenz:** §4.1, §4.4 (Studio-Pool), §7.3 Visual, §7.7 Akzent.

**Voraussetzung:** Plan 1 abgeschlossen. Unabhängig von Plan 2.

---

## File Structure

**Neu:**
- `src/components/assets/sections/StudioSection.tsx`
- `src/components/assets/sections/StudioFloorplanView.tsx`
- `src/utils/assetSections/studioConfig.ts`
- `src/utils/assetSections/studioModules.ts`

**Modifiziert:**
- `src/utils/assetConfig.ts` — `studio_chassis`-Konfig
- `src/utils/assetModuleRegistry.ts` — Side-Effect-Import
- `src/components/assets/sectionRegistry.ts` — Registrierung
- Locale-Dateien

---

## Task 1: Slot-Konstanten + Zonen-Positionen

**Files:**
- Create: `src/utils/assetSections/studioConfig.ts`

- [ ] **Step 1:** Slot-Listen und Zonen-Rechtecke (Background 4:3, Position als Mitte der Zone + Größe):

```ts
import type { SlotType } from '../../types/assets'

export const STUDIO_T1_SLOTS = ['st_control', 'st_mic', 'st_monitoring'] as const
export const STUDIO_T2_SLOTS = [...STUDIO_T1_SLOTS, 'st_outboard', 'st_treatment'] as const
export const STUDIO_T3_SLOTS = [...STUDIO_T2_SLOTS, 'st_software', 'st_vibe', 'st_iso'] as const

// Zonen statt Punkten: x/y = Zentrum, w/h = Größe (0..1 normalisiert über 4:3-Background)
export const STUDIO_SLOT_ZONES: Partial<Record<SlotType, { x: number; y: number; w: number; h: number }>> = {
  st_control:    { x: 0.50, y: 0.55, w: 0.30, h: 0.20 },
  st_mic:        { x: 0.20, y: 0.30, w: 0.15, h: 0.20 },
  st_monitoring: { x: 0.50, y: 0.30, w: 0.20, h: 0.10 },
  st_outboard:   { x: 0.80, y: 0.55, w: 0.15, h: 0.25 },
  st_treatment:  { x: 0.50, y: 0.10, w: 0.60, h: 0.12 },
  st_software:   { x: 0.20, y: 0.70, w: 0.20, h: 0.15 },
  st_vibe:       { x: 0.80, y: 0.85, w: 0.20, h: 0.20 },
  st_iso:        { x: 0.10, y: 0.85, w: 0.20, h: 0.25 },
}
```

- [ ] **Step 2: Commit** — `feat(assets/studio): add slot constants and zone layout`

## Task 2: Chassis-Konfig befüllen

**Files:**
- Modify: `src/utils/assetConfig.ts`
- Test: `tests/node/studioChassisConfig.test.js`

- [ ] **Step 1: Test analog Tourbus**
- [ ] **Step 2:** Konfig:

```ts
import { STUDIO_T1_SLOTS, STUDIO_T2_SLOTS, STUDIO_T3_SLOTS } from './assetSections/studioConfig'

const STUDIO_LEGIT = {
  1: { price: 6000,  upkeep: 25, revenue: 20,  slots: STUDIO_T1_SLOTS, baseRiskEventChance: 0.003 },
  2: { price: 14000, upkeep: 45, revenue: 50,  slots: STUDIO_T2_SLOTS, baseRiskEventChance: 0.003 },
  3: { price: 30000, upkeep: 80, revenue: 120, slots: STUDIO_T3_SLOTS, baseRiskEventChance: 0.003 },
} as const

// CHASSIS_CONFIG.studio_chassis = {
//   legit: STUDIO_LEGIT,
//   diy: {
//     1: buildDiyTier(STUDIO_LEGIT[1]),
//     2: buildDiyTier(STUDIO_LEGIT[2]),
//     3: buildDiyTier(STUDIO_LEGIT[3]),
//   },
// }
```

- [ ] **Step 3: Commit** — `feat(assets/studio): populate chassis config`

## Task 3: Modul-Registry + Prompts (14 Module)

**Files:**
- Create: `src/utils/assetSections/studioModules.ts`
- Test: `tests/node/studioModules.test.js`

- [ ] **Step 1: Test** — 14 Module mit `ownerKind: 'studio_chassis'`, alle Prompts vorhanden.
- [ ] **Step 2:** Module aus Spec §4.4 vollständig (Auszug zeigt Pattern):

```ts
const MODULES: AssetModule[] = [
  { id: 'st_ssl_console', ownerKind: 'studio_chassis', slotType: 'st_control', flavor: 'legit',
    cost: 8000, installCost: 500, removalRefundFraction: 0.4,
    boni: { songQualityBonus: 0.20 }, unlock: { minMoney: 8000 },
    imagePromptKey: 'st_ssl_console' },
  { id: 'st_diy_mixer', ownerKind: 'studio_chassis', slotType: 'st_control', flavor: 'diy',
    cost: 400, installCost: 100, removalRefundFraction: 0.2,
    boni: { songCostMultiplier: 0.80 }, unlock: {},
    imagePromptKey: 'st_diy_mixer' },
  { id: 'st_u87_mic', ownerKind: 'studio_chassis', slotType: 'st_mic', flavor: 'legit',
    cost: 2200, installCost: 50, removalRefundFraction: 0.5,
    boni: { songQualityBonus: 0.08 }, unlock: { minFame: 25 },
    imagePromptKey: 'st_u87_mic' },
  { id: 'st_dynamic_workhorse_mic', ownerKind: 'studio_chassis', slotType: 'st_mic', flavor: 'legit',
    cost: 250, installCost: 30, removalRefundFraction: 0.5,
    boni: { songCostMultiplier: 0.92 }, unlock: {},
    imagePromptKey: 'st_dynamic_workhorse_mic' },
  { id: 'st_stolen_russian_compressors', ownerKind: 'studio_chassis', slotType: 'st_outboard', flavor: 'diy',
    cost: 800, installCost: 100, removalRefundFraction: 0.2,
    boni: { songQualityBonus: 0.10 }, riskEventTypes: ['police_check'],
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'st_stolen_russian_compressors' },
  { id: 'st_tape_echo_handbuilt', ownerKind: 'studio_chassis', slotType: 'st_outboard', flavor: 'diy',
    cost: 600, installCost: 80, removalRefundFraction: 0.2,
    boni: { songQualityBonus: 0.06 },
    unlock: { requiredMemberSkill: { skill: 'tech', tier: 2 } },
    imagePromptKey: 'st_tape_echo_handbuilt' },
  { id: 'st_ns10_monitors', ownerKind: 'studio_chassis', slotType: 'st_monitoring', flavor: 'legit',
    cost: 900, installCost: 50, removalRefundFraction: 0.5,
    boni: { songQualityBonus: 0.05 }, unlock: {},
    imagePromptKey: 'st_ns10_monitors' },
  { id: 'st_auralex_treatment', ownerKind: 'studio_chassis', slotType: 'st_treatment', flavor: 'legit',
    cost: 1200, installCost: 200, removalRefundFraction: 0.3,
    boni: { songCostMultiplier: 0.95 }, unlock: { minMoney: 1200 },
    imagePromptKey: 'st_auralex_treatment' },
  { id: 'st_haunted_reverb_chamber', ownerKind: 'studio_chassis', slotType: 'st_treatment', flavor: 'diy',
    cost: 0, installCost: 200, removalRefundFraction: 0.0,
    boni: { songQualityBonus: 0.12 }, riskEventTypes: ['paranormal'],
    unlock: { requiredStoryFlags: ['old_basement_secret'] },
    imagePromptKey: 'st_haunted_reverb_chamber' },
  { id: 'st_pro_tools_hd', ownerKind: 'studio_chassis', slotType: 'st_software', flavor: 'legit',
    cost: 3500, installCost: 100, removalRefundFraction: 0.3,
    boni: { enablesReRecording: true }, unlock: { minMoney: 3500 },
    imagePromptKey: 'st_pro_tools_hd' },
  { id: 'st_cracked_daw_bundle', ownerKind: 'studio_chassis', slotType: 'st_software', flavor: 'diy',
    cost: 50, installCost: 20, removalRefundFraction: 0.0,
    boni: { songCostMultiplier: 0.50 }, riskEventTypes: ['copyright_strike'],
    unlock: {}, imagePromptKey: 'st_cracked_daw_bundle' },
  { id: 'st_iso_booth', ownerKind: 'studio_chassis', slotType: 'st_iso', flavor: 'legit',
    cost: 2500, installCost: 400, removalRefundFraction: 0.4,
    boni: { songQualityBonus: 0.06 }, unlock: { minChassisTier: 3 },
    imagePromptKey: 'st_iso_booth' },
  { id: 'st_vintage_synth_corner', ownerKind: 'studio_chassis', slotType: 'st_vibe', flavor: 'legit',
    cost: 1800, installCost: 100, removalRefundFraction: 0.4,
    boni: { songQualityBonus: 0.05 }, unlock: { minFame: 50 },
    imagePromptKey: 'st_vintage_synth_corner' },
  { id: 'st_lava_lamp_beer_fridge', ownerKind: 'studio_chassis', slotType: 'st_vibe', flavor: 'diy',
    cost: 200, installCost: 30, removalRefundFraction: 0.4,
    boni: { bandMoodPerDay: 1 }, unlock: {},
    imagePromptKey: 'st_lava_lamp_beer_fridge' },
]

const PROMPTS: Record<string, string> = {
  st_ssl_console: 'pixel art vintage SSL mixing console glowing meters analog studio dark moody',
  st_diy_mixer: 'pixel art small diy mixer rough soldering exposed wires home studio',
  st_u87_mic: 'pixel art Neumann U87 condenser microphone shock mount professional studio',
  st_dynamic_workhorse_mic: 'pixel art SM58 dynamic microphone on stand basic recording',
  st_stolen_russian_compressors: 'pixel art russian compressor rack vintage soviet era hardware stolen serial scratched',
  st_tape_echo_handbuilt: 'pixel art handbuilt tape echo unit roland space echo style diy',
  st_ns10_monitors: 'pixel art yamaha ns-10 white cone studio monitors',
  st_auralex_treatment: 'pixel art studio acoustic foam panels purple gray wall treatment',
  st_haunted_reverb_chamber: 'pixel art haunted reverb chamber ghostly green glow eerie basement',
  st_pro_tools_hd: 'pixel art pro tools HD interface and screen modern DAW workstation',
  st_cracked_daw_bundle: 'pixel art pirated DAW software cracked sticker on laptop diy',
  st_iso_booth: 'pixel art recording iso booth small cabin glass door studio',
  st_vintage_synth_corner: 'pixel art vintage moog and analog synth corner studio vibe',
  st_lava_lamp_beer_fridge: 'pixel art lava lamp and mini beer fridge studio chillout corner',
}

for (const m of MODULES) MODULE_REGISTRY[m.id] = m
for (const [k, v] of Object.entries(PROMPTS)) MODULE_PROMPTS[k] = v
```

- [ ] **Step 3: Tests grün. Commit** — `feat(assets/studio): register 14 modules with prompts`

## Task 4: `StudioFloorplanView`

**Files:**
- Create: `src/components/assets/sections/StudioFloorplanView.tsx`
- Test: `tests/ui/StudioFloorplanView.test.tsx`

- [ ] **Step 1: Test**

```tsx
test('renders 4:3 background', () => { /* ... */ })
test('renders zone overlays for each slot', () => { /* ... */ })
test('installed module fills zone with thumbnail', () => { /* ... */ })
test('clicking zone calls onSlotClick', () => { /* ... */ })
```

- [ ] **Step 2: Komponente** — analog `TourbusVehicleView`, aber Slots als Rechteck-Zonen:

```tsx
import { GeneratedImagePanel } from '../../../ui/shared/GeneratedImagePanel'
import { getSectionBackgroundPrompt, resolveGenImageUrl, getModuleImagePrompt, appendImageSize } from '../../../utils/imageGen'
import { STUDIO_SLOT_ZONES } from '../../../utils/assetSections/studioConfig'
import type { LongTermAsset } from '../../../types/assets'

interface Props { asset: LongTermAsset; onSlotClick: (slotId: string) => void }

export const StudioFloorplanView = ({ asset, onSlotClick }: Props) => (
  <div className="studio-floorplan-view" style={{ position: 'relative' }}>
    <GeneratedImagePanel
      prompt={getSectionBackgroundPrompt('studio_chassis', asset.chassisFlavor)}
      alt="Studio floorplan" aspectRatio="4:3"
      sizeHint={{ width: 1024, height: 768 }}
    />
    {asset.slots.map(slot => {
      const zone = STUDIO_SLOT_ZONES[slot.slotType]
      if (!zone) return null
      const installed = slot.installedModuleId
      return (
        <button
          key={slot.id}
          onClick={() => onSlotClick(slot.id)}
          aria-label={`zone ${slot.slotType}`}
          style={{
            position: 'absolute',
            left: `${(zone.x - zone.w / 2) * 100}%`,
            top: `${(zone.y - zone.h / 2) * 100}%`,
            width: `${zone.w * 100}%`, height: `${zone.h * 100}%`,
            border: '2px dashed var(--color-electric-blue)',
            background: installed ? 'transparent' : 'rgba(0,0,0,0.4)',
            cursor: 'pointer',
          }}
        >
          {installed && (
            <img
              src={appendImageSize(resolveGenImageUrl(getModuleImagePrompt(installed)), 256, 256)}
              alt={installed} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </button>
      )
    })}
  </div>
)
```

- [ ] **Step 3: Commit** — `feat(assets/studio): add floorplan view with zone overlays`

## Task 5: `StudioSection` + Registry

**Files:**
- Create: `src/components/assets/sections/StudioSection.tsx`
- Modify: `src/components/assets/sectionRegistry.ts`

- [ ] **Step 1:** Komponente analog `TourbusSection`, mit `kind: 'studio_chassis'`.
- [ ] **Step 2:** `SECTION_VIEWS.studio_chassis = { Component: StudioSection, accent: 'var(--color-electric-blue)' }`
- [ ] **Step 3: Commit** — `feat(assets/studio): register section view`

## Task 6: Locale-Keys

**Files:**
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`

- [ ] **Step 1:** Ergänzen:

```json
{
  "assets": {
    "kind": { "studio_chassis": "Recording Studio" },
    "slot": {
      "st_control": "Mixing console", "st_outboard": "Outboard rack",
      "st_mic": "Microphone locker", "st_monitoring": "Monitor speakers",
      "st_treatment": "Acoustic treatment", "st_software": "DAW software",
      "st_vibe": "Vibe corner", "st_iso": "Isolation booth"
    },
    "module": {
      "st_ssl_console": { "name": "SSL Console", "description": "+20% song quality" },
      "st_diy_mixer": { "name": "DIY mixer", "description": "Lowers recording costs" },
      "st_u87_mic": { "name": "Neumann U87", "description": "+8% song quality" },
      "st_dynamic_workhorse_mic": { "name": "Dynamic mic", "description": "Cheaper sessions" },
      "st_stolen_russian_compressors": { "name": "Stolen Russian compressors", "description": "+10% quality, police risk" },
      "st_tape_echo_handbuilt": { "name": "Handbuilt tape echo", "description": "+6% song quality" },
      "st_ns10_monitors": { "name": "Yamaha NS-10s", "description": "+5% song quality" },
      "st_auralex_treatment": { "name": "Acoustic treatment", "description": "Cheaper recording" },
      "st_haunted_reverb_chamber": { "name": "Haunted reverb chamber", "description": "+12% quality, paranormal events" },
      "st_pro_tools_hd": { "name": "Pro Tools HD", "description": "Enables re-recording" },
      "st_cracked_daw_bundle": { "name": "Cracked DAW", "description": "Half recording cost, copyright risk" },
      "st_iso_booth": { "name": "Iso booth", "description": "+6% song quality" },
      "st_vintage_synth_corner": { "name": "Vintage synth corner", "description": "+5% song quality" },
      "st_lava_lamp_beer_fridge": { "name": "Lava lamp & beer fridge", "description": "+1 band mood per day" }
    }
  }
}
```

- [ ] **Step 2:** DE-Übersetzungen parallel
- [ ] **Step 3: Commit** — `feat(i18n/studio): add studio locale keys`

## Task 7: Economy-Integration prüfen

**Files:**
- Test: `tests/node/studioEconomyIntegration.test.js`

- [ ] **Step 1: Tests dass Studio-Module Economy beeinflussen**

```js
test('st_ssl_console installed → calculateGigFinancials sees songQualityBonus 0.20', () => { /* ... */ })
test('st_pro_tools_hd installed → re-recording flag in AssetModifiers true', () => { /* ... */ })
test('broken studio (condition<20) → boni neutralisiert', () => { /* ... */ })
```

- [ ] **Step 2:** `getActiveAssetModifiers` aggregiert `songQualityBonus` und `songCostMultiplier` korrekt
- [ ] **Step 3: Commit** — `test(assets/studio): integration with economy modifiers`

## Task 8: Risk-Event-Test

**Files:**
- Test: `tests/node/studioRiskEvents.test.js`

- [ ] **Step 1:** Test dass DIY-Module mit `riskEventTypes` (z.B. `st_cracked_daw_bundle`) Events triggern:

```js
test('cracked DAW triggers copyright_strike on roll < chance', () => {
  // dispatch ADVANCE_DAY mit dayRngStream das ein Event garantiert
  // expect: ASSET_RISK_EVENT_TRIGGERED mit eventType='copyright_strike'
})
```

- [ ] **Step 2: Commit** — `test(assets/studio): risk event firing for DIY modules`

## Task 9: AGENTS.md aktualisieren

**Files:**
- Modify: `src/utils/AGENTS.md`
- Modify: `src/components/assets/AGENTS.md`
- Modify: `tests/node/AGENTS.md`

- [ ] **Step 1: `src/utils/AGENTS.md`** — Sektion "Long-Term Assets / Studio" ergänzen:
  - `assetSections/studioConfig.ts` exportiert `STUDIO_T1/T2/T3_SLOTS` und `STUDIO_SLOT_ZONES` (Rechteck-Zonen mit `x/y/w/h`, normalisiert 0..1, relativ zum 4:3-Background)
  - `assetSections/studioModules.ts` registriert 14 Module. DIY-Module mit `riskEventTypes` (`copyright_strike`, `paranormal`, `police_check`) lösen über `rollAssetRiskEvents` Risk-Events aus

- [ ] **Step 2: `src/components/assets/AGENTS.md`** — Sektion "Studio" ergänzen:
  - `StudioFloorplanView` rendert 4:3 isometrisches Studio-Background mit Zonen-Slots (Rechteck-Overlays mit gestrichelter Border) statt runden Hotspots — passt zur Layout-Metapher (Räume statt Punkte am Vehikel)
  - Sektion-Akzent: `var(--color-electric-blue)`
  - `enablesReRecording`-Flag aus `st_pro_tools_hd` gibt UI-Hook für Song-Re-Aufnahme frei; Re-Recording-Logik selbst lebt im Song-Reducer (out of scope dieser Sektion)

- [ ] **Step 3: `tests/node/AGENTS.md`** — ergänzen:
  - Studio-spezifische Integrations-Tests: Aggregation von `songQualityBonus` über mehrere Module; DIY-Risk-Event-Tests für `st_cracked_daw_bundle` (`copyright_strike`) und `st_haunted_reverb_chamber` (`paranormal`)

- [ ] **Step 4: Commit** — `docs(agents): document studio section invariants`

---

## Self-Review

- [ ] 14 Module aus Spec §4.4 alle vorhanden
- [ ] Alle Module haben `imagePromptKey`-Eintrag
- [ ] `STUDIO_SLOT_ZONES` deckt alle 8 Studio-Slot-Typen
- [ ] Locale-Keys EN + DE simultan
- [ ] `SECTION_VIEWS.studio_chassis` registriert mit `electric-blue`-Akzent
- [ ] DIY-Risk-Events (`police_check`, `copyright_strike`, `paranormal`) triggern korrekt

## Acceptance Criteria

- Studio-Tab zeigt 4:3-Studio-Background mit Zonen-Overlays
- `ModulePickerModal` für `st_control` zeigt SSL Console und DIY Mixer
- `st_pro_tools_hd` installiert → `enablesReRecording`-Flag true in `getActiveAssetModifiers`
- Risk-Event-Tests grün
- `pnpm run test:all` grün
