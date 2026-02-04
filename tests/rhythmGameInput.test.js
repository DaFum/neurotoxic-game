import assert from 'assert'
import { test } from 'node:test'
import { checkHit } from '../src/utils/rhythmUtils.js'

test('checkHit finds matching note within window', () => {
  const notes = [
    { time: 1000, laneIndex: 0, visible: true, hit: false, id: 1, type: 'note' },
    { time: 2000, laneIndex: 1, visible: true, hit: false, id: 2, type: 'note' }
  ]

  const hitWindow = 100

  // Perfect hit
  const hit1 = checkHit(notes, 0, 1000, hitWindow)
  assert.ok(hit1, 'Should match exact timing')
  assert.strictEqual(hit1.id, 1)

  // Early hit (inside window)
  const hit2 = checkHit(notes, 0, 950, hitWindow)
  assert.ok(hit2, 'Should match early hit within window')
  assert.strictEqual(hit2.id, 1)

  // Late hit (inside window)
  const hit3 = checkHit(notes, 0, 1050, hitWindow)
  assert.ok(hit3, 'Should match late hit within window')
  assert.strictEqual(hit3.id, 1)
})

test('checkHit ignores notes outside window', () => {
  const notes = [{ time: 1000, laneIndex: 0, visible: true, hit: false, id: 1, type: 'note' }]
  const hitWindow = 100

  // Too early
  const miss1 = checkHit(notes, 0, 800, hitWindow)
  assert.strictEqual(miss1, null)

  // Too late
  const miss2 = checkHit(notes, 0, 1200, hitWindow)
  assert.strictEqual(miss2, null)
})

test('checkHit ignores wrong lane', () => {
  const notes = [{ time: 1000, laneIndex: 0, visible: true, hit: false, id: 1, type: 'note' }]
  const hitWindow = 100

  const wrongLane = checkHit(notes, 1, 1000, hitWindow)
  assert.strictEqual(wrongLane, null)
})

test('checkHit ignores already hit or invisible notes', () => {
  const notes = [
    { time: 1000, laneIndex: 0, visible: false, hit: false, id: 1, type: 'note' },
    { time: 1000, laneIndex: 0, visible: true, hit: true, id: 2, type: 'note' }
  ]
  const hitWindow = 100

  const hitInvisible = checkHit(notes, 0, 1000, hitWindow)
  // Should skip both (one is invisible, one is hit)
  // If logic is strictly correct, it finds FIRST valid one. Since both are invalid...
  // Wait, `checkHit` iterates. If strict logic:
  // n.visible && !n.hit
  // Note 1: visible=false -> fail
  // Note 2: hit=true -> fail
  // Returns null
  assert.strictEqual(hitInvisible, null)
})

test('checkHit prioritizes closest note?', () => {
  // Current implementation uses .find(), so it returns the FIRST one in array order that satisfies condition.
  // It does NOT strictly find the "best" hit if multiple overlap.
  // This test documents current behavior rather than ideal behavior.

  const notes = [
    { time: 1000, laneIndex: 0, visible: true, hit: false, id: 1, type: 'note' },
    { time: 1050, laneIndex: 0, visible: true, hit: false, id: 2, type: 'note' }
  ]
  const hitWindow = 100

  // At 1025, both are valid (diff 25 vs 25).
  // Should pick index 0 (id 1) because it appears first in the array.
  // Gameplay implication: hits are processed FIFO if they overlap.
  const hit = checkHit(notes, 0, 1025, hitWindow)
  assert.strictEqual(hit.id, 1)
})
