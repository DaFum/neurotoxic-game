# Game-Flow Audit — Neurotoxic

**Datum:** 2026-06-13
**Branch:** `claude/charming-hamilton-3ksxsl`
**Umfang:** Tiefes Audit des gesamten Spielablaufs (INTRO → MENU → OVERWORLD ↔ TRAVEL → PREGIG → MINIGAME → GIG → POSTGIG → OVERWORLD, sowie CLINIC, ASSETS, GAMEOVER).

## Methodik

Der Flow wurde in fünf Segmente zerlegt und parallel auditiert: (1) Start/Overworld/Reise, (2) PreGig/Minigames, (3) Gig/PostGig/Economy, (4) Clinic/Assets/GameOver/Tagesablauf, (5) Querschnitt (Reducer/Scene-Routing/Persistence/Events).

**Wichtig:** Jeder gemeldete Fund wurde gegen den tatsächlichen Quellcode gegengeprüft. Mehrere zunächst als „kritisch" gemeldete Punkte stellten sich bei der Verifikation als **dokumentiertes Soll-Verhalten** oder als **Fehlalarm** heraus. Diese sind in Abschnitt 3 transparent aufgeführt, damit der Bericht nicht durch Falsch-Positive verfälscht wird.

Legende Schweregrad: 🔴 hoch · 🟡 mittel · 🟢 niedrig

---

## 1. Verifizierte Funde

### 1.1 🟡 `damaged_gear`-Modifier wird gesetzt, aber nie konsumiert (toter Code)

- **Datei:** `src/context/reducers/minigameReducer.ts:395` und `:593`
- **Befund:** Beide Minigame-Fehlschlag-Pfade setzen `nextModifiers.damaged_gear = true` (Roadie-Heavy-Damage und `applyPostMinigameResult`). Eine projektweite Suche zeigt: `damaged_gear` wird **ausschließlich gesetzt und geloggt**, aber an **keiner Stelle gelesen** — weder in `gigModifiersUtils.ts`, `gigReducer.ts`, `economyEngine.ts`, `gigInputUtils.ts`, noch in `src/types/`.
- **Auswirkung:** Die dokumentierte „beschädigtes Equipment"-Mechanik nach verpatzten Minigames hat **keinerlei Effekt** auf den folgenden Gig. Spieler erleiden keine Konsequenz, obwohl der State-Eintrag suggeriert, es gäbe eine.
- **Empfehlung:** Entweder den Modifier in der Gig-Performance/-Economy konsumieren (Soll-Mechanik implementieren) oder die Setzung entfernen. Vorher klären, was beabsichtigt war.

### 1.2 🟢 Neurotoxic-Pedal Harmonie-Malus wird im PostGig-Report nicht ausgewiesen

- **Datei:** `src/hooks/postGig/handlers/useContinueHandler.ts:218-230`
- **Befund:** Besitzt die Band das `neurotoxicPedal`, wird beim „Continue" die Bandharmonie um `NEUROTOXIC_PEDAL_HARMONY_PENALTY` (= 5, `gameConstants.ts:149`) reduziert. Der Abzug wird angewandt und für Quest-Gating (`postPenaltyHarmony`) genutzt, taucht aber in **keiner PostGig-Report-Komponente** auf (`src/components/postGig/` enthält keine Referenz).
- **Einordnung:** Dies verletzt **nicht** die Geld-Invariante aus CLAUDE.md (`net = displayed income − displayed expenses`) — es geht um Harmonie, nicht um Geld. Es ist eine **UX-Transparenz-Lücke**: Der Spieler sieht den Harmonieverlust nicht im Report, er passiert „still" beim Weiterklicken.
- **Empfehlung:** Harmonie-Delta im Report sichtbar machen oder bewusst als verstecktes Risiko des Pedals dokumentieren.

### 1.3 🟢 Contraband-Drop-Toast nutzt `info` statt `success`

- **Datei:** `src/context/reducers/minigameReducer.ts:272-273`
- **Befund:** Beim Contraband-Fund während eines Minigames wird ein Toast mit `type: 'info'` erzeugt — der Code-Kommentar selbst notiert `// Could be 'success'`. Ein gefundener Loot ist ein positives Ereignis und sollte zur Konsistenz mit anderen Belohnungs-Toasts `success` (grün) sein.
- **Empfehlung:** `type: 'success'` setzen.

### 1.4 🟢 PostGig-Loadingzustand hat keinen Escape-Hatch

- **Datei:** `src/scenes/PostGig.tsx:49-58`
- **Befund:** Solange `financials` falsy ist, rendert die Szene dauerhaft den „TALLYING RECEIPTS…"-Ladebildschirm — **ohne** Fallback-Button zurück in die Overworld. Im Normalfall wird `financials` synchron aus `currentGig`/`lastGigStats` abgeleitet, ist also sofort vorhanden. Gerät der State aber in einen inkonsistenten Zustand (z. B. `currentGig`/`lastGigStats` fehlen nach einem Scene-Wechsel), bleibt der Spieler im Ladebildschirm hängen.
- **Empfehlung:** Defensiver Fallback (Timeout oder „Zurück zur Overworld"-Button), falls die Ableitung nicht zustande kommt.

---

## 2. Plausible Verdachtsfälle (nicht abschließend verifiziert — Follow-up empfohlen)

Diese Punkte sind statisch plausibel, ihre tatsächliche Auslösbarkeit zur Laufzeit wurde nicht durch Reproduktion bestätigt. Vor einem Fix lohnt ein gezielter Reproduktions-/Testversuch.

> **Verifikation (2026-06-13):** Alle sechs Verdachtsfälle wurden per Code-Trace nachverfolgt und sind **WIDERLEGT** (Soll-Verhalten/abgesichert) — kein Fix nötig:
> - **2.1** Dispatch ist synchron, der Reducer wirft strukturell nie; der `finally`-`changeScene(GIG)` ist bewusste Softlock-Vermeidung. Reducer ändert `currentScene` nicht (`src/context/reducers/AGENTS.md:28`).
> - **2.2** Alle 45 Venues in `src/data/venues.ts` setzen `capacity` explizit (45/45 verifiziert); der `null`-Pfad ist praktisch unerreichbar.
> - **2.3** `useTravelEffects.ts:71-141` simuliert Asset-Verkaufs-Szenarien (`postSaleScenarios`) vor `checkSoftlock` (`mapUtils.ts:336-355`); der Toast feuert nur, wenn auch nach Verkauf keine Route leistbar ist — Text faktisch korrekt.
> - **2.4** Alle 6 `arrival.*`-Keys existieren in EN und DE (6/6 in beiden); `defaultValue`s sind reine Pre-Load-Fallbacks.
> - **2.5** Kein `triggerEvent`-Aufrufer liegt in `TRAVEL_MINIGAME`/`PRE_GIG_MINIGAME`/`PRACTICE`; der fehlende Guard ist folgenlos.
> - **2.6** `isHandlingRef` (Node-ID-Vergleich) und `isProcessingActionRef` (synchron vor Dispatches gesetzt) schützen die kritischen Bereiche; kein Code-Pfad erzwingt einen Doppel-Effekt.

### 2.1 🟡 PreGig/Minigame Scene-Transition-Architektur ist uneinheitlich

- **Datei:** `src/scenes/kabelsalat/hooks/useKabelsalatGameEnd.ts:65-67`
- **Befund:** Kabelsalat wechselt die Szene nach Minigame-Ende direkt aus dem Hook heraus (`changeScene(GAME_PHASES.GIG)` im `finally`-Block). Die anderen Minigames (Roadie, AmpCalibration) lassen den Scene-Wechsel über die jeweilige Fortsetzungs-Logik laufen. Beide Muster sind mit CLAUDE.md vereinbar (der **Reducer** ändert `currentScene` korrekt **nicht**; die Fortsetzungs-Callbacks besitzen den Scene-Wechsel). Der `finally`-Block ist bewusst gewählt, damit der Spieler auch bei einem Dispatch-Fehler nicht im Minigame hängenbleibt — der Dispatch ist synchron, eine echte Race Condition besteht hier **nicht**.
- **Restproblem:** Schlägt `completeKabelsalatMinigame()` fehl, wird dennoch zu GIG gewechselt — das Minigame-Ergebnis (Rewards/Modifier) geht dann verloren, der Gig startet ohne. Das ist „graceful degradation", aber stillschweigend.
- **Einordnung:** Die ursprüngliche „HOCH/Race-Condition"-Bewertung des Audit-Agenten ist **überzeichnet**; tatsächlich niedrig-mittel. Wert: Architektur vereinheitlichen oder den Sonderfall kommentieren.

### 2.2 🟡 `currentGig.capacity` kann bei Quest-Events `undefined`/`0` sein

- **Datei:** `src/context/reducers/gigReducer.ts:251-255` (+ Quest-Event-Erzeugung mit `capacity ?? 0`)
- **Befund:** `handleStartGig` übernimmt das Venue-Objekt unverändert; `capacity` ist im `Venue`-Typ optional. Fehlt sie, wird in Gig-Completed-Quest-Events `capacity: 0` gefeuert. Quests wie „kleines Venue + guter Gig" (`capacity <= 300`) klassifizieren ein Venue ohne Kapazität dann als „klein".
- **Empfehlung:** Prüfen, ob Map-Nodes/Venues immer `capacity` setzen; falls nicht, Quest-Logik gegen fehlende Kapazität absichern (statt `?? 0`).

### 2.3 🟢 Softlock-/Stranded-Toast ist irreführend, wenn Assets verkäuflich sind

- **Datei:** `src/hooks/travel/useTravelEffects.ts` (Softlock-Erkennung, ~Z. 159-178)
- **Befund:** Die Stranded-Meldung („Cannot travel and cannot afford fuel") wird angezeigt, obwohl der Spieler durch Asset-Verkauf ggf. noch handlungsfähig wäre. Die Erkennung selbst berücksichtigt `getTotalDailyObligations`, der Meldungstext kommuniziert die Asset-Verkaufs-Option aber nicht.
- **Empfehlung:** Toast-Text präzisieren oder auf Asset-Verkauf hinweisen.

### 2.4 🟢 Hartcodierte englische `defaultValue`s in Ankunfts-Toasts

- **Datei:** `src/utils/arrivalUtils.ts` (~Z. 165-225)
- **Befund:** Mehrere Ankunfts-Toasts nutzen `i18n.t('ui:arrival.…', { defaultValue: 'You arrived at …' })`. Solange die Locale-Kataloge geladen sind, greifen die DE-Keys; ist der Katalog (noch) nicht geladen, fällt die Anzeige auf Englisch zurück.
- **Einordnung:** Konform zur i18n-Konvention (namespaced keys vorhanden), aber die englischen Defaults sind ein Maintainability-/Konsistenz-Risiko. Niedrig.

### 2.5 🟢 Event-Trigger wird nur in `GIG` geblockt, nicht in Minigames/`PRACTICE`

- **Datei:** `src/context/useEventSystem.ts:157` (`if (currentState.currentScene === GAME_PHASES.GIG) return false`)
- **Befund:** `triggerEvent` ist nur für `GIG` gesperrt. `PRACTICE` (rendert dieselbe Gig-Szene) sowie `TRAVEL_MINIGAME`/`PRE_GIG_MINIGAME` sind nicht explizit ausgenommen.
- **Einordnung:** In der Praxis wird `triggerEvent` aus Overworld-/Tagesablauf-Kontexten aufgerufen, nicht aus den Minigame-Szenen — daher real niedrig. Dennoch eine Design-Asymmetrie: Wenn Events je aus diesen Phasen heraus getriggert werden könnten, fehlte der Guard.

### 2.6 🟢 Diverse Mehrfach-Auslöse-/Transition-Verdachtsfälle (low confidence)

Die Overworld-/Arrival-Auditschicht meldete mehrere mögliche Doppel-Verarbeitungen (z. B. doppelter Arrival bei schnellen Klicks, `useTravelActions` Gig-Start ohne Cross-Layer-Guard, `queueMicrotask` vs. `startTransition`-Uneinheitlichkeit in `useContinueHandler`). Diese sind **spekulativ**: Die betroffenen Dispatches sind synchron, und es existieren Guards (`isHandlingRef`, `isProcessingActionRef`, `transitionedRef`). Eine echte Race Condition wurde nicht reproduziert.

- `src/hooks/useArrivalLogic.ts` (Arrival-Guard `isHandlingRef`)
- `src/hooks/travel/useTravelActions.ts` (Gig-Node-Klick-Pfad)
- `src/hooks/postGig/handlers/useContinueHandler.ts:274-281` (`queueMicrotask`)

**Empfehlung:** Falls in QA Doppel-Effekte (doppelter Geldabzug, doppelter Tagesfortschritt) auftreten, hier zuerst suchen. Andernfalls nicht ohne Reproduktion „fixen".

---

## 3. Geprüft & als unkritisch / Soll-Verhalten bestätigt

Diese Punkte wurden während des Audits aufgeworfen, bei Verifikation jedoch als **kein Problem** eingestuft. Festgehalten, damit sie nicht erneut als Bug „repariert" werden.

| Punkt | Datei | Bewertung |
|---|---|---|
| `perfScore >= 31` vs. `PERF_SCORE_MIN = 30` (vermeintlicher Off-by-one) | `src/utils/postGig/performanceLogic.ts:17,135,176` | **Soll-Verhalten**, explizit dokumentiert in `src/utils/AGENTS.md:31`. Kein Bug. |
| `GAME_PHASES.POST_GIG` hat Wert `'POSTGIG'` (Key≠Value) | `src/context/gameConstants.ts` | Harmlos. Sämtlicher Code (inkl. `data/chatter/standardChatter.ts`) nutzt die **Konstante**, keine Literale. |
| Bankruptcy-Check `income - totalDailyObligations < 0` | `src/utils/economy/logisticsLogic.ts:213-237` | Bewusster Break-Even-Check bei exakt 0 Geld, im JSDoc dokumentiert. Keine doppelte Subtraktion. |
| Kabelsalat `changeScene` im `finally` | `useKabelsalatGameEnd.ts:65` | Synchroner Dispatch, keine Race Condition; bewusst gegen Softlock. (Restpunkt siehe 2.1.) |
| `loadGame` erzwingt `currentScene = OVERWORLD` | `src/context/reducers/systemReducer.ts:1644` | Dokumentiertes Soll-Verhalten (sicherer Wiedereinstieg). |
| Alle `GAME_PHASES` haben einen `SceneRouter`-Case | `src/components/SceneRouter.tsx` | Vollständig, keine „Dead Phases". `ALLOWED_SCENE_VALUES` aus `Object.values(GAME_PHASES)` abgeleitet. |
| `advanceDay` RNG-Determinismus | `actionCreators.ts:1150-1167`, `systemReducer.ts` | Korrekt: `dayRngStream` + `nextRngSeed` werden im Action-Creator vorgeneriert. |
| Clamp-Helper mit `finiteNumberOr`-Wrapping (mood/stamina/harmony) | `src/utils/gameState/clamps.ts`, `dailyTickLogic.ts` | Korrekt umgesetzt. |
| Self-Relationships bei Bandmembern | `src/context/reducers/bandReducer.ts:44-69` | Korrekt gefiltert (case-insensitiv über id + name). |
| Asset-Reducer-Reinheit (UUIDs vorgeneriert) | `src/context/reducers/assetReducer.ts` | Korrekt: IDs kommen aus dem Payload. |
| Unlock-Erhalt bei „Neues Spiel" | `useGameDispatchActions.ts:368-376` | Korrekt: `getUnlocks()` → `createResetStateAction({ unlocks })`. |
| Audio-End-Detection / `getGigTimeMs()` | `src/utils/rhythmGameLoopUtils.ts:149,200-204` | Korrekt: `setlistCompleted` + `isNearTrackEnd`, keine direkten Tone.js-Lesungen. |
| Leaderboard nutzt `leaderboardId` | `src/utils/leaderboardUtils.ts:67` | Korrekt: `SONGS_BY_ID.get(songId)?.leaderboardId`. |
| Gig-Report `net = income.total − expenses.total` | `gigLogic.ts` (Reconciliation), `derivations.ts:101-106` | Korrekt; Performance-/Overage-Penalty fließen in die ausgewiesenen Expenses. |
| `handleStartGig` ohne Null-Guard auf Venue | `gigReducer.ts:61` | Typseitig abgesichert (`Venue` non-null). Niedrigstes Robustheitsrisiko. |

---

## 4. Priorisierung

1. **Entscheidung zu `damaged_gear` (1.1)** — entweder Mechanik implementieren oder toten State entfernen. Höchster Nutzen, klar verifiziert.
2. **PostGig-Loading-Escape-Hatch (1.4)** — geringer Aufwand, verhindert potenziellen Softlock.
3. **Neurotoxic-Pedal-Harmonie im Report (1.2)** und **Contraband-Toast (1.3)** — kleine UX-Korrekturen.
4. **Follow-up bei QA-Auffälligkeiten** zu Abschnitt 2 (Transition-/Arrival-Verdachtsfälle) — nur mit Reproduktion angehen.

## 5. Gesamteinschätzung

Der Game-Flow ist **strukturell solide**: vollständige Scene-Abdeckung, deterministisches RNG, konsequentes Payload-Clamping, korrekte Reducer-Reinheit und eine saubere Trennung zwischen Reducer-State und Fortsetzungs-Callbacks für Scene-Wechsel. Die gefundenen echten Probleme sind überwiegend **Detail-/UX-Themen**; der einzige klar substanzielle Fund ist der nicht konsumierte `damaged_gear`-Modifier.
