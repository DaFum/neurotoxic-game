import { test, describe } from 'node:test'
import assert from 'node:assert'
import { CRISIS_EVENTS } from '../../src/data/events/crisis.js'
import { validateCrisisEvent } from '../../src/utils/eventValidator.js'

describe('CRISIS_EVENTS', () => {
  const getCrisisEvent = id => {
    const evt = CRISIS_EVENTS.find(e => e.id === id)
    assert.ok(evt, `event not found: ${id}`)
    return evt
  }

  test('all crisis events have required fields', () => {
    assert.ok(CRISIS_EVENTS.length > 0)
    for (const evt of CRISIS_EVENTS) {
      assert.ok(evt.id, `Event missing id`)
      assert.ok(evt.category, `Event ${evt.id} missing category`)
      assert.ok(evt.title, `Event ${evt.id} missing title`)
      assert.ok(evt.description, `Event ${evt.id} missing description`)
      assert.ok(
        Array.isArray(evt.options),
        `Event ${evt.id} missing options array`
      )
      assert.ok(evt.options.length > 0, `Event ${evt.id} has empty options`)
      assert.ok(
        typeof evt.chance === 'number',
        `Event ${evt.id} missing or invalid chance`
      )
      assert.ok(
        typeof evt.trigger === 'string',
        `Event ${evt.id} missing trigger`
      )
      if (evt.condition) {
        assert.ok(
          typeof evt.condition === 'function',
          `Event ${evt.id} condition must be a function`
        )
      }
    }
  })

  test('crisis_redemption_charity conditions logic', () => {
    const evt = getCrisisEvent('crisis_redemption_charity')
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 40 } }),
      true
    )
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 39 } }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_sponsor_ultimatum conditions logic', () => {
    const evt = getCrisisEvent('crisis_sponsor_ultimatum')
    assert.strictEqual(
      evt.condition({
        social: { controversyLevel: 80, activeDeals: ['deal1'] }
      }),
      true
    )
    assert.strictEqual(
      evt.condition({
        social: { controversyLevel: 79, activeDeals: ['deal1'] }
      }),
      false
    )
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 80, activeDeals: [] } }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_poor_performance conditions logic', () => {
    const evt = getCrisisEvent('crisis_poor_performance')
    assert.strictEqual(
      evt.condition({ lastGigStats: { score: 29 }, eventCooldowns: [] }),
      true
    )
    assert.strictEqual(
      evt.condition({ lastGigStats: { score: 30 }, eventCooldowns: [] }),
      false
    )
    assert.strictEqual(
      evt.condition({
        lastGigStats: { score: 29 },
        eventCooldowns: ['crisis_poor_performance']
      }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_leaked_story conditions logic', () => {
    const evt = getCrisisEvent('crisis_leaked_story')
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 60 } }),
      true
    )
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 59 } }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_mass_unfollow conditions logic', () => {
    const evt = getCrisisEvent('crisis_mass_unfollow')
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 75 }, eventCooldowns: [] }),
      true
    )
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 74 }, eventCooldowns: [] }),
      false
    )
    assert.strictEqual(
      evt.condition({
        social: { controversyLevel: 75 },
        eventCooldowns: ['crisis_mass_unfollow']
      }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_ego_clash conditions logic', () => {
    const evt = getCrisisEvent('crisis_ego_clash')
    assert.strictEqual(
      evt.condition({ social: { egoFocus: 'member' }, band: { harmony: 39 } }),
      true
    )
    assert.strictEqual(
      evt.condition({ social: { egoFocus: 'member' }, band: { harmony: 40 } }),
      false
    )
    assert.strictEqual(evt.condition({ band: { harmony: 39 } }), false)
    assert.strictEqual(evt.condition({ social: { egoFocus: 'member' } }), false)
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_notice_50 conditions logic', () => {
    const evt = getCrisisEvent('crisis_notice_50')
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 50 }, activeStoryFlags: [] }),
      true
    )
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 49 }, activeStoryFlags: [] }),
      false
    )
    assert.strictEqual(
      evt.condition({
        social: { controversyLevel: 50 },
        activeStoryFlags: ['saw_crisis_50']
      }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_notice_80 conditions logic', () => {
    const evt = getCrisisEvent('crisis_notice_80')
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 80 }, activeStoryFlags: [] }),
      true
    )
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 79 }, activeStoryFlags: [] }),
      false
    )
    assert.strictEqual(
      evt.condition({
        social: { controversyLevel: 80 },
        activeStoryFlags: ['saw_crisis_80']
      }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  test('crisis_notice_100 conditions logic', () => {
    const evt = getCrisisEvent('crisis_notice_100')
    assert.strictEqual(
      evt.condition({
        social: { controversyLevel: 100 },
        activeStoryFlags: []
      }),
      true
    )
    assert.strictEqual(
      evt.condition({ social: { controversyLevel: 99 }, activeStoryFlags: [] }),
      false
    )
    assert.strictEqual(
      evt.condition({
        social: { controversyLevel: 100 },
        activeStoryFlags: ['saw_crisis_100']
      }),
      false
    )
    assert.strictEqual(evt.condition({}), false)
  })

  describe('validateCrisisEvent', () => {
    test('validates existing crisis events without throwing', () => {
      for (const event of CRISIS_EVENTS) {
        assert.doesNotThrow(() => validateCrisisEvent(event))
      }
    })

    test('throws error for missing fields', () => {
      const invalidEvent = { ...CRISIS_EVENTS[0] }
      delete invalidEvent.id
      assert.throws(() => validateCrisisEvent(invalidEvent), /Invalid event id/)
    })

    test('throws error for invalid types', () => {
      const invalidEvent = { ...CRISIS_EVENTS[0], chance: 'high' }
      assert.throws(() => validateCrisisEvent(invalidEvent), /Invalid chance/)
    })

    test('throws error for invalid categories', () => {
      const invalidEvent = { ...CRISIS_EVENTS[0], category: 'invalid' }
      assert.throws(() => validateCrisisEvent(invalidEvent), /Invalid category/)
    })

    test('throws error for missing crisis tag', () => {
      const invalidEvent = { ...CRISIS_EVENTS[0], tags: ['reputation'] }
      assert.throws(
        () => validateCrisisEvent(invalidEvent),
        /must have "crisis" tag/
      )
    })

    test('throws error for invalid i18n keys', () => {
      const invalidEvent = { ...CRISIS_EVENTS[0], title: 'bad_title' }
      assert.throws(
        () => validateCrisisEvent(invalidEvent),
        /Invalid title key/
      )
    })

    test('throws error for empty options', () => {
      const invalidEvent = { ...CRISIS_EVENTS[0], options: [] }
      assert.throws(
        () => validateCrisisEvent(invalidEvent),
        /must have at least one option/
      )
    })

    test('throws error for composite effect with empty effects array', () => {
      const invalidEvent = {
        ...CRISIS_EVENTS[0],
        options: [
          {
            label: 'events:test_label',
            outcomeText: 'events:test_outcome',
            effect: { type: 'composite', effects: [] }
          }
        ]
      }
      assert.throws(
        () => validateCrisisEvent(invalidEvent),
        /Composite effect must have a non-empty effects array/
      )
    })

    test('throws error for composite effect with invalid child effect', () => {
      const invalidEvent = {
        ...CRISIS_EVENTS[0],
        options: [
          {
            label: 'events:test_label',
            outcomeText: 'events:test_outcome',
            effect: { type: 'composite', effects: [{}] } // Missing type
          }
        ]
      }
      assert.throws(
        () => validateCrisisEvent(invalidEvent),
        /Invalid child effect at composite index 0 for option index 0/
      )
    })
  })
})
