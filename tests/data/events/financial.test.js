import { describe, it } from 'node:test'
import assert from 'node:assert'
import { FINANCIAL_EVENTS } from '../../../src/data/events/financial.js'

describe('Financial Events Data', () => {
  it('should be an array of event objects', () => {
    assert.ok(Array.isArray(FINANCIAL_EVENTS))
    assert.ok(FINANCIAL_EVENTS.length > 0)
  })

  it('each event should have required properties', () => {
    FINANCIAL_EVENTS.forEach(event => {
      assert.ok(
        typeof event.id === 'string' && event.id.length > 0,
        `Event missing id`
      )
      assert.ok(
        typeof event.category === 'string' && event.category.length > 0,
        `Event ${event.id} missing category`
      )
      assert.ok(
        typeof event.title === 'string' && event.title.length > 0,
        `Event ${event.id} missing title`
      )
      assert.ok(
        typeof event.description === 'string' && event.description.length > 0,
        `Event ${event.id} missing description`
      )
      assert.ok(
        Array.isArray(event.options) && event.options.length > 0,
        `Event ${event.id} missing or empty options array`
      )
    })
  })

  it('each option should have a label and either an effect or a skillCheck', () => {
    FINANCIAL_EVENTS.forEach(event => {
      event.options.forEach(option => {
        assert.ok(
          typeof option.label === 'string' && option.label.length > 0,
          `Event ${event.id} missing label`
        )
        const hasEffect =
          typeof option.effect === 'object' && option.effect !== null
        const hasSkillCheck =
          typeof option.skillCheck === 'object' && option.skillCheck !== null
        assert.ok(
          hasEffect || hasSkillCheck,
          `Event ${event.id} must have either effect or skillCheck`
        )
      })
    })
  })
})
