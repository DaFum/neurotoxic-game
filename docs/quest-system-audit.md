# Quest-System-Audit

Stand: 2026-06-12 · Untersuchter Umfang: Registry, Lifecycle, Acceptance, Progress-Engine,
Rewards/Penalties, Offer-Engine, Event-Producer, Reducer-Integration, UI (QuestsModal),
i18n (EN/DE), Persistenz, Tests.

Untersuchte Kernmodule:

- `src/data/questRegistry.ts`, `src/data/questsConstants.ts`, `src/data/events/quests.ts`
- `src/domain/questLifecycle.ts`, `questAcceptance.ts`, `questRewards.ts`, `questPenalties.ts`, `questEffects.ts`, `questOfferEngine.ts`, `questHelpers.ts`
- `src/utils/questProgress.ts`, `src/utils/questUtils.ts`
- `src/quests/producers/*` (10 Producer-Module)
- `src/context/reducers/questReducer.ts` + emittierende Reducer (gig/social/asset/minigame/band/system/event)
- `src/ui/QuestsModal.tsx`, `src/hooks/useQuestsModal.ts`, `src/hooks/postGig/handlers/*`
- `public/locales/{en,de}/{ui,events}.json`

---

## 1. Kritische Befunde (Bugs)

### 1.1 ✅ ERLEDIGT — `'rehearsal'` ist kein gültiger `AssetKind` → zwei Quests sind totes Content

> **Fix:** `'rehearsal'` wurde in Offer-Conditions und Repair-Reward durch
> `'bandhaus_chassis'` ersetzt (`questRegistry.ts`); der Test-Fallback in
> `tests/node/questSystem.test.js` verwendet jetzt ebenfalls einen gültigen Kind.

`quest_murphys_law` und `quest_crisis_manager` verlangen in ihrer Offer-Condition
`requiredAssetKind: 'rehearsal'` (`src/data/questRegistry.ts:545`, `:569`). Gültige
Asset-Kinds sind aber ausschließlich `tourbus_chassis`, `studio_chassis`,
`bandhaus_chassis`, `merch_workshop_chassis` (`src/types/assets.d.ts:4`). Der Check
`(state.assets ?? []).some(asset => asset.kind === condition.requiredAssetKind)`
(`src/domain/questOfferEngine.ts:71-76`) ist damit **immer false** — beide Quests können
nie angeboten werden, obwohl ihre Trigger-Events (`quest_trigger_murphys_law`,
`quest_trigger_crisis_manager`, je chance 0.05) und alle Locale-Texte existieren.

Zusätzlich ist der Reward `{ type: 'asset.repair', assetKind: 'rehearsal', amount: 20 }`
(`questRegistry.ts:549`) ein No-op, weil `applyAssetRepair` nie ein Asset mit diesem Kind
findet (`src/domain/questRewards.ts:95-115`).

Verschärfend: `tests/node/questSystem.test.js:111` und `:118` verwenden `'rehearsal'`
als Fallback-`assetKind` in synthetischen Events und maskieren das Problem dadurch.

### 1.2 Elf fehlende `ui:quests.progressSource.*`-Übersetzungsschlüssel (EN **und** DE)

`QuestsModal` rendert `t('ui:quests.progressSource.<source>')`
(`src/ui/QuestsModal.tsx:326-336`). Für folgende Sources fehlt der Key in **beiden**
Locale-Dateien — die UI zeigt den rohen i18n-Key an:

| Fehlender Key (`ui:quests.progressSource.…`) | Betroffene Quests |
| --- | --- |
| `item_delivered` | quest_special_delivery |
| `item_crafted` | quest_alchemist |
| `brand_deal_failed` | quest_burned_bridges |
| `brand_trust_changed` | quest_brand_ambassador |
| `minigame_perfected` | quest_flawless_run |
| `asset_risk_triggered` | quest_murphys_law |
| `asset_risk_resolved` | quest_crisis_manager |
| `venue_blacklisted` | quest_persona_non_grata |
| `venue_unblacklisted` | quest_make_amends |
| `venue_reputation_changed` | quest_venue_regular |
| `story_flag_added` | quest_chapter_marker |

Das betrifft 11 von 31 Registry-Quests. Alle übrigen Quest-Keys (Labels, Beschreibungen,
Trigger-Events, Toast-Keys, Reward-/Penalty-Chips) sind in EN und DE vollständig vorhanden
(219 Keys geprüft).

### 1.3 Retry-Cooldowns der Story-Quests sind wirkungslos

Die Failure-Penalties `{ type: 'quest.cooldown', id: 'prove_yourself_retry', days: 20 }`
(`questRegistry.ts:27`), `apology_tour_retry` (`:50`) und `ego_management_retry` (`:78`)
schreiben Einträge nach `state.questCooldowns`
(`src/domain/questPenalties.ts:200-213`). Gelesen werden Quest-Cooldowns aber nur in
`canAcceptQuest`, und dort **ausschließlich bei `repeatPolicy === 'cooldown'`**
(`src/domain/questAcceptance.ts:118-124`). Alle drei Story-Quests haben
`repeatPolicy: 'never'` — der Cooldown wird nie konsultiert.

Konsequenz: Nach dem Scheitern von `quest_prove_yourself` kann das Quest beim nächsten
dritten Bad Show sofort wieder starten (`src/context/reducers/gigReducer.ts:114-123`);
ebenso kann `consequences_cancel_culture_quest` die Apology-Tour sofort wieder anstoßen
(die Event-Condition prüft nur Controversy ≥ 85 und Aktiv-Flags,
`src/data/events/consequences.ts:205-214`).

### 1.4 System-Mismatch: `ego_management_retry` schreibt Quest-Cooldown, gelesen wird Event-Cooldown

`consequences_ego_breakup_threat` gate-t über
`isOnCooldown(state, 'ego_management_retry')` (`src/data/events/consequences.ts:249`).
`isOnCooldown` liest aber **`eventCooldowns`** (String-Einträge `eventId:expiry`,
`src/utils/gameState/checks.ts:102-127`) — nicht `questCooldowns`, wohin die
Quest-Failure-Penalty schreibt. Der Quest-Fehlschlag-Cooldown greift also nie; nur der
Ablehnen-Pfad (Opt2) wirkt, weil er einen echten Event-Cooldown setzt
(`{ type: 'cooldown', eventId: 'ego_management_retry', value: 10 }`,
`consequences.ts:282`). Wer das Quest annimmt und scheitert, bekommt das Breakup-Event
ggf. sofort erneut; wer ablehnt, hat 10 Tage Ruhe — vermutlich genau verkehrt herum.

### 1.5 Phantom-Item-IDs in Rewards: `lucky_pick` und `energy_drink`

`quest_pick_of_destiny` belohnt `{ type: 'item.add', itemId: 'lucky_pick' }`
(`questRegistry.ts:93`), `quest_sponsor_demand` `itemId: 'energy_drink'` (`:145`).
Beide IDs existieren in keinem Item-Katalog (`hqItems.ts` nutzt `hq_*`-Präfixe,
`contraband.ts` nutzt `c_*`) und haben keine `items`-Locale-Einträge. Der Reward setzt
nur `band.inventory['lucky_pick'] = true` — ein totes Inventar-Flag ohne Anzeige,
Name oder Effekt. (Es gibt einen Brand-Deal `energy_drink_cx`, aber kein Item.)

---

## 2. Inkonsistenzen und Design-Smells

### 2.1 `QuestCooldown.id` ist ein totes Feld

`applyQuestFailurePenalties` speichert die Penalty-ID (`*_retry`) als `id` neben
`questId` (`questPenalties.ts:207-211`), der Typ deklariert sie
(`src/types/quest.d.ts:357-361`) — aber **kein Code liest `id`**. `canAcceptQuest`
matcht nur `cd.questId === questId`. Alle `*_retry`-IDs in der Registry sind dekorativ.
Zudem ist das Namensschema inkonsistent: `prove_yourself_retry` (ohne `quest_`-Präfix)
vs. `quest_viral_dance_retry`.

### 2.2 `story.flagAdded` wird nur vom Event-System emittiert

`createStoryFlagAddedQuestEvent` feuert nur in `eventReducer` für Flags, die durch
Event-Resolution hinzukommen (`src/context/reducers/eventReducer.ts:54-65`). Flags aus
Quest-Lifecycle (`completionFlags`, `startFlags`, `flag.add`-Rewards in
`questLifecycle.ts` / `questRewards.ts`) lösen **kein** `story.flagAdded` aus.
`quest_chapter_marker` ("3 Story-Beats") zählt daher nur Event-Flags; abgeschlossene
Story-Quests (z. B. `apology_tour_complete`) zählen nicht — schwer nachvollziehbar
für Spieler und inkonsistent gegenüber dem Eventnamen.

### 2.3 Semantik-Konflation `fame_gained` ↔ `region.reputationChanged`

Das Legacy-Mapping setzt `fame_gained → region.reputationChanged`
(`src/utils/questProgress.ts:80`). Dadurch speist sich `quest_local_legend`
("Earn 500 fans", required 500, 10 Tage) aus zwei verschiedenen Größen:

- echte Regions-Reputations-Deltas: ±5/±10 pro Gig (`gigReducer.ts:273-330`), wobei
  Reputation auf MAX geclamped ist, und
- Post-Gig-**Fame**-Gains via `createRegionReputationChangedQuestEvent` mit
  `reason: 'post_gig_fame'` (`src/hooks/postGig/handlers/useContinueHandler.ts:190-198`).

500 Punkte in 10 Tagen sind über den Reputations-Pfad praktisch unmöglich; das Quest
hängt vollständig am Fame-Pfad, der semantisch keine "Region Reputation" ist. Ein
eigener Eventtyp (`fame.gained`) wäre sauberer.

### 2.4 `economy.moneyEarned` wird nur für Brand-Deals emittiert

Einziger Producer-Aufruf: Brand-Deal-Auszahlungen
(`src/hooks/postGig/handlers/useDealHandlers.ts:55-62`). Gig-Gagen, Merch-Verkäufe,
Crowdfunding etc. zählen nicht. Für `quest_payday` passt die Beschreibung zufällig
("Rake in 1000 from brand money"), aber der generische Eventname `economy.moneyEarned`
suggeriert Gesamteinkommen — jede künftige Quest auf `money_earned` erbt die Lücke
unbemerkt.

### 2.5 Doppelte/dreifache Flag-Mechanismen für dieselben Flags

Story-Quests definieren identische Flags gleichzeitig über `completionFlags` **und**
`rewards: [{ type: 'flag.add', … }]` (z. B. `prove_yourself_complete` in
`questRegistry.ts:21-22`; ebenso apology_tour, ego_management, back_from_pit,
sincere_redemption, band_pact). Analog doppeln `failureFlags` und
`failurePenalties → flag.add` (`back_from_pit_failed` in `:387` und `:394`).
Dedupe in `addStoryFlags`/`checkDeadlines` verhindert Schaden, aber es gibt zwei
Quellen für dieselbe Wahrheit — Änderungen müssen an zwei Stellen synchron bleiben.

### 2.6 Tote Failure-Flags, kein Fail-Tracking

`prove_yourself_failed`, `apology_tour_failed`, `back_from_pit_failed`,
`sincere_redemption_failed`, `band_pact_failed` werden gesetzt, aber von keinem
Code/Event ausgewertet (einzig `ego_crisis_failed` taucht im Decline-Pfad von
`consequences_ego_breakup_threat` auf — dort allerdings als Setzen, nicht als Prüfung).
Es existiert kein `failedQuestIds`-Pendant zu `completedQuestIds`; `repeatPolicy:
'never'` blockt nur nach **Erfolg**. Gescheiterte `never`-Quests sind beliebig oft
wiederholbar — möglicherweise gewollt (Retry), kollidiert aber mit den (wirkungslosen,
siehe 1.3) Retry-Cooldowns.

### 2.7 `offer.trigger` / `offer.chance` / `offer.category` sind in Produktion ungenutzt

`QuestOfferEngine.getAvailableOffers` (der einzige Konsument von `trigger`/`chance`)
wird nur in Tests aufgerufen (`tests/node/domain/questOfferEngine.test.js:86`).
Real laufen Angebote über die `QUEST_EVENTS`-Definitionen in
`src/data/events/quests.ts`, die `chance` und Kategorie **eigenständig duplizieren**.
Aktuell sind alle Paare synchron (z. B. harmony_project 0.3/0.3), aber die doppelte
Pflege ist ein Drift-Risiko ohne Test, der beide Quellen abgleicht. Genutzt wird vom
`offer`-Block effektiv nur `condition` (via `canOfferQuest`).

### 2.8 Ablehnen wird teils belohnt, teils bestraft

Die meisten Trigger-Events bestrafen das Ablehnen (mood/fame-Malus). Vier belohnen es:

- `quest_trigger_studio_demo` Opt2: **+3 fame** (`events/quests.ts:198`)
- `quest_trigger_venue_residency` Opt2: **+5 fame** (`:241`)
- `quest_trigger_merch_rush` Opt2: **+50 money** (`:219`)
- `quest_trigger_premium_endorsement` Opt2: **+100 money** (`:306`)

Falls als "Abfindung" gedacht: in Ordnung, aber dann sollte das Muster konsistent
dokumentiert sein — aktuell wirkt es willkürlich.

### 2.9 Gemischte UND/ODER-Semantik in `matchesSocialCondition`

`loyaltyBelow`/`controversyAbove` sind **ODER**-verknüpft (`some(Boolean)`),
`minTiktok`/`maxTiktok` dagegen harte **UND**-Bedingungen
(`src/domain/questOfferEngine.ts:27-43`). Für `quest_community_outreach`
(loyaltyBelow 35 ODER controversyAbove 30) ist das vermutlich gewollt, aber die
Semantik ist im Typ `QuestOfferCondition` nicht erkennbar und leicht falsch zu erweitern.

### 2.10 `brandId`/`alignment` vermischt

`useDealHandlers` übergibt `brandId: deal.alignment` an
`createBrandTrustChangedQuestEvent` (`useDealHandlers.ts:47-50`). Ein künftiges
`match.brandId` in Progress-Rules würde also gegen Alignments ('corporate', …) statt
Brand-IDs matchen. Entweder Feld korrekt befüllen oder `brandAlignment` verwenden.

### 2.11 `quest_harmony_project` mischt Threshold- und Inkrement-Progress

Regel 1 setzt Progress absolut auf den Harmony-Stand (`threshold`), Regel 2 addiert
+5 pro erfolgreichem Lifestyle-Post (`questRegistry.ts:158-172`). Ein Post zählt damit
so, als wäre die Harmony 5 Punkte höher — der Fortschrittsbalken (Ziel 75) zeigt dann
einen Wert, der nicht mehr dem tatsächlichen Harmony-Stand entspricht. Funktional ok
(monotones `setQuestProgress` verhindert Rückschritte), aber semantisch unsauber und
in der UI nicht erklärt.

### 2.12 Ego-Management-Seeding mit Default 80 > required 50

`buildStoryFlagQuests` seedet den Threshold-Progress mit
`postPenaltyHarmony ?? clampBandHarmony(finiteNumberOr(bandHarmony, 80))`
(`useContinueHandler.ts:92-96`). Fällt der Harmony-Wert aus (undefined/NaN), startet
das Quest mit Progress 80 ≥ required 50 → `addQuest` schließt es sofort ab
(`questLifecycle.ts:98-104`). Der Fallback sollte konservativ (z. B. 0) sein.

### 2.13 Hardcodierte Altlogik im generischen Lifecycle

`completeQuest` enthält einen Quest-spezifischen Block für `quest_prove_yourself`
(`venueBlacklist.slice(2)`, `proveYourselfMode: false`; `questLifecycle.ts:214-221`,
selbst kommentiert als "Hardcoded old quest logic"). Einziger Bruch des ansonsten
deklarativen Reward-Systems; ein `venue.unblacklist`-Reward-Typ würde das auflösen.

### 2.14 Copy/Anforderungs-Mismatch `quest_alchemist`

`required: 2` (`questRegistry.ts:688`), aber EN "Craft **an item** from contraband…" und
DE "Stelle **einen Gegenstand** … her" (Singular). Spieler erwarten 1 Craft, brauchen 2.

### 2.15 Sonstige Kleinigkeiten

- `quest_prove_yourself` hat als einziges Quest keine `description` → leerer
  Beschreibungstext im Modal (`QuestsModal.tsx:322-324`).
- `QUEST_SLOT_LIMITS` reserviert `tutorial: 1` (`questAcceptance.ts:9-14`), es existiert
  aber kein einziges Tutorial-Quest.
- `quest_local_legend` und `quest_chapter_marker` vergeben `skill_point` immer an
  `memberIndex: 0` — andere Skill-Point-Pfade nutzen `randomIdx`. Vermutlich gewollt,
  aber undokumentiert.
- `questsConstants.ts` dokumentiert die ersten ~8 Konstanten mit TSDoc, die übrigen 24
  nicht (Stilbruch innerhalb der Datei).

---

## 3. Tote/ungenutzte Eventtypen (Inventar)

Folgende kanonische `QuestEventType`s werden produziert und/oder typisiert, aber von
**keiner** Registry-Quest konsumiert (Stand heute):

- Emittiert, ohne Konsument: `venue.gigCompleted`, `venue.goodGig`,
  `social.loyaltyChanged`, `social.controversyChanged`, `social.trendMatched`,
  `brand.offerAccepted`, `asset.acquired`, `asset.repaired`, `asset.moduleInstalled`,
  `asset.conditionChanged`, `item.used`, `minigame.completed`, `minigame.failed`
- Nur Typ + Producer, Emission an genau einer Stelle: `item.collected`
  (nur Tourbus-Contraband, `minigameReducer.ts:258`) und `item.delivered`
  (nur Roadie-Minigame, `:586`) — `quest_sticky_fingers` (5 Items / 18 Tage) und
  `quest_special_delivery` (10 Einheiten / 14 Tage) sind damit ausschließlich über
  Minigames erfüllbar; Shop-/Event-Items zählen nicht.

Als Vorhalt für künftige Quests legitim, sollte aber bewusst gepflegt werden
(z. B. Kommentar im Typ oder Abdeckungstest).

---

## 4. Test-/Absicherungslücken

- `tests/node/questSystem.test.js:111,118` benutzt `'rehearsal'` als Fallback-AssetKind
  und kaschiert damit Befund 1.1 — der Fallback sollte ein gültiger `AssetKind` sein.
- Kein Test validiert, dass alle Registry-`label`/`description`-Keys und die
  `ui:quests.progressSource.*`-Keys in beiden Locale-Dateien existieren — hätte
  Befund 1.2 gefangen.
- Kein Test gleicht `QUEST_REGISTRY[*].offer.chance` mit der `chance` des zugehörigen
  `quest_trigger_*`-Events ab (Drift-Risiko aus 2.7).
- Kein Test prüft, dass Reward-`itemId`s (`item.add`) in einem Item-Katalog existieren
  (Befund 1.5).

---

## 5. Was solide ist (Positivbefunde)

- Klare Schichtung: Registry (Daten) → Acceptance/Lifecycle/Rewards/Penalties (Domain)
  → Producer (Events) → Reducer (Integration) → UI; `questReducer` ist eine reine
  Delegationsschicht.
- Konsequente Payload-Hygiene: `isForbiddenKey`-Checks gegen Prototype-Pollution,
  `finiteNumberOr` an allen Arithmetik-Grenzen, Clamps in Rewards/Penalties.
- Slot-, Scope- (perVenue/perRegion) und Cooldown-Gating zentral in `canAcceptQuest`;
  Event-Conditions und `addQuest` teilen sich dieselbe Logik (kein Drift).
- `setQuestProgress` ist monoton und gekappt; `advanceQuest` zählt nur positive Beträge
  (negative Reputations-/Trust-Deltas können Progress nicht abbauen).
- Reducer emittieren Quest-Events nur bei tatsächlicher State-Änderung
  (No-op-Farming-Schutz, dokumentiert in `src/context/reducers/AGENTS.md`).
- Toast-Optionen werden via `translateContextKeys` übersetzt — Label-Keys in
  `options.name` erscheinen korrekt lokalisiert.

---

## 6. Priorisierte Empfehlungen

1. ✅ **Hoch:** `'rehearsal'` durch einen gültigen `AssetKind` ersetzen (vermutlich
   `bandhaus_chassis`) — in Offer-Conditions, Repair-Reward und Test-Fallback (1.1).
2. **Hoch:** Die 11 fehlenden `ui:quests.progressSource.*`-Keys in EN+DE ergänzen (1.2).
3. **Hoch:** Retry-Cooldown-Mechanik vereinheitlichen: entweder `canAcceptQuest` lässt
   Cooldowns auch bei `repeatPolicy: 'never'` greifen, oder die Re-Offer-Pfade
   (gigReducer, consequences) prüfen `questCooldowns` explizit; den
   `eventCooldowns`/`questCooldowns`-Mismatch bei `ego_management_retry` auflösen (1.3, 1.4).
4. **Mittel:** `lucky_pick`/`energy_drink` als echte Items anlegen oder Rewards ersetzen (1.5).
5. **Mittel:** Locale-Abdeckungs- und Registry-Konsistenz-Tests ergänzen (Abschnitt 4).
6. **Niedrig:** Flag-Doppelungen konsolidieren, totes `QuestCooldown.id` entfernen oder
   auswerten, `quest_alchemist`-Copy korrigieren, `fame.gained` als eigenen Eventtyp
   einführen.
