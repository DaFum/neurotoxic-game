import { describe, it, vi } from "vitest";
import assert from 'node:assert'
import { SPECIAL_EVENTS } from '../../../src/data/events/special.js'

describe('SPECIAL_EVENTS data module', () => {
  it('should be an array of special events', () => {
    assert(Array.isArray(SPECIAL_EVENTS), 'SPECIAL_EVENTS should be an array')
    assert(SPECIAL_EVENTS.length > 0, 'SPECIAL_EVENTS should not be empty')
  })

  it('each event should follow the strict schema', () => {
    const ids = new Set()
    for (const event of SPECIAL_EVENTS) {
      assert(event.id, `Event missing id: ${JSON.stringify(event)}`)
      assert(!ids.has(event.id), `Duplicate event id found: ${event.id}`)
      ids.add(event.id)

      assert.strictEqual(
        event.category,
        'special',
        `Event ${event.id} must have category "special"`
      )

      assert(
        typeof event.title === 'string' && event.title.startsWith('events:'),
        `Event ${event.id} title must be an i18n key starting with 'events:'`
      )
      assert(
        typeof event.description === 'string' &&
          event.description.startsWith('events:'),
        `Event ${event.id} description must be an i18n key starting with 'events:'`
      )

      assert(
        Array.isArray(event.options),
        `Event ${event.id} options must be an array`
      )
      assert(
        event.options.length > 0,
        `Event ${event.id} must have at least one option`
      )

      for (const option of event.options) {
        assert(
          typeof option.label === 'string' &&
            option.label.startsWith('events:'),
          `Event ${event.id} option label must be an i18n key`
        )
        assert(
          typeof option.outcomeText === 'string' &&
            option.outcomeText.startsWith('events:'),
          `Event ${event.id} option outcomeText must be an i18n key`
        )

        assert(
          option.effect || option.skillCheck,
          `Event ${event.id} option must have an effect or skillCheck`
        )

        if (option.effect) {
          const validTypes = [
            'stat',
            'item',
            'resource',
            'composite',
            'relationship',
            'stat_increment',
            'unlock',
            'game_over',
            'flag',
            'cooldown',
            'social_set',
            'chain',
            'quest'
          ]
          assert(
            validTypes.includes(option.effect.type),
            `Event ${event.id} option effect type invalid: ${option.effect.type}`
          )
          if (option.effect.type === 'composite') {
            assert(
              Array.isArray(option.effect.effects),
              'composite effect requires effects array'
            )
          }
        }

        if (option.skillCheck) {
          assert(
            typeof option.skillCheck.stat === 'string',
            `Event ${event.id} skillCheck stat invalid`
          )
          assert(
            typeof option.skillCheck.threshold === 'number',
            `Event ${event.id} skillCheck threshold invalid`
          )
          assert(
            typeof option.skillCheck.success === 'object',
            `Event ${event.id} skillCheck success effect invalid`
          )
          assert(
            typeof option.skillCheck.failure === 'object',
            `Event ${event.id} skillCheck failure effect invalid`
          )
        }
      }
    }
  })
})
