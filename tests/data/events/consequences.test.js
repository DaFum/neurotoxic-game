import { describe, it } from 'vitest'
import assert from 'node:assert'
import { CONSEQUENCE_EVENTS } from '../../../src/data/events/consequences'
import { KNOWN_EVENT_IDS } from '../../../src/data/events'
import { QUEST_REGISTRY } from '../../../src/data/questRegistry'

describe('Consequence Events Data', () => {
  it('should be an array of event objects', () => {
    assert.ok(Array.isArray(CONSEQUENCE_EVENTS))
    assert.ok(CONSEQUENCE_EVENTS.length > 0)
  })

  it('each event should have required properties', () => {
    CONSEQUENCE_EVENTS.forEach(event => {
      assert.ok(
        typeof event.id === 'string' && event.id.length > 0,
        `Event missing id`
      )
      assert.ok(
        typeof event.category === 'string' && event.category.length > 0,
        `Event ${event.id} missing category`
      )
      assert.ok(
        typeof event.title === 'string' && event.title.length > 0,
        `Event ${event.id} missing title`
      )
      assert.ok(
        typeof event.description === 'string' && event.description.length > 0,
        `Event ${event.id} missing description`
      )
      assert.ok(
        Array.isArray(event.options) && event.options.length > 0,
        `Event ${event.id} missing or empty options array`
      )
    })
  })

  it('each option should have a label and either an effect or a skillCheck', () => {
    CONSEQUENCE_EVENTS.forEach(event => {
      event.options.forEach(option => {
        assert.ok(
          typeof option.label === 'string' && option.label.length > 0,
          `Event ${event.id} missing label`
        )
        const hasEffect =
          typeof option.effect === 'object' && option.effect !== null
        const hasSkillCheck =
          typeof option.skillCheck === 'object' && option.skillCheck !== null
        assert.ok(
          hasEffect || hasSkillCheck,
          `Event ${event.id} must have either effect or skillCheck`
        )
      })
    })
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
