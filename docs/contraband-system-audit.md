# Contraband-System — Tiefen-Audit

**Datum:** 2026-06-13
**Branch:** `claude/optimistic-cori-mfmymk`
**Scope:** Gesamtes Contraband-/Relics-System (Daten, Reducer, Drop-/Bust-Mechanik, Effekt-Konsum, Crafting, Void Trader, UI, i18n)

Alle Befunde sind mit `Datei:Zeile`-Referenzen belegt und am Quellcode verifiziert (sofern nicht ausdrücklich als „nicht direkt verifiziert" markiert).

---

## 0. Systemüberblick

**Datenquelle:** `src/data/contraband.ts` — `CONTRABAND_DB` (31 Items), abgeleitet `CONTRABAND_BY_ID`, `CONTRABAND_BY_RARITY`, `CONTRABAND_RARITY_WEIGHTS`, `VOID_TRADER_COSTS`.

**Eintrittspunkte in den Stash** (es gibt **kein** dispatchbares `ADD_CONTRABAND`):
1. **Drop** nach dem Tourbus-Reise-Minispiel — `minigameReducer.ts:222-282` → `addContrabandHelper`.
2. **Void Trader** (Kauf gegen Fame) — `tradeReducer.ts:53` → `addContrabandHelper`.
3. **Crafting** — `bandReducer.ts:480` (`handleCraftItem`) → `addContrabandHelper`.

**Effekt-Lebenszyklus:**
- `consumable` → Effekt bei `USE_CONTRABAND` (`handleUseContraband`), Stack/Item wird verbraucht.
- `equipment` mit `applyOnAdd` → Effekt sofort beim Hinzufügen (`addContrabandHelper:444-451`), dauerhaft.
- `relic` → Effekt bei `USE_CONTRABAND`, mit Dauer; nach Ablauf wiederverwendbar.
- Zeitlich befristete Effekte werden in `band.activeContrabandEffects` getrackt und in `processContrabandExpiry` (`systemReducer.ts:1932`) — **nur bei `ADVANCE_DAY`** (`systemReducer.ts:2162`) — dekrementiert und via `EFFECT_REVERTERS` zurückgerollt.

---

## 1. KRITISCH

### 1.1 Vier Items sind in `items.json` falsch verschachtelt → werden als „Unknown Item" angezeigt

**Dateien:** `public/locales/en/items.json:182-199`, `public/locales/de/items.json:182` (gleiche Struktur).

Die 27 „normalen" Items nutzen **flache** Schlüssel:
```json
"contraband.c_void_energy.name": "Void Energy Drink",
```
Die vier N3UR0-FORGE-Items nutzen dagegen ein **verschachteltes** Objekt:
```json
"contraband": {
  "c_neuro_mold_spores":            { "name": "...", "description": "..." },
  "c_cybernetic_plectrum_implant":  { "name": "...", "description": "..." },
  "c_fermented_void_juice":         { "name": "...", "description": "..." },
  "c_hyper_adrenaline_ampoule":     { "name": "...", "description": "..." }
}
```

**Warum das bricht:** i18n ist mit `keySeparator: false` konfiguriert (`src/i18n.ts:27`). Lookups erfolgen also als **literale** Schlüssel. `t('items:contraband.c_neuro_mold_spores.name')` sucht nach einem Top-Level-Key mit diesem exakten Namen — der existiert nicht (es existiert nur der Key `"contraband"`). Folge: Fallback auf `defaultValue` → **„Unknown Item"** bzw. generische Beschreibung, in **EN und DE**.

**Betroffen** (3 davon im Void Trader sichtbar, da rare/epic):
- `c_neuro_mold_spores` (rare, Void Trader)
- `c_cybernetic_plectrum_implant` (epic, Void Trader)
- `c_hyper_adrenaline_ampoule` (epic, Void Trader)
- `c_fermented_void_juice` (uncommon, nur Drop/Stash)

**Fix:** Die vier Einträge in beiden Locale-Dateien auf das flache Schema umstellen (`"contraband.c_xxx.name"` / `".description"`) und den verschachtelten `"contraband"`-Block entfernen.

> Hinweis: Der Schema-Test `tests/node/contraband.schema.test.js` prüft nur, dass `item.name`/`.description` mit `items:contraband.` **beginnen** — er fängt fehlende/verschachtelte Locale-Keys **nicht** ab. Es gibt aktuell keinen Test, der jede Contraband-ID gegen vorhandene EN+DE-Keys verifiziert.

---

### 1.2 Equipment-Effekte sind permanent und werden bei Konfiszierung nicht zurückgerollt

**Apply:** `bandReducer.ts:444-451` — beim Hinzufügen eines `equipment`-Items mit `applyOnAdd` wird der Effekt **direkt** in das Band-Feld geschrieben (z. B. `luck += 5`, `staminaMax += 10`, `performance.guitarDifficulty -= 0.5`).

**Problem:** Diese Effekte landen **nicht** in `activeContrabandEffects` (kein `duration`), werden also von `processContrabandExpiry`/`EFFECT_REVERTERS` **nie** angefasst. Es gibt **keinen** Unequip-/Verkaufs-/Entfernen-Pfad. Einmal angelegtes Equipment bufft dauerhaft für den Rest des Runs.

**Konfiszierung verschärft das:** Der Polizei-Event `police_contraband` (`src/data/events/transport.ts:217-273`) nutzt den Effekt `stash_confiscate`. Dessen Anwendung in `src/utils/gameState/delta.ts:802-811` macht ausschließlich:
```ts
delete nextBand.stash[itemId]
```
Der **dauerhafte Band-Stat-Bonus bleibt erhalten**, obwohl das Item weg ist. Betroffen u. a. `c_rusty_strings (+5 luck)`, `c_shattered_ear (+0.05 crit)`, `c_amped_synth (+10 staminaMax)`, `c_night_vision_glasses (+0.08 crowdControl)`, `c_radiant_pick / c_phantom_strings / c_cybernetic_plectrum_implant (guitarDifficulty)`, `c_gutter_amulet (+5 affinity)`, `c_broken_compass (+0.05 tourSuccess)`, `c_neon_patch (+3 style)`.

**Empfehlung:** Beim Confiscate (und bei einem ggf. neuen Unequip-Pfad) für `equipment`-Items mit `applyOnAdd` denselben Revert wie `EFFECT_REVERTERS` anwenden. Dazu muss die Item-Definition (effectType/value) im Handler verfügbar sein — aktuell kennt der `stashRemove`-Delta-Pfad nur die ID.

---

### 1.3 Stapelbare Verbrauchs-Items mit Dauer leaken ihren Buff permanent

**Pfad:** `handleUseContraband` → `applyContrabandEffect` (`bandReducer.ts:579-662`).

Für additive Effekte (tempo, crowd_control, tour_success, guitar_difficulty …) wird der Wert über `applySharedBandEffect` **bedingungslos** auf das Band-Feld addiert (`bandReducer.ts:637`). Anschließend wird der Effekt nur dann in `activeContrabandEffects` registriert, wenn noch **kein** Eintrag mit derselben `instanceId` existiert (`bandReducer.ts:640-659`):
```ts
const effectExists = item.instanceId != null &&
  (newBand.activeContrabandEffects ?? []).some(e => e.instanceId === item.instanceId)
if (!effectExists) { /* push tracking entry */ }
```

**Der Knackpunkt:** Alle Stacks eines Items teilen sich **eine** `instanceId` (Stash ist nach `item.id` gekeyt; `addContrabandHelper` erhöht nur `stacks` und behält die ursprüngliche `instanceId`). Wird ein stapelbares Dauer-Item **mehrfach vor dem nächsten Tag** benutzt:

1. Benutzung #1: `tempo += 0.15`; Tracking-Eintrag (remainingDuration=1) wird angelegt.
2. Benutzung #2: `tempo += 0.15` (jetzt +0.30); `effectExists === true` → **kein** zweiter Tracking-Eintrag.
3. `ADVANCE_DAY`: `processContrabandExpiry` rollt **nur 0.15** zurück → **+0.15 tempo bleiben dauerhaft hängen**.

**Betroffene Items** (stackable **und** `duration`): `c_phase_metronome` (tempo, maxStacks 2), `c_cursed_pick` (guitar_difficulty, maxStacks 3), `c_sticky_plectrum` (guitar_difficulty, maxStacks 8), `c_merch_manifest` (tour_success, maxStacks 2), `c_sticky_logo_sticker` (crowd_control, maxStacks 6).

Zusätzlich: Da der zweite Use die Dauer **nicht** auffrischt, ist er auch sonst inkonsistent (Effekt angewandt, aber kein/kein verlängerter Timer).

**Empfehlung:** Tracking pro Anwendung statt pro `instanceId` (z. B. eigene Effekt-Instanz-IDs), oder beim erneuten Use `remainingDuration` refreshen statt den zweiten Apply zuzulassen.

---

## 2. MITTEL

### 2.1 Dauer-Semantik: „GIGS" laut UI/Text, aber Ablauf pro **Tag**

`processContrabandExpiry` wird ausschließlich in `ADVANCE_DAY` aufgerufen (`systemReducer.ts:2162`). `remainingDuration` zählt also **Tage** herunter. Gleichzeitig zeigt die UI die Dauer als „GIGS" an (`ui:contraband.gigs`) und Beschreibungen sagen „for one gig" / „next gig" (z. B. `c_cursed_pick`, `c_phase_metronome`, `c_gig_program`). Mechanik und kommunizierte Bedeutung stimmen nicht überein. Effektiv hängt die Wirkungsdauer am Tageswechsel, nicht an Gigs.

### 2.2 Stapelbares Equipment (`c_neon_patch`) — Stacks ohne Wirkung

`addContrabandHelper` ruft `applySharedBandEffect` **nur** im Neu-Anlage-Zweig auf (`bandReducer.ts:444-451`). Beim Stapeln (`bandReducer.ts:412-430`) wird ausschließlich `stacks` erhöht — **kein** zusätzlicher Effekt. `c_neon_patch` ist das einzige stapelbare Equipment (siehe auch die Ausnahme im Schema-Test, `contraband.schema.test.js:243-250`): nur der erste Patch gibt `+3 style`, weitere Stacks sind wirkungslos und können weder benutzt noch zurückgerollt werden. Der Stack-Zähler ist hier rein kosmetisch (und wird nicht einmal angezeigt — siehe 2.4).

### 2.3 Drops nur über das Tourbus-Minispiel

Der einzige Drop-Pfad ist `COMPLETE_TRAVEL_MINIGAME` (`minigameReducer.ts:222-282`). Reisen, die das Tourbus-Minispiel **nicht** durchlaufen, erzeugen **nie** Contraband. Die Doku/Konstantennamen suggerieren jedoch einen generischen „drop after travel" (`contrabandUtils.ts:9` „Base probability for a contraband drop after travel"). De-facto-Verfügbarkeit ist enger als die Benennung nahelegt.

### 2.4 Stack-Anzahl wird in der Stash-UI nicht angezeigt

`StashItem.stacks` (`types/band.d.ts:38`) wird getrackt, aber `src/ui/ContrabandStash.tsx` rendert die Stack-Zahl nirgends (nur ein Doc-Kommentar erwähnt „stacks", `ContrabandStash.tsx:230`). Spieler sehen nicht, wie viele Kopien eines stapelbaren Items sie besitzen.

---

## 3. NIEDRIG / DESIGN-HINWEISE

### 3.1 Bust trifft nur das riskanteste Item, kein Fame-Malus
`computeStashBustRisk` liefert nur das **höchstriskante** Item (`contrabandUtils.ts:33-65`); `stash_confiscate` entfernt entsprechend nur diese eine ID (Kontext `riskItemId`). Restlicher Stash überlebt. Der Event verhängt Geld- und Zeit-/Controversy-Strafen, aber **keinen** Fame-Malus — bewusst zu prüfen.

### 3.2 `guitar_difficulty` Apply/Revert-Asymmetrie durch Floor-Clamp
Apply (`bandReducer.ts:375-385`) und Revert (`systemReducer.ts:1853-1863`) clampen beide auf `Math.max(0.1, …)`. Werden mehrere Reduktionen unter den Floor von 0.1 gestapelt, geht Information verloren und der Revert über-korrigiert (Schwierigkeit landet zu hoch).

### 3.3 „Permanente" Verbrauchs-/Relic-Semantik inkonsistent
- `c_hyper_adrenaline_ampoule` (consumable, `stamina_max`, **ohne** duration) erhöht `staminaMax` dauerhaft, ohne Tracking/Revert — funktioniert, widerspricht aber dem Modell „consumable = temporär".
- Relics (`gig_modifier`, `practice_gain`) werden beim Use nicht verbraucht und nach Ablauf via `applied: false` (`systemReducer.ts:1981-1987`) **unbegrenzt wiederverwendbar** — alle N Tage neu zündbar.

### 3.4 Latente Lücke: USE-Pfad für Equipment ohne Allowlist
Beim Hinzufügen ist Equipment auf `EQUIPMENT_APPLY_ON_ADD_EFFECTS` beschränkt (`bandReducer.ts:324-333,449`). Der USE-Pfad (`applyContrabandEffect` → `applySharedBandEffect`) nutzt **keine** Allowlist. Aktuell unerreichbar, weil alle Equipment-Items `applyOnAdd` haben → `applied=true` → `handleUseContraband` bricht früh ab (`bandReducer.ts:692`). Würde je ein Equipment ohne `applyOnAdd` hinzugefügt, wäre der Effekt über USE doppelt/unbeschränkt anwendbar.

### 3.5 Inkonsistente Initialisierung der Band-Effektfelder
`initialState.ts:108` initialisiert nur `luck: 0`. Die übrigen Effektfelder (`crit`, `tempo`, `crowdControl`, `affinity`, `style`, `tourSuccess`, `gigModifier`, `practiceGain`, `stress`) bleiben `undefined` und verlassen sich auf `finiteNumberOr(..., 0)` an den Lesestellen. Harmlos, aber uneinheitlich.

### 3.6 Drop-RNG: korrelierte Sekundär-Zufallszahl
Die innere Zufallszahl für Rarität/Item wird per einzelnem LCG-Schritt aus demselben Trigger-Seed abgeleitet (`minigameReducer.ts:227-232`), und `instanceId = drop-${rngValue}`. Deterministisch (gut für Saves/Tests), aber Rarität ist mit dem Trigger-Roll korreliert — mögliche leichte Verteilungs-Verzerrung; für ein Balance-Audit notierenswert.

### 3.7 Void Trader bewusst auf rare/epic beschränkt
`VOID_TRADER_COSTS` deckt nur `epic: 1000` und `rare: 400` ab (`contraband.ts:434-437`); `VoidTraderTab.tsx` filtert entsprechend nur `CONTRABAND_BY_RARITY.epic`/`.rare`. common/uncommon sind nicht käuflich — als Design dokumentiert, hier nur zur Vollständigkeit.

---

## 4. Positiv-Befund: Effekt-Verdrahtung vollständig

Alle 15 effectTypes sind tatsächlich an Gameplay angebunden (keine toten Effekte):

| effectType | Band-Feld | Konsumiert in |
|---|---|---|
| luck | band.luck | `computeDropChance` (`minigameReducer.ts:223`) + Polizei-Skillcheck |
| crit | band.crit | `useRhythmGameScoring.ts:398` (Score-Verdopplung) |
| crowd_control | band.crowdControl | `useRhythmGameScoring.ts:115` (Crowd-Decay) |
| affinity | band.affinity | `postGig/socialResolution.ts:220` (Follower-Bonus) |
| style | band.style | `postGig/performanceLogic.ts:143` (Fame-Bonus) |
| tour_success | band.tourSuccess | `arrivalUtils.ts:237` (Show-Cancel-Chance) |
| gig_modifier | band.gigModifier | `usePostGigDerivations.ts:106` (Gig-Einnahmen) |
| tempo | band.tempo | `useRhythmGameScoring.ts:291` (Hit-Window) |
| practice_gain | band.practiceGain | `gigReducer.ts:207` (Practice-Harmony) |
| guitar_difficulty | performance.guitarDifficulty | `useRhythmGameScoring.ts:294` |
| stamina_max | member.staminaMax | `travelUtils.ts:307`, Clamp in `bandReducer.ts:164` |
| stamina | member.stamina | `gigModifiersUtils.ts:212` |
| mood | member.mood | `gigModifiersUtils.ts:119` |
| harmony | band.harmony | Show-Cancel, Quests, Blood Bank u. a. |
| stress | band.stress | Akkumulation pro Gig (`gigReducer.ts:235`) |

Auch Drop-Wahrscheinlichkeit (`computeDropChance` mit `DROP_BASE_CHANCE`/`LUCK_MOD_PER_POINT`/`MAX_DROP_CHANCE`), Raritäts-Gewichtung, Stacking/Uniqueness in `addContrabandHelper`, Crafting-Verbrauch/Abbruch-Logik und die Ablauf-Reverter sind in sich konsistent.

---

## 5. Empfohlene Priorisierung

| # | Befund | Schwere | Aufwand |
|---|---|---|---|
| 1.1 | 4 Items verschachtelt in items.json → „Unknown Item" (EN+DE) | Kritisch | Klein |
| 1.2 | Equipment-Effekte permanent / Konfiszierung rollt nicht zurück | Kritisch | Mittel |
| 1.3 | Stapelbare Dauer-Consumables leaken Buff dauerhaft | Kritisch | Mittel |
| 2.1 | Dauer in Tagen statt „Gigs" (UI/Text-Mismatch) | Mittel | Klein–Mittel |
| 2.2 | `c_neon_patch`-Stacks ohne Wirkung | Mittel | Klein |
| 2.3 | Drops nur über Tourbus-Minispiel | Mittel | Design |
| 2.4 | Stack-Anzahl nicht in UI sichtbar | Mittel | Klein |
| 3.x | Diverse Design-/Konsistenz-Hinweise | Niedrig | — |

> Vorschlag für Test-Härtung: Ein Test, der **jede** `CONTRABAND_DB`-ID und jede Recipe-ID gegen vorhandene `name`/`description`- bzw. `label`/`desc`-Keys in **EN und DE** prüft (würde 1.1 dauerhaft verhindern).
