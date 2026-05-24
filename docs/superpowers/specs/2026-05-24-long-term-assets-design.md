# Long-Term Assets — Design Spec

**Date:** 2026-05-24
**Branch:** `claude/sweet-bardeen-PEog8`
**Status:** Draft for review (revised — chassis + modules architecture)

## 1. Goal

Erweitere die Wirtschaftssimulation um ein System für strategische Langzeit-Investitionen. Spieler erwerben **Chassis** in vier Asset-Kategorien (Tourbus, Studio, Bandhaus, Merch-Werkstatt). Jedes Chassis besitzt **Slots**, in die der Spieler **Module** aus einem deutlich größeren Pool einsetzt. Slot-Anzahl < Pool-Größe → echte strategische Auswahl. Module sind durch Bandstatus (Fame, Geld, Story-Flags, Member-Skills, Szene-Standing) gegated.

Erwerb funktioniert über drei Pfade (Cash, Kredit, Crowdfunding). Eine `legit`/`diy`-Achse existiert sowohl auf Chassis- als auch Modul-Ebene und bietet echte Risiko-/Reward-Trade-offs.

Jede der vier Sektionen bekommt ein **eigenständiges visuelles Design** (Vehikel-Silhouette, Studio-Top-Down, Bandhaus-Querschnitt, Werkstatt-Förderband). Alle neuen UI-Elemente nutzen die vorhandene Pollinations-Bildgenerierung (`src/utils/imageGen.ts`); jedes Modul, jedes Chassis und jedes Entscheidungs-Modal hat ein generiertes Bild.

## 2. Scope

**In Scope**
- Vier Asset-Kategorien (Tourbus, Studio, Bandhaus/Rehearsal, Merch-Werkstatt)
- Chassis mit 3 Tiers → bestimmt Slot-Anzahl und -Typen
- Modul-Pool pro Kategorie (12–18 Module pro Sektion)
- Modul-Slot-Typen, Slot-Kompatibilität, `exclusiveWithGroup`
- Modul-Unlock-Bedingungen (Fame, Geld, Story-Flags, Member-Skills, Szene-Standing)
- Drei Erwerbsmodi pro Chassis: `cash`, `loan`, `crowdfund`
- Modul-Erwerb separat von Chassis (immer Cash, kleiner Betrag)
- `legit`/`diy` auf Chassis- und Modul-Ebene
- Tägliche Tick-Logik: Verfall, Cashflow, Tilgung, Risiko-Events
- Vier Top-Level-Szenen oder eine `ASSETS`-Szene mit vier sektion-spezifischen Sub-Layouts (siehe §7)
- Bildgenerierung für alle Chassis, alle Module, alle Entscheidungs-Modale
- `shouldTriggerBankruptcy`-Erweiterung um Verbindlichkeiten

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

Definitionen in `src/types/assets.d.ts`:

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
// Validierung: ein Modul passt nur in Slots mit passendem slotType.
export type SlotType =
  // Tourbus
  | 'tb_roof' | 'tb_front' | 'tb_side' | 'tb_interior_driver'
  | 'tb_interior_cabin' | 'tb_audio' | 'tb_decal' | 'tb_trailer'
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
  position: { x: number; y: number }   // 0..1 normalisiert, sektion-spezifisches Visual
  installedModuleId: string | null
  addedByModuleId?: string             // wenn der Slot durch ein Modul hinzugefügt wurde (z.B. Anhänger)
}

export interface AssetBoni {
  // Cashflow-Boni
  baseDailyRevenueDelta?: number
  upkeepDelta?: number
  // Multiplikative Boni (default 1.0)
  fuelMultiplier?: number
  merchCostMultiplier?: number
  songCostMultiplier?: number
  trainingCostMultiplier?: number
  // Additive Boni
  staminaRegenBonusPerDay?: number
  travelStaminaRegen?: number
  merchCapacityBonus?: number
  songQualityBonus?: number
  avgMerchSalePriceBonus?: number      // multiplikativ als +X%
  famePassivePerDay?: number
  bandMoodPerDay?: number
  tipBonusGigs?: number
  // Flags
  infightingDamper?: boolean
  enablesReRecording?: boolean
  enablesLimitedEditions?: boolean
  enablesBulkProduction?: boolean
  // Risiko-Modifier
  diyRiskMultiplier?: number           // 1.0 default, >1 erhöht Risiko, <1 senkt
}

export interface ModuleUnlockReq {
  minFame?: number
  minMoney?: number
  minScenePresence?: number
  requiredStoryFlags?: string[]
  requiredMemberSkill?: {
    memberId?: string                  // optional: jedes Member mit Skill genügt
    skill: string
    tier: number
  }
  requiredAssetUnlocked?: AssetKind
  requiredOtherModuleInstalled?: string
}

export interface AssetModule {
  id: string                            // stabil, lower_snake, z.B. 'tb_solar_panel'
  ownerKind: AssetKind
  slotType: SlotType                    // welcher Slot-Typ akzeptiert dieses Modul
  flavor: AssetFlavor
  cost: number                          // Materialkosten (immer Cash)
  installCost: number                   // einmaliger Installationsaufwand
  removalRefundFraction: number         // 0..1, beim Ausbau zurückerstattet
  boni: AssetBoni
  unlock: ModuleUnlockReq
  exclusiveWithGroup?: string           // shared key → Module gleichen Schlüssels schließen sich aus
  addsSlots?: Array<{ slotType: SlotType; count: number }>  // z.B. Anhänger fügt Trailer-Slots hinzu
  riskEventTypes?: RiskEventType[]      // welche Events diese Modul-Auswahl auslösen kann
  imagePromptKey: string                // → IMG_PROMPTS / Helper
}

export interface LongTermAsset {
  id: string
  kind: AssetKind
  chassisFlavor: AssetFlavor
  chassisTier: ChassisTier
  condition: number                     // 0..100
  baseUpkeep: number                    // EUR/Tag, ohne Modul-Anpassungen
  baseDailyRevenue: number              // EUR/Tag, ohne Modul-Anpassungen
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
  resolvedOutcome: 'success' | 'fail'
}

export type RiskEventType =
  | 'eviction' | 'fire' | 'theft' | 'police_check'
  | 'copyright_strike' | 'raid' | 'scam_or_bust' | 'paranormal'
  | 'foreclosure'
```

**Sanitization** (`sanitizeAssets` etc. in `systemReducer.ts`):
- Alle Zahlen via `finiteNumberOr(value, fallback)`
- Unbekannte `kind`/`flavor`/`slotType`/`source`/`acquisitionMode` → Eintrag verwerfen
- Slots werden gegen die Chassis-Konfig validiert; unbekannte Slot-IDs werden entfernt
- `installedModuleId` wird gegen `MODULE_REGISTRY` validiert; passt das Modul nicht zum `slotType` → auf `null` zurückgesetzt
- `condition` mit neuem `clampCondition`-Helper auf 0..100
- Prototyp-Keys via `Object.hasOwn`
- `BASE_STATE` (Playwright-Fixture) bekommt `assets:[], liabilities:[], crowdfundCampaigns:[]`

## 4. Konfiguration

### 4.1 Chassis-Konfig (`src/utils/assetConfig.ts`)

```ts
export const CHASSIS_CONFIG = {
  tourbus_chassis: {
    legit: {
      1: { price: 4000, upkeep: 20, revenue: 0, slots: ['tb_roof','tb_front','tb_interior_driver','tb_audio'], baseRiskEventChance: 0.005 },
      2: { price: 9000, upkeep: 35, revenue: 0, slots: [...t1, 'tb_side','tb_interior_cabin'], baseRiskEventChance: 0.005 },
      3: { price: 18000, upkeep: 55, revenue: 0, slots: [...t2, 'tb_decal','tb_trailer'], baseRiskEventChance: 0.005 },
    },
    diy: { /* price 0.5×, upkeep 0.7×, baseRiskEventChance 0.03 */ },
  },
  studio_chassis: { ... },
  bandhaus_chassis: { ... },
  merch_workshop_chassis: { ... },
} as const satisfies Record<AssetKind, ChassisKindConfig>
```

Slot-Anzahlen pro Tier:
- Tourbus: 4 / 6 / 8
- Studio: 3 / 5 / 8
- Bandhaus: 3 / 5 / 8
- Merch-Werkstatt: 3 / 5 / 8

(Konkrete Zahlen sind Platzhalter, Balancing-Pass nach Implementierung.)

### 4.2 Modul-Pool — Tourbus

| ID | Slot | Flavor | Effekt | Unlock |
|---|---|---|---|---|
| `tb_solar_panel` | tb_roof | legit | `fuelMultiplier 0.85` | `minFame: 30` |
| `tb_roof_rack` | tb_roof | legit | `merchCapacityBonus 30` | — |
| `tb_subwoofer_stack` | tb_audio | diy | `tipBonusGigs 0.10` | `minFame: 20`, `exclusiveWithGroup: 'tb_power_hog'` |
| `tb_vintage_stereo` | tb_audio | legit | `bandMoodPerDay 2` | `storyFlag: 'found_record_collection'` |
| `tb_alloy_rims` | tb_decal | legit | `famePassivePerDay 0.5` | `minMoney: 1500` |
| `tb_fox_tail` | tb_decal | diy | `famePassivePerDay 0.2` | `minFame: 10` |
| `tb_neon_underglow` | tb_decal | diy | `famePassivePerDay 0.4` | `storyFlag: 'underground_show'` |
| `tb_racing_seats` | tb_interior_driver | legit | `staminaRegenBonusPerDay 3` (Driver) | — |
| `tb_sleeping_bunks` | tb_interior_cabin | legit | `travelStaminaRegen 5` | `chassisTier >= 2` |
| `tb_mini_fridge` | tb_interior_cabin | legit | `bandMoodPerDay 1` | `minMoney: 600` |
| `tb_espresso_machine` | tb_interior_cabin | legit | `travelStaminaRegen 3` | `memberSkill: { skill:'barista', tier:1 }` |
| `tb_cb_radio_mesh` | tb_front | legit | `fuelMultiplier 0.95` (Routenoptimierung) | `memberSkill: { skill:'tech', tier:1 }` |
| `tb_gps_jammer` | tb_front | diy | `diyRiskMultiplier 0.5` für Polizei-Events | `memberSkill: { skill:'tech', tier:3 }` |
| `tb_trailer_hitch` | tb_trailer | legit | `addsSlots:[{slotType:'tb_trailer',count:2}]`, `merchCapacityBonus 50` | `minFame: 40`, `chassisTier:3` |
| `tb_fake_police_lights` | tb_front | diy | `tipBonusGigs 0.05`, `riskEventTypes:['police_check']` (++) | `flavor:diy`, `minFame: 30` |
| `tb_smoke_screen` | tb_front | diy | senkt theft-Risiko während Reise | `memberSkill: { skill:'tech', tier:2 }` |

(15 Module für 4–8 Slots → strikter Mangel auf Tier 1)

### 4.3 Modul-Pool — Studio

| ID | Slot | Flavor | Effekt | Unlock |
|---|---|---|---|---|
| `st_ssl_console` | st_control | legit | `songQualityBonus 0.20`, `cost: hoch` | `minMoney: 8000` |
| `st_diy_mixer` | st_control | diy | `songCostMultiplier 0.80` | — |
| `st_u87_mic` | st_mic | legit | `songQualityBonus 0.08` | `minFame: 25` |
| `st_dynamic_workhorse_mic` | st_mic | legit | `songCostMultiplier 0.92` | — |
| `st_stolen_russian_compressors` | st_outboard | diy | `songQualityBonus 0.10`, `riskEventTypes:['police_check']` | `memberSkill: { skill:'tech', tier:2 }` |
| `st_tape_echo_handbuilt` | st_outboard | diy | `songQualityBonus 0.06` | `memberSkill: { skill:'tech', tier:2 }` |
| `st_ns10_monitors` | st_monitoring | legit | `songQualityBonus 0.05` | — |
| `st_auralex_treatment` | st_treatment | legit | `songCostMultiplier 0.95` | `minMoney: 1200` |
| `st_haunted_reverb_chamber` | st_treatment | diy | `songQualityBonus 0.12`, `riskEventTypes:['paranormal']` | `storyFlag: 'old_basement_secret'` |
| `st_pro_tools_hd` | st_software | legit | `enablesReRecording true` | `minMoney: 3500` |
| `st_cracked_daw_bundle` | st_software | diy | `songCostMultiplier 0.50`, `riskEventTypes:['copyright_strike']` | — |
| `st_iso_booth` | st_iso | legit | `songQualityBonus 0.06` | `chassisTier >= 3` |
| `st_vintage_synth_corner` | st_vibe | legit | `songQualityBonus 0.05` | `minFame: 50` |
| `st_lava_lamp_beer_fridge` | st_vibe | diy | `bandMoodPerDay 1` | — |

(14 Module für 3–8 Slots)

### 4.4 Modul-Pool — Bandhaus

| ID | Slot | Flavor | Effekt | Unlock |
|---|---|---|---|---|
| `bh_pro_pa_system` | bh_stage | legit | `trainingCostMultiplier 0.85` | `minMoney: 2200` |
| `bh_salvaged_pa` | bh_stage | diy | `trainingCostMultiplier 0.95` | — |
| `bh_soundproofing` | bh_stage | legit | `infightingDamper true` (Nachbarn ruhig) | — |
| `bh_bunk_beds` | bh_sleeping | legit | `staminaRegenBonusPerDay 3` | — |
| `bh_stocked_kitchen` | bh_kitchen | legit | `staminaRegenBonusPerDay 2`, `bandMoodPerDay 1` | `minMoney: 800` |
| `bh_weed_garden` | bh_backyard | diy | `bandMoodPerDay 2`, `riskEventTypes:['raid']` | — |
| `bh_bouncer_dog` | bh_security | legit | reduziert `baseRiskEventChance` ×0.5 | `minFame: 40` |
| `bh_security_cam_mesh` | bh_security | legit | reduziert theft-Risiko | `minMoney: 800` |
| `bh_wall_mural` | bh_identity | legit | `famePassivePerDay 0.5` | `storyFlag: 'saved_local_venue'` |
| `bh_basement_bar` | bh_lounge | legit | `baseDailyRevenueDelta 25` | `minFame: 60` |
| `bh_hot_tub` | bh_lounge | legit | `bandMoodPerDay 2`, `infightingDamper true` | `minMoney: 4000` |
| `bh_art_sublet` | bh_identity | legit | `baseDailyRevenueDelta 35` | `minFame: 30`, `minScenePresence: 25` |
| `bh_zine_library` | bh_lounge | diy | `bandMoodPerDay 0.5`, `famePassivePerDay 0.1` | — |
| `bh_vinyl_press_corner` | bh_secret | diy | `merchCapacityBonus 50`, `baseDailyRevenueDelta 20` | `minFame: 70` |
| `bh_pirate_radio_antenna` | bh_secret | diy | `famePassivePerDay 1.0`, `riskEventTypes:['police_check']` | `memberSkill: { skill:'tech', tier:2 }` |
| `bh_squat_dog` | bh_security | diy | reduziert `baseRiskEventChance` ×0.7, free | `chassisFlavor: 'diy'` |

(16 Module für 3–8 Slots)

### 4.5 Modul-Pool — Merch-Werkstatt

| ID | Slot | Flavor | Effekt | Unlock |
|---|---|---|---|---|
| `mw_4color_carousel` | mw_print | legit | `merchCostMultiplier 0.75` | `minMoney: 3500` |
| `mw_manual_press` | mw_print | diy | `merchCostMultiplier 0.90` | — |
| `mw_eco_ink_supply` | mw_print | legit | `avgMerchSalePriceBonus 0.03`, modul-buff | `minScenePresence: 40` |
| `mw_conveyor_dryer` | mw_drying | legit | `merchCapacityBonus 30` | `minMoney: 1500` |
| `mw_heat_press_box` | mw_drying | diy | `merchCostMultiplier 0.95` | — |
| `mw_vinyl_cutter` | mw_cutting | legit | `enablesLimitedEditions true` | `minMoney: 1200` |
| `mw_embroidery_machine` | mw_cutting | legit | `avgMerchSalePriceBonus 0.05` | `minFame: 30` |
| `mw_badge_press` | mw_specialty | legit | `avgMerchSalePriceBonus 0.03` | — |
| `mw_hot_foil_station` | mw_specialty | legit | `avgMerchSalePriceBonus 0.10`, luxury LE | `minFame: 50` |
| `mw_cassette_dubber` | mw_specialty | diy | `baseDailyRevenueDelta 20` | `storyFlag: 'tape_culture_revival'` |
| `mw_sticker_bot` | mw_specialty | legit | `baseDailyRevenueDelta 10` | — |
| `mw_storage_racks` | mw_storage | legit | `merchCapacityBonus 60` | — |
| `mw_mailorder_script` | mw_automation | legit | `baseDailyRevenueDelta 30` | `memberSkill: { skill:'tech', tier:1 }` |
| `mw_bandcamp_bot` | mw_sales | legit | `baseDailyRevenueDelta 25` | `minFame: 20` |
| `mw_darkweb_vendor` | mw_sales | diy | `baseDailyRevenueDelta 50`, `riskEventTypes:['scam_or_bust','police_check']` | `memberSkill: { skill:'tech', tier:3 }` |
| `mw_hype_drop_machine` | mw_automation | legit | `avgMerchSalePriceBonus 0.08` an Gig-Tagen | `minFame: 70` |

(16 Module für 3–8 Slots)

Alle Module leben in `MODULE_REGISTRY: Record<string, AssetModule>` in `src/utils/assetModuleRegistry.ts`, eingefroren via `as const satisfies`.

### 4.6 Loan-Profile

`src/utils/loanProfiles.ts` — `shortTerm` / `mediumTerm` / `longTerm` / `loanShark` / `coop`. DIY-Chassis können nur über `cash` oder `crowdfund` erworben werden.

## 5. Reducer-Integration

**Neue Action-Types** in `actionTypes.ts`:
- `PURCHASE_CHASSIS`
- `UPGRADE_CHASSIS_TIER`
- `SELL_CHASSIS`
- `REPAIR_CHASSIS`
- `INSTALL_MODULE` (payload: `{ assetId, slotId, moduleId }`)
- `REMOVE_MODULE` (payload: `{ assetId, slotId }`)
- `START_CROWDFUND` / `RESOLVE_CROWDFUND`
- `ASSET_FORECLOSED`
- `ASSET_RISK_EVENT_TRIGGERED`
- `LIABILITY_PAYMENT_TICK` / `ASSET_TICK` (intern, vom advanceDay)

**Action-Creators** in `assetActionCreators.ts`:
- Normalisieren Payloads via `finiteNumberOr`
- Strippen Prototyp-Keys via `Object.hasOwn`
- Validieren: `kind`/`flavor`/`slotType` gegen Konfig
- DIY-Chassis + loan → `null`
- `INSTALL_MODULE` prüft: Modul existiert, `slotType` passt, Slot existiert auf dem Chassis, Unlock erfüllt, kein `exclusiveWithGroup`-Konflikt mit anderem installierten Modul
- Returnen `Extract<GameAction, { type: typeof ActionTypes.X }>`

**Reducer** `src/context/reducers/assetReducer.ts`, eingehängt in `gameReducer.ts`. `assertNever(action as never)`.

**advanceDay-Komposition** (vor Bankrott-Check):
```
state' = processAssetTick(state)              // condition decay, Modul-aggregierter Cashflow
state' = processLiabilityTick(state')         // Tilgung, default-Counter, Foreclosure
state' = processCrowdfundTick(state')         // daysRemaining--, resolve bei 0
state' = rollAssetRiskEvents(state', rng)     // Modul-getriggerte Risk-Events
state' = applyBankruptcyCheck(state')         // existing, jetzt mit liabilities
```

Alle Sub-Ticks: reine Funktionen in `src/utils/assetTicks.ts`.

**`shouldTriggerBankruptcy`-Erweiterung**: `totalDailyObligations = guaranteedDailyCost + sum(liabilities.dailyPayment)`.

**Lifecycle**
- `START_GIG`: assets/liabilities/crowdfundCampaigns unverändert
- `RESET_GAME`: alle drei auf `[]`
- `condition < 20`: aggregierter Boni-Wert wird im Selector auf neutrale Defaults gemappt
- `condition === 0`: dispatch `ASSET_FORECLOSED`

## 6. Selektor-Layer

`src/utils/assetSelectors.ts` (memoisiert):

```ts
export function getInstalledModules(asset: LongTermAsset): AssetModule[]
export function getAssetAggregateBoni(asset: LongTermAsset): AssetBoni
export function getActiveAssetModifiers(assets: LongTermAsset[]): AssetModifiers
export function isModuleUnlocked(module: AssetModule, state: GameState): boolean
export function getModulePoolForAsset(asset: LongTermAsset, state: GameState):
  Array<{ module: AssetModule; unlocked: boolean; reason?: string }>
export function getSlotConflicts(asset: LongTermAsset, moduleId: string):
  { canInstall: boolean; conflictingModuleIds: string[] }
```

`AssetModifiers` aggregiert multiplikative Boni multiplikativ, additive additiv, Flags ge-`OR`-t. Module mit Asset-condition < 20 werden ignoriert.

Bestehende Economy-Funktionen nehmen `AssetModifiers` als optionalen Parameter (Default = neutrale Identität).

## 7. UI — Vier Sektion-Eigenständige Layouts

Eine neue Top-Level-Szene `ASSETS` als Hub mit vier Tabs. Jeder Tab rendert ein **eigenständiges Visual** für seine Asset-Kategorie. Statt einer einheitlichen Karten-Liste bekommt jede Sektion ihre eigene Metapher — das macht das Spielgefühl pro Bereich unique.

### 7.1 Gemeinsame Hub-Szene
- Komponente: `AssetsScene.tsx` in `src/components/assets/`
- Top-Bar: Liquidität, Netto-Cashflow, Schulden-Total (i18n + `formatCurrency`)
- Tab-Leiste mit vier Sektion-Icons: 🚐 Tourbus · 🎚 Studio · 🏠 Bandhaus · 👕 Werkstatt
- Aktiver Tab rendert die jeweilige Sektion-View

### 7.2 Tourbus — Seitenansicht-Vehikel mit Hotspots

- Komponente: `TourbusSection.tsx`, `TourbusVehicleView.tsx`
- Layout: großes generiertes Bild des Vans in Seitenansicht (16:9), darüber absolut positionierte **Slot-Hotspots** (CSS `top/left` aus `slot.position`)
- Leerer Slot: pulsierender toxic-green Outline-Kreis mit `+`
- Befüllter Slot: Mini-Bild des Moduls (1:1, 64×64) als Inset
- Klick auf Slot öffnet `ModulePickerModal` für diesen `slotType`
- Sub-Panels neben dem Vehikel: aktuelle Tier, Condition-Bar, Aggregat-Boni-Übersicht, Tier-Upgrade-Button
- Spezialfall Anhänger: wenn `tb_trailer_hitch` installiert, wird das Bild dynamisch um einen angekoppelten Trailer mit zwei zusätzlichen Hotspots erweitert (zweites generiertes Bild)

### 7.3 Studio — Isometrischer Top-Down

- Komponente: `StudioSection.tsx`, `StudioFloorplanView.tsx`
- Layout: isometrisches Studio-Layout (4:3 generiertes Background), Slots als **Zonen** mit gelb-grün gestrichelter Border-Markierung
- Slot-Zonen: Mixing Console (zentral), Mic Locker (Wand), Monitoring (vor Console), Outboard Rack (Seite), Treatment (Wandflächen), Software (PC-Ecke), Vibe (freie Ecke), Iso Booth (separater abgetrennter Bereich nur ab Tier 3)
- Befüllt: Modul-Bild ersetzt die Zonen-Markierung
- Visuelle Identität: gedämpftes Studio-Lighting-Theme, warme Akzente
- Klick auf Zone → `ModulePickerModal`

### 7.4 Bandhaus — Dollhouse-Querschnitt

- Komponente: `BandhausSection.tsx`, `BandhausCrossSectionView.tsx`
- Layout: vertikaler Häuser-Querschnitt (3:4 oder 4:3 hochkant), drei Etagen sichtbar, Räume durch Wände getrennt
- Räume = Slots: Stage (Erdgeschoss links), Kitchen (EG rechts), Lounge (EG Mitte), Sleeping (OG), Backyard (rechts außen mit kleinem Garten-Ausschnitt), Security (Vorgarten/Tür), Identity (Hausfront/Mural-Fläche), Secret Room (Keller, nur ab Tier 3 sichtbar)
- Befüllte Räume: Modul-Illustration füllt den Raum
- Visuelle Identität: warme Wohnraum-Farben + Punk-Graffiti-Akzente, Mural-Modul rendert als Fassaden-Bild über der ganzen Hausfront
- Klick auf Raum → `ModulePickerModal`

### 7.5 Merch-Werkstatt — Förderband-Seitenansicht

- Komponente: `MerchWorkshopSection.tsx`, `WorkshopProductionLineView.tsx`
- Layout: horizontale Produktionslinie (21:9 oder breit), Module als **Stationen** entlang eines Förderbands
- Stationen von links nach rechts: Print → Drying → Cutting → Packaging → Storage. Vertikal angeflanscht: Specialty (oben), Automation (Bot-Konsole), Sales (Versand-Tor)
- Befüllt: Maschinen-Bild ersetzt leeren Platz, animierte Förderband-Linie zeigt Workflow
- Visuelle Identität: Industrie-Vibes, Druckfarben-Spritzer als Dekor, Acid-grüne Tinte
- Klick auf Station → `ModulePickerModal`

### 7.6 Gemeinsame Modale

- `ModulePickerModal.tsx` — kontext-sensitiv pro `slotType`. Zeigt:
  - Pool aller Module für diesen Slot-Typ
  - Unlocked vs gelockt (gelockt mit Reason-Text aus `unlock`-Feld)
  - `exclusiveWithGroup`-Konflikte explizit markiert
  - Für jedes Modul: generiertes Bild, Effekt-Liste, Kosten
- `ChassisAcquisitionModal.tsx` — `kind → flavor → tier → mode` Flow (Bilder bei jeder Stufe)
- `LoanProfileModal.tsx` — symbolische Bilder pro Profil (Bank / Hai / Genossenschaft)
- `CrowdfundSetupModal.tsx` + `CrowdfundCampaignCard.tsx` — Pitch-Bild
- `RepairConfirmModal.tsx` / `SellConfirmModal.tsx` — Asset-Bild
- `RiskEventModal.tsx` — Event-spezifisches Bild
- `ForeclosureModal.tsx`

**Styling**: Brutalist über Tailwind v4. Pro Sektion ein **eigenes Akzent-Token** als Override im Sektion-Wrapper:
- Tourbus: `--section-accent: var(--color-toxic-green)` (Standard)
- Studio: `--section-accent: var(--color-electric-violet)` (neuer Brand-Token, falls fehlt → in `brandColors.ts` ergänzen)
- Bandhaus: `--section-accent: var(--color-warm-orange)` (ggf. neu)
- Werkstatt: `--section-accent: var(--color-acid-yellow)` (ggf. neu)

Komponenten verwenden `var(--section-accent)` für Borders/Highlights, die übrigen Tokens unverändert. Neue Brand-Tokens müssen in `BRAND_COLOR_HEX` (`src/utils/brandColors.ts`) als `--name` UND `--color-name` eingetragen werden (gemäß CLAUDE.md).

## 8. Bildgenerierung

**Neue gemeinsame Komponente** `src/ui/shared/GeneratedImagePanel.tsx`:

```ts
interface GeneratedImagePanelProps {
  prompt: string
  alt: string
  aspectRatio?: '16:9' | '1:1' | '4:3' | '3:4' | '21:9'
  className?: string
  onLoad?: () => void
  variant?: 'card' | 'inline' | 'hotspot'   // visuelle Varianten
}
```

Kapselt `resolveGenImageUrl`, Offline-Fallback, Loading-Skeleton (toxic-green Puls), Fade-In, Error-Fallback, brutalist Border/Shadow.

**Prompt-Helper** in `src/utils/imageGen.ts` (additive Erweiterung):

```ts
export const getChassisImagePrompt = (
  kind: AssetKind, flavor: AssetFlavor, tier: ChassisTier
): string

export const getModuleImagePrompt = (moduleId: string): string
// liest aus MODULE_PROMPTS[moduleId], jedes Modul hat einen handgepflegten Prompt

export const getLoanProfileImagePrompt = (profileId: LoanProfileId): string
export const getCrowdfundImagePrompt = (
  kind: AssetKind, flavor: AssetFlavor
): string
export const getRiskEventImagePrompt = (eventType: RiskEventType): string
export const getSectionBackgroundPrompt = (kind: AssetKind): string
// für die großen Sektion-Hintergründe (Van, Studio-Boden, Haus, Werkstatt)
```

**`MODULE_PROMPTS`** — handgepflegte Prompt-Tabelle pro Modul-ID, Beispiele:
- `tb_solar_panel`: `"pixel art solar panel array mounted on tour van roof toxic green accents close-up"`
- `tb_subwoofer_stack`: `"pixel art massive subwoofer speaker stack inside van punk concert gear"`
- `tb_fox_tail`: `"pixel art fox tail antenna decoration on van side mirror trashy charm"`
- `st_ssl_console`: `"pixel art vintage SSL mixing console glowing meters analog studio"`
- `bh_weed_garden`: `"pixel art small indoor weed garden hydroponics secret room glow"`
- `mw_4color_carousel`: `"pixel art screen printing 4-color carousel press merch production workshop"`

Jedes Modul **muss** einen Prompt haben — `MODULE_REGISTRY`-Eintrag ohne `MODULE_PROMPTS`-Eintrag wird in einem Validierungs-Test gefangen.

**Bild-Stellen (alle neuen UI-Elemente):**

| Komponente | Prompt | Aspect |
|---|---|---|
| `TourbusVehicleView` Hintergrund | `getSectionBackgroundPrompt('tourbus_chassis') + chassis-flavor` | 16:9 |
| `StudioFloorplanView` Hintergrund | `getSectionBackgroundPrompt('studio_chassis')` | 4:3 |
| `BandhausCrossSectionView` Hintergrund | `getSectionBackgroundPrompt('bandhaus_chassis')` | 3:4 |
| `WorkshopProductionLineView` Hintergrund | `getSectionBackgroundPrompt('merch_workshop_chassis')` | 21:9 |
| Slot-Hotspot installiertes Modul | `getModuleImagePrompt(moduleId)` | 1:1 |
| `ModulePickerModal` pro Modul | `getModuleImagePrompt(moduleId)` | 1:1 oder 4:3 |
| `ChassisAcquisitionModal` Tier-Vorschau | `getChassisImagePrompt(kind, flavor, tier)` | 16:9 |
| `LoanProfileModal` | `getLoanProfileImagePrompt(profileId)` | 1:1 |
| `CrowdfundSetupModal` | `getCrowdfundImagePrompt(...)` | 16:9 |
| `CrowdfundCampaignCard` | `getCrowdfundImagePrompt(...)` | 4:3 |
| `RepairConfirmModal` | `getChassisImagePrompt(...) + ' damaged broken'` | 16:9 |
| `SellConfirmModal` | `getChassisImagePrompt(...)` | 16:9 |
| `RiskEventModal` | `getRiskEventImagePrompt(eventType)` | 16:9 |
| `ForeclosureModal` | `getRiskEventImagePrompt('foreclosure')` | 16:9 |

**Robustheit:**
- Keine Bilder in `state` — alle URLs reine Render-Ableitungen
- `isImageGenerationAvailable()` Gate vor allen Aufrufen, sonst `getGeneratedImageFallbackUrl()`
- Pollinations-`seed=666` → deterministische server-seitige Caches
- Lazy-Loading via `loading="lazy"` an allen `<img>`s im Modul-Picker
- Module-Icons (1:1, 64×64) werden als Thumbnails behandelt; ein Modul-Picker mit 16 Modulen lädt also 16 Thumbnails — beobachten, ggf. virtualisieren falls Pools später wachsen

## 9. Locale

Namespace `assets.*` in `public/locales/{en,de}/ui.json`. Subkeys:

```
assets.scene.title / .subtitle
assets.section.{tourbus|studio|bandhaus|workshop}.title / .description
assets.kind.{tourbus_chassis|studio_chassis|bandhaus_chassis|merch_workshop_chassis}
assets.flavor.{legit|diy}
assets.chassisTier.{1|2|3}
assets.mode.{cash|loan|crowdfund}
assets.slot.{<slotType>}                 // ein Eintrag pro SlotType
assets.module.{<moduleId>}.name
assets.module.{<moduleId>}.description
assets.module.unlock.fame                // template `{{amount}}`
assets.module.unlock.money               // template
assets.module.unlock.story
assets.module.unlock.skill               // template `{{member}} {{skill}} tier {{tier}}`
assets.module.unlock.scene
assets.module.conflict                   // template `{{otherName}}`
assets.actions.{install|remove|purchase|upgrade|sell|repair}
assets.condition.{good|warning|broken}
assets.loan.profile.{shortTerm|mediumTerm|longTerm|loanShark|coop}
assets.loan.dailyPayment / .defaultWarning
assets.crowdfund.{setup|success|fail|fameStake}
assets.risk.event.{eviction|fire|theft|police_check|copyright_strike|raid|scam_or_bust|paranormal}
assets.foreclosure
```

**Regeln**
- Alle Modul-Namen und -Beschreibungen sind über Modul-ID-Subkeys lokalisiert — kein hardcoded Text
- EN + DE simultan via `i18n-consistency-checker`
- Currency immer via `formatCurrency(value, i18n.language, signDisplay)`
- Toast-Optionen werden bei Dispatch über `i18n.language` gebaket

## 10. Tests

**node:test** (`tests/node/`)
- `assetsReducer.test.js` — `PURCHASE_CHASSIS` mit allen 3 modes, `INSTALL_MODULE`-Validierung (Slot-Typ-Mismatch, locked Module, exclusivity-Konflikt), `REMOVE_MODULE` mit Refund
- `assetModuleRegistry.test.js` — jedes Modul hat einen `MODULE_PROMPTS`-Eintrag; jedes Modul referenziert einen gültigen `slotType` aus dem `SlotType`-Union
- `assetTicks.test.js` — Asset-Tick mit installierten Modulen aggregiert Boni korrekt; broken assets (condition<20) liefern neutrale Boni
- `assetSelectors.test.js` — `isModuleUnlocked` deckt alle Unlock-Typen ab; `getSlotConflicts` erkennt `exclusiveWithGroup`
- `liabilitiesAmortization.test.js` — Tilgung, Default-Counter, Foreclosure
- `assetPayloadSanitization.test.js` — `__proto__`/NaN/unbekannte Werte gestrippt; Slot-Modul-Typ-Mismatch im Sanitizer auf null
- `crowdfundResolution.test.js` — deterministische Resolution
- `assetImagePrompts.test.js` — `getModuleImagePrompt(id)` nicht-leer für alle Modul-IDs; offline → fallback
- `playwright-screenshot-fixture-validation.test.js` — `BASE_STATE` enthält neue Felder

**Vitest** (`tests/ui/`)
- `AssetsScene.test.tsx` — Tab-Wechsel rendert die richtige Sektion-View
- `TourbusVehicleView.test.tsx` — Hotspot-Positionierung, Klick öffnet Picker
- `StudioFloorplanView.test.tsx` — Zonen-Klick-Mapping
- `BandhausCrossSectionView.test.tsx` — Raum-Klick-Mapping
- `WorkshopProductionLineView.test.tsx` — Station-Klick-Mapping
- `ModulePickerModal.test.tsx` — gelockte Module sind disabled mit Reason-Text, exclusivity-Konflikt verhindert Install
- `GeneratedImagePanel.test.tsx` — Online/Offline-Pfade, Error-Fallback, ARIA-alt
- `i18next`-Mocks inkl. `initReactI18next: { type: '3rdParty', init: () => {} }`

**Golden-Path-Erweiterung**: Cycle-Test mit Variante "Spieler kauft Tourbus-Chassis mit Loan, installiert Solar+Bunks, vollständiger Spielzyklus, Tilgung läuft, kein Bankrott".

## 11. Migration

- Saves ohne `assets`/`liabilities`/`crowdfundCampaigns` → Sanitizer setzt `[]`
- Keine Schema-Version-Bump
- `createInitialState` initialisiert die drei Felder leer

## 12. Risiken & Offene Punkte

- **Balancing**: konkrete Preise/Boni-Werte sind Platzhalter, brauchen Balancing-Pass
- **Brand-Token-Erweiterung**: drei neue Akzent-Farben für Studio/Bandhaus/Werkstatt müssen in `brandColors.ts` aufgenommen werden (oder vorhandene Tokens wiederverwendet, falls passend)
- **Bildlade-Volumen**: Modul-Picker lädt 12–18 Thumbnails gleichzeitig; bei Hub-Wechsel + neuer Sektion können >30 Bilder pro Minute geladen werden — Performance-Tests nach erster Implementierung notwendig
- **RNG-Quelle für Risk-Events und Crowdfund-Resolution**: bestehendes RNG-Pattern im Projekt prüfen; falls keine deterministische RNG existiert, `seedrandom` einführen oder Math.random akzeptieren (mit Caveats)
- **Modul-Pool-Wachstum**: 60+ Module insgesamt — die Locale-Datei wächst um ~120 Keys. `i18n-consistency-checker`-Lauf zwingend nach Implementierung
- **Crowdfund-Wahrscheinlichkeits-Formel**: in Spec abstrakt belassen, in Plan-Phase konkretisieren
- **Slot-Position-Daten**: die `position`-Koordinaten pro Slot sind sektion-spezifisch und werden gegen das jeweilige Background-Bild ausgerichtet — Iteration nach erstem visuellen Test wahrscheinlich
- **Anhänger-Dynamik**: Tourbus mit `tb_trailer_hitch` braucht entweder zweites Background-Bild oder Overlay; in Plan-Phase entscheiden

## 13. Implementierungs-Reihenfolge (Hinweis für Plan-Phase)

1. Typen, `CHASSIS_CONFIG`, `MODULE_REGISTRY`, `MODULE_PROMPTS`, `loanProfiles`
2. Sanitizer + State-Init + BASE_STATE-Fixture
3. Action-Types + Action-Creators (inkl. Install/Remove-Validierung)
4. Reducer + Tick-Funktionen + Selektoren
5. Economy-Engine-Erweiterung (optionaler Modifier-Parameter)
6. `GeneratedImagePanel` + Prompt-Helper + neue Brand-Tokens
7. `AssetsScene` Hub + Tab-Routing
8. Vier Sektion-Views (Tourbus zuerst als Referenz, dann Studio/Bandhaus/Werkstatt)
9. Gemeinsame Modale (`ModulePickerModal`, `ChassisAcquisitionModal`, etc.)
10. Locale (EN + DE, alle Modul-IDs)
11. Tests (Action-Creators → Reducer → Selektoren → Views → Modale)
12. Golden-Path-Test-Erweiterung
