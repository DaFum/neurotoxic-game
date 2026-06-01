import test from 'node:test'
import assert from 'node:assert/strict'
import { QuestOfferEngine } from '../../../src/domain/questOfferEngine.ts'

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
        venue_a: { id: 'venue_a', type: 'GIG' },
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

  await t.test('returns available offers for a trigger', () => {
    const offerIds = QuestOfferEngine.getAvailableOffers(
      baseState(),
      'random'
    ).map(offer => offer.questId)

    assert.ok(offerIds.includes('quest_community_outreach'))
    assert.ok(offerIds.includes('quest_venue_residency'))
  })
})
