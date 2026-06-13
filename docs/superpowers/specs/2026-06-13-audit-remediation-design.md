# Design: Behebung aller Findings aus dem Flow-Audit (2026-06-13)

Quelle: `neurotoxic-game-flow-audit-consolidated-verified-2026-06-13.md`
Umfang: **alle** Findings — 10 Major, 5 Minor, 4 Follow-up-Risiken plus übergreifende Aufräumarbeiten.

## Leitprinzipien (Architektur-Ansatz)

Das Audit benennt ein wiederkehrendes Muster: UI-/Hook-Validierung ohne ebenso starke
Reducer- oder Transaktionsgrenze. Der Ansatz dieser Arbeit:

- **Reducer wird letzte Instanz** für die Einmal-/Ökonomie-Findings (Blutbank-Leistbarkeit,
  Minigame-Aktiv/Typ-Guards). Höchster Wert, deckt sich mit der Reducer-Boundary-Vorgabe der Repo-Guidelines.
- **Bestehendes Per-Site-Muster beibehalten** für Re-Entry-Guards (jede Szene/Hook hat bereits
  ihr eigenes `isProcessing*Ref`-Idiom — nachbauen, nicht vereinheitlichen). Keine Abstraktion für
  Einmal-Code (AGENTS.md: "Simplicity First").
- **Geteilte Helfer nur dort extrahieren, wo das Audit echte Wiederverwendung benennt**: ein
  gemeinsamer Settings-Sanitizer und die Wiederverwendung des bestehenden BandHQ-Purchase-Locks im SupplyStop.

## Getroffene Design-Entscheidungen

| Finding | Entscheidung |
| --- | --- |
| Roadie-Contraband (Major #10) | **Echten Stash-Eintrag konsumieren**: konkretes Stash-Item bei Minigame-Start wählen, bei erfolgreicher Lieferung einen Stack verbrauchen, erst danach zahlen/Quest fortschreiben. |
| Practice-Rückkehr (Major #9) | **HQ nur bei `OVERWORLD` öffnen**: `setPendingBandHQOpen(true)` nur wenn `targetScene === OVERWORLD`. MENU bleibt gültiges Rückkehrziel ohne HQ-Popup. |
| Asset-Modals (Minor) | **Globaler Owner nahe `App`**: RiskEvent-/Foreclosure-Modals szenenübergreifend mounten. |

---

## Theme A — Reducer als letzte Instanz (Idempotenz & Leistbarkeit)

1. **Blutbank-Leistbarkeit** (`src/context/reducers/clinicReducer.ts`): Prüfung
   (`validateBloodBankDonation`-äquivalent) in `handleBloodBankDonate` *nach* Payload-Normalisierung
   und *vor* dem Anwenden von `moneyGain`. Bei Fehlschlag unveränderten State zurückgeben. Bestehende
   Tests, die das Clamp-Success-Exploit kodifizieren, ersetzen.
2. **Replay-Guards für Setup-Minigames** (`src/context/reducers/minigameReducer.ts`): am Kopf der
   Completion-Handler für Amp Calibration, Kabelsalat und Roadie
   `state.minigame?.active === true && state.minigame?.type === <erwartet>` verlangen, sonst State
   zurückgeben. Expliziten Guard auch für Tourbus ergänzen (Vertragssymmetrie).

**Tests:** jeden Handler zweimal aufrufen → zweiter Aufruf ohne zusätzliche Ökonomie-/Quest-/Toast-Effekte;
Blutbank lehnt ab, wenn Harmony oder die Stamina (+Survival-Puffer) eines Members nicht zahlen kann —
Money/Harmony/Stamina/Controversy/Toasts bleiben unverändert.

## Theme B — Einmal-UI-Re-Entry-Guards (bestehendes Per-Site-Idiom)

3. **Event-Modal** (`src/ui/EventModal.tsx` + `src/context/useEventSystem.ts`): Einmal-Ref-Guard +
   Continue nach erstem Klick deaktivieren; `resolveEventCallback` wird No-Op, wenn
   `stateRef.current.activeEvent` null ist.
4. **Post-Gig Continue** (`src/scenes/PostGig.tsx` → `src/components/postGig/CompletePhase.tsx`):
   `isProcessingAction` durchreichen (aktuell verworfen); Guard in `useContinueHandler` bis
   Szenenwechsel/Unmount halten statt im `finally` vor dem gequeueten `changeScene` freizugeben.
5. **Post-Gig Social/Deal/Spin** (`useSocialPostHandler`, `useDealHandlers`, `useMinorHandlers` +
   `SocialPhase`/`DealCard`): Processing-Lock bis Phasenwechsel/Unmount halten; Einmal-Guard für
   Brand-Deal-Annahme; disabled-Props an Komponenten reichen.
6. **Pre-Gig Start** (`src/hooks/usePreGigLogic.ts`): `isStartingRef` synchron am Kopf von
   `handleStartShow` prüfen, nur bei Fehlschlag zurücksetzen.

**Tests:** jeden Handler doppelt aufrufen → Effekte feuern einmal; Komponententests prüfen deaktivierte
Buttons während Processing.

## Theme C — Persistenz-Vertrag & Save-Reihenfolge

7. **Rival-Persistenz** (`src/context/usePersistence.ts` + `src/context/reducers/systemReducer.ts`):
   `rivalBand` zu `LOADABLE_SAVE_KEYS` hinzufügen, in `createPersistedState` aufnehmen,
   `sanitizeRivalBand`-Pfad in `handleLoadGame` (Power-Level clampen, id/name/location validieren),
   `null` für Legacy-Saves erhalten.
8. **Tourbus-Save-Reihenfolge** (`src/hooks/useArrivalLogic.ts`): `saveGame(false)` ans *Ende* von
   `handleArrivalSequence` verschieben, nach allen Arrival-Side-Effects (Daily-Effekte, Events,
   Rival-Bewegung, Pending-Flags, Routing, Gig-Start).

**Tests:** Save/Load erhält Rival id/name/location/geclamptes Power und Rival treibt weiterhin
Rhythm-Game + Brand-Deal-Selektoren; Tourbus-Save-Snapshot enthält Ziel, Tageswechsel, Daily-Effekte,
Arrival-Flags/Routing und ggf. Gig-Start.

## Theme D — Szenenwechsel-Integrität

9. **GAMEOVER nicht durch Arrival-Routing überschreiben** (`src/hooks/useArrivalLogic.ts`,
   `src/hooks/travel/useTravelActions.ts`): nach `advanceDay()` den resultierenden Scene beobachten und
   Routing kurzschließen, wenn `currentScene === GAMEOVER`. Umsetzung: Post-Dispatch-State aus
   `stateRef.current` vor `changeScene(...)` lesen, Arrival-Routing bei GAMEOVER überspringen
   (risikoärmer als Refactor von `advanceDay` auf Rückgabe des Next-State).
10. **Practice-Rückkehr** (`src/context/useGameDispatchActions.ts`): `setPendingBandHQOpen(true)` nur
    wenn `targetScene === GAME_PHASES.OVERWORLD` (Entscheidung oben).

**Tests:** Travel-/Tourbus-Abschluss, der per Daily-Tick bankrottet, dispatched kein späteres
`changeScene(OVERWORLD)`; Practice-Rückkehr-Matrix OVERWORLD/MENU/ungültig prüft HQ-Pending nur für OVERWORLD.

## Theme E — Roadie-Contraband, Minor-Konsistenz, globale Asset-Modals

11. **Roadie konsumiert Stash** (`src/hooks/minigames/useRoadieLogic.ts`,
    `src/utils/minigames/roadieUtils.ts`, `src/context/reducers/minigameReducer.ts`): konkretes
    Stash-Item bei Minigame-Start wählen (echte id/type tragen, nicht synthetisch `'contraband'`), im
    Roadie-Completion-Reducer einen Stack bei erfolgreicher Lieferung verbrauchen, *bevor* gezahlt/Quest
    fortgeschrieben wird. Kein geliefertes Stash-Item → kein Contraband-Geld/Quest.
12. **Contraband-Erfolgs-Feedback** (`src/hooks/useContrabandStash.ts`): Erfolg aus Post-Dispatch-
    State-Änderung ableiten (oder Feedback in akzeptierten Result-Pfad verschieben), damit abgelehnte
    Nutzung kein "Used"/"Applied" zeigt.
13. **SupplyStop-Purchase-Lock** (`src/ui/SupplyStopModal.tsx`): BandHQ-Processing-Lock wiederverwenden —
    `handleBuyWithLock`/`processingItemId` in wiederverwendbaren Wrapper (oder in `usePurchaseLogic`)
    extrahieren und `processingItemId` an `ShopItem` reichen.
14. **Settings-Sanitization** (`src/context/useGameDispatchActions.ts`): dasselbe vom Reducer akzeptierte
    sanitisierte Payload via gemeinsamen `sanitizeSettingsPayload` in den Global-Storage schreiben
    (Action-Creator, Reducer, Load, Storage-Write geteilt).
15. **Globale Asset-Modals** (`src/App.tsx`/`SceneRouter`): globalen Asset-Notification-Owner mounten, der
    RiskEvent-/Foreclosure-Modals in jeder Szene anzeigt; Assets-Szenen-Kopplung entfernen (bzw.
    Assets-Render gegen Doppel-Mount absichern).

**Tests:** Roadie zweimal mit einem Stash-Item → Stash verbraucht, zweiter Lauf ohne Contraband-Bonus;
stale-Instance/already-applied-Contraband ohne Erfolg; doppelter SupplyStop-Kauf → ein Versuch/ein
Consequence-Toast; `updateSettings({logLevel:'bad', unknown:true})` schreibt keine ungültigen/unbekannten
Keys; Shell-Test, dass Foreclosure-/Risk-Modal außerhalb Assets erscheint.

## Theme F — Follow-up-Risiken (niedrigere Konfidenz)

16. **Travel-Event-Policy angleichen** (`useTravelActions.ts` vs `useArrivalLogic.ts`): zuerst prüfen, ob
    der alte `useTravelActions`-Fallback noch user-erreichbar ist. Falls erreichbar:
    `processTravelEvents`-Optionen an `useArrivalLogic` angleichen (Gig-Node-Policy). Falls legacy-only:
    explizit markieren + die intentionale Differenz testen.
17. **Travel-Completed-Quest-Event-Owner** (`minigameReducer.ts` + `useTravelActions.ts`): beide Pfade
    über einen einzigen Owner routen, um künftiges Doppel-Fortschreiten zu verhindern; Guard-Test ergänzen.
18. **Stale-Gig-Daten beim Load** (`systemReducer.ts`): Regressionstest, dass geladener OVERWORLD-State mit
    altem `currentGig`/`lastGigStats` keine Gig-/Post-Gig-UI wieder öffnet, kein Leaderboard neu sendet und
    Practice-Rückkehr nicht beeinflusst. Kein Code-Change, außer der Test fällt durch.
19. **DEV-Backdoor-Quelle** (`src/components/MinigameSceneFrame.tsx`): Minigame-Typ aus einer kanonischen
    Quelle lesen (Prop/Logic-Ref bevorzugt) statt Fallback auf `window.gameState`.

## Übergreifend

- **i18n**: neue user-facing Strings (z. B. Reject-Toasts) als namespaced Keys mit EN+DE-JSON parallel.
- **Symbols**: nach API-/Typänderungen `pnpm run symbols:update` + `symbols:check`.
- **Reihenfolge**: gemäß Audit-Fix-Order (A → C → D → B → Persistenz → Roadie → Minors → Follow-ups),
  Commit pro Theme mit Conventional Commits.
- **Verifikations-Gate**: `pnpm run test:all` + `pnpm run typecheck` grün vor "fertig".

## Erfolgskriterien

- Alle im Audit gelisteten "Highest-value tests" existieren und sind grün.
- Reducer lehnen die beschriebenen feindlichen/unmöglichen Payloads ab (unveränderter State).
- `pnpm run test:all` und `pnpm run typecheck` grün; `symbols:check` aktuell.
- Audit-Verdict `[REQUEST CHANGES]` ist adressiert.
