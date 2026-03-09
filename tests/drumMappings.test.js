import test, { describe, mock } from 'node:test'
import assert from 'node:assert/strict'
import { playDrumNote } from '../src/utils/audio/drumMappings.js'

describe('drumMappings', () => {
  let mockKit

  test.beforeEach(() => {
    mockKit = {
      kick: { triggerAttackRelease: mock.fn() },
      snare: { triggerAttackRelease: mock.fn() },
      hihat: { triggerAttackRelease: mock.fn() },
      crash: { triggerAttackRelease: mock.fn() }
    }
  })

  test('plays kick drum for MIDI note 35', () => {
    playDrumNote(35, 0, 0.8, mockKit)
    assert.equal(mockKit.kick.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.kick.triggerAttackRelease.mock.calls[0].arguments,
      ['C1', '8n', 0, 0.8]
    )
  })

  test('plays kick drum for MIDI note 36', () => {
    playDrumNote(36, 0, 0.7, mockKit)
    assert.equal(mockKit.kick.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.kick.triggerAttackRelease.mock.calls[0].arguments,
      ['C1', '8n', 0, 0.7]
    )
  })

  test('plays snare drum for MIDI note 38', () => {
    playDrumNote(38, 0, 0.9, mockKit)
    assert.equal(mockKit.snare.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.snare.triggerAttackRelease.mock.calls[0].arguments,
      ['16n', 0, 0.9]
    )
  })

  test('plays snare drum for MIDI note 40', () => {
    playDrumNote(40, 0, 0.85, mockKit)
    assert.equal(mockKit.snare.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.snare.triggerAttackRelease.mock.calls[0].arguments,
      ['16n', 0, 0.85]
    )
  })

  test('plays hihat for MIDI note 42', () => {
    playDrumNote(42, 0, 0.6, mockKit)
    assert.equal(mockKit.hihat.triggerAttackRelease.mock.calls.length, 1)
    const args = mockKit.hihat.triggerAttackRelease.mock.calls[0].arguments
    assert.equal(args[0], 8000)
    assert.equal(args[1], '32n')
    assert.equal(args[2], 0)
    assert.ok(Math.abs(args[3] - 0.42) < 0.01)
  })

  test('plays hihat for MIDI note 44', () => {
    playDrumNote(44, 0, 0.5, mockKit)
    assert.equal(mockKit.hihat.triggerAttackRelease.mock.calls.length, 1)
    const args = mockKit.hihat.triggerAttackRelease.mock.calls[0].arguments
    assert.equal(args[0], 8000)
    assert.equal(args[1], '32n')
    assert.equal(args[2], 0)
    assert.ok(Math.abs(args[3] - 0.35) < 0.01)
  })

  test('plays crash for MIDI note 49', () => {
    playDrumNote(49, 0, 0.8, mockKit)
    assert.equal(mockKit.crash.triggerAttackRelease.mock.calls.length, 1)
    const args = mockKit.crash.triggerAttackRelease.mock.calls[0].arguments
    assert.equal(args[0], 4000)
    assert.equal(args[1], '4n')
    assert.equal(args[2], 0)
    assert.ok(Math.abs(args[3] - 0.56) < 0.01)
  })

  test('plays crash for MIDI note 57', () => {
    playDrumNote(57, 0, 0.9, mockKit)
    assert.equal(mockKit.crash.triggerAttackRelease.mock.calls.length, 1)
    const args = mockKit.crash.triggerAttackRelease.mock.calls[0].arguments
    assert.equal(args[0], 4000)
    assert.equal(args[1], '4n')
    assert.equal(args[2], 0)
    assert.ok(Math.abs(args[3] - 0.63) < 0.01)
  })

  test('plays tom (mapped to kick) for MIDI note 41', () => {
    playDrumNote(41, 0, 0.7, mockKit)
    assert.equal(mockKit.kick.triggerAttackRelease.mock.calls.length, 1)
    const args = mockKit.kick.triggerAttackRelease.mock.calls[0].arguments
    assert.equal(args[0], 'G1')
    assert.equal(args[1], '8n')
    assert.equal(args[2], 0)
    assert.ok(Math.abs(args[3] - 0.56) < 0.01)
  })

  test('plays ride (mapped to hihat) for MIDI note 51', () => {
    playDrumNote(51, 0, 0.8, mockKit)
    assert.equal(mockKit.hihat.triggerAttackRelease.mock.calls.length, 1)
    const args = mockKit.hihat.triggerAttackRelease.mock.calls[0].arguments
    assert.equal(args[0], 5000)
    assert.equal(args[1], '8n')
    assert.equal(args[2], 0)
    assert.ok(Math.abs(args[3] - 0.4) < 0.01)
  })

  test('defaults to hihat for unknown MIDI notes', () => {
    playDrumNote(99, 0, 0.7, mockKit)
    assert.equal(mockKit.hihat.triggerAttackRelease.mock.calls.length, 1)
  })

  test('clamps velocity to valid range (0-1)', () => {
    playDrumNote(35, 0, 2.5, mockKit) // Above 1
    assert.equal(mockKit.kick.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.kick.triggerAttackRelease.mock.calls[0].arguments,
      ['C1', '8n', 0, 1]
    )

    mockKit.kick.triggerAttackRelease.mock.restore()
    mockKit.kick.triggerAttackRelease = mock.fn()

    playDrumNote(35, 0, -0.5, mockKit) // Below 0
    assert.equal(mockKit.kick.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.kick.triggerAttackRelease.mock.calls[0].arguments,
      ['C1', '8n', 0, 0]
    )
  })

  test('handles non-finite velocity values', () => {
    playDrumNote(35, 0, NaN, mockKit)
    assert.equal(mockKit.kick.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.kick.triggerAttackRelease.mock.calls[0].arguments,
      ['C1', '8n', 0, 0]
    )

    mockKit.kick.triggerAttackRelease.mock.restore()
    mockKit.kick.triggerAttackRelease = mock.fn()

    playDrumNote(35, 0, Infinity, mockKit)
    assert.equal(mockKit.kick.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.kick.triggerAttackRelease.mock.calls[0].arguments,
      ['C1', '8n', 0, 0]
    )
  })

  test('does not crash when kit is null', () => {
    assert.doesNotThrow(() => playDrumNote(35, 0, 0.8, null))
  })

  test('does not crash when kit is undefined', () => {
    assert.doesNotThrow(() => playDrumNote(35, 0, 0.8, undefined))
  })

  test('handles Tone.js errors gracefully', () => {
    mockKit.kick.triggerAttackRelease = mock.fn(() => {
      throw new Error('Tone.js error')
    })

    assert.doesNotThrow(() => playDrumNote(35, 0, 0.8, mockKit))

    mockKit.hihat.triggerAttackRelease = mock.fn(() => {
      throw new Error('Tone.js error')
    })

    assert.doesNotThrow(() => playDrumNote(99, 0, 0.8, mockKit))
  })

  test('applies velocity scaling correctly for different drum types', () => {
    // Snare with velScale 0.4
    playDrumNote(37, 0, 1.0, mockKit)
    assert.equal(mockKit.snare.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.snare.triggerAttackRelease.mock.calls[0].arguments,
      ['32n', 0, 0.4]
    )

    mockKit.snare.triggerAttackRelease.mock.restore()
    mockKit.snare.triggerAttackRelease = mock.fn()

    // Hihat with velScale 0.7
    playDrumNote(42, 0, 1.0, mockKit)
    assert.equal(mockKit.hihat.triggerAttackRelease.mock.calls.length, 1)
    assert.deepEqual(
      mockKit.hihat.triggerAttackRelease.mock.calls[0].arguments,
      [8000, '32n', 0, 0.7]
    )
  })
})
