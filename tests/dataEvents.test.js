import assert from 'node:assert'
import { test } from 'node:test'
import { EVENTS_DB } from '../src/data/events/index.js'

test('EVENTS_DB integrity', () => {
  assert.ok(EVENTS_DB)
  // Check categories
  ;['band', 'financial', 'gig', 'transport', 'special'].forEach(cat => {
    if (EVENTS_DB[cat]) {
      assert.ok(Array.isArray(EVENTS_DB[cat]), `${cat} should be an array`)
      EVENTS_DB[cat].forEach(event => {
        assert.ok(event.id, `Event in ${cat} missing id`)
        assert.ok(event.title, `Event ${event.id} missing title`)

        assert.ok(event.description, `Event ${event.id} missing description`)

        assert.ok(
          Array.isArray(event.options) || Array.isArray(event.choices),
          `Event ${event.id} missing choices/options array`
        )
      })
    }
  })
})
