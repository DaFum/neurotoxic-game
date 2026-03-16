import { expect, test, vi } from 'vitest'
import { generateEffectText } from '../src/utils/effectFormatter.js'

test('generateEffectText formats valid delta inputs properly', () => {
  const mockT = vi.fn((key) => {
    const defaultLabels = {
      'ui:stats.money': 'Money',
      'ui:stats.fame': 'Fame',
      'ui:stats.time': 'Time',
      'ui:stats.controversy': 'Controversy',
      'ui:stats.harmony': 'Harmony',
      'ui:stats.mood': 'Mood',
      'ui:stats.stamina': 'Stamina',
      'ui:event.effects_label': 'Effects:'
    }
    return defaultLabels[key] || key.replace('items:', '')
  })

  const delta = {
    player: {
      money: -50,
      fame: 10,
      time: 2
    },
    social: {
      controversyLevel: 5
    },
    band: {
      harmony: -10,
      inventory: {
        'golden_pick': true,
        'guitar_strings': -2
      },
      membersDelta: [
        { moodChange: 5, staminaChange: -2 },
        { moodChange: 5, staminaChange: -2 }
      ]
    }
  }

  const result = generateEffectText(delta, mockT)

  expect(result).toContain('Effects:')
  expect(result).toContain('Money: -50€')
  expect(result).toContain('Fame: +10')
  expect(result).toContain('Time: +2h')
  expect(result).toContain('Controversy: +5')
  expect(result).toContain('Harmony: -10')
  expect(result).toContain('Mood: +10')
  expect(result).toContain('Stamina: -4')
  expect(result).toContain('guitar_strings: -2')

  // Boolean true should not render as text
  expect(result).not.toContain('golden_pick')
})

test('generateEffectText skips exact zero values to prevent redundant logs', () => {
  const mockT = vi.fn((key) => key)

  const delta = {
    player: {
      money: 0,
      fame: 0,
      time: 0
    },
    social: {
      controversyLevel: 0
    },
    band: {
      harmony: 0,
      inventory: {
        'guitar_strings': 0
      },
      membersDelta: { moodChange: 0, staminaChange: 0 }
    }
  }

  const result = generateEffectText(delta, mockT)

  // Entire effect text should be empty string because nothing changed
  expect(result).toBe('')
})

test('generateEffectText handles empty or null deltas safely', () => {
  const mockT = vi.fn((key) => key)

  expect(generateEffectText(null, mockT)).toBe('')
  expect(generateEffectText({}, mockT)).toBe('')
  expect(generateEffectText({ player: {} }, mockT)).toBe('')
})
