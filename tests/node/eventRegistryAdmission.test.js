import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const valid = id => ({
  id,
  category: 'transport',
  title: 'events:fixture.title',
  description: 'events:fixture.description',
  options: [
    {
      label: 'events:fixture.option',
      outcomeText: 'events:fixture.outcome',
      effect: { type: 'stat', stat: 'harmony', value: 1 }
    }
  ]
})

mock.module('../../src/data/events/transport.ts', {
  namedExports: {
    TRANSPORT_EVENTS: [
      valid('fixture_accepted'),
      { ...valid('fixture_invalid_category'), category: 'unknown' },
      { ...valid('fixture_invalid_schema'), options: [] },
      // Rejected IDs still reserve their duplicate slot in the raw registry.
      valid('fixture_invalid_schema'),
      { ...valid('fixture_accepted'), title: 'events:duplicate.title' }
    ]
  }
})

const { EVENTS_DB, KNOWN_EVENT_IDS } =
  await import('../../src/data/events/index.ts')

test('known IDs contain only admitted events and do not reuse rejected IDs', () => {
  assert.equal(KNOWN_EVENT_IDS.has('fixture_accepted'), true)
  assert.equal(KNOWN_EVENT_IDS.has('fixture_invalid_category'), false)
  assert.equal(KNOWN_EVENT_IDS.has('fixture_invalid_schema'), false)
  const accepted = EVENTS_DB.transport.filter(
    event => event.id === 'fixture_accepted'
  )
  assert.equal(accepted.length, 1)
  assert.equal(accepted[0].title, 'events:fixture.title')
})
