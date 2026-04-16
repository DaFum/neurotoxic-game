import { test, describe } from 'node:test'
import assert from 'node:assert'
import { SPECIAL_EVENTS } from '../../src/data/events/special'

describe('SPECIAL_EVENTS', () => {
  const validateEffect = (effect, eventId, optIdx) => {
    assert.ok(
      effect && typeof effect === 'object',
      `Event ${eventId} option ${optIdx} effect must be an object`
    )
    assert.ok(
      effect.type,
      `Event ${eventId} option ${optIdx} effect missing type`
    )

    if (effect.type === 'composite') {
      assert.ok(
        Array.isArray(effect.effects),
        `Event ${eventId} option ${optIdx} composite effect missing effects array`
      )
      assert.ok(
        effect.effects.length > 0,
        `Event ${eventId} option ${optIdx} composite effect has empty effects array`
      )
      effect.effects.forEach((childEffect, childIdx) => {
        validateEffect(childEffect, eventId, `${optIdx}.${childIdx}`)
      })
    }
  }

  test('all special events have required fields and correct structure', () => {
    assert.ok(Array.isArray(SPECIAL_EVENTS), 'SPECIAL_EVENTS is not an array')
    assert.ok(SPECIAL_EVENTS.length > 0, 'SPECIAL_EVENTS array is empty')

    const seenIds = new Set()
    for (const evt of SPECIAL_EVENTS) {
      assert.ok(evt.id, `Event missing id`)
      assert.ok(!seenIds.has(evt.id), `Duplicate event id: ${evt.id}`)
      seenIds.add(evt.id)

      assert.strictEqual(
        evt.category,
        'special',
        `Event ${evt.id} has incorrect category`
      )
      assert.ok(
        evt.title && evt.title.startsWith('events:'),
        `Event ${evt.id} invalid title key`
      )
      assert.ok(
        evt.description && evt.description.startsWith('events:'),
        `Event ${evt.id} invalid description key`
      )
      assert.strictEqual(
        typeof evt.trigger,
        'string',
        `Event ${evt.id} missing trigger`
      )
      assert.ok(
        typeof evt.chance === 'number' && evt.chance >= 0 && evt.chance <= 1,
        `Event ${evt.id} invalid chance: ${evt.chance}`
      )

      assert.ok(
        Array.isArray(evt.options),
        `Event ${evt.id} missing options array`
      )
      assert.ok(evt.options.length > 0, `Event ${evt.id} has empty options`)

      evt.options.forEach((opt, idx) => {
        assert.ok(
          opt.label && opt.label.startsWith('events:'),
          `Event ${evt.id} option ${idx} invalid label`
        )
        assert.ok(
          opt.outcomeText && opt.outcomeText.startsWith('events:'),
          `Event ${evt.id} option ${idx} invalid outcomeText`
        )

        assert.ok(
          opt.effect || opt.skillCheck,
          `Event ${evt.id} option ${idx} must have effect or skillCheck`
        )

        if (opt.effect) {
          validateEffect(opt.effect, evt.id, idx)
        }

        if (opt.skillCheck) {
          assert.strictEqual(
            typeof opt.skillCheck.stat,
            'string',
            `Event ${evt.id} option ${idx} skillCheck missing stat`
          )
          assert.strictEqual(
            typeof opt.skillCheck.threshold,
            'number',
            `Event ${evt.id} option ${idx} skillCheck missing threshold`
          )
          assert.ok(
            opt.skillCheck.success &&
              typeof opt.skillCheck.success === 'object',
            `Event ${evt.id} option ${idx} skillCheck missing success object`
          )
          assert.ok(
            opt.skillCheck.failure &&
              typeof opt.skillCheck.failure === 'object',
            `Event ${evt.id} option ${idx} skillCheck missing failure object`
          )

          validateEffect(opt.skillCheck.success, evt.id, `${idx}.success`)
          validateEffect(opt.skillCheck.failure, evt.id, `${idx}.failure`)
        }
      })
    }
  })
})
