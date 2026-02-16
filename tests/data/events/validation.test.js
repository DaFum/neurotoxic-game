import { test, mock } from 'node:test'
import assert from 'node:assert'

// Mock the transport events module
mock.module('../../../src/data/events/transport.js', {
  namedExports: {
    TRANSPORT_EVENTS: [
      { id: 'valid_event', category: 'transport', description: 'Valid Event' },
      { category: 'transport', description: 'Missing ID' }, // Invalid: Missing ID
      { id: 'valid_event', category: 'transport', description: 'Duplicate ID' } // Invalid: Duplicate ID
    ]
  }
})

// Dynamic import to ensure mock is applied
const { EVENTS_DB } = await import('../../../src/data/events/index.js')

test('Event validation filters out invalid events', async t => {
  const transportEvents = EVENTS_DB.transport

  // Verify behavior: invalid events should be filtered out
  assert.strictEqual(
    transportEvents.length,
    1,
    'Should contain only valid events'
  )
  assert.strictEqual(
    transportEvents[0].id,
    'valid_event',
    'Should be the valid event'
  )
  assert.strictEqual(
    transportEvents[0].description,
    'Valid Event',
    'Should be the correct valid event'
  )
})
