import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decideChatterPlacement,
  gapAnchors,
  rectsIntersect,
  shouldSuppressChatterWhenBlocked
} from '../../src/components/chatterPlacement.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'

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

// Geometry measured in a real browser at 1280x800 (Kabelsalat): the wide header
// block, the five sockets and the five cables. Every fixed anchor hits one of
// them, which is how the message ended up on top of the plugs.
const kabelsalatDesktop = () => {
  const obstacles = [
    { left: 192, top: 64, right: 1088, bottom: 146 },
    ...[342, 474, 607, 739, 872].map(l => box(l, 274, 66, 85)),
    ...[322, 454, 587, 720, 852].map(l => box(l, 602, 106, 169))
  ]
  const w = 384
  const h = 71
  const vw = 1280
  const vh = 800
  const left = 16
  const center = (vw - w) / 2
  const right = vw - w - 16
  const anchors = [
    { left: center, top: vh - h - 64 },
    { left: center, top: 16 },
    { left: right, top: vh - h - 64 },
    { left: right, top: 16 },
    { left, top: vh - h - 64 },
    { left, top: 16 }
  ]
  return { obstacles, anchors, w, h, vw, vh, lefts: [center, right, left] }
}

describe('shouldSuppressChatterWhenBlocked', () => {
  it('suppresses for compact viewports regardless of scene', () => {
    assert.equal(shouldSuppressChatterWhenBlocked('SOME_SCENE', true), true)
    assert.equal(shouldSuppressChatterWhenBlocked(GAME_PHASES.GIG, true), true)
    assert.equal(shouldSuppressChatterWhenBlocked(GAME_PHASES.MENU, true), true)
  })

  it('suppresses on desktop for TourPrep, and Overworld only when expedition is active', () => {
    assert.equal(
      shouldSuppressChatterWhenBlocked(GAME_PHASES.TOUR_PREP, false),
      true
    )
    assert.equal(
      shouldSuppressChatterWhenBlocked(GAME_PHASES.TOUR_PREP, false, false),
      true
    )
    assert.equal(
      shouldSuppressChatterWhenBlocked(GAME_PHASES.OVERWORLD, false, true),
      true
    )
    assert.equal(
      shouldSuppressChatterWhenBlocked(GAME_PHASES.OVERWORLD, false, false),
      false
    )
  })

  it('does not suppress on desktop for non-expedition scenes', () => {
    assert.equal(shouldSuppressChatterWhenBlocked(GAME_PHASES.GIG, false), false)
    assert.equal(
      shouldSuppressChatterWhenBlocked(GAME_PHASES.PRE_GIG, false),
      false
    )
    assert.equal(
      shouldSuppressChatterWhenBlocked(GAME_PHASES.MENU, false),
      false
    )
    assert.equal(
      shouldSuppressChatterWhenBlocked(GAME_PHASES.CLINIC, false),
      false
    )
  })
})

describe('gapAnchors', () => {
  it('leaves the plugs uncovered on a desktop Kabelsalat board', () => {
    const { obstacles, anchors, w, h, vw, vh, lefts } = kabelsalatDesktop()
    const defaultRect = box(448, 665, w, h)

    assert.deepEqual(
      decideChatterPlacement(defaultRect, anchors, obstacles, {
        suppressWhenBlocked: false
      }),
      { kind: 'default' },
      'the fixed anchors alone are all blocked'
    )

    const gaps = gapAnchors(obstacles, {
      lefts,
      size: { w, h },
      viewport: { vw, vh },
      margin: 16,
      preferredTop: defaultRect.top
    })
    const placement = decideChatterPlacement(
      defaultRect,
      [...anchors, ...gaps],
      obstacles,
      { suppressWhenBlocked: false }
    )
    assert.equal(placement.kind, 'anchor')
    if (placement.kind !== 'anchor') return
    const placed = box(placement.anchor.left, placement.anchor.top, w, h)
    assert.equal(
      obstacles.some(o => rectsIntersect(placed, o)),
      false
    )
  })

  it('only proposes spots inside the viewport margins', () => {
    const { obstacles, w, h, vw, vh, lefts } = kabelsalatDesktop()
    const gaps = gapAnchors(obstacles, {
      lefts,
      size: { w, h },
      viewport: { vw, vh },
      margin: 16,
      preferredTop: 665
    })
    assert.ok(gaps.length > 0)
    for (const a of gaps) {
      assert.ok(a.top >= 16 && a.top + h <= vh - 16)
    }
  })

  it('lists the spot closest to the preferred top first', () => {
    const gaps = gapAnchors([box(0, 100, 50, 50)], {
      lefts: [10],
      size: { w: 20, h: 20 },
      viewport: { vw: 400, vh: 400 },
      margin: 0,
      preferredTop: 160
    })
    assert.deepEqual(gaps[0], { left: 10, top: 158 })
  })
})
