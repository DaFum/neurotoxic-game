# Logic-Audit — Auffälligkeiten und Inkonsistenzen (2026-06-12)

Tiefes Audit der Codebase auf Logikfehler und Inkonsistenzen. Geprüft wurden die State-Management-Schicht (Reducer, Sanitizer, Clamps), die Economy-/Asset-Mathematik, RNG-Determinismus und Daily-Tick-Logik, Save/Load-Validierung, Audio-/Rhythm-Timing-Invarianten, UI-Invarianten (Currency, Farben, Consumables) sowie die EN/DE-Locale-Konsistenz. Referenzmaßstab sind die in `AGENTS.md` dokumentierten Invarianten.

Severity: **HOCH** = korrumpiert State oder Spielerlebnis direkt · **MITTEL** = falsches Verhalten unter realistischen Bedingungen · **NIEDRIG** = Inkonsistenz/Randfall, geringe praktische Auswirkung.

> **Status-Update (2026-06-12):** Alle Befunde wurden behoben (je ein Commit pro Befund auf `claude/magical-curie-upvnsm`).
>
> | Befund | Status | Commit |
> |---|---|---|
> | 1.1 + 1.2 | ✅ Gefixt + Regressionstests | `4b42a53` |
> | 1.3 | ✅ Gefixt (kanonischer Spread + `stacks`-Sanitization) + Test | `3db518a` |
> | 1.4 | ✅ Gefixt (No-op ohne Besitz, auch bei Count 0) + Tests | `0492bdf` |
> | 1.5 | ✅ Gefixt (aktueller Key gewinnt) + Tests | `8bf7030` |
> | 1.6 | ✅ Gefixt (standalone `fameLevel` wird verworfen) + Test | `482887e` |
> | 1.7 | ✅ Gefixt (`sanitizeStringArray`) + Test | `4073139` |
> | 1.8 | ✅ Gefixt (`buildDeterministicToastId` statt UUID) | `7a71611` |
> | 1.9 | ✅ Als bewusste Ausnahme dokumentiert | `ae9a60a` |
> | 2.1 | ✅ Gefixt (`fameLevel` recompute) + Test | `4aeebb1` |
> | 2.2 | ✅ Gefixt (Zins-/Tilgungssplit, exakte Schlussrate) + Tests | `4bdde57` |
> | 2.3 | ✅ Gefixt (Multiplier nur noch auf Verbrauch) + Tests | `31dbf47` |
> | 2.4 | ✅ Gefixt (`calculateChassisRepairCost` als SoT, gerundet) | `255fa6c` |
> | 2.5 | ✅ Gefixt (Erfolg = Asset + Fame, keine Cash-Auszahlung) + Test | `dbd0021` |
> | 2.6 | ✅ Invariante dokumentiert (Clamp würde Schulden erlassen) | `732b77e` |
> | 3 (Harmony-Sweep) | ✅ Alle 8 Stellen auf `finiteNumberOr` umgestellt | `90df2e8` |
> | 4.1 | ✅ Bereits auf `main` behoben (Finite-Check in der Schleife vorhanden) | — |
> | 4.2 | ✅ Bereits auf `main` behoben (rein RNG-basierte ID ohne `Date.now`) | — |
> | 5.2 + 5.3 | ✅ 37 featureList-Einträge + `flat_battery`-Label übersetzt | `5062aa4` |

---

## 1) Reducer & Payload-Sicherheit

### 1.1 `applyContrabandEffect`: Stress-Item kann Band-Stress auf 0 zurücksetzen (NaN-through-clamp)

- **Datei:** `src/context/reducers/bandReducer.ts:528-533`
- **Severity:** MITTEL · Konfidenz: hoch

```ts
newBand.stress = clampBandStress(
  Math.floor(((newBand.stress as number | undefined) ?? 0) + (item.value as number))
)
```

Der Addend `item.value` ist **nicht** mit `finiteNumberOr` abgesichert — im Gegensatz zu den Geschwister-Branches für stamina/mood/harmony wenige Zeilen darunter (Z. 565–576), die es alle tun (Copy-Paste-Inkonsistenz). `clampBandStress` → `clamp0to100` kollabiert NaN zu **0**. Da Stash-Items aus Saves via `{ ...baseItem, ...itemObj }` kommen (siehe 1.3), kann `value` nicht-numerisch sein; das Benutzen eines Stress-Items setzt dann Stress stillschweigend auf 0 statt zu no-open. Exakt der Arithmetic-then-clamp-Verstoß, den `AGENTS.md` mit `finiteNumberOr` adressiert.

### 1.2 `applySharedBandEffect`: `guitar_difficulty` kann State dauerhaft mit NaN vergiften

- **Datei:** `src/context/reducers/bandReducer.ts:318-327`
- **Severity:** MITTEL · Konfidenz: hoch

```ts
guitarDifficulty: Math.max(0.1, (newBand.performance?.guitarDifficulty ?? 1) + value)
```

Der Additiv-Branch (Z. 299) und `stamina_max` (Z. 310) wickeln `value` in `finiteNumberOr`, der `guitar_difficulty`-Branch nicht. `Math.max(0.1, NaN)` ist `NaN` → ein save-verseuchter `value` macht `performance.guitarDifficulty` dauerhaft NaN. Erreichbar über `handleUseContraband` (Consumables mit `guitar_difficulty` existieren in `src/data/contraband.ts`, Z. 42, 137).

### 1.3 `sanitizeBand` (Stash): Save-Daten überschreiben kanonische Item-Felder

- **Datei:** `src/context/reducers/systemReducer.ts:849, 877`
- **Severity:** MITTEL · Konfidenz: mittel

```ts
const copy = { ...baseItem, ...itemObj } as Record<string, unknown>
```

Nur `remainingDuration` wird validiert; das rohe Save-Objekt überschreibt `value`, `effectType`, `duration`, `type`, `stacks`, `maxStacks` aus dem kanonischen `CONTRABAND_BY_ID`-Eintrag. Das ist der Upstream-Enabler für 1.1/1.2 und widerspricht der dokumentierten Schicht „Reducer verwerfen malformed/hostile Payloads“. Fix: `baseItem` zuletzt spreaden (kanonische Felder gewinnen) oder Numerik validieren.

### 1.4 `handleConsumeItem`: Quest-Progress für nicht besessene Items

- **Datei:** `src/context/reducers/bandReducer.ts:240-243`
- **Severity:** NIEDRIG–MITTEL · Konfidenz: mittel

Wenn `inventory[itemType]` fehlt (weder `true` noch Zahl), passiert keine Inventory-Änderung — aber `createItemUsedQuestEvent` wird trotzdem unbedingt emittiert. Ein `CONSUME_ITEM`-Dispatch für ein nicht besessenes Item treibt damit Item-Use-Quests voran. Der Reducer ist laut `AGENTS.md` die finale Autorität; Action-Creator-Guards entschuldigen das nicht.

### 1.5 `sanitizeGigModifiers`: Legacy-Key gewinnt über aktuellen Key

- **Datei:** `src/context/reducers/systemReducer.ts:1363-1373`
- **Severity:** NIEDRIG · Konfidenz: mittel

Die Legacy-Migration `energy → catering` läuft **nach** der Whitelist-Schleife. Ein Save mit `catering: true` und veraltetem `energy: false` endet mit `catering: false`. Der aktuelle Key sollte Vorrang vor dem Legacy-Alias haben.

### 1.6 `handleUpdatePlayer`: `fameLevel` standalone akzeptiert → Desync mit `fame`

- **Datei:** `src/context/reducers/playerReducer.ts:36-47`
- **Severity:** NIEDRIG · Konfidenz: mittel

`fameLevel` wird nur neu berechnet, wenn `fame` im Payload steckt; ein Payload mit nur `fameLevel` wird ungeprüft gemergt und desynchronisiert das abgeleitete Feld. Der Doc-Kommentar behauptet das Gegenteil („preserves derived fame level invariants“).

### 1.7 `handleResetState`: `unlocks` ohne Sanitization gecastet

- **Datei:** `src/context/reducers/systemReducer.ts:1692-1694`
- **Severity:** NIEDRIG · Konfidenz: hoch (Lücke), niedrig (Impact)

`payload.unlocks as string[]` lässt beliebige Arrays (auch mit Nicht-String-Einträgen) in den State — inkonsistent zu `handleLoadGame`, das `sanitizeStringArray` benutzt.

### 1.8 Unpure Toast-ID-Erzeugung in Reducern

- **Dateien:** `src/context/reducers/rivalReducer.ts:60`, `src/context/reducers/gigReducer.ts:131`, `src/context/reducers/tradeReducer.ts:100, 122` (dort nur als Fallback hinter `instanceId ?? …`)
- **Severity:** NIEDRIG · Konfidenz: hoch

`getSafeUUID()` wird direkt im Reducer aufgerufen. Das verletzt die Reducer-Purity (vgl. Asset-Reducer-Invariante: UUIDs werden im Action Creator vorgeneriert). Auswirkung ist rein kosmetisch (Toast-IDs), aber inkonsistent — `tradeReducer` zeigt mit dem `instanceId`-Payload-Pattern bereits die korrekte Lösung.

### 1.9 `sanitizeRngSeed`: `Date.now()`-Fallback im Load-Pfad

- **Datei:** `src/context/reducers/assetSanitizers.ts:443-451` (verwendet in `systemReducer.ts:1635`)
- **Severity:** NIEDRIG/INFO · Konfidenz: hoch

Bei nicht-finitem persistierten Seed fällt der Sanitizer auf `Date.now() >>> 0` zurück — Unreinheit im Reducer-Pfad, allerdings nur beim Laden eines korrupten Saves. Akzeptabler Pragmatismus, sollte aber bewusst dokumentiert bleiben.

---

## 2) Economy- & Asset-Mathematik

### 2.1 `processCrowdfundTick`: `fame` aktualisiert, `fameLevel` nicht

- **Datei:** `src/utils/assetTicks.ts:300`
- **Severity:** MITTEL · Konfidenz: hoch

```ts
player: { ...state.player, money, fame },
```

Beide Geschwister-Ticks in derselben Datei berechnen das abgeleitete Level neu (`assetTicks.ts:91`, `:207` rufen `calculateFameLevel`), die Crowdfund-Auflösung schreibt `fame` (±`fameStake`, kann 50+ sein) und lässt `fameLevel` stale. `fameLevel` treibt Lifestyle-Inflation in `calculateGuaranteedDailyCost` und Travel-Logistik — die Tageskosten rechnen bis zur nächsten unabhängigen Neuberechnung mit dem falschen Level. Verstößt zudem gegen die `AGENTS.md`-Regel, `fame`/`fameLevel` immer gepaart zu behandeln.

### 2.2 Liability-Tick: letzte Rate überzieht; Tilgung schluckt Zinsanteil

- **Datei:** `src/utils/assetTicks.ts:149-156` (Pricing: `loanProfiles.ts:117`)
- **Severity:** MITTEL · Konfidenz: hoch (a), mittel (b)

```ts
currentMoney -= liability.dailyPayment
const principalRemaining = Math.max(0, liability.principalRemaining - liability.dailyPayment)
```

(a) Am letzten Tag wird die volle `dailyPayment` abgebucht, auch wenn `principalRemaining` kleiner ist (Überzahlung bis zu einer Rate). (b) `principalRemaining` wird um die gesamte Rate reduziert, ohne Zins-/Tilgungssplit — obwohl `computeAmortization` die Rate als verzinstes Annuitätendarlehen kalkuliert. Folgen: Kredite enden einen Tag zu früh (240-Tage-Coop-Kredit nach ~239 Raten); Payoff beim Verkauf, `getTotalDebt` und Refinance-Principal liegen unter der echten Amortisationsbilanz — Spieler umgehen aufgelaufene Zinsen bei frühem Ausstieg.

### 2.3 `fuelMultiplier` doppelt angewendet (Verbrauch UND Tankpreis)

- **Dateien:** `src/utils/economy/logisticsLogic.ts:78` und `:185-191`
- **Severity:** MITTEL · Konfidenz: mittel-hoch

```ts
fuelLiters *= assetModifiers.fuelMultiplier ?? 1.0                                   // verbrauchte Liter
missing * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE * (assetModifiers.fuelMultiplier ?? 1)  // Tankkosten
```

Derselbe Modifier (z. B. `tb_solar_panel` 0.85) reduziert sowohl die verbrauchten Liter pro Trip als auch den Euro-Preis beim Nachtanken. Effektive Spritkosten skalieren quadratisch (0.85 → ~28 % günstiger statt 15 %). Eine Datei behandelt ihn als Verbrauchs-, die andere als Preis-Modifier; da das aufzufüllende Tankdefizit in physischen Litern vorliegt, ist der Preisrabatt eine zweite, unverdiente Anwendung.

### 2.4 Reparaturkosten: Anzeige kann €1 unter dem Abgebuchten liegen

- **Dateien:** `src/context/reducers/assetReducer.ts:521`, `src/components/assets/RepairConfirmModal.tsx:26`
- **Severity:** NIEDRIG · Konfidenz: hoch

Condition verfällt 0.3/Tag → `repairCost = (100 - condition) * REPAIR_COST_PER_POINT` ist fast immer fraktional (z. B. 2.4). Das Modal rundet auf „€2“ (`maximumFractionDigits: 0`), der Reducer zieht 2.4 ab und `clampPlayerMoney` floort die Balance — effektiv werden €3 vom ganzzahligen Kontostand abgezogen. Verstößt gegen die Regel „angezeigt = angewendet“.

### 2.5 Crowdfund-Erfolg: Asset + voller Preis als Cash (doppelte Auszahlung)

- **Dateien:** `src/utils/assetTicks.ts:254-256`, `src/components/assets/ChassisAcquisitionModal.tsx:152` (`targetAmount={price}`)
- **Severity:** MITTEL (Balance) · Konfidenz: mittel (ob unbeabsichtigt)

Bei Erfolg erhält der Spieler den vollen Chassis-Preis in Cash **und** das Asset; riskiert wird nur Fame. Gegenüber Cash-Kauf (zahlt Preis) und Kredit (zahlt Preis + Raten) dominiert Crowdfunding strikt. `tests/node/assetTicks.test.js:148` kodifiziert das Verhalten — könnte gewollte Großzügigkeit sein, ist aber ökonomisch inkonsistent zu den anderen beiden Erwerbswegen. → Design-Entscheidung nötig.

### 2.6 `processAssetTick`: transient ungeclampte Money

- **Datei:** `src/utils/assetTicks.ts:89, 95`
- **Severity:** INFO

`money: state.player.money + moneyDelta` ohne `clampPlayerMoney` — fraktionale/negative Beträge existieren transient innerhalb von `handleAdvanceDay`, bis `calculateDailyUpdates` clampt. Derzeit maskiert (einziger Aufrufer ist der Day-Tick), hängt aber an dieser Reihenfolge.

---

## 3) Wiederkehrendes Muster: Harmony-Arithmetik mit `??` statt `finiteNumberOr`

- **Severity:** NIEDRIG (Muster-Inkonsistenz) · Konfidenz: hoch

Die Reducer nutzen durchgängig korrekt `clampBandHarmony(finiteNumberOr(state.band.harmony, 1) ± delta)`. Mehrere Utils/Domain/Hook-Dateien nutzen stattdessen `(harmony ?? 0) + delta` — `??` lässt `NaN` durch, der Clamp kollabiert das Ergebnis dann zu 0 und der Bonus geht verloren (statt Fallback + Bonus). Praktische Auswirkung ist gering, da `saveValidator.ts:252` Harmony beim Laden clampt; es bleibt aber ein Verstoß gegen die `AGENTS.md`-Regel „persistierte numerische Felder an der Arithmetik-Grenze als `unknown` behandeln“:

| Datei | Stelle | Code |
|---|---|---|
| `src/utils/arrivalUtils.ts` | 71 | `clampBandHarmony((band.harmony ?? 0) + 5)` |
| `src/utils/travelUtils.ts` | 297 | `clampBandHarmony((band.harmony ?? 0) + 5)` |
| `src/utils/purchaseLogicUtils.ts` | 343 | `clampBandHarmony((band.harmony ?? 1) + val)` |
| `src/utils/purchaseLogicUtils.ts` | 576 | `clampBandHarmony((band.harmony ?? 0) + 5)` |
| `src/utils/socialEngine.ts` | 292 | `Number(gameState.band.harmony ?? 0)` (NaN passiert `Number()`) |
| `src/domain/questRewards.ts` | 252 | `nextState.band?.harmony ?? 1` |
| `src/domain/questPenalties.ts` | 169 | `(nextState.band.harmony ?? 1) + penalty.amount` |
| `src/hooks/usePreGigLogic.ts` | 306 | `const prevHarmony = band.harmony ?? 1` |

Empfehlung: mechanisch auf `finiteNumberOr(harmony, fallback)` umstellen, analog zum Mood/Stamina-Muster (das überall korrekt umgesetzt ist — alle 30+ `clampMemberMood`/`clampMemberStamina`-Aufrufstellen wurden geprüft und sind sauber).

---

## 4) Save/Load & Determinismus

### 4.1 `saveValidator`: erste Validierungsschleife lässt NaN/Infinity passieren

- **Datei:** `src/utils/saveValidator.ts:62-76`
- **Severity:** NIEDRIG · Konfidenz: hoch

Der Check `typeof val !== 'number'` akzeptiert NaN/Infinity. Für alle Felder wird das durch nachgelagerte `Number.isFinite`-Checks bzw. `finiteNumberOr` (Z. 79 für `day`) abgefangen — funktional korrekt, aber die zweistufige Konstruktion ist fragil: Ein neues numerisches Feld in `numericFields` ohne nachgelagerten Finite-Check wäre eine Lücke.

### 4.2 `rivalEngine`: ID-Generierung mit `Date.now()` + kleinem RNG-Suffix

- **Datei:** `src/utils/rivalEngine.ts:30`
- **Severity:** NIEDRIG · Konfidenz: hoch

`` id: `rival_${Date.now()}_${Math.floor(rng() * 1000)}` `` — läuft im Action-Creator-Layer (zulässig), aber das 1/1000-Suffix ist kollisionsanfällig. `getSafeUUID()` wäre konsistenter mit dem Rest der Codebase.

### 4.3 Verifiziert korrekt (Determinismus-Architektur)

Kein Handlungsbedarf, dokumentiert als Audit-Ergebnis:

- `advanceDay()` pre-rollt `dayRngStream` + `nextRngSeed` korrekt (Stream-Größe: `assetCount * 2 + 8`); der Reducer fällt nur bei fehlendem Payload auf `getSafeRandom` zurück.
- Kein `Math.random`/`Date.now` in Daily-Tick-Pure-Functions; `dailyTickLogic`, `socialEngine`, `assetTicks` sind sauber parametrisiert; Stream-Erschöpfung fällt auf neutralen Wert 1.0 (kein Trigger) zurück.
- `mulberry32`, `nextSeed`, Fisher-Yates-Shuffle: korrekt, keine Off-by-one-Bias.
- Prototype-Pollution-Schutz (`FORBIDDEN_KEYS`, `Object.hasOwn`, `safeJsonParse`-Reviver, Template-Resolver) durchgängig konsistent.

---

## 5) i18n / Lokalisierung

### 5.1 Key-Parität EN ↔ DE: vollständig synchron

Alle 10 Namespaces, 4.463 Keys pro Locale — **0** fehlende Keys in beide Richtungen, Pluralisierungs-Suffixe (`_one`/`_other`) und Interpolations-Platzhalter konsistent.

### 5.2 37 unübersetzte Einträge in der deutschen `featureList`

- **Datei:** `public/locales/de/ui.json` (`featureList.sec*`)
- **Severity:** NIEDRIG · Konfidenz: hoch

Identische EN-Texte mit offensichtlichen deutschen Entsprechungen, u. a.: `sec0.items.1` „Main Menu“, `sec0.items.10` „Settings“, `sec0.items.11` „Credits“, `sec21.items.0` „Save/Load“, `sec19.items.1` „Daily Upkeep / Living Costs“, `sec14.items.3` „Pending Events Queue“, mehrere `secN.title`/`description` (z. B. sec13 „14. Quests“, sec20 „21. Leaderboards“). Die DE-featureList ist nur teilweise übersetzt. (Programmatisch verifiziert: 37 echte Text-Duplikate nach Abzug von Eigennamen/Anglizismen.)

### 5.3 Einzelfall: `events.json flat_battery.opt1.label`

„Jump start [-1h]“ in beiden Locales — deutsch wäre „Starthilfe“. Konfidenz: mittel (könnte gewollter Anglizismus sein).

---

## 6) Verifizierte Invarianten (sauber, kein Befund)

Geprüft und ohne Befund — zur Abgrenzung des Audit-Umfangs:

- **Action-Wiring:** Alle in `actionTypes.ts` definierten Action-Types sind in der `gameReducer`-Dispatch-Tabelle verdrahtet (programmatischer Diff, 0 Lücken in beide Richtungen).
- **Minigame-Completion:** Keiner der vier Completion-Handler ändert `currentScene` (per Tests in `tests/node/minigameReducer.test.js` abgesichert).
- **`START_GIG`** resettet `gigModifiers` auf `DEFAULT_GIG_MODIFIERS` (`gigReducer.ts:67`).
- **`currentGig`:** Keine `currentGig?.venue`-Zugriffe in der gesamten Codebase.
- **Audio-Timing:** `Tone.now()`-Aufrufe existieren nur innerhalb `src/utils/audio/` (Engine-intern); Rhythm-Game-Hooks nutzen durchgängig `getGigTimeMs()`. End-Detection nutzt `setlistCompleted` + `isNearTrackEnd`; kein `audioPlaybackEnded`-Code. Kein Howler.
- **Hit-Windows:** Perfect-Fenster (`<= hitWindow * 0.4`) ist dokumentiert inklusiv und Teilmenge des exklusiven checkHit-Fensters — kein Boundary-Gap.
- **Gig-Report:** Miss-Penalty landet im Expense-Breakdown, `net = income.total − expenses.total` wird neu berechnet (`performanceLogic.ts:72-88`); `calculateContinueStats` wendet exakt `financials.net` an. Gig-Net inkl. Dampener/Overage stimmt ab.
- **`MODIFIER_COSTS`:** Einzige Preisquelle für PreGig-Modifier; keine UI-Duplikate.
- **Travel-Affordability:** `checkTravelResources` prüft `totalCashImpact` (Reisekosten + `getTotalDailyObligations`); Bestätigungs-Toast zeigt travelCost/dailyCost/totalCost getrennt an. Zwei getrennte Arrival-Pfade (`useTravelActions` direkt, `useArrivalLogic` nach Minigame), jeweils genau ein `advanceDay()` mit Re-Entry-Guard.
- **Unlock-Split:** Keine Persistenz-Logik in `unlockCheck.ts`, keine Evaluations-Logik in `unlockManager.ts`.
- **Leaderboards:** Submission über `SONGS_BY_ID.get(songId)?.leaderboardId` mit Missing-Entry-Filterung.
- **Consumables:** `inventory_add`-Items werden nirgends als `OWNED` angezeigt (`!item.stackable`- bzw. `val === true`-Guards in VoidTraderTab, ShopItem, DetailedStatsTab).
- **Currency:** Alle 70+ `formatCurrency`-Aufrufe übergeben die Sprache (`i18n.language`); kein `undefined`-Locale-Bake.
- **Farben:** Keine erfundenen Token-Aliase (`--color-void`, `--color-blood`, `--color-toxic-red`); Pixi-/SVG-Fallbacks leiten aus `BRAND_COLOR_HEX` ab. Keine `.propTypes`-Blöcke.
- **Listener-Hygiene:** `addEventListener`/`removeEventListener`-Parität in allen 17 betroffenen Dateien (Modal.tsx hat einen bewusst defensiven Doppel-Cleanup). Pixi-Teardown läuft zentral über `destroyPixiApp` + `removeAppTicker`.
- **Asset-Reducer-Purity:** `assetReducer.ts` ist pur (IDs aus Payload); DIY-Tiers ausschließlich via `buildDiyTier`; `getTotalDailyObligations` deckungsgleich mit den Tick-Helpers; Sell-Preview = Reducer-Berechnung (außer 2.4).
- **Daily-Tick Harmony:** `updateBandHarmony` normalisiert Harmony mit `finiteNumberOr` upfront (Kommentar referenziert die Invariante explizit).
- **socialReducer / eventReducer / questReducer:** vollständig gelesen, keine Logikfehler.

---

## 7) Abdeckungshinweis

Vollständig tief gelesen: alle Haupt-Reducer (`system`, `band`, `social`, `event`, `player`, `quest`, `asset`, `minigame` teilweise), Economy-Engine inkl. `assetTicks`/`assetSelectors`/`logisticsLogic`/`gigLogic`, Save-Validator, RNG-/Tick-Pfad, PostGig-Finanzlogik. Per gezielter Invarianten-Prüfung (Greps + Stichproben-Reads) abgedeckt: Rhythm-Game-Hooks, Stage-/Pixi-Lifecycle, Travel-/Arrival-Hooks, UI-Komponenten, Locales. **Nicht** zeilenweise gelesen: die einzelnen Minigame-Komponenten (`amp`, `roadie`, `tourbus`, `kabelsalat`-Szenen), Quest-Producer und Chatter-Daten — dort sind nur die dokumentierten Invarianten verifiziert.

## 8) Empfohlene Priorisierung

1. **1.1–1.3** zusammen fixen (Stash-Sanitization kanonisieren + zwei fehlende `finiteNumberOr`) — ein PR, schließt die NaN-Pfade an der Wurzel.
2. **2.1** (`fameLevel` im Crowdfund-Tick) — Einzeiler, direkter Gameplay-Effekt.
3. **2.2 / 2.3** (Kredit-Schlussrate, Fuel-Doppelrabatt) — Economy-Korrektheit, braucht kurze Balance-Abwägung.
4. **2.5** (Crowdfund-Doppelauszahlung) — zuerst Design-Entscheidung, dann ggf. Fix + Testanpassung.
5. **Abschnitt 3** (Harmony-`??`-Muster) — mechanischer Sweep, geringes Risiko.
6. **5.2** (DE-featureList) — reine Übersetzungsarbeit.
