import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { generateEffectText } from '../../src/utils/effectFormatter'

describe('generateEffectText', () => {
  const t = (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key

  it('returns empty string if no delta is provided', () => {
    assert.equal(generateEffectText(undefined, t), '')
    assert.equal(generateEffectText(null, t), '')
  })

  it('formats player stats', () => {
    const delta = {
      player: {
        money: 100,
        fame: -10,
        time: 2,
        van: {
          fuel: -5,
          condition: 10
        }
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Money: +100€, Fame: -10, Time: +2h, Fuel: -5, Van Condition: +10')
  })

  it('formats social stats', () => {
    const delta = {
      social: {
        controversyLevel: 5,
        viral: -2,
        loyalty: 15
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Controversy: +5, Viral: -2, Loyalty: +15')
  })

  it('formats score', () => {
    const delta = {
      score: 1000
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Score: +1000')
  })

  it('formats band stats', () => {
    const delta = {
      band: {
        harmony: 5,
        luck: -3,
        skill: 1
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Harmony: +5, Luck: -3, Skill: +1')
  })

  it('formats band membersDelta (array)', () => {
    const delta = {
      band: {
        membersDelta: [
          { moodChange: 5, staminaChange: -10 },
          { moodChange: -2, staminaChange: 5 },
          { } // missing stats
        ]
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Mood: +3, Stamina: -5')
  })

  it('formats band membersDelta (single object)', () => {
    const delta = {
      band: {
        membersDelta: { moodChange: 10, staminaChange: 20 }
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Mood: +10, Stamina: +20')
  })

  it('formats inventory items (numbers and booleans)', () => {
    const delta = {
      band: {
        inventory: {
          'guitar': 1,
          'broken_strings': -2,
          'vip_pass': true,
          'fake_id': false,
          'zero_item': 0
        }
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: guitar: +1, broken_strings: -2, +vip_pass, -fake_id')
  })

  it('formats flags (addQuest as string)', () => {
    const delta = {
      flags: {
        addQuest: 'find_guitar'
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: New Quest: find_guitar')
  })

  it('formats flags (addQuest as array of objects/strings)', () => {
    const delta = {
      flags: {
        addQuest: [
          { id: 'q1', label: 'Quest 1' },
          { title: 'Quest 2' },
          'Quest 3'
        ]
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: New Quest: q1, New Quest: Quest 2, New Quest: Quest 3')
  })

  it('formats flags (queueEvent and addStoryFlag)', () => {
    const delta = {
      flags: {
        queueEvent: 'some_event'
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Story Updated')

    const delta2 = {
      flags: {
        addStoryFlag: 'some_flag'
      }
    }
    const result2 = generateEffectText(delta2, t)
    assert.equal(result2, 'Effects: Story Updated')
  })

  it('formats flags (gameOver)', () => {
    const delta = {
      flags: {
        gameOver: true
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Game Over')
  })

  it('combines multiple effects correctly', () => {
    const delta = {
      player: {
        money: 50
      },
      flags: {
        gameOver: true
      }
    }
    const result = generateEffectText(delta, t)
    assert.equal(result, 'Effects: Money: +50€, Game Over')
  })
})
