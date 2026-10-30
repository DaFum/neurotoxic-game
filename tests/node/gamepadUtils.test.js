import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeGamepad } from '../../src/utils/gamepad/normalization.js'
import { applyRadialDeadzone } from '../../src/utils/gamepad/deadzone.js'
import { evaluateDirectionHysteresis, isTriggerPressed } from '../../src/utils/gamepad/hysteresis.js'
import { ArmedEdges } from '../../src/utils/gamepad/armedEdges.js'
import { DirectionRepeater } from '../../src/utils/gamepad/repeaters.js'
import { mergeNormalizedGamepads } from '../../src/utils/gamepad/multiPadMerge.js'
import { detectLayoutFamily, getButtonLabel } from '../../src/utils/gamepad/layout.js'
import { getSafeGamepads, isGamepadAPISupported } from '../../src/utils/gamepad/capabilities.js'

describe('Gamepad Pure Utilities', () => {
  test('normalizeGamepad extracts plain data and drops native references', () => {
    const mockPad = {
      id: 'Xbox Wireless Controller (STANDARD GAMEPAD)',
      index: 0,
      mapping: 'standard',
      connected: true,
      buttons: [{ pressed: true, value: 1.0 }, { pressed: false, value: 0.0 }],
      axes: [0.1, -0.2, NaN, Infinity]
    }

    const norm = normalizeGamepad(mockPad)
    assert.notEqual(norm, null)
    assert.equal(norm.id, 'Xbox Wireless Controller (STANDARD GAMEPAD)')
    assert.equal(norm.index, 0)
    assert.equal(norm.buttons.length, 2)
    assert.equal(norm.buttons[0].pressed, true)
    assert.equal(norm.axes[0], 0.1)
    assert.equal(norm.axes[2], 0) // NaN converted
    assert.equal(norm.axes[3], 0) // Infinity converted
  })

  test('applyRadialDeadzone applies 0.25 deadzone correctly', () => {
    const inZone = applyRadialDeadzone(0.1, 0.1, 0.25)
    assert.equal(inZone.x, 0)
    assert.equal(inZone.y, 0)
    assert.equal(inZone.magnitude, 0)

    const outZone = applyRadialDeadzone(0.8, 0, 0.25)
    assert.ok(outZone.x > 0)
    assert.ok(outZone.magnitude > 0)
  })

  test('evaluateDirectionHysteresis respects 0.6 activation and 0.4 release', () => {
    assert.equal(evaluateDirectionHysteresis(0.5, 0, null), null)
    assert.equal(evaluateDirectionHysteresis(0.7, 0, null), 'right')
    assert.equal(evaluateDirectionHysteresis(0.2, -0.8, null), 'up')
    assert.equal(evaluateDirectionHysteresis(0.45, 0, 'right'), 'right')
    assert.equal(evaluateDirectionHysteresis(0.3, 0, 'right'), null)
  })

  test('isTriggerPressed applies press and release thresholds', () => {
    assert.equal(isTriggerPressed(0.4, false), false)
    assert.equal(isTriggerPressed(0.6, false), true)
    assert.equal(isTriggerPressed(0.35, true), true)
    assert.equal(isTriggerPressed(0.2, true), false)
  })

  test('ArmedEdges suppresses held inputs until release', () => {
    const armed = new ArmedEdges()

    const res1 = armed.processInput(0, true)
    assert.equal(res1.pressEdge, true)

    const res2 = armed.processInput(0, true)
    assert.equal(res2.pressEdge, false)

    const res3 = armed.processInput(0, false)
    assert.equal(res3.releaseEdge, true)

    armed.disarm(1)
    const res4 = armed.processInput(1, true)
    assert.equal(res4.pressEdge, false)

    armed.processInput(1, false)
    const res5 = armed.processInput(1, true)
    assert.equal(res5.pressEdge, true)
  })

  test('DirectionRepeater emits immediate edge, 400ms initial delay, then 120ms repeats', () => {
    const repeater = new DirectionRepeater()

    const r1 = repeater.update('right', 0)
    assert.deepEqual(r1, { direction: 'right', isRepeat: false })

    const r2 = repeater.update('right', 200)
    assert.equal(r2, null)

    const r3 = repeater.update('right', 400)
    assert.deepEqual(r3, { direction: 'right', isRepeat: true })

    const r4 = repeater.update('right', 450)
    assert.equal(r4, null)

    const r5 = repeater.update('right', 520)
    assert.deepEqual(r5, { direction: 'right', isRepeat: true })

    repeater.update(null, 600)
    assert.equal(repeater.getActiveDirection(), null)
  })

  test('mergeNormalizedGamepads aggregates multi-pad state cleanly', () => {
    const pad1 = {
      id: 'Pad 1',
      index: 0,
      mapping: 'standard',
      connected: true,
      buttons: [{ pressed: true, value: 1 }],
      axes: [0.5, 0]
    }
    const pad2 = {
      id: 'Pad 2',
      index: 1,
      mapping: 'standard',
      connected: true,
      buttons: [{ pressed: false, value: 0 }, { pressed: true, value: 0.8 }],
      axes: [-0.9, 0.2]
    }

    const merged = mergeNormalizedGamepads([pad1, pad2])
    assert.equal(merged.connectedPadsCount, 2)
    assert.equal(merged.buttons[0].pressed, true)
    assert.equal(merged.buttons[1].pressed, true)
    assert.equal(merged.axes[0], -0.9)

    const mergedSingle = mergeNormalizedGamepads([pad1, null])
    assert.equal(mergedSingle.connectedPadsCount, 1)
    assert.equal(mergedSingle.axes[0], 0.5)
  })

  test('detectLayoutFamily and getButtonLabel format glyphs correctly', () => {
    assert.equal(detectLayoutFamily('DualSense Wireless Controller'), 'playstation')
    assert.equal(detectLayoutFamily('Xbox One Controller'), 'xbox')
    assert.equal(detectLayoutFamily('Generic USB Gamepad'), 'generic')

    assert.equal(getButtonLabel(0, 'xbox'), 'A')
    assert.equal(getButtonLabel(0, 'playstation'), '✕')
    assert.equal(getButtonLabel(1, 'xbox'), 'B')
    assert.equal(getButtonLabel(1, 'playstation'), '○')
    assert.equal(getButtonLabel(9, 'xbox'), '≡')
    assert.equal(getButtonLabel(9, 'playstation'), 'OPTIONS')
  })

  test('capabilities checks run safely without throwing', () => {
    assert.equal(typeof isGamepadAPISupported(), 'boolean')
    const pads = getSafeGamepads()
    assert.ok(Array.isArray(pads))
  })
})
