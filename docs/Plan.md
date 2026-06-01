# Was genau fehlt?

## 1. Ein stabiler Quest-Event-Vertrag mit Kontext

Aktuell gibt es schon `QuestProgressEvent`, aber die Events sind noch zu dünn. Beispiele aus dem Diff: `followers_gained` enthält nur `amount`, `fame_gained` enthält nur `amount`, `brand_deal_completed` nur `dealId`, `travel_completed` nur `region`. Für echte Andockbarkeit fehlen Kontextdaten wie Plattform, Kategorie, Venue, Region, Asset-ID, Modul-ID, Deal-Typ, Brand-Alignment, Item-ID, Minigame-Score, Erfolg/Misserfolg, Tags usw.

Das führt zu falscher oder zu grober Progression:

| Quest                      | Aktuelles Risiko                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `quest_viral_dance`        | Jeder Follower-Gewinn kann zählen, auch Newsletter/Instagram, obwohl es TikTok/Performance sein sollte. |
| `quest_community_outreach` | Jeder Social-Post zählt, auch Drama/Commercial, obwohl Community/Lifestyle gemeint ist.                 |
| `quest_sponsor_demand`     | Jeder Brand Deal zählt, auch wenn es nicht der aktive Sponsor oder passende Deal-Typ ist.               |
| `quest_venue_residency`    | Gute Gigs können zählen, ohne sicherzustellen, dass sie im gebundenen Venue passieren.                  |
| `quest_local_legend`       | Fame-Gewinn zählt ohne Region-Kontext, obwohl die Quest `perRegion` ist.                                |

## 2. Scope-aware Progress fehlt

`canAcceptQuest` stempelt `scopeKey` für `perVenue` und `perRegion`; `completedQuestScopes` verhindert Wiederannahme im gleichen Scope. Das ist gut. Aber `QuestProgress.applyEvent` muss auch beim Fortschritt prüfen, ob das aktive Event zum Scope der Quest passt. Die Dokumentation beschreibt zwar Scope-Semantik beim Add/Complete, aber im sichtbaren `applyEvent`-Switch wird nur nach `progressSource` gematcht.

Ohne diesen Check ist das System nicht zuverlässig andockbar, weil jedes emittierende System wieder selbst prüfen müsste: “Bin ich im richtigen Venue?” oder “Ist das die richtige Region?” Genau das soll aber nicht passieren.

## 3. `progressSource` ist noch zu eindimensional

`progressSource: 'good_gig'` ist gut für einfache Quests. Aber viele Quests brauchen Bedingungen:

```ts
good_gig + venue.capacity <= 300
good_gig + region === quest.scopeKey
social_post + category === 'Lifestyle'
social_post + platform === 'TikTok'
brand_deal_completed + deal.type === 'Sponsorship'
asset_event + asset.kind === 'tourbus_chassis'
minigame_completed + minigame === 'roadie' + grade >= 'B'
```

Aktuell müssten solche Bedingungen entweder im Producer, im `QuestProgress.applyEvent`-Switch oder in einzelnen Quest-Sonderfällen landen. Besser wäre ein declaratives Matcher-System in der Registry.

## 4. Es fehlt eine zentrale “Quest Offer Engine”

Events wie `quest_trigger_community_outreach`, `quest_trigger_venue_residency`, `quest_trigger_region_takeover` nutzen `canOfferQuest`, aber die eigentlichen Trigger-Bedingungen liegen weiter in einzelnen Event-Conditions. Bei `venue_residency` reicht z. B. `player.currentNodeId.length > 0`; das beweist noch nicht, dass der Node wirklich ein Venue ist. Bei `community_outreach` fehlt ein Social-Schaden-Gate; die Quest kann offenbar angeboten werden, auch wenn Fans gar nicht “vergessen” wurden.

Eine robuste Architektur braucht nicht nur “kann Quest angenommen werden?”, sondern auch “ist diese Quest gerade thematisch und systemisch sinnvoll?”.

## 5. Rewards und Penalties sind noch nicht vollständig als Pipeline gekapselt

Der Patch erweitert Rewards um Fans, Loyalty und Controversy-Reduction. Das ist gut. Aber für ein Backbone braucht es eine einheitliche Reward-/Penalty-Anwendung für alle Systeme:

- Money
- Fame
- Fans/Follower nach Plattform
- Loyalty
- Controversy
- Harmony
- Asset repair/damage
- Venue reputation
- Region reputation
- Brand trust
- Deal pause/cancel
- Temporary modifiers
- Followup events
- Trait unlocks
- Item rewards
- Minigame unlocks

Sonst wird jede neue Quest wieder ein “wenn RewardType X, dann mach Y” im Lifecycle.

## 6. Es fehlt ein Producer-Kontrakt pro System

Der Patch hat erste Emit-Stellen: Gig, Social, Brand Deal, Fame, Harmony. Aber es braucht pro System eine feste Liste: “Dieses System emittiert diese QuestEvents an diesen Stellen.” Die Tests prüfen bereits, dass `progressSource` irgendwo in `src` emittiert wird; das verhindert tote Quellen, aber nicht, dass sie korrekt, vollständig oder mit passendem Kontext emittiert werden.

Beispiel: `money_earned` ist als Source deklariert, aber laut Agent-Hinweis aktuell nicht emittiert und soll nicht genutzt werden, bis es eine Emit-Stelle gibt.

---

# Zielarchitektur: Quest-System als Anschluss-API

Das Ziel sollte sein:

> Ein anderes System muss nur noch ein sauberes Domain-Event emittieren. Das Questsystem entscheidet selbst, welche aktiven Quests passen, ob Scope/Tags/Filter stimmen, wie viel Fortschritt entsteht, ob Completed/Failed/Fallback passiert und welche Rewards/Penalties angewendet werden.

Nicht:

```ts
if (hasActiveQuest(state.activeQuests, 'quest_x')) {
  advanceQuest(...)
}
```

Sondern:

```ts
state = QuestEvents.emit(state, {
  type: 'social.post.resolved',
  amount: followersGained,
  context: {
    platform: 'tiktok',
    category: 'Performance',
    postId: option.id,
    success: finalResult.success
  }
})
```

Die Quest selbst definiert, ob sie darauf reagiert.

---

# Detaillierter Plan

## Phase 1: QuestProgressEvent zum echten Domain-Event ausbauen

Statt einer flachen Union mit wenigen Feldern sollte es einen gemeinsamen Basistyp geben.

```ts
export type QuestEventType =
  | 'gig.completed'
  | 'gig.good'
  | 'gig.smallVenueGood'
  | 'social.postResolved'
  | 'social.followersGained'
  | 'brand.dealCompleted'
  | 'asset.repaired'
  | 'asset.moduleInstalled'
  | 'asset.riskResolved'
  | 'item.collected'
  | 'item.used'
  | 'minigame.completed'
  | 'travel.completed'
  | 'economy.moneyEarned'
  | 'band.harmonyChanged'
  | 'venue.reputationChanged'
  | 'region.reputationChanged'
  | 'story.flagAdded'
```

Dann ein gemeinsames Event-Shape:

```ts
export interface QuestEvent {
  type: QuestEventType
  amount?: number
  success?: boolean
  tags?: string[]

  context?: {
    venueId?: string
    region?: string
    cityId?: string

    platform?: string
    postId?: string
    postCategory?: string

    dealId?: string
    dealType?: string
    brandId?: string
    brandAlignment?: string

    assetId?: string
    assetKind?: string
    moduleId?: string
    slotType?: string

    itemId?: string
    minigameId?: string
    score?: number
    grade?: string

    memberId?: string
    traitId?: string
    flag?: string
  }
}
```

Damit bekommt jede Quest genug Kontext, ohne dass der Producer Quest-IDs kennen muss.

**Ergebnis:** Social, Assets, Venues, Deals, Minigames und Story können dieselbe API verwenden.

---

## Phase 2: Registry von `progressSource` auf `progressRule` erweitern

`progressSource` sollte erhalten bleiben für einfache Quests, aber intern durch eine mächtigere Regel ergänzt werden.

```ts
type QuestProgressRule = {
  event: QuestEventType
  amount?: 'fixed' | 'event.amount' | 'event.score' | 'threshold'
  fixedAmount?: number
  thresholdField?: 'band.harmony' | 'social.loyalty' | 'asset.condition'

  match?: {
    scope?: 'venue' | 'region' | 'none'
    platform?: string | string[]
    postCategory?: string | string[]
    dealType?: string | string[]
    brandAlignment?: string | string[]
    assetKind?: string | string[]
    minigameId?: string | string[]
    itemId?: string | string[]
    tags?: string[]
    minScore?: number
    success?: boolean
  }
}
```

Beispiele:

```ts
quest_viral_dance: {
  progressRule: {
    event: 'social.followersGained',
    amount: 'event.amount',
    match: {
      platform: 'tiktok',
      postCategory: ['Performance', 'Drama']
    }
  }
}
```

```ts
quest_community_outreach: {
  progressRule: {
    event: 'social.postResolved',
    amount: 'fixed',
    fixedAmount: 1,
    match: {
      postCategory: ['Lifestyle', 'Community'],
      success: true
    }
  }
}
```

```ts
quest_venue_residency: {
  repeatPolicy: 'perVenue',
  progressRule: {
    event: 'gig.good',
    amount: 'fixed',
    fixedAmount: 1,
    match: {
      scope: 'venue'
    }
  }
}
```

```ts
quest_local_legend: {
  repeatPolicy: 'perRegion',
  progressRule: {
    event: 'gig.fameGained',
    amount: 'event.amount',
    match: {
      scope: 'region'
    }
  }
}
```

**Ergebnis:** Keine Quest-spezifischen `switch`-Sonderfälle für Plattform, Venue, Region, Deal-Typ oder Asset-Kind.

---

## Phase 3: Scope-Matching direkt in `QuestProgress.applyEvent`

Das Questsystem muss selbst prüfen, ob eine aktive Quest zum Event-Kontext passt.

```ts
function questMatchesScope(
  quest: QuestState,
  rule: QuestProgressRule,
  event: QuestEvent
): boolean {
  if (!rule.match?.scope || rule.match.scope === 'none') return true
  if (!quest.scopeKey) return true

  if (rule.match.scope === 'venue') {
    return event.context?.venueId === quest.scopeKey
  }

  if (rule.match.scope === 'region') {
    return event.context?.region === quest.scopeKey
  }

  return true
}
```

Das muss vor jeder Progress-Anwendung passieren.

**Wichtig:** Producer wie Gig oder Travel dürfen Kontext mitschicken, aber sie entscheiden nicht mehr, ob eine Quest damit fortschreiten darf. Das entscheidet die Quest-Regel.

---

## Phase 4: Generische Matcher-Funktion einführen

`QuestProgress.applyEvent` sollte nicht immer größer werden. Stattdessen:

```ts
function questRuleMatchesEvent(
  quest: QuestState,
  rule: QuestProgressRule,
  event: QuestEvent
): boolean
```

Diese Funktion prüft:

- Event-Typ passt.
- Scope passt.
- Tags passen.
- Plattform passt.
- Kategorie passt.
- Deal-Typ passt.
- Asset-Kind passt.
- Item passt.
- Minigame passt.
- Score/Success passt.
- Custom Guard passt, falls nötig.

Dann:

```ts
for (const quest of state.activeQuests) {
  const definition = getQuestDefinition(quest.id)
  const rules = normalizeProgressRules(definition)

  for (const rule of rules) {
    if (!questRuleMatchesEvent(quest, rule, event)) continue

    const amount = calculateProgressAmount(rule, event)
    nextState = applyQuestProgress(nextState, quest, rule, amount, event)
  }
}
```

**Ergebnis:** Neue Systeme erweitern nur `QuestEventType` und emittieren Events. Neue Quests erweitern nur Registry-Daten.

---

## Phase 5: Mehrere Progress-Regeln pro Quest erlauben

Viele Quests sollten mehr als einen Fortschrittspfad haben.

Beispiele:

`quest_harmony_project`:

- Harmonie steigt direkt.
- Relationship-Event erfolgreich.
- Lifestyle-Post mit positiver Stimmung.

```ts
progressRules: [
  {
    event: 'band.harmonyChanged',
    amount: 'threshold',
    thresholdField: 'band.harmony'
  },
  {
    event: 'relationship.repaired',
    amount: 'fixed',
    fixedAmount: 10
  },
  {
    event: 'social.postResolved',
    amount: 'fixed',
    fixedAmount: 5,
    match: { postCategory: 'Lifestyle', success: true }
  }
]
```

`quest_sponsor_demand`:

```ts
progressRules: [
  {
    event: 'brand.dealCompleted',
    amount: 'fixed',
    fixedAmount: 1,
    match: { dealType: ['Sponsorship', 'Endorsement'] }
  },
  {
    event: 'social.postResolved',
    amount: 'fixed',
    fixedAmount: 1,
    match: { postCategory: 'Commercial', success: true }
  }
]
```

**Ergebnis:** Quests werden flexibler, ohne dass Reducer Spezialfälle bekommen.

---

## Phase 6: Producer-Adapter pro System bauen

Jedes System bekommt eine kleine Adapter-Datei. Diese Adapter sind die einzigen Stellen, die Systemsprache in QuestEvents übersetzen.

### Social

`src/quests/producers/socialQuestEvents.ts`

```ts
export function emitSocialPostResolved(state, option, result) {
  state = QuestEvents.emit(state, {
    type: 'social.postResolved',
    amount: 1,
    success: result.success,
    tags: [option.category, option.platform],
    context: {
      platform: option.platform,
      postId: option.id,
      postCategory: option.category
    }
  })

  if (result.followers > 0) {
    state = QuestEvents.emit(state, {
      type: 'social.followersGained',
      amount: result.followers,
      success: true,
      context: {
        platform: option.platform,
        postId: option.id,
        postCategory: option.category
      }
    })
  }

  return state
}
```

### Gig/Venue

`src/quests/producers/gigQuestEvents.ts`

```ts
export function emitGigResolved(state, gig, stats, financials) {
  state = QuestEvents.emit(state, {
    type: 'gig.completed',
    amount: 1,
    success: stats.score >= 0,
    context: {
      venueId: gig.id,
      region: state.player.location,
      score: stats.score
    }
  })

  if (stats.score >= 60) {
    state = QuestEvents.emit(state, {
      type: 'gig.good',
      amount: 1,
      success: true,
      context: {
        venueId: gig.id,
        region: state.player.location,
        score: stats.score
      }
    })
  }

  if (stats.score >= 60 && gig.capacity <= 300) {
    state = QuestEvents.emit(state, {
      type: 'gig.smallVenueGood',
      amount: 1,
      success: true,
      context: {
        venueId: gig.id,
        region: state.player.location,
        score: stats.score
      }
    })
  }

  return state
}
```

### Brand Deals

`src/quests/producers/brandQuestEvents.ts`

```ts
export function emitBrandDealCompleted(state, deal) {
  return QuestEvents.emit(state, {
    type: 'brand.dealCompleted',
    amount: 1,
    success: true,
    context: {
      dealId: deal.id,
      dealType: deal.type,
      brandId: deal.brandId,
      brandAlignment: deal.alignment
    }
  })
}
```

### Assets

`src/quests/producers/assetQuestEvents.ts`

```ts
export function emitAssetRepaired(state, asset, amount) {
  return QuestEvents.emit(state, {
    type: 'asset.repaired',
    amount,
    success: true,
    context: {
      assetId: asset.id,
      assetKind: asset.kind
    }
  })
}
```

### Minigames

`src/quests/producers/minigameQuestEvents.ts`

```ts
export function emitMinigameCompleted(state, minigameId, result) {
  return QuestEvents.emit(state, {
    type: 'minigame.completed',
    amount: 1,
    success: result.success,
    context: {
      minigameId,
      score: result.score,
      grade: result.grade
    }
  })
}
```

**Ergebnis:** Andere Systeme importieren nur ihren Producer, nicht `QuestLifecycle`, nicht `hasActiveQuest`, nicht einzelne Quest-IDs.

---

## Phase 7: `QuestEvents.emit` als einzige öffentliche Fortschritts-API

Aktuell gibt es `createApplyQuestEventAction` und `QuestProgress.applyEvent`. Das sollte in eine klare Fassade verpackt werden.

```ts
export const QuestEvents = {
  emit(state: GameState, event: QuestEvent): GameState {
    const sanitized = sanitizeQuestEvent(event)
    return QuestProgress.applyEvent(state, sanitized)
  }
}
```

Für React/Hooks:

```ts
applyQuestEvent(createSocialPostResolvedQuestEvent(option, result))
```

Für Reducer:

```ts
nextState = QuestEvents.emit(nextState, createGigCompletedQuestEvent(...))
```

**Regel:** Direktes `advanceQuest` bleibt nur für Debug/Admin/Test oder sehr alte Legacy-Pfade erlaubt. Produktionssysteme nutzen `QuestEvents.emit`.

---

## Phase 8: Quest-Angebote aus Registry ableiten

Neben Fortschritt braucht auch das Starten von Quests weniger Sonderlogik.

Aktuell sind Offer-Events echte Eventdefinitionen mit eigenen Conditions. Das kann bleiben, aber die Startbedingungen sollten aus der Registry kommen:

```ts
offer: {
  trigger: 'random',
  category: 'band',
  chance: 0.08,
  condition: {
    noActiveQuest: true,
    social: { loyaltyBelow: 35 },
    controversyAbove: 20
  }
}
```

Oder:

```ts
quest_venue_residency: {
  offer: {
    trigger: 'post_gig',
    chance: 0.06,
    condition: {
      currentNodeType: 'VENUE',
      minGigScore: 60,
      notBlacklisted: true
    }
  }
}
```

Dann erzeugt eine zentrale `QuestOfferEngine` die Offer-Events:

```ts
QuestOfferEngine.getAvailableOffers(state, trigger)
```

Diese Engine prüft:

- `canAcceptQuest`
- activeQuest-Limit
- Cooldown
- Scope
- Startbedingungen
- Story-Flags
- benötigtes Asset
- benötigter Deal
- benötigte Social-Lage
- benötigter Venue-Typ

**Ergebnis:** Neue Quest hinzufügen = Registry-Eintrag + i18n. Kein neues Event mit eigener Condition nötig, außer für komplett besondere Story-Momente.

---

## Phase 9: Active-Quest-Limits und Quest-Slots modellieren

Aktuell blockieren viele Quest-Events über “keine aktive Quest”. Das ist einfach, aber langfristig zu grob. Besser:

```ts
questSlots: {
  story: 1,
  side: 2,
  repeatable: 2,
  crisis: 1
}
```

Dann kann eine Story-Quest parallel zu einer Social-Challenge laufen, ohne dass alles blockiert.

```ts
canAcceptQuest(state, questId) {
  // nicht nur duplicate/cooldown/scope,
  // sondern auch Slot-Policy prüfen
}
```

**Empfehlung:**

| Quest-Kind      |             Limit |
| --------------- | ----------------: |
| Story           |                 1 |
| Crisis-Recovery |                 1 |
| Side            |                 2 |
| Repeatable      |                 2 |
| Tutorial        | 1, nur Early Game |

**Ergebnis:** Mehr Content wird sichtbar, aber ohne Spam.

---

## Phase 10: Reward-/Penalty-Pipeline generalisieren

Statt RewardTypes im Lifecycle immer weiter zu verzweigen:

```ts
type QuestReward =
  | { type: 'money'; amount: number }
  | { type: 'fame'; amount: number }
  | { type: 'social.followers'; platform?: string; amount: number }
  | { type: 'social.loyalty'; amount: number }
  | { type: 'social.controversy'; amount: number }
  | { type: 'band.harmony'; amount: number }
  | { type: 'asset.repair'; assetKind?: string; amount: number }
  | { type: 'venue.reputation'; amount: number; scope?: 'current' | string }
  | { type: 'region.reputation'; amount: number; scope?: 'current' | string }
  | { type: 'item.add'; itemId: string; amount?: number }
  | { type: 'trait.unlock'; traitId: string }
  | { type: 'flag.add'; flag: string }
  | { type: 'event.queue'; eventId: string }
```

Dann:

```ts
QuestRewardApplier.apply(state, quest, reward)
QuestPenaltyApplier.apply(state, quest, penalty)
```

Eine Quest kann mehrere Rewards haben:

```ts
rewards: [
  { type: 'money', amount: 500 },
  { type: 'brand.trust', amount: 10 },
  { type: 'social.loyalty', amount: 5 }
]
```

Und Failure:

```ts
failurePenalties: [
  { type: 'social.loyalty', amount: -10 },
  { type: 'social.controversy', amount: 5 },
  { type: 'quest.cooldown', days: 15 },
  { type: 'event.queue', eventId: 'sponsor_disappointed_followup' }
]
```

**Ergebnis:** Neue Reward-/Penalty-Typen werden einmal in Appliern implementiert, nicht pro Quest.

---

## Phase 11: Systeme konkret andocken

## Social Media

Aktuell werden `social_post` und `followers_gained` emittiert. Das ist gut, aber zu grob. Social braucht diese Events:

| Event                       | Kontext                             |
| --------------------------- | ----------------------------------- |
| `social.postResolved`       | platform, postId, category, success |
| `social.followersGained`    | platform, category, amount          |
| `social.loyaltyChanged`     | amount, reason                      |
| `social.controversyChanged` | amount, reason                      |
| `social.trendMatched`       | trendId, platform/category          |

Dann können Quests sauber sein:

- TikTok-Quest zählt nur TikTok.
- Community-Outreach zählt nur Lifestyle/Community.
- Sponsor-Demand zählt Commercial.
- Drama-Post zählt Drama, erhöht aber Risiko.

## Brand Deals

Brand Deals brauchen Events mit Typ und Alignment:

| Event                 | Kontext                 |
| --------------------- | ----------------------- |
| `brand.offerAccepted` | dealId, type, alignment |
| `brand.dealCompleted` | dealId, type, alignment |
| `brand.dealFailed`    | dealId, reason          |
| `brand.trustChanged`  | brandId, amount         |

Dann werden möglich:

- Sponsorship-Aufträge
- Endorsement-Aufträge
- Record-Deal-Ketten
- Corporate-vs-Indie-Konflikte

## Venues/Regions

Venues brauchen Kontext:

| Event                      | Kontext                   |
| -------------------------- | ------------------------- |
| `venue.gigCompleted`       | venueId, region, score    |
| `venue.goodGig`            | venueId, region, capacity |
| `venue.reputationChanged`  | venueId, amount           |
| `region.reputationChanged` | region, amount            |
| `venue.blacklisted`        | venueId, reason           |
| `venue.unblacklisted`      | venueId, reason           |

Damit funktionieren `perVenue` und `perRegion` zuverlässig.

## Assets

Assets brauchen eigene QuestEvents:

| Event                    | Kontext                                |
| ------------------------ | -------------------------------------- |
| `asset.acquired`         | assetId, assetKind, flavor, tier       |
| `asset.repaired`         | assetId, assetKind, amount             |
| `asset.moduleInstalled`  | assetId, assetKind, moduleId, slotType |
| `asset.riskTriggered`    | riskType, assetKind                    |
| `asset.riskResolved`     | riskType, assetKind, success           |
| `asset.conditionChanged` | assetId, amount, condition             |

Dann können Tourbus-/Studio-/Bandhaus-/Workshop-Quests ohne eigene Reducerlogik laufen.

## Minigames

Minigames sollten alle dasselbe Event liefern:

| Event                | Kontext                           |
| -------------------- | --------------------------------- |
| `minigame.completed` | minigameId, success, score, grade |
| `minigame.perfect`   | minigameId                        |
| `minigame.failed`    | minigameId, damage                |

Dann kann eine Quest sagen:

```ts
match: { minigameId: 'roadie', success: true }
```

## Items/Inventory

Items brauchen:

| Event            | Kontext          |
| ---------------- | ---------------- |
| `item.collected` | itemId           |
| `item.used`      | itemId           |
| `item.crafted`   | itemId, recipeId |
| `item.delivered` | itemId, amount   |

Damit werden Delivery-, Contraband-, Gear- und Sponsor-Quests möglich.

---

## Phase 12: `QuestState` von Runtime und Definition trennen

Aktuell wird `QuestState` für Definition und Runtime benutzt. Das funktioniert, aber wird unübersichtlich.

Besser:

```ts
export interface QuestDefinition {
  id: string
  kind: QuestKind
  repeatPolicy: QuestRepeatPolicy
  offer?: QuestOfferDefinition
  progressRules: QuestProgressRule[]
  rewards: QuestReward[]
  failurePenalties: QuestPenalty[]
  deadlineOffset?: number
  required?: number
  startFlags?: string[]
  completionFlags?: string[]
  failureFlags?: string[]
  followupQuestId?: string
}
```

```ts
export interface ActiveQuestState {
  id: string
  progress: number
  required: number
  deadline?: number
  scopeKey?: string
  status: 'active'
  startedOnDay: number
}
```

Die Registry enthält nur Definitionen. Der Save-State enthält nur Runtime.

**Vorteil:** Savegames werden kleiner, alte aktive Quests können aus neuer Registry migriert werden, und Quest-Definitionen driften nicht in Runtime-Objekten.

---

## Phase 13: Migration und Save-Kompatibilität

Wenn aktive Quests künftig nur noch Runtime-Felder speichern, braucht Load eine Migration:

```ts
sanitizeActiveQuests(saved) {
  return saved.map(q => {
    const def = getQuestDefinition(q.id)
    if (!def) return q // legacy/ad-hoc fallback
    return {
      id: q.id,
      progress: finiteNumberOr(q.progress, 0),
      required: q.required ?? def.required,
      deadline: q.deadline,
      scopeKey: q.scopeKey,
      status: 'active',
      startedOnDay: q.startedOnDay ?? 0
    }
  })
}
```

**Wichtig:** Keine vorhandenen Quests entfernen. Legacy-Quests bleiben ladbar, aber neue Registry-Quests laufen über Definition + Runtime.

---

## Phase 14: Tests als Anschluss-Garantie erweitern

Die bestehenden Content-Gates sind ein guter Anfang. Sie prüfen bereits, ob `progressSource` behandelt und irgendwo emittiert wird, ob Repeatables Guardrails haben und ob Failures nicht lethal sind.

Ergänzen würde ich diese Tests:

### 1. Scope-Progress-Test

```ts
it('does not progress perVenue quests from another venue')
it('does not progress perRegion quests from another region')
```

### 2. Matcher-Test

```ts
it('matches social post category/platform filters')
it('does not match wrong brand deal type')
it('matches asset kind filters')
```

### 3. Producer-Test pro System

```ts
it('social producer emits platform/category/followers context')
it('gig producer emits venue/region/capacity context')
it('brand producer emits deal type/alignment context')
it('asset producer emits asset kind/module context')
```

### 4. No-direct-advance Production Gate

Test oder Lint-Regel:

```ts
advanceQuest(
```

darf außerhalb von `QuestLifecycle`, Tests und Legacy-Migration nicht direkt in Gameplay-Code vorkommen.

### 5. Registry-Definition-Gate

Jede neue Quest muss haben:

- `kind`
- `repeatPolicy`
- `offer` oder Story-Startpfad
- `progressRules`
- `rewards` oder `completionFlags`
- `failurePenalties`
- non-lethal failure
- i18n title/description
- wenn `perVenue/perRegion`: Scope-Match-Regel

### 6. Event-emission-Gate

Jeder `QuestEventType`, der in Registry-Regeln verwendet wird, muss mindestens einen Producer-Test haben.

---

# Konkrete Umsetzungspakete

## Paket A: Scope und Event-Kontext fixen

**Ziel:** Keine falsche Fortschrittszählung bei Venue/Region/Social/Deals.

Änderungen:

- `QuestProgressEvent` um Kontext erweitern.
- `fame_gained` bekommt `region`.
- `followers_gained` bekommt `platform`, `postCategory`.
- `brand_deal_completed` bekommt `dealType`, `brandAlignment`.
- `QuestProgress.applyEvent` prüft `scopeKey` gegen Event-Kontext.
- Tests für `perVenue`, `perRegion`, falschen Scope.

**Priorität:** Sehr hoch.

---

## Paket B: ProgressRules statt nur ProgressSource

**Ziel:** Keine wachsenden Switch-Sonderfälle.

Änderungen:

- `QuestDefinition.progressRules` einführen.
- Alte `progressSource` temporär als Legacy-Fallback behalten.
- `questRuleMatchesEvent` implementieren.
- `calculateProgressAmount` implementieren.
- Bestehende Quests Schritt für Schritt auf `progressRules` migrieren.

**Priorität:** Hoch.

---

## Paket C: Producer-Adapter bauen

**Ziel:** Andere Systeme haben eine klare Andockstelle.

Dateien:

- `src/quests/producers/gigQuestEvents.ts`
- `src/quests/producers/socialQuestEvents.ts`
- `src/quests/producers/brandQuestEvents.ts`
- `src/quests/producers/assetQuestEvents.ts`
- `src/quests/producers/minigameQuestEvents.ts`
- `src/quests/producers/itemQuestEvents.ts`
- `src/quests/producers/storyQuestEvents.ts`

Jeder Producer hat Tests.

**Priorität:** Hoch.

---

## Paket D: QuestOfferEngine

**Ziel:** Quest-Angebote nicht mehr als verstreute Sonder-Conditions.

Änderungen:

- `offer`-Definition in Registry.
- `QuestOfferEngine.getAvailableOffers(state, trigger)`.
- `QUEST_EVENTS` kann generisch aus Registry-Angeboten erzeugt werden oder nutzt nur noch kleine Wrapper.
- `canOfferQuest` bleibt, wird aber Teil der Engine.

**Priorität:** Mittel bis hoch.

---

## Paket E: Reward-/Penalty-Applier

**Ziel:** Neue Questfolgen ohne Lifecycle-Switch aufblasen.

Änderungen:

- `QuestReward` und `QuestPenalty` Union.
- `QuestRewardApplier.apply`.
- `QuestPenaltyApplier.apply`.
- Alte Felder `rewardType`, `rewardData`, `moneyReward`, `failurePenalty` als Legacy-Fallback behalten.
- Neue Quests nutzen nur noch `rewards`/`failurePenalties`.

**Priorität:** Mittel.

---

## Paket F: Runtime-State von Definition trennen

**Ziel:** Saubere Savegames und weniger Drift.

Änderungen:

- `QuestDefinition` und `ActiveQuestState` trennen.
- `activeQuests` speichert nur Runtime.
- UI liest Definition via `getQuestDefinition(active.id)`.
- Migration für alte aktive Quest-Objekte.

**Priorität:** Mittel, aber wichtig vor großem Content-Ausbau.

---

## Paket G: Anschluss-Gates und Dokumentation

**Ziel:** Andere Entwickler bauen korrekt an.

Änderungen:

- `src/quests/AGENTS.md` oder Ausbau in `src/data/AGENTS.md`.
- Checkliste: “Wie docke ich ein System an Quests an?”
- Tests für Direct-Advance-Verbot.
- Tests für Producer-Kontext.
- Tests für Scope-Matching.
- Tests für OfferEngine.

**Priorität:** Hoch, weil es Regressionen verhindert.

---

# Zielbild für die anderen Systeme

## Social Media

Soll nur noch sagen:

```ts
emitSocialPostResolved(state, option, result)
```

Nicht mehr:

```ts
if quest_viral_dance then advance
if quest_community_outreach then advance
```

## Assets

Soll nur noch sagen:

```ts
emitAssetModuleInstalled(state, asset, module)
emitAssetRepaired(state, asset, amount)
emitAssetRiskResolved(state, risk, result)
```

Nicht mehr:

```ts
if quest_tourbus_inspection and asset.kind === ...
```

## Venues

Soll nur noch sagen:

```ts
emitGigResolved(state, currentGig, stats, financials)
```

Das Questsystem entscheidet, ob `venue_residency`, `region_takeover`, `local_legend`, `apology_tour` oder `prove_yourself` zählen.

## Brand Deals

Soll nur noch sagen:

```ts
emitBrandDealCompleted(state, deal)
```

Das Questsystem entscheidet, ob Sponsor Demand, Premium Endorsement oder Record-Deal-Material zählt.

## Story-Arcs

Sollen nur noch Flags/Events emittieren:

```ts
emitStoryFlagAdded(state, 'cancel_quest_active')
```

Die QuestOfferEngine oder StoryQuestEngine startet daraus passende Quests, sofern `canAcceptQuest` und Story-Regeln passen.

---

# Konkrete Definition für “fertig”

Das Questsystem ist erst dann ein stabiler Backbone, wenn folgende Regeln gelten:

1. Kein Gameplay-Code außerhalb der Quest-Schicht ruft `advanceQuest` für konkrete Quest-IDs auf.
2. Neue Systeme docken über `QuestEvents.emit` oder Producer-Adapter an.
3. Neue Quests werden primär in `QUEST_REGISTRY` definiert.
4. Progress-Regeln können Kontext filtern: Venue, Region, Plattform, Kategorie, Deal-Typ, Asset-Kind, Item, Minigame, Tags.
5. Scope wird beim Fortschritt geprüft, nicht nur beim Annehmen/Abschließen.
6. Quest-Angebote laufen über eine zentrale OfferEngine.
7. Rewards/Penalties laufen über generische Applier.
8. Tests verhindern tote ProgressSources, fehlende Emitter, falsche Scope-Fortschritte, direkte Quest-ID-Sonderlogik und lethal Failures.
9. UI liest Definitionen aus Registry und Runtime aus ActiveQuestState.
10. Save/Load bleibt stabil und migriert alte Quest-Objekte.

---

# Empfohlene Reihenfolge

1. **Scope-aware Progress fixen.** Das ist der dringendste Korrekturschritt.
2. **QuestEvent-Kontext erweitern.** Ohne Kontext bleiben Social/Deals/Venues zu grob.
3. **ProgressRules einführen.** Damit verschwinden Sonderfälle aus `QuestProgress.applyEvent`.
4. **Producer-Adapter für Social, Gig, Brand, Asset, Minigames bauen.**
5. **Direktes `advanceQuest` außerhalb der Quest-Schicht verbieten.**
6. **OfferEngine bauen.**
7. **Reward-/Penalty-Applier auslagern.**
8. **QuestDefinition und ActiveQuestState trennen.**
9. **Content-Gates erweitern.**

Kurz gesagt: Der Patch hat jetzt ein gutes Fundament. Was noch fehlt, ist die **Übersetzungsschicht zwischen Spielsystemen und Questregeln**. Sobald jedes System nur noch Domain-Events emittiert und die Registry über Match-Regeln entscheidet, können Social, Assets, Venues, Brand Deals und Story-Arcs zuverlässig an Quests andocken, ohne jedes Mal neue Sonderlogik zu schreiben.
