import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeSettingsPayload } from '../../src/utils/settingsSanitizer'

describe('Settings Sanitizer - gamepadLaneBindings', () => {
  test('accepts valid 3-tuple and returns fresh array copy', () => {
    const raw = [2, 0, 1]
    const sanitized = sanitizeSettingsPayload({ gamepadLaneBindings: raw })
    assert.deepEqual(sanitized.gamepadLaneBindings, [2, 0, 1])
    assert.notEqual(sanitized.gamepadLaneBindings, raw)
  })

  test('rejects wrong length', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [2, 0] }).gamepadLaneBindings,
      undefined
    )
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [2, 0, 1, 3] }).gamepadLaneBindings,
      undefined
    )
  })

  test('rejects duplicates', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [2, 2, 1] }).gamepadLaneBindings,
      undefined
    )
  })

  test('rejects fractions', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [2.5, 0, 1] }).gamepadLaneBindings,
      undefined
    )
  })

  test('rejects strings', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: ['2', '0', '1'] }).gamepadLaneBindings,
      undefined
    )
  })

  test('rejects NaN and Infinities', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [NaN, 0, 1] }).gamepadLaneBindings,
      undefined
    )
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [Infinity, 0, 1] }).gamepadLaneBindings,
      undefined
    )
  })

  test('rejects negatives and out-of-range values', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [-1, 0, 1] }).gamepadLaneBindings,
      undefined
    )
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [64, 0, 1] }).gamepadLaneBindings,
      undefined
    )
  })

  test('rejects reserved Start button (9)', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [9, 0, 1] }).gamepadLaneBindings,
      undefined
    )
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: [2, 9, 1] }).gamepadLaneBindings,
      undefined
    )
  })

  test('rejects non-arrays', () => {
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: 'invalid' }).gamepadLaneBindings,
      undefined
    )
    assert.equal(
      sanitizeSettingsPayload({ gamepadLaneBindings: { 0: 2, 1: 0, 2: 1 } }).gamepadLaneBindings,
      undefined
    )
  })
})
