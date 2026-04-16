import { describe, it } from 'node:test'
import assert from 'node:assert'
import { CONSEQUENCE_EVENTS } from '../../src/data/events/consequences.js'

describe('Consequences Event Pool', () => {
  it('should export an array of consequence events', () => {
    assert.strictEqual(Array.isArray(CONSEQUENCE_EVENTS), true)
    assert.ok(CONSEQUENCE_EVENTS.length > 0)
  })

  it('each event should have the correct shape', () => {
    CONSEQUENCE_EVENTS.forEach(event => {
      assert.ok(event.id)
      assert.strictEqual(typeof event.id, 'string')
      assert.ok(event.category)
      assert.strictEqual(typeof event.category, 'string')
      assert.ok(event.title)
      assert.strictEqual(event.title.startsWith('events:'), true)
      assert.ok(event.options)
      assert.strictEqual(Array.isArray(event.options), true)
    })
  })

  it('evaluates conditions properly', () => {
    const venueComplaint = CONSEQUENCE_EVENTS.find(
      e => e.id === 'consequences_venue_complaint'
    )
    assert.ok(venueComplaint)

    // Condition: score < 30 and no cooldown
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 20 },
        eventCooldowns: []
      }),
      true
    )
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 40 },
        eventCooldowns: []
      }),
      false
    )
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 20 },
        eventCooldowns: ['consequences_venue_complaint']
      }),
      false
    )
  })
})
