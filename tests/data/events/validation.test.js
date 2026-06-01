import { test, vi } from 'vitest'
import assert from 'node:assert'

// QUEST_EVENTS contains events that are also `category: 'transport'`
// (e.g. quest_trigger_tourbus_inspection). They route into EVENTS_DB.transport
// too, so we have to mock them out to isolate the transport-only validation
// behaviour this test asserts.
vi.mock('../../../src/data/events/quests', () => ({ QUEST_EVENTS: [] }))

// Mock the transport events module
vi.mock('../../../src/data/events/transport', () => ({
  TRANSPORT_EVENTS: [
    {
      id: 'events:valid_event',
      title: 'events:valid',
      description: 'events:desc',
      category: 'transport',
      options: [
        {
          id: 'opt1',
          label: 'events:Option 1',
          outcomeText: 'events:Outcome',
          effect: { type: 'money', value: 100 }
        }
      ]
    },
    { category: 'transport', description: 'events:Missing ID' }, // Invalid: Missing ID
    {
      id: 'events:valid_event',
      title: 'events:dup',
      description: 'events:Duplicate ID',
      category: 'transport',
      options: [
        {
          id: 'opt1',
          label: 'events:Option 1',
          outcomeText: 'events:Outcome',
          effect: { type: 'money', value: 100 }
        }
      ]
    } // Invalid: Duplicate ID
  ]
}))

// Dynamic import to ensure mock is applied
const { EVENTS_DB } = await import('../../../src/data/events/index')

test('Event validation filters out invalid events', async _t => {
  const transportEvents = EVENTS_DB.transport

  // Verify behavior: invalid events should be filtered out
  assert.strictEqual(
    transportEvents.length,
    1,
    'Should contain only valid events'
  )
  assert.strictEqual(
    transportEvents[0].id,
    'events:valid_event',
    'Should be the valid event'
  )
  assert.strictEqual(
    transportEvents[0].description,
    'events:desc',
    'Should be the correct valid event'
  )
})
