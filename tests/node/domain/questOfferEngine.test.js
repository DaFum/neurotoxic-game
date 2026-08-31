import test from 'node:test'
import assert from 'node:assert/strict'
import { QuestOfferEngine } from '../../../src/domain/questOfferEngine.ts'
import { QUEST_REGISTRY } from '../../../src/data/questRegistry.ts'

test('QuestOfferEngine', async t => {
  const baseState = () => ({
    player: { day: 1, location: 'berlin', currentNodeId: 'venue_a' },
    activeQuests: [],
    activeStoryFlags: [],
    completedQuestIds: [],
    completedQuestScopes: [],
    questCooldowns: [],
    gameMap: {
      nodes: {
        // perVenue scopes come from the node's canonical venue id.
        venue_a: { id: 'venue_a', type: 'GIG', venueId: 'stendal_adler' },
        city_a: { id: 'city_a', type: 'CITY' }
      }
    },
    social: { loyalty: 20, controversyLevel: 40 },
    assets: [{ id: 'asset_1', kind: 'tourbus_chassis' }]
  })

  await t.test('allows offers in a free slot of another quest kind', () => {
    const state = {
      ...baseState(),
      activeQuests: [{ id: 'quest_prove_yourself' }]
    }

    assert.equal(
      QuestOfferEngine.canOfferQuest(state, 'quest_pick_of_destiny'),
      true
    )
  })

  await t.test('blocks offers when the quest kind slot is full', () => {
    const state = {
      ...baseState(),
      activeQuests: [
        { id: 'quest_pick_of_destiny' },
        { id: 'quest_harmony_project' }
      ]
    }

    assert.equal(
      QuestOfferEngine.canOfferQuest(state, 'quest_studio_demo'),
      false
    )
  })

  await t.test('evaluates declarative social offer conditions', () => {
    const state = baseState()

    assert.equal(
      QuestOfferEngine.canOfferQuest(state, 'quest_community_outreach'),
      true
    )
    assert.equal(
      QuestOfferEngine.canOfferQuest(
        {
          ...state,
          social: { loyalty: 70, controversyLevel: 0 }
        },
        'quest_community_outreach'
      ),
      false
    )
  })

  await t.test('evaluates declarative current node type conditions', () => {
    const state = baseState()

    assert.equal(
      QuestOfferEngine.canOfferQuest(state, 'quest_venue_residency'),
      true
    )
    assert.equal(
      QuestOfferEngine.canOfferQuest(
        { ...state, player: { ...state.player, currentNodeId: 'city_a' } },
        'quest_venue_residency'
      ),
      false
    )
  })

  await t.test('gates amends offers on a non-empty venue blacklist', () => {
    const state = baseState()

    // Nothing to un-blacklist: the quest could never be completed.
    assert.equal(
      QuestOfferEngine.canOfferQuest(state, 'quest_make_amends'),
      false
    )
    assert.equal(
      QuestOfferEngine.canOfferQuest(
        { ...state, venueBlacklist: ['stendal_adler'] },
        'quest_make_amends'
      ),
      true
    )
  })

  await t.test(
    'handles optimized story flag sets when checking completion flags',
    () => {
      const state = {
        ...baseState(),
        activeStoryFlags: new Set(['ego_crisis_resolved'])
      }

      assert.equal(
        QuestOfferEngine.canOfferQuest(state, 'quest_ego_management'),
        false
      )
    }
  )

  await t.test('handles non-finite numeric offer conditions gracefully', () => {
    const state = baseState()

    // Inject non-finite condition thresholds into quest definitions by temporarily modifying registry
    // definitions, or test using definitions with thresholds.
    // Quest quest_viral_dance has condition: { social: { maxTiktok: 4999 } }.
    // If maxTiktok was NaN (e.g. from non-finite state deserialization or dynamic condition construction),
    // isFiniteNumber(social.maxTiktok) evaluates to false, skipping the check rather than failing tiktok > NaN.
    const originalMaxTiktok = (QUEST_REGISTRY.quest_viral_dance.offer.condition.social).maxTiktok
    try {
      QUEST_REGISTRY.quest_viral_dance.offer.condition.social.maxTiktok = NaN
      assert.equal(
        QuestOfferEngine.canOfferQuest(
          {
            ...state,
            social: { loyalty: 50, controversyLevel: 0, tiktok: 10000 }
          },
          'quest_viral_dance'
        ),
        true
      )
    } finally {
      QUEST_REGISTRY.quest_viral_dance.offer.condition.social.maxTiktok = originalMaxTiktok
    }
  })
})
