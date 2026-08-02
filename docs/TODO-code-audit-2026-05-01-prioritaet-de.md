# Priorisierung des Code‑Audits (2026-05-01)

Priorisierung aller offenen Punkte aus [TODO-code-audit-2026-05-01-de.md](TODO-code-audit-2026-05-01-de.md). Stand der Verifikation: 2026-08-02.

## Bewertungsmodell

**Priorität**

- **P0 — Risiko:** Korrektheits‑, Datenverlust‑ oder Sicherheitsproblem. Vor neuen Features.
- **P1 — Fundament:** schaltet mehrere andere Punkte frei oder verhindert eine ganze Fehlerklasse.
- **P2 — Qualität:** Observability, Testtiefe, Wartbarkeit. Laufend nebenher.
- **P3 — Optional:** sinnvoll, aber ohne Hebel auf andere Arbeit.
- **F1–F4** — Feature‑Backlog (§7), eigene Skala; siehe unten.

**Aufwand:** S = klein, M = mittel, L = groß.

Bereits erledigte Punkte (§1 Invarianten‑Tests, §2 reiner Resolver, §3 Idempotenz/Routing/Abbruchrisiko) sind hier nicht mehr gelistet.

## P0 — zuerst

| #      | Punkt                                                          | Aufwand | Begründung                                                                                                                                |
| ------ | -------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1a   | `logger.warn` im `gameReducer` auf `action.type` einschränken  | S       | Der Default‑Zweig übergibt weiterhin die komplette Payload; Geldbeträge und Spielernamen landen in der Konsole. Einzeiler, sofort fixbar. |
| 8.5.1  | `schemaVersion` + Migrationskette im Save                      | L       | Ohne Version ist jede Save‑Formatänderung ein potenzieller Spielstandverlust. Teuerster Fehler im ganzen Dokument.                        |
| 8.5.6  | Migrationsfehler abfangen → `createInitialState()`             | S       | Gehört zwingend zu 8.5.1; eine werfende Migration darf nicht den Boot blockieren.                                                         |
| 8.5.3  | Recovery‑Tests für partielle/korrupte Saves                    | S       | `saveValidator`‑Tests decken `__proto__` bereits ab; fehlende Keys und abgeschnittenes JSON ergänzen.                                     |
| 5.1    | Stabiler `runSeed` statt `Date.now()`                          | M       | Blockiert reproduzierbare Bug‑Reports, Map‑Fuzzing (8.6.4), Seed‑Sharing (7.13) und Weekly Seeds (7.9). Höchster Hebel der P0‑Gruppe.     |
| 6.2    | Fuzz‑Harness für feindliche Payloads                           | M       | `checkInvariants` existiert jetzt (§1) — der teure Teil ist gebaut, es fehlt nur der Generator davor.                                     |
| 8.10.7 | StorageAdapter‑Fallback für Private Browsing                   | S       | `localStorage.setItem` wirft im Private Mode eine `DOMException` — heute eine harte Absturzklasse.                                        |
| 8.10.6 | `postMessage`/`BroadcastChannel` Origin‑Validierung auditieren | S       | Reiner Audit; falls ungeprüfte Origins existieren, ist das eine Injektionsfläche.                                                         |

## P1 — Fundament

Diese Punkte schalten jeweils mehrere andere frei. Reihenfolge innerhalb der Tabelle ist die empfohlene Bearbeitungsreihenfolge.

| #      | Punkt                                                     | Aufwand | Schaltet frei / verhindert                                                |
| ------ | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| 4.1    | Balance‑Config (`src/config/balance.ts`, `configVersion`) | L       | 2.3 dailyCaps, 4.3 Glättung, 7.2 Setlist‑Presets, 7.1 Kostenschätzung     |
| 8.10.3 | Clock‑Service (`IClock`)                                  | M       | deterministische Tests überall; Gegenstück zu 5.1                         |
| 8.10.1 | `StorageAdapter`‑Abstraktion                              | M       | 8.5.x testbar ohne DOM; Voraussetzung für 8.10.7 als saubere Lösung       |
| 8.4.1  | `IAudioEngine` + `NullAudioEngine`                        | M       | 8.4.2–8.4.6, Audio‑freie CI‑Läufe                                         |
| 6.1    | Reiner Golden‑Path‑Driver (`applySequence`)               | M       | schnelle Regressionsbasis für alle Economy‑/Travel‑Änderungen             |
| 8.7.1  | Flag‑Registry (`FLAGS` as const)                          | M       | verhindert verwaiste Flag‑Writes — stille Fehlerklasse ohne Testabdeckung |
| 8.7.2  | `QuestPayload` strikt typisieren                          | M       | Quest‑Domäne ist mit 14 Modulen die größte ungetypte Grenze               |
| 5.2    | Fallback‑Template‑Map                                     | M       | verhindert Run‑Verlust bei Generierungsfehlern (heute: zurück ins Menü)   |
| 8.6.1  | Schema‑Validierung nach Generierung                       | M       | Voraussetzung dafür, dass 5.2 überhaupt greifen kann                      |
| 8.6.5  | Fallback‑Map ebenfalls validieren                         | S       | sonst kann der Fallback still ungültig werden                             |
| 8.6.2  | Exhaustiveness‑Test `MapNode` ↔ `handleNodeArrival`       | S       | neuer NodeType ohne Handler ist heute ein stiller Fallback                |
| 4.4    | `BREAKDOWN_LABEL_KEYS`                                    | S       | macht 8.8.4 zu einem Einzeiler; verhindert unbeschriftete Economy‑Zeilen  |
| 8.8.4  | i18n‑Key‑Test für alle Breakdown‑Labels                   | S       | mit 4.4 zusammen erledigen                                                |
| 8.8.3  | Currency‑Formatting‑Tests bei Locale‑Wechsel              | S       | `formatCurrency` ist per `AGENTS.md` Pflicht, aber ungetestet             |
| 8.8.6  | Boundary‑Test für `NaN` / `Infinity` / `-0`               | S       | passt zur bestehenden `finiteNumberOr`‑Konvention                         |
| 8.2.5  | Action‑Payloads serialisierbar halten (Test)              | S       | schützt 8.5.x — nicht serialisierbare Payloads brechen Saves stumm        |
| 8.4.2  | Gig‑Clock Drift‑Toleranz testen                           | S       | Gig‑Timing ist Kern‑Gameplay und hat heute keinen Contract‑Test           |
| 8.4.3  | `withAudioContext(fn)` Guard                              | S       | Autoplay‑Policy‑Fehler sind eine reale, sichtbare Ausfallklasse           |
| 8.5.2  | Round‑Trip‑Serialisierungstests pro Slice                 | S       | billige Absicherung der Migrationsarbeit aus 8.5.1                        |
| 8.9.7  | Dead‑Code‑Detection (`knip`/`ts-prune`) in CI             | S       | sehr billig, hohes Signal, sofort einsetzbar                              |

## P2 — Qualität und Observability

Laufend nebenher, keine feste Reihenfolge.

**Reducer & Actions:** 1.1b Dev‑Metrik für unbekannte Actions (identisch mit 8.2.4 — als ein Punkt umsetzen) · 8.2.1 `ActionPayloadMap` ableiten · 8.2.2 Snapshot‑Tests pro Action‑Creator

**Events:** 2.2 Replay‑Fixtures für Event‑Deltas · 2.3 kategoriebasierte `dailyCaps` (nach 4.1) · 8.7.3 Multi‑Step‑Chain‑Integrationstest · 8.7.4 Re‑Entry‑Guard im Resolver

**Economy:** 4.2 Trace‑Modus · 8.8.1 typisiertes `EconomyBreakdown`‑DTO vervollständigen · 8.8.5 Determinismus‑Contract‑Test

**Travel & Map:** 3.4 Property‑Tests für Reiseergebnisse · 5.3 strukturierte Map‑Failure‑Signatures · 8.6.4 Map‑Fuzz über 1 000 Seeds (nach 5.1)

**Hooks:** 8.3.1 rohes `dispatch` verbieten · 8.3.2 `renderHook`‑Integrationstests · 8.3.3 Tear‑Down‑Kontrakte · 8.3.4 Selector‑Identity‑Tests · 8.3.6 Concurrent‑Dispatch‑Tests

**Audio:** 8.4.4 Cross‑Module Event Ordering · 8.4.5 Latency‑Budget für `scheduleNote` · 8.4.6 Audio‑Session‑State separat versionieren

**Persistenz:** 8.5.5 Max‑Save‑Size prüfen

**Module & CI:** 8.1.3 `no-restricted-imports` auf weitere Domain‑Ordner ausweiten (Basis existiert bereits) · 8.1.6 Dependency‑Graph/Zyklen‑Check · 8.9.1 Unit/Integration/E2E trennen · 8.9.2 Boundary‑Check im Standard‑Lint · 8.9.3 Fixtures gepinnt, keine Netzwerk‑Fetches · 8.9.5 Per‑Modul Coverage‑Thresholds · 8.9.6 Test‑Duration‑Budget · 6.3 Perf‑Budgets

**Externe Grenzen:** 8.10.2 Environment‑Service · 8.10.4 Browser‑API‑Fallbacks dokumentieren · 8.10.5 wöchentlicher Dependency‑Freshness‑Check

**Doku:** 9.2 Design‑Intent‑Kommentare · 9.3 Cross‑Module‑Contracts‑Notiz

## P3 — optional

1.2 `satisfies ReducerMap` (im Audit bewusst als „intentionell" markiert) · 2.4 `IEventAnalytics` · 4.3 Anti‑Swing‑Glättung · 8.1.1 `_`‑Prefix‑Konvention · 8.1.2 `src/contracts/` · 8.1.4 Contract‑Violation‑Tests · 8.1.5 Breaking‑Change‑Policy · 8.2.3 `assertNever`‑Typetest · 8.2.6 Commands/Events‑Umbenennung (großer Rename, kleiner Ertrag) · 8.5.4 Save‑Checksum · 8.6.6 Map‑Render Golden Snapshot · 8.7.5 Flag‑Write‑Audit‑Log · 8.7.6 `MAX_FLAGS_PER_RESOLUTION` · 8.8.2 Visual‑Regression‑Snapshots · 8.9.4 Schema‑Drift‑Job · 9.1 strukturierte TODO‑IDs

## Feature‑Backlog (§7)

Eigene Skala, weil hier Spielerwert statt Risiko zählt. Innerhalb einer Stufe ist nichts weiter sortiert.

### F1 — bester Wert pro Aufwand, nutzt vorhandene Systeme

- **7.1 Band‑Morale‑Forecast** — `calcCancellationRisk` existiert bereits (§3); das Panel ist fast nur noch UI.
- **7.1 Travel‑Budget‑Assistant** — eine pure Funktion plus Prompt, macht die undurchsichtigste Entscheidung des Spiels lesbar.
- **7.5 Post‑Gig Coaching Prompts** — leitet sich vollständig aus dem vorhandenen `EconomyBreakdown` ab.
- **7.19 What‑Changed Diff Cards** und **Mechanic Explainers** — dieselbe Datenquelle wie 4.2 Trace.
- **7.8 Glossary mit Live‑Beispielen**, **Failure Recovery Nudges**, **Input Timing Calibration** — Accessibility mit kleinem Fußabdruck.
- **7.12 Transparent Penalty Inspector**, **Bad‑Luck Protection Window** — adressieren direkt die im Audit genannte Undurchsichtigkeit.
- **7.3 Travel Incident Minichoices** und **7.2 Soundcheck Tradeoff Events** — laufen komplett über das bestehende Event‑System, kein neues Subsystem.

### F2 — echte Systemtiefe, mittlerer Aufwand

7.1 Venue Relationships · Tour‑Leg‑Planner · Regionales Heatmap‑Overlay | 7.2 Promoter‑Verhandlung · Setlist‑Presets (nach 4.1) · Local Scene Intel · Crew Assignment | 7.4 Encore Decision · Adaptive Crowd · Spotlight Moments · Difficulty Assists · Heckler Interaction Windows (Projektil‑Hazard existiert, Entscheidungsfenster fehlt) | 7.5 Fan Segment Progression · Narrative Consequence Chains · Season Goals · Debrief Timeline | 7.6 Merch Strategy · Staff Hiring · Insurance · Sponsorship · Debt Tools | 7.3 Road Conditions · Supply Stops · Band Banter · Emergency Detours

### F3 — Flavor und Varianz, nach F1/F2

7.7 Faction/Media/Rivals/Community/City‑State · 7.10 Narrative & Charaktere · 7.11 Band‑Identität · 7.15 Audio & Stagecraft · 7.16 Prozedurale Varianz · 7.17 Gear & Crafting · 7.21 Chaos‑Comedy · 7.22 Meme‑Kultur · 7.23 Venue‑Skurrilitäten · 7.24 Off‑Stage‑Leben

### F4 — blockiert oder infrastrukturabhängig

- **7.9 Live‑Ops** — braucht 5.1 `runSeed` plus eine Verteilungsstrategie für Seeds.
- **7.13 Creator‑Tools** — Seed Share Cards hängen ebenfalls an 5.1.
- **7.18 Soziales & Wettbewerb** — `useLeaderboardSync` existiert als Ansatz, der Rest braucht Backend‑Entscheidungen.
- **7.14 Plattform & Session** — überschneidet sich stark mit 8.5.x; erst nach der Persistenz‑Arbeit sinnvoll.
- **7.20 Experimentelle Modi** — sinnvoll erst, wenn der Kern‑Loop durch F1/F2 stabil ist.

### Architektur‑Vorbehalt

**7.8 Run Advisor Mode** ist im Audit als „Middleware‑Check vor Dispatch" beschrieben. Das kollidiert mit der Regel aus `AGENTS.md`, dass alle Zustandsänderungen über typisierte Action‑Creator laufen und der Reducer autoritativ bleibt. Vor der Umsetzung als reiner Selector über dem State neu entwerfen, nicht als Dispatch‑Interceptor.

## Empfohlene Reihenfolge

1. **P0 komplett** — angeführt von 1.1a (Einzeiler), dann der Persistenz‑Block 8.5.1/8.5.6/8.5.3, dann 5.1.
2. **P1‑Fundament** in Tabellenreihenfolge; die S‑Punkte am Ende der Tabelle sind billige Mitnahmen.
3. **F1‑Features** parallel dazu — sie brauchen kaum neue Infrastruktur und machen den Fortschritt sichtbar.
4. **P2** laufend nebenher, bevorzugt im selben PR wie die Änderung, die den Punkt betrifft.
5. **F2**, danach **P3** und **F3/F4** nach Bedarf.
