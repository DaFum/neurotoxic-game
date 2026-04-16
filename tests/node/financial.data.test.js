import { describe, it } from 'node:test'
import assert from 'node:assert'
import { FINANCIAL_EVENTS } from '../../src/data/events/financial.js'
import { CRISIS_EVENTS } from '../../src/data/events/crisis.js'

describe('Financial Events', () => {
  it('should export an array of financial events', () => {
    assert.strictEqual(Array.isArray(FINANCIAL_EVENTS), true)
    assert.ok(FINANCIAL_EVENTS.length > 0)
  })

  it('each event should have the correct properties', () => {
    FINANCIAL_EVENTS.forEach(event => {
      assert.ok(event.id)
      assert.strictEqual(typeof event.id, 'string')
      assert.strictEqual(event.category, 'financial')
      assert.ok(event.title)
      assert.strictEqual(event.title.startsWith('events:'), true)
      assert.ok(event.trigger)
      assert.ok(event.chance !== undefined)
      assert.strictEqual(typeof event.chance, 'number')
      assert.ok(event.options)
      assert.strictEqual(Array.isArray(event.options), true)
      assert.ok(event.options.length > 0)
    })
  })

  it('validates the presence of a specific event', () => {
    const unexpectedBill = FINANCIAL_EVENTS.find(
      e => e.id === 'unexpected_bill'
    )
    assert.ok(unexpectedBill)
    const effect = unexpectedBill.options[0].effect
    assert.strictEqual(effect.type, 'percentage_resource')
    assert.strictEqual(effect.resource, 'money')
    assert.strictEqual(effect.percentage, -15)
    assert.strictEqual(effect.min, -80)
  })

  it('validates crisis_redemption_charity option 1 applies exactly +15 harmony', () => {
    const charityEvent = CRISIS_EVENTS.find(
      e => e.id === 'crisis_redemption_charity'
    )
    assert.ok(charityEvent)

    // Opt 1 is a composite effect. Find the harmony stat modifier.
    const compositeEffects = charityEvent.options[0].effect.effects
    const harmonyEffect = compositeEffects.find(eff => eff.stat === 'harmony')

    assert.ok(harmonyEffect)
    assert.strictEqual(harmonyEffect.type, 'stat')
    assert.strictEqual(harmonyEffect.value, 15)
  })
})
