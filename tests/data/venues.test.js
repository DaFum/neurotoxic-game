import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ALL_VENUES } from '../../src/data/venues.js'

test('ALL_VENUES data integrity', () => {
  assert.ok(Array.isArray(ALL_VENUES), 'ALL_VENUES should be an array')
  assert.ok(ALL_VENUES.length > 0, 'ALL_VENUES should not be empty')

  const validTypes = ['HOME', 'VENUE', 'FESTIVAL']
  const ids = new Set()

  ALL_VENUES.forEach((venue, index) => {
    // Check required basic fields
    assert.strictEqual(typeof venue.id, 'string', `venue at index ${index} should have a string id`)
    assert.ok(venue.id.length > 0, `venue at index ${index} id should not be empty`)

    // Check for duplicate IDs
    assert.ok(!ids.has(venue.id), `Duplicate venue ID found: ${venue.id}`)
    ids.add(venue.id)

    assert.strictEqual(typeof venue.name, 'string', `venue ${venue.id} should have a string name`)
    assert.ok(venue.name.startsWith('venues:'), `venue ${venue.id} name should start with 'venues:'`)

    assert.strictEqual(typeof venue.x, 'number', `venue ${venue.id} should have a numeric x coordinate`)
    assert.strictEqual(typeof venue.y, 'number', `venue ${venue.id} should have a numeric y coordinate`)

    assert.ok(validTypes.includes(venue.type), `venue ${venue.id} has invalid type: ${venue.type}`)
    assert.strictEqual(typeof venue.capacity, 'number', `venue ${venue.id} should have a numeric capacity`)

    // Check type-specific fields
    if (venue.type !== 'HOME') {
      assert.strictEqual(typeof venue.pay, 'number', `venue ${venue.id} should have a numeric pay`)
      assert.strictEqual(typeof venue.diff, 'number', `venue ${venue.id} should have a numeric diff`)
      assert.strictEqual(typeof venue.price, 'number', `venue ${venue.id} should have a numeric price`)
    }
  })
})
