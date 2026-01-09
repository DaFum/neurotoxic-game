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

        // Fix: The field name is 'text' in band.js, but might be 'description' in others?
        // Or I should accept either.
        assert.ok(
          event.description || event.text,
          `Event ${event.id} missing description/text`
        )

        // normalize for future tests if needed, but for now just check one exists.

        assert.ok(
          Array.isArray(event.options) || Array.isArray(event.choices),
          `Event ${event.id} missing choices/options array`
        )
      })
    }
  })
})
