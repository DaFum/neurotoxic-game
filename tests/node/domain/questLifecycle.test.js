import test from 'node:test'
import assert from 'node:assert/strict'
import { QuestLifecycle } from '../../../src/domain/questLifecycle'
import { QUEST_PROVE_YOURSELF } from '../../../src/data/questsConstants'

test('QuestLifecycle', async (t) => {
  await t.test('addQuest', async (t) => {
    await t.test('adds a quest if it is not already active', () => {
      const state = { activeQuests: [] }
      const quest = { id: 'test1' }
      const nextState = QuestLifecycle.addQuest(state, quest)
      assert.deepEqual(nextState.activeQuests, [quest])
      assert.notEqual(nextState, state)
    })

    await t.test('does not add a quest if it is already active', () => {
      const quest = { id: 'test1' }
      const state = { activeQuests: [quest] }
      const nextState = QuestLifecycle.addQuest(state, quest)
      assert.equal(nextState, state)
    })

    await t.test('handles missing activeQuests array', () => {
      const state = {}
      const quest = { id: 'test1' }
      const nextState = QuestLifecycle.addQuest(state, quest)
      assert.deepEqual(nextState.activeQuests, [quest])
    })
  })

  await t.test('completeQuest', async (t) => {
    await t.test('handles missing activeQuests', () => {
      const state = {}
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState, state)
    })

    await t.test('returns state if quest not found', () => {
      const state = { activeQuests: [{ id: 'q2' }] }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState, state)
    })

    await t.test('removes quest from activeQuests and adds generic toast', () => {
      const state = { activeQuests: [{ id: 'q1', label: 'Test Quest' }], toasts: [] }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.activeQuests.length, 0)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete')
    })

    await t.test('applies money reward', () => {
      const state = {
        activeQuests: [{ id: 'q1', label: 'Money Quest', moneyReward: 100 }],
        player: { money: 50 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.money, 150)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete_money')
    })

    await t.test('applies item reward', () => {
      const state = {
        activeQuests: [{ id: 'q1', label: 'Item Quest', rewardType: 'item', rewardData: { item: 'guitar' } }],
        band: { inventory: {} },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.inventory['guitar'], true)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete_item')
    })

    await t.test('applies fame reward', () => {
      const state = {
        activeQuests: [{ id: 'q1', label: 'Fame Quest', rewardType: 'fame', rewardData: { fame: 50 } }],
        player: { fame: 10, fameLevel: 0 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.player.fame, 60)
      assert.ok(nextState.player.fameLevel >= 0)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete_fame')
    })

    await t.test('applies harmony reward', () => {
      const state = {
        activeQuests: [{ id: 'q1', label: 'Harmony Quest', rewardType: 'harmony', rewardData: { harmony: 20 } }],
        band: { harmony: 50 },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.harmony, 70)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete_harmony')
    })

    await t.test('applies skill point reward', () => {
      const state = {
        activeQuests: [{ id: 'q1', label: 'Skill Quest', rewardType: 'skill_point', rewardData: { memberIndex: 1 } }],
        band: { members: [{ name: 'A', skill: 5 }, { name: 'B', skill: 5, baseStats: { skill: 5 } }] },
        toasts: []
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.equal(nextState.band.members[1].baseStats.skill, 6)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete_skill')
    })

    await t.test('handles rewardFlag', () => {
      const state = {
        activeQuests: [{ id: 'q1', rewardFlag: 'flag_unlocked' }]
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: 'q1' })
      assert.deepEqual(nextState.activeStoryFlags, ['flag_unlocked'])
    })

    await t.test('handles hardcoded QUEST_PROVE_YOURSELF', () => {
      const state = {
        activeQuests: [{ id: QUEST_PROVE_YOURSELF }],
        venueBlacklist: ['v1', 'v2', 'v3'],
        player: { stats: { proveYourselfMode: true } }
      }
      const nextState = QuestLifecycle.completeQuest(state, { questId: QUEST_PROVE_YOURSELF })
      assert.deepEqual(nextState.venueBlacklist, ['v3'])
      assert.equal(nextState.player.stats.proveYourselfMode, false)
    })
  })

  await t.test('advanceQuest', async (t) => {
    await t.test('advances progress', () => {
      const state = { activeQuests: [{ id: 'q1', progress: 0, required: 5 }] }
      const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1', amount: 2 })
      assert.equal(nextState.activeQuests[0].progress, 2)
    })

    await t.test('completes quest when progress reaches required', () => {
      const state = { activeQuests: [{ id: 'q1', progress: 3, required: 4, label: 'Q' }], toasts: [] }
      const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1', amount: 1 })
      assert.equal(nextState.activeQuests.length, 0) // Completed and removed
      assert.equal(nextState.toasts.length, 1)
    })
  })

  await t.test('checkDeadlines', async (t) => {
    await t.test('fails expired quests and applies penalties', () => {
      const state = {
        player: { day: 10 },
        social: { controversyLevel: 5 },
        band: { harmony: 50 },
        activeQuests: [
          {
            id: 'q1',
            label: 'Failed',
            deadline: 9,
            failurePenalty: {
              social: { controversyLevel: 10 },
              band: { harmony: -20 }
            }
          },
          {
            id: 'q2',
            deadline: 12
          }
        ],
        toasts: []
      }
      const nextState = QuestLifecycle.checkDeadlines(state)
      assert.equal(nextState.activeQuests.length, 1)
      assert.equal(nextState.activeQuests[0].id, 'q2')
      assert.equal(nextState.social.controversyLevel, 15)
      assert.equal(nextState.band.harmony, 30)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_failed')
    })
  })
})
