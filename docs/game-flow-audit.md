# NEUROTOXIC – Tiefen-Audit des Game-Flows

**Datum:** 2026-06-21
**Branch:** `claude/wonderful-allen-mhqwwi`
**Scope:** Vollständiger Spiel-Flow – Szenen-Transitions/State-Machine, Ökonomie & Daily-Tick/Travel/Bankrott, Gig- & Minigame-Loop, State-Safety/Payload-Sanitization/Persistence.
**Methode:** Vier parallele Audits über `src/`, jeweils gegen die in `AGENTS.md`/`CLAUDE.md` dokumentierten Invarianten verifiziert. Zentrale Behauptungen wurden per Grep/Read im Code gegengeprüft.

---

## Gesamtbild

Der Codebase ist **sehr diszipliniert**. Die dokumentierten Invarianten werden über alle vier untersuchten Bereiche hinweg weitgehend eingehalten:

- `START_GIG` setzt `gigModifiers` korrekt zurück.
- Gameplay-Timing nutzt `audioEngine.getGigTimeMs()`; End-Detection via `setlistCompleted` + `isNearTrackEnd`.
- Leaderboards submitten `leaderboardId`, nie die rohe `songId`.
- Bankrott und Travel konsultieren `getTotalDailyObligations(state)`.
- `advanceDay(state)` wird ausschließlich über den typisierten Action-Creator mit RNG-Payload dispatcht.
- Gig-Report `net` = Einnahmen − Ausgaben (keine versteckten Abzüge).
- Arithmetik-dann-Clamp wickelt Addends in ~55 von ~58 Stellen korrekt mit `finiteNumberOr` ein (drei Ausnahmen siehe M6–M8); Sanitizer nutzen ganz überwiegend `Number.isFinite`/`isFiniteNumber`.
- Prototype-Pollution wird über `isForbiddenKey` / `Object.hasOwn` / `safeJsonParse`-Reviver abgewehrt.

**Es wurden keine aktiven Korrektheits-Bugs (HIGH) gefunden.** Die wichtigsten Befunde sind _latente_ Zustands-Inkonsistenzen und **toter Code**, die heute durch nachgelagerte Überschreibungen maskiert werden, aber bei künftigen Pfaden (Debug-Sprünge, neue Exit-Buttons, manipulierte Saves) zu echten Fehlern werden können.

### Wichtige Korrektur zweier vorläufiger Befunde

Ein erster Audit-Durchlauf meldete fälschlich (a) eine `currentGig?.venue?.id`-Fehlnutzung in `PreGig.tsx` und (b) direkte `Tone.now()`-Reads im Gameplay-Timing. **Beide wurden im Code widerlegt:**

- `currentGig?.venue` existiert **nirgends** in `src/` – nur in den Doku-Warnungen (`AGENTS.md:139`, `.github/copilot-instructions.md:78`).
- Alle `Tone.now()`-Reads liegen ausschließlich in der Audio-Engine-Schicht selbst (`src/utils/audio/{sfx,transportControl,midiPlayback}.ts`); das Gameplay nutzt `getGigTimeMs()` (`rhythmGameLoopUtils.ts:149`, `useRhythmGameScoring.ts:281`, `useRhythmGameInput.ts:58`).

Diese beiden Punkte sind **keine** Auffälligkeiten.

---

## Befunde nach Severity

### HIGH

#### H1 — `SETTINGS`-Szene ist unerreichbar (toter Code), aber als gültiger Pfad getestet

- **Ort:** `src/scenes/Settings.tsx`, Route `src/components/SceneRouter.tsx:76`, Konstante in `gameConstants.ts`.
- **Befund (verifiziert):** Es existiert kein einziger `changeScene(GAME_PHASES.SETTINGS)`-Aufruf in `src/`. Die einzigen Referenzen sind die Konstantendefinition, der Routen-Case und `App.tsx:28` (HUD-Suppression-Set). Die tatsächlichen In-Game-Settings leben als **BandHQ-Tab** (`src/ui/bandhq/BandHQContentArea.tsx:203`, `BandHQTabsList.tsx:34`). Der `usePersistence.ts:45`-Treffer ist ein localStorage-Key, kein Navigationsziel.
- **Verschärfend:** `tests/node/goldenPath.test.js:553-557` asserted `MENU → SETTINGS` als gültige Transition und kodifiziert damit einen Pfad, den die reale UI niemals auslöst.
- **Warum es zählt:** Szene, Route und Komponente sind Wartungs-Ballast; der Test vermittelt falsche Sicherheit. Künftiges Vertrauen darauf, dass Settings „verdrahtet" ist, schlägt still fehl.

### MEDIUM

#### M1 — `currentGig` wird beim Gig-Ende nie geleert (latente Zustands-Korruption)

- **Ort:** `useContinueHandler.ts:201-203` (POST_GIG → OVERWORLD), `useGigSession.ts:75-116`/`endGig`; `setCurrentGig(null)` wird nie aufgerufen (nur `initialState.ts:237` setzt es initial null).
- **Befund:** Nach Gig-Abschluss bzw. nach PRACTICE bleibt `currentGig` mit dem zuletzt gespielten Venue (bzw. `{ isPractice: true, sourceScene }`) gesetzt. Heute maskiert, weil der Overworld-Arrival-Pfad `currentGig` vor jedem Wiedereintritt via `startGig` überschreibt. Die `!currentGig`-Guards (`Gig.tsx:32-42`, `usePreGigLogic.ts:295-300`) schützen nur gegen _fehlenden_, nicht gegen _veralteten falschen_ Gig.
- **Warum es zählt:** Jeder Pfad, der GIG/PRE_GIG ohne vorheriges `startGig` erreicht (künftiger Debug-Sprung, Save-Edge-Case), läuft still gegen das vorherige Venue. Das stale `isPractice`-Flag ist besonders riskant, da es Reward-/Unlock-Logik ändert (`gigReducer.ts:205`, `useGameDispatchActions.ts:414`).

#### M2 — Abgebrochenes Setup-Minigame lässt `minigame.active = true` (und `currentGig`) stehen

- **Ort:** `handleChangeScene` (`src/context/reducers/sceneReducer.ts:25-39`) mutiert nur `currentScene`, räumt weder `minigame` noch `currentGig` auf.
- **Befund:** Verlässt der Spieler eine Roadie-/Kabelsalat-/Amp-Szene ohne Abschluss (Browser-Back oder ein künftiger Exit-Button), bleibt `minigame.active = true`. Heute maskiert, weil (a) diese Szenen keinen In-App-Exit-to-Overworld bieten und (b) das nächste `handleStartGig`/`handleStart*Minigame` via `...DEFAULT_MINIGAME_STATE` zurücksetzt und `handleLoadGame` hart auf OVERWORLD resettet.
- **Warum es zählt:** Latente, nicht aktive Inkonsistenz. Jede neue „Setup abbrechen"-UI würde inkonsistenten State ohne Cleanup offenlegen.

#### M3 — `processAssetTick`-Geld-Addend ist nicht mit `finiteNumberOr` umwickelt

- **Ort:** `src/utils/assetTicks.ts:94` (`money: state.player.money + moneyDelta`) und `:100`.
- **Befund:** Einzige Geld-Arithmetik in der Day-Pipeline, die die AGENTS.md-Regel `finiteNumberOr(addend, fallback)` _nicht_ befolgt. Wäre `moneyDelta`/`money` je nicht-finit, überlebt der NaN bis `clampPlayerMoney(NaN) = 0` und nullt still das gesamte Guthaben, statt es zu erhalten.
- **Mitigation (heute geschlossen):** `baseUpkeep`/`baseDailyRevenue` werden beim Laden sanitisiert (`assetSanitizers.ts:302-303`), `state.player.money` ist reducer-seitig stets finit geclampt. Trotzdem empfohlen für Defense-in-Depth, konsistent mit allen umliegenden Clamp-Stellen.

#### M4 — Save-Pfad kann `NaN`/`Infinity` nach localStorage schreiben (Sanitization ist load-only)

- **Ort:** `src/context/usePersistence.ts` – `JSON.stringify(state)` ohne Write-Time-Finite-Check.
- **Befund:** Sanitization ist asymmetrisch nur beim Laden. Ein künftiger Reducer-Regress, der einen nicht-finiten Wert einführt, würde beim Speichern zu `null` (via `JSON.stringify`) und beim Laden via `finiteNumberOr` still zum Fallback – Korruption wird maskiert statt sichtbar gemacht.
- **Warum es zählt:** Geringe Wahrscheinlichkeit angesichts der Reducer-Disziplin, aber die Asymmetrie ist eine latente Lücke.

#### M5 — ~~`relationships`-Self-Key wird beim Laden nicht defensiv entfernt~~ **[WIDERLEGT]**

- **Ort:** `sanitizeBand` in `src/context/reducers/sanitizers/stateSanitizers.ts:992-1022`.
- **Korrektur:** Der ursprüngliche Befund war **falsch**. `sanitizeBand` baut `selfRelationshipKeys = new Set([id, id.toLowerCase(), name, name.toLowerCase()])` (`:992-996`) und übergibt es als `ignoredKeys` an `parseNumericStats` (`:1018-1022`). Dort werden sowohl der exakte (`:748`) als auch der lowercased Key (`:750-751`) übersprungen. Ein geladenes `relationships[selfId]` wird also bereits **beim Laden** gestrippt – der Hostile-Save-Vektor ist geschlossen.
- **Status:** Kein Befund. Hier ist keine Folgearbeit nötig.

#### M6 — Arithmetik-dann-Clamp mit `??` statt `finiteNumberOr` (lässt `NaN` durch) — Band-Harmony bei PostGig

- **Ort (verifiziert):** `src/utils/postGig/socialResolution.ts:233-234` – `const prevHarmony = newBand.harmony ?? 1` gefolgt von `clampBandHarmony(prevHarmony + result.harmonyChange)`.
- **Befund:** `newBand.harmony` ist persistierter State. Bei `NaN` lässt `??` den Wert durch, der Clamp kollabiert auf 0, der `result.harmonyChange` geht still verloren und das gemeldete `appliedHarmonyDelta` wird korrupt. AGENTS.md: „`??` ist kein Ersatz". Fix: `finiteNumberOr(newBand.harmony, 1)`.

#### M7 — Arithmetik-dann-Clamp mit `??` statt `finiteNumberOr` — Quest-Loyalty-Penalty

- **Ort (verifiziert):** `src/domain/questPenalties.ts:180-181` – `clampLoyalty((nextState.social.loyalty ?? 0) + penalty.amount)`.
- **Befund:** `social.loyalty` ist persistierter State, mit `??` statt `finiteNumberOr` umwickelt; `NaN` lässt die Penalty fallen (kollabiert auf 0). **Direkt darunter** (`:187-188`, `band.harmony`-Case) wird es korrekt mit `finiteNumberOr(nextState.band.harmony, 1)` gemacht – klare Inkonsistenz innerhalb derselben Funktion.

#### M8 — Bares `typeof === 'number'` als Validitätsfilter (lässt `NaN`/`Infinity` durch) — Brand-Deals

- **Ort (verifiziert):** `src/context/reducers/socialReducer.ts:224` – `typeof d.remainingGigs === 'number'` filtert `activeDeals`-Einträge in `UPDATE_SOCIAL`.
- **Befund:** Ein Deal mit `remainingGigs: NaN`/`Infinity` passiert den Filter und wird persistiert – widerspricht der dokumentierten Sanitizer-Regel (`Number.isFinite`). Nachgelagerte `remainingGigs`-Countdown-/`> 0`-Logik kann fehlverhalten.

### LOW

#### L1 — Minigame-Szenen ohne Cancel/Back; Timeouts erzwingen Vorwärts-Advance in den Gig

- **Ort:** `useRoadieLogic.ts:179` (10 s Failsafe), `useAmpLogic.ts:378`; TourbusScene/RoadieRunScene/AmpCalibrationScene/KabelsalatScene.
- **Befund:** Kein Escape-Pfad zurück nach OVERWORLD/PRE*GIG. Ein abgebrochenes Minigame \_advanced via Timeout in den GIG*, statt abzubrechen – inkonsistenter Exit-Vertrag gegenüber CLINIC/ASSETS (die explizite „Leave"-Buttons haben). Keine State-Korruption, aber UX-Inkonsistenz.

#### L2 — `useRoadieLogic` ohne lokalen Idempotenz-Guard

- **Ort:** `src/hooks/minigames/useRoadieLogic.ts` (kein `finishCalledRef`, anders als `useAmpLogic:580`, `useTourbusLogic:293`).
- **Befund:** `completeRoadieMinigame` kann aus drei Pfaden dispatcht werden (Delivery, Traffic-Crash, passiver Contraband-Schaden bei 100). Schutz hängt allein am Reducer-Replay-Guard (`minigameReducer.ts:596-601`). Heute sicher, aber Single-Point-of-Defense gegen Doppel-Reparaturkosten/-Contraband-Consume statt Belt-and-Suspenders wie die anderen Minigames.

#### L3 — Reducer-`currentScene`-Writes sind implizite Seiteneffekte von Nicht-Szenen-Actions

- **Ort:** `gigReducer.ts:66` (`START_GIG` → PRE_GIG), `minigameReducer.ts:65/353/379/509` (Start-Handler), `systemReducer.ts:151` (`LOAD_GAME` → OVERWORLD), `systemReducer.ts:551` (Bankrott → GAMEOVER).
- **Befund:** Alle korrekt über Action-Creators erreicht und konform zum „alles via Action-Creators"-Modell. Geflaggt, weil Szenenwechsel hier implizite Seiteneffekte von `START_GIG`/`LOAD_GAME`/`ADVANCE_DAY` sind statt eines expliziten `CHANGE_SCENE` – leicht zu übersehen.

#### L4 — `lastGigStats` wird nach POST_GIG nie geleert

- **Ort:** `handleSetLastGigStats(null)` existiert (`gigReducer.ts:171-176`), wird aber im Continue/Exit-Flow nie aufgerufen.
- **Befund:** Stale Post-Gig-Stats bleiben nach Rückkehr in OVERWORLD im State. Heute benign (PostGig rechnet Financials bei Eintritt neu), gleiche Latent-State-Kategorie wie M1.

#### L5 — Bankrott bei negativem Guthaben ist effektiv unerreichbar

- **Ort:** `shouldTriggerBankruptcy`, `logisticsLogic.ts:228` (`val < 0`-Branch); `clampPlayerMoney` floort bei 0 (`clamps.ts:152`).
- **Befund:** Jeder durch einen Reducer gelaufene State kann nie negatives Geld zeigen, daher triggert Bankrott nur über den `val === 0 && income − obligations < 0`-Branch. Kein Bug (Kommentar erkennt es an), aber die „negative Schulden sind fatal"-Semantik ist im Live-Pfad unerreichbar; ein Spieler kann unbegrenzt bei exakt 0 sitzen, solange `income ≥ obligations`.

#### L6 — `isNearTrackEnd`-Threshold vs. sehr kurze Tracks

- **Ort:** Audio-End-Detection, `rhythmGameLoopUtils.ts:200-205`.
- **Befund:** Ist eine Songdauer kürzer als das `isNearTrackEnd`-Lookahead-Fenster, kann „near end" ab t=0 true sein und den Setlist-Eintrag vorzeitig abschließen. Geringe Praxis-Wirkung (echte Songs sind lang genug), relevant v. a. für Test-/Kurz-Fixtures.

#### L7 — Bares `typeof === 'number'`-Guard in Asset-/System-Sanitizern

- **Ort:** `src/context/reducers/assetSanitizers.ts:357` (`crowdfundFamePromised`) und `src/context/reducers/systemReducer.ts:528` (`stacks` bei Stash-Contraband-Reaktivierung).
- **Befund:** Beide nutzen `typeof x === 'number'` statt `Number.isFinite`/`isFiniteNumber`. assetSanitizers ist funktional sicher (innerer `finiteNumberOr`-Wrap), setzt aber bei `NaN` das optionale Feld auf 0 statt es wegzulassen. systemReducer schreibt einen `NaN`-`stacks` unverändert zurück. In-State-Werte, daher geringes Risiko – aber Konventionsverstoß.

#### L8 — `sanitizePrimitiveOptions` ohne `isForbiddenKey`-Filter (Prototype-Pollution-Konsistenzlücke)

- **Ort:** `src/context/reducers/toastSanitizers.ts:53-69`.
- **Befund:** Iteriert `Object.entries(options)` und kopiert jeden primitiven Key per Bracket-Assignment in ein `{}` – **ohne** `isForbiddenKey`-Filter, anders als `copySafePrimitiveObject` (`stateSanitizers.ts:126`). Verwendet auf persistierte Toast-Options und rohe Success-Toast-Payloads. Exploitability begrenzt (nur Primitives passieren; `obj['__proto__'] = primitive` ist ein No-Op), aber inkonsistente Verteidigung und Konventionsverstoß.

### INFORMATIONAL / By Design

- **PRACTICE-Loop** ist nur aus BandHQ erreichbar (`SetlistTab.tsx:216`), nicht aus dem dokumentierten Kern-Loop – intendierter Seiten-Loop; Exit in `endGig` korrekt behandelt.
- **Modifier-Kosten werden bei PostGig verrechnet, nicht bei PreGig.** `handleStartShow` (`usePreGigLogic.ts:404`) berechnet nur ein Affordability-Gate, zieht nichts ab; die Verrechnung erfolgt in `calculateGigExpenses` bei Settlement. Folge: Modifier sind faktisch „kostenlos wählbar", wenn der Gig vor Settlement abgebrochen wird. Dokumentiert intendiert – zur Bestätigung notiert.
- **RNG-getriebene Daily-Money-Effekte** (`dailyTickLogic.ts:37-39` Newsletter-Merch-Perk, `:46-59` wealth-scaled Drain) sind in `getTotalDailyObligations` nicht enthalten und damit bei Travel-Confirmation nicht exakt offengelegt. Vertretbar: die Invariante deckt _garantierte_ Verpflichtungen ab; die disclosed-Zahl ist eine Untergrenze.
- **Post-Gig-Bankrott-Check** nutzt Obligations, die in PostGig nicht tatsächlich abgebucht werden (PostGig ruft kein `advanceDay()`). Konservativ (fällt früher Richtung Game-Over) und konform zur Invariante.
- **GAMEOVER ist gegen Überschreibung geschützt** (`useArrivalLogic.ts:98-101`).
- **Keine echten Dead Ends** gefunden: jede betretbare Szene hat einen sauberen Exit; der FINALE-Node wird via POST_GIG → GAMEOVER-Sieg geroutet.

---

## Empfohlene Priorisierung

1. **H1** – `SETTINGS`-Szene/Route/Komponente entfernen _oder_ verdrahten; den irreführenden goldenPath-Test entsprechend anpassen.
2. **M1 / M2 / L4** – Explizites Cleanup beim Gig-/Minigame-Exit: `currentGig`, `lastGigStats` und `minigame`-State beim Verlassen leeren (z. B. eigene `ABANDON_GIG`/Cleanup-Action), statt sich auf nachgelagerte Überschreibungen zu verlassen.
3. **M6 / M7 / M8** – Konkrete Konventionsverstöße beheben: `??` → `finiteNumberOr` in `socialResolution.ts:233` und `questPenalties.ts:181`; `typeof === 'number'` → `Number.isFinite` in `socialReducer.ts:224`. Kleine, lokale, klar definierte Fixes.
4. **M3 / M4** – Defense-in-Depth: Addend in `assetTicks.ts` mit `finiteNumberOr` umwickeln; Write-Time-Finite-Guard in der Persistence. (M5 ist widerlegt – keine Arbeit nötig.)
5. **L1 / L2 / L7 / L8** – Konsistenter Exit-Vertrag für Minigames; lokaler Idempotenz-Guard in `useRoadieLogic`; `isForbiddenKey`-Filter in `sanitizePrimitiveOptions`; Sanitizer-Guards auf `Number.isFinite` vereinheitlichen.
6. **L3 / L5 / L6 — Nur dokumentieren, keine Code-Änderung nötig:** L3 (implizite `currentScene`-Writes) ist konform und nur als Lesbarkeits-/Auffindbarkeits-Hinweis geführt; L5 (unerreichbarer Negativ-Guthaben-Bankrott) ist toter, aber harmloser Defensiv-Branch; L6 (`isNearTrackEnd`-Lookahead bei sehr kurzen Tracks) ist praktisch nur für Test-/Kurz-Fixtures relevant. Optional: ein Guard für L6, falls Kurz-Fixtures eingeführt werden.

---

_Dieses Audit ist rein analytisch – es wurden keine Quelldateien verändert. Zeilennummern beziehen sich auf den Stand des Branches zum Audit-Zeitpunkt._
