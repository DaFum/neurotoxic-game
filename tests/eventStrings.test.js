import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEventChoice } from '../src/utils/eventEngine.js'
import { EVENT_STRINGS } from '../src/data/events/constants.js'

test('resolveEventChoice appends SAVED_BY_BANDLEADER string on successful bandleader save', () => {
  const choice = {
    label: 'Negotiate',
    skillCheck: {
      stat: 'skill',
      threshold: 10,
      success: { description: 'Success!' },
      failure: { description: 'Failure.' }
    }
  }

  const gameState = {
    activeEvent: { tags: ['conflict'] },
    band: {
      members: [
        {
          id: 'leader',
          baseStats: { skill: 1 },
          traits: [{ id: 'bandleader' }]
        }
      ]
    }
  }

  // RNG sequence:
  // 1. roll = rng() * 10. Let's make it 0.1 -> 1.0.
  //    skillValue = 1. total = 1 + 0 = 1. 1 < 10 (Fail)
  // 2. bandleaderRoll = rng(). Let's make it 0.4 (< 0.5, Success)

  let rngCallCount = 0
  const mockRng = () => {
    rngCallCount++
    if (rngCallCount === 1) return 0.1 // Fail skill check
    if (rngCallCount === 2) return 0.4 // Succeed bandleader roll
    return 0.5
  }

  const { description, result } = resolveEventChoice(choice, gameState, mockRng)

  assert.equal(result.outcome, 'success')
  assert.ok(
    description.includes(EVENT_STRINGS.SAVED_BY_BANDLEADER),
    `Description "${description}" should include "${EVENT_STRINGS.SAVED_BY_BANDLEADER}"`
  )
  assert.equal(description, 'Success!' + EVENT_STRINGS.SAVED_BY_BANDLEADER)
})
