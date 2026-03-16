// TODO: Implement this
import { test, describe } from 'node:test'
import assert from 'node:assert'
import { CRISIS_EVENTS } from '../../src/data/events/crisis.js'

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
})
