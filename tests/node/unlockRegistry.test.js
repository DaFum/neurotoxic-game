import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ALL_RAW_EVENTS } from '../../src/data/events/index'
import { UNLOCK_IDS } from '../../src/data/unlocks'
import { MILESTONES } from '../../src/data/milestones/milestones'

const collectUnlockGrants = (node, found = new Set(), seen = new WeakSet()) => {
  if (!node || typeof node !== 'object' || seen.has(node)) return found
  seen.add(node)
  if (node.type === 'unlock' && typeof node.unlock === 'string') {
    found.add(node.unlock)
  }
  for (const value of Object.values(node))
    collectUnlockGrants(value, found, seen)
  return found
}

test('every unlock an event grants is a registered unlock id', () => {
  const granted = collectUnlockGrants(ALL_RAW_EVENTS)
  assert.ok(granted.size > 0, 'expected at least one unlock-granting event')
  const registered = new Set(Object.values(UNLOCK_IDS))
  for (const id of granted) {
    assert.ok(registered.has(id), `event grants unregistered unlock "${id}"`)
  }
})

test('every registered unlock id is granted by an event and has EN/DE labels', () => {
  const granted = collectUnlockGrants(ALL_RAW_EVENTS)
  for (const id of Object.values(UNLOCK_IDS)) {
    assert.ok(granted.has(id), `no event grants "${id}"`)
    for (const lang of ['en', 'de']) {
      const labels = JSON.parse(
        readFileSync(`public/locales/${lang}/unlocks.json`, 'utf8')
      )
      assert.equal(typeof labels[id], 'string', `${lang} unlocks:${id}`)
      assert.ok(labels[id].length > 0)
    }
  }
})

test('the collector milestone consumes the unlock count', () => {
  const collector = MILESTONES.find(m => m.id === 'collector')
  assert.ok(collector)
  assert.equal(collector.condition({ unlocks: [] }), false)
  assert.equal(collector.condition({ unlocks: [UNLOCK_IDS.RARE_VINYL] }), true)
})
