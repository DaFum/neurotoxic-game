import { describe, it, expect } from 'vitest'
import { CONSEQUENCE_EVENTS } from '../../../src/data/events/consequences.js'

describe('Consequence Events Data', () => {
  it('should be an array of event objects', () => {
    expect(Array.isArray(CONSEQUENCE_EVENTS)).toBe(true)
    expect(CONSEQUENCE_EVENTS.length).toBeGreaterThan(0)
  })

  it('each event should have required properties', () => {
    CONSEQUENCE_EVENTS.forEach(event => {
      expect(typeof event.id).toBe('string')
      expect(event.id.length).toBeGreaterThan(0)
      expect(typeof event.category).toBe('string')
      expect(event.category.length).toBeGreaterThan(0)
      expect(typeof event.title).toBe('string')
      expect(event.title.length).toBeGreaterThan(0)
      expect(typeof event.description).toBe('string')
      expect(event.description.length).toBeGreaterThan(0)
      expect(Array.isArray(event.options)).toBe(true)
      expect(event.options.length).toBeGreaterThan(0)
    })
  })

  it('each option should have a label and either an effect or a skillCheck', () => {
    CONSEQUENCE_EVENTS.forEach(event => {
      event.options.forEach((option, index) => {
        expect(typeof option.label).toBe('string')
        expect(option.label.length).toBeGreaterThan(0)
        const hasEffect =
          typeof option.effect === 'object' && option.effect !== null
        const hasSkillCheck =
          typeof option.skillCheck === 'object' && option.skillCheck !== null
        expect(hasEffect || hasSkillCheck).toBe(true)
      })
    })
  })
})
