import { describe, it } from 'vitest'
import assert from 'node:assert'
import { CONSEQUENCE_EVENTS } from '../../../src/data/events/consequences'
import { KNOWN_EVENT_IDS } from '../../../src/data/events'
import { QUEST_REGISTRY } from '../../../src/data/questRegistry'
import { validateGameEvent } from '../../../src/utils/eventValidator.ts'

describe('Consequence Events Data', () => {
  it('all consequence events pass structural validation', () => {
    for (const event of CONSEQUENCE_EVENTS) {
      assert.doesNotThrow(() => validateGameEvent(event), event.id)
    }
  })

  it('every quest event.queue penalty/reward references a known event id', () => {
    for (const [questId, quest] of Object.entries(QUEST_REGISTRY)) {
      const entries = [
        ...(quest.failurePenalties ?? []),
        ...(quest.rewards ?? [])
      ]
      for (const entry of entries) {
        if (entry.type !== 'event.queue') continue
        assert.ok(
          KNOWN_EVENT_IDS.has(entry.eventId),
          `Quest ${questId} queues unknown event id "${entry.eventId}"`
        )
      }
    }
  })

  it('event_bad_press condition fires only while pending', () => {
    const event = CONSEQUENCE_EVENTS.find(e => e.id === 'event_bad_press')
    assert.ok(event, 'event_bad_press must be defined')
    assert.strictEqual(
      event.condition({ pendingEvents: ['event_bad_press'] }),
      true
    )
    assert.strictEqual(event.condition({ pendingEvents: [] }), false)
  })
})
