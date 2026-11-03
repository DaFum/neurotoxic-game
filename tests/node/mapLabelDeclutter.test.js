import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pickMapLabelPlacements } from '../../src/components/overworld/mapLabelDeclutter.ts'

const rect = (left, top, w = 76, h = 40) => ({
  left,
  top,
  right: left + w,
  bottom: top + h
})
const entry = (id, priority, rects, aboveRects = []) => ({
  id,
  priority,
  candidates: [
    { anchor: 'below', gap: 28, rects },
    { anchor: 'above', gap: 28, rects: aboveRects }
  ]
})
const anchors = placements =>
  [...placements.values()].map(value => value?.anchor ?? 'hidden')

describe('pickMapLabelPlacements', () => {
  it('keeps default anchors when labels do not overlap', () => {
    assert.deepEqual(
      anchors(
        pickMapLabelPlacements([
          entry('a', 1, [rect(0, 0)]),
          entry('b', 1, [rect(200, 0)])
        ])
      ),
      ['below', 'below']
    )
  })

  it('keeps destinations before the current node regardless of input order', () => {
    const placements = pickMapLabelPlacements([
      entry('current', 2, [rect(602, 282, 76, 38)]),
      entry('destination', 1, [rect(612, 314, 56, 38)])
    ])
    assert.equal(placements.get('current'), null)
    assert.equal(placements.get('destination').anchor, 'below')
  })

  it('lets a focused label win over a destination', () => {
    const placements = pickMapLabelPlacements([
      entry('destination', 1, [rect(0, 0)]),
      entry('focused', 0, [rect(30, 10)])
    ])
    assert.equal(placements.get('destination'), null)
    assert.equal(placements.get('focused').anchor, 'below')
  })

  it('keeps stable ties and hidden labels do not block later labels', () => {
    assert.deepEqual(
      anchors(
        pickMapLabelPlacements([
          entry('first', 1, [rect(0, 0)]),
          entry('second', 1, [rect(40, 0)]),
          entry('third', 1, [rect(100, 0)])
        ])
      ),
      ['below', 'hidden', 'below']
    )
  })

  it('rejects a candidate when any of its child boxes collides', () => {
    const placements = pickMapLabelPlacements([
      entry('kept', 1, [rect(0, 0)]),
      entry('chips', 2, [rect(500, 0), rect(10, 10)])
    ])
    assert.equal(placements.get('chips'), null)
  })

  it('moves an overlapping destination above instead of hiding its name', () => {
    const placements = pickMapLabelPlacements([
      entry('first', 1, [rect(0, 100)]),
      entry('second', 1, [rect(30, 100)], [rect(30, 0)])
    ])
    assert.equal(placements.get('second').anchor, 'above')
  })

  it('rejects candidates outside the map bounds', () => {
    const placements = pickMapLabelPlacements(
      [entry('a', 1, [rect(-10, 100)], [rect(10, 0)])],
      { bounds: rect(0, 0, 200, 200) }
    )
    assert.equal(placements.get('a').anchor, 'above')
  })

  it('rejects other hexagons but allows its own hexagon', () => {
    const placements = pickMapLabelPlacements(
      [entry('a', 1, [rect(0, 100)], [rect(0, 0)])],
      {
        obstacles: [
          { ownerId: 'b', rect: rect(0, 100) },
          { ownerId: 'a', rect: rect(0, 0) }
        ]
      }
    )
    assert.equal(placements.get('a').anchor, 'above')
  })

  it('hides only when every candidate fails', () => {
    const placements = pickMapLabelPlacements(
      [
        entry('kept', 0, [rect(0, 0)]),
        entry('hidden', 1, [rect(30, 0)], [rect(30, -100)]),
        entry('later', 1, [rect(80, 0)])
      ],
      { bounds: rect(0, 0, 200, 200) }
    )
    assert.deepEqual(anchors(placements), ['below', 'hidden', 'below'])
  })

  it('tries a farther gap when both near anchors hit hexagons', () => {
    const near = entry('a', 1, [rect(0, 100)], [rect(0, 0)])
    near.candidates.push({ anchor: 'below', gap: 96, rects: [rect(0, 200)] })
    const placements = pickMapLabelPlacements([near], {
      obstacles: [
        { ownerId: 'b', rect: rect(0, 100) },
        { ownerId: 'c', rect: rect(0, 0) }
      ]
    })
    assert.equal(placements.get('a').gap, 96)
  })
})

for (const [center, firstGap, startTop, nextTop, height, expectedGap] of [
  [69, 64, 6, 84, 372, 106],
  [91, 106, 14, 119, 470, 148]
]) {
  it(`keeps a middle branch name readable against the map edge at height ${height}`, () => {
    const labelHeight = 38
    const separatedRow = labelHeight + 4
    const placements = pickMapLabelPlacements(
      [
        entry('left', 1, [rect(66, center + firstGap, 80, labelHeight)]),
        {
          id: 'middle',
          priority: 1,
          candidates: [
            28,
            64,
            64 + separatedRow,
            64 + 2 * separatedRow
          ].flatMap(gap => [
            {
              anchor: 'below',
              gap,
              rects: [rect(120, center + gap, 55, labelHeight)]
            },
            {
              anchor: 'above',
              gap,
              rects: [rect(120, center - gap - labelHeight, 55, labelHeight)]
            }
          ])
        }
      ],
      {
        bounds: rect(0, 0, 296, height),
        obstacles: [
          { ownerId: 'start', rect: rect(124, startTop, 48, 48) },
          { ownerId: 'next', rect: rect(103, nextTop, 48, 48) }
        ]
      }
    )
    assert.deepEqual(placements.get('middle'), {
      anchor: 'below',
      gap: expectedGap
    })
  })
}
