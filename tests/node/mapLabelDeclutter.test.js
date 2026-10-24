import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pickHiddenMapLabels } from '../../src/components/overworld/mapLabelDeclutter.ts'

const rect = (left, top, w = 76, h = 40) => ({
  left,
  top,
  right: left + w,
  bottom: top + h
})

describe('pickHiddenMapLabels', () => {
  it('hides nothing when no labels overlap', () => {
    const hidden = pickHiddenMapLabels([
      { id: 'a', priority: 1, rects: [rect(0, 0)] },
      { id: 'b', priority: 1, rects: [rect(200, 0)] }
    ])
    assert.equal(hidden.size, 0)
  })

  it('keeps the destination and hides the overlapping current-node label', () => {
    const hidden = pickHiddenMapLabels([
      { id: 'current', priority: 2, rects: [rect(602, 282, 76, 38)] },
      { id: 'destination', priority: 1, rects: [rect(612, 314, 56, 38)] }
    ])
    assert.deepEqual([...hidden], ['current'])
  })

  it('lets a focused label win over a destination', () => {
    const hidden = pickHiddenMapLabels([
      { id: 'destination', priority: 1, rects: [rect(0, 0)] },
      { id: 'focused', priority: 0, rects: [rect(30, 10)] }
    ])
    assert.deepEqual([...hidden], ['destination'])
  })

  it('keeps input order for equal priorities and measures against kept labels only', () => {
    const hidden = pickHiddenMapLabels([
      { id: 'first', priority: 1, rects: [rect(0, 0)] },
      { id: 'second', priority: 1, rects: [rect(40, 0)] },
      { id: 'third', priority: 1, rects: [rect(100, 0)] }
    ])
    // third overlaps only the hidden second, not the kept first
    assert.deepEqual([...hidden], ['second'])
  })

  it('treats a label as hidden when any of its boxes collides', () => {
    const hidden = pickHiddenMapLabels([
      { id: 'kept', priority: 1, rects: [rect(0, 0)] },
      { id: 'chips', priority: 2, rects: [rect(500, 0), rect(10, 10)] }
    ])
    assert.deepEqual([...hidden], ['chips'])
  })
})
