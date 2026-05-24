# Long-Term Assets — Design Spec

**Date:** 2026-05-24
**Branch:** `claude/sweet-bardeen-PEog8`
**Status:** Draft v3 (Review-Iteration 1 — adressiert PR #1776 Review-Threads)

## 1. Goal

Erweitere die Wirtschaftssimulation um ein System für strategische Langzeit-Investitionen. Spieler erwerben **Chassis** in vier Asset-Kategorien (Tourbus, Studio, Bandhaus, Merch-Werkstatt). Jedes Chassis besitzt **Slots**, in die der Spieler **Module** aus einem deutlich größeren Pool einsetzt. Slot-Anzahl < Pool-Größe → echte strategische Auswahl. Module sind durch Bandstatus (Fame, Geld, Story-Flags, Member-Skills, Szene-Standing) gegated.

Erwerb funktioniert über drei Pfade (Cash, Kredit, Crowdfunding). Eine `legit`/`diy`-Achse existiert sowohl auf Chassis- als auch Modul-Ebene und bietet echte Risiko-/Reward-Trade-offs. **Modul- und Chassis-Flavor müssen nicht übereinstimmen** — legit-Module auf DIY-Chassis sind erlaubt und umgekehrt (Begründung in §3.5).

Jede der vier Sektionen bekommt ein **eigenständiges visuelles Design** (Vehikel-Silhouette, Studio-Top-Down, Bandhaus-Querschnitt, Werkstatt-Förderband). Alle neuen UI-Elemente nutzen die vorhandene Pollinations-Bildgenerierung (`src/utils/imageGen.ts`); jedes Modul, jedes Chassis und jedes Entscheidungs-Modal hat ein generiertes Bild.

## 2. Scope

**In Scope**
- Vier Asset-Kategorien (Tourbus, Studio, Bandhaus, Merch-Werkstatt)
- Chassis mit 3 Tiers → bestimmt Slot-Anzahl und -Typen
- Modul-Pool pro Kategorie (12–18 Module pro Sektion)
- Modul-Slot-Typen, Slot-Kompatibilität, `exclusiveWithGroup`
- Modul-Unlock-Bedingungen (Fame, Geld, Story-Flags, Member-Skills, Szene-Standing)
- Drei Erwerbsmodi pro Chassis: `cash`, `loan`, `crowdfund`
- Modul-Erwerb separat von Chassis (immer Cash)
- `legit`/`diy` auf Chassis- und Modul-Ebene, **Mix erlaubt**
- Tägliche Tick-Logik: Verfall, Cashflow, Tilgung, Risiko-Events
- **Eine einzige** `ASSETS`-Hub-Szene mit vier sektion-spezifischen Tab-Layouts (§7.1)
- Bildgenerierung für alle Chassis, alle Module, alle Entscheidungs-Modale
- `shouldTriggerBankruptcy`-Erweiterung um Asset-Upkeep und Verbindlichkeiten

**Out of Scope (Folge-Specs)**
- Retrofit bestehender Modals/Katalog-Items mit Bildern
- Konkurrenzbands, dynamische Marktpreise
- Eigene Venues kaufen
- Steuern, Buchhaltungs-UI
- Multiplayer-Trades zwischen Bands

## 3. Datenmodell

Neue Top-Level-State-Felder:

```ts
state.assets: LongTermAsset[]
state.liabilities: Liability[]
state.crowdfundCampaigns: CrowdfundCampaign[]
```

### 3.1 Typen (`src/types/assets.d.ts`)

```ts
export type AssetKind =
  | 'tourbus_chassis'
  | 'studio_chassis'
  | 'bandhaus_chassis'
  | 'merch_workshop_chassis'

export type AssetFlavor = 'legit' | 'diy'
export type ChassisTier = 1 | 2 | 3
export type AcquisitionMode = 'cash' | 'loan' | 'crowdfund'

// Slot-Typen sind kategorie-spezifische String-Literals.
// Ein Modul mit slotType X passt nur in Slots mit slotType X.
export type SlotType =
  // Tourbus
  | 'tb_roof' | 'tb_front' | 'tb_side' | 'tb_interior_driver'
  | 'tb_interior_cabin' | 'tb_audio' | 'tb_decal'
  | 'tb_trailer_mount'   // Slot, in den der Anhänger-Modul installiert wird (Chassis-Slot, 1 pro Chassis)
  | 'tb_trailer_addon'   // Slots, die durch installierten Trailer hinzukommen — Trailer-Modul passt NICHT in diese
  // Studio
  | 'st_control' | 'st_outboard' | 'st_mic' | 'st_monitoring'
  | 'st_treatment' | 'st_software' | 'st_vibe' | 'st_iso'
  // Bandhaus
  | 'bh_stage' | 'bh_sleeping' | 'bh_kitchen' | 'bh_lounge'
  | 'bh_backyard' | 'bh_security' | 'bh_identity' | 'bh_secret'
  // Merch-Werkstatt
  | 'mw_print' | 'mw_drying' | 'mw_cutting' | 'mw_packaging'
  | 'mw_storage' | 'mw_specialty' | 'mw_sales' | 'mw_automation'

export interface AssetSlot {
  id: string
  slotType: SlotType
  position: { x: number; y: number }   // 0..1, normalisiert über Background-Bild
  installedModuleId: string | null
  addedByModuleId?: string             // bei dynamisch hinzugefügten Slots
}

export interface AssetBoni {
  // Cashflow-Boni
  baseDailyRevenueDelta?: number
  upkeepDelta?: number
  // Multiplikative Boni (Default 1.0)
  fuelMultiplier?: number
  merchCostMultiplier?: number
  songCostMultiplier?: number
  trainingCostMultiplier?: number
  // Additive Boni (Default 0)
  staminaRegenBonusPerDay?: number
  travelStaminaRegen?: number
  merchCapacityBonus?: number
  songQualityBonus?: number
  avgMerchSalePriceBonus?: number      // multiplikativ als +X%
  famePassivePerDay?: number
  bandMoodPerDay?: number
  tipBonusGigs?: number
  baseRiskChanceMultiplier?: number    // Default 1.0
  // Flags (Default false)
  infightingDamper?: boolean
  enablesReRecording?: boolean
  enablesLimitedEditions?: boolean
  enablesBulkProduction?: boolean
  reducesTheftRiskTravel?: boolean
  // Modulare Risiko-Modifikation
  diyRiskMultiplier?: number           // 1.0 Default, mit existierenden DIY-Risiken multipliziert
}

export interface ModuleUnlockReq {
  // Alle Felder werden AND-kombiniert (alle erfüllt → unlocked)
  minFame?: number
  minMoney?: number
  minScenePresence?: number
  minChassisTier?: ChassisTier
  requiredStoryFlags?: string[]        // ALLE Flags müssen gesetzt sein
  requiredMemberSkill?: {
    memberId?: string                  // wenn fehlend: jedes Member mit Skill genügt
    skill: string
    tier: number
  }
  requiredOtherModuleInstalled?: string // ein anderes Modul auf demselben Asset
}

export interface AssetModule {
  id: string                            // stabile lower_snake-ID, z.B. 'tb_solar_panel'
  ownerKind: AssetKind
  slotType: SlotType
  flavor: AssetFlavor
  cost: number
  installCost: number
  removalRefundFraction: number         // 0..1, beim Ausbau erstattet
  boni: AssetBoni
  unlock: ModuleUnlockReq
  exclusiveWithGroup?: string           // gleicher Key auf zwei Modulen → gegenseitiger Ausschluss
  addsSlots?: Array<{ slotType: SlotType; count: number }>
  // Constraint: ein Modul mit slotType=X UND addsSlots-Eintrag mit slotType=X
  // wird vom Modul-Validator zur Build-Zeit abgelehnt (verhindert Selbst-Stacking)
  maxPerAsset?: number                  // optionaler Hard-Cap, Default 1
  riskEventTypes?: RiskEventType[]
  imagePromptKey: string                // Schlüssel in MODULE_PROMPTS (mehrere Module dürfen ihn teilen)
}

export interface LongTermAsset {
  id: string
  kind: AssetKind
  chassisFlavor: AssetFlavor
  chassisTier: ChassisTier
  condition: number                     // 0..100
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
  // resolvedOutcome ist undefined solange daysRemaining > 0.
  // processCrowdfundTick setzt den Wert bei daysRemaining === 0,
  // wendet die Folgen an und entfernt den Eintrag im selben Tick.
  resolvedOutcome?: 'success' | 'fail'
}

export type RiskEventType =
  | 'eviction' | 'fire' | 'theft' | 'police_check'
  | 'copyright_strike' | 'raid' | 'scam_or_bust' | 'paranormal'
  | 'foreclosure'
```

### 3.2 Sanitization (`sanitizeAssets` etc. in `systemReducer.ts`)

- Alle Zahlen via `finiteNumberOr(value, fallback)`
- Unbekannte `kind`/`flavor`/`slotType`/`source`/`acquisitionMode` → Eintrag verwerfen
- Slot-IDs gegen Chassis-Konfig validieren; unbekannte Slot-IDs werden entfernt
- `installedModuleId` gegen `MODULE_REGISTRY` validieren; passt das Modul nicht zum Slot-Typ → auf `null`
- **Referenzielle Integrität:**
  - `AssetSlot.addedByModuleId`: muss in `MODULE_REGISTRY` existieren UND als `installedModuleId` auf demselben Asset eingebaut sein; sonst `undefined`. Slots mit dieser Bedingung verfallen werden ebenfalls entfernt (sie wurden nur durch das nicht-mehr-vorhandene Modul erzeugt)
  - `Liability.assetId`: muss in `state.assets` existieren; sonst Liability verwerfen
  - `Liability.source` gegen Union prüfen; sonst verwerfen
  - Ein `moduleId` darf höchstens einmal pro Asset installiert sein (Default `maxPerAsset = 1`); doppelte Vorkommen werden auf das erste Auftreten reduziert
- `condition` mit neuem `clampCondition`-Helper (0..100) in `gameStateUtils.ts`
- Prototyp-Keys via `Object.hasOwn`
- `BASE_STATE` (Playwright-Fixture) bekommt `assets:[], liabilities:[], crowdfundCampaigns:[]`

### 3.3 Trailer-Stacking — Anti-Exploit

Der Anhänger-Mechanismus ist explizit nicht-rekursiv konstruiert:

- `tb_trailer_hitch` hat `slotType: 'tb_trailer_mount'` (Chassis-Slot, **einer** pro Tier-3-Chassis)
- `tb_trailer_hitch.addsSlots` enthält **nur** `tb_trailer_addon`-Slots
- Es existieren **keine** Module mit `slotType: 'tb_trailer_mount'` außer `tb_trailer_hitch` selbst, und `tb_trailer_hitch.maxPerAsset = 1`
- Trailer-Addon-Module (z.B. Anhänger-Werkstatt, Extra-Merch-Lager) haben `slotType: 'tb_trailer_addon'` und können nur dort installiert werden

Ein Build-Time-Test (`assetModuleRegistry.test.js`) prüft, dass kein Modul gleichzeitig `slotType: X` UND `addsSlots`-Eintrag mit `slotType: X` enthält.

### 3.4 Crowdfund-Lifecycle

- Beim `START_CROWDFUND`: Eintrag mit `resolvedOutcome: undefined`, `daysRemaining: N`
- Pro Tag in `processCrowdfundTick`: `daysRemaining--`
- Bei `daysRemaining === 0`: deterministische Auswertung (§5.3), `resolvedOutcome` wird gesetzt, Effekte (Geld/Asset, Fame-Bonus oder fameStake-Abzug) werden im selben Tick angewandt, anschließend wird der Eintrag aus dem Array entfernt
- `resolvedOutcome` ist also nur kurzzeitig "gesetzt" — Konsumenten dürfen sich darauf verlassen, dass aktive Kampagnen `undefined` haben und resolvte Kampagnen nicht persistiert werden

### 3.5 Flavor-Mixing-Regel

Modul-Flavor und Chassis-Flavor müssen **nicht** übereinstimmen. Begründungen:
- Lore-konsistent: ein besetztes Bandhaus mit professioneller PA-Anlage ist plausibel
- Strategische Tiefe: DIY-Chassis + legit-Module wird zum echten Spar-Build mit Wachstumspfad
- Verhindert "Sackgassen"-Pfade, in denen ein günstiger DIY-Einstieg später unupgradeable wird

Action-Creator validiert nur Slot-Typ, Unlock, `exclusiveWithGroup` und `maxPerAsset` — nicht Flavor-Match.

## 4. Konfiguration

### 4.1 Chassis-Konfig (`src/utils/assetConfig.ts`)

```ts
// Slot-Listen als benannte Konstanten, damit Tier-N alle Tier-(N-1)-Slots erbt
const TOURBUS_T1_SLOTS = ['tb_roof','tb_front','tb_interior_driver','tb_audio'] as const
const TOURBUS_T2_SLOTS = [...TOURBUS_T1_SLOTS, 'tb_side','tb_interior_cabin'] as const
const TOURBUS_T3_SLOTS = [...TOURBUS_T2_SLOTS, 'tb_decal','tb_trailer_mount'] as const
// (Analoge Konstanten für Studio, Bandhaus, Workshop)

// DIY-Multiplikatoren werden programmatisch auf legit-Werte angewandt
const DIY_PRICE_MULT = 0.5
const DIY_UPKEEP_MULT = 0.7
const DIY_RISK = 0.03

const buildDiyTier = (legit: ChassisTierConfig): ChassisTierConfig => ({
  price: Math.round(legit.price * DIY_PRICE_MULT),
  upkeep: Math.round(legit.upkeep * DIY_UPKEEP_MULT),
  revenue: legit.revenue,
  slots: legit.slots,
  baseRiskEventChance: DIY_RISK,
})

export const CHASSIS_CONFIG = {
  tourbus_chassis: {
    legit: {
      1: { price: 4000,  upkeep: 20, revenue: 0, slots: TOURBUS_T1_SLOTS, baseRiskEventChance: 0.005 },
      2: { price: 9000,  upkeep: 35, revenue: 0, slots: TOURBUS_T2_SLOTS, baseRiskEventChance: 0.005 },
      3: { price: 18000, upkeep: 55, revenue: 0, slots: TOURBUS_T3_SLOTS, baseRiskEventChance: 0.005 },
    },
    diy: {
      1: buildDiyTier(/* tourbus legit 1 */),
      2: buildDiyTier(/* tourbus legit 2 */),
      3: buildDiyTier(/* tourbus legit 3 */),
    },
  },
  studio_chassis: { /* analog mit STUDIO_*_SLOTS */ },
  bandhaus_chassis: { /* analog mit BANDHAUS_*_SLOTS */ },
  merch_workshop_chassis: { /* analog mit WORKSHOP_*_SLOTS */ },
} as const satisfies Record<AssetKind, ChassisKindConfig>
```

Slot-Anzahlen pro Tier:
- Tourbus: 4 / 6 / 8
- Studio: 3 / 5 / 8
- Bandhaus: 3 / 5 / 8
- Merch-Werkstatt: 3 / 5 / 8

(Konkrete Preise/Upkeep sind Platzhalter, Balancing-Pass nach Implementierung.)

### 4.2 Modul-Effekt-Notation

Damit Module 1:1 in Code übersetzbar sind, verwenden alle Pool-Tabellen ein einheitliches Format:

- **Boni-Felder** werden als JSON-artige Liste in der Effekt-Spalte angegeben: `{ fuelMultiplier: 0.85 }`
- **Multiplikativ vs additiv**: erkennbar am Feldnamen (Felder mit `Multiplier` oder `Mult` Suffix sind multiplikativ und werden multipliziert; alle anderen Felder gemäß Typ aus `AssetBoni`)
- **Unlock-Bedingungen** sind AND-kombiniert; jedes Feld erscheint als separates JSON-Feld
- **`exclusiveWithGroup`** als Notiz in der Unlock-Spalte, da es eine Install-Regel (kein Unlock-Filter) ist

### 4.3 Modul-Pool — Tourbus

| ID | Slot | Flavor | Boni | Unlock & Constraints |
|---|---|---|---|---|
| `tb_solar_panel` | tb_roof | legit | `{ fuelMultiplier: 0.85 }` | `{ minFame: 30 }` |
| `tb_roof_rack` | tb_roof | legit | `{ merchCapacityBonus: 30 }` | — |
| `tb_subwoofer_stack` | tb_audio | diy | `{ tipBonusGigs: 0.10 }` | `{ minFame: 20 }`, exclusive: `tb_power_hog` |
| `tb_vintage_stereo` | tb_audio | legit | `{ bandMoodPerDay: 2 }` | `{ requiredStoryFlags: ['found_record_collection'] }` |
| `tb_alloy_rims` | tb_decal | legit | `{ famePassivePerDay: 0.5 }` | `{ minMoney: 1500 }` |
| `tb_fox_tail` | tb_decal | diy | `{ famePassivePerDay: 0.2 }` | `{ minFame: 10 }` |
| `tb_neon_underglow` | tb_decal | diy | `{ famePassivePerDay: 0.4 }` | `{ requiredStoryFlags: ['underground_show'] }` |
| `tb_racing_seats` | tb_interior_driver | legit | `{ staminaRegenBonusPerDay: 3 }` | — |
| `tb_sleeping_bunks` | tb_interior_cabin | legit | `{ travelStaminaRegen: 5 }` | `{ minChassisTier: 2 }` |
| `tb_mini_fridge` | tb_interior_cabin | legit | `{ bandMoodPerDay: 1 }` | `{ minMoney: 600 }` |
| `tb_espresso_machine` | tb_interior_cabin | legit | `{ travelStaminaRegen: 3 }` | `{ requiredMemberSkill: { skill: 'barista', tier: 1 } }` |
| `tb_cb_radio_mesh` | tb_front | legit | `{ fuelMultiplier: 0.95 }` | `{ requiredMemberSkill: { skill: 'tech', tier: 1 } }` |
| `tb_gps_jammer` | tb_front | diy | `{ diyRiskMultiplier: 0.5 }` (Polizei-Risiko) | `{ requiredMemberSkill: { skill: 'tech', tier: 3 } }` |
| `tb_trailer_hitch` | tb_trailer_mount | legit | `{ merchCapacityBonus: 50 }`, `addsSlots: [{ slotType: 'tb_trailer_addon', count: 2 }]` | `{ minFame: 40, minChassisTier: 3 }`, `maxPerAsset: 1` |
| `tb_fake_police_lights` | tb_front | diy | `{ tipBonusGigs: 0.05 }`, `riskEventTypes: ['police_check']` | `{ minFame: 30 }` |
| `tb_smoke_screen` | tb_front | diy | `{ reducesTheftRiskTravel: true }` | `{ requiredMemberSkill: { skill: 'tech', tier: 2 } }` |

(16 Module für 4–8 Chassis-Slots + 2 Trailer-Addon-Slots, davon je 1 pro Slot-Typ-Konkurrenz)

### 4.4 Modul-Pool — Studio

| ID | Slot | Flavor | Boni | Unlock & Constraints |
|---|---|---|---|---|
| `st_ssl_console` | st_control | legit | `{ songQualityBonus: 0.20 }` | `{ minMoney: 8000 }` |
| `st_diy_mixer` | st_control | diy | `{ songCostMultiplier: 0.80 }` | — |
| `st_u87_mic` | st_mic | legit | `{ songQualityBonus: 0.08 }` | `{ minFame: 25 }` |
| `st_dynamic_workhorse_mic` | st_mic | legit | `{ songCostMultiplier: 0.92 }` | — |
| `st_stolen_russian_compressors` | st_outboard | diy | `{ songQualityBonus: 0.10 }`, `riskEventTypes: ['police_check']` | `{ requiredMemberSkill: { skill: 'tech', tier: 2 } }` |
| `st_tape_echo_handbuilt` | st_outboard | diy | `{ songQualityBonus: 0.06 }` | `{ requiredMemberSkill: { skill: 'tech', tier: 2 } }` |
| `st_ns10_monitors` | st_monitoring | legit | `{ songQualityBonus: 0.05 }` | — |
| `st_auralex_treatment` | st_treatment | legit | `{ songCostMultiplier: 0.95 }` | `{ minMoney: 1200 }` |
| `st_haunted_reverb_chamber` | st_treatment | diy | `{ songQualityBonus: 0.12 }`, `riskEventTypes: ['paranormal']` | `{ requiredStoryFlags: ['old_basement_secret'] }` |
| `st_pro_tools_hd` | st_software | legit | `{ enablesReRecording: true }` | `{ minMoney: 3500 }` |
| `st_cracked_daw_bundle` | st_software | diy | `{ songCostMultiplier: 0.50 }`, `riskEventTypes: ['copyright_strike']` | — |
| `st_iso_booth` | st_iso | legit | `{ songQualityBonus: 0.06 }` | `{ minChassisTier: 3 }` |
| `st_vintage_synth_corner` | st_vibe | legit | `{ songQualityBonus: 0.05 }` | `{ minFame: 50 }` |
| `st_lava_lamp_beer_fridge` | st_vibe | diy | `{ bandMoodPerDay: 1 }` | — |

### 4.5 Modul-Pool — Bandhaus

| ID | Slot | Flavor | Boni | Unlock & Constraints |
|---|---|---|---|---|
| `bh_pro_pa_system` | bh_stage | legit | `{ trainingCostMultiplier: 0.85 }` | `{ minMoney: 2200 }` |
| `bh_salvaged_pa` | bh_stage | diy | `{ trainingCostMultiplier: 0.95 }` | — |
| `bh_soundproofing` | bh_stage | legit | `{ infightingDamper: true }` | — |
| `bh_bunk_beds` | bh_sleeping | legit | `{ staminaRegenBonusPerDay: 3 }` | — |
| `bh_stocked_kitchen` | bh_kitchen | legit | `{ staminaRegenBonusPerDay: 2, bandMoodPerDay: 1 }` | `{ minMoney: 800 }` |
| `bh_weed_garden` | bh_backyard | diy | `{ bandMoodPerDay: 2 }`, `riskEventTypes: ['raid']` | — |
| `bh_bouncer_dog` | bh_security | legit | `{ baseRiskChanceMultiplier: 0.5 }` | `{ minFame: 40 }` |
| `bh_security_cam_mesh` | bh_security | legit | `{ baseRiskChanceMultiplier: 0.7 }` (theft-fokus) | `{ minMoney: 800 }` |
| `bh_wall_mural` | bh_identity | legit | `{ famePassivePerDay: 0.5 }` | `{ requiredStoryFlags: ['saved_local_venue'] }` |
| `bh_basement_bar` | bh_lounge | legit | `{ baseDailyRevenueDelta: 25 }` | `{ minFame: 60 }` |
| `bh_hot_tub` | bh_lounge | legit | `{ bandMoodPerDay: 2, infightingDamper: true }` | `{ minMoney: 4000 }` |
| `bh_art_sublet` | bh_identity | legit | `{ baseDailyRevenueDelta: 35 }` | `{ minFame: 30, minScenePresence: 25 }` |
| `bh_zine_library` | bh_lounge | diy | `{ bandMoodPerDay: 0.5, famePassivePerDay: 0.1 }` | — |
| `bh_vinyl_press_corner` | bh_secret | diy | `{ merchCapacityBonus: 50, baseDailyRevenueDelta: 20 }` | `{ minFame: 70 }` |
| `bh_pirate_radio_antenna` | bh_secret | diy | `{ famePassivePerDay: 1.0 }`, `riskEventTypes: ['police_check']` | `{ requiredMemberSkill: { skill: 'tech', tier: 2 } }` |
| `bh_squat_dog` | bh_security | diy | `{ baseRiskChanceMultiplier: 0.7 }`, `cost: 0` | — |

### 4.6 Modul-Pool — Merch-Werkstatt

| ID | Slot | Flavor | Boni | Unlock & Constraints |
|---|---|---|---|---|
| `mw_4color_carousel` | mw_print | legit | `{ merchCostMultiplier: 0.75 }` | `{ minMoney: 3500 }` |
| `mw_manual_press` | mw_print | diy | `{ merchCostMultiplier: 0.90 }` | — |
| `mw_eco_ink_supply` | mw_print | legit | `{ avgMerchSalePriceBonus: 0.03 }` | `{ minScenePresence: 40 }`, `requiredOtherModuleInstalled: 'mw_4color_carousel' OR 'mw_manual_press'` (siehe §5.2 OR-Modellierung) |
| `mw_conveyor_dryer` | mw_drying | legit | `{ merchCapacityBonus: 30 }` | `{ minMoney: 1500 }` |
| `mw_heat_press_box` | mw_drying | diy | `{ merchCostMultiplier: 0.95 }` | — |
| `mw_vinyl_cutter` | mw_cutting | legit | `{ enablesLimitedEditions: true }` | `{ minMoney: 1200 }` |
| `mw_embroidery_machine` | mw_cutting | legit | `{ avgMerchSalePriceBonus: 0.05 }` | `{ minFame: 30 }` |
| `mw_badge_press` | mw_specialty | legit | `{ avgMerchSalePriceBonus: 0.03 }` | — |
| `mw_hot_foil_station` | mw_specialty | legit | `{ avgMerchSalePriceBonus: 0.10 }` | `{ minFame: 50 }` |
| `mw_cassette_dubber` | mw_specialty | diy | `{ baseDailyRevenueDelta: 20 }` | `{ requiredStoryFlags: ['tape_culture_revival'] }` |
| `mw_sticker_bot` | mw_specialty | legit | `{ baseDailyRevenueDelta: 10 }` | — |
| `mw_storage_racks` | mw_storage | legit | `{ merchCapacityBonus: 60 }` | — |
| `mw_mailorder_script` | mw_automation | legit | `{ baseDailyRevenueDelta: 30 }` | `{ requiredMemberSkill: { skill: 'tech', tier: 1 } }` |
| `mw_bandcamp_bot` | mw_sales | legit | `{ baseDailyRevenueDelta: 25 }` | `{ minFame: 20 }` |
| `mw_darkweb_vendor` | mw_sales | diy | `{ baseDailyRevenueDelta: 50 }`, `riskEventTypes: ['scam_or_bust','police_check']` | `{ requiredMemberSkill: { skill: 'tech', tier: 3 } }` |
| `mw_hype_drop_machine` | mw_automation | legit | `{ avgMerchSalePriceBonus: 0.08 }` (Gig-Tage) | `{ minFame: 70 }` |

Alle Module: `MODULE_REGISTRY: Record<string, AssetModule>` in `src/utils/assetModuleRegistry.ts`, eingefroren via `as const satisfies`.

### 4.7 Loan-Profile

`src/utils/loanProfiles.ts` — IDs `shortTerm` / `mediumTerm` / `longTerm` / `loanShark` / `coop`. DIY-Chassis können nur über `cash` oder `crowdfund` erworben werden (siehe §5.2 für Fehlerverhalten).

## 5. Reducer-Integration

### 5.1 Action-Types (in `actionTypes.ts`)

- `PURCHASE_CHASSIS`
- `PURCHASE_CHASSIS_FAILED` (typisierter Fehler statt `null`-Return)
- `UPGRADE_CHASSIS_TIER`
- `SELL_CHASSIS`
- `REPAIR_CHASSIS`
- `INSTALL_MODULE` (payload: `{ assetId, slotId, moduleId, newSlotIds?: string[] }`)
- `REMOVE_MODULE` (payload: `{ assetId, slotId }`)
- `START_CROWDFUND` / `RESOLVE_CROWDFUND`
- `ASSET_FORECLOSED`
- `ASSET_RISK_EVENT_TRIGGERED`
- `LIABILITY_PAYMENT_TICK` / `ASSET_TICK` (intern, vom advanceDay komponiert)

### 5.2 Action-Creators (`assetActionCreators.ts`)

Allgemeine Regeln:
- Normalisieren via `finiteNumberOr`
- Strippen Prototyp-Keys via `Object.hasOwn`
- Validieren gegen Konfig
- Returnen `Extract<GameAction, { type: typeof ActionTypes.X }>`
- **IDs werden im Action-Creator generiert**, nicht im Reducer (Reducer-Purity-Constraint). Bei `INSTALL_MODULE` mit einem Modul das `addsSlots` enthält, generiert der Action-Creator die neuen Slot-IDs (z.B. via `getSafeUUID()`) und übergibt sie als `newSlotIds` im Payload — der Reducer setzt sie 1:1 ein

`PURCHASE_CHASSIS`-Validierung:
- DIY-Chassis + `mode: 'loan'` → returnt `{ type: 'PURCHASE_CHASSIS_FAILED', reason: 'DIY_LOAN_NOT_ALLOWED' }`. UI deaktiviert die Loan-Option für DIY zusätzlich proaktiv, der Action-Creator ist der zweite Verteidigungsring
- Fehlende Money → `PURCHASE_CHASSIS_FAILED` mit `reason: 'INSUFFICIENT_FUNDS'`
- Reducer behandelt `PURCHASE_CHASSIS_FAILED` mit Toast-Dispatch, kein State-Change

`INSTALL_MODULE`-Validierung im Action-Creator:
- Modul existiert in `MODULE_REGISTRY`
- Slot existiert auf dem Asset und ist leer
- `module.slotType === slot.slotType`
- `unlock`-Bedingungen erfüllt (`isModuleUnlocked`-Selector, §6)
- Keine `exclusiveWithGroup`-Konflikte mit bereits installierten Modulen
- `maxPerAsset` nicht überschritten
- Bei `addsSlots`: pre-allokierte UUIDs erzeugen und in Payload mitgeben
- Bei OR-Modellierung in `requiredOtherModuleInstalled` (siehe `mw_eco_ink_supply`): erweiterter Typ `requiredOtherModuleInstalled: string | string[]` — Array bedeutet OR

### 5.3 Reducer-Module

`src/context/reducers/assetReducer.ts`, eingehängt in `gameReducer.ts`. `assertNever(action as never)` in Default-Branch.

**`UPGRADE_CHASSIS_TIER`-Semantik:**
- Neue Tier-Slots werden hinzugefügt (Aktion-Creator generiert IDs)
- Bestehende Module bleiben installiert (Tier-Upgrade ist additiv, niemals entfernt es Slots im aktuellen Design)
- `condition` bleibt erhalten
- Kosten: `CHASSIS_CONFIG[kind][flavor][newTier].price - CHASSIS_CONFIG[kind][flavor][currentTier].price + UPGRADE_OVERHEAD` (Konstante in `assetConfig.ts`, Platzhalter 500€)
- Kein Tier-Downgrade unterstützt (out of scope)

**`SELL_CHASSIS`-Semantik:**
- Alle installierten Module werden automatisch entfernt; ihr `removalRefundFraction * cost` fließt in den Verkaufserlös
- Chassis-Verkaufspreis: `purchasePrice * conditionFactor * depreciationFactor` mit `conditionFactor = condition / 100`, `depreciationFactor = max(0.4, 1 - daysOwned/365 * 0.4)` (Konstante, Balancing-Platzhalter)
- Offene `Liability` mit `assetId === asset.id` wird sofort fällig: `liability.principalRemaining` wird vom Verkaufserlös abgezogen. Bleibt ein positiver Betrag → fließt ins `money`. Negativ → `SELL_CHASSIS_FAILED` mit `reason: 'LIABILITY_EXCEEDS_VALUE'`, kein State-Change

**`REPAIR_CHASSIS`-Semantik:**
- Module bleiben installiert während Reparatur
- Kosten: `(100 - condition) * REPAIR_COST_PER_POINT` (Konstante, Platzhalter 8€/Punkt)
- Setzt `condition` auf 100 (volle Reparatur in einem Schritt — vereinfacht UX und Reducer)

### 5.4 advanceDay-Komposition

Vor Bankrott-Check, in dieser Reihenfolge:

```
state' = processAssetTick(state)              // condition decay, Modul-aggregierter Cashflow
state' = processLiabilityTick(state')         // Tilgung, default-Counter, Foreclosure
state' = processCrowdfundTick(state')         // daysRemaining--, resolve+remove bei 0
state' = rollAssetRiskEvents(state', rng)     // siehe §5.5 RNG-Quelle
state' = applyBankruptcyCheck(state')         // §5.6, jetzt mit Asset-Upkeep + Liabilities
```

Alle Sub-Ticks: reine Funktionen in `src/utils/assetTicks.ts`. `processAssetTick` gibt nicht-negative `condition`-Werte zurück (`Math.max(0, condition - decay)`).

### 5.5 RNG-Quelle (Reducer-Purity)

`rollAssetRiskEvents` braucht Determinismus. Vorgehen:
- `state.rngSeed: number` als neues persistiertes Feld (initialisiert beim Spielstart)
- `ADVANCE_DAY`-Action-Payload erhält Feld `dayRngStream: number[]` (vom Action-Creator vorberechnet — N Zufallszahlen, eine pro potentiellem RNG-Punkt im Tick)
- Action-Creator `advanceDay()` zieht aus einem zentralen Seeded-RNG (per `mulberry32` oder `seedrandom`-Wrapper über `state.rngSeed`), berechnet N Zufallszahlen, und inkrementiert den persistierten Seed
- Reducer konsumiert `dayRngStream` deterministisch — keine RNG-Calls im Reducer
- Save-Reload: gleicher `rngSeed` → gleiche Outcomes ab Reload-Punkt

### 5.6 Bankrott-Erweiterung

```
totalDailyObligations =
    baseGuaranteedDailyCost(state)               // bestehende Funktion in economyEngine.ts
  + sum(assets.map(getAssetTotalUpkeep))         // neu, §6
  - sum(assets.map(getAssetTotalDailyRevenue))   // Netto-Cashflow der Assets berücksichtigen
  + sum(liabilities.map(l => l.dailyPayment))
```

`baseGuaranteedDailyCost` ist die bestehende `calculateGuaranteedDailyCost` (Band-Member-Gehälter, fixe Operating Costs) aus `src/utils/economyEngine.ts`. Falls Asset-Cashflow positiv ist (Revenue > Upkeep), reduziert er die Obligation entsprechend.

### 5.7 Lifecycle

- `START_GIG`: assets/liabilities/crowdfundCampaigns unverändert
- `RESET_GAME`: alle drei auf `[]`, `rngSeed` re-initialisiert
- `condition < 20`: aggregierte Boni werden im Selector neutralisiert
- `condition === 0`: dispatch `ASSET_FORECLOSED`

## 6. Selektor-Layer

`src/utils/assetSelectors.ts` (memoisiert wie `deriveFinancials`):

```ts
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
    reducesTheftRiskTravel: false,
  },
}

export function getInstalledModules(asset: LongTermAsset): AssetModule[]
export function getAssetAggregateBoni(asset: LongTermAsset): AssetBoni
export function getAssetTotalUpkeep(asset: LongTermAsset): number
  // = asset.baseUpkeep + (getAssetAggregateBoni(asset).upkeepDelta ?? 0)
export function getAssetTotalDailyRevenue(asset: LongTermAsset): number
  // = (asset.baseDailyRevenue + (getAssetAggregateBoni(asset).baseDailyRevenueDelta ?? 0)) * (asset.condition / 100)
export function getActiveAssetModifiers(assets: LongTermAsset[]): AssetModifiers
export function getTotalDailyObligations(state: GameState): number
  // siehe §5.6
export function isModuleUnlocked(module: AssetModule, state: GameState): boolean
export function getModulePoolForAsset(asset: LongTermAsset, state: GameState):
  Array<{ module: AssetModule; unlocked: boolean; lockReasons: string[] }>
export function getSlotConflicts(asset: LongTermAsset, moduleId: string):
  { canInstall: boolean; conflictingModuleIds: string[] }
```

Aggregation: multiplikative Felder werden multipliziert (Identity 1.0), additive summiert (Identity 0), Flags ge-`OR`-t. Module mit Asset-condition < 20 werden ignoriert. Defaults entsprechen `NEUTRAL_ASSET_MODIFIERS`.

Bestehende Economy-Funktionen nehmen einen `AssetModifiers`-Parameter mit `NEUTRAL_ASSET_MODIFIERS` als Default. **Konkret zu erweiternde Funktionen** in `src/utils/economyEngine.ts`:
- `calculateFuelCost` — `fuelMultiplier`
- `calculateMerchIncome` — `merchCostMultiplier`, `avgMerchSalePriceBonus`, `merchCapacityBonus`
- `calculateGigFinancials` — `tipBonusGigs`
- `calculateGuaranteedDailyCost` — bleibt unverändert, wird von `getTotalDailyObligations` ergänzt
- Song-Aufnahme-Kosten-Funktion (falls vorhanden) — `songCostMultiplier`, `songQualityBonus`
- Skill-Training-Kosten-Funktion — `trainingCostMultiplier`

## 7. UI — Vier Sektion-Eigenständige Layouts

Eine einzige Top-Level-Szene `ASSETS` als Hub mit vier Tabs. Jeder Tab rendert ein eigenständiges Visual für seine Asset-Kategorie. Statt einheitlicher Karten-Liste bekommt jede Sektion ihre eigene Metapher.

### 7.1 Gemeinsame Hub-Szene

- Komponente: `AssetsScene.tsx` in `src/components/assets/`
- Top-Bar (sektion-übergreifend): Liquidität, Netto-Cashflow, Schulden-Total, `getTotalDailyObligations`
- Tab-Leiste: 🚐 Tourbus · 🎚 Studio · 🏠 Bandhaus · 👕 Werkstatt
- Cross-Section-Vergleich: Top-Bar zeigt aggregierte Werte aller Assets, Tab zeigt Detail

### 7.2 Tourbus — Seitenansicht-Vehikel mit Hotspots (16:9)

- Komponenten: `TourbusSection.tsx`, `TourbusVehicleView.tsx`
- Layout: 16:9-Background des Vans, absolut positionierte Slot-Hotspots
- Leerer Slot: pulsierender toxic-green Outline-Kreis mit `+`
- Befüllter Slot: 64×64 Modul-Thumbnail
- Klick → `ModulePickerModal`
- Anhänger-Modul installiert: das Background-Bild bleibt das Chassis-Bild; **ein zweites generiertes Bild** (Trailer in derselben Aspect-Ratio, eigener Prompt-Helper) wird rechts angedockt. Bei Offline-Modus zeigt das Trailer-Slot ein statisches Fallback-SVG (gleicher Mechanismus wie `getGeneratedImageFallbackUrl`), die Trailer-Addon-Hotspots bleiben funktional

### 7.3 Studio — Isometrischer Top-Down (4:3)

- Komponenten: `StudioSection.tsx`, `StudioFloorplanView.tsx`
- 4:3 isometrisches Studio-Background, Slots als Zonen mit gestrichelter Border
- Klick auf Zone → `ModulePickerModal`

### 7.4 Bandhaus — Dollhouse-Querschnitt (3:4)

- Komponenten: `BandhausSection.tsx`, `BandhausCrossSectionView.tsx`
- 3:4 Background (Portrait), drei Etagen, Räume als Slots
- Klick auf Raum → `ModulePickerModal`

### 7.5 Merch-Werkstatt — Förderband-Seitenansicht (21:9)

- Komponenten: `MerchWorkshopSection.tsx`, `WorkshopProductionLineView.tsx`
- 21:9 Background, Stationen entlang des Bands
- Klick auf Station → `ModulePickerModal`

### 7.6 Gemeinsame Modale

- `ModulePickerModal.tsx` — siehe §8.2 für Bild-Strategie. Zeigt:
  - Pool aller Module für den Slot-Typ
  - Unlocked vs. gelockt mit `lockReasons[]`
  - Exclusivity-Konflikte explizit markiert
  - Pro Modul: generiertes Bild, Effekt-Liste, Kosten
- `ChassisAcquisitionModal.tsx` — `kind → flavor → tier → mode` Flow mit Bildern
- `LoanProfileModal.tsx` — symbolische Bilder pro Profil
- `CrowdfundSetupModal.tsx` + `CrowdfundCampaignCard.tsx`
- `RepairConfirmModal.tsx` / `SellConfirmModal.tsx`
- `RiskEventModal.tsx` / `ForeclosureModal.tsx`

### 7.7 Sektion-Akzent-Tokens

Pro Sektion ein **eigener Akzent-Token** als CSS-Custom-Property-Override im Sektion-Wrapper. Wir verwenden **vorhandene** Brand-Tokens (keine neuen Hex-Werte):

- Tourbus: `--section-accent: var(--color-toxic-green)`
- Studio: `--section-accent: var(--color-electric-blue)`
- Bandhaus: `--section-accent: var(--color-cosmic-purple)`
- Werkstatt: `--section-accent: var(--color-warning-yellow)`

(Token-Namen verifiziert gegen `src/utils/brandColors.ts`. Falls einer der genannten Tokens nicht existiert, Liste in Plan-Phase final abgleichen — keine neuen Hex-Werte einführen ohne expliziten Brand-Pass.)

## 8. Bildgenerierung

### 8.1 Komponente

`src/ui/shared/GeneratedImagePanel.tsx`:

```ts
interface GeneratedImagePanelProps {
  prompt: string
  alt: string
  aspectRatio?: '16:9' | '1:1' | '4:3' | '3:4' | '21:9'
  className?: string
  onLoad?: () => void
  variant?: 'card' | 'inline' | 'hotspot'
  seedOverride?: number       // siehe §8.4
  sizeHint?: { width: number; height: number }  // wird an Pollinations als Query-Param weitergereicht
}
```

Kapselt `resolveGenImageUrl`, Offline-Fallback (`getGeneratedImageFallbackUrl`), Loading-Skeleton (toxic-green Puls), Fade-In, Error-Fallback, brutalist Border/Shadow.

### 8.2 ModulePickerModal — Bild-Lade-Strategie

Bei 12–18 Modulen im Picker ist naives Laden aller Bilder zu teuer. Strategie:

1. **Virtual Scrolling via `react-window`** (oder bestehende Virtualisierungs-Komponente, falls vorhanden): nur sichtbare Modul-Karten rendern. Pool von 18 Modulen × Karten-Höhe ergibt typisch 6–8 sichtbar gleichzeitig
2. **Thumbnail-Größe** als Query-Parameter an Pollinations: `&width=256&height=256` für Modul-Thumbnails, größere Werte für Hero-Bilder. Wird durch `sizeHint`-Prop gesteuert
3. **`loading="lazy"`** als ergänzende HTML-Optimierung, nicht als Primärlösung
4. **Pollinations-Cache-Hit** durch deterministische URLs (§8.4)

### 8.3 Prompt-Helper (`src/utils/imageGen.ts`, additiv)

```ts
export const getChassisImagePrompt = (
  kind: AssetKind, flavor: AssetFlavor, tier: ChassisTier
): string

export const getModuleImagePrompt = (moduleId: string): string => {
  const module = MODULE_REGISTRY[moduleId]
  const promptKey = module?.imagePromptKey
  return promptKey
    ? MODULE_PROMPTS[promptKey] ?? defaultModulePrompt(moduleId)
    : defaultModulePrompt(moduleId)
}
const defaultModulePrompt = (id: string) =>
  `pixel art ${id.replace(/_/g, ' ')} dark moody toxic green accents`

export const getLoanProfileImagePrompt = (profileId: LoanProfileId): string
export const getCrowdfundImagePrompt = (
  kind: AssetKind, flavor: AssetFlavor
): string
export const getRiskEventImagePrompt = (eventType: RiskEventType): string
export const getSectionBackgroundPrompt = (
  kind: AssetKind, flavor: AssetFlavor
): string
export const getRepairImagePrompt = (
  kind: AssetKind, flavor: AssetFlavor, tier: ChassisTier, condition: number
): string => {
  const base = getChassisImagePrompt(kind, flavor, tier)
  if (condition < 20) return `${base} severely damaged broken`
  if (condition < 50) return `${base} damaged worn`
  return `${base} needs maintenance`
}
export const getTrailerImagePrompt = (flavor: AssetFlavor): string
```

`MODULE_PROMPTS: Record<string, string>` ist via `imagePromptKey` indexiert; mehrere Module dürfen denselben Key teilen (z.B. zwei Varianten desselben visuellen Designs). Ein Test stellt sicher, dass jeder `imagePromptKey` in `MODULE_PROMPTS` existiert.

### 8.4 Seed-Strategie

- Pollinations-URL standardmäßig mit `seed=666` (vorhandenes Pattern) → gleiche Prompts liefern gleiche Bilder, Server-Cache-Hits
- Pro-Modul-Unique-Variante via `seedOverride`-Prop: berechnete Seed `hashStringToInt(moduleId)`, falls visuelle Verwechslung mehrerer Module mit ähnlichem Prompt vermieden werden soll
- Default-Verhalten: globaler Seed (Cache-freundlich)

### 8.5 Bild-Stellen

| Komponente | Helper | Aspect |
|---|---|---|
| `TourbusVehicleView` Background | `getSectionBackgroundPrompt('tourbus_chassis', flavor)` | 16:9 |
| Tourbus Trailer-Overlay | `getTrailerImagePrompt(flavor)` | 16:9 |
| `StudioFloorplanView` Background | `getSectionBackgroundPrompt('studio_chassis', flavor)` | 4:3 |
| `BandhausCrossSectionView` Background | `getSectionBackgroundPrompt('bandhaus_chassis', flavor)` | 3:4 |
| `WorkshopProductionLineView` Background | `getSectionBackgroundPrompt('merch_workshop_chassis', flavor)` | 21:9 |
| Slot-Hotspot installiertes Modul | `getModuleImagePrompt(moduleId)` | 1:1 |
| `ModulePickerModal` pro Modul | `getModuleImagePrompt(moduleId)` | 1:1 |
| `ChassisAcquisitionModal` Tier-Vorschau | `getChassisImagePrompt(...)` | 16:9 |
| `LoanProfileModal` | `getLoanProfileImagePrompt(profileId)` | 1:1 |
| `CrowdfundSetupModal` | `getCrowdfundImagePrompt(...)` | 16:9 |
| `CrowdfundCampaignCard` | `getCrowdfundImagePrompt(...)` | 4:3 |
| `RepairConfirmModal` | `getRepairImagePrompt(...)` | 16:9 |
| `SellConfirmModal` | `getChassisImagePrompt(...)` | 16:9 |
| `RiskEventModal` | `getRiskEventImagePrompt(eventType)` | 16:9 |
| `ForeclosureModal` | `getRiskEventImagePrompt('foreclosure')` | 16:9 |

### 8.6 Crowdfund-Resolution — Formel-Template

Auswertung in `processCrowdfundTick` bei `daysRemaining === 0`. Formel-Template (Konstanten als Platzhalter):

```ts
const BASE_PROBABILITY = 0.30
const FAME_FACTOR = 0.40       // gewichtet fame / targetAmount-Ratio
const SCENE_FACTOR = 0.20      // gewichtet scenePresence / 100
const COST_PENALTY = 0.10      // pro 10k EUR Ziel
const MIN_P = 0.05
const MAX_P = 0.90

successProbability = clamp(
  BASE_PROBABILITY
  + (state.band.fame / Math.max(1, targetAmount / 100)) * FAME_FACTOR
  + (state.band.scenePresence / 100) * SCENE_FACTOR
  - (targetAmount / 10000) * COST_PENALTY,
  MIN_P, MAX_P
)
```

Resolution-Wert wird **beim START** der Kampagne deterministisch aus dem RNG-Stream gezogen (`outcomeRoll < successProbability`) und im State gespeichert (intern als versteckter Roll, separat vom `resolvedOutcome`-Field, in `crowdfundCampaigns[i].plannedSuccessRoll: number`). Damit ist Re-Load-Determinismus garantiert: ob die Kampagne gelingt, steht beim Start fest, nur die Auflösung wartet auf den Countdown.

(Konstanten und Formel-Form bewusst im Spec → Implementierung kann direkt loslegen, Balancing-Tuning später.)

## 9. Locale

Namespace `assets.*` in `public/locales/{en,de}/ui.json`:

```
assets.scene.title / .subtitle
assets.section.{tourbus|studio|bandhaus|workshop}.title / .description
assets.kind.{tourbus_chassis|studio_chassis|bandhaus_chassis|merch_workshop_chassis}
assets.flavor.{legit|diy}
assets.chassisTier.{1|2|3}
assets.mode.{cash|loan|crowdfund}
assets.slot.{<slotType>}                   // ein Eintrag pro SlotType
assets.module.{<moduleId>}.name
assets.module.{<moduleId>}.description
assets.module.unlock.fame                  // template "{{amount}}"
assets.module.unlock.money                 // template
assets.module.unlock.story                 // template "{{flag}}"
assets.module.unlock.skill                 // template "{{member}} {{skill}} tier {{tier}}"
assets.module.unlock.skillAny              // template "{{skill}} tier {{tier}}" (memberId fehlt)
assets.module.unlock.scene                 // template
assets.module.unlock.chassisTier           // template "{{tier}}"
assets.module.unlock.otherModule           // template "{{moduleName}}"
assets.module.conflict                     // template "{{otherName}}"

assets.modulePicker.noModulesAvailable
assets.modulePicker.lockedReason
assets.modulePicker.exclusivityConflict
assets.modulePicker.installCost            // template
assets.modulePicker.removeRefund           // template

assets.actions.{install|remove|purchase|upgrade|sell|repair}
assets.actions.upgradeConfirm
assets.actions.repairConfirm
assets.actions.sellConfirm
assets.actions.removeModuleConfirm

assets.condition.{good|warning|broken}

assets.loan.profile.{shortTerm|mediumTerm|longTerm|loanShark|coop}
assets.loan.dailyPayment                   // template "{{amount}}"
assets.loan.defaultWarning                 // template "{{daysLeft}}"

assets.liability.paymentDue                // template
assets.liability.foreclosureNotice
assets.liability.amortizationSchedule

assets.crowdfund.{setup|success|fail|fameStake}

assets.risk.event.{eviction|fire|theft|police_check|copyright_strike|raid|scam_or_bust|paranormal}
assets.foreclosure

assets.purchaseFailed.diy_loan_not_allowed
assets.purchaseFailed.insufficient_funds
assets.purchaseFailed.liability_exceeds_value
```

**Regeln**
- Modul-Namen/-Beschreibungen vollständig in Subkeys lokalisiert
- EN + DE simultan; CI-Lauf via `i18n-consistency-checker`-Skill nach Implementierung
- Currency immer via `formatCurrency(value, i18n.language, signDisplay)`
- Toast-Optionen werden bei Dispatch via `i18n.language` gebaket
- Skill-Unlock-Display: wenn `memberId` gesetzt → `assets.module.unlock.skill`; wenn nicht → `assets.module.unlock.skillAny`

## 10. Tests

**node:test** (`tests/node/`)
- `assetsReducer.test.js` — `PURCHASE_CHASSIS` alle 3 modes; `PURCHASE_CHASSIS_FAILED` bei DIY+loan; `INSTALL_MODULE`-Validierung (Slot-Typ-Mismatch, gelocktes Modul, Exclusivity, maxPerAsset); `REMOVE_MODULE` mit Refund
- `assetModuleRegistry.test.js` — jedes Modul hat `imagePromptKey` mit Eintrag in `MODULE_PROMPTS`; jedes Modul referenziert gültigen `SlotType`; kein Modul mit `slotType === addsSlots[i].slotType` (Anti-Stacking-Test)
- `assetTicks.test.js` — `processAssetTick` Determinismus; condition-Decay; condition floor (>=0); condition<20 neutralisiert Boni
- `assetSelectors.test.js` — `isModuleUnlocked` deckt alle Unlock-Felder; `getSlotConflicts`; `getActiveAssetModifiers` mit leerem Array → `NEUTRAL_ASSET_MODIFIERS`; `getAssetTotalUpkeep`, `getAssetTotalDailyRevenue`, `getTotalDailyObligations`
- `liabilitiesAmortization.test.js` — Tilgungsrechnung; Default-Counter; Foreclosure; Edge-Cases: termDaysRemaining=0, negative Zahlungs-Payloads (Sanitization), interest-only Spezialfall (nicht im Default-Profil, aber wenn `interestRate > 0 && principalRemaining` sehr hoch)
- `bankruptcyWithLiabilities.test.js` — `shouldTriggerBankruptcy` mit Liabilities + Asset-Upkeep + Asset-Revenue: Netto-Effekt korrekt
- `upgradeChassisTier.test.js` — Tier-Upgrade fügt Slots additiv hinzu, bestehende Module bleiben, condition bleibt, Kosten korrekt
- `dynamicSlotAddition.test.js` — `addsSlots` von Trailer-Hitch fügt 2 Addon-Slots hinzu (mit aus Payload gegebenen IDs); `REMOVE_MODULE` entfernt die Addon-Slots wieder (samt Modulen darin, mit Refund)
- `assetPayloadSanitization.test.js` — Prototyp-Keys gestrippt; `NaN`/`Infinity` via `finiteNumberOr`; referenzielle Integrität (orphan Liability, ungültige `addedByModuleId`, Slot-Modul-Typ-Mismatch); doppelte `moduleId` auf einem Asset wird auf eine reduziert
- `crowdfundResolution.test.js` — `plannedSuccessRoll` deterministisch; Re-Load → gleiches Ergebnis; Fame-Stake-Abzug bei Fail; Geld+Asset-Erstellung bei Success; Eintrag nach Resolution entfernt
- `crowdfundProbabilityFormula.test.js` — Formel-Template liefert clamped Werte, dokumentiert die Konstanten
- `assetImagePrompts.test.js` — `getModuleImagePrompt(id)` nicht-leer für alle Modul-IDs; offline → fallback; `getRepairImagePrompt` reagiert auf condition-Bänder; `imagePromptKey` ist in `MODULE_PROMPTS` definiert
- `playwright-screenshot-fixture-validation.test.js` — `BASE_STATE` enthält neue Felder inkl. `rngSeed`

**Vitest** (`tests/ui/`)
- `AssetsScene.test.tsx` — Tab-Wechsel, Top-Bar aggregiert über Assets
- `TourbusVehicleView.test.tsx` — Hotspot-Positionierung, Klick öffnet Picker, Trailer-Overlay erscheint wenn Hitch installiert
- `StudioFloorplanView.test.tsx`, `BandhausCrossSectionView.test.tsx`, `WorkshopProductionLineView.test.tsx` — Klick-Mapping
- `ModulePickerModal.test.tsx` — gelockte Module disabled mit reason; Exclusivity-Konflikt verhindert Install; Flavor-Mix erlaubt (legit-Modul auf DIY-Chassis und umgekehrt sind sichtbar)
- `GeneratedImagePanel.test.tsx` — Online/Offline, Error-Fallback, ARIA-alt, gleicher Prompt → gleiche URL (Seed-Determinismus), `sizeHint` wird an URL angehängt
- `ChassisAcquisitionModal.test.tsx` — Flow, DIY+Loan-Kombination ist im UI deaktiviert (zweite Verteidigungslinie)
- `i18next`-Mocks inkl. `initReactI18next: { type: '3rdParty', init: () => {} }`

**Golden-Path-Erweiterung**: zwei Varianten zum bestehenden Cycle-Test:
1. "Loan-Pfad": Spieler nimmt Loan auf Chassis, installiert Module, voller Spielzyklus, Tilgung läuft, kein Bankrott
2. "Crowdfund-Pfad": Spieler startet Crowdfund, Kampagne wartet, Resolution bei `daysRemaining=0`, Asset erscheint im State
3. "Risk-Event-Pfad": DIY-Modul installiert, RNG-Stream so vorbereitet, dass Risk-Event triggert, `ASSET_RISK_EVENT_TRIGGERED` wird dispatched, State korrekt
4. "Trailer-Stacking": `tb_trailer_hitch` installieren, 2 Addon-Slots erscheinen, ein Addon-Modul installieren, zweites Trailer-Hitch versuchen → `INSTALL_MODULE_FAILED` (maxPerAsset)

**Performance-Validierung** (manuell oder via Lighthouse-Skript): `ModulePickerModal`-Open-Speed mit 16 Thumbnails; Hub-Tab-Wechsel-Latenz; Memory unter wiederholtem Öffnen/Schließen.

## 11. Migration

- Saves ohne `assets`/`liabilities`/`crowdfundCampaigns` → Sanitizer setzt `[]`
- Saves ohne `rngSeed` → Sanitizer initialisiert mit `Date.now()` (einmaliger Default)
- Keine Schema-Version-Bump nötig (additive Felder)
- `createInitialState` initialisiert die drei Arrays leer und setzt `rngSeed`

## 12. Risiken & Offene Punkte

- **Balancing**: konkrete Preise/Boni/Konstanten sind Platzhalter
- **Brand-Token-Abgleich**: in §7.7 verwendete Tokens müssen in `brandColors.ts` existieren — vor Implementierung verifizieren, sonst auf vorhandene Tokens mappen
- **Bildlade-Volumen**: trotz Virtual Scrolling und Cache-Hit-Strategie sollte das `ModulePickerModal`-Verhalten beobachtet werden
- **Crowdfund-Konstanten**: Formel-Form steht, die Konstanten brauchen Balancing
- **Slot-Position-Daten**: pro Sektion gegen das Background-Bild ausgerichtet → Iteration nach erstem visuellen Test wahrscheinlich
- **`react-window`-Verfügbarkeit**: falls nicht im Repo, vor Implementierung mit `dependency-pin-upgrade-blocker`-Skill abstimmen; alternativ einfache progressive Loading-Strategie (erste 6, dann scrollen)

## 13. Implementierungs-Reihenfolge

1. Typen, `CHASSIS_CONFIG`, `MODULE_REGISTRY`, `MODULE_PROMPTS`, `loanProfiles`
2. Sanitizer + State-Init + `BASE_STATE`-Fixture
2.5. Migration-Test: alte Saves laden mit leeren Arrays
3. Action-Types + Action-Creators (inkl. Install-Validierung und ID-Generation)
4. Reducer + Tick-Funktionen + Selektoren + RNG-Stream
4.5. Sanitization-Verification: Sanitizer gegen korrupte Test-Daten
5. Economy-Engine-Erweiterung (`calculateFuelCost`, `calculateMerchIncome`, `calculateGigFinancials`, Song- und Training-Kosten-Funktionen)
6. `GeneratedImagePanel` + Prompt-Helper + Seed-Strategie
7. `AssetsScene` Hub + Tab-Routing
7.5. Locale-Struktur (EN + DE, Asset-Grundkeys, ohne Modul-IDs)
8. Vier Sektion-Views (Tourbus zuerst als Referenz)
9. Gemeinsame Modale (`ModulePickerModal`, `ChassisAcquisitionModal`, etc.)
10. Locale-Vervollständigung (alle Modul-IDs, alle Unlock-Templates)
10.5. `i18n-consistency-checker`-Lauf, EN/DE-Parität
11. Tests (Action-Creators → Reducer → Selektoren → Views → Modale)
12. Golden-Path-Test-Erweiterung (Loan, Crowdfund, Risk-Event, Trailer-Stacking)
13. Performance-Validierung (Modul-Picker-Open, Hub-Tab-Wechsel)
