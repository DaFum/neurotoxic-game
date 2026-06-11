# Logic-Audit — NEUROTOXIC Codebase

**Datum:** 2026-06-11
**Umfang:** Gesamte Codebase (`src/`, 566 Source-Dateien), geprüft in fünf Domänen:
State Management, Economy/Assets, Audio/Gig/Minigames, UI/i18n, Persistenz/Unlocks/Utils.
Geprüft wurde gegen die dokumentierten Projekt-Invarianten aus `AGENTS.md` sowie auf
allgemeine Logikfehler (Vorzeichenfehler, Off-by-one, invertierte Bedingungen,
Purity-Verletzungen, Stale-Closure-Probleme etc.).

Alle High-/Medium-Funde wurden im Quellcode gegenverifiziert. Drei ursprüngliche
Verdachtsfälle stellten sich dabei als False Positives heraus (siehe letzter Abschnitt).

---

## Zusammenfassung

| Schweregrad | Anzahl |
|---|---|
| Hoch | 1 |
| Mittel | 6 |
| Niedrig | 4 |

Die Codebase ist insgesamt in sehr gutem Zustand: Die meisten dokumentierten
Invarianten (Action-Konsistenz, Clamping mit `finiteNumberOr`, Reducer-Szenen-Regeln,
`MODIFIER_COSTS`, `CHASSIS_CONFIG`, Audio-Timing über `getGigTimeMs()`,
Prototype-Pollution-Schutz, RNG-Determinismus von `advanceDay`) sind eingehalten.

---

## Hoch

### H1 — `Date.now()` im Reducer-Pfad (Purity-/Determinismus-Verletzung)

**Datei:** `src/utils/gameState/delta.ts:613` und `:639`

```ts
if (now === 0) now = Date.now()
// ...
timestamp: rcr.timestamp ?? Date.now()
```

`applyEventDelta()` wird aus dem `APPLY_EVENT_DELTA`-Reducer aufgerufen. `Date.now()`
macht den Reducer nicht-deterministisch und verletzt die Projektregel, dass Reducer
pur sein müssen (vgl. das Muster bei `advanceDay`, das RNG-Daten im Payload
vorgeneriert). Banter-Event-Timestamps sollten analog im Action Creator vorab
erzeugt und über den Payload hereingereicht werden.

---

## Mittel

### M1 — Post-Gig-Bankrott-Check ignoriert tägliche Verpflichtungen

**Datei:** `src/hooks/postGig/handlers/useContinueHandler.ts:238`

```ts
if (shouldTriggerBankruptcy(stats.newMoney, financials.net)) {
```

Der dritte Parameter `totalDailyObligations` wird weggelassen (Default `0`).
Laut Invariante muss Bankrott `getTotalDailyObligations(state)` konsultieren
(Asset-Upkeep, Asset-Revenue, Liability-Zahlungen). Effekt: Steht der Spieler nach
dem Gig bei exakt 0 € mit nicht-negativem Gig-Netto, aber laufenden Verpflichtungen,
wird der Bankrott nicht ausgelöst, obwohl der tägliche Check (`systemReducer.ts:1908`)
ihn auslösen würde — inkonsistentes Verhalten zwischen den beiden Checks.

### M2 — `day`/`time` beim Laden nicht auf nicht-negativ geklemmt

**Datei:** `src/context/reducers/systemReducer.ts:662-663`

```ts
day: finiteNumberOr(playerData.day, DEFAULT_PLAYER_STATE.day),
time: finiteNumberOr(playerData.time, DEFAULT_PLAYER_STATE.time),
```

`finiteNumberOr` filtert nur `NaN`/`Infinity`, nicht negative Werte. Ein korruptes
oder manipuliertes Savegame mit `day: -5` passiert die Validierung und bricht
Meilenstein-Bedingungen (`state.player.day > 7`) sowie tagbasierte
Event-Cooldown-Logik.

### M3 — `saveValidator` klemmt nur `fame`/`score`, nicht `day`/`time`/`fameLevel`

**Datei:** `src/utils/saveValidator.ts:62-71`

```ts
if ((field === 'fame' || field === 'score') && val !== undefined) {
  p[field] = clampNonNegative(val as number)
}
```

Die Felder `day`, `time` und `fameLevel` werden nur als `number` typgeprüft, aber
nicht auf gültige Wertebereiche geklemmt. Zusammen mit M2 existiert damit auf
keiner der beiden Verteidigungsebenen ein Schutz gegen negative Werte.

### M4 — Spieler-Statistiken beim Laden nicht auf nicht-negativ geklemmt

**Datei:** `src/context/reducers/systemReducer.ts:717-738`

`totalDistance`, `conflictsResolved`, `stageDives`, `failedStageDives`,
`consecutiveBadShows` werden mit `finiteNumberOr` übernommen, aber ohne
`clampNonNegative`. Diese Werte fließen in Unlock-/Meilenstein-Checks mit
`>=`-Vergleichen ein; negative Werte aus korrupten Saves verfälschen die
Unlock-Eligibility dauerhaft.

### M5 — Nicht definierte Farb-Utility `text-pure-white`

**Datei:** `src/components/postGig/DealCard.tsx:72`

```ts
colorClass: 'text-pure-white'
```

In `src/index.css` (`@theme`) existiert nur `--color-star-white`, kein
`--color-pure-white`. Tailwind v4 generiert die Klasse daher nicht — der Text
rendert ohne die beabsichtigte Farbe. Korrekt wäre `text-star-white`.
(Hinweis: `text-hot-pink` in Zeile 60 ist dagegen gültig, da `--color-hot-pink`
in `@theme` definiert ist.)

### M6 — `getSafeUUID()` im Reducer (Purity-Verletzung)

**Datei:** `src/context/reducers/clinicReducer.ts:280`

```ts
const safeToast = sanitizeSuccessToast(successToast, {
  fallbackId: getSafeUUID(),
```

`getSafeUUID()` (crypto-basiert, `src/utils/crypto.ts:85`) wird innerhalb des
Reducers aufgerufen. Laut Projektregel müssen UUIDs in Action Creators
vorgeneriert und über den Payload gelesen werden (so wie es die Asset-Reducer
handhaben). Praktische Auswirkung gering (nur Fallback-Toast-ID), aber
inkonsistent mit der Purity-Invariante.

---

## Niedrig

### L1 — Unkonventionelle Parameter-Semantik beim täglichen Bankrott-Check

**Datei:** `src/context/reducers/systemReducer.ts:1910`

```ts
if (!shouldTriggerBankruptcy(state.player.money, -totalDailyObligations)) {
```

Die Verpflichtungen werden negiert als `netIncome` übergeben statt als dritter
Parameter `totalDailyObligations`. Mathematisch äquivalent
(`-x - 0 < 0` ⇔ `0 - x < 0`), also **kein Bug** — aber die Parameter werden
entgegen ihrer dokumentierten Bedeutung benutzt. Lesbarer und robuster gegen
künftige Änderungen der Funktion wäre
`shouldTriggerBankruptcy(state.player.money, 0, totalDailyObligations)`.

### L2 — Asymmetrische Grenzwert-Operatoren im Hit-Window

**Datei:** `src/utils/rhythmUtils.ts:347` vs. `:366`

Die Binärsuche nutzt `>= windowStart` (inklusiv), der eigentliche Hit-Check
`> windowStart` (exklusiv). Noten exakt bei `elapsed - hitWindow` werden gefunden,
aber verworfen. Verhalten ist konsistent korrekt, die uneinheitliche
Grenzsemantik sollte aber vereinheitlicht oder dokumentiert werden.

### L3 — Inkonsistente Operatoren Perfect-Hit vs. Hit-Window

**Datei:** `src/hooks/rhythmGame/useRhythmGameScoring.ts:347` vs. `:367`

Perfect-Hit nutzt `<= hitWindow * 0.4` (inklusiv), der allgemeine Hit `< hitWindow`
(exklusiv). Da das Perfect-Fenster eine Teilmenge ist, kein funktionaler Fehler —
nur eine Stil-Inkonsistenz an den exakten Grenzwerten.

### L4 — `as Record<string, unknown>`-Casts statt Narrowing

**Datei:** `src/utils/unlockCheck.ts:46, 66, 71`

```ts
const ctx = context as Record<string, unknown>
const gigStats = ctx.gigStats as Record<string, unknown>
```

Casts nach `typeof === 'object'`-Check statt sauberem Narrowing. Laufzeitsicher,
weil nachgelagerte Property-Checks existieren, widerspricht aber der
TypeScript-Regel „`unknown` an Boundaries narrowen, nicht casten".

---

## Geprüfte Invarianten — konform ✓

- **Action-Konsistenz:** Alle 72 Action-Types sind in `actionTypes`, Reducer-Mapping und `actionCreators` konsistent vorhanden.
- **`finiteNumberOr` an Arithmetik-Grenzen:** Mood-/Stamina-/Money-Arithmetik wrappt persistierte Operanden korrekt (Klemmung auf Wertebereiche s. M2–M4).
- **`fame`/`fameLevel`-Kopplung:** Beim Droppen von `fame` wird `fameLevel` mitgedroppt (`actionCreators.ts:128-129`).
- **`currentGig` als Venue-Objekt:** Keine `.venue`-Zugriffe gefunden.
- **Selbst-Relationships:** `delta.ts:414-430` filtert `member1 !== member2` explizit.
- **`START_GIG` reset:** `gigModifiers` wird auf `DEFAULT_GIG_MODIFIERS` zurückgesetzt (`gigReducer.ts:67`).
- **Minigame-Completion-Reducer:** Keiner der vier `COMPLETE_*`-Handler ändert `currentScene`.
- **`advanceDay`:** Ausschließlich über den typisierten Action Creator mit `dayRngStream` + `nextRngSeed` dispatcht.
- **Audio-Timing:** Gameplay nutzt durchgängig `audioEngine.getGigTimeMs()`; keine direkten Tone.js-Zeitlesungen, kein Howler, kein zweiter Audio-Stack.
- **End-Detection:** `setlistCompleted` + `isNearTrackEnd` (`rhythmGameLoopUtils.ts:202`); kein `audioPlaybackEnded`.
- **Leaderboards:** Submitten `SONGS_BY_ID.get(songId).leaderboardId` (`leaderboardUtils.ts:67-70`).
- **`MODIFIER_COSTS`:** Einzige Kostenquelle für PreGig-Modifier; keine hartkodierten Kosten.
- **Travel-Checks:** `useTravelActions.ts` legt Reisekosten + `getTotalDailyObligations()` offen und deckt beide.
- **Gig-Report-Netto:** `net = income.total − expenses.total`; Dampener und Miss-Penalties stehen im Expense-Breakdown (`gigLogic.ts:763-789`).
- **Tourbus-Schaden:** 50%-Skalierung in `calculateTravelMinigameResult()`; keine Doppel-Anwendung.
- **`CHASSIS_CONFIG`/`MODULE_REGISTRY`:** Einzige Quellen; DIY-Tiers via `buildDiyTier`; Konsumenten lesen direkt aus der Config.
- **DIY-Loan-Sperre:** UI deaktiviert Loan (`ChassisAcquisitionModal.tsx:116`) und Action Creator liefert `PURCHASE_CHASSIS_FAILED` (`assetActionCreators.ts:179-180`).
- **Consumables:** `inventory_add`-Items zeigen nie `OWNED` (`purchaseLogicUtils.ts:213-215`).
- **Unlock-Split:** Persistenz nur in `unlockManager.ts`, Eligibility nur in `unlockCheck.ts`.
- **Prototype-Pollution:** `saveValidator.ts:108-131` und `safeJsonParse`-Reviver strippen `__proto__`/`constructor`/`prototype`.
- **i18n:** EN/DE-Locale-Dateien sind deckungsgleich (Keys und Platzhalter); keine hartkodierten User-Strings, kein `€` in `ui.json`.
- **React 19:** Keine `.propTypes`-Blöcke; Hook-Dependency-Arrays inkl. `t` stichprobenartig korrekt.
- **Pixi/Audio-Lifecycle:** Teardown mit Race-Guards; Ticker/Listener werden entfernt; keine ungekündigten rAF-Loops; Divisionen gegen 0 abgesichert.

---

## Geprüfte Verdachtsfälle — False Positives

Diese Punkte wurden im Erst-Audit gemeldet, bei der Verifikation aber als korrekt eingestuft:

1. **„Invertiertes Vorzeichen" im täglichen Bankrott-Check** (`systemReducer.ts:1910`):
   `shouldTriggerBankruptcy(money, -obligations)` ist mathematisch äquivalent zu
   `(money, 0, obligations)`, da der dritte Parameter auf `0` defaultet. Kein Logikfehler,
   nur unkonventionell (→ L1).
2. **Vorformatierte Währung in Toast-Options** (`clinicReducer.ts:282`,
   `socialReducer.ts:456/571/674`): Das Baken via
   `formatCurrency(value, i18n.language, signDisplay)` zum Dispatch-Zeitpunkt ist die
   **dokumentierte Projektkonvention** (AGENTS.md „Gotchas"), kein Fehler.
3. **`text-hot-pink`** (`DealCard.tsx:60`): `--color-hot-pink` ist in `@theme`
   (`src/index.css:92`) definiert — Tailwind v4 generiert die Utility automatisch. Gültig.
