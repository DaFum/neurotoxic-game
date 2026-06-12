# Logic-Audit — Auffälligkeiten und Inkonsistenzen

**Datum:** 2026-06-12
**Umfang:** Gesamte Codebase (`src/**`, Locale-Daten), statisches Audit über parallele Domänen-Reviews (State/Reducer, Economy/Assets, Spiellogik-Utils, Hooks, Komponenten/Szenen, Audio/Daten/i18n). Jeder gelistete Befund wurde anschließend direkt im Quellcode verifiziert; Zeilenangaben beziehen sich auf den Stand von Commit `3f69a2c8`.

> **Status (2026-06-12):** Alle Befunde behoben auf Branch `audit-logic-fix`, ein Conventional Commit pro Befund.
> H1 `c898b0f4` · H2 `4a734291` · H3 `64d4d65a` · M1 `9f78e69b` · M2 `c46424ce`+`612a0fef` · M3 `b01d34d2` · M4 `61cabc7b` · M5 `1365f4df` · M6 `2d9a874c` · N1 `edf4e5df` · N2 `59713906` · N3 `c40e55a9` · N4 `4499a301` · N5 `2bd27d4f` · N6 `72a0a247`
> Entscheidungslage „integrieren statt entfernen“: H2 wurde durch Definition des fehlenden Events `event_bad_press` gelöst (plus defensivem Queue-Drain), H3 durch Registry-Rehydration statt Feld-Drop, N4 durch Unterstützung beider Node-Shapes.

---

## Hoch

### H1: Kostenloses Chassis über `purchaseChassis` mit `mode: 'crowdfund'`

- **Dateien:** [assetActionCreators.ts:156-221](src/context/assetActionCreators.ts:156), [assetReducer.ts:96-125](src/context/reducers/assetReducer.ts:96)
- `purchaseChassis` akzeptiert `mode: 'crowdfund'`, weil `VALID_ASSET_ACQUISITION_MODES` (`src/utils/assetValidation.ts:26-29`) alle drei Modi enthält. Der Creator prüft Geld nur bei `cash` und Loan-Eligibility nur bei `loan` — für `crowdfund` gibt es keinerlei Prüfung und keinen Verweis auf eine Kampagne.
- Im Reducer `handlePurchaseChassis` behandelt der Zahlungszweig nur `cash` (Geldabzug) und `loan` (Liability). Bei `mode: 'crowdfund'` fällt der Code durch beide Zweige und fügt das Asset **ohne jede Gegenleistung** dem State hinzu (`assets: [...state.assets, asset]`).
- Crowdfund-Akquisition soll ausschließlich über `startCrowdfund` + `processCrowdfundTick` laufen. Laut Payload-Sicherheitsmodell des Projekts ist der Reducer die letzte Autorität gegen fehlgeformte Dispatches — beide Schichten müssen `mode: 'crowdfund'` in diesem Pfad ablehnen.
- **Konfidenz:** Hoch (Code direkt verifiziert).

### H2: `event_bad_press` existiert nicht — Pending-Event-Queue kann dauerhaft blockieren

- **Dateien:** [questRegistry.ts:597](src/data/questRegistry.ts:597), [eventSelection.ts:124-133](src/utils/eventEngine/eventSelection.ts:124), [useEventSystem.ts:165-170](src/context/useEventSystem.ts:165), [eventReducer.ts:76-77](src/context/reducers/eventReducer.ts:76)
- Die Quest-Penalty `{ type: 'event.queue', eventId: 'event_bad_press' }` reiht eine Event-ID in `pendingEvents` ein, die **nirgendwo im Event-Pool definiert ist** (einziger Treffer im Repo ist die Referenz selbst).
- Folgewirkung: `eventSelection.ts` gibt das Queue-Head-Event nur zurück, wenn es im Pool gefunden wird (Z. 124-133). Gepoppt wird die Queue nur in `useEventSystem.ts`, wenn das zurückgegebene Event mit dem Queue-Head übereinstimmt (Z. 165-170). Eine unbekannte ID am Queue-Kopf wird daher **nie zurückgegeben und nie entfernt** — sie blockiert dauerhaft alle später eingereihten Pending-Events (höchste Prioritätsstufe der Event-Auswahl).
- Zwei Fixes nötig: (a) Event definieren oder Referenz entfernen, (b) defensiv: unbekannte IDs am Queue-Kopf verwerfen statt endlos liegen lassen.
- **Konfidenz:** Hoch.

### H3: Save/Load reduziert `activeDeals` auf `{id, remainingGigs}` — Sponsorship-Logik bricht nach dem Laden

- **Dateien:** [systemReducer.ts:1239-1251](src/context/reducers/systemReducer.ts:1239), [checks.ts:84-91](src/utils/gameState/checks.ts:84), [gigLogic.ts:693](src/utils/economy/gigLogic.ts:693), [socialResolution.ts:363](src/utils/postGig/socialResolution.ts:363), [postOptions.ts:830](src/data/postOptions.ts:830)
- `sanitizeSocial` behält beim Laden eines Spielstands pro Deal nur `id` und `remainingGigs`; `type`, `offer` und alle weiteren Felder werden verworfen.
- Zur Laufzeit verlangen aber mehrere Konsumenten `deal.type === 'SPONSORSHIP'`: `hasActiveSponsorship` (Eligibility-Checks, Post-Optionen), die Sellout-Penalty in `gigLogic.ts` und die Deal-Auflösung in `socialResolution.ts`.
- Effekt: Nach Save/Load zählen aktive Sponsorings nicht mehr — keine Sellout-Penalty, `hasActiveSponsorship()` liefert `false`, abhängige Post-Optionen/Quests verhalten sich falsch. Live-State (ohne Reload) funktioniert, d. h. der Bug ist persistenzspezifisch und leicht zu übersehen.
- Fix: Sanitizer muss die Whitelist um `type` (gegen `BrandDealType` validiert) und die benötigten `offer`-Felder erweitern.
- **Konfidenz:** Hoch.

---

## Mittel

### M1: `EFFECT_REVERTERS` nutzen `??` statt `finiteNumberOr` — NaN aus alten Saves bleibt erhalten

- **Datei:** [systemReducer.ts:1812-1872](src/context/reducers/systemReducer.ts:1812)
- 11 der 12 Reverter (u. a. `luck`, `stamina_max`, `style`, `tour_success`, `tempo`, `crit`) rechnen `((band.x as number) ?? fallback) - finiteEffectValue(value)`. `??` lässt `NaN` durch; `Math.max(0, NaN)` ist `NaN` — der korrupte Wert wird zurück in den State geschrieben.
- Der `harmony`-Reverter (Z. 1796-1801) macht es korrekt mit `finiteNumberOr`. Direkter Verstoß gegen die dokumentierte Invariante in AGENTS.md („`??` is not a substitute — it lets `NaN` through“).
- **Konfidenz:** Hoch (Muster eindeutig; Reachability hängt von Load-Sanitization des jeweiligen Felds ab).

### M2: `UPDATE_BAND`-Member-Patches entfernen keine Selbst-Relationships

- **Datei:** [bandReducer.ts:102-147](src/context/reducers/bandReducer.ts:102), Vergleich: Load-Pfad [systemReducer.ts:1009](src/context/reducers/systemReducer.ts:1009)
- Beim Laden werden `relationships` numerisch geparst und Selbst-Relationships entfernt. `handleUpdateBand` merged Member-Patches dagegen per `{...existing, ...patch}` und übernimmt ein `relationships`-Feld **ungeprüft** (weder Selbstbezug-Strip noch Finite-Check).
- Mehrere Call-Sites schicken ganze Member-Arrays durch `updateBand`; die Invariante „Never add band members to their own relationships map“ hängt damit allein an den Callern, obwohl der Reducer laut Projektregeln die letzte Autorität ist. Selbst-Relationships korrumpieren Trait- und Infighting-Logik.
- **Konfidenz:** Hoch.

### M3: Async-Race in `TourbusStageController.setup()` — Crash bei schnellem Szenenwechsel

- **Datei:** [TourbusStageController.ts:88-114](src/components/stage/TourbusStageController.ts:88), Dispose: Z. 290-292
- `setup()` macht `await this.loadAssets()` (Z. 108) und dereferenziert danach `this.effectManager.loadAssets()` (Z. 109) ohne Null-Check. `dispose()` setzt `effectManager = null`, wenn die Szene während des Ladens verlassen wird → `TypeError` auf einem laufenden Promise; auch `drawRoad()`/`createBus()` laufen danach gegen zerstörte Container.
- Fix: Nach jedem `await` einen Disposed-Guard (z. B. `if (!this.effectManager) return`) einziehen.
- **Konfidenz:** Hoch.

### M4: Event-Delta-Anwendung nutzt bare `typeof === 'number'` — NaN propagiert in Inventar/Zähler

- **Datei:** [delta.ts:56-58](src/utils/gameState/delta.ts:56), [delta.ts:296-308](src/utils/gameState/delta.ts:296)
- Flag-/Inventar-Deltas prüfen `typeof qty === 'number'` statt `Number.isFinite`/`finiteNumberOr`. `typeof NaN === 'number'` ist `true`; `Math.max(0, currentCount + NaN)` ergibt `NaN`, das als Inventarbestand bzw. Flag-Zähler persistiert wird.
- Direkter Verstoß gegen die AGENTS.md-Regel „Payload sanitizers must use `Number.isFinite(v)`, not bare `typeof v === 'number'`“. Erreichbar über fehlerhaft definierte Event-/Item-Effekte, die ungeprüfte Berechnungen enthalten.
- **Konfidenz:** Hoch für das Muster; mittel für praktische Erreichbarkeit.

### M5: Quest-Reward `skill_point` erhöht Skill ohne Ober-Clamp

- **Datei:** [questRewards.ts:117-148](src/domain/questRewards.ts:117)
- `applySkillPointReward` schreibt `skill: skillValue + 1` direkt in `baseStats`, ohne den 1..10-Clamp, den Event-Skill-Deltas verwenden. Wiederholte Skill-Rewards können den Wertebereich verlassen; Konsumenten, die 1..10 annehmen (Balancing-Formeln), rechnen dann mit out-of-range Werten.
- Inkonsistenz zwischen zwei Belohnungspfaden für dieselbe Stat — entweder ist „unbounded“ gewollt (dann beim Event-Delta falsch) oder hier fehlt der Clamp.
- **Konfidenz:** Hoch für die Inkonsistenz, Auswirkung abhängig vom Balancing.

### M6: `useLeaderboardSync` — unkoordinierte parallele Syncs pro Stat-Änderung

- **Datei:** [useLeaderboardSync.ts:176-226](src/hooks/useLeaderboardSync.ts:176)
- Der Effekt feuert bei jeder Änderung von `money`/`fame`/`followers`/… und startet jeweils einen unkancelten async Sync. `lastSyncedDay` wird erst **nach** dem `await fetch` geschrieben; mehrere in-flight Requests am selben Tag lesen alle den alten Marker → mehrfache POSTs mit unterschiedlichen Zwischenständen, Reihenfolge der Server-Ankunft undefiniert (der zuletzt ankommende Zwischenstand gewinnt).
- Kein Cleanup/Abort im Effekt; bei Unmount läuft der Request weiter und schreibt danach noch localStorage.
- **Konfidenz:** Hoch für das Race; Schweregrad abhängig von Server-Idempotenz.

---

## Niedrig

### N1: Tourbus-Schaden vor 50%-Skalierung nicht auf 100 gedeckelt

- **Dateien:** [minigameLogic.ts:17-20](src/utils/economy/minigameLogic.ts:17), [minigameReducer.ts:84](src/context/reducers/minigameReducer.ts:84)
- Dokumentierte Invariante: „100 damage means max 50 condition loss“. Reducer und Calculator clampen nur `>= 0`, nicht `<= 100`; ein Payload mit z. B. `damageTaken: 500` erzeugt 250 Condition-Loss. `clampVanCondition` fängt die Korruption ab (Condition geht auf 0), aber das dokumentierte Maximum von 50 ist an der Reducer-Grenze nicht durchgesetzt.

### N2: `calculatePerformanceScore` lässt NaN durch beide Clamps

- **Dateien:** [performanceLogic.ts:175-180](src/utils/postGig/performanceLogic.ts:175), [usePostGigDerivations.ts:61](src/hooks/postGig/usePostGigDerivations.ts:61)
- `Math.min(MAX, Math.max(MIN, NaN))` ergibt `NaN`. Der Aufrufer schützt mit `lastGigStats?.score ?? 0` — `??` fängt `NaN` nicht. Die Load-Sanitization filtert `score` auf finite Werte, daher nur bei In-Session-Korruption erreichbar; trotzdem Verstoß gegen die `finiteNumberOr`-Regel an einer Arithmetik-Grenze, von der Finanz-/Fame-Berechnungen abhängen.

### N3: `startCrowdfund` akzeptiert 0/negative Beträge

- **Datei:** [assetActionCreators.ts:543-555](src/context/assetActionCreators.ts:543)
- `targetAmount`, `fameStake`, `daysRemaining` werden nur via `finiteNumberOr(x, 0)` normalisiert — `0` oder negative Werte werden nicht abgelehnt, und es wird nicht geprüft, ob der Spieler den gestakten Fame überhaupt besitzt. Die UI begrenzt den Slider auf `0..fame`, aber Creator/Reducer sind laut Sicherheitsmodell eigenständige Verteidigungslinien. Negative Werte würden Kampagnen mit invertierten Effekten erzeugen.

### N4: Venue-Chatter ignoriert `node.venueId`

- **Dateien:** [chatter/index.ts:69-75](src/data/chatter/index.ts:69), [map.d.ts:17-18](src/types/map.d.ts:17), Vergleich: [systemReducer.ts:620](src/context/reducers/systemReducer.ts:620)
- Die Chatter-Auswahl liest ausschließlich `currentNode.venue.id`. Der Map-Node-Typ erlaubt aber auch venueId-only-Nodes (`venueId?: string`), und der City-Intel-Pfad in `systemReducer.ts:620` akzeptiert korrekt beides (`node?.venueId ?? node?.venue`). Aktuell unkritisch, weil der Generator immer volle `venue`-Objekte setzt — aber sobald ein Pfad nur `venueId` schreibt, verstummt Venue-Chatter still.

### N5: Hardcodiertes UI-Englisch in `DebugLogViewer`

- **Datei:** [DebugLogViewer.tsx:127](src/ui/DebugLogViewer.tsx:127)
- `aria-label='Close log'` ist nutzersichtbarer (Screenreader-)Text ohne i18n-Key — Verstoß gegen „User-facing text must use namespaced i18n keys“. Da Debug-Tooling: niedrige Priorität.

### N6: Veralteter AGENTS-Hinweis zu `money_earned`-Quest-Progress

- Die Warnung in den Agent-Instruktionen, der `money_earned`-Progress-Pfad sei nicht verdrahtet, ist überholt: Der Producer existiert und ist über den Brand-Deal-PostGig-Handler angebunden. Doku-Drift, kein Laufzeitfehler.

---

## Geprüft und sauber

Die folgenden Invarianten wurden gezielt geprüft und ohne Befund bestätigt:

- **Action-Sync:** Jede `ActionTypes`-Konstante hat Creator und Reducer-Routing; kein payloadloser `ADVANCE_DAY`-Pfad mehr (typisierter Creator mit `dayRngStream` + `nextRngSeed` überall).
- **Minigame-Completion:** Keiner der vier Completion-Handler ändert `currentScene`; `START_GIG` resettet `gigModifiers` auf Defaults.
- **Economy-Kernpfade:** Gig-Report-`net` = angezeigte Einnahmen − angezeigte Ausgaben (Dampener und Miss-Penalties als sichtbare Expense-Zeilen); Travel-Checks nutzen `getTotalDailyObligations`; Bankruptcy konsultiert denselben Selektor; PreGig-Kosten kommen ausschließlich aus `MODIFIER_COSTS`; `buildDiyTier` nur in `assetConfig.ts`, Konsumenten lesen `CHASSIS_CONFIG` direkt; DIY+Loan wird in Creator und UI abgewiesen.
- **Audio:** Kein Howler; keine direkten Tone-Zeit-Reads außerhalb `src/utils/audio` (einzige Ausnahme: type-only Import); Gameplay-Timing über `getGigTimeMs()`; End-Detection via `setlistCompleted` + `isNearTrackEnd`.
- **Leaderboard-IDs:** Submission nutzt `SONGS_BY_ID.get(songId).leaderboardId`.
- **i18n:** EN/DE-Locale-Parität ohne fehlende/überzählige Keys, keine Placeholder-Drift, kein hartes `€` in `ui.json`.
- **Daten-Integrität:** Keine doppelten Song-/Venue-/Event-IDs; Map-Generierung deterministisch ohne Mutation der Quell-Arrays; Brand-Color-Fallbacks (Pixi und Overworld-SVG) leiten konsistent aus `BRAND_COLOR_HEX` ab.
- **Band HQ:** Processing-Locks werden auch bei frühen Fehlpfaden korrekt freigegeben.
- **Quests:** `advanceQuest`-Beträge werden im Creator gegen negative/nicht-finite Werte saniert; Registry-Quests nutzen Whitelist-Runtime-Objekte.
- **Amp/Roadie-Szenen-Fallback:** Verzögertes `changeScene(GIG)` in den Hooks ist laut Scope-Regeln gewollte Continuation-Redundanz, Timer räumen bei Unmount auf — kein Defekt.

---

## Empfohlene Priorisierung

1. **H1** (Free-Chassis-Exploit) und **H3** (Sponsorship-Verlust nach Load) — beeinflussen Economy bzw. laufende Spielstände direkt.
2. **H2** (Event-Queue-Blockade) — Quest-Penalty ohne Wirkung plus dauerhafte Queue-Blockade.
3. **M1/M2/M4** — gemeinsames Muster: Reducer-seitige NaN-/Sanitizer-Lücken; lässt sich als ein Hardening-PR bündeln.
4. **M3/M6** — Async-Lifecycle-Fixes (Guard nach `await`, Abort/Cancel im Effekt).
5. Rest nach Gelegenheit.
