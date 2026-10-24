import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { decideChatterPlacement } from '../../src/components/chatterPlacement.ts'

const box = (left, top, w = 288, h = 88) => ({
  left,
  top,
  right: left + w,
  bottom: top + h
})

describe('decideChatterPlacement', () => {
  it('keeps the CSS default when nothing is under it', () => {
    const placement = decideChatterPlacement(
      box(16, 416),
      [{ left: 16, top: 16 }],
      [box(20, 363, 280, 40)],
      { suppressWhenBlocked: true }
    )
    assert.deepEqual(placement, { kind: 'default' })
  })

  it('moves to the first clear anchor when the default is covered', () => {
    const board = box(20, 363, 280, 208)
    const placement = decideChatterPlacement(
      box(16, 416),
      [
        { left: 16, top: 400 },
        { left: 16, top: 16 }
      ],
      [board],
      { suppressWhenBlocked: true }
    )
    assert.deepEqual(placement, {
      kind: 'anchor',
      anchor: { left: 16, top: 16 }
    })
  })

  it('suppresses the message when no anchor is clear (320x568 Kabelsalat)', () => {
    const board = box(20, 363, 280, 208)
    const header = box(16, 16, 288, 120)
    const placement = decideChatterPlacement(
      box(16, 416),
      [
        { left: 16, top: 416 },
        { left: 16, top: 16 }
      ],
      [board, header],
      { suppressWhenBlocked: true }
    )
    assert.deepEqual(placement, { kind: 'suppress' })
  })

  it('keeps the default on larger screens when nothing is clear', () => {
    const board = box(20, 363, 280, 208)
    const header = box(16, 16, 288, 120)
    const placement = decideChatterPlacement(
      box(16, 416),
      [{ left: 16, top: 16 }],
      [board, header],
      { suppressWhenBlocked: false }
    )
    assert.deepEqual(placement, { kind: 'default' })
  })

  it('treats touching edges as clear', () => {
    const placement = decideChatterPlacement(
      box(16, 100),
      [],
      [box(16, 188, 288, 40)],
      { suppressWhenBlocked: true }
    )
    assert.deepEqual(placement, { kind: 'default' })
  })
})
