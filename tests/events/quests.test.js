import { test, describe } from 'node:test'
import assert from 'node:assert'
import { QUEST_EVENTS } from '../../src/data/events/quests.js'

describe('QUEST_EVENTS', () => {
  test('all quest events have required fields', () => {
    assert.ok(QUEST_EVENTS.length > 0)
    for (const evt of QUEST_EVENTS) {
      assert.ok(evt.id, `Event missing id`)
      assert.ok(evt.category, `Event ${evt.id} missing category`)
      assert.ok(evt.title, `Event ${evt.id} missing title`)
      assert.ok(evt.description, `Event ${evt.id} missing description`)
      assert.ok(Array.isArray(evt.options), `Event ${evt.id} missing options array`)
      assert.ok(evt.options.length > 0, `Event ${evt.id} has empty options`)
      assert.ok(typeof evt.chance === 'number', `Event ${evt.id} missing or invalid chance`)
      assert.ok(typeof evt.trigger === 'string', `Event ${evt.id} missing trigger`)
      if (evt.condition) {
         assert.ok(typeof evt.condition === 'function', `Event ${evt.id} condition must be a function`)
      }
    }
  })

  test('quest_trigger_pick_of_destiny conditions logic', () => {
     const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_pick_of_destiny')
     assert.strictEqual(evt.condition({ activeQuests: [] }), true)
     assert.strictEqual(evt.condition({ activeQuests: [{ id: 'some' }] }), false)
     assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_viral_dance conditions logic', () => {
     const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_viral_dance')
     assert.strictEqual(evt.condition({ activeQuests: [], social: { tiktok: 4999 } }), true)
     assert.strictEqual(evt.condition({ activeQuests: [], social: { tiktok: 5000 } }), false)
     assert.strictEqual(evt.condition({ activeQuests: [{ id: 'some' }], social: { tiktok: 4999 } }), false)
     assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_sponsor_demand conditions logic', () => {
     const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_sponsor_demand')
     assert.strictEqual(evt.condition({ activeQuests: [] }), true)
     assert.strictEqual(evt.condition({ activeQuests: [{ id: 'some' }] }), false)
     assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_harmony_project conditions logic', () => {
     const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_harmony_project')
     assert.strictEqual(evt.condition({ activeQuests: [], band: { harmony: 59 } }), true)
     assert.strictEqual(evt.condition({ activeQuests: [], band: { harmony: 60 } }), false)
     assert.strictEqual(evt.condition({ activeQuests: [{ id: 'some' }], band: { harmony: 59 } }), false)
     assert.strictEqual(evt.condition({}), true)
  })

  test('quest_trigger_local_legend conditions logic', () => {
     const evt = QUEST_EVENTS.find(e => e.id === 'quest_trigger_local_legend')
     assert.strictEqual(evt.condition({ activeQuests: [] }), true)
     assert.strictEqual(evt.condition({ activeQuests: [{ id: 'some' }] }), false)
     assert.strictEqual(evt.condition({}), true)
  })
})
