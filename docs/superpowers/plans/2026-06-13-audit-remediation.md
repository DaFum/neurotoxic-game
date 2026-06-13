# Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Behebe alle 10 Major-, 5 Minor- und 4 Follow-up-Findings aus `neurotoxic-game-flow-audit-consolidated-verified-2026-06-13.md`, sodass das Audit-Verdict `[REQUEST CHANGES]` ausgeräumt ist.

**Architecture:** Reducer werden zur letzten Instanz für Einmal-/Ökonomie-Transaktionen (Aktiv/Typ-Guards, Leistbarkeit, Stash-Konsum). UI-Re-Entry-Guards folgen dem bestehenden per-Site `isProcessing*Ref`-Idiom statt einer neuen Abstraktion. Persistenz wird zum typisierten Vertrag erweitert (`rivalBand`). Geteilte Helfer nur dort, wo das Audit echte Wiederverwendung benennt (Settings-Sanitizer, SupplyStop-Purchase-Lock).

**Tech Stack:** React 19, TypeScript (CheckJS strict für .js/.jsx), Vitest (UI/Komponenten), `node:test` (Reducer/Logik), Tone.js (Audio), Tailwind v4, pnpm.

---

## Workflow-Vorgaben (für JEDE Task)

Nach dem grünen Test und vor `git push`:

1. **AGENTS.md prüfen:** Lies die nächstgelegene(n) `AGENTS.md` für jeden berührten Pfad (Liste unten) und halte ihre Scope-Regeln ein. Relevante Dateien:
   - `src/context/reducers/AGENTS.md`, `src/context/AGENTS.md` (Reducer/State/Persistenz)
   - `src/hooks/AGENTS.md`, `src/hooks/minigames/AGENTS.md`
   - `src/components/postGig/AGENTS.md`, `src/components/assets/AGENTS.md`, `src/components/minigames/roadie/AGENTS.md`
   - `src/ui/AGENTS.md`, `src/ui/bandhq/AGENTS.md`, `src/ui/bandhq/hooks/AGENTS.md`, `src/ui/settings/AGENTS.md`
   - `src/scenes/AGENTS.md`, `src/types/AGENTS.md`, `src/domain/AGENTS.md`, `src/utils/AGENTS.md`
2. **TSDoc prüfen/ergänzen:** Wenn eine exportierte API-Signatur, ihr Verhalten oder ihr Rückgabevertrag sich ändert (z. B. Reducer lehnt jetzt ab), aktualisiere den TSDoc-Block (`@param`/`@returns`/`@throws`) entsprechend. Neue exportierte Helfer brauchen einen TSDoc-Block.
3. **Symbols:** Bei Änderung exportierter APIs/Typen/lokaler Imports: `pnpm run symbols:update && pnpm run symbols:check`.
4. **Commit** (Conventional Commits) **und Push** nach JEDEM Punkt:
   ```bash
   git push -u origin claude/quirky-brahmagupta-dcefkb
   ```
   Bei Netzwerkfehlern bis zu 4× mit Backoff (2s/4s/8s/16s) erneut versuchen.

Einzeldatei-Tests:
- `node:test`: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js`
- Vitest: `pnpm run test:ui:file -- tests/<file>.test.jsx`

---

## Theme A — Reducer als letzte Instanz

### Task 1: Blutbank-Leistbarkeit im Reducer durchsetzen

**Files:**
- Modify: `src/context/reducers/clinicReducer.ts` (`handleBloodBankDonate`, ab Zeile 199; TSDoc ab 188)
- Reuse: `src/utils/bloodBankUtils.ts` (`validateBloodBankDonation`)
- Test: `tests/node/clinicReducer.test.js` (bestehende Blutbank-Tests, die Clamp-Success kodifizieren, ersetzen)

- [ ] **Step 1: Failing-Tests schreiben** — Donation wird abgelehnt, wenn Harmony ≤ Kosten bzw. ein Member `stamina < staminaCost + 10` hat. Assert: `result === state` (identische Referenz), Money/Harmony/Stamina/Controversy/`toasts` unverändert.

```js
test('rejects donation when harmony cannot pay the cost', () => {
  const state = makeClinicState({ harmony: 5 })
  const result = handleBloodBankDonate(state, {
    moneyGain: 300, harmonyCost: 10, staminaCost: 5, controversyGain: 2,
  })
  assert.strictEqual(result, state)
})

test('rejects donation when a member cannot survive the stamina drain', () => {
  const state = makeClinicState({ memberStamina: 12 }) // < staminaCost(5)+10
  const result = handleBloodBankDonate(state, {
    moneyGain: 300, harmonyCost: 1, staminaCost: 5, controversyGain: 0,
  })
  assert.strictEqual(result, state)
  assert.strictEqual(result.player.money, state.player.money)
  assert.deepStrictEqual(result.toasts, state.toasts)
})
```

- [ ] **Step 2: Tests laufen lassen → FAIL** (Reducer mintet aktuell Geld).
- [ ] **Step 3: Implementieren** — nach Normalisierung (nach Zeile 220, vor `nextMoney`-Berechnung) einsetzen:

```ts
if (!validateBloodBankDonation(state.band, { harmonyCost, staminaCost })) {
  logger.warn('ClinicReducer', 'Rejected unaffordable blood-bank donation')
  return state
}
```

Import ergänzen: `import { validateBloodBankDonation } from '../../utils/bloodBankUtils'`.
- [ ] **Step 4: Tests laufen lassen → PASS.** Alte Exploit-kodifizierenden Tests entfernen/anpassen.
- [ ] **Step 5: TSDoc** in `handleBloodBankDonate` ist bereits korrekt ("or the original state when validation fails") — verifizieren, sonst angleichen.
- [ ] **Step 6: AGENTS.md-Check, Commit & Push.**

```bash
git add src/context/reducers/clinicReducer.ts tests/node/clinicReducer.test.js
git commit -m "fix(clinic): reject unaffordable blood-bank donations in reducer"
git push -u origin claude/quirky-brahmagupta-dcefkb
```

### Task 2: Replay-Guards für Setup-Minigame-Completion-Reducer

**Files:**
- Modify: `src/context/reducers/minigameReducer.ts` — `handleCompleteAmpCalibration` (414), `handleCompleteKabelsalatMinigame` (~500), `handleCompleteRoadieMinigame` (~552), Tourbus-Handler (Symmetrie)
- Test: `tests/node/minigameReducer.test.js`

- [ ] **Step 1: Failing-Tests** — jeden Completion-Handler zweimal aufrufen; nach dem ersten Aufruf ist `minigame.active === false`. Zweiter Aufruf darf keine zusätzlichen Money/Harmony/Stress/Quest/Toast-Effekte erzeugen.

```js
test('amp calibration completion is idempotent on replay', () => {
  const start = withActiveMinigame(MINIGAME_TYPES.AMP_CALIBRATION)
  const once = handleCompleteAmpCalibration(start, AMP_PAYLOAD)
  const twice = handleCompleteAmpCalibration(once, AMP_PAYLOAD)
  assert.strictEqual(twice, once) // identische Referenz, kein Re-Apply
})
```

(Analog für Kabelsalat + Roadie.)
- [ ] **Step 2: Tests → FAIL** (zweiter Aufruf wendet Effekte erneut an).
- [ ] **Step 3: Implementieren** — am Kopf JEDES Handlers, vor jeglicher Berechnung:

```ts
if (
  state.minigame?.active !== true ||
  state.minigame?.type !== MINIGAME_TYPES.AMP_CALIBRATION
) {
  return state
}
```

Entsprechenden `MINIGAME_TYPES.*` je Handler verwenden. **Wichtig (AGENTS.md reducers Z.31):** `state.currentScene` NICHT ändern. Tourbus-Handler denselben expliziten Guard geben.
- [ ] **Step 4: Tests → PASS.** Bestehende Single-Completion-Tests müssen mit `withActiveMinigame(...)`-Setup weiterhin grün sein.
- [ ] **Step 5: TSDoc** der Handler um Hinweis ergänzen: "Returns unchanged state when no matching minigame is active (replay guard)."
- [ ] **Step 6: AGENTS.md-Check, Commit & Push.**

```bash
git commit -m "fix(minigame): guard setup completion reducers against replay"
```

---

## Theme B — Einmal-UI-Re-Entry-Guards

### Task 3: Event-Modal Doppel-Resolve verhindern

**Files:**
- Modify: `src/ui/EventModal.tsx` (Continue-Handler 131-165, Button 311-317)
- Modify: `src/context/useEventSystem.ts` (`resolveEventCallback` 211-223)
- Test: `tests/ui/EventModal.test.jsx`, `tests/node/useEventSystem.*` (passend zum vorhandenen Framework je Datei)

- [ ] **Step 1: Failing-Test** — Doppelklick auf Continue ruft `onOptionSelect` genau einmal auf; Continue ist nach erstem Klick disabled.
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — `const resolvedRef = useRef(false)` in `EventModal`; im Continue-Handler `if (resolvedRef.current) return; resolvedRef.current = true` vor `onOptionSelect`; Button `disabled={resolvedRef.current}`. In `resolveEventCallback`: `if (!stateRef.current.activeEvent) return` als erster Statement.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: TSDoc/AGENTS-Check, Commit & Push.**

```bash
git commit -m "fix(events): prevent double-resolve of event modal continue"
```

### Task 4: Post-Gig Continue-Guard bis Szenenwechsel halten

**Files:**
- Modify: `src/scenes/PostGig.tsx` (33-52 destructure, 123-130 render)
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts` (158-290)
- Test: `tests/ui/PostGig.*` + `tests/.../useContinueHandler.*`

- [ ] **Step 1: Failing-Tests** — (a) `handleContinue()` zweimal synchron wendet Settlement (Merch/Money/Fame/Quest/Leaderboard) genau einmal an; (b) `PostGig` reicht `isProcessingAction` an `CompletePhase` durch.
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — `isProcessingAction` aus `usePostGigLogic` in `PostGig` destrukturieren und als Prop an `CompletePhase` reichen (Prop existiert bereits laut `src/components/postGig/CompletePhase.tsx`). In `useContinueHandler`: den `isProcessingActionRef`-Guard NICHT im `finally` zurücksetzen, wenn ein normaler Szenenwechsel gequeued ist — bei Erfolg gesetzt lassen (Szene wechselt/Unmount); nur bei Fehler/Frühausstieg zurücksetzen.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS.md (`src/components/postGig/AGENTS.md`)-Check, TSDoc, Commit & Push.**

```bash
git commit -m "fix(postgig): hold continue guard until scene transition"
```

### Task 5: Post-Gig Social/Deal/Spin Re-Entry sperren

**Files:**
- Modify: `src/hooks/postGig/handlers/useSocialPostHandler.ts` (202-248)
- Modify: `src/hooks/postGig/handlers/useDealHandlers.ts` (94-149)
- Modify: `src/hooks/postGig/handlers/useMinorHandlers.ts` (58-95)
- Modify: `src/components/postGig/SocialPhase.tsx`, `src/components/postGig/DealCard.tsx`
- Test: jeweilige Handler-/Komponenten-Tests

- [ ] **Step 1: Failing-Tests** — `handlePostSelection`, `handleAcceptDeal`, `handleSpinStory` je doppelt aufrufen → Side-Effects genau einmal; Komponententests: Buttons disabled während Processing.
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — Processing-Lock bis Phasenwechsel/Unmount halten (nicht direkt nach Dispatch zurücksetzen); `handleAcceptDeal` denselben Einmal-Guard geben; `disabled`/`processing`-Props an `SocialPhase` und `DealCard` reichen.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS/TSDoc-Check, Commit & Push.**

```bash
git commit -m "fix(postgig): make social/deal/spin handlers single-shot"
```

### Task 6: Pre-Gig synchroner Start-Guard

**Files:**
- Modify: `src/hooks/usePreGigLogic.ts` (`handleStartShow` 399-455)
- Test: `tests/.../usePreGigLogic.*`

- [ ] **Step 1: Failing-Test** — `handleStartShow()` zweimal vor Auflösung des Audio-Promise → genau eine Start-Minigame-Action dispatched.
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — `const isStartingRef = useRef(false)`; am Kopf von `handleStartShow`: `if (isStartingRef.current) return; isStartingRef.current = true`. Reset nur im Fehlerpfad (`catch`); bei Erfolg gesetzt lassen (Szene wechselt). `isStarting`-State weiterhin für Button-Disable behalten.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS/TSDoc-Check, Commit & Push.**

```bash
git commit -m "fix(pregig): add synchronous re-entry guard to start show"
```

---

## Theme C — Persistenz-Vertrag & Save-Reihenfolge

### Task 7: `rivalBand` persistieren & hydrieren

**Files:**
- Modify: `src/context/usePersistence.ts` (`LOADABLE_SAVE_KEYS` 23-55, `createPersistedState` 85-140)
- Modify: `src/context/reducers/systemReducer.ts` (`handleLoadGame` 1614-1670; neue `sanitizeRivalBand`)
- Test: `tests/node/usePersistence.*` bzw. `tests/node/systemReducer.*`

- [ ] **Step 1: Failing-Tests** — Save/Load erhält `rivalBand` id/name/location und clampt `power`; fehlendes/legacy `rivalBand` bleibt `null`; hostile Felder werden verworfen (identische-Referenz-Regel für Prototype-Keys, siehe `reducers/AGENTS.md` Z.9).
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — `rivalBand` zu `LOADABLE_SAVE_KEYS` + `createPersistedState`; `sanitizeRivalBand(raw)` nach dem Muster von `sanitizeBand` (Whitelist-Felder, `Number.isFinite` für `power`, `null`-Fallback); in `handleLoadGame` aufrufen.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: `pnpm run symbols:update && symbols:check`, AGENTS/TSDoc, Commit & Push.**

```bash
git commit -m "fix(persistence): persist and sanitize rivalBand across save/load"
```

### Task 8: Tourbus-Arrival-Save ans Ende verschieben

**Files:**
- Modify: `src/hooks/useArrivalLogic.ts` (`handleArrivalSequence`; `saveGame(false)` aktuell 72-76)
- Test: `tests/.../useArrivalLogic.*`

- [ ] **Step 1: Failing-Test** — Tourbus-Completion+Arrival speichert Snapshot inkl. Ziel, Tageswechsel, Daily-Effekte, Arrival-Flags/Routing, ggf. Gig-Start.
- [ ] **Step 2: → FAIL** (Save passiert vor Side-Effects).
- [ ] **Step 3: Implementieren** — `saveGame(false)` aus dem Kopf entfernen. **Kanonische Single-Save-Sequenz (gemeinsam mit Task 9, genau EIN Save pro Pfad):**
  1. `advanceDay()` aufrufen.
  2. Resultierende Szene aus `stateRef.current.currentScene` lesen.
  3. **Wenn `=== GAME_PHASES.GAMEOVER`:** `saveGame(false)` SOFORT aufrufen, Arrival-Routing (`changeScene(...)`) überspringen, früh zurückkehren. (Save passiert, überschreibt aber die GAMEOVER-Szene nicht — kein `changeScene`.)
  4. **Sonst:** alle Arrival-Side-Effects + Routing ausführen, danach `saveGame(false)` GENAU EINMAL am Ende.
  Kein Pfad ruft `saveGame(false)` doppelt; kein Pfad überspringt den Save. Diese Sequenz ist die einzige Save-Autorität in `handleArrivalSequence`.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS (`src/hooks/AGENTS.md`)/TSDoc, Commit & Push.**

```bash
git commit -m "fix(arrival): save tourbus arrival after side effects complete"
```

---

## Theme D — Szenenwechsel-Integrität

### Task 9: GAMEOVER nicht durch Arrival-Routing überschreiben

**Files:**
- Modify: `src/hooks/useArrivalLogic.ts` (72-127)
- Modify: `src/hooks/travel/useTravelActions.ts` (219-228, `handleNodeArrivalCallback`)
- Test: `tests/.../useArrivalLogic.*`, `tests/.../useTravelActions.*`

- [ ] **Step 1: Failing-Tests** — Travel-/Tourbus-Abschluss, der per Daily-Tick bankrottet (`advanceDay` → `currentScene: GAMEOVER`), dispatcht KEIN späteres `changeScene(OVERWORLD/BAND_HQ/PRE_GIG)`.
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — nach `advanceDay()` `stateRef.current.currentScene` prüfen; wenn `=== GAME_PHASES.GAMEOVER`, Arrival-Routing (`changeScene(...)`) überspringen und früh zurückkehren (Save aus Task 8 läuft, überschreibt aber Szene nicht).
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS/TSDoc, Commit & Push.**

```bash
git commit -m "fix(arrival): preserve gameover scene over arrival routing"
```

### Task 10: Practice-HQ nur bei OVERWORLD öffnen

**Files:**
- Modify: `src/context/useGameDispatchActions.ts` (`endGig` 550-564)
- Test: `tests/.../useGameDispatchActions.*` (oder passender Hook-Test)

- [ ] **Step 1: Failing-Test** — Practice-Rückkehr-Matrix (drei Fälle): `sourceScene` OVERWORLD → HQ-pending true; MENU → HQ-pending false (Szene = MENU); ungültig/fehlend → **normalisiert auf OVERWORLD** + HQ-pending true.
- [ ] **Step 2: → FAIL** (aktuell immer `setPendingBandHQOpen(true)`).
- [ ] **Step 3: Implementieren** — **zuerst normalisieren, dann gaten.** Das bestehende `endGig` berechnet bereits `targetScene = isValidTarget ? rawTarget : GAME_PHASES.OVERWORLD` (ungültig/fehlend → OVERWORLD). Dieses bereits-normalisierte `targetScene` ist die kanonische Quelle: `setPendingBandHQOpen(true)` NUR aufrufen wenn `targetScene === GAME_PHASES.OVERWORLD`. Dadurch öffnet der invalid/missing-Pfad korrekt HQ (weil er auf OVERWORLD normalisiert wurde), während ein gültiges MENU kein HQ öffnet. NICHT gegen `rawTarget` gaten.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS/TSDoc, Commit & Push.**

```bash
git commit -m "fix(practice): only open band hq when returning to overworld"
```

---

## Theme E — Roadie-Stash, Minor-Konsistenz, globale Asset-Modals

### Task 11: Roadie konsumiert echten Stash-Eintrag

**Files:**
- Modify: `src/hooks/minigames/useRoadieLogic.ts` (`getInitialGameState` 89-118, `hasContraband` 195-203)
- Modify: `src/utils/minigames/roadieUtils.ts` (124-141, `contrabandCount`)
- Modify: `src/context/reducers/minigameReducer.ts` (`handleCompleteRoadieMinigame` ~552-636)
- Test: `tests/node/minigameReducer.test.js`, `tests/.../roadieUtils.*`

- [ ] **Step 1: Failing-Test** — Band mit genau einem Stash-Item schließt Roadie zweimal ab: erster Lauf zahlt Contraband-Bonus + konsumiert einen Stack; zweiter Lauf (leerer Stash) → kein Contraband-Bonus, kein `item.delivered`-Questfortschritt.
- [ ] **Step 2: → FAIL** (synthetisches `'contraband'` aktuell wiederholbar).
- [ ] **Step 3: Implementieren** — bei Minigame-Start konkretes Stash-Item wählen (echte `instanceId`/`type`/`id` ins Cargo, nicht synthetisch); im Roadie-Completion-Reducer den gelieferten Stash-Stack via bestehendem Stash-Reduktionspfad konsumieren (vgl. `addContrabandHelper`/Stash-Logik, `reducers/AGENTS.md` Z.10/Z.15), BEVOR Geld/Quest angewandt wird. Kein geliefertes Stash-Item → kein Bonus. `currentScene` unverändert lassen (AGENTS Z.31).
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: `symbols:update/check`, AGENTS (`hooks/minigames`, `components/minigames/roadie`)/TSDoc, Commit & Push.**

```bash
git commit -m "fix(roadie): consume real stash item on contraband delivery"
```

### Task 12: Contraband-Erfolgs-Feedback an Reducer-Ergebnis koppeln

**Files:**
- Modify: `src/hooks/useContrabandStash.ts` (30-63)
- Test: `tests/.../useContrabandStash.*`

- [ ] **Step 1: Failing-Test** — stale `instanceId` und bereits-angewandtes Item emittieren KEIN Success-Feedback (Reducer gibt unveränderten State zurück, vgl. `bandReducer.ts` 673-711).
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — Erfolg aus Post-Dispatch-State-Änderung ableiten (z. B. Stash-/`applied`-Vergleich via `stateRef`), Success-Toast nur bei tatsächlicher Änderung.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS/TSDoc, Commit & Push.**

```bash
git commit -m "fix(contraband): show success only when reducer accepts use"
```

### Task 13: SupplyStop-Purchase-Lock wiederverwenden

**Files:**
- Modify: `src/ui/SupplyStopModal.tsx` (51-74, 113-120)
- Reference/Modify: `src/ui/bandhq/hooks/useBandHQLogic.ts` (`processingItemId`, `handleBuyWithLock`) oder `usePurchaseLogic`
- Test: `tests/.../SupplyStopModal.*`

- [ ] **Step 1: Failing-Test** — doppeltes Auslösen desselben SupplyStop-Kaufs → genau ein Kaufversuch + ein Consequence-Toast, während Processing aktiv.
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — `handleBuyWithLock`/`processingItemId` in wiederverwendbaren Wrapper (bzw. in `usePurchaseLogic`) extrahieren; SupplyStop nutzt ihn und reicht `processingItemId` an `ShopItem`.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS (`src/ui/bandhq/hooks/AGENTS.md`, `src/ui/AGENTS.md`)/TSDoc, Commit & Push.**

```bash
git commit -m "fix(supplystop): reuse purchase processing lock"
```

### Task 14: Settings vor Global-Storage-Write sanitisieren

**Files:**
- Modify: `src/context/useGameDispatchActions.ts` (`updateSettings` 566-588)
- Reuse/Extract: gemeinsamer `sanitizeSettingsPayload` (geteilt mit Reducer `systemReducer.ts` 1780-1788)
- Test: `tests/.../settings.*`

- [ ] **Step 1: Failing-Test** — `updateSettings({ logLevel: 'bad', unknown: true })` schreibt keine ungültigen/unbekannten Keys in den Global-Storage.
- [ ] **Step 2: → FAIL** (`writeGlobalSettings({ ...read, ...updates })` schreibt Rohwerte).
- [ ] **Step 3: Implementieren** — denselben `sanitizeSettingsPayload(updates)` (vom Reducer genutzt) vor `writeGlobalSettings` anwenden; ggf. in `src/utils/` extrahieren, sodass Action-Creator, Reducer, Load und Storage-Write ihn teilen.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS (`src/ui/settings/AGENTS.md`, `src/context/AGENTS.md`)/TSDoc, Commit & Push.**

```bash
git commit -m "fix(settings): sanitize payload before writing global storage"
```

### Task 15: Globaler Asset-Modal-Owner

**Files:**
- Modify: `src/App.tsx` (Overlay-Owner 127-155)
- Modify: `src/components/assets/AssetsScene.tsx` (24-106; doppeltes Mount vermeiden)
- Test: Shell-Test (`tests/.../App.*` oder vorhandener Overlay-Test)

- [ ] **Step 1: Failing-Test** — pending Foreclosure/Risk-Event erscheint außerhalb der Assets-Szene (z. B. in OVERWORLD).
- [ ] **Step 2: → FAIL.**
- [ ] **Step 3: Implementieren** — globalen Asset-Notification-Owner nahe `App`/`SceneRouter` mounten, der `RiskEventModal`/`ForeclosureModal` aus dem pending State rendert; Assets-Szenen-Render gegen Doppel-Anzeige absichern (oder dort entfernen).
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS (`src/components/assets/AGENTS.md`, `src/AGENTS.md`)/TSDoc, Commit & Push.**

```bash
git commit -m "feat(assets): surface risk/foreclosure modals globally"
```

---

## Theme F — Follow-up-Risiken

### Task 16: Travel-Event-Policy angleichen oder als Legacy markieren

**Files:**
- Inspect: `src/hooks/travel/useTravelActions.ts` (221-223), `src/hooks/useArrivalLogic.ts` (84-92)
- Test: `tests/.../useTravelActions.*`

- [ ] **Step 1:** Prüfen, ob der `useTravelActions`-Fallback noch user-erreichbar ist (Aufrufer-Suche).
- [ ] **Step 2: Failing-Test** — falls erreichbar: beide Pfade liefern identische `processTravelEvents`-Gig-Node-Policy; falls legacy-only: Test, der die intentionale Differenz dokumentiert.
- [ ] **Step 3: Implementieren** — Policies angleichen (gleiche Optionen) ODER Fallback explizit als legacy markieren (Kommentar + Test).
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS/Commit & Push.**

```bash
git commit -m "fix(travel): align arrival event policy across paths"
```

### Task 17: Einheitlicher Owner für „Travel completed"-Quest-Event

**Files:**
- Modify: `src/context/reducers/minigameReducer.ts` (`createTravelCompletedQuestEvent`), `src/hooks/travel/useTravelActions.ts`
- Test: `tests/node/minigameReducer.test.js`

- [ ] **Step 1: Failing-Test** — Travel-Completion (beide Pfade) schreibt Travel-Quest genau einmal fort (kein Doppel-Progress, wenn künftig beide aktiv).
- [ ] **Step 2: → FAIL/Guard fehlt.**
- [ ] **Step 3: Implementieren** — einen Owner wählen (Reducer-seitig in `handleCompleteTravelMinigame`) und den Fallback darüber routen statt eigenständig zu emittieren.
- [ ] **Step 4: → PASS.**
- [ ] **Step 5: AGENTS/TSDoc, Commit & Push.**

```bash
git commit -m "fix(quests): single owner for travel-completed progress"
```

### Task 18: Regressionstest stale `currentGig`/`lastGigStats` beim Load

**Files:**
- Test only: `tests/node/systemReducer.*`
- Inspect: `src/context/reducers/systemReducer.ts` (1644-1646)

- [ ] **Step 1: Test schreiben** — geladener OVERWORLD-State mit altem `currentGig`/`lastGigStats` öffnet keine Gig-/Post-Gig-UI, sendet kein Leaderboard erneut, beeinflusst Practice-Rückkehr nicht.
- [ ] **Step 2: Test laufen lassen** — bei PASS reine Regressionsabsicherung; bei FAIL Defekt beheben (dann zusätzlicher Code-Commit).
- [ ] **Step 3: AGENTS/Commit & Push.**

```bash
git commit -m "test(load): cover stale gig data on overworld load"
```

### Task 19: DEV-Backdoor kanonische Minigame-Typ-Quelle

**Files:**
- Modify: `src/components/MinigameSceneFrame.tsx` (84-99)
- Test: optional (DEV-only Nit) — falls vorhandener Test-Pfad passt

- [ ] **Step 1:** Minigame-Typ aus einer kanonischen Quelle lesen (Prop oder `logic.gameStateRef.current.minigame`) statt Fallback auf `window.gameState.minigame`.
- [ ] **Step 2: typecheck + relevante Tests grün.**
- [ ] **Step 3: AGENTS (`src/components/AGENTS.md`)/Commit & Push.**

```bash
git commit -m "chore(minigame): read dev minigame type from canonical source"
```

---

## Abschluss-Gate (nach Task 19)

- [ ] `pnpm run typecheck` grün
- [ ] `pnpm run typecheck:core` grün
- [ ] `pnpm run test:all` grün
- [ ] `pnpm run symbols:check` aktuell
- [ ] Alle Themen committet **und** gepusht nach `claude/quirky-brahmagupta-dcefkb`
- [ ] Audit-Verdict `[REQUEST CHANGES]` adressiert

---

## Self-Review (Spec-Abdeckung)

| Spec-Punkt | Task |
| --- | --- |
| Major Blutbank | 1 |
| Major Setup-Minigame-Replay | 2 |
| Major Rival-Persistenz | 7 |
| Major GAMEOVER-Overwrite | 9 |
| Major Tourbus-Save-Reihenfolge | 8 |
| Major Event-Modal | 3 |
| Major Post-Gig Continue | 4 |
| Major Post-Gig Social/Deal/Spin | 5 |
| Major Practice-HQ | 10 |
| Major Roadie-Contraband | 11 |
| Minor Contraband-Feedback | 12 |
| Minor SupplyStop-Lock | 13 |
| Minor Asset-Modal-Owner | 15 |
| Minor Settings-Sanitization | 14 |
| Minor Pre-Gig-Guard | 6 |
| Follow-up Travel-Policy | 16 |
| Follow-up Quest-Owner | 17 |
| Follow-up stale Gig-Daten | 18 |
| Follow-up DEV-Backdoor | 19 |

Alle 19 Findings sind genau einer Task zugeordnet.
