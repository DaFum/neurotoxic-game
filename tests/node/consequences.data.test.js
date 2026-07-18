import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CONSEQUENCE_EVENTS } from '../../src/data/events/consequences'

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

    // Condition: accuracy < 30 (or failed gig) and no cooldown; the raw
    // score is irrelevant for gating.
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 2400, accuracy: 20 },
        eventCooldowns: []
      }),
      true
    )
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 5600, accuracy: 40 },
        eventCooldowns: []
      }),
      false
    )
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 1200 },
        eventCooldowns: []
      }),
      false
    )
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 12000, accuracy: 88, failed: true },
        eventCooldowns: []
      }),
      true
    )
    assert.strictEqual(
      venueComplaint.condition({
        lastGigStats: { score: 2400, accuracy: 20 },
        eventCooldowns: ['consequences_venue_complaint']
      }),
      false
    )
  })
})
