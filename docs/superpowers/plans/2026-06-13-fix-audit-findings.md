# Fix Audit Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Behebe die im Game-Flow-Audit (`docs/game-flow-audit.md`) bestätigten Funde (Abschnitt 1) und verifiziere/fixe die plausiblen Verdachtsfälle (Abschnitt 2).

**Architecture:** Reine Logik (`getGigModifiers`) erhält den fehlenden `damaged_gear`-Effekt; PostGig-Hook (`usePostGigLogic`) exponiert zwei neue Werte (`changeScene`, `pedalHarmonyPenalty`), die in `PostGig.tsx` und `CompletePhase` für Escape-Hatch bzw. Harmonie-Anzeige genutzt werden; ein Toast-Typ wird korrigiert. Abschnitt 2 wird als reproduktionsgetriebene Untersuchung mit bedingten Fixes umgesetzt.

**Tech Stack:** React 19 + TypeScript (CheckJS), Vitest (UI), `node:test` (pure logic), i18next (EN/DE), pnpm.

---

## File Structure

- `src/utils/gigModifiersUtils.ts` — konsumiert `damaged_gear` (Task 1).
- `tests/node/simulationUtils.test.js` — neue `getGigModifiers`-Testfälle (Task 1).
- `public/locales/{en,de}/ui.json` — neue i18n-Keys (Tasks 1, 3, 4).
- `src/context/reducers/minigameReducer.ts` — Toast-Typ-Fix (Task 2).
- `src/hooks/usePostGigLogic.ts` — exponiert `changeScene` + `pedalHarmonyPenalty` (Tasks 3, 4).
- `src/scenes/PostGig.tsx` — Escape-Hatch-Button + `pedalHarmonyPenalty`-Durchreichung (Tasks 3, 4).
- `src/components/postGig/CompletePhase.tsx` + `src/types/components.d.ts` — Harmonie-Anzeige (Task 4).
- `tests/ui/CompletePhase.test.jsx`, `tests/ui/PostGigLoadingFallback.test.jsx` — UI-Tests (Tasks 3, 4).
- `docs/game-flow-audit.md` — Status-Update Abschnitt 2 (Task 5).

---

## Task 1: `damaged_gear`-Modifier im Gig konsumieren

**Files:**
- Modify: `src/utils/gigModifiersUtils.ts:137` (Block vor `neurotoxicPedal`-Block einfügen)
- Modify: `public/locales/en/ui.json` (nach Zeile 1392, alphabetisch im `pregig.effects`-Block)
- Modify: `public/locales/de/ui.json` (nach Zeile 1392)
- Test: `tests/node/simulationUtils.test.js`

- [ ] **Step 1: Failing-Test ergänzen**

Am Ende von `tests/node/simulationUtils.test.js` anfügen:

```js
test('getGigModifiers applies damaged_gear combo penalty', () => {
  const band = buildBandState()
  const baseline = getGigModifiers(band)
  const modifiers = getGigModifiers(band, { damaged_gear: true })

  assert.equal(modifiers.noteJitter, true, 'damaged_gear forces jitter')
  assert.equal(
    modifiers.hitWindowBonus,
    baseline.hitWindowBonus - 10,
    'damaged_gear subtracts 10ms hit window'
  )
  assert.ok(
    Math.abs(modifiers.guitarScoreMult - baseline.guitarScoreMult * 0.9) < 1e-9,
    'damaged_gear multiplies guitar score by 0.9'
  )
  assert.ok(
    modifiers.activeEffects.some(e => e.key === 'ui:pregig.effects.damagedGear'),
    'damaged_gear pushes its active effect label'
  )
})

test('getGigModifiers without damaged_gear is unaffected', () => {
  const band = buildBandState()
  const modifiers = getGigModifiers(band)
  assert.ok(
    !modifiers.activeEffects.some(e => e.key === 'ui:pregig.effects.damagedGear'),
    'no damaged_gear effect when flag absent'
  )
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/simulationUtils.test.js`
Expected: FAIL — `damaged_gear` hat keinen Effekt (`activeEffects` enthält den Key nicht, `hitWindowBonus`/`guitarScoreMult` unverändert).

- [ ] **Step 3: Implementierung in `getGigModifiers`**

In `src/utils/gigModifiersUtils.ts` direkt **vor** dem `if (bandState.inventory?.neurotoxicPedal) {`-Block (aktuell Z. 137) einfügen:

```ts
  // Damaged gear: set on a botched setup minigame (roadie/kabelsalat/amp).
  // Combo penalty stacks on top of harmony/member effects via compound ops.
  if (gigModifiers.damaged_gear === true) {
    modifiers.noteJitter = true
    modifiers.hitWindowBonus -= 10
    modifiers.guitarScoreMult *= 0.9
    modifiers.activeEffects.push({
      key: 'ui:pregig.effects.damagedGear',
      fallback: 'DAMAGED GEAR: Sloppy timing & weak tone'
    })
  }
```

- [ ] **Step 4: i18n-Keys ergänzen**

In `public/locales/en/ui.json` nach `"pregig.effects.catering": ...` (Z. 1391) einfügen:

```json
  "pregig.effects.damagedGear": "DAMAGED GEAR: Sloppy timing & weak tone",
```

In `public/locales/de/ui.json` an gleicher Stelle einfügen:

```json
  "pregig.effects.damagedGear": "DEFEKTES EQUIPMENT: Schludriges Timing & schwacher Ton",
```

- [ ] **Step 5: Test ausführen, Erfolg bestätigen**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/simulationUtils.test.js`
Expected: PASS (alle Tests, inkl. der zwei neuen).

- [ ] **Step 6: Commit**

```bash
git add src/utils/gigModifiersUtils.ts tests/node/simulationUtils.test.js public/locales/en/ui.json public/locales/de/ui.json
git commit -m "feat: apply damaged_gear modifier penalty in gig"
```

---

## Task 2: Contraband-Drop-Toast-Typ korrigieren

**Files:**
- Modify: `src/context/reducers/minigameReducer.ts:273`

Begründung kein eigener TDD-Test: Ein Test, der einen garantierten Contraband-Drop erzwingt, erfordert RNG-/Fixture-Aufbau, der für eine Ein-Wort-Literaländerung unverhältnismäßig ist. Stattdessen Regression über die bestehende Reducer-Suite + Typecheck.

- [ ] **Step 1: Literal ändern**

In `src/context/reducers/minigameReducer.ts` Zeile 272-273:

```ts
            messageKey: 'ui:contraband.dropped',
            type: 'success'
```

(Den Kommentar `// Could be 'success'` entfernen.)

- [ ] **Step 2: Regression + Typecheck**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/minigameReducer.test.js`
Expected: PASS (keine Regression).
Run: `pnpm run typecheck:core`
Expected: keine neuen Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/context/reducers/minigameReducer.ts
git commit -m "fix: use success toast for contraband drop"
```

---

## Task 3: PostGig Escape-Hatch im Ladezustand

**Files:**
- Modify: `src/hooks/usePostGigLogic.ts` (Return-API: `changeScene` ergänzen)
- Modify: `src/scenes/PostGig.tsx` (Import + Button im `!financials`-Zweig)
- Modify: `public/locales/{en,de}/ui.json` (Button-Label)
- Test: `tests/ui/PostGigLoadingFallback.test.jsx` (neu)

- [ ] **Step 1: Failing-Test (neues File)**

Erstelle `tests/ui/PostGigLoadingFallback.test.jsx`:

```jsx
import { afterEach, describe, expect, test, vi } from 'vitest'
import { render, cleanup, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

const changeScene = vi.fn()

vi.mock('../../src/hooks/usePostGigLogic', () => ({
  usePostGigLogic: () => ({
    t: (_k, o) => o?.defaultValue ?? _k,
    phase: 'REPORT',
    financials: null,
    postOptions: [],
    postResult: null,
    brandOffers: [],
    phaseTitleKey: 'ui:postGig.title',
    phaseTitleDefault: 'POST GIG',
    social: {},
    player: {},
    pedalHarmonyPenalty: 0,
    changeScene,
    isProcessingAction: false,
    handlePostSelection: vi.fn(),
    handleAcceptDeal: vi.fn(),
    handleRejectDeals: vi.fn(),
    handleSpinStory: vi.fn(),
    handleContinue: vi.fn(),
    handleNextPhase: vi.fn()
  })
}))

vi.mock('../../src/utils/imageGen', () => ({
  resolveGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: { POST_GIG_BG: 'mock-bg' }
}))

import { PostGig } from '../../src/scenes/PostGig'

afterEach(() => {
  cleanup()
  changeScene.mockClear()
})

describe('PostGig loading fallback', () => {
  test('renders return-to-overworld escape hatch when financials missing', async () => {
    render(<PostGig />)
    const button = screen.getByText('Back to Overworld')
    expect(button).toBeTruthy()
    await userEvent.click(button)
    expect(changeScene).toHaveBeenCalledWith('OVERWORLD')
  })
})
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm run test:ui:file -- tests/ui/PostGigLoadingFallback.test.jsx`
Expected: FAIL — Button „Back to Overworld" existiert nicht; `usePostGigLogic` exponiert `changeScene` noch nicht.

- [ ] **Step 3: `changeScene` aus `usePostGigLogic` exponieren**

In `src/hooks/usePostGigLogic.ts` im Return-Objekt (`return { ... }`, beginnend mit `t,`) `changeScene` ergänzen — direkt nach `player,`:

```ts
    social,
    player,
    changeScene,
    isProcessingAction,
```

(`changeScene` stammt bereits aus dem `useGameActions()`-Destructuring im selben Hook und wird an `usePostGigHandlers` übergeben — keine neue Quelle nötig.)

- [ ] **Step 4: Escape-Button in `PostGig.tsx`**

In `src/scenes/PostGig.tsx`:

(a) Import von `GAME_PHASES` und `ActionButton` ergänzen (oben bei den Imports):

```ts
import { GAME_PHASES } from '../context/gameConstants'
import { ActionButton } from '../ui/shared'
```

(b) Destructuring um `changeScene` erweitern (in der `usePostGigLogic()`-Destrukturierung):

```ts
    player,
    changeScene,
    handlePostSelection,
```

(c) Den `!financials`-Zweig (aktuell Z. 49-58) ersetzen durch:

```tsx
  if (!financials)
    return (
      <div className='w-full h-full flex flex-col items-center justify-center bg-void-black px-4 text-center gap-6'>
        <div className='text-2xl sm:text-3xl text-toxic-green font-display animate-pulse tracking-widest'>
          {t('ui:postGig.tallyingReceipts', {
            defaultValue: 'TALLYING RECEIPTS...'
          })}
        </div>
        <ActionButton
          onClick={() => changeScene(GAME_PHASES.OVERWORLD)}
          variant='secondary'
          className='min-h-11 px-6 py-3'
        >
          {t('ui:postGig.backToOverworld', {
            defaultValue: 'Back to Overworld'
          })}
        </ActionButton>
      </div>
    )
```

- [ ] **Step 5: i18n-Keys ergänzen**

In `public/locales/en/ui.json` im `postGig.*`-Block:

```json
  "postGig.backToOverworld": "Back to Overworld",
```

In `public/locales/de/ui.json`:

```json
  "postGig.backToOverworld": "Zurück zur Overworld",
```

- [ ] **Step 6: Test ausführen, Erfolg bestätigen**

Run: `pnpm run test:ui:file -- tests/ui/PostGigLoadingFallback.test.jsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/usePostGigLogic.ts src/scenes/PostGig.tsx tests/ui/PostGigLoadingFallback.test.jsx public/locales/en/ui.json public/locales/de/ui.json
git commit -m "fix: add overworld escape hatch to post-gig loading state"
```

---

## Task 4: Neurotoxic-Pedal-Harmonie im PostGig-Report anzeigen

**Files:**
- Modify: `src/hooks/usePostGigLogic.ts` (Import + `pedalHarmonyPenalty` berechnen & exponieren)
- Modify: `src/scenes/PostGig.tsx` (Wert an `CompletePhase` durchreichen)
- Modify: `src/types/components.d.ts:317` (`CompletePhaseProps`)
- Modify: `src/components/postGig/CompletePhase.tsx` (Warn-Zeile rendern)
- Modify: `public/locales/{en,de}/ui.json` (Label)
- Test: `tests/ui/CompletePhase.test.jsx`

- [ ] **Step 1: Failing-Test in `CompletePhase.test.jsx`**

Innerhalb des `describe('CompletePhase', ...)` anfügen:

```jsx
  test('shows neurotoxic pedal harmony warning when penalty present', () => {
    render(
      <CompletePhase
        result={mockResult}
        onContinue={vi.fn()}
        player={mockPlayer}
        social={mockSocial}
        pedalHarmonyPenalty={5}
      />
    )
    expect(screen.getByText(/NEUROTOXIC PEDAL/i)).toBeTruthy()
  })

  test('hides pedal harmony warning when no penalty', () => {
    render(
      <CompletePhase
        result={mockResult}
        onContinue={vi.fn()}
        player={mockPlayer}
        social={mockSocial}
        pedalHarmonyPenalty={0}
      />
    )
    expect(screen.queryByText(/NEUROTOXIC PEDAL/i)).toBeNull()
  })
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `pnpm run test:ui:file -- tests/ui/CompletePhase.test.jsx`
Expected: FAIL — Warn-Zeile wird nicht gerendert (Prop existiert noch nicht).

- [ ] **Step 3: `CompletePhaseProps` erweitern**

In `src/types/components.d.ts` in `interface CompletePhaseProps` (ab Z. 317) ein optionales Feld ergänzen:

```ts
  pedalHarmonyPenalty?: number
```

- [ ] **Step 4: Warn-Zeile in `CompletePhase.tsx`**

In `src/components/postGig/CompletePhase.tsx`:

(a) Prop in der Destrukturierung ergänzen:

```tsx
  player,
  social,
  pedalHarmonyPenalty = 0,
  isProcessingAction = false
```

(b) Direkt **vor** `<SideEffectsSummary ... />` (Z. 100) einfügen:

```tsx
        {pedalHarmonyPenalty > 0 ? (
          <div className='mb-4 font-mono text-sm text-blood-red'>
            ⚠️{' '}
            {t('ui:postGig.pedalHarmonyWarning', {
              penalty: pedalHarmonyPenalty,
              defaultValue: `NEUROTOXIC PEDAL: -${pedalHarmonyPenalty} Harmony on continue`
            })}
          </div>
        ) : null}
```

- [ ] **Step 5: `pedalHarmonyPenalty` in `usePostGigLogic` berechnen & exponieren**

In `src/hooks/usePostGigLogic.ts`:

(a) Import ergänzen:

```ts
import { NEUROTOXIC_PEDAL_HARMONY_PENALTY } from '../context/gameConstants'
```

(b) Vor dem `return {`-Block berechnen:

```ts
  const pedalHarmonyPenalty = band?.inventory?.neurotoxicPedal
    ? NEUROTOXIC_PEDAL_HARMONY_PENALTY
    : 0
```

(c) Im Return-Objekt nach `changeScene,` ergänzen:

```ts
    changeScene,
    pedalHarmonyPenalty,
    isProcessingAction,
```

- [ ] **Step 6: Wert in `PostGig.tsx` durchreichen**

In `src/scenes/PostGig.tsx`:

(a) `pedalHarmonyPenalty` in der `usePostGigLogic()`-Destrukturierung ergänzen (nach `changeScene,`).

(b) Im `CompletePhase`-Render (Z. 110-118) Prop ergänzen:

```tsx
            <CompletePhase
              result={postResult}
              onContinue={handleContinue}
              onSpinStory={handleSpinStory}
              player={player}
              social={social}
              pedalHarmonyPenalty={pedalHarmonyPenalty}
            />
```

- [ ] **Step 7: i18n-Keys ergänzen**

In `public/locales/en/ui.json` im `postGig.*`-Block:

```json
  "postGig.pedalHarmonyWarning": "NEUROTOXIC PEDAL: -{{penalty}} Harmony on continue",
```

In `public/locales/de/ui.json`:

```json
  "postGig.pedalHarmonyWarning": "NEUROTOXIC-PEDAL: -{{penalty}} Harmonie beim Fortfahren",
```

- [ ] **Step 8: Tests ausführen, Erfolg bestätigen**

Run: `pnpm run test:ui:file -- tests/ui/CompletePhase.test.jsx`
Expected: PASS.
Run: `pnpm run typecheck:core`
Expected: keine neuen Fehler.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/usePostGigLogic.ts src/scenes/PostGig.tsx src/types/components.d.ts src/components/postGig/CompletePhase.tsx tests/ui/CompletePhase.test.jsx public/locales/en/ui.json public/locales/de/ui.json
git commit -m "fix: surface neurotoxic pedal harmony penalty in post-gig report"
```

---

## Task 5: Abschnitt 2 — reproduzieren, dann nur Bestätigtes fixen

Diese Task ist untersuchungsgetrieben (kein TDD-Zyklus). Pro Fall: verifizieren, Ergebnis in `docs/game-flow-audit.md` als „bestätigt+gefixt" oder „widerlegt" mit Datei:Zeile dokumentieren. **Kein Fix ohne Reproduktion.**

- [ ] **Step 1: 2.1 Kabelsalat `finally`-Transition**

Prüfen: Kann `completeKabelsalatMinigame()` (`src/scenes/kabelsalat/hooks/useKabelsalatGameEnd.ts:41-45`) realistisch werfen und dabei das Ergebnis verlieren, während der `finally`-Block (Z. 66) trotzdem zu GIG wechselt? Trace: Action-Creator → Reducer-Pfad.
Fix nur falls bestätigt: Scene-Wechsel in den `try`-Erfolgspfad verschieben statt `finally` (so dass bei Fehler nicht stillschweigend ohne Ergebnis fortgefahren wird), Verhalten gegen Softlock dokumentieren.

- [ ] **Step 2: 2.2 `currentGig.capacity` undefined**

Prüfen: Setzen Map-Nodes/Venues (`src/context/useMapGeneration.ts`, Venue-Daten) immer `capacity`? Trace Quest-Pfad `gigReducer.ts:251-255` → Gig-Completed-Quest-Event mit `capacity ?? 0`.
Fix nur falls bestätigt (Kapazität kann fehlen): Quest-Event nicht feuern bzw. Kapazitäts-Gate überspringen, wenn `capacity` null ist (statt `?? 0`, das kleine Venues fälschlich triggert).

- [ ] **Step 3: 2.3 Softlock-Toast irreführend**

Prüfen: Kann Asset-Verkauf den Softlock real auflösen, während `useTravelEffects.ts` (~Z. 159-178) „stranded" meldet? Trace `checkSoftlock` + Asset-Verkaufs-Pfad.
Fix nur falls bestätigt: Toast-Text präzisieren (i18n EN/DE), z. B. Hinweis auf Asset-Verkauf, wenn verkäufliche Assets vorhanden sind.

- [ ] **Step 4: 2.4 i18n-Defaults in `arrivalUtils`**

Bestätigt vorhanden (`src/utils/arrivalUtils.ts` ~Z. 165-225). Bewerten, ob die englischen `defaultValue`s ein reales Risiko sind (Katalog-Ladereihenfolge). Niedrigste Prio: Falls EN/DE-Keys existieren und immer geladen werden → als „akzeptabel/widerlegt" dokumentieren; sonst Keys belassen, aber notieren.

- [ ] **Step 5: 2.5 Event-Gate nur `GIG`**

Prüfen: Ist `triggerEvent` (`src/context/useEventSystem.ts:154-158`) je aus Minigame-/PRACTICE-Kontext erreichbar? Trace alle `triggerEvent`-Aufrufer.
Fix nur falls bestätigt (erreichbar): Guard auf `PRACTICE`/Minigame-Phasen erweitern.

- [ ] **Step 6: 2.6 Transition-/Arrival-Doppel-Effekte**

Repro-Versuch: Lässt sich ein echter Doppel-Effekt (doppelter Geldabzug / doppelter Tagesfortschritt) auslösen? Bestehende Guards prüfen (`isHandlingRef`, `isProcessingActionRef`, `transitionedRef`).
**Ohne Reproduktion kein Fix** — als „nicht reproduzierbar" dokumentieren.

- [ ] **Step 7: Audit-Doc aktualisieren + Commit**

`docs/game-flow-audit.md`: In Abschnitt 2 je Fall den Status (bestätigt+gefixt / widerlegt / nicht reproduzierbar) mit Datum ergänzen.

```bash
git add -A
git commit -m "fix: resolve confirmed section-2 audit findings and update audit doc"
```

(Falls in Steps 1-6 Fixes erfolgten, diese in denselben oder separate `fix:`-Commits aufnehmen; falls nichts bestätigt wurde, nur der `docs:`-Commit für das Audit-Update — dann Message `docs: record section-2 audit verification results`.)

---

## Task 6: AGENTS.md- & TSDoc-Abschlussprüfung

**Vom Haupt-Agenten selbst auszuführen** (nicht an Subagent delegieren). Prüfen, ob die Änderungen aus Tasks 1-5 eine durable Instruktion (`AGENTS.md`) oder TSDoc-Aktualisierung erfordern; nur bei echtem, nicht-offensichtlichem Bedarf editieren (gemäß AGENTS.md: chirurgisch, kein spekulatives Doku-Wachstum).

**Files (Kandidaten):**
- `AGENTS.md`, `CLAUDE.md` (Root)
- `src/utils/AGENTS.md` (enthält bereits Gig-Modifier-/perfScore-Notizen)
- `src/components/postGig/AGENTS.md`, `src/context/reducers/AGENTS.md`, `src/scenes/AGENTS.md` (falls vorhanden)
- Geänderte Quell-Dateien aus Tasks 1-4 (TSDoc)

- [ ] **Step 1: AGENTS.md-Scopes prüfen**

Relevante `AGENTS.md` lesen. Bewerten:
  - `src/utils/AGENTS.md`: Lohnt eine Zeile zu `damaged_gear` (jetzt konsumiert in `getGigModifiers`, Kombi-Strafe Jitter/−10ms/×0.9)? Nur ergänzen, wenn es künftige Fehler verhindert (z. B. „Modifier wird konsumiert, nicht nur gesetzt").
  - `src/components/postGig/AGENTS.md`: Lohnt ein Hinweis, dass `pedalHarmonyPenalty` nur **angezeigt** wird, die Mutation aber im `useContinueHandler` bleibt (keine Doppel-Anwendung)?
  - Sonstige Scopes: nur falls eine konkrete, neue Invariante entstand.

- [ ] **Step 2: TSDoc der geänderten Symbole prüfen/aktualisieren**

  - `getGigModifiers` (`src/utils/gigModifiersUtils.ts`): `@param gigModifiers` ggf. um `damaged_gear` ergänzen.
  - `usePostGigLogic` (`src/hooks/usePostGigLogic.ts`): `@returns`-Beschreibung um `changeScene`/`pedalHarmonyPenalty` ergänzen, falls die bestehende Doku die Rückgaben aufzählt.
  - `CompletePhaseProps` / `CompletePhase` (`src/types/components.d.ts`, `CompletePhase.tsx`): neues Prop dokumentieren, falls dort TSDoc-Konvention herrscht.
  Nur ändern, wo bereits TSDoc existiert oder die Konvention es klar verlangt — keine neuen Doc-Blöcke erzwingen.

- [ ] **Step 3: Verifikation**

Run: `pnpm run typecheck:core`
Expected: keine Fehler (TSDoc-Änderungen sind kommentar-only, dürfen nichts brechen).

- [ ] **Step 4: Commit (nur falls geändert)**

```bash
git add -A
git commit -m "docs: update AGENTS notes and TSDoc for audit-finding fixes"
```

Falls keine Änderung nötig war: kein Commit, Begründung in der Task-Notiz festhalten.

---

## Task 7: Gesamtverifikation, Symbols-Index, Push

**Files:** ggf. `symbols.json`

- [ ] **Step 1: Symbols-Index aktualisieren**

`usePostGigLogic` (neue Returns `changeScene`, `pedalHarmonyPenalty`) und `CompletePhaseProps` (neues Feld) haben sich geändert → Index regenerieren:

Run: `pnpm run symbols:update`
Run: `pnpm run symbols:check`
Expected: Index aktuell, keine Diskrepanz.

- [ ] **Step 2: Volle relevante Test-Suite + Typecheck**

Run: `pnpm run test:ui`
Run: `pnpm run typecheck:core`
Expected: PASS.

- [ ] **Step 3: Symbols committen (falls geändert)**

```bash
git add symbols.json
git commit -m "chore: update symbols index"
```

- [ ] **Step 4: Push**

```bash
git push -u origin claude/charming-hamilton-3ksxsl
```

---

## Self-Review Notes

- **Spec-Coverage:** 1.1→Task 1, 1.2→Task 4, 1.3→Task 2, 1.4→Task 3, Abschnitt 2→Task 5, AGENTS.md/TSDoc→Task 6, Verifikation/i18n/Symbols/Push→Task 7. Vollständig.
- **Typ-Konsistenz:** `pedalHarmonyPenalty` (number) und `changeScene` durchgehend gleich benannt in `usePostGigLogic` (Return), `PostGig.tsx` (Destructuring + Props), `CompletePhaseProps`, `CompletePhase` (Prop). i18n-Key `ui:pregig.effects.damagedGear` identisch in Impl (Task 1 Step 3), Test (Step 1) und Locale (Step 4). `ui:postGig.backToOverworld` und `ui:postGig.pedalHarmonyWarning` konsistent zwischen Impl, Test und Locale.
- **Keine Platzhalter:** Alle Code-Schritte enthalten vollständigen Code.
