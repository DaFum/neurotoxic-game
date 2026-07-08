import test from 'node:test'
import assert from 'node:assert/strict'
import { QuestLifecycle } from '../../../src/domain/questLifecycle.js'

test('advanceQuest', async t => {
  await t.test('returns original state if activeQuests is missing', () => {
    const state = {}
    const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1' })
    assert.equal(nextState, state)
  })

  await t.test('returns original state if quest is missing', () => {
    const state = { activeQuests: [] }
    const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1' })
    assert.equal(nextState, state)
  })

  await t.test(
    'returns original state if required is missing or invalid',
    () => {
      const state = { activeQuests: [{ id: 'q1', progress: 0 }] }
      const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1' })
      assert.equal(nextState, state)

      const stateInvalidRequired = {
        activeQuests: [{ id: 'q1', required: -5, progress: 0 }]
      }
      const nextStateInvalidRequired = QuestLifecycle.advanceQuest(
        stateInvalidRequired,
        { questId: 'q1' }
      )
      assert.equal(nextStateInvalidRequired, stateInvalidRequired)
    }
  )

  await t.test('returns original state if amount is not a number', () => {
    const state = { activeQuests: [{ id: 'q1', required: 5, progress: 0 }] }
    const nextState = QuestLifecycle.advanceQuest(state, {
      questId: 'q1',
      amount: 'abc'
    })
    assert.equal(nextState, state)
  })

  await t.test(
    'returns original state if amount is negative or non-finite',
    () => {
      const state = { activeQuests: [{ id: 'q1', required: 5, progress: 0 }] }
      const nextStateNeg = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: -1
      })
      assert.equal(nextStateNeg, state)

      const nextStateInf = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: Infinity
      })
      assert.equal(nextStateInf, state)

      const nextStateNaN = QuestLifecycle.advanceQuest(state, {
        questId: 'q1',
        amount: NaN
      })
      assert.equal(nextStateNaN, state)
    }
  )

  await t.test('advances quest progress with default amount', () => {
    const state = { activeQuests: [{ id: 'q1', required: 5, progress: 0 }] }
    const nextState = QuestLifecycle.advanceQuest(state, { questId: 'q1' })
    assert.notEqual(nextState, state)
    assert.notEqual(nextState.activeQuests, state.activeQuests)
    assert.equal(nextState.activeQuests[0].progress, 1)
  })

  await t.test('advances quest progress with specified amount', () => {
    const state = { activeQuests: [{ id: 'q1', required: 5, progress: 0 }] }
    const nextState = QuestLifecycle.advanceQuest(state, {
      questId: 'q1',
      amount: 3
    })
    assert.notEqual(nextState, state)
    assert.equal(nextState.activeQuests[0].progress, 3)
  })

  await t.test('advances quest progress with amount 0', () => {
    const state = { activeQuests: [{ id: 'q1', required: 5, progress: 0 }] }
    const nextState = QuestLifecycle.advanceQuest(state, {
      questId: 'q1',
      amount: 0
    })
    assert.notEqual(nextState, state)
    assert.equal(nextState.activeQuests[0].progress, 0)
  })

  await t.test('advances quest progress when progress is missing', () => {
    const state = { activeQuests: [{ id: 'q1', required: 5 }] }
    const nextState = QuestLifecycle.advanceQuest(state, {
      questId: 'q1',
      amount: 3
    })
    assert.equal(nextState.activeQuests[0].progress, 3)
  })

  await t.test('completes quest when progress reaches required', () => {
    const state = {
      activeQuests: [{ id: 'q1', required: 5, progress: 3, label: 'Q' }],
      toasts: []
    }
    const nextState = QuestLifecycle.advanceQuest(state, {
      questId: 'q1',
      amount: 2,
      randomIdx: 42
    })
    assert.equal(nextState.activeQuests.length, 0)
    assert.equal(nextState.toasts.length, 1)
  })
})

test('setQuestProgress', async t => {
  await t.test('returns original state if activeQuests is missing', () => {
    const state = {}
    const nextState = QuestLifecycle.setQuestProgress(state, {
      questId: 'q1',
      progress: 5
    })
    assert.equal(nextState, state)
  })

  await t.test('returns original state if quest is missing', () => {
    const state = { activeQuests: [] }
    const nextState = QuestLifecycle.setQuestProgress(state, {
      questId: 'q1',
      progress: 5
    })
    assert.equal(nextState, state)
  })

  await t.test('sets progress monotonically', () => {
    const state = { activeQuests: [{ id: 'q1', progress: 2, required: 10 }] }
    const nextState = QuestLifecycle.setQuestProgress(state, {
      questId: 'q1',
      progress: 5
    })
    assert.equal(nextState.activeQuests[0].progress, 5)
  })

  await t.test('does not lower progress if new progress is lower', () => {
    const state = { activeQuests: [{ id: 'q1', progress: 5, required: 10 }] }
    const nextState = QuestLifecycle.setQuestProgress(state, {
      questId: 'q1',
      progress: 2
    })
    assert.equal(nextState.activeQuests[0].progress, 5)
  })

  await t.test('caps progress at required and completes quest', () => {
    const state = {
      activeQuests: [{ id: 'q1', progress: 8, required: 10, label: 'Q' }],
      toasts: []
    }
    const nextState = QuestLifecycle.setQuestProgress(state, {
      questId: 'q1',
      progress: 15
    })
    assert.equal(nextState.activeQuests.length, 0)
  })

  await t.test('handles missing progress gracefully', () => {
    const state = { activeQuests: [{ id: 'q1', required: 10 }] }
    const nextState = QuestLifecycle.setQuestProgress(state, {
      questId: 'q1',
      progress: 5
    })
    assert.equal(nextState.activeQuests[0].progress, 5)
  })

  await t.test(
    'updates progress even if required is missing (threshold-less)',
    () => {
      const state = { activeQuests: [{ id: 'q1', progress: 2 }] }
      const nextState = QuestLifecycle.setQuestProgress(state, {
        questId: 'q1',
        progress: 5
      })
      assert.equal(nextState.activeQuests[0].progress, 5)
      assert.equal(nextState.activeQuests[0].required, undefined)
    }
  )
})
