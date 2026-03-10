import { describe, it, expect } from 'vitest'
import { SPECIAL_EVENTS } from '../src/data/events/special'

describe('SPECIAL_EVENTS structural integrity', () => {
  const events = Array.isArray(SPECIAL_EVENTS)
    ? SPECIAL_EVENTS
    : Object.values(SPECIAL_EVENTS)

  it('contains a non-empty list of special events', () => {
    expect(events.length).toBeGreaterThan(0)
  })

  it('ensures all events have unique IDs', () => {
    const ids = events.map(e => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  const validateEffect = effect => {
    expect(effect).toBeDefined()
    expect(typeof effect.type).toBe('string')

    switch (effect.type) {
      case 'stat':
        expect(typeof effect.stat).toBe('string')
        expect(Number.isFinite(effect.value)).toBe(true)
        break
      case 'item':
        expect(typeof effect.item).toBe('string')
        break
      case 'resource':
        expect(typeof effect.resource).toBe('string')
        expect(Number.isFinite(effect.value)).toBe(true)
        break
      case 'composite':
        expect(Array.isArray(effect.effects)).toBe(true)
        effect.effects.forEach(validateEffect)
        break
      default:
        // Other types might exist, but we should at least have a type
        expect(effect.type).toBeTruthy()
    }
  }

  const validateSkillCheck = sc => {
    expect(sc).toBeDefined()
    expect(typeof sc.stat).toBe('string')
    expect(Number.isFinite(sc.threshold)).toBe(true)
    validateEffect(sc.success)
    validateEffect(sc.failure)
  }

  it('verifies the schema for each special event', () => {
    events.forEach(event => {
      expect(typeof event.id).toBe('string')
      expect(event.category).toBe('special')
      expect(event.title).toMatch(/^events:/)
      expect(event.description).toMatch(/^events:/)
      expect(typeof event.trigger).toBe('string')
      expect(Number.isFinite(event.chance)).toBe(true)
      expect(event.chance).toBeGreaterThan(0)
      expect(event.chance).toBeLessThanOrEqual(1)

      expect(Array.isArray(event.options)).toBe(true)
      expect(event.options.length).toBeGreaterThan(0)

      event.options.forEach(option => {
        expect(option.label).toMatch(/^events:/)
        expect(option.outcomeText).toMatch(/^events:/)

        if (option.skillCheck) {
          validateSkillCheck(option.skillCheck)
        } else {
          validateEffect(option.effect)
        }
      })
    })
  })
})
