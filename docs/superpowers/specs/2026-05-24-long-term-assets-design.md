# Long-Term Assets — Design Spec

**Date:** 2026-05-24
**Branch:** `claude/sweet-bardeen-PEog8`
**Status:** Draft for review

## 1. Goal

Erweitere die Wirtschaftssimulation um ein System für strategische Langzeit-Investitionen. Spieler erwerben, betreiben, verbessern und verlieren materielle Assets über mehrere Spieltage hinweg. Jedes Asset liefert sowohl Cashflow als auch Gameplay-Boni (Hybrid-Modell). Erwerb erfolgt über drei alternative Pfade (Cash, Kredit, Crowdfunding). Eine `legit`/`diy`-Achse erlaubt Punk-Tonalität mit echten Risiko-/Reward-Trade-offs.

Alle neuen UI-Elemente nutzen die vorhandene Pollinations-Bildgenerierung (`src/utils/imageGen.ts`) über eine neue gemeinsame Komponente `GeneratedImagePanel`.

## 2. Scope

**In Scope**
- Vier Asset-Kategorien: Proberaum, Studio, Tourbus-Mods, Merch-Werkstatt
- Drei Tier-Stufen pro Asset
- Zwei Flavors pro Asset: `legit` und `diy`
- Drei Erwerbsmodi: `cash`, `loan`, `crowdfund`
- Tägliche Tick-Logik in `advanceDay`: Verfall, Cashflow, Tilgung, Risiko-Events
- Neue Top-Level-Szene `ASSETS` mit eigenem UI
- Bildgenerierung für alle neuen UI-Elemente (Asset-Karten, alle Entscheidungs-Modale)
- Erweiterung von `shouldTriggerBankruptcy` um Verbindlichkeiten
- Persistenz mit `finiteNumberOr`-gehärteten Sanitizern

**Out of Scope (Folge-Arbeit, nicht Teil dieser Spec)**
- Retrofit bestehender Modals/Katalog-Items mit generierten Bildern
- Konkurrenzbands, dynamische Marktpreise
- Eigene Venues kaufen (separate Spec sinnvoll)
- Steuern, Buchhaltungs-UI

## 3. Datenmodell

Neue Top-Level-State-Felder:

```ts
state.assets: LongTermAsset[]
state.liabilities: Liability[]
state.crowdfundCampaigns: CrowdfundCampaign[]
```

Typdefinitionen in `src/types/assets.d.ts`:

```ts
export type AssetKind =
  | 'rehearsal'
  | 'studio'
  | 'tourbus_mod'
  | 'merch_workshop'

export type AssetFlavor = 'legit' | 'diy'
export type AssetTier = 1 | 2 | 3
export type AcquisitionMode = 'cash' | 'loan' | 'crowdfund'

export interface AssetBoni {
  staminaRegenBonusPerDay?: number      // rehearsal
  trainingCostMultiplier?: number       // rehearsal (default 1.0)
  infightingDamper?: number             // rehearsal tier 3
  songCostMultiplier?: number           // studio (default 1.0)
  songQualityBonus?: number             // studio tier 2+
  enablesReRecording?: boolean          // studio tier 3
  fuelMultiplier?: number               // tourbus_mod (default 1.0)
  merchCapacityBonus?: number           // tourbus_mod
  travelStaminaRegen?: number           // tourbus_mod
  merchCostMultiplier?: number          // merch_workshop (default 1.0)
  enablesLimitedEditions?: boolean      // merch_workshop tier 2+
  enablesBulkProduction?: boolean       // merch_workshop tier 3
}

export interface LongTermAsset {
  id: string
  kind: AssetKind
  flavor: AssetFlavor
  tier: AssetTier
  condition: number                     // 0..100
  dailyUpkeep: number                   // EUR/Tag
  baseDailyRevenue: number              // EUR/Tag at condition=100
  gameplayBoni: AssetBoni
  acquiredOnDay: number
  acquisitionMode: AcquisitionMode
  riskEventChance: number               // 0..1 per day
}

export interface Liability {
  id: string
  source: 'loan' | 'crowdfund'
  assetId: string
  principalRemaining: number
  interestRate: number                  // 0 for crowdfund
  dailyPayment: number
  termDaysRemaining: number
  defaultCounter: number                // days missed in a row
  crowdfundFamePromised?: number
}

export interface CrowdfundCampaign {
  id: string
  assetSpec: {                          // what gets created on success
    kind: AssetKind
    flavor: AssetFlavor
    tier: AssetTier
  }
  targetAmount: number
  fameStake: number
  daysRemaining: number
  resolvedOutcome: 'success' | 'fail'   // deterministic, decided at start
}
```

**Sanitization rules**
- `sanitizeAssets`, `sanitizeLiabilities`, `sanitizeCrowdfundCampaigns` in `src/context/reducers/systemReducer.ts`
- Alle Zahlenfelder durch `finiteNumberOr(value, fallback)`
- Unbekannte `kind`/`flavor`/`source`/`acquisitionMode`-Werte → Eintrag wird verworfen
- `condition` mit `clampCondition(0, 100)` (neuer Helper in `gameStateUtils.ts`)
- Prototyp-Keys via `Object.hasOwn` geprüft
- `BASE_STATE` in `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js` ergänzt um `assets: []`, `liabilities: []`, `crowdfundCampaigns: []`

## 4. Asset-Konfiguration

Statische Konfig in `src/utils/assetConfig.ts`:

```ts
export const ASSET_CONFIG = {
  rehearsal: { /* tier×flavor → { price, upkeep, baseDailyRevenue, boni, riskEventChance } */ },
  studio: { ... },
  tourbus_mod: { ... },
  merch_workshop: { ... },
} as const satisfies Record<AssetKind, AssetKindConfig>
```

Beispiel-Werte (zur Spec-Validierung, finale Zahlen via Balancing):
- `rehearsal.legit.tier1`: price 2.000€, upkeep 30€/Tag, revenue 20€/Tag, staminaRegenBonusPerDay 2
- `rehearsal.diy.tier1`: price 800€, upkeep 5€/Tag, revenue 0€/Tag, staminaRegenBonusPerDay 2, riskEventChance 0.02
- `studio.legit.tier3`: price 25.000€, upkeep 80€/Tag, revenue 120€/Tag, songCostMultiplier 0.6, songQualityBonus 0.15, enablesReRecording true
- `tourbus_mod.legit.tier2` ("Solar+Schlafkabinen"): price 6.000€, upkeep 10€/Tag, revenue 0, fuelMultiplier 0.85, travelStaminaRegen 5

**Loan-Profile** in `src/utils/loanProfiles.ts`:
```ts
shortTerm:  { termDays: 60,  rate: 0.08, label: 'bank.short' }
mediumTerm: { termDays: 120, rate: 0.06, label: 'bank.medium' }
longTerm:   { termDays: 180, rate: 0.04, label: 'bank.long' }
loanShark:  { termDays: 30,  rate: 0.20, label: 'shark' }   // verfügbar bei niedrigem Fame
coop:       { termDays: 240, rate: 0.02, label: 'coop' }    // verfügbar bei hohem szene-Standing
```

DIY-Assets können nicht über `loan` erworben werden. Validierung im Action-Creator und Reducer.

## 5. Reducer-Integration

**Neue Action-Types** in `src/context/actions/actionTypes.ts`:

- `PURCHASE_ASSET`
- `UPGRADE_ASSET`
- `SELL_ASSET`
- `REPAIR_ASSET`
- `START_CROWDFUND`
- `RESOLVE_CROWDFUND`         (dispatched vom daily tick)
- `ASSET_FORECLOSED`          (dispatched vom liability tick)
- `ASSET_RISK_EVENT_TRIGGERED`
- `LIABILITY_PAYMENT_TICK`    (intern, gebündelt vom advanceDay)
- `ASSET_TICK`                (intern, gebündelt vom advanceDay)

**Action-Creators** in `src/context/actions/assetActionCreators.ts`:
- Normalisieren Payloads über `finiteNumberOr`
- Strippen `__proto__`/`constructor`/`prototype` via `Object.hasOwn`-Filter
- Validieren: `kind`/`flavor` gegen `ASSET_CONFIG`-Keys, `mode` gegen Enum
- DIY+loan-Kombination → `null` zurückgeben (Action wird nicht dispatched)
- Returnen `Extract<GameAction, { type: typeof ActionTypes.X }>`

**Reducer-Module**: `src/context/reducers/assetReducer.ts`, eingehängt in `gameReducer.ts`. Default-Branch via `assertNever(action as never)`.

**advanceDay-Komposition** (in der bestehenden Reihenfolge, vor Bankrott-Check):

```
state' = processAssetTick(state)
state' = processLiabilityTick(state')
state' = processCrowdfundTick(state')
state' = rollAssetRiskEvents(state', rng)
state' = applyBankruptcyCheck(state')   // bestehend, jetzt mit liabilities
```

Alle vier Sub-Ticks sind reine Funktionen in `src/utils/assetTicks.ts`. RNG kommt deterministisch aus dem bestehenden Pattern (zu prüfen in Implementierung — voraussichtlich `state.rngSeed` oder ein `seedrandom`-Wrapper).

**`shouldTriggerBankruptcy` Erweiterung**: Total daily obligations = `guaranteedDailyCost + sum(liabilities.dailyPayment)`. Ohne diese Erweiterung könnte Loan-Spam Bankrott vermeiden.

**Lifecycle-Regeln**
- `START_GIG`: `assets`/`liabilities`/`crowdfundCampaigns` bleiben unverändert
- `RESET_GAME`: alle drei Felder zurück auf `[]`
- `condition < 20`: `gameplayBoni` werden via Selector auf neutrale Werte gemappt (Asset "kaputt"). Bei `condition === 0`: dispatch `ASSET_FORECLOSED` (verlorenes Asset)

## 6. Selector-Layer

`src/utils/assetSelectors.ts` (memoisiert wie `deriveFinancials`):

```ts
export interface AssetModifiers {
  fuelMultiplier: number        // default 1.0
  merchCostMultiplier: number   // default 1.0
  songCostMultiplier: number    // default 1.0
  staminaRegenBonusPerDay: number
  travelStaminaRegen: number
  merchCapacityBonus: number
  songQualityBonus: number
  trainingCostMultiplier: number
  flags: {
    enablesReRecording: boolean
    enablesLimitedEditions: boolean
    enablesBulkProduction: boolean
    infightingDamper: boolean
  }
}

export function getActiveAssetModifiers(assets: LongTermAsset[]): AssetModifiers
```

Aggregation: multiplikative Boni werden multipliziert, additive werden summiert, Flags ge-`OR`-t. Assets mit `condition < 20` werden ignoriert.

Bestehende Economy-Funktionen (`calculateFuelCost`, `calculateMerchIncome`, `calculateGigFinancials`) nehmen `AssetModifiers` als optionalen Parameter. Default verhält sich wie heute (Multiplikatoren `1.0`).

## 7. UI

**Neuer Scene-Wert** `'ASSETS'` im `Scene`-Enum. Erreichbar via Overworld-Button "Investments" und BandHQ-Quicklink.

**Komponentenstruktur** in `src/components/assets/`:

- `AssetsScene.tsx` — Top-Level-Szene mit Top-Bar (Liquidität, Cashflow, Schulden-Total), Tab-Leiste, Inhalt
- `AssetCard.tsx` — eine Karte pro Asset im Inventar
- `AcquisitionModal.tsx` — kind → flavor → tier → mode Flow
- `LoanProfileModal.tsx` — Sub-Modal für Loan-Auswahl
- `CrowdfundSetupModal.tsx` — fameStake-Slider, Erfolgswahrscheinlichkeit
- `CrowdfundCampaignCard.tsx` — aktive Kampagne mit Countdown
- `LiabilitiesPanel.tsx` — offene Kredite, default-Counter, Crowdfunds
- `RepairConfirmModal.tsx`, `SellConfirmModal.tsx`
- `RiskEventModal.tsx` — bei DIY-Risk-Events
- `ForeclosureModal.tsx` — bei Pfändung

**Styling**: Brutalist via Tailwind v4, Tokens (`var(--color-toxic-green)`, `var(--color-blood)`), keine Hex-Werte. Keine `forwardRef`. Prop-Typen in `src/types/components.d.ts`.

**Layout-Sketch AssetsScene:**
```
┌─ Top-Bar: 💰 12.4k  ↗ +84/Tag  ⚠ Schulden 3.2k ───────────┐
├─ Tabs: [Proberaum] [Studio] [Tourbus] [Merch] [Schulden] ┤
├─ Asset-Grid (3 cols) ────────────────────────────────────┤
│  ┌AssetCard──┐  ┌AssetCard──┐  ┌+ Erwerben──┐            │
│  │[Hero-Bild]│  │[Hero-Bild]│  │ leere      │            │
│  │ Tier 2    │  │ Tier 1 DIY│  │ Slot-Card  │            │
│  │ ▓▓▓▓░ 87% │  │ ▓▓░░░ 34% │  │            │            │
│  │ +45€/Tag  │  │ −5€/Tag   │  └────────────┘            │
│  └───────────┘  └───────────┘                            │
└──────────────────────────────────────────────────────────┘
```

## 8. Bildgenerierung

**Neue gemeinsame Komponente** `src/ui/shared/GeneratedImagePanel.tsx`:

```ts
interface GeneratedImagePanelProps {
  prompt: string
  alt: string
  aspectRatio?: '16:9' | '1:1' | '4:3'
  className?: string
  onLoad?: () => void
}
```

Kapselt:
- `resolveGenImageUrl(prompt, isOnline)` mit Offline-Fallback
- Loading-Skeleton (toxic-green Puls)
- Fade-In bei `onLoad`
- Error-Fallback (bei img.onerror → `getGeneratedImageFallbackUrl()`)
- Brutalist Border + Shadow via Tokens

**Prompt-Helper** in `src/utils/imageGen.ts` (Erweiterung, keine Modifikation bestehender Exports):

```ts
const ASSET_PROMPT_PARTS: Record<AssetKind, Record<AssetFlavor, string>> = {
  rehearsal: {
    legit: 'rented rehearsal space with proper soundproofing band practice room',
    diy:   'squatted basement rehearsal room graffiti walls illegal venue',
  },
  studio: {
    legit: 'professional recording studio mixing console microphones',
    diy:   'cellar home studio stolen equipment cables everywhere',
  },
  tourbus_mod: {
    legit: 'tour van interior upgraded modifications certified',
    diy:   'self-welded tour van modifications duct tape and hope',
  },
  merch_workshop: {
    legit: 'screen printing workshop band merchandise production',
    diy:   'garage screen printing setup punk diy merch production',
  },
}

const TIER_MODIFIERS = {
  1: 'cramped minimal setup',
  2: 'expanded with extra gear',
  3: 'fully professional level setup',
} as const satisfies Record<AssetTier, string>

export const getAssetImagePrompt = (
  kind: AssetKind, flavor: AssetFlavor, tier: AssetTier
): string =>
  `pixel art ${ASSET_PROMPT_PARTS[kind][flavor]} ${TIER_MODIFIERS[tier]} dark moody toxic green accents`

export const getLoanProfileImagePrompt = (profile: LoanProfileId): string
export const getCrowdfundImagePrompt = (kind: AssetKind, flavor: AssetFlavor): string
export const getRiskEventImagePrompt = (eventType: RiskEventType): string
```

**Bild-Stellen (alle neuen UI-Elemente dieser Spec):**

| Komponente | Prompt-Helper | Aspect |
|---|---|---|
| `AssetCard` Hero | `getAssetImagePrompt(kind, flavor, tier)` | 16:9 |
| `AcquisitionModal` Tier-Vorschau | `getAssetImagePrompt(...)`, refresh bei Tier-Wechsel | 16:9 |
| `LoanProfileModal` | `getLoanProfileImagePrompt(profileId)` | 1:1 |
| `CrowdfundSetupModal` | `getCrowdfundImagePrompt(kind, flavor)` | 16:9 |
| `CrowdfundCampaignCard` | `getCrowdfundImagePrompt(kind, flavor)` | 4:3 |
| `RepairConfirmModal` | `getAssetImagePrompt(...)` + " damaged broken state" | 16:9 |
| `SellConfirmModal` | `getAssetImagePrompt(...)` | 16:9 |
| `RiskEventModal` | `getRiskEventImagePrompt(eventType)` | 16:9 |
| `ForeclosureModal` | `getRiskEventImagePrompt('foreclosure')` | 16:9 |

**Robustheit:**
- Bilder werden NIE in `state` persistiert — URLs sind reine Render-Ableitungen
- `isImageGenerationAvailable()` gate vor allen Gen-URL-Aufrufen
- Pollinations-`seed=666` sorgt für deterministische serverseitige Caches: gleicher Prompt → gleiches Bild
- Bei Pixi-Verwendung: `loadTexture(resolveGenImageUrl(...))`-Pfad (gemäß CLAUDE.md-Gotcha)

## 9. Locale

Namespace `assets.*` in `public/locales/{en,de}/ui.json`. Subkeys:

```
assets.scene.title
assets.scene.subtitle
assets.kind.{rehearsal|studio|tourbus_mod|merch_workshop}
assets.flavor.{legit|diy}
assets.tier.{1|2|3}
assets.mode.{cash|loan|crowdfund}
assets.actions.{purchase|upgrade|sell|repair}
assets.condition.{good|warning|broken}
assets.acquisition.confirm
assets.loan.profile.{shortTerm|mediumTerm|longTerm|loanShark|coop}
assets.loan.dailyPayment    // template uses {{amount}}
assets.loan.defaultWarning  // template
assets.crowdfund.setup
assets.crowdfund.success
assets.crowdfund.fail
assets.crowdfund.fameStake  // template
assets.risk.event.{eviction|fire|theft|police_check}
assets.foreclosure
```

**Rules**
- EN + DE werden gemeinsam aktualisiert (CI-Check via `i18n-consistency-checker`-Skill)
- Currency via `formatCurrency(value, i18n.language, signDisplay)` — keine hardcoded `€`
- Toast-Optionen werden bei Dispatch in Action-Creator oder Reducer gebaket via `i18n.language`

## 10. Tests

**node:test** (`tests/node/`)
- `assetsReducer.test.js` — `PURCHASE_ASSET` mit allen 3 modes, validation (DIY+loan rejected), state-Konsistenz
- `liabilitiesAmortization.test.js` — Tilgungsrechnung, Default-Counter, Foreclosure-Flow, Bankrott-Einbezug
- `assetTicks.test.js` — `processAssetTick` Determinismus, condition-Decay, condition<20 deaktiviert Boni
- `assetModifierAggregation.test.js` — Selektor mit leerem Array, multiple assets gleicher Kind, broken assets ignoriert
- `assetPayloadSanitization.test.js` — `__proto__`/`constructor`/`NaN`/`Infinity` werden gestrippt; `Object.hasOwn`-checks
- `crowdfundResolution.test.js` — deterministische Resolution überlebt Reload, fameStake-Abzug bei Fail
- `assetImagePrompts.test.js` — alle Kombinationen liefern nicht-leere Strings, offline → fallback-URL
- `playwright-screenshot-fixture-validation.test.js` — `BASE_STATE` enthält `assets`, `liabilities`, `crowdfundCampaigns`

**Vitest** (`tests/ui/`)
- `AssetsScene.test.tsx` — Render, Tab-Wechsel
- `AcquisitionModal.test.tsx` — Flow `kind → flavor → tier → mode`, DIY blockt loan-Option
- `GeneratedImagePanel.test.tsx` — Online/Offline-Pfade, error-fallback, ARIA-alt
- `i18next`-Mocks inkl. `initReactI18next: { type: '3rdParty', init: () => {} }`

**Golden-Path-Erweiterung**: Cycle-Test bekommt Variante "Spieler nimmt Kredit → kompletter Zyklus → Tilgung läuft → kein Bankrott".

## 11. Migration

- Saves ohne `assets`/`liabilities`/`crowdfundCampaigns` → Sanitizer setzt `[]`
- Keine Schema-Version-Bump nötig (additive Felder)
- `createInitialState` initialisiert die drei Felder leer

## 12. Risiken & Offene Punkte

- **Balancing**: Konkrete Preise/Upkeep-Werte in `ASSET_CONFIG` sind Platzhalter, brauchen Balancing-Skill-Pass nach Implementierung
- **Bildlade-Performance**: 24 mögliche Asset-Prompts × ggf. mehrere Modale gleichzeitig → erste Implementierung beobachten, ggf. Preloading-Strategie nachziehen
- **DIY-Risk-Event-Frequenz**: muss spielgefühlsmäßig austariert werden — zu häufig frustriert, zu selten macht DIY zur reinen Sparvariante
- **Crowdfund-Resolution**: Wahrscheinlichkeits-Formel muss explizit definiert und getestet werden (Spec belässt sie hier abstrakt)
- **RNG-Quelle**: Implementierung muss bestehendes RNG-Pattern adoptieren — bei fehlendem deterministischen RNG vor Implementierungsbeginn entscheiden, ob `seedrandom` eingeführt wird

## 13. Implementierungs-Reihenfolge (Hinweis für Plan-Phase)

1. Typen + Konfig (`assets.d.ts`, `assetConfig.ts`, `loanProfiles.ts`)
2. Sanitizer + State-Init + BASE_STATE-Fixture
3. Action-Types + Action-Creators
4. Reducer + Tick-Funktionen + Selektoren
5. Economy-Engine-Erweiterung (optional-Parameter)
6. `GeneratedImagePanel` + Prompt-Helper
7. UI-Komponenten + Szene-Routing
8. Locale (EN + DE simultan)
9. Tests (Action-Creators → Reducer → Selektoren → UI)
10. Golden-Path-Test-Erweiterung
