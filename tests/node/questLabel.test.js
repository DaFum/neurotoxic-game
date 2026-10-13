import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getQuestDisplayLabel,
  resolveQuestLabelKey
} from '../../src/utils/questLabel.ts'
import { getQuestToastName } from '../../src/domain/questHelpers.ts'

// Echo translator: returns the defaultValue so fallbacks are observable.
const echoT = (key, options) =>
  typeof options?.defaultValue === 'string' ? options.defaultValue : key

const calls = []
const recordingT = (key, options) => {
  calls.push({ key, options })
  return `T(${key})`
}

test('resolveQuestLabelKey prefers title, then label, then registry, then id', () => {
  assert.equal(resolveQuestLabelKey({ id: 'q', title: 'T', label: 'L' }), 'T')
  assert.equal(resolveQuestLabelKey({ id: 'q', label: 'L' }), 'L')
  assert.equal(
    resolveQuestLabelKey({ id: 'quest_region_takeover' }),
    'ui:quests.regionTakeover.title'
  )
  assert.equal(resolveQuestLabelKey({ id: 'ad_hoc_quest' }), 'ad_hoc_quest')
  assert.equal(
    resolveQuestLabelKey('quest_pick_of_destiny'),
    'events:quest_pick_of_destiny.label'
  )
  assert.equal(resolveQuestLabelKey('ad_hoc_quest'), 'ad_hoc_quest')
})

test('resolveQuestLabelKey rejects malformed input', () => {
  assert.equal(resolveQuestLabelKey(null), undefined)
  assert.equal(resolveQuestLabelKey(5), undefined)
  assert.equal(resolveQuestLabelKey(''), undefined)
  assert.equal(resolveQuestLabelKey({ label: 7 }), undefined)
})

test('getQuestDisplayLabel translates the resolved key with an id fallback', () => {
  calls.length = 0
  assert.equal(
    getQuestDisplayLabel(recordingT, {
      id: 'quest_sponsor_demand',
      label: 'events:quest_sponsor_demand.label'
    }),
    'T(events:quest_sponsor_demand.label)'
  )
  assert.deepEqual(calls[0].options, { defaultValue: 'quest_sponsor_demand' })

  // Raw (non-key) labels are their own fallback.
  assert.equal(
    getQuestDisplayLabel(echoT, { id: 'q', label: 'Plain Label' }),
    'Plain Label'
  )
  // Registry-backed bare id.
  calls.length = 0
  getQuestDisplayLabel(recordingT, 'quest_region_takeover')
  assert.deepEqual(calls[0], {
    key: 'ui:quests.regionTakeover.title',
    options: { defaultValue: 'quest_region_takeover' }
  })
})

test('getQuestDisplayLabel shows the unknown-quest label for malformed input', () => {
  assert.equal(getQuestDisplayLabel(echoT, null), 'Unknown Quest')
  calls.length = 0
  getQuestDisplayLabel(recordingT, {})
  assert.equal(calls[0].key, 'ui:quest.unknown')
})

test('getQuestToastName shares the label policy and stays untranslated', () => {
  assert.equal(
    getQuestToastName({ id: 'q', label: 'ui:x.title' }),
    'ui:x.title'
  )
  assert.equal(
    getQuestToastName({ id: 'quest_region_takeover' }),
    'ui:quests.regionTakeover.title'
  )
  assert.equal(getQuestToastName({ id: 'ad_hoc_quest' }), 'ad_hoc_quest')
})
