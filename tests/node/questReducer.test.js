import test from 'node:test'
import assert from 'node:assert/strict'
import {
  handleAddQuest,
  handleCompleteQuest,
  handleAdvanceQuest,
  handleFailQuests
} from '../../src/context/reducers/questReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { gameReducer } from '../../src/context/gameReducer'

test('questReducer - handleAddQuest', async t => {
  await t.test('adds a new quest when none exists', () => {
    const initialState = { activeQuests: [] }
    const quest = { id: 'test_quest', label: 'Test Quest' }

    const nextState = handleAddQuest(initialState, quest)

    assert.equal(nextState.activeQuests.length, 1)
    assert.equal(nextState.activeQuests[0].id, 'test_quest')
    // Check immutability
    assert.notEqual(initialState, nextState)
  })

  await t.test('does not add duplicate quest id', () => {
    const quest = { id: 'test_quest', label: 'Test Quest' }
    const initialState = { activeQuests: [quest] }

    const nextState = handleAddQuest(initialState, quest)

    assert.equal(nextState.activeQuests.length, 1)
    // Reducer should return the identical state object if nothing changed
    assert.equal(initialState, nextState)
  })
})

test('questReducer - handleAdvanceQuest & Completion', async t => {
  await t.test('advances quest progress', () => {
    const initialState = {
      activeQuests: [{ id: 'q1', progress: 0, required: 5 }]
    }

    const nextState = handleAdvanceQuest(initialState, {
      questId: 'q1',
      amount: 2
    })

    assert.equal(nextState.activeQuests[0].progress, 2)
    assert.notEqual(initialState, nextState)
  })

  await t.test(
    'auto-completes quest when progress reaches required amount',
    () => {
      const initialState = {
        activeQuests: [{ id: 'q1', progress: 4, required: 5, label: 'Q1' }],
        toasts: [],
        player: { money: 100 }
      }

      // Dispatch standard action type via gameReducer
      const nextState = gameReducer(initialState, {
        type: ActionTypes.ADVANCE_QUEST,
        payload: { questId: 'q1', amount: 1 }
      })

      // Quest should be removed from active pool
      assert.equal(nextState.activeQuests.length, 0)
      // Toast should be generated
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete')
      assert.equal(nextState.toasts[0].options.name, 'Q1')
    }
  )

  await t.test('over-advance still completes quest', () => {
    const initialState = {
      activeQuests: [
        { id: 'q1', progress: 0, required: 3, label: 'Over Quest' }
      ],
      toasts: [],
      player: { money: 100 }
    }
    const nextState = gameReducer(initialState, {
      type: ActionTypes.ADVANCE_QUEST,
      payload: { questId: 'q1', amount: 999 }
    })
    // Quest completes despite amount >> required (Math.min clamps to exactly required)
    assert.equal(nextState.activeQuests.length, 0)
    assert.equal(nextState.toasts.length, 1)
  })
})

test('questReducer - Rewards Logic', async t => {
  await t.test('grants money reward on complete', () => {
    const initialState = {
      activeQuests: [{ id: 'q_money', moneyReward: 500, label: 'Cash Quest' }],
      player: { money: 100 }
    }
    const nextState = handleCompleteQuest(initialState, { questId: 'q_money' })

    assert.equal(nextState.player.money, 600)
    assert.equal(
      nextState.toasts[0].messageKey,
      'ui:toast.quest_complete_money'
    )
  })

  await t.test('grants fame reward on complete', () => {
    const initialState = {
      activeQuests: [
        {
          id: 'q_fame',
          rewardType: 'fame',
          rewardData: { fame: 150 },
          label: 'Fame Quest'
        }
      ],
      player: { fame: 50, fameLevel: 0 }
    }
    const nextState = handleCompleteQuest(initialState, { questId: 'q_fame' })

    assert.equal(nextState.player.fame, 200)
    // Fame level: floor(200 / 100) = 2
    assert.equal(nextState.player.fameLevel, 2)
    assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete_fame')
  })

  await t.test('grants item reward on complete', () => {
    const initialState = {
      activeQuests: [
        {
          id: 'q_item',
          rewardType: 'item',
          rewardData: { item: 'lucky_pick' },
          label: 'Item Quest'
        }
      ],
      band: { inventory: {} }
    }
    const nextState = handleCompleteQuest(initialState, { questId: 'q_item' })

    assert.equal(nextState.band.inventory.lucky_pick, true)
    assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_complete_item')
  })

  await t.test('grants skill point reward to a random member', () => {
    const initialState = {
      activeQuests: [
        {
          id: 'q_skill',
          rewardType: 'skill_point',
          rewardData: { memberIndex: 0 },
          label: 'Skill Quest'
        }
      ],
      band: {
        members: [
          { name: 'Singer', baseStats: { skill: 10 } },
          { name: 'Drummer', baseStats: { skill: 10 } }
        ]
      }
    }
    const nextState = handleCompleteQuest(initialState, { questId: 'q_skill' })

    const totalSkill = nextState.band.members.reduce(
      (acc, m) => acc + m.baseStats.skill,
      0
    )
    assert.equal(totalSkill, 21, 'One member should have gained +1 skill')
    assert.equal(
      nextState.toasts[0].messageKey,
      'ui:toast.quest_complete_skill'
    )
  })

  await t.test('grants harmony reward and clamps it', () => {
    const initialState = {
      activeQuests: [
        {
          id: 'q_harmony',
          rewardType: 'harmony',
          rewardData: { harmony: 30 },
          label: 'Harmony Quest'
        }
      ],
      band: { harmony: 80 } // 80 + 30 = 110 (clamped to 100)
    }
    const nextState = handleCompleteQuest(initialState, {
      questId: 'q_harmony'
    })

    assert.equal(nextState.band.harmony, 100)
    assert.equal(
      nextState.toasts[0].messageKey,
      'ui:toast.quest_complete_harmony'
    )
  })
})

test('questReducer - handleFailQuests', async t => {
  await t.test(
    'fails expired quests based on player day and applies penalties',
    () => {
      const initialState = {
        player: { day: 10 },
        social: { controversyLevel: 0 },
        band: { harmony: 50 },
        activeQuests: [
          {
            id: 'q_expired',
            deadline: 9, // expired
            failurePenalty: {
              social: { controversyLevel: 20 },
              band: { harmony: -10 }
            },
            label: 'Failed Quest'
          },
          {
            id: 'q_active',
            deadline: 12, // not expired
            label: 'Active Quest'
          },
          {
            id: 'q_no_deadline',
            deadline: null, // never expires
            label: 'Permanent Quest'
          }
        ]
      }

      const nextState = handleFailQuests(initialState)

      assert.equal(nextState.activeQuests.length, 2)
      assert.equal(
        nextState.activeQuests.some(q => q.id === 'q_expired'),
        false
      )
      assert.equal(nextState.social.controversyLevel, 20)
      assert.equal(nextState.band.harmony, 40)
      assert.equal(nextState.toasts.length, 1)
      assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_failed')
    }
  )
})
