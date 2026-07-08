import test from 'node:test'
import assert from 'node:assert/strict'
import { checkDeadlines } from '../../../src/domain/questDeadlines.ts'

test('checkDeadlines', async t => {
  await t.test('returns original state if activeQuests is missing', () => {
    const state = {}
    const nextState = checkDeadlines(state)
    assert.equal(nextState, state)
  })

  await t.test('returns original state if no activeQuests are expired', () => {
    const state = {
      player: { day: 5 },
      activeQuests: [{ id: 'q1', deadline: 10 }]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState, state)
  })

  await t.test('returns original state if activeQuest is falsy', () => {
    const state = {
      player: { day: 5 },
      activeQuests: [undefined, { id: 'q1', deadline: 10 }]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState, state)
  })

  await t.test('handles missing player day (defaults to 0)', () => {
    const state = {
      activeQuests: [{ id: 'q1', deadline: -1 }]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState.activeQuests.length, 0)
    assert.ok(nextState.toasts.length > 0)
  })

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
    const nextState = checkDeadlines(state)
    assert.equal(nextState.activeQuests.length, 1)
    assert.equal(nextState.activeQuests[0].id, 'q2')
    assert.equal(nextState.social.controversyLevel, 15)
    assert.equal(nextState.band.harmony, 30)
    assert.equal(nextState.toasts.length, 1)
    assert.equal(nextState.toasts[0].messageKey, 'ui:toast.quest_failed')
  })

  await t.test('uses quest id for failure toast without label', () => {
    const state = {
      player: { day: 10 },
      activeQuests: [{ id: 'q1', deadline: 9 }]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState.toasts[0].options.name, 'q1')
  })

  await t.test('fails expired quests with invalid penalties', () => {
    const state = {
      player: { day: 10 },
      social: { controversyLevel: 5 },
      band: { harmony: 50 },
      activeQuests: [
        {
          id: 'q1',
          deadline: 9,
          failurePenalty: {
            social: 'invalid', // not a record
            band: null // not a record
          }
        },
        {
          id: 'q2',
          deadline: 9,
          failurePenalty: {
            social: { controversyLevel: 'NaN' }
          }
        }
      ]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState.activeQuests.length, 0)
    assert.equal(nextState.social.controversyLevel, 5) // no change due to invalid number
    assert.equal(nextState.band.harmony, 50) // no change
    assert.equal(nextState.toasts.length, 2)
  })

  await t.test(
    'handles expired quests missing harmony or controversyLevel penalties explicitly',
    () => {
      const state = {
        player: { day: 10 },
        social: { controversyLevel: 5 },
        band: { harmony: 50 },
        activeQuests: [
          {
            id: 'q1',
            deadline: 9,
            failurePenalty: {
              social: { controversyLevel: null }, // explicit null should be ignored
              band: { harmony: 'NaN' } // invalid number should default to 0
            }
          }
        ]
      }
      const nextState = checkDeadlines(state)
      assert.equal(nextState.activeQuests.length, 0)
      assert.equal(nextState.social.controversyLevel, 5)
      assert.equal(nextState.band.harmony, 50)
    }
  )

  await t.test('applies penalties when previous stats are missing', () => {
    const state = {
      player: { day: 10 },
      social: {}, // Missing controversyLevel
      band: {}, // Missing harmony
      activeQuests: [
        {
          id: 'q1',
          deadline: 9,
          failurePenalty: {
            social: { controversyLevel: 10 },
            band: { harmony: -20 }
          }
        }
      ]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState.activeQuests.length, 0)
    assert.equal(nextState.social.controversyLevel, 10)
    assert.equal(nextState.band.harmony, 1) // clampBandHarmony clamps to 1 minimum
  })

  await t.test('handles falsy deadline check in checkDeadlines', () => {
    const state = {
      player: { day: 10 },
      activeQuests: [{ id: 'q1', deadline: undefined }]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState, state)
  })

  await t.test(
    'removes expired quest, adds failure flags, toasts and cooldowns, removes startFlags',
    () => {
      const state = {
        player: { day: 10 },
        activeStoryFlags: ['existing_flag', 'start_flag_1', 'start_flag_2'],
        activeQuests: [
          {
            id: 'q1',
            deadline: 5,
            clearFlagsOnFail: ['start_flag_1'],
            startFlags: ['start_flag_2'],
            failureFlags: ['fail_flag_1', ''],
            failurePenalties: [{ type: 'quest.cooldown', days: 3 }]
          }
        ]
      }
      const nextState = checkDeadlines(state)

      assert.equal(nextState.activeQuests.length, 0)
      assert.ok(nextState.toasts.some(t => t.id === 'q1-fail'))
      assert.deepEqual(nextState.questCooldowns, [
        { questId: 'q1', expiresOnDay: 13 }
      ])

      assert.ok(nextState.activeStoryFlags.includes('fail_flag_1'))
      assert.ok(nextState.activeStoryFlags.includes('existing_flag'))
      assert.ok(!nextState.activeStoryFlags.includes('start_flag_1'))
      assert.ok(!nextState.activeStoryFlags.includes('start_flag_2'))
      assert.ok(!nextState.activeStoryFlags.includes(''))
    }
  )

  await t.test(
    'preserves toasts and cooldowns arrays when pushing to them',
    () => {
      const state = {
        player: { day: 10 },
        toasts: [{ id: 'existing_toast' }],
        questCooldowns: [{ questId: 'existing_cooldown' }],
        activeQuests: [
          {
            id: 'q1',
            deadline: 5,
            failurePenalties: [{ type: 'quest.cooldown', days: 3 }]
          }
        ]
      }
      const nextState = checkDeadlines(state)

      assert.equal(nextState.activeQuests.length, 0)
      assert.equal(nextState.toasts.length, 2)
      assert.equal(nextState.questCooldowns.length, 2)
      assert.equal(nextState.toasts[0].id, 'existing_toast')
      assert.equal(nextState.questCooldowns[0].questId, 'existing_cooldown')
    }
  )

  await t.test(
    'handles flagsToAdd with new flags without altering existing that are not to remove',
    () => {
      const state = {
        player: { day: 10 },
        activeStoryFlags: ['existing_flag'],
        activeQuests: [
          {
            id: 'q1',
            deadline: 5,
            failureFlags: ['fail_flag_1']
          }
        ]
      }
      const nextState = checkDeadlines(state)

      assert.equal(nextState.activeQuests.length, 0)
      assert.ok(nextState.activeStoryFlags.includes('existing_flag'))
      assert.ok(nextState.activeStoryFlags.includes('fail_flag_1'))
    }
  )

  await t.test('handles invalid flags values', () => {
    const state = {
      player: { day: 10 },
      activeStoryFlags: ['existing_flag'],
      activeQuests: [
        {
          id: 'q1',
          deadline: 5,
          clearFlagsOnFail: [null, 123],
          startFlags: [undefined, {}],
          failureFlags: [null, 123, '']
        }
      ]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState.activeQuests.length, 0)
    assert.deepEqual(nextState.activeStoryFlags, ['existing_flag'])
  })

  await t.test('handles multiple expired quests', () => {
    const state = {
      player: { day: 10 },
      activeQuests: [
        { id: 'q1', deadline: 5 },
        { id: 'q2', deadline: 15 },
        { id: 'q3', deadline: 8 }
      ]
    }
    const nextState = checkDeadlines(state)
    assert.equal(nextState.activeQuests.length, 1)
    assert.equal(nextState.activeQuests[0].id, 'q2')
    assert.equal(nextState.toasts.length, 2)
  })
})
