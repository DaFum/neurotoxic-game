# TODO‑Audit — Code, Funktionen, Logik und Spielablauf (2026-05-01)

Diese Notiz sammelt konkrete Verbesserungspotenziale, die während einer fokussierten Durchsicht von Zustandsfluss, Ereignisbehandlung, Reise-/Ankunftslogik und Wirtschaftssystemen entdeckt wurden.

## 1) Zuverlässigkeit von Zustand & Reducern

- [ ] **Vollständige Absicherung gegen unbekannte Actions im `gameReducer` härten**: Der Default‑Zweig ruft bereits `logger.warn` und `assertNever` auf; erweitere ihn um einen strukturierten Telemetriezähler (nicht nur eine Konsolenmeldung), damit die Häufigkeit unbekannter Actions in der Überwachung sichtbar wird und nicht nur in der Dev‑Konsole.
  - Best Practice: Schütze das Erhöhen der Metrik mit `import.meta.env.DEV` (Konvention im Codebase; `process.env.VITE_*` nur dort verwenden, wo Node/Test‑Parität nötig ist) und prüfe `logLevel >= 'warn'`; der Zähler selbst sollte in einen nur‑Dev Ringpuffer schreiben, den das Debug‑Overlay anzeigen und zwischen Sitzungen zurücksetzen kann.
  - Muster: `default: { logger.warn(…); devMetrics.increment('unknownAction', action.type); return assertNever(action as never); }` — `devMetrics` ist in Produktion ein `NullMetrics` No‑Op und in Dev/Test ein echter Zähler; die Form ist `Record<string, number>`.
  - Fallstrick: Der aktuelle `gameReducer.ts` Default‑Zweig übergibt das vollständige `action`‑Objekt an `logger.warn`, wodurch sensible Payload‑Daten (Geldbeträge, Spielernamen) in der Konsole landen; die Log‑Nachricht sollte auf `action.type` und den Reducer‑Namen beschränkt werden, niemals auf die komplette Payload.
  - **Status:** TEILWEISE — `gameReducer` loggt und verwendet `assertNever` als Laufzeit‑Trap; strukturierte Telemetrie/Dev‑Metrik fehlt. Beleg: [src/context/gameReducer.ts](src/context/gameReducer.ts#L228-L262)

- [ ] **`as ReducerMap` Cast durch `satisfies ReducerMap` ersetzen**: `gameReducer.ts` verwendet bereits einen typisierten `ReducerMap`‑Mapped Type, dichtet ihn aber mit einem `as`‑Cast ab, der Zuweisungsfehler unterdrückt; ein Wechsel zu `satisfies` erhält die Narrowing‑Vorteile und zeigt Handler mit driftenden Payload‑Typen an.
  - Best Practice: `satisfies` prüft die Form des Objektliterals ohne die inferierte Typverbreiterung, so erhalten Handler weiterhin engste Action‑Typen; `as` unterdrückt Fehler und die Narrowing‑Vorteile.
  - Muster: Halte jeden Handler als benannte Funktion in einer eigenen Datei (`handlers/setMoney.ts`) und importiere sie in die Handler‑Map; per‑Handler Unit‑Tests benötigen dann keinen Reducer‑Import.
  - Fallstrick: Der bestehende `as ReducerMap`‑Cast erlaubt es, einen Handler mit falschem Payload‑Typ leise zu kompilieren; der Cast muss entfernt oder ersetzt werden, damit die typisierte Map Compile‑Zeit‑Sicherheit bietet.
  - **Status:** INTENTIONELL / NICHT GEÄNDERT — Das `assertNever(action as never)`‑Pattern ist in der Codebase als absichtlicher Runtime‑Trap dokumentiert; eine Umstellung auf `satisfies` wäre möglich, ist aber eine nicht‑triviale Änderung. Beleg: [src/context/reducers/AGENTS.md](src/context/reducers/AGENTS.md#L20) und [src/context/gameReducer.ts](src/context/gameReducer.ts#L228-L262)

- [ ] **Test‑Suite für Reducer‑Invarianten hinzufügen**: Validiere Post‑Action‑Garantien (Geld nicht negativ, Harmony‑Bounds, keine ungültigen Szenenwechsel).
  - Best Practice: Modelle Invarianten als reine Funktion `checkInvariants(state: GameState): InvariantViolation[]` und rufe sie an zwei Stellen auf: als Assertion in der Invarianten‑Test‑Suite und optional im Reducer‑`default`‑Zweig in Dev‑Mode als Post‑Action‑Audit.
  - Muster: Parametrisiere den Test über alle Action‑Typen — für jeden Action‑Creator generiere ein gültiges Payload, wende es auf `createInitialState()` an und führe `checkInvariants` aus; eine Schleife deckt die ganze Oberfläche ab statt separate Tests pro Action.
  - Fallstrick: Invarianten nur gegen Happy‑Path‑Payloads zu testen übersieht die Randfälle, die tatsächlich Grenzen verletzen; teste deshalb auch Grenz‑ und feindliche Eingaben (`money: 0`, `harmony: 1`, `harmony: 100` sowie `money: -1`, `harmony: 0`, `harmony: 101`).
  - Fallstrick: Reklamps im Reducer können den echten Fehler verschleiern (der Action‑Creator schickte einen ungültigen Wert); Invarianten‑Tests müssen laut fehlschlagen, wenn ein Out‑Of‑Range‑Wert den Reducer erreicht, und dürfen nicht still passen, weil der Reducer ihn still korrigiert.
  - **Status:** NICHT IMPLEMENTIERT — Es gibt keine zentrale `checkInvariants(state)`‑Helperfunktion oder dedizierte Invarianten‑Test‑Suite im Repo. Empfehlung: `tests/node/reducerInvariants.test.js` als Starter anlegen.

## 2) Robustheit des Ereignissystems

- [ ] **Ereignis‑Resolution in einen reinen Domänen‑Resolver auslagern**: `useEventSystem` berechnet derzeit Vorschau‑State und dispatcht Side‑Effects in einem Pfad; extrahiere einen reinen Resolver, der `{ actions, sideEffects }` zurückgibt, um Tests und Rollback‑Sicherheit zu vereinfachen.
  - Best Practice: Modeliere die Resolver‑Signatur als `resolveEvent(event: GameEvent, state: GameState, rng: PRNG): EventResolution` wobei `EventResolution = { actions: GameAction[]; sideEffects: SideEffect[] }` — kein Dispatch, kein React‑Context, keine Importe aus der Hook‑Schicht; die Funktion ist eine pure Transformation und in Node ohne DOM testbar.
  - Muster: Wende die zurückgegebenen `actions` in der Hook via `actions.forEach(dispatch)` an; `sideEffects` werden über einen Side‑Effect‑Runner angewendet, der in Tests gestubbt werden kann — so trennt man „was geschehen soll“ (rein, vollständig testbar) von „wie es ausgelöst wird“ (effektbehaftet, mit einem Integration‑Smoke‑Test abgedeckt).
  - Fallstrick: Ein Resolver, der intern `dispatch` aufruft, macht Rollbacks unmöglich — wenn z. B. die zweite Aktion fehlschlägt oder verworfen wird, wurde die erste bereits angewendet; Batch‑then‑dispatch ist die sichere Variante.
  - **Status:** IMPLEMENTIERT — Ein reiner Resolver ist vorhanden: `resolveEvent` in [src/domain/eventResolver.ts](src/domain/eventResolver.ts#L1-L200) gibt `actions` und `sideEffects` zurück; `useEventSystem` wendet diese an. Beleg: [src/context/useEventSystem.ts](src/context/useEventSystem.ts#L132-L160)

- [ ] **Deterministische Replay‑Tests für Event‑Deltas erstellen**: Snapshotte Vorher/Nachher‑Zustände für Event‑Entscheidungen (inkl. `flags.addQuest` + Unlocks), um Regressionen zu verhindern.
  - Best Practice: Speichere Snapshots als committed JSON‑Fixtures (`tests/fixtures/events/<eventId>.<choiceIndex>.json`) mit Form `{ before: GameState, choice: string, after: GameState }`; führe den Resolver gegen `before` aus und vergleiche das Ergebnis mit `after` per `toStrictEqual` — Änderungen an Event‑Logik erzeugen sichtbare Diffs in der Fixture.
  - Muster: Füge ein Skript `pnpm run fixtures:update` hinzu, das alle Event‑Fixtures vom aktuellen Resolver regeneriert; Entwickler führen es bewusst aus, wenn Event‑Ergebnisse geändert werden, wodurch Diff‑Audit‑Spur in Git entsteht.
  - Fallstrick: Ganzes `GameState` snapshotten macht Tests fragile gegenüber unrelevanten Form‑Änderungen; snapshotte stattdessen nur das Diff (`{ changedKeys: { money: [before, after], flags: { added: [], removed: [] } } }`), damit Umbenennungen nicht alle Event‑Tests brechen.
  - **Status:** TEILWEISE — Es gibt umfangreiche Unit‑Tests für den Resolver (`tests/node/domain/eventResolver.test.js`), aber committed JSON‑Snapshot‑Fixtures wie `tests/fixtures/events/` fehlen. Beleg: [tests/node/domain/eventResolver.test.js](tests/node/domain/eventResolver.test.js#L1-L40)

- [ ] **Tägliche Kappen nach Kategorie hinzufügen**: Aktuell ist `eventsTriggeredToday >= 2` global; erwäge kategorie‑basierte Drosselungen, um seltene Event‑Ketten nicht auszuzehren.
  - Best Practice: Speichere Caps als `dailyCaps: Record<EventCategory, number>` in der Balance‑Konfiguration (siehe §4), nicht hartkodiert im Event‑Engine — so lässt sich die Policy ohne Codeänderungen anpassen.
  - Muster: Initialisiere `eventsTriggeredByCategory: Partial<Record<EventCategory, number>>` im GameState und setze es bei Tageswechsel zurück; die Engine prüft `(eventsTriggeredByCategory[category] ?? 0) >= dailyCaps[category]`.
  - Fallstrick: Eine neue Event‑Kategorie ohne Cap‑Eintrag führt zu `undefined >= 2` → `false` (niemals blockiert); default den Lookup auf `dailyCaps.default ?? 1`, nicht `Infinity`.
  - **Status:** NICHT IMPLEMENTIERT — Aktuelle Implementation prüft nur `player.eventsTriggeredToday >= 2` (global); keine kategorie‑basierten dailyCaps implementiert. Beleg: [src/context/useEventSystem.ts](src/context/useEventSystem.ts#L132-L160)

- [ ] **Strukturierte Event‑Analytics‑Hooks**: Zähle Trigger‑Versuche, Trigger‑Erfolgsraten und Skip‑Gründe (Scene Lock, Cap erreicht, kein Match).
  - Best Practice: Definiere ein `IEventAnalytics`‑Interface mit `recordAttempt`, `recordTrigger`, `recordSkip(reason: SkipReason)`; injiziere `NullEventAnalytics` (No‑Ops) in Produktion und `RecordingEventAnalytics` in Tests/Dev — Analytics dürfen die Logik nicht beeinflussen.
  - Muster: `SkipReason` als String‑Literal‑Union (`'scene_lock' | 'daily_cap' | 'no_match' | 'cooldown'`) definieren, statt freien Strings, damit Konsumenten exhaustiv behandeln können.
  - Fallstrick: Analytics‑Calls im reinen Resolver zu platzieren koppelt ihn an Nebeneffekte; Analytics gehören in die Hook‑Schicht nach Rückgabe des Resolvers, nicht in den Resolver selbst.
  - **Status:** NICHT IMPLEMENTIERT — Kein strukturiertes `IEventAnalytics`/`devMetrics`‑Interface oder Recording‑Implementation gefunden.

## 3) Reise- & Ankunfts‑Gameflow

- [ ] **Idempotenz der Ankunft explizit machen**: `useArrivalLogic` nutzt ein einmaliges `isHandlingRef`; füge einen dokumentierten Reset‑Trigger hinzu (z. B. bei Node‑ oder Szenenwechsel), um Edge‑Lockouts in langen Sessions zu vermeiden.
  - Best Practice: Der Reset‑Trigger sollte eine benannte Konstante sein und explizit getestet werden — `ARRIVAL_REF_RESET_TRIGGER = 'nodeId'` in der Hook‑JSDoc dokumentieren; ein Test prüft, dass ein Navigieren zu einem anderen Node nach einem fehlgeschlagenen Ankunftsversuch die neue Ankunft korrekt verarbeitet ohne Reload.
  - Muster: Setze `isHandlingRef.current = false` in einem `useEffect`‑Cleanup, der auf `[nodeId]` keyed ist, so resetet sich der Ref automatisch bei Node‑Änderung — kein manuelles Reset erforderlich.
  - Fallstrick: Ein boolean `useRef` funktioniert für Single‑Node‑Arrivals, bricht aber, wenn zwei schnelle Node‑Wechsel vor dem ersten `useEffect` entstehen; verwende `nodeId` als Idempotency‑Key: `isHandlingRef.current === nodeId` bedeutet „dieses Node wird bereits verarbeitet“.
  - **Status:** IMPLEMENTIERT — `useArrivalLogic` verwendet `isHandlingRef` keyed auf `player.currentNodeId` und resetet den Guard im `useEffect`‑Cleanup. Beleg: [src/hooks/useArrivalLogic.ts](src/hooks/useArrivalLogic.ts#L56-L70)

- [ ] **Ankunfts‑Routing‑Contract vereinheitlichen**: Schiebe die finale Szenen‑Routing‑Verantwortung vollständig in `handleNodeArrival`, damit Hooks nicht Business‑Routing vs. Fallback‑Routing splitten.
  - Best Practice: Definiere `ArrivalResult = { scene: SceneId; actions: GameAction[] }` als Rückgabewert von `handleNodeArrival`; die Hook wendet `actions` an und navigiert zu `scene` — keine Routing‑Logik im Hook‑Body.
  - Muster: Modeliere jeden Node‑Handler als reine Funktion `handleGigNode(node, state) => ArrivalResult`, `handleRestNode(node, state) => ArrivalResult` usw., registriert in einer `nodeHandlers`‑Map — neue Node‑Typen sind ein neuer Map‑Eintrag, kein `if`/`else` im Hook.
  - Fallstrick: Ein „Fallback“ im Hook ist ein stiller Catch‑All, der unbehandelte Node‑Typen verschluckt; ersetze ihn durch ein `assertNever`‑ähnliches Log + Metrik‑Call und ein explizites `OVERWORLD`‑Return, damit unhandelte Node‑Typen in Analytics sichtbar werden.
  - **Status:** IMPLEMENTIERT (Contract vorhanden) — `handleNodeArrival` gibt `ArrivalResult = { scene, gigStarted }`; Hook respektiert `gigStarted` und ruft `changeScene` nur bei `!gigStarted`. Beleg: [src/utils/arrivalUtils.ts](src/utils/arrivalUtils.ts#L1-L120) und [src/hooks/useArrivalLogic.ts](src/hooks/useArrivalLogic.ts#L100-L140)

- [ ] **Abbruchwahrscheinlichkeiten für Nutzer sichtbar machen**: Niedrige‑Harmony‑Gig‑Abbrüche fühlen sich aktuell undurchsichtig an; zeige Vor‑Reise Warntext und %-Risiko in der UI.
  - Best Practice: Extrahiere die Abbruchwahrscheinlichkeit in eine pure Funktion `calcCancellationRisk(harmony: number, modifiers: CancellationModifiers): number` in `gameStateUtils.ts`; die UI ruft dieselbe Funktion wie die Engine — Anzeige und tatsächliche Würfelung müssen identisch sein.
  - Muster: Zeige das Risiko als farbkodiertes Badge (`< 10%` grün, `10–30%` gelb, `> 30%` rot), berechnet aus dem aktuellen Harmony über die gemeinsame Funktion; aktualisiere das Badge reaktiv, während Harmony sich in der Pre‑Travel‑Zusammenfassung ändert.
  - Fallstrick: Ein gerundeter Prozentwert („~25%“) während die Engine einen präzisen Float benutzt, führt zu Misstrauen, wenn dreimal hintereinander abbricht; zeige einen Dezimalwert (1 Nachkommastelle) und erkläre die Stichprobengröße („1 von 4 Chance pro Versuch“), um Erwartungen zu kalibrieren.
  - **Status:** TEILWEISE — Engine berechnet Abbruch/Wahrscheinlichkeit in `handleNodeArrival` (BALANCE_CONSTANTS + RNG) und zeigt Toasts; jedoch fehlt eine dedizierte pure `calcCancellationRisk`‑Funktion und keine UI‑Badge/Pre‑Travel Anzeige. Beleg: [src/utils/arrivalUtils.ts](src/utils/arrivalUtils.ts#L80-L130)

- [ ] **Property‑Tests für Reiseergebnisse**: Verifiziere, dass Erholungs‑ und Abbruchzweige stets Clamp‑Funktionen respektieren und niemals Grenzen überschreiten.
  - Best Practice: Nutze fast‑check oder ein eigenes Property‑Harness, um beliebige `(harmony, stamina, modifier)`‑Tripel über den vollen Bereich zu generieren und zu asserten, dass jedes Ergebnis `harmony >= 1 && harmony <= 100 && money >= 0` erfüllt; ein Property‑Test deckt mehr ab als Dutzende Beispieltests.
  - Muster: Definiere die Property als benannte Invarianten‑Funktion (`travelOutcomeIsValid(outcome: TravelOutcome): boolean`) und rufe sie in Property‑Tests sowie als Dev‑Assertion im Travel‑Resolver auf — gleiche Invariante, zwei Enforcement‑Punkte.
  - Fallstrick: Generators, die nur „vernünftige“ Eingaben erzeugen (z. B. Harmony 10–90), verpassen Grenzfehler; immer die exakten Grenzwerte (1, 100, 0) als Seed‑Fälle inkludieren.
  - **Status:** TEILWEISE — Es existieren spezielle Travel/arrival Tests (`tests/utils/travelUtils.test.js`, `tests/golden-path/*`), aber keine Property‑/Fuzz‑Harness für generative Invarianz‑Tests. Beleg: [tests/utils/travelUtils.test.js](tests/utils/travelUtils.test.js#L1-L40) und [tests/golden-path/comprehensive-cycles.test.js](tests/golden-path/comprehensive-cycles.test.js#L1-L20)

## 4) Balance der Wirtschaft & Erklärbarkeit

- [ ] **Tuning‑Konstanten in eine Balance‑Konfiguration auslagern**: `economyEngine` enthält viele eingekapselte Konstanten; verschiebe sie in ein versioniertes Tuning‑Objekt für einfacheres A/B‑Balancing.
  - Best Practice: Definiere `BalanceConfig` als typisiertes Objekt mit Gruppen (`attendance`, `penalties`, `modifiers`, `caps`) und `configVersion: number`; speichere es in `src/config/balance.ts` und importiere es in der Engine — Config‑Swap für A/B ist dann ein einzelner Importwechsel.
  - Muster: Validere die Config beim Start mit `parseBalanceConfig(raw: unknown): BalanceConfig` Guard; ist die Config ungültig (z. B. Cap unter dem Minimum), wirf beim Boot deskriptive Fehler statt zur Laufzeit sinnlose Werte zu produzieren.
  - Fallstrick: Wenn du Konstanten zwar extrahierst, aber modul‑weit per `const { TICKET_BASE } = balanceConfig` bei Modul‑Scope importierst, verhinderst du Tree‑Shaking und koppelst Tests an Live‑Config; Übergib Config als Parameter an Engine‑Funktionen.
  - **Status:** TEILWEISE — Viele Tuning‑Konstanten (z. B. `MODIFIER_COSTS`) leben noch in `src/utils/economyEngine.ts`; eine zentrale `src/config/balance.ts` fehlt. Beleg: [src/utils/economyEngine.ts](src/utils/economyEngine.ts#L32-L44)

- [ ] **Wirtschafts‑Breakdown Trace‑Modus**: Gib per Schritt Beiträge (Attendance, Penalties, Modifiers, Caps) zur Fehlersuche aus.
  - Best Practice: Modeliere Trace als optionalen Akkumulator `calculateGigEconomy(state, config, trace?: BreakdownTrace)` — wenn `trace` gesetzt ist, fügt die Engine Schritt‑Einträge hinzu; wenn nicht, bleibt der Pfad zero‑overhead.
  - Muster: `BreakdownTrace = { steps: Array<{ label: string; value: number; running: number }> }` so kann das Debug‑Overlay direkt eine Wasserfall‑Darstellung rendern; `label` ist ein i18n‑Key.
  - Fallstrick: Trace‑Strings inline zu bauen (`\`attendance \_ baseRate = ${…}\``) vermischt Berechnung und Präsentation und macht die Trace nicht lokalisierbar; speichere strukturierte `{ label: string; inputs: Record<string, number>; output: number }`‑Objekte und formatiere in der UI.
  - **Status:** NICHT IMPLEMENTIERT — Es existiert kein opt‑in Trace‑Accumulator im Economy‑Pfad (z. B. `calculateGigEconomy(state, config, trace)`).

- [ ] **Anti‑Swing Glättungs‑Experiment**: Prototyp für Soft‑Floor/Ceiling um frühe Verluste/Gewinne abzufedern.
  - Best Practice: Implementiere Glättung als optionales `applySwingSmoothing(delta: number, state: GameState, config: BalanceConfig): number`‑Wrapper um das rohe Delta — Kernberechnung unverändert, Wrapper per Balance‑Flag toggelbar für A/B‑Tests.
  - Muster: Soft‑Floor als Kurve, nicht als harter Cap: `smoothedDelta = delta * (1 - exp(-|delta| / SWING_HALF_LIFE))` — reduziert extreme Schwankungen proportional statt abrupt.
  - Fallstrick: Symmetrische Dämpfung bestraft gute Spieler; erwäge asymmetrische Glättung (verluste stärker dämpfen als Gewinne).
  - **Status:** NICHT IMPLEMENTIERT — Kein `applySwingSmoothing`‑Wrapper oder Toggle in der Balance‑Pipeline gefunden.

- [ ] **Lokalisierbare Label für jede Breakdowns‑Zeile**: Jeder Gewinn/Verlust‑Ursprung braucht eine Nutzer‑sichtbare Erklärung.
  - Best Practice: Definiere `BREAKDOWN_LABEL_KEYS` (`{ TICKET_REVENUE: 'economy.breakdown.ticketRevenue', … }`) und verwende nur Keys aus diesem Objekt in `EconomyBreakdown`‑Zeilen — ein i18n‑Checker kann dann `Object.values(BREAKDOWN_LABEL_KEYS)` gegen Locale‑Dateien linter.
  - Muster: Füge neben `labelKey` ein `description`‑Feld (ebenfalls i18n‑Key) in das DTO, das eine einzeilige Mechanik‑Erklärung liefert — benutzt für Debug‑Panel und In‑Game‑Glossar.
  - Fallstrick: Neue Formel‑Schritte ohne `BREAKDOWN_LABEL_KEYS`‑Eintrag erscheinen im Trace, aber nicht in der Spieleransicht — teste, dass `Object.keys(traceSteps)` Teilmenge von `Object.values(BREAKDOWN_LABEL_KEYS)` ist.
  - **Status:** TEILWEISE — Viele Breakdown‑Zeilen liefern bereits `labelKey`, aber ein zentraler `BREAKDOWN_LABEL_KEYS`‑Linter/Check fehlt. Beleg: [src/utils/economyEngine.ts](src/utils/economyEngine.ts#L188-L220)

## 5) Karten‑Generierung & Recovery‑UX

- [ ] **Stabile Seed‑Strategie einführen**: `new MapGenerator(Date.now())` verhindert reproduzierbare Bug‑Reports; erwäge Run‑Seed + optionalen Debug‑Override.
  - Best Practice: Erzeuge Seed einmal bei Run‑Erstellung (`runSeed = crypto.getRandomValues(new Uint32Array(1))[0]`), persistiere ihn im `GameState` und übergebe ihn an `MapGenerator` — Seed ist dann automatisch Teil eines jeden Bug‑Reports.
  - Muster: Lese `?seed=<n>` Query‑Param in Dev/Staging und übergebe ihn als Override — QA kann Seeds einfach reproduzieren; Parameter wird in Prod ignoriert.
  - Fallstrick: `Date.now()` als Seed führt bei Sessions im selben Millisekundenfenster zu gleichen Maps (z. B. Automatisierte Tests) — nutze `crypto.getRandomValues` statt `Date.now()`.
  - **Status:** NICHT IMPLEMENTIERT — `useMapGeneration` verwendet aktuell `Date.now()` für den Seed; empfohlen: persistierbarer `runSeed` im `GameState`. Beleg: [src/context/useMapGeneration.ts](src/context/useMapGeneration.ts#L1-L56)

- [ ] **Inkrementelles Fallback bei Generationsfehlern**: Statt direkt zum Menü zurückzukehren, probiere bekannte sichere Template‑Maps als Graceful‑Fallback.
  - Best Practice: Commite die Template‑Map als statische JSON (`src/data/fallbackMap.json`) und validiere sie gegen `MapSchema` in CI — der Fallback kann so nicht still ungültig werden.
  - Muster: Drei‑Stufen‑Recovery: (1) Retry Generation bis `MAX_RETRIES` mit Sub‑Seed‑Offsets; (2) falls scheitert, lade die Template‑Map und sende Telemetrie; (3) nur bei Validierungsfehlern des Templates zurück ins Menü.
  - Fallstrick: Ein Fallback mit einer einzigen, geradlinigen Route ist zwar valide, aber langweilig; definiere Mindest‑Diversitätsanforderungen (mind. `N` Verzweigungen, mind. `M` Nicht‑Gig‑Nodes) im Schema.
  - **Status:** NICHT IMPLEMENTIERT — Keine statischen Template‑Fallbacks gefunden; bei Generationsexception wird nach Retries ins Menü zurückgegangen. Beleg: [src/context/useMapGeneration.ts](src/context/useMapGeneration.ts#L1-L120)

- [ ] **Map‑Failure‑Signatures loggen**: Einschluss der Generations‑Parameter und der fehlgeschlagenen Phase zur Fehleranalyse.
  - Best Practice: Strukturiere das Failure‑Log: `{ seed, attempt, phase: GenerationPhase, nodeCount, edgeCount, errorMessage, stack }` und emittiere es über den strukturierten Logger — konsistente Form vereinfacht Aggregation/Filterung.
  - Muster: `GenerationPhase` als String‑Literal‑Union (`'nodeLayout' | 'edgeConnection' | 'validation' | 'invariantCheck'`) definieren.
  - Fallstrick: Den ganzen Node‑Graph loggen kann MB‑große Einträge produzieren; logge nur die strukturelle Zusammenfassung und biete einen Debug‑Flag, um die volle Graph‑Datei lokal zu schreiben.
  - **Status:** TEILWEISE — Map‑Fehler werden geloggt, aber kein dediziertes strukturiertes Failure‑Signature‑Objekt mit `phase/nodeCount/edgeCount` gefunden. Beleg: [src/context/useMapGeneration.ts](src/context/useMapGeneration.ts#L1-L120), [src/utils/errorHandler.ts](src/utils/errorHandler.ts#L1-L80)

## 6) Prioritäre Test‑Lücken

- [ ] **Golden‑Path Simulation für Tagesloop**: travel → arrival → event (optional) → gig start/cancel → postgig economy assertions.
  - Best Practice: Schreibe die Simulation als reine State‑Machine‑Driver: `applySequence(initialState, [travelAction, arrivalAction, gigStartAction, postgigAction])` → finaler State — kein DOM/Hook/Async; läuft in <5 ms.
  - Muster: Golden‑Path‑Fixture als Tabelle `[stepName, actionCreator, expectedStateDelta]`; jede Zeile prüft nur ihre eigenen Felder, so bricht eine Economy‑Regression nicht die Travel‑Assertion.
  - Fallstrick: Einen Golden‑Path als Playwright‑E2E zu schreiben ist 50× langsamer; reine Logiktests gehören in Unit‑Tests.
  - **Status:** TEILWEISE — Es gibt Golden‑Path/Integrationstests unter `tests/golden-path/`, aber ein kompakter reiner‑State Golden‑Path‑Driver fehlt. Beleg: [tests/golden-path/comprehensive-cycles.test.js](tests/golden-path/comprehensive-cycles.test.js#L1-L20)

- [ ] **Fuzz‑Tests für feindliche Payloads**: Besonders Event‑Delta Flags und Quest‑Payloads.
  - Best Practice: Erzeuge feindliche Payloads mit einem strukturellen Fuzzer — für jedes Feld `null`, `undefined`, falscher Typ, leerer String, `Number.MAX_SAFE_INTEGER` und prototype‑polluting Keys (`__proto__`, `constructor`) testen; verlange, dass keine Exception entweicht und kein Zustand korrupt wird.
  - Muster: Pflege `HOSTILE_PAYLOAD_CASES` mit mind. 20 bekannten feindlichen Formen als Parameterised Test in `node:test` und Vitest.
  - Fallstrick: Fuzz‑Tests, die nur „keine Exception“ prüfen, passieren, auch wenn State silent corrupt ist; folge jedem Fuzz‑Call mit `checkInvariants(state)`.
  - **Status:** NICHT IMPLEMENTIERT — Kein strukturierter Fuzz‑Harness für feindliche Payloads vorhanden; es existieren gezielte Unit‑Tests (z. B. `saveValidator`, `eventResolver`) aber keine generative Fuzz‑Suite.

- [ ] **Performance‑Regressionscheck**: Benchmarke teure Berechnungen in `economyEngine` und Event‑Processing für lange Kampagnen.
  - Best Practice: Lege Budgets pro Funktion fest (`calcGigEconomy < 2 ms`, `resolveEvent < 1 ms`) in `perf-budgets.json`; der Runner schlägt in CI fehl, wenn ein Budget zwei aufeinanderfolgende Läufe überschreitet.
  - Muster: Simuliere „lange Kampagne“ mit 100 aufeinanderfolgenden Day‑Loops mit realistischem State‑Wachstum, um O(n²)‑Probleme zu finden.
  - Fallstrick: Benchmarks in Vitest‑Prozess mit Unit‑Tests ergeben verrauschte Ergebnisse; nutze dedizierte Bench‑Runner isoliert vom Test‑Suite.
  - **Status:** NICHT IMPLEMENTIERT — Keine `perf-budgets.json` oder CI‑enge enforcement für Performance‑Budgets gefunden; einige Profiling‑Skripte liegen unter `scripts/`, aber keine Budget‑Checks in CI.

## 7) Feature‑Chancen (Gameplay) — Backlog (umfassend)

### 7.1 Strategische Ebene (Overworld / Tourplanung)

- [ ] **Band‑Morale‑„Forecast“ Panel**: Zeige wahrscheinliche Harmony/Stamina‑Auswirkungen vor Routenbestätigung.
  - Best Practice: Wiederverwende `calcCancellationRisk` und Travel‑Outcome‑Resolver (siehe §3) — Panel muss exakt dieselben reinen Funktionen aufrufen wie die Engine.
  - Fallstrick: Divergierende Pfade zerstören Vertrauen.

- [ ] **Regionales Heatmap‑Overlay**: Visualisiere City‑Demand, Kontroversen‑Risiko und Erschöpfung.
  - Best Practice: Speichere `demand`, `fatigue`, `controversy` als `CityState` im `GameState` und lies sie direkt; normalisiere alle Metriken auf `0..1` vor dem Rendern.

- [ ] **Tour‑Leg‑Planner**: Queue 2–3 Destinationen mit Projektionen von Kosten, Downtime und Auszahlungs‑Varianz.
  - Best Practice: `plannedRoute: NodeId[]` im `GameState`; Actions `PLAN_ROUTE`/`CLEAR_ROUTE` nutzen, damit Planner undo‑fähig und replaybar ist.
  - Fallstrick: Eager Projektion auf jedem Render ist O(n) pro Frame — memoize mit `useMemo` keyed auf Array‑Referenz.

- [ ] **Venue Relationship System**: Wiederholte Outcomes ändern Trust, Booking Quality und Vertragskonditionen.
  - Best Practice: `venueRelationships: Record<VenueId, number>` clamped 0..100 initialisiert bei Map‑Generierung mit 50.
  - Fallstrick: Lazy‑Initialisierung in Selector führt zu inkonsistenten Defaults.

- [ ] **Travel‑Budget‑Assistant**: Pre‑Travel Prompt mit garantierten Upkeep + Fuel + Repair Risk.
  - Best Practice: Pure `calcTravelCostEstimate(route, state, config)` Funktion, nutzbar von UI und Tests.

### 7.2 Pre‑Gig Entscheidungen

- [ ] **Dynamische Promoter‑Verhandlung**: Kurzentscheidung beeinflusst Ticketpreis, Turnout‑Risk, Backlash.
  - Best Practice: Angebote als immutable `NegotiationOffer` in State speichern; Erzeugung einmalig beim Eintritt in `PREGIG` via seeded PRNG.

- [ ] **Setlist Risk/Reward Presets**: „safe“, „balanced“, „chaotic“ Templates.
  - Best Practice: Definiere Presets in Balance‑Config; Engine liest aktives Preset aus State.

- [ ] **Soundcheck Tradeoff Events**: Zeit/Geld für Stabilitäts‑Buffs vs weniger Pre‑Hype.
  - Best Practice: Soundcheck als PREGIG Sub‑Event über existierendes Event‑System.

- [ ] **Local Scene Intel Cards**: Stadtspezifische Traits vor Bestätigung anzeigen.
  - Best Practice: City‑Traits bei Map‑Erstellung per Run‑PRNG generieren und in State speichern.

- [ ] **Crew Assignment Choices**: Mitglieder für Prep Tasks zuweisen mit Opportunity Costs.
  - Best Practice: `crewAssignments: Record<BandMemberId, PrepTask | null>` im `GameState`; Validierung bei `GIG_START`.

### 7.3 Reisen & Interstitial Gameplay

- [ ] **Travel Incident Minichices**: Leichte Risiko/Reward‑Gabeln während der Reise via existierendem Event‑System.
- [ ] **Road Condition System**: Wetter/Strassenzustand beeinflusst Minigame‑Schwierigkeit & Van‑Wear.
- [ ] **Supply Stop Encounters**: Shops/Black‑Market mit deterministischem ShopInventory (seeded).
- [ ] **Band Banter Outcomes**: Dialogauswahl ändert Beziehungen — Outcome only stored, nicht Dialogtext.
- [ ] **Emergency Detour Contracts**: Temporäre MapNode‑Injection bei Akzeptanz, danach entfernen.

### 7.4 Performance / Gig Moment‑to‑Moment

- [ ] **Adaptive Crowd Behavior**
- [ ] **Encore Decision Mechanic**
- [ ] **Heckler Interaction Windows**
- [ ] **Spotlight Moments pro Bandmember**
- [ ] **Difficulty Assist Toggles**

### 7.5 Post‑Gig, Progression & Meta

- [ ] **Post‑Gig Coaching Prompts**: Ableiten aus `EconomyBreakdown` und `PerformanceMetrics`.
- [ ] **Performance Debrief Timeline**: Append‑Only Timeline in Gig‑State schreiben.
- [ ] **Fan Segment Progression**: `fanSegments` als separate Zahlen, total ableiten via Selector.
- [ ] **Narrative Consequence Chains**: Verzögerte Storylets als `pendingStorylets` mit `triggerAfterDay`.
- [ ] **Season Goals & Milestone Rewards**: Declarative Milestones im Data‑File, geprüfte Auslösung bei Day‑Advance.

### 7.6 Economy & Management Tiefe

- [ ] **Merch Strategy Screen**: Merch via `inventory_add` (per `AGENTS.md`), Umsatz als `EconomyBreakdown`‑Item berechnen.
- [ ] **Staff Hiring System**: `activeStaff` → passive Boni als Erweiterung von `gigModifiers`; Gehaltsabzug geplant.
- [ ] **Insurance & Warranty**: Insurance als Cap‑Feld in `gigModifiers`, nicht Spezialfall‑Logik.
- [ ] **Sponsorship Negotiation**: `activeContracts` mit `moneyPerGig`, `factionReputationDelta`, `expiresAfterGig`.
- [ ] **Debt & Financing Tools**: `activeDebts` mit integer Cents oder Decimal‑Wrapper, nicht Floats.

### 7.7 Soziales, Reputation & Weltreaktivität

- [ ] **Faction Reputation Tracks**
- [ ] **Media Cycle Simulation**
- [ ] **Rival Band Ecosystem**
- [ ] **Community Action Arcs**
- [ ] **Dynamic City State Changes**

### 7.8 Accessibility, UX & Onboarding

- [ ] **Run Advisor Mode**: AdvisorRules als Middleware‑Check vor Dispatch implementieren.
- [ ] **Glossary mit Live‑Beispielen**: `liveValueSelector` im Glossar‑Eintrag.
- [ ] **Failure Recovery Nudges**: Selector für `consecutiveLosses >= RECOVERY_THRESHOLD`.
- [ ] **Input Timing Calibration Utility**: `timingOffsetMs` in `settings`‑Slice, persistierbar (ADD to createInitialState allowlist).
- [ ] **Replayable Tutorials per Subsystem**: Tutorials als special flagged Event‑Chains, gegen isolierten `tutorialState` ausführen.

### 7.9 Live‑Ops & Replayability

- [ ] **Weekly Challenge Seeds**: Seeds serverseitig/UTC‑normalisiert verteilen.
- [ ] **Mutator Runs**: `activeMutators` im `GameState`, `applyMutators` erzeugt neue Config ohne Mutation.
- [ ] **Legacy Unlock Track**: `LegacyProfile` außerhalb `GameState`, persistiert seperat.
- [ ] **Community Event Packs**: Namespace mit `community:` Präfix, Schema‑Validierung bei Load.
- [ ] **Endgame Prestige Loop**: `RETIRE_RUN` kopiert Auswahl nach `LegacyProfile`, anschließend `createInitialState()`.

### 7.10 Narrative, Charaktere & Emotionale Stakes

- [ ] **Band Member Personal Arcs**
- [ ] **Relationship Crisis Interventions**
- [ ] **Manager/Mentor NPC Layer**
- [ ] **Branching Rivalry Storyline**
- [ ] **Memory Callbacks in Dialog**

### 7.11 Systems‑Tiefe für Band‑Identität

- [ ] **Genre Identity Stance**
- [ ] **Signature Move System**
- [ ] **Member Specialization Trees**
- [ ] **Practice Session Minigame**
- [ ] **Band Culture Values**

### 7.12 Fairness, Anti‑Frustration & Recovery

- [ ] **Bad‑Luck Protection Window**
- [ ] **Comeback Contract Offers**
- [ ] **Transparent Penalty Inspector**
- [ ] **Soft Fail‑State Alternatives**
- [ ] **Adaptive Event Pacing**

### 7.13 Creator/Community Tools

- [ ] **Seed Share Cards**
- [ ] **Photo Mode**
- [ ] **Run Summary Export**
- [ ] **Custom Challenge Rule Editor**
- [ ] **Community Playlist Events**

### 7.14 Plattform & Session Experience

- [ ] **Suspend/Resume Reliability**
- [ ] **Session‑Length Presets**
- [ ] **Offline‑First Daily Mode**
- [ ] **Cross‑Device Profile Handoff**
- [ ] **Battery/Performance Mode**

### 7.15 Audio, Stagecraft & Atmosphäre

- [ ] **Crowd Singalong Peaks**
- [ ] **Stage Hazard Modifiers**
- [ ] **Venue Acoustics Profiles**
- [ ] **Lighting Cue Mini‑System**
- [ ] **Ambient→Gig Transition Polish**

### 7.16 Prozedurale Inhalte & Run‑Varianz

- [ ] **Procedural City Quirks**
- [ ] **Venue Mutation Tags**
- [ ] **Dynamic Objective Cards**
- [ ] **Remix Event Outcomes**
- [ ] **Seasonal World Modifiers**

### 7.17 Sammlung, Basteln & Itemisierung

- [ ] **Gear Wear & Servicing Loop**
- [ ] **Pedal/Rig Customization**
- [ ] **Consumable Crafting**
- [ ] **Artifact Synergy Sets**
- [ ] **Inventory Auto‑Pack Presets**

### 7.18 Soziale Features & Wettbewerb

- [ ] **Asynchronous Rival Ghosts**
- [ ] **Club/Crew Systeme**
- [ ] **Bounty Board Challenges**
- [ ] **Theme‑Week Leaderboards**
- [ ] **Friendly Duel Mode**

### 7.19 Education, Transparenz & Debuggability für Spieler

- [ ] **Outcome Sandbox Simulator**
- [ ] **Mechanic Explainers In‑Context**
- [ ] **What‑Changed Diff Cards**
- [ ] **Player‑Visible Randomness Log**
- [ ] **Auto‑Generated Run Journal**

### 7.20 Experimentelle Modi & Cross‑Genre Varianten

- [ ] **Narrative‑Only Campaign Mode**
- [ ] **Hardcore Permadebt Mode**
- [ ] **Co‑op Local Pass‑and‑Play**
- [ ] **Speedrun Seed Mode**
- [ ] **Director Mode**

### 7.21 Chaotische Comedy & Emergente Desaster

- [ ] **The Cursed Fog Machine**
- [ ] **Stage‑Dive Insurance Fraud Chain**
- [ ] **Mysterious Raccoon Roadie**
- [ ] **Wrong‑City Booking Fiasco**
- [ ] **Haunted Amplifier Arc**

### 7.22 Fangemeinde, Memes & Internet‑Wahnsinn

- [ ] **Meme Stock Fame Spikes**
- [ ] **Fan Chant Builder**
- [ ] **Clip‑Of‑The‑Night**
- [ ] **Comment‑Section Roulette**
- [ ] **Bootleg Merch Wars**

### 7.23 Venue‑Skurrilitäten & Weltflair

- [ ] **Absurd Venue Generator**
- [ ] **Local Superstition Modifiers**
- [ ] **Audience Archetype Nights**
- [ ] **Power‑Grid Instability Mode**
- [ ] **Surprise Guest Chaos**

### 7.24 Off‑Stage Leben & Band‑Persönlichkeit

- [ ] **Band‑House Chaos Events**
- [ ] **Pet Mascot System**
- [ ] **Merch Design Mini‑Studio**
- [ ] **Sleep‑Deprived Interview Mode**
- [ ] **Tour Documentary Crew**

## 8) Integrations‑Best Practices

### 8.1 Modul‑Contract Enforcement

- [ ] **Explizite Public‑APIs pro Modul deklarieren**: interne Helfer mit Namenskonvention oder Barrel‑Reexport kennzeichnen, damit Aufrufer nicht an Implementierungsdetails hängen.
  - Best Practice: Internen Funktionen `_`‑Prefix geben und via ESLint allow‑pattern (`no‑underscore‑dangle`) erzwingen, damit Leaks als Lint‑Fehler erscheinen.
  - Fallstrick: `export` allein bedeutet nicht „Public API“ — Barrel‑Reexport ist der Vertrag.
- [ ] **Co‑locate Contracts als TypeScript Interface‑Dateien**: `src/contracts/` für Shapes, getrennt von Implementierung.
  - Best Practice: Verträge in abhängigkeitfreien Sub‑Package halten, damit Tests/Mocks keine große Modulgraph laden.
  - Muster: `interface IEventEngine { resolve(event: GameEvent, state: GameState): EventResolution }`.
- [ ] **Barrel‑Only Imports via ESLint `no-restricted-imports` erzwingen**: verhindere Deep‑Imports.
  - Best Practice: Regel per Domain‑Folder konfigurieren; `pnpm run lint` blockiert PRs bei Verletzung via `--max-warnings 0`.
  - Fallstrick: IDE Auto‑Import kann Deep‑Paths erzeugen; Lint muss on‑save ausführen.

- [ ] **Contract‑Violation Tests**: leichte Tests, die nur das public barrel importieren und fehlende Exporte als `undefined` prüfen.
  - Best Practice: `describe('public surface')` pro Modul, list alle erwarteten Exporte.
  - Muster: Kombinieren mit `satisfies` für Compile‑Time‑Assertions.

- [ ] **Breaking‑Change Policy pro Modul dokumentieren**: `@breaking-change` JSDoc Tag für Funktionen mit mehreren Callern.
  - Fallstrick: Koordinierte Rename statt dualer Signaturen.

- [ ] **Module‑Dependency Graph generieren und als CI‑Artefakt committen**: `madge`/`dependency‑cruiser` verwenden; CI schlägt fehl bei neuen Zyklen.

### 8.2 Action Creator ↔ Reducer Integration

- [ ] **ActionType↔Payload Mapping zur Build‑Zeit ableiten**: `ActionPayloadMap` aus ActionCreator ReturnTypes generieren.
  - Best Practice: Ableitung via `ReturnType<typeof import('./actionCreators')[keyof typeof import('./actionCreators')]>`.
  - Fallstrick: Handgeschriebene Union divergiere leicht.

- [ ] **Snapshot‑Tests für jeden Action‑Creator Output**: eine Fixture pro ActionType, JSON‑serialisiert.
  - Muster: `expect(JSON.stringify(createUpdatePlayerAction({ money: 500 }))).toMatchSnapshot()`.

- [ ] **`assertNever` Coverage erzwingen**: Compile‑Time Test (`reducerExhaustive.typetest.ts`) sicherstellt Exhaustiveness.

- [ ] **Unknown Actions in Produktion via Telemetry stub ablehnen**: Leichter `reportUnknownAction(type)`‑Stub (No‑Op in Prod, Warn in Dev).

- [ ] **Action Payloads immer serialisierbar halten**: Test: `noFunctions` JSON‑Schema Check — keine Dates/Sets/Callbacks inside Payloads.

- [ ] **Commands vs Events trennen**: Commands sind Intent (`SET_MONEY`), Events sind Fakten (`MONEY_CHANGED`) — Benennungskonvention `do*` für Commands, `on*`/Past‑Tense für Events.

### 8.3 Hook ↔ Store Integration

- [ ] **Rohes `dispatch` in Domain‑Hooks verbieten**: Hooks rufen benannte ActionCreators; raw `dispatch({ type: … })` ist Lint‑Fehler.
  - Best Practice: `useGameDispatch` Wrapper bieten, der nur typisierte Creator‑Aufrufe exposes.
  - Fallstrick: Prop‑Drilling von `dispatch` verhindert statische Enforcement.
- [ ] **Render‑freie Integrationstests für Hooks via `renderHook`**: `useEventSystem`, `useArrivalLogic`, `useEconomyEngine` mit echtem Store testen.
  - Muster: Helfer `createTestStoreWrapper(initialState)`.

- [ ] **Hook Tear‑Down Kontrakte dokumentieren & testen**: `useEffect`‑Cleanup darf keine Abonnements/Refs hinterlassen.

- [ ] **Selector Identity Tests**: Prüfe referenzielle Stabilität von Hot‑Path‑Selectors; nutze `reselect` wenn notwendig.

- [ ] **Hook Complexity Budget**: Hooks > ~80 Zeilen oder >3 Hooks sind Refactor‑Signal; optional ESLint‑Regel zählen.

- [ ] **Concurrent Dispatch Tests**: Zwei Actions im gleichen `act()` block dispatchen und finalen State prüfen.

### 8.4 Audio‑Engine Integration

- [ ] **`audioEngine` hinter typisiertem Service isolieren**: `IAudioEngine` definieren; Tests können Null/Test‑Implementierungen nutzen.
  - Best Practice: `IAudioEngine` mit `getGigTimeMs`, `startGig`, `stopGig`, `scheduleNote`.
  - Muster: `NullAudioEngine` mit `getGigTimeMs() => 0` für CI.
  - Fallstrick: Modul‑Level Import des Audio‑Singletons verhindert Austausch in Tests.

- [ ] **Integrationstest für Gig‑Timing Contract**: `audioEngine.getGigTimeMs()` Drift‑Toleranz (`GIG_CLOCK_DRIFT_TOLERANCE_MS = 10`) prüfen.

- [ ] **Guard für Tone.js `start`/`stop` Calls**: `withAudioContext(fn)` helper, prüft `Tone.context.state` und resumed/schlägt sauber fehl.

- [ ] **Cross‑Module Event Ordering Test**: `setlistCompleted` muss vor `isNearTrackEnd` feuern — Sequenz exakt prüfen.

- [ ] **Latency Budget Test für Note Scheduling**: `scheduleNote(time)` muss ≥ `NOTE_LOOKAHEAD_MS` früh genug aufgerufen werden.

- [ ] **Audio Session State separat versionieren**: Engine‑internes transientes State nicht serialisieren; Restore‑Test, dass Engine clean startet.

### 8.5 Persistenz‑Integration

- [ ] **Persisted State Schema versionieren**: `schemaVersion` in Save, Migrationskette `migrations/v1→v2.ts` beim Laden anwenden.
  - Best Practice: Migrations als pure Funktionsliste, sequentiell anwendbar.
  - Fallstrick: Blindes Merge statt Migration droppt/retained Felder falsch.
- [ ] **Round‑Trip Serialization Tests**: `serialize(deserialize(serialize(state))) === serialize(state)` — pro Slice testen.
- [ ] **Partial/Corrupt Save Recovery Tests**: Truncated JSON, fehlende Keys, `__proto__` Cases; Loader muss sane InitialState zurückgeben.
- [ ] **Save Checksum / leichte Tamper‑Evidenz**: `SubtleCrypto.digest('SHA-256', encoded)` und Checksum neben Payload speichern; bei Mismatch warnen & fallback.
- [ ] **Max Save Size prüfen**: Byte‑Length Assertion; bei Überschreitung dev warnen, prod altes Run‑History trimmen; für großes Append‑History IndexedDB via `StorageAdapter` verwenden.
- [ ] **Migration Failures handhaben**: Wenn Migration wirft, catchen, loggen und `createInitialState()` zurückgeben.

### 8.6 Map‑Gen ↔ Engine Integration

- [ ] **Schema‑Validierung nach Generierung**: `MapSchema.safeParse(raw)` und bei Fehler retry/fallback statt Propagation.
  - Best Practice: Schema als TS‑Typ und runtime Validator (`zod` oder Guard) — keine doppelte JSON‑Schema‑Pflege.
  - Muster: `if (!result.success) { logMapError(...); return fallbackMap(); }`.

- [ ] **Contract Test `MapNode` ↔ travel system**: Jeder NodeType vom Generator muss von `handleNodeArrival` abgedeckt sein; Exhaustiveness Test aus `NodeType` Enum ableiten.

- [ ] **PRNG aus Deterministic Run ID seedieren**: `runSeed` im persisted State, splittable PRNG für Subsysteme.

- [ ] **Map‑Generation Fuzz Harness**: 1 000 Seeds in CI prüfen, semantische Invarianten asserten.

- [ ] **Fallback‑Map Validierung**: Fallback ebenfalls gegen Schema & Contract Tests validieren.

- [ ] **Map‑Render Integrationstest**: Generierte Map serialisieren und gegen golden snapshot prüfen.

### 8.7 Event ↔ Quest/Flag Integration

- [ ] **Keine verwaisten Flag‑Writes**: `flags.registry.ts` mit `const FLAGS = { … } as const`; Writer/Reader referenzieren `FLAGS.*` statt Strings.
  - Muster: Test diffet `Object.values(FLAGS)` gegen alle Flag‑Reads via `grep`.
  - Fallstrick: Dynamische Keys `\`quest\_${id}\_complete\`` entziehen statischer Analyse — typed union bevorzugen.
- [ ] **QuestPayload strikt typisieren**: Diskriminierte Union + zod/Guard beim Resolver‑Boundary.
- [ ] **Integrationstest für Multi‑Step Event Chains**: Table of steps, `vi.useFakeTimers()` für deterministische Timeout‑Collapse.
- [ ] **Event Resolver Re‑Entry Guard**: `Set<string>` of in‑flight IDs, `finally` immer räumen.
- [ ] **Flag‑Write Audit Log in Dev**: Dev‑Ringpuffer mit `{ key, value, eventId, timestamp }`‑Einträgen im Debug‑Overlay.
- [ ] **Max Flags per Resolution**: Cap (z. B. `MAX_FLAGS_PER_RESOLUTION = 10`) und Warnung/Truncation.

### 8.8 Economy Engine ↔ UI Integration

- [ ] **Typed `EconomyBreakdown` DTO exposen** statt raw Number‑Deltas.
  - Best Practice: DTO `{ lineItems: Array<{ labelKey: string; delta: number; sign: '+' | '-' | '=' }>, total: number }`.
  - Fallstrick: UI eigenständig `total` berechnen → Rundungsdifferenzen.

- [ ] **Visual Regression Snapshots für Breakdowns**: deterministische Fixture mit alle Sign‑Varianten, Null‑Line, Max‑Label‑Length; Playwright Screenshots in Docker für Pixel‑Stabilität.

- [ ] **Currency Formatting Tests unter Locale‑Wechsel**: `Intl.NumberFormat` mit expliziten Optionen nutzen.

- [ ] **Alle Breakdowns‑Labels i18n‑keys testen**: Lint/Test gegen `en/` und `de/`.

- [ ] **Determinismus Contract Test**: Bei gleichem Input+Seed `calculateGigEconomy` byte‑identische Ausgaben liefern.

- [ ] **Boundary Test extreme Economy‑Werte**: Vermeidung von `NaN`, `Infinity` und `-0`.

### 8.9 CI / Gate Hardening

- [ ] **Unit/Integration/E2E Jobs trennen**: Namenskonventionen `*.unit.test.ts`, `*.integration.test.ts`, `*.e2e.test.ts` und drei Profile in `vitest.config`.
- [ ] **Module‑Boundary Check in Standard Lint Step**: `no-restricted-imports` in zentralem ESLint.
- [ ] **Pinned Test Fixtures committed halten**: Keine Network‑Fetches in Tests; `msw` für Fetch‑Abstraktion.
- [ ] **Schema‑Drift Check Job**: TS→JSON Schema gegen committed golden diffen.
- [ ] **Per‑Module Coverage Thresholds**: konservative Startwerte, langsam erhöhen.
- [ ] **Test‑Duration Budget**: CI fehlschlägt bei Einzeltests > 5s.
- [ ] **Dead‑Code Detection**: `ts-prune`/`knip` in CI.

### 8.10 Third‑Party / External Integration Boundaries

- [ ] **`StorageAdapter` Abstraktion** für `localStorage`/`sessionStorage` implementieren.
  - Best Practice: `IStorageAdapter` mit `LocalStorageAdapter`, `InMemoryAdapter`, `NoopAdapter`; inject via React Context.
  - Fallstrick: Module‑Level `localStorage.setItem` verhindert Adapter‑Swap.

- [ ] **Zentralen Environment Service** für `window`/`document` (SSR/Node‑Safety).
- [ ] **Clock Service für deterministische Tests** (`IClock`) statt `Date.now()`/`new Date()` überall.
- [ ] **Browser API Fallbacks dokumentieren & testen**: WebAudio, `localStorage`, `ResizeObserver`.
- [ ] **Dependency Freshness Check (wöchentlich)**: `pnpm outdated --json` → Notification (nicht auto upgrade).
- [ ] **`postMessage` / `BroadcastChannel` origin Validation auditieren**.
- [ ] **StorageAdapter Fallback für Private Browsing testen**: `localStorage.setItem` kann eine `DOMException` werfen — Adapter muss catchen und in‑Memory fallbacken.

## 9) Technische Schuld‑Verfolgung

- [ ] **Tagge High‑Risk Pfade mit strukturierten TODO‑IDs** (`TODO[STATE-###]`, `TODO[FLOW-###]`) und verlinke Issues.
- [ ] **Design‑Intent‑Kommentare für nicht‑offensichtliche Mechaniken** (z. B. Cancellation‑Math) hinzufügen.
- [ ] **Cross‑Module Contracts dokumentieren** (`arrivalUtils` ↔ `useArrivalLogic`, `eventEngine` ↔ `useEventSystem`) in einer kurzen Architektur‑Notiz.
