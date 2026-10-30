import { describe, it, expect } from 'vitest'
import {
  normalizeGamepad,
  filterStick,
  directionFromStick,
  createDirectionRepeater,
  createButtonEdges,
  mergeGamepads,
  getLayoutFamily,
  readGamepads
} from '../../src/utils/gamepad/logic'

describe('gamepad input logic', () => {
  it('normalizes snapshots, trigger hysteresis and mapping without retaining the device', () => {
    const pad = {
      index: 0,
      id: 'Xbox',
      mapping: 'standard',
      buttons: Array.from({ length: 8 }, () => ({ pressed: false, value: 0 })),
      axes: [0.2, -0.3]
    }
    pad.buttons[6].value = 0.6
    const first = normalizeGamepad(pad)
    expect(first).toMatchObject({
      index: 0,
      id: 'Xbox',
      standard: true,
      stick: [0.2, -0.3]
    })
    expect(first.buttons[6]).toBe(true)
    pad.buttons[6].value = 0.45
    expect(normalizeGamepad(pad, first).buttons[6]).toBe(true)
    pad.buttons[6].value = 0.3
    expect(normalizeGamepad(pad, first).buttons[6]).toBe(false)
    expect(normalizeGamepad({ ...pad, mapping: '' }).standard).toBe(false)
    expect(first.buttons[6]).toBe(true)
  })
  it('suppresses drift and applies direction hysteresis', () => {
    expect(filterStick([0.1, 0.1])).toEqual([0, 0])
    expect(directionFromStick([0.59, 0], null)).toBe(null)
    expect(directionFromStick([0.7, 0.1], null)).toBe('right')
    expect(directionFromStick([0.5, 0], 'right')).toBe('right')
    expect(directionFromStick([0.39, 0], 'right')).toBe(null)
    expect(directionFromStick([-0.5, 0], 'right')).toBe(null)
    expect(directionFromStick([-0.7, 0], 'right')).toBe('left')
  })
  it('repeats immediately, after 400ms and every 120ms', () => {
    const repeat = createDirectionRepeater()
    expect(repeat('left', 0)).toBe('left')
    expect(repeat('left', 399)).toBe(null)
    expect(repeat('left', 400)).toBe('left')
    expect(repeat('left', 519)).toBe(null)
    expect(repeat('left', 520)).toBe('left')
    expect(repeat(null, 521)).toBe(null)
    expect(repeat('right', 522)).toBe('right')
  })
  it('arms held buttons only after release and merges disconnected pads', () => {
    const edges = createButtonEdges()
    expect(edges.update([true])).toEqual([])
    expect(edges.update([false])).toEqual([])
    expect(edges.update([true])).toEqual([{ button: 0, pressed: true }])
    expect(edges.update([true])).toEqual([])
    expect(edges.update([false])).toEqual([{ button: 0, pressed: false }])
    const pad = buttons => ({ buttons })
    expect(mergeGamepads([pad([true, false]), pad([true, true])])).toEqual([
      true,
      true
    ])
    expect(mergeGamepads([pad([true, false])])).toEqual([true, false])
  })
  it('recognizes layout families and handles unavailable APIs', () => {
    expect(getLayoutFamily('Sony DualSense Wireless Controller')).toBe(
      'playstation'
    )
    expect(getLayoutFamily('Xbox Wireless Controller')).toBe('xbox')
    expect(getLayoutFamily('Unknown')).toBe('generic')
    expect(readGamepads({})).toEqual({ available: false, pads: [] })
    expect(
      readGamepads({
        getGamepads: () => {
          throw new DOMException('blocked', 'SecurityError')
        }
      })
    ).toEqual({ available: false, pads: [] })
  })
})
