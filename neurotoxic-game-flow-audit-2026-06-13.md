# Neurotoxic Game Flow Audit

Snapshot: `memory/snapshots/neurotoxic-game`  
Snapshot-Commit: `cd3255cddd7d12a91da55b5f21306fe6952f8299`  
Audit-Datum: 2026-06-13  
Scope: kompletter spielbarer Flow von Main/Overworld ueber Travel, Pre-Gig, Minigames, Gig, Post-Gig, Practice, Persistenz, Leaderboard und Tests.

## Kurzfazit

Der Snapshot ist insgesamt gut modularisiert und fuer viele kritische Pfade bereits mit gezielten Tests abgesichert. Besonders positiv: Minigame-Completion-Handler veraendern `currentScene` nicht direkt, Gig-Finalisierung hat ein `hasSubmittedResults`-Guard, Save-Load-Sanitizing ist deutlich defensiver als ueblich, und Leaderboard-Ausfaelle werden gameplay-neutral behandelt.

Trotzdem gibt es mehrere echte Flow-Inkonsistenzen:

- Post-Gig gibt den vorhandenen Processing-State nicht an `CompletePhase` weiter; Rewards, Fame, Merch-Abzug, Quests und Leaderboard-Submission koennen dadurch mehrfach angestossen werden.
- Tourbus-Arrival speichert zu frueh und wahrscheinlich mit einem veralteten State-Snapshot.
- Practice-Ende setzt immer `pendingBandHQOpen`, auch wenn der erlaubte Ruecksprung ins Main Menu geht.
- Pre-Gig-Start hat nur einen React-State-basierten Button-Guard, aber keinen synchronen Reentrancy-Guard im Handler.

## Top Findings

### Major: Post-Gig Continue kann mehrfach dieselben Rewards und Side Effects ausloesen

**Evidenz**

- `PostGig` liest `isProcessingAction` aus `usePostGigLogic` nicht aus und reicht es nicht an `CompletePhase` weiter: `src/scenes/PostGig.tsx:33-52`, `src/scenes/PostGig.tsx:123-130`.
- `CompletePhase` besitzt bereits ein `isProcessingAction`-Prop und deaktiviert Buttons damit, bekommt es aber nicht: `src/components/postGig/CompletePhase.tsx` verwendet `disabled={isProcessingAction}`.
- `useContinueHandler` setzt den Guard am Anfang, setzt ihn im `finally` aber sofort wieder zurueck, waehrend der normale Szenenwechsel per `queueMicrotask` erst danach ausgefuehrt wird: `src/hooks/postGig/handlers/useContinueHandler.ts:158-162`, `src/hooks/postGig/handlers/useContinueHandler.ts:274-280`, `src/hooks/postGig/handlers/useContinueHandler.ts:288-290`.
- Der Handler fuehrt relevante irreversible Side Effects aus: Merch-Bestand reduzieren, Geld/Fame setzen, `lastGigNodeId` setzen, Quest-Events emittieren, Story-Quests adden, Leaderboard-Scores submitten: `src/hooks/postGig/handlers/useContinueHandler.ts:164-255`.
- Die PostGig-Komponententests mocken `CompletePhase` ohne Disabled-/Processing-Vertrag; dadurch kann der Prop-Fehler unbemerkt bleiben: `tests/ui/PostGig.component.test.jsx:90-105`.

**Risiko**

Ein schneller Doppelklick oder eine wiederholte Enter/Space-Aktivierung kann denselben Post-Gig-Abschluss mehrfach ausfuehren, bevor die Szene weggeroutet ist. Das ist besonders riskant fuer:

- doppelte Fame-/Quest-Progression
- doppelte Leaderboard-Submission
- mehrfacher Merch-Abzug
- mehrfaches Story-Quest-Anlegen, falls Reducer-Gating nicht alle Varianten abfaengt

**Kleinster sicherer Fix**

1. `isProcessingAction` in `PostGig` destructuren und an `CompletePhase` uebergeben.
2. Den Continue-Guard erst nach erfolgter Scene-Transition oder bewusst dauerhaft bis zum Unmount gesetzt lassen.
3. Einen Test ergaenzen, der `CompletePhase` nicht nur mockt, sondern verifiziert, dass `isProcessingAction` durchgereicht wird.

Beispiel:

```tsx
const {
  // ...
  isProcessingAction,
  handleContinue
} = usePostGigLogic()

<CompletePhase
  result={postResult}
  onContinue={handleContinue}
  onSpinStory={handleSpinStory}
  player={player}
  social={social}
  pedalHarmonyPenalty={pedalHarmonyPenalty}
  isProcessingAction={isProcessingAction}
/>
```

### Major: Tourbus-Arrival speichert vor Abschluss der Arrival-Side-Effects

**Evidenz**

- Im produktiven Tourbus-Pfad ruft `TourbusScene` nach dem Minigame `handleArrivalSequence` auf: `src/scenes/TourbusScene.tsx:18-39`.
- `handleCompleteTravelMinigame` schreibt bereits Zielort, Kosten, Van/Fuel, Minigame-Quest-Events und Travel-Quest-Event in den Reducer-State: `src/context/reducers/minigameReducer.ts:284-316`.
- `useArrivalLogic.handleArrivalSequence` macht danach `advanceDay()` und unmittelbar `saveGame(false)`, bevor Harmony-Regen, Travel-Events, Rival-Movement, Node-Arrival, HQ/SupplyStop-Pending-Flags, Gig-Start oder Scene-Wechsel abgearbeitet werden: `src/hooks/useArrivalLogic.ts:71-127`.
- `saveGame` speichert standardmaessig `stateRef.current`: `src/context/usePersistence.ts:164-170`. Direkt nach einem Dispatch ist dieser Ref im React-Provider nicht garantiert schon auf den nachfolgenden State aktualisiert.
- Der existierende Test verankert nur die Call-Reihenfolge `advanceDay` dann `saveGame`, prueft aber nicht, ob der gespeicherte Snapshot alle Arrival-Side-Effects enthaelt: `tests/ui/useArrivalLogic.test.jsx:25-39`.
- Der alte `onTravelComplete`-Fallback speichert dagegen erst am Ende nach Arrival/Routing/Quest-Event: `src/hooks/travel/useTravelActions.ts:215-237`.

**Risiko**

Ein Save direkt nach Ankunft kann inkonsistent sein: neuer Zielort aus dem Minigame-Reducer ist ggf. vorhanden, aber Tagesfortschritt, Daily Effects, Harmony-Regen, Events, Rival-Reaktion, Pending-HQ/SupplyStop oder gestarteter Gig koennen fehlen. Besonders unangenehm ist ein Crash/Reload direkt nach Tourbus-Completion: Der Spieler landet moeglicherweise in einem halb abgeschlossenen Arrival-Zustand.

**Kleinster sicherer Fix**

- `saveGame(false)` im Tourbus-Arrival ans Ende von `handleArrivalSequence` verschieben.
- Noch besser: Arrival als eine Reducer-Action oder als berechneten `nextState` modellieren und `saveGame(false, nextState)` mit einem expliziten Snapshot aufrufen.
- Test ergaenzen, der nicht nur Call Counts prueft, sondern den gespeicherten Snapshot bzw. die Reihenfolge nach allen Arrival-Side-Effects validiert.

### Major: Practice-Ende oeffnet Band HQ auch bei Ruecksprung ins Main Menu

**Evidenz**

- Practice setzt `sourceScene` auf die aktuelle Szene: `src/ui/bandhq/SetlistTab.tsx:203-204`.
- Erlaubte Practice-Rueckspruenge sind `OVERWORLD` und `MENU`: `src/context/gameConstants.ts` definiert `PRACTICE_RETURN_SCENES`.
- `endGig` setzt bei jeder Practice-Completion `setPendingBandHQOpen(true)`, unabhaengig vom Ruecksprungziel: `src/context/useGameDispatchActions.ts:552-560`.
- `useBandHQModal` initialisiert `showHQ` aus `pendingBandHQOpen` und oeffnet das Modal szenenunabhaengig per Timeout: `src/hooks/useBandHQModal.ts:8-21`.
- Laut Hook-Kommentar wird `useBandHQModal` in MainMenu und Overworld genutzt: `src/hooks/useBandHQModal.ts:4-7`.

**Risiko**

Wenn Practice aus dem Main Menu gestartet oder per Save/Load mit `sourceScene: MENU` restauriert wird, kann `endGig` ins Menu zurueckkehren und trotzdem Band HQ oeffnen. Das widerspricht der Scene-Semantik: Band HQ ist Overworld-/HQ-Kontext, nicht automatisch Main-Menu-UI. Selbst wenn der aktuelle UI-Weg Practice meist aus Band HQ/Overworld startet, erlaubt die Persistenz `sourceScene: MENU`, also ist der Zustand im Typ- und Save-Vertrag real.

**Kleinster sicherer Fix**

`pendingBandHQOpen` nur setzen, wenn `targetScene === GAME_PHASES.OVERWORLD`, oder die Return-Szenen einschraenken, wenn Band HQ immer das Ziel sein soll.

```ts
const targetScene = isValidTarget ? rawTarget : GAME_PHASES.OVERWORLD
if (targetScene === GAME_PHASES.OVERWORLD) {
  setPendingBandHQOpen(true)
}
changeScene(targetScene as GamePhase)
```

### Minor: Pre-Gig-Start hat keinen synchronen Reentrancy-Guard

**Evidenz**

- `handleStartShow` setzt `isStarting` per React State und wartet danach async auf `audioService.ensureAudioContext()`: `src/hooks/usePreGigLogic.ts:399-407`.
- Danach waehlt der Handler ein Minigame und dispatcht `startRoadieMinigame`, `startKabelsalatMinigame` oder `startAmpCalibration`: `src/hooks/usePreGigLogic.ts:430-455`.
- Der Button ist ueber `isStarting` disabled, aber erst nach dem naechsten Render: `src/components/pregig/PreGigStartButton.tsx:27-30`.

**Risiko**

Mehrfachklicks im gleichen Event-Fenster koennen mehrere Audio-Initialisierungen und potenziell mehrere Start-Minigame-Actions ausloesen. React rendert schnell genug, dass das im Alltag selten ist, aber fuer Touch-Doppeltaps, Enter-Key-Repeat oder langsame Audio-Prompts ist der Guard nicht robust.

**Kleinster sicherer Fix**

In `usePreGigLogic` einen `isStartingRef` fuehren, synchron am Handler-Anfang pruefen und erst im Fehlerfall zuruecksetzen. Beim erfolgreichen Start muss der Guard nicht zurueckgesetzt werden, weil die Szene wechselt.

## Weitere Auffaelligkeiten und Inkonsistenzen

### Travel: Zwei Arrival-Pfade haben unterschiedliche Event-Policy

Der alte `onTravelComplete`-Fallback ruft `processTravelEvents(node, triggerEvent, { includeGigNodes: true })` auf: `src/hooks/travel/useTravelActions.ts:221-223`. `useArrivalLogic` ruft `processTravelEvents(currentNode, triggerEvent)` ohne `includeGigNodes` auf und skippt Gig-Nodes: `src/hooks/useArrivalLogic.ts:84-92`.

Die Kommentare erklaeren, dass der Tourbus-Minigame-Pfad der produktive Pfad ist und Gig-Events in PreGig laufen sollen. Das ist plausibel. Trotzdem bleibt der alte Fallback semantisch anders und kann bei deaktiviertem/fehlendem `onStartTravelMinigame` andere Events vor Gigs ausloesen als der produktive Pfad.

Empfehlung: Den alten Fallback entweder klar als Legacy-only absichern oder die Event-Policy angleichen.

### Travel: Travel-Quest-Event ist auf zwei Pfade verteilt

Tourbus-Completion emittiert `createTravelCompletedQuestEvent` im Reducer: `src/context/reducers/minigameReducer.ts:308-316`. Der alte Travel-Fallback emittiert dasselbe Event in `useTravelActions`: `src/hooks/travel/useTravelActions.ts:230-235`.

Aktuell ist das nicht doppelt, weil die Pfade alternativ sind. Die Logik ist aber fragil, weil zukuenftige Integrationen leicht beide Pfade verbinden koennen. Besser waere eine einzige Besitzerstelle fuer "Travel completed" Quest Progress.

### Save/Load: Persistierter `currentGig` bleibt trotz erzwungener Overworld erhalten

`handleLoadGame` setzt `currentScene` defensiv immer auf `OVERWORLD`, laedt aber `currentGig` und `lastGigStats` weiter aus dem Save: `src/context/reducers/systemReducer.ts:1644-1646`. Das ist wahrscheinlich gewollt, um Mid-Scene-Loads zu vermeiden. Es bedeutet aber, dass Overworld nach einem Save mitten im Gig/PostGig noch alte Gig-Daten im State haben kann.

Aktuell scheint Overworld diese Daten nicht direkt zu konsumieren. Trotzdem sollte ein Regressionstest sicherstellen, dass ein geladener Overworld-State mit altem `currentGig` nicht versehentlich wieder PreGig/PostGig-UI, Leaderboard-Submission oder Practice-Ruecksprung beeinflusst.

### MinigameSceneFrame: Dev-Backdoor nutzt uneinheitliche Type-Quelle

Die `Shift+P`-Backdoor sucht den Minigame-Typ erst in `logic.gameStateRef.current.minigame`, faellt dann auf `window.gameState.minigame.type` zurueck: `src/components/MinigameSceneFrame.tsx`. Die einzelnen Minigame-Refs enthalten aber nicht konsistent `minigame`. Das ist DEV-only und kein Merge-Blocker, aber fuer Debug-Flow potenziell verwirrend.

Empfehlung: `minigameType` explizit als Prop an `MinigameSceneFrame` geben oder die Backdoor nur ueber den globalen Game-State lesen.

## Type System Audit

### Gut

- Reducer-Actions sind stark typisiert und `reducerMap` deckt die meisten Action-Typen explizit ab.
- Save-Load-Sanitizing verwendet viele `unknown`/Record-Guards und blockiert Prototype-Pollution.
- Minigame-Completion-Action-Creators clampen zentrale Payloads.
- `PRACTICE_RETURN_SCENES` und `ALLOWED_SCENE_VALUES` verhindern grobe Scene-Injection aus Saves.

### Auffaellig

- Mehrere Flow-Guards leben nur in React-Komponentenstate (`isStarting`, `isProcessingAction`) statt synchron in Refs oder Reducer-State. Das ist fuer einmalige Transaktionen wie Post-Gig-Settlement und Pre-Gig-Start zu weich.
- `saveGame()` nimmt zwar optional einen `stateSnapshot`, die kritischen Flow-Aufrufer nutzen ihn aber nicht. Fuer zusammengesetzte Flow-Transaktionen waere genau dieser Parameter der richtige Vertrag.
- Practice-Metadaten (`isPractice`, `sourceScene`) sind typisiert und werden geladen, aber `endGig` behandelt `pendingBandHQOpen` nicht als von `targetScene` abhaengigen Effekt.

## Architecture And Logic

### Stabile Muster

- Scene-Routing ist zentral in `SceneRouter` und Minigame-Completion veraendert die Szene nicht direkt. Das reduziert zufaellige Softlocks.
- Tourbus/Pre-Gig-Minigames haben lokale Completion-Guards.
- Gig-Finalisierung nutzt `hasSubmittedResults`, wodurch Scoring/Loop/Quit-Pfade nicht leicht doppelt submitten.
- Leaderboard-Fehler sind nicht gameplay-blockierend.

### Bruchstellen

- Travel ist konzeptionell in drei Schichten verteilt: `useTravelActions`, `minigameReducer`, `useArrivalLogic`. Dadurch entsteht aktuell schon eine Save-Reihenfolge-Inkonsistenz und unterschiedliche Event-Policy zwischen Fallback und produktivem Pfad.
- Post-Gig ist ebenfalls transaktional, wird aber als Folge vieler einzelner Dispatches ausgefuehrt. Ohne hartes "settled" Flag ist der Flow empfindlich gegen Mehrfachaktivierung.
- Practice ist ein Sonderfall von `Gig`, aber sein Exit-Effekt oeffnet HQ als impliziten Seiteneffekt statt das Ziel explizit zu modellieren.

## Test Gaps

1. **Post-Gig Reentrancy**
   - Test: `handleContinue()` zweimal direkt hintereinander aufrufen.
   - Erwartung: Geld/Fame/Merch/Quest/Leaderboard/Scene-Transition werden genau einmal ausgeloest.
   - Zusaetzlich: `PostGig` muss `isProcessingAction` an `CompletePhase` durchreichen.

2. **Tourbus Arrival Save Snapshot**
   - Test: Tourbus-Completion plus `handleArrivalSequence`.
   - Erwartung: gespeicherter Snapshot enthaelt Zielort, Tag, Daily Effects, Harmony-Regen, Pending-HQ/SupplyStop oder gestarteten Gig konsistent.

3. **Practice Return Matrix**
   - Cases: `sourceScene=OVERWORLD`, `sourceScene=MENU`, fehlendes/ungueltiges `sourceScene`.
   - Erwartung: HQ-Pending nur bei Overworld-Ziel; Menu-Ziel bleibt Menu ohne HQ-Modal.

4. **Pre-Gig Start Double Invocation**
   - Test: `handleStartShow()` zweimal synchron vor Await-Aufloesung.
   - Erwartung: genau eine Minigame-Start-Action.

5. **Travel Fallback vs Tourbus Policy**
   - Test: gleicher Gig-Node ueber `onTravelComplete`-Fallback und Tourbus-Arrival.
   - Erwartung: bewusst gleiche oder bewusst dokumentiert unterschiedliche Event-/Quest-Policy.

## Suggested Fix Order

1. **Post-Gig Processing Prop + hard guard**: hoechste direkte Merge-/Gameplay-Risiko.
2. **Tourbus Arrival Save-Reihenfolge**: verhindert korrupte Saves nach Travel.
3. **Practice HQ-Pending an Zielszene koppeln**: kleiner, klarer Fix.
4. **Pre-Gig synchroner Start-Guard**: kleine Robustheitsverbesserung.
5. **Travel-Fallback-Policy vereinheitlichen oder als Legacy absichern**.

## Validierung

Versucht im Snapshot:

- `npm run typecheck`
  - Ergebnis: blockiert, weil `typescript/bin/tsc` im rekonstruierten Snapshot nicht aufloesbar ist.
- `npm test -- --run ...`
  - Ergebnis: blockiert, weil `pnpm` im Container nicht installiert ist.

Die Befunde oben sind deshalb als statischer, codebasierter Audit belegt. Es wurden keine erfolgreichen Runtime- oder Typecheck-Ergebnisse behauptet.

## Merge-Verdikt

[REQUEST CHANGES]

