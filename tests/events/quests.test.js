import { test, describe } from 'node:test'
import assert from 'node:assert'
import { QUEST_EVENTS } from '../../src/data/events/quests'
import { validateGameEvent } from '../../src/utils/eventValidator.ts'

describe('QUEST_EVENTS', () => {
  test('all quest events pass structural validation', () => {
    for (const event of QUEST_EVENTS) {
      assert.doesNotThrow(() => validateGameEvent(event), event.id)
    }
  })

  test('quest_trigger_pick_of_destiny conditions logic', () => {
    assert.ok(QUEST_EVENTS.length > 0)
    const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_pick_of_destiny')
    assert.ok(evt, 'quest event not found')
    assert.strictEqual(evt.condition({ activeQuests: [] }), true)
    assert.strictEqual(evt.condition({ activeQuests: [{ id: 'some' }] }), true)
    assert.strictEqual(
      evt.condition({ activeQuests: [{ id: 'quest_pick_of_destiny' }] }),
      false
    )
    assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_viral_dance conditions logic', () => {
    const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_viral_dance')
    assert.ok(evt, 'quest event not found')
    assert.strictEqual(
      evt.condition({ activeQuests: [], social: { tiktok: 4999 } }),
      true
    )
    assert.strictEqual(
      evt.condition({ activeQuests: [], social: { tiktok: 5000 } }),
      false
    )
    assert.strictEqual(
      evt.condition({
        activeQuests: [{ id: 'some' }],
        social: { tiktok: 4999 }
      }),
      true
    )
    assert.strictEqual(
      evt.condition({
        activeQuests: [{ id: 'quest_viral_dance' }],
        social: { tiktok: 4999 }
      }),
      false
    )
    assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_sponsor_demand conditions logic', () => {
    const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_sponsor_demand')
    assert.ok(evt, 'quest event not found')
    assert.strictEqual(evt.condition({ activeQuests: [] }), true)
    assert.strictEqual(evt.condition({ activeQuests: [{ id: 'some' }] }), true)
    assert.strictEqual(
      evt.condition({ activeQuests: [{ id: 'quest_sponsor_demand' }] }),
      false
    )
    assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_harmony_project conditions logic', () => {
    const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_harmony_project')
    assert.ok(evt, 'quest event not found')
    assert.strictEqual(
      evt.condition({ activeQuests: [], band: { harmony: 59 } }),
      true
    )
    assert.strictEqual(
      evt.condition({ activeQuests: [], band: { harmony: 60 } }),
      false
    )
    assert.strictEqual(
      evt.condition({ activeQuests: [{ id: 'some' }], band: { harmony: 59 } }),
      true
    )
    assert.strictEqual(
      evt.condition({
        activeQuests: [
          { id: 'quest_pick_of_destiny' },
          { id: 'quest_studio_demo' },
          { id: 'quest_merch_rush' }
        ],
        band: { harmony: 59 }
      }),
      false
    )
    assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_local_legend conditions logic', () => {
    const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_local_legend')
    assert.ok(evt, 'quest event not found')
    // The condition now also routes through canAcceptQuest, which requires
    // a player.location for a perRegion quest's scope key.
    const ctx = { activeQuests: [], player: { location: 'berlin' } }
    assert.strictEqual(evt.condition(ctx), true)
    assert.strictEqual(
      evt.condition({ ...ctx, activeQuests: [{ id: 'some' }] }),
      true
    )
    assert.strictEqual(
      evt.condition({
        ...ctx,
        activeQuests: [{ id: 'quest_local_legend' }]
      }),
      false
    )
    // Empty state: no location → scope guard refuses, condition is false.
    assert.strictEqual(evt.condition({}), false)
  })
})
