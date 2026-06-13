# Design: Audit-Funde beheben (Game-Flow)

**Datum:** 2026-06-13
**Branch:** `claude/charming-hamilton-3ksxsl`
**Quelle:** `docs/game-flow-audit.md`
**Status:** Freigegeben (Design)

## Ziel & Umfang

Behebung der im Game-Flow-Audit dokumentierten Funde:
- **Abschnitt 1 (verifiziert):** alle 4 Funde direkt fixen.
- **Abschnitt 2 (plausibel):** jeden Fall **zuerst reproduzieren/verifizieren**, danach **nur bestätigte** Fälle fixen.
- **Abschnitt 3 (Soll-Verhalten/Fehlalarm):** nicht anfassen.

Erfolgskriterium: Alle Abschnitt-1-Fixes implementiert + getestet; jeder Abschnitt-2-Fall mit Status „bestätigt+gefixt" oder „widerlegt" dokumentiert; `docs/game-flow-audit.md` aktualisiert.

## Abschnitt 1 — Fixes

### 1.1 `damaged_gear`-Mechanik implementieren (Kombi-Effekt)

**Datei:** `src/utils/gigModifiersUtils.ts` (in `getGigModifiers`)

`gigModifiers` wird bereits per Spread in das `modifiers`-Objekt gemischt (Z. 72), aber `damaged_gear` wird nirgends gelesen. Neuen Block ergänzen — platziert **nach** der Member-Status-/Harmony-Logik (die nutzen direkte `=`-Zuweisung; unsere Compound-Operatoren stacken darauf):

```ts
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

**Begründung der Hebel:** Alle drei haben echte Konsumenten — `noteJitter` (`NoteManager.ts:166`), `hitWindowBonus` (`gigPhysics.ts:109`, `useRhythmGameScoring.ts:292`), `guitarScoreMult` (`useRhythmGameScoring.ts:342`).

**i18n:** Key `pregig.effects.damagedGear` in `public/locales/en/ui.json` **und** `public/locales/de/ui.json` (paarweise).

**Test:** Vitest in der zu `gigModifiersUtils` passenden Test-Datei: `getGigModifiers(band, { damaged_gear: true })` → `noteJitter === true`, `hitWindowBonus` um 10 reduziert, `guitarScoreMult` ≈ 0.9, und ein activeEffect mit Key `ui:pregig.effects.damagedGear` vorhanden. Gegentest: ohne den Modifier kein Effekt.

### 1.2 Pedal-Harmonie im PostGig-Report sichtbar machen

**Dateien:** PostGig-Report-Ableitung/-Anzeige (`src/utils/postGig/`, `src/components/postGig/`); Mutation bleibt in `src/hooks/postGig/handlers/useContinueHandler.ts:218-230`.

Besitzt die Band `neurotoxicPedal`, eine Harmonie-Effekt-Zeile im Report anzeigen: `−NEUROTOXIC_PEDAL_HARMONY_PENALTY` (= 5, `gameConstants.ts:149`). Der Wert wird **nur zur Anzeige** in der Report-Ableitung berechnet/gespiegelt; die tatsächliche State-Mutation bleibt unverändert im Continue-Handler (**keine Doppel-Anwendung**).

**i18n:** Anzeige-Label paarweise EN/DE.

**Test:** Ableitung mit `band.inventory.neurotoxicPedal = true` → Report enthält die −5-Harmonie-Zeile; ohne Pedal nicht.

### 1.3 Contraband-Toast-Typ korrigieren

**Datei:** `src/context/reducers/minigameReducer.ts:273`
`type: 'info'` → `type: 'success'` (positiver Loot, Konsistenz mit anderen Belohnungs-Toasts). Kommentar `// Could be 'success'` entfernen.

### 1.4 PostGig Escape-Hatch

**Datei:** `src/scenes/PostGig.tsx:49-58`
Im `!financials`-Zweig zusätzlich zum „TALLYING RECEIPTS…"-Ladetext einen „Zurück zur Overworld"-Button rendern, der `changeScene(GAME_PHASES.OVERWORLD)` auslöst. Verhindert Softlock bei inkonsistentem State (fehlendes `currentGig`/`lastGigStats`). `changeScene` aus den Game-Actions beziehen.

**i18n:** Button-Label paarweise EN/DE.

## Abschnitt 2 — Erst reproduzieren, dann nur Bestätigtes fixen

Pro Fall: Code-Trace + ggf. Mini-Test/Repro. Ergebnis als „bestätigt+gefixt" oder „widerlegt" in `docs/game-flow-audit.md` festhalten. **Kein Fix ohne Bestätigung.**

| Fall | Verifikationskriterium | Fix (nur falls bestätigt) |
|---|---|---|
| 2.1 Kabelsalat `finally`-Transition | Kann `completeKabelsalatMinigame()` realistisch werfen und dabei Ergebnis verlieren, während trotzdem zu GIG gewechselt wird? | Scene-Wechsel nur bei erfolgreichem Completion bzw. Ergebnis vor Wechsel sichern. |
| 2.2 `currentGig.capacity` undefined | Setzen Map-Nodes/Venues immer `capacity`? Quest-Pfad mit fehlender Kapazität nachvollziehen. | Quest-Logik gegen fehlende Kapazität absichern (statt `?? 0`). |
| 2.3 Softlock-Toast irreführend | Kann Asset-Verkauf den Softlock real auflösen, während der Toast „stranded" meldet? | Toast-Text präzisieren / Asset-Verkaufs-Option erwähnen. |
| 2.4 i18n-Defaults in `arrivalUtils` | Bestätigt vorhanden (Z. ~165-225) — Bewertung, ob Stil-Fix nötig. | Defaults belassen oder konsolidieren (niedrige Prio). |
| 2.5 Event-Gate nur `GIG` | Ist `triggerEvent` je aus Minigame/PRACTICE-Kontext erreichbar? | Nur dann Guard auf diese Phasen erweitern. |
| 2.6 Transition-/Arrival-Doppel-Effekte | Repro-Versuch echter Doppel-Effekt (doppelter Geldabzug/Tagesfortschritt). | **Ohne Repro kein Fix.** |

## Verifikation (gesamt)

- `pnpm run test:ui` (Vitest) für betroffene Dateien; ggf. `pnpm run test:ui:file -- <datei>`.
- `pnpm run typecheck:core`.
- i18n EN/DE paarweise gepflegt.
- Conventional Commits: `feat:` (damaged_gear-Mechanik), `fix:` (Toast, Report-Anzeige, Escape-Hatch, bestätigte Abschnitt-2-Fixes), `docs:` (Audit-Update).

## Nicht-Ziele

- Abschnitt 3 (dokumentiertes Soll-Verhalten) bleibt unverändert.
- Kein unbezogenes Refactoring; chirurgische Änderungen gemäß AGENTS.md.
- Balance-Tuning der `damaged_gear`-Werte über die festgelegten Kombi-Werte hinaus.
