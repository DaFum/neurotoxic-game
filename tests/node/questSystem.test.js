import { describe, it } from 'node:test'
import assert from 'node:assert'
import { QUEST_REGISTRY } from '../../src/data/questRegistry.ts'
import { QUEST_EVENTS } from '../../src/data/events/quests.ts'
import { QuestLifecycle } from '../../src/domain/questLifecycle.ts'
import { QuestProgress } from '../../src/utils/questProgress.ts'
const getBaseState = () => ({
  player: { day: 1, location: 'test_city' },
  activeQuests: [],
  activeStoryFlags: [],
  eventCooldowns: []
})

const LEGACY_EVENT_BY_CANONICAL = {
  'gig.completed': 'gig_completed',
  'gig.good': 'good_gig',
  'gig.smallVenueGood': 'small_venue_good_gig',
  'social.postResolved': 'social_post',
  'social.followersGained': 'followers_gained',
  'region.reputationChanged': 'fame_gained',
  'economy.moneyEarned': 'money_earned',
  'band.harmonyChanged': 'harmony_recovered',
  'item.collected': 'item_collected',
  'brand.dealCompleted': 'brand_deal_completed',
  'travel.completed': 'travel_completed'
}

const firstMatchValue = value => (Array.isArray(value) ? value[0] : value)

const makeProgressEvent = (source, rule) => {
  const eventSource = LEGACY_EVENT_BY_CANONICAL[source] ?? source
  const match = rule?.match ?? {}
  const commonGigPayload = {
    score: 80,
    capacity: 100,
    venueId: 'test_venue',
    region: 'test_region'
  }

  switch (eventSource) {
    case 'gig_completed':
    case 'good_gig':
    case 'small_venue_good_gig':
      return { type: eventSource, ...commonGigPayload }
    case 'social_post':
      return {
        type: eventSource,
        postType: 'instagram',
        followersGain: 1,
        platform: 'instagram',
        category: 'Lifestyle',
        success: true
      }
    case 'followers_gained':
      return {
        type: eventSource,
        amount: 100,
        platform: firstMatchValue(match.platform) ?? 'tiktok',
        category: firstMatchValue(match.postCategory) ?? 'Drama'
      }
    case 'fame_gained':
      return { type: eventSource, amount: 100, region: 'test_region' }
    case 'money_earned':
      return { type: eventSource, amount: 100 }
    case 'harmony_recovered':
      return { type: eventSource, amount: 5, newHarmony: 80 }
    case 'item_collected':
      return { type: eventSource, itemId: 'test_item' }
    case 'brand_deal_completed':
      return {
        type: eventSource,
        dealId: 'test_deal',
        dealType: firstMatchValue(match.dealType) ?? 'SPONSORSHIP',
        brandAlignment: firstMatchValue(match.brandAlignment) ?? 'INDIE'
      }
    case 'travel_completed':
      return { type: eventSource, region: 'test_region' }
    case 'minigame.perfect':
      return {
        type: eventSource,
        minigameId: firstMatchValue(match.minigameId) ?? 'tourbus'
      }
    case 'item.delivered':
      return {
        type: eventSource,
        amount: 10,
        itemId: firstMatchValue(match.itemId) ?? 'contraband'
      }
    case 'item.crafted':
      return {
        type: eventSource,
        amount: 1,
        itemId: firstMatchValue(match.itemId) ?? 'test_item',
        recipeId: firstMatchValue(match.recipeId) ?? 'test_recipe'
      }
    case 'venue.blacklisted':
      return { type: eventSource, venueId: 'test_venue' }
    case 'venue.unblacklisted':
      return { type: eventSource, venueId: 'test_venue' }
    case 'venue.reputationChanged':
      return {
        type: eventSource,
        amount: 10,
        venueId: 'test_venue',
        region: 'test_region'
      }
    case 'asset.riskTriggered':
      return {
        type: eventSource,
        assetId: 'test_asset',
        assetKind: firstMatchValue(match.assetKind) ?? 'rehearsal',
        riskType: firstMatchValue(match.riskType) ?? 'fire'
      }
    case 'asset.riskResolved':
      return {
        type: eventSource,
        assetId: 'test_asset',
        assetKind: firstMatchValue(match.assetKind) ?? 'rehearsal',
        riskType: firstMatchValue(match.riskType) ?? 'fire',
        success: true
      }
    case 'brand.dealFailed':
      return {
        type: eventSource,
        dealId: 'test_deal',
        brandId: firstMatchValue(match.brandId) ?? 'test_brand'
      }
    case 'brand.trustChanged':
      return {
        type: eventSource,
        amount: 10,
        brandId: firstMatchValue(match.brandId) ?? 'test_brand'
      }
    case 'story.flagAdded':
      return { type: eventSource, flag: 'test_flag' }
    default:
      throw new Error(`No minimal event payload for ${source}`)
  }
}

describe('Quest System Registry Validation', () => {
  // progressSource stays as the legacy compatibility bridge while progressRules
  // is the declarative matching contract. Keep both gates until the legacy
  // progressSource fallback is removed.
  it('should ensure quests with required > 0 have a progressSource', () => {
    for (const [_id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.required && quest.required > 0) {
        assert.ok(
          quest.progressSource,
          `Quest ${_id} requires progress but has no progressSource`
        )
      }
    }
  })

  it('should ensure quests with required > 0 have declarative progressRules', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.required && quest.required > 0) {
        assert.ok(
          Array.isArray(quest.progressRules) && quest.progressRules.length > 0,
          `Quest ${id} requires progress but has no progressRules`
        )
      }
    }
  })

  it('should ensure no quest uses game_over failure penalty', () => {
    for (const [_id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.failurePenalty) {
        assert.notStrictEqual(
          quest.failurePenalty.type,
          'game_over',
          `Quest ${_id} uses game_over failure penalty`
        )
      }
    }
  })

  it('should ensure every quest declares kind and repeatPolicy', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      assert.ok(quest.kind, `Quest ${id} is missing kind`)
      assert.ok(quest.repeatPolicy, `Quest ${id} is missing repeatPolicy`)
    }
  })

  it('should ensure cooldown-policy quests define cooldownDays > 0', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy === 'cooldown') {
        assert.ok(
          typeof quest.cooldownDays === 'number' && quest.cooldownDays > 0,
          `Quest ${id} uses repeatPolicy 'cooldown' but has no positive cooldownDays`
        )
      }
    }
  })

  it('should ensure quests do not declare money rewards twice', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      const hasLegacyMoneyReward = Object.hasOwn(quest, 'moneyReward')
      const hasStructuredMoneyReward =
        Array.isArray(quest.rewards) &&
        quest.rewards.some(reward => reward?.type === 'money')
      assert.ok(
        !(hasLegacyMoneyReward && hasStructuredMoneyReward),
        `Quest ${id} declares both moneyReward and a structured money reward`
      )
    }
  })

  // Content gates (phase-20 plan). Lock invariants so newly added quests
  // cannot reintroduce regressions like game-over penalties or unprogressable
  // accumulation quests.

  it('content gate: every quest progressRule event is emitted by gameplay code', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    // Walk src/ and split into two corpora:
    //  - producerText: src/quests/producers/* — small factories that take the
    //    event type as a parameter, so a bare string literal there is a real
    //    emit site even without a literal `type: '<src>'` payload object.
    //  - emitText: everything else — only the strict `type: '<src>'` shape
    //    counts (skips the questProgress / questRegistry definition files
    //    whose type unions/switches would otherwise satisfy a loose match).
    const files = []
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
      }
    }
    walk('src')
    const isProducer = f => /(^|[\\/])src[\\/]quests[\\/]producers[\\/]/.test(f)
    const producerText = files
      .filter(isProducer)
      .map(f => fs.readFileSync(f, 'utf8'))
      .join('\n')
    const emitText = files
      .filter(
        f =>
          !isProducer(f) &&
          !f.endsWith('questProgress.ts') &&
          !f.endsWith('questRegistry.ts')
      )
      .map(f => fs.readFileSync(f, 'utf8'))
      .join('\n')

    const usedEvents = new Set(
      Object.values(QUEST_REGISTRY).flatMap(q =>
        Array.isArray(q.progressRules)
          ? q.progressRules.map(rule => rule.event)
          : []
      )
    )
    for (const source of usedEvents) {
      const eventLiteral = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const producerEmission = new RegExp(
        `(?:type:\\s*'${eventLiteral}'|createGigEvent\\('${eventLiteral}')`
      )
      assert.ok(
        producerEmission.test(producerText) ||
          new RegExp(`type:\\s*'${eventLiteral}'`).test(emitText),
        `progressRule event '${source}' is used by a quest but is never emitted by gameplay/producers in src/ — the quest can never progress`
      )
    }
  })

  it('content gate: every progressRule event is handled at runtime', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (!Array.isArray(quest.progressRules)) continue
      for (const rule of quest.progressRules) {
        const source = rule?.event
        assert.ok(source, `${id} has progressRules without an event`)
        const scopeKey =
          quest.repeatPolicy === 'perVenue'
            ? 'test_venue'
            : quest.repeatPolicy === 'perRegion'
              ? 'test_region'
              : undefined
        const state = {
          ...getBaseState(),
          activeQuests: [
            {
              ...quest,
              id,
              progress: 0,
              required: 999999,
              ...(scopeKey ? { scopeKey } : {})
            }
          ]
        }

        const next = QuestProgress.applyEvent(
          state,
          makeProgressEvent(source, rule)
        )
        const nextQuest = next.activeQuests.find(q => q.id === id)
        assert.ok(nextQuest, `${id} should remain active after test event`)
        assert.ok(
          nextQuest.progress > 0,
          `progressRule '${source}' did not advance ${id} through QuestProgress.applyEvent`
        )
      }
    }
  })

  it('content gate: scoped progressRules declare scope matching', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (
        quest.repeatPolicy !== 'perVenue' &&
        quest.repeatPolicy !== 'perRegion'
      )
        continue
      const requiredScope =
        quest.repeatPolicy === 'perVenue' ? 'venue' : 'region'
      const rules = quest.progressRules ?? []
      assert.ok(
        rules.some(rule => rule.match?.scope === requiredScope),
        `Quest ${id} has repeatPolicy '${quest.repeatPolicy}' but no progressRule with scope '${requiredScope}'`
      )
    }
  })

  it('content gate: repeatable quests must declare a cooldown or scope policy', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy && quest.repeatPolicy !== 'never') {
        const hasGuard =
          quest.repeatPolicy === 'cooldown'
            ? typeof quest.cooldownDays === 'number' && quest.cooldownDays > 0
            : ['perVenue', 'perRegion'].includes(quest.repeatPolicy)
        assert.ok(
          hasGuard,
          `Quest ${id} has repeatPolicy '${quest.repeatPolicy}' but no cooldown/scope guard`
        )
      }
    }
  })

  it('content gate: quest trigger events mirror registry offer metadata', () => {
    for (const event of QUEST_EVENTS) {
      const questId = event.options
        ?.map(option => option?.effect?.quest?.id)
        .find(id => typeof id === 'string')
      if (!questId) continue
      const offer = QUEST_REGISTRY[questId]?.offer
      assert.ok(
        offer,
        `Quest event ${event.id} points to ${questId} without an offer`
      )
      assert.equal(event.trigger, offer.trigger, `${event.id} trigger drifted`)
      assert.equal(
        event.category,
        offer.category,
        `${event.id} category drifted`
      )
      assert.equal(event.chance, offer.chance, `${event.id} chance drifted`)
    }
  })

  it('content gate: failure penalties stay non-lethal (no game_over anywhere)', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      const fp = quest.failurePenalty
      if (!fp) continue
      const serialized = JSON.stringify(fp)
      assert.ok(
        !serialized.includes('"game_over"') &&
          !serialized.includes('"gameOver"'),
        `Quest ${id} failure penalty references game_over: ${serialized}`
      )
    }
  })

  it('content gate: story quests declare a completion or failure flag', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.kind !== 'story') continue
      const hasCompletion =
        quest.rewardFlag ||
        (Array.isArray(quest.completionFlags) && quest.completionFlags.length)
      const hasFailure =
        (Array.isArray(quest.failureFlags) && quest.failureFlags.length) ||
        (quest.failurePenalty &&
          Array.isArray(quest.failurePenalty.flags) &&
          quest.failurePenalty.flags.length)
      assert.ok(
        hasCompletion || hasFailure,
        `Story quest ${id} has no completion or failure flag — its narrative state cannot be persisted`
      )
    }
  })

  it('content gate: startFlags quests clear their flags on resolve', () => {
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (!Array.isArray(quest.startFlags) || quest.startFlags.length === 0)
        continue
      const clears =
        (Array.isArray(quest.clearFlagsOnComplete) &&
          quest.clearFlagsOnComplete.length) ||
        (Array.isArray(quest.clearFlagsOnFail) && quest.clearFlagsOnFail.length)
      assert.ok(
        clears,
        `Quest ${id} declares startFlags but never clears them on complete/fail — flag would leak`
      )
    }
  })

  it('quest state contract separates registry definition from active runtime', async () => {
    const fs = await import('node:fs')
    const questTypes = fs.readFileSync('src/types/quest.d.ts', 'utf8')
    const gameTypes = fs.readFileSync('src/types/game.d.ts', 'utf8')

    assert.match(questTypes, /export interface QuestDefinition\b/)
    assert.match(questTypes, /export interface ActiveQuestState\b/)
    assert.match(gameTypes, /activeQuests:\s*ActiveQuestState\[\]/)
  })

  it('quest lifecycle delegates reward handling to reward appliers', async () => {
    const fs = await import('node:fs')
    const lifecycle = fs.readFileSync('src/domain/questLifecycle.ts', 'utf8')

    assert.doesNotMatch(lifecycle, /quest\.rewardType\b/)
    assert.doesNotMatch(lifecycle, /quest\.rewardData\b/)
    assert.doesNotMatch(lifecycle, /quest\.moneyReward\b/)
  })

  it('quest reward appliers append trait toasts without replacing accumulated toasts', async () => {
    const fs = await import('node:fs')
    const rewards = fs.readFileSync('src/domain/questRewards.ts', 'utf8')

    assert.doesNotMatch(rewards, /toasts\.splice\(/)
  })

  it('gameplay systems use producer adapters for canonical quest events', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const files = []
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
      }
    }
    walk('src')
    const gameplayText = files
      .filter(file => !file.replace(/\\/g, '/').includes('/quests/producers/'))
      .map(file => fs.readFileSync(file, 'utf8'))
      .join('\n')

    for (const producerName of [
      'createBrandOfferAcceptedQuestEvent',
      'createAssetAcquiredQuestEvent',
      'createAssetRepairedQuestEvent',
      'createAssetModuleInstalledQuestEvent',
      'createMinigameCompletedQuestEvent',
      'createItemUsedQuestEvent',
      'createSocialLoyaltyChangedQuestEvent',
      'createVenueGoodGigQuestEvent'
    ]) {
      assert.ok(
        gameplayText.includes(producerName),
        `${producerName} is not wired into gameplay code`
      )
    }
  })

  it('every QuestEventType is accepted as canonical progress event', async () => {
    const fs = await import('node:fs')
    const questTypes = fs.readFileSync('src/types/quest.d.ts', 'utf8')
    const eventTypeBlock =
      questTypes.match(
        /export type QuestEventType =([\s\S]*?)\r?\n\r?\n/
      )?.[1] ?? ''
    const eventTypes = Array.from(
      eventTypeBlock.matchAll(/\|\s+'([^']+)'/g),
      match => match[1]
    )

    assert.ok(eventTypes.length > 0, 'expected QuestEventType literals')
    for (const eventType of eventTypes) {
      const state = {
        ...getBaseState(),
        activeQuests: [
          {
            id: `q_${eventType}`,
            progress: 0,
            required: 1,
            progressRules: [
              { event: eventType, amount: 'fixed', fixedAmount: 1 }
            ]
          }
        ]
      }
      const next = QuestProgress.applyEvent(state, {
        type: eventType,
        amount: 1,
        success: true,
        context: {}
      })

      assert.ok(
        next.completedQuestIds?.includes(`q_${eventType}`),
        `${eventType} was not canonicalized`
      )
    }
  })

  it('should ensure repeatPolicy never quests do not restart', () => {
    // Contract: QuestLifecycle.addQuest enforces repeatPolicy: 'never' by
    // refusing re-add once the id is in completedQuestIds or an active
    // rewardFlag / completion flag is present. We start the quest, complete
    // it, then attempt to add it again and assert the active list does NOT
    // contain a fresh instance with progress 0.
    for (const [id, quest] of Object.entries(QUEST_REGISTRY)) {
      if (quest.repeatPolicy !== 'never') continue
      let state = getBaseState()

      state = QuestLifecycle.addQuest(state, {
        id,
        deadline: state.player.day + 10,
        required: quest.required ?? 1,
        rewardFlag: quest.rewardFlag
      })
      assert.ok(
        state.activeQuests.find(q => q.id === id),
        `Quest ${id} should be started`
      )

      state = QuestLifecycle.completeQuest(state, { questId: id })
      assert.ok(
        !state.activeQuests.find(q => q.id === id),
        `Quest ${id} should be removed after completion`
      )
      assert.ok(
        state.completedQuestIds?.includes(id),
        `Quest ${id} should be tracked in completedQuestIds`
      )

      // Attempt to re-add. addQuest must refuse: the active list must not
      // gain a fresh (progress 0) instance of the original id.
      const beforeReadd = state.activeQuests.filter(q => q.id === id).length
      state = QuestLifecycle.addQuest(state, {
        id,
        deadline: state.player.day + 10,
        required: quest.required ?? 1,
        rewardFlag: quest.rewardFlag
      })
      const afterReadd = state.activeQuests.filter(q => q.id === id).length
      assert.equal(
        afterReadd,
        beforeReadd,
        `Quest ${id} (repeatPolicy: 'never') was re-added after completion`
      )
    }
  })

  // Backbone gate: gameplay code must route quest progression through the
  // event façade (QuestEvents.emit / applyQuestEvent action). Calling
  // QuestLifecycle.advanceQuest or .setQuestProgress directly from outside
  // the quest domain is the failure mode the redesign is preventing — every
  // system growing its own quest switch. The single legitimate call site is
  // questReducer.ts's handleAdvanceQuest action wiring.
  it('production code does not call QuestLifecycle.advanceQuest directly', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const files = []
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
      }
    }
    walk('src')
    const allowed = new Set([
      'src/domain/questLifecycle.ts',
      'src/utils/questProgress.ts',
      'src/context/reducers/questReducer.ts'
    ])
    for (const file of files) {
      const rel = file.replace(/\\/g, '/')
      if (allowed.has(rel)) continue
      const text = fs.readFileSync(file, 'utf8')
      assert.ok(
        !/QuestLifecycle\.(advanceQuest|setQuestProgress)\b/.test(text),
        `${rel} calls QuestLifecycle.advance/setQuestProgress directly — route through QuestEvents.emit / applyQuestEvent instead`
      )
    }
  })
})
