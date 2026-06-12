# Travel-System-Audit

Stand: 2026-06-12 · Untersuchter Umfang: Tanken/Verbrauch, Van-Verschleiß & Pannen,
Reisekosten, Overworld-Nodes & Map-Graph, Ankunftslogik (mit/ohne Minigame),
Soft-Lock-Erkennung ("zu wenig Geld zum Reisen"), Transport-Events, i18n.

Untersuchte Kernmodule:

- `src/hooks/travel/*` (useTravelActions, useTravelEffects, useVanMaintenance, types)
- `src/utils/travelUtils.ts`, `src/utils/mapUtils.ts`, `src/utils/mapGenerator.ts`
- `src/utils/economy/logisticsLogic.ts`, `src/utils/economy/constants.ts`, `minigameLogic.ts`
- `src/utils/arrivalUtils.ts`, `src/hooks/useArrivalLogic.ts`, `src/utils/dailyTickLogic.ts`
- `src/context/reducers/minigameReducer.ts` (Travel-Minigame), `systemReducer.ts` (advanceDay)
- `src/data/events/transport.ts`, `src/data/upgradeCatalog.ts`, `src/data/hqItems.ts`
- `src/scenes/Overworld.tsx`, `TourbusScene.tsx`, `src/components/overworld/*`

i18n: Alle 29 im Travel-Code referenzierten `ui:`-Schlüssel sind in EN und DE vorhanden.

---

## 1. Kritische Befunde

### 1.1 ✅ ERLEDIGT — Der Nicht-Minigame-Ankunftspfad ist toter Code — und nur er trägt Quests, Rivalen und Stamina-Regen

> **Fix:** `handleCompleteTravelMinigame` emittiert jetzt `travel.completed`
> (Quest-Fortschritt, u. a. `quest_tourbus_inspection`) und wendet den
> `travelStaminaRegen`-Asset-Modifier an; `useArrivalLogic.handleArrivalSequence`
> führt Rival-Band-Bewegung + Encounter-Check aus. Der Legacy-Pfad bleibt als
> Fallback bestehen (Event-Policy-Differenz s. u. weiterhin offen).

`Overworld.tsx:95` übergibt **immer** `onStartTravelMinigame: startTravelMinigame`. In
`startTravelSequence` (`useTravelActions.ts:300-303`) führt das zu einem frühen Return —
das Tourbus-Minigame ist der einzige reale Reisepfad. Die gesamte Kette
TravelingVan-Animation → Failsafe-Timeout → `onTravelComplete`
(`useTravelActions.ts:129-261`, `TravelingVan.tsx:35`) läuft in Produktion nie.

Der echte Pfad ist stattdessen: `COMPLETE_TRAVEL_MINIGAME`-Reducer
(`minigameReducer.ts:75-300`, zieht Geld/Sprit ab, bewegt den Spieler) →
`useArrivalLogic.handleArrivalSequence` (advanceDay, Events, Node-Arrival).

Nur im toten `onTravelComplete`-Pfad existieren aber:

| Feature | Nur im toten Pfad | Folge im echten Spiel |
| --- | --- | --- |
| `travel.completed`-Quest-Event (`useTravelActions.ts:230-236`) | ja | **`quest_tourbus_inspection` (2× `travel.completed`) kann nie Fortschritt machen** — ironischerweise gerade das Quest, das einen Tourbus voraussetzt. Kein anderer Code emittiert dieses Event. |
| Rival-Band-Bewegung + Encounter (`useTravelActions.ts:225-226`) | ja | Die Rival-Band bewegt sich beim Reisen nie und Encounters feuern nie. |
| `travelStaminaRegen`-Asset-Modifier (`travelUtils.ts:299-311`) | ja | Tourbus-Module, die Stamina-Regeneration beim Reisen versprechen, sind wirkungslos. |
| Ressourcen-Re-Check bei Ankunft (`useTravelActions.ts:185-201`) | ja | Der Reducer clamp-t stattdessen still auf 0 € (`minigameReducer.ts:114-116`). |

Zudem widersprechen sich die Event-Policies der beiden Pfade: der tote Pfad feuert
Travel-Events auch an Gig-Nodes (`includeGigNodes: true`, `useTravelActions.ts:221-223`),
der echte Pfad überspringt Gig-Ziele (`useArrivalLogic.ts:88`, Default-Policy).

### 1.2 ✅ ERLEDIGT — Soft-Lock "zu wenig Geld zum Reisen" wird nicht erkannt

> **Fix:** `checkSoftlock` prüft Nachbarn jetzt auf Sprit **und** Cash
> (Reisekosten + Tagesobligationen, von `useTravelEffects` via
> `getTotalDailyObligations`/`getActiveAssetModifiers` zugeliefert). Die
> Gig-Ausnahme umfasst GIG/FESTIVAL/FINALE und respektiert `lastGigNodeId`;
> eine machbare Blood-Bank-Spende und ein bezahlbarer Refuel, der einen
> Nachbarn erreichbar macht, entschärfen das Stranded-Urteil; der FINALE-Node
> wird nie als gestrandet gemeldet. Regressionstests in
> `tests/node/mapUtils.test.js`.

`checkSoftlock` (`mapUtils.ts:101-183`) prüft ausschließlich **Sprit**: erreichbar ist ein
Nachbar, wenn `currentFuel >= fuelLiters`; gestrandet ist man nur, wenn zusätzlich der
Refuel unbezahlbar ist. Die Reise wird aber zusätzlich an
`money >= totalCashImpact` (Reisekosten **plus** Tagesobligationen, ≈ 130–160 € früh im
Spiel) gescheitert (`checkTravelResources`, `useTravelActions.ts:467-488`).

Konkretes Szenario: Tank voll, 50 € Cash, aktueller Node kein (bespielbarer) Gig.

- Reisen: blockiert („Not enough money for gas and food!").
- `checkSoftlock`: liefert `false` (Sprit reicht ja) → kein Game Over.
- Tage vergehen nur durch Reisen/Ankunft (`advanceDay` wird sonst nirgends auf der
  Overworld ausgelöst) → der tägliche Bankrott-Check (`systemReducer.ts:1964-1976`)
  läuft nie.
- Geldquellen ohne Reise: Pirate Radio (kostet 200 €), Merch Press (kostet 150 €+),
  Dark Web Leak (kostet Geld) — nur die **Blood Bank** zahlt aus, ist aber an
  Harmony > Kosten und Stamina ≥ Kosten+10 **aller** Mitglieder gebunden
  (`bloodBankUtils.ts:11-24`). Stamina regeneriert ohne Tageswechsel nicht.

Ergebnis: ein Spieler mit erschöpfter Band und < ~130 € hängt in einem endlosen Limbo —
kein Zug möglich, kein Game Over, keine Fehlermeldung außer dem Reise-Toast.

Weitere Lücken in `checkSoftlock`:

- Die GIG-Ausnahme (`mapUtils.ts:177`) gilt nur für `type === 'GIG'` — **nicht** für
  `FESTIVAL`/`FINALE` — und ignoriert `lastGigNodeId`: Wer am aktuellen Gig-Node gerade
  gespielt hat, kann dort nicht erneut auftreten (`useTravelActions.ts:363-372`), gilt
  aber trotzdem als „kann Geld verdienen".
- Umgekehrt ist der Check zu streng: Sprit leer + Refuel unbezahlbar löst nach 3 s ein
  hartes GAME OVER aus (`useTravelEffects.ts:52-66`), obwohl die Blood Bank das
  Refuel-Geld noch beschaffen könnte.
- Asset-Fuel-Modifier werden ignoriert (`calculateTravelExpenses` ohne
  `assetModifiers`, `mapUtils.ts:161-166`) und Zugangs-Blocks (Blacklist,
  Prove-Yourself-Modus) ebenfalls — ein „erreichbarer" Nachbar kann real gesperrt sein.

### 1.3 ✅ ERLEDIGT — `player.location`-Formatdrift bricht die regionale Buchungssperre

> **Fix:** `venues:<id>.name` bleibt das kanonische Anzeigeformat von
> `player.location` (so legt es die bestehende `migratePlayerLocation` fest).
> Stattdessen leitet der neue gemeinsame Helper
> `getRegionKeyForLocation` (`mapUtils.ts`) an **allen** Region-Grenzen den
> City-Key ab: Reputations-Schreibpfade (`gigReducer`), Region-Quest-Events
> (`useContinueHandler`), Quest-Rewards (`questEffects`), perRegion-Scope-
> Stamping (`questAcceptance`) und Financials-Lesepfad (`derivations`).
> Damit liest die Buchungssperre (`checkVenueAccess`, City-Key) dieselben
> Schlüssel, die geschrieben werden. Alte Saves werden beim Laden migriert:
> `reputationByRegion`-Keys und perRegion-Quest-Scopes (`systemReducer`).

Drei Schreibweisen für denselben Zustand:

- Initial: `'stendal'` — City-Key (`initialState.ts:43`)
- Echter Reisepfad: `'venues:<venue_id>.name'` — i18n-Key!
  (`minigameReducer.ts:157-166`, `nextLocation = canonicalVenueLocation`)
- Toter Reisepfad: City-Key via `getCityKeyFromVenueId` (`travelUtils.ts:289-290`)

Folge: `gigReducer` schreibt Regions-Reputation unter `reputationByRegion[player.location]`
(also unter `venues:berlin_so36.name`, `gigReducer.ts:241,269-289`), während
`checkVenueAccess` die Buchungssperre unter dem City-Key liest
(`reputationByRegion[getCityKeyFromVenueId(venueId)]`, also `berlin`;
`travelUtils.ts:186-197`). **Die regionale Booking-Refusal-Sperre (Reputation ≤ −30) kann
dadurch praktisch nie auslösen.** Nur die venue-spezifische Blacklist funktioniert, weil
`gigReducer` sie unter demselben (falsch formatierten) Key prüft und direkt setzt
(`gigReducer.ts:285-289`). Auch perRegion-Quest-Scopes und `cityStates`
(City-Key-basiert, `mapGenerator.ts:261-268`) arbeiten mit gemischten Formaten.

### 1.4 ✅ ERLEDIGT — `breakdownChance` und Van-Condition sind tote Mechaniken

> **Fix:** Die mechanischen Pannen-Events (`van_breakdown_tire`,
> `van_breakdown_engine`, `fuel_leak`, `flat_battery`, `tire_pressure_warning`)
> tragen jetzt `tags: ['breakdown']` und werden in der Event-Selektion mit
> `van.breakdownChance / BASE_BREAKDOWN_CHANCE` (0.05, Cap 4×) skaliert —
> derselbe Mechanismus wie Harmony-/Infighting-Damper. Damit wirken Condition
> (über den täglichen Multiplikator) und die Suspension-Upgrades (Faktor < 1)
> erstmals tatsächlich auf das Pannenrisiko; ein frischer Van behält die
> Author-Chancen. Test: `eventEngine.test.js`.

`breakdownChance` wird täglich aus Upgrades × Condition × Controversy berechnet
(`dailyTickLogic.ts:62-101`), bei Reparatur zurückgesetzt (`useVanMaintenance.ts:107-117`)
und in zwei UI-Tabs angezeigt — aber **nirgendwo gewürfelt**. Die Pannen-Events
(`van_breakdown_tire` 8 %, `van_breakdown_engine` 5 %, …, `transport.ts`) feuern mit
statischen Chancen, unabhängig von Zustand oder Pannenwahrscheinlichkeit.

Konsequenzen:

- `van_suspension` („Reduces chance of breakdowns by 20 %", `upgradeCatalog.ts:12-28`)
  und die `breakdownChance`-Effekte in `hqItems.ts:412,463` sind wirkungslos gekaufte
  Upgrades — das UI zeigt eine sinkende Zahl ohne Gameplay-Effekt.
- Van-Condition hat außer dem Reparaturpreis (6 €/%) keinerlei Wirkung: Condition 0
  blockiert weder Reisen noch erhöht es Eventrisiken. Verschleiß ist nur eine versteckte
  Geld-Senke (siehe 2.2).

### 1.5 ✅ ERLEDIGT — Kein Endzustand am FINALE-Node

> **Fix:** Der Post-Gig-Continue erkennt den FINALE-Node (`isFinaleGig` via
> `usePostGigLogic`), setzt das persistente `player.stats.tourCompleted` und
> routet auf den GameOver-Screen in neuer **Sieg-Variante** („TOUR COMPLETE",
> toxic-green) statt zurück in die Sackgassen-Overworld. Bankrott am Finale
> gewinnt weiterhin (Bankruptcy-Check läuft zuerst). Das Stranded-Urteil am
> FINALE war bereits mit Befund 1.2 deaktiviert worden.

Der Map-Graph ist ein streng vorwärts gerichteter DAG (`mapGenerator.ts:573-666`,
Verbindungen nur Layer i → i+1; `isConnected` prüft direktional, `mapUtils.ts:22-39`).
Der FINALE-Node hat keine ausgehenden Kanten, und `GAME_PHASES` kennt keinen
Sieg-/Endzustand (nur `GAMEOVER`). Nach dem Finale-Gig sitzt der Spieler auf einem Node
ohne Verbindungen:

- `checkSoftlock`: keine Nachbarn → bei vollem Tank ist `refuelCost` 0 →
  `money < 0` ist false → **kein** Stranded-Game-Over → endloses Limbo; bei leerem Tank
  und wenig Geld dagegen Stranded-GAME-OVER ausgerechnet nach dem Höhepunkt des Spiels.
- Es gibt keinen Code, der das FINALE als Spielende behandelt.

---

## 2. Mittlere Befunde / Inkonsistenzen

### 2.1 Geld-Klammerung statt Abbruch im echten Reisepfad

`handleCompleteTravelMinigame` zieht `totalCost` mit `clampPlayerMoney` ab
(`minigameReducer.ts:114-116`): Reicht das Geld (durch welchen Drift auch immer) nicht,
wird still auf 0 € geklemmt statt — wie im toten Pfad — die Ankunft abzubrechen. Zwei
gegensätzliche Fehlerstrategien für denselben Fall.

### 2.2 ✅ ERLEDIGT (Kommentar) — Täglicher Pauschal-Verschleiß −2 mit irreführendem Kommentar

> **Fix:** Der Kommentar in `dailyTickLogic.ts` beschreibt den Verschleiß jetzt
> korrekt als pauschalen Tages-Verschleiß (bewusst nicht distanzskaliert).
> Seit Befund 1.4 wirkt die Condition zudem real auf das Pannenrisiko.

`updateVanCondition` zieht **jeden Tag** 2 Condition ab — kommentiert als „wear from
daily travel" (`dailyTickLogic.ts:66-71`), unabhängig davon, ob gefahren wurde. Da Tage
ohnehin fast nur durch Reisen vergehen, ist das de facto „Verschleiß pro Reise", aber:
distanzunabhängig (20 km kosten so viel Condition wie 700 km) und zusätzlich zum
Minigame-Schaden (max. 50 Condition pro Fahrt, 50 %-Skalierung,
`minigameLogic.ts:13-39`). Effektiv versteckte ~12 €/Tag (2 × 6 € Reparatur).

### 2.3 `time`-Stat: akkumuliert, wirkt nie

Transport-Events ziehen „Stunden" ab (`stat: 'time', value: -2` …), der Delta-Handler
addiert unbegrenzt (`delta.ts:215-216` „time is unbounded", `eventEffectHandlers.ts:71-72`),
es gibt keinen Tages-Überlauf und keinen Konsumenten außer der Anzeige
`${player.time || '12'}:00` (`DetailedStatsTab.tsx:128`) — die bei `time === 0` durch das
`||` fälschlich „12:00" zeigt und bei negativen Werten „-3:00". Eine reine
Pseudo-Mechanik, die Spielern Konsequenzen suggeriert.

### 2.4 TEILWEISE ERLEDIGT — Tote Event-Flags und Legacy-Node-Typen

> **Update:** `VAN_DAMAGED`/`RENTAL_VAN` wurden aus den Transport-Events
> entfernt. Das Node-Typ-Naming (`supplyStop` vs. UPPER_CASE) und die
> Legacy-Typen `CITY`/`REST` sind separat adressiert (s. u.).

- `VAN_DAMAGED` und `RENTAL_VAN` werden von `van_breakdown_engine`/`van_critical_failure`
  gesetzt (`transport.ts:98,146`), aber nirgendwo gelesen.
- Node-Typ-Naming inkonsistent: `'supplyStop'` (camelCase) neben `'REST_STOP'`,
  `'SPECIAL'`, … (`mapGenerator.ts:560-565`).
- `ALLOWED_MAP_NODE_TYPES` erlaubt beim Laden `'CITY'` und `'REST'`
  (`systemReducer.ts:98-108`), für die `handleNodeArrival` keinen Case hat
  (Default-Warnung, `arrivalUtils.ts:293-300`).

### 2.5 Rückliegende Layer sind „sichtbar", aber nie bereisbar

`getNodeVisibility` markiert alle Layer ≤ aktuell+1 als `visible` (`mapUtils.ts:47-54`),
die Kanten sind aber strikt vorwärts gerichtet. Jeder Klick auf einen früheren Node
endet im „location not connected"-Toast — die Karte suggeriert Rückreisen, die das
System nicht kennt.

### 2.6 Doppelter Harmony-Regen pro Reisetag

Mit `van_sound_system` (`harmonyRegenTravel`) bekommt die Band pro Reise +5 bei Ankunft
(`processHarmonyRegen`, `useArrivalLogic.ts:75-78`) **und** +4 im selben advanceDay
(`dailyTickLogic.ts:325-329`) — zusammen +9, während die Beschreibung nur „recovers
Harmony while traveling" verspricht. Falls gewollt, undokumentiert; der tote Pfad
(`getTravelArrivalUpdates` +5, `travelUtils.ts:296-298`) hätte denselben Doppel-Effekt.

### 2.7 Save-Reihenfolge im echten Ankunftspfad

`handleArrivalSequence` speichert in Schritt 2 — **vor** Harmony-Regen, Travel-Events
und Node-Arrival (`useArrivalLogic.ts:69-118`). Der tote Pfad speichert als letzten
Schritt. Ein Reload direkt nach Ankunft verliert REST_STOP-Boni/Events.

### 2.8 Veralteter Doku-Kommentar

`hooks/travel/types.ts:25` („omit `applyQuestEvent` to skip quest progression")
beschreibt den toten Pfad; im echten Pfad gibt es gar keine Quest-Progression (1.1).

---

## 3. Kostenmodell — Beobachtungen (Balance)

- **Tanken:** Verbrauch 12 L/100 km, Preis 1,75 €/L, Tank 100 L (`constants.ts:74-77`).
  Distanz = `floor(√(dx²+dy²)·5)+20` auf Prozent-Koordinaten (Pseudo-km, min. 20 km
  selbst bei Distanz 0, `logisticsLogic.ts:26-40`). Maximaldistanz ≈ 727 km ≈ 87 L —
  eine volle Füllung schafft jede Einzelstrecke; Modifier: `van_tuning` −20 %,
  `road_warrior`-Trait −15 %, Asset-`fuelMultiplier`.
- **Reisekosten (Cash):** Essen 8 €/Person + Logistik 18 € Basis + 4 €/100 km +
  1,5 €/Fame-Level + Cash-Reserve-Gebühr (5 € je 1000 € Vermögen, Cap 45 €). Sprit wird
  korrekt **nicht** doppelt als Geld berechnet (explizit dokumentiert,
  `logisticsLogic.ts:139-141`).
- **Reise-Gate:** verlangt `totalCost + getTotalDailyObligations` — deckt die
  AGENTS-Vorgabe (Ankunft ruft `advanceDay`) sauber ab; der Bestätigungs-Toast
  legt alle Posten offen (`useTravelActions.ts:498-513`). ✓
- **Frühspiel-Marge:** Start 500 €, Tageskosten 86 € (62 Basis + 3×8), Reise-Cash-Impact
  ≈ 130–160 € → ohne erfolgreiche Gigs sind nach ~3 Reisen die Reserven weg; zusammen mit
  1.2 ist das die wahrscheinlichste Route in den unerkannten Soft-Lock.
- Refuel-/Repair-Aktionen sind überall im Menü verfügbar (kein Ortszwang) und korrekt
  als Konsum- vs. Pump-Preis getrennt (kein doppelter `fuelMultiplier`,
  `logisticsLogic.ts:172-187`). ✓

---

## 4. Was solide ist (Positivbefunde)

- Klare Trennung von Prüfschichten: Zugang (`checkVenueAccess`), Routing
  (`checkTravelPrerequisites`), Ressourcen (`checkTravelResources`) mit lokalisierten
  Fehlertexten; alle Travel-i18n-Keys existieren in EN+DE.
- Click-to-confirm mit 5-s-Fenster und vollständiger Kosten-Offenlegung.
- Payload-Hygiene durchgängig (`finiteNumberOr`, Clamps für Geld/Fuel/Condition,
  `isForbiddenKey` bei Reputations-Keys).
- Map-Generator garantiert Vorwärts- und Rückwärts-Erreichbarkeit jedes Layers
  (jeder Node hat Kind und Elternteil, `mapGenerator.ts:573-621`).
- Tourbus-Minigame-Schadenskonvertierung ist gegen übergroße Payloads gekappt
  (max. 50 Condition, dokumentiert) und Spritbonus/Void-Hazards sind deterministisch
  getestet.
- `useArrivalLogic` ist gegen Doppel-Ausführung pro Node geschützt (nodeId-Guard).

---

## 5. Priorisierte Empfehlungen

1. ✅ **Hoch:** Die Lücken des toten Pfads in den echten Pfad portieren:
   `travel.completed`-Quest-Event, Rival-Bewegung/Encounter und `travelStaminaRegen`
   in `handleArrivalSequence` bzw. den Minigame-Abschluss verlagern — oder den toten
   Pfad samt TravelingVan/Failsafe entfernen (1.1).
2. ✅ **Hoch:** `checkSoftlock` um die Geld-Dimension erweitern (kein Nachbar mit
   `money ≥ totalCashImpact` UND keine erreichbare Geldquelle) und die GIG-Ausnahme um
   FESTIVAL/FINALE + `lastGigNodeId` korrigieren; alternativ eine „Tag
   überspringen/Notverkauf"-Aktion als designtes Ventil einbauen (1.2).
3. ✅ **Hoch:** `player.location` auf ein kanonisches Format (City-Key) normalisieren —
   inkl. Save-Migration — damit Regions-Reputation, Buchungssperre und Quest-Scopes
   denselben Schlüssel verwenden (1.3). *Umgesetzt als zentrale City-Key-Ableitung
   an allen Region-Grenzen statt Formatwechsel von `player.location`, siehe 1.3.*
4. ✅ **Mittel:** `breakdownChance` tatsächlich würfeln (z. B. als Zusatz-Chance auf
   `van_breakdown_*` beim Reisen) oder die Mechanik samt irreführender
   Upgrade-Versprechen entfernen (1.4).
5. ✅ **Mittel:** Endzustand für das FINALE definieren (Sieg-Szene oder Loop-Neustart) und
   `checkSoftlock` am Finale deaktivieren (1.5).
6. **Niedrig:** `time`-Stat entfernen oder mit Wirkung versehen; tote Flags
   (`VAN_DAMAGED`, `RENTAL_VAN`) aufräumen; `supplyStop`-Naming vereinheitlichen;
   Verschleiß-Kommentar korrigieren oder Verschleiß distanzabhängig machen.
