import { describe, it } from 'node:test'
import assert from 'node:assert'
import { FINANCIAL_EVENTS } from '../src/data/events/financial.js'

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
    assert.strictEqual(unexpectedBill.options[0].effect.type, 'percentage_resource')
  })
})
