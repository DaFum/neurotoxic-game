import { describe, test, expect, vi, beforeEach } from 'vitest'
import { playDrumNote } from '../src/utils/audio/drumMappings.js'

describe('drumMappings', () => {
  let mockKit

  beforeEach(() => {
    mockKit = {
      kick: { triggerAttackRelease: vi.fn() },
      snare: { triggerAttackRelease: vi.fn() },
      hihat: { triggerAttackRelease: vi.fn() },
      crash: { triggerAttackRelease: vi.fn() }
    }
  })

  test('plays kick drum for MIDI note 35', () => {
    playDrumNote(35, 0, 0.8, mockKit)
    expect(mockKit.kick.triggerAttackRelease).toHaveBeenCalledWith(
      'C1',
      '8n',
      0,
      0.8
    )
  })

  test('plays kick drum for MIDI note 36', () => {
    playDrumNote(36, 0, 0.7, mockKit)
    expect(mockKit.kick.triggerAttackRelease).toHaveBeenCalledWith(
      'C1',
      '8n',
      0,
      0.7
    )
  })

  test('plays snare drum for MIDI note 38', () => {
    playDrumNote(38, 0, 0.9, mockKit)
    expect(mockKit.snare.triggerAttackRelease).toHaveBeenCalledWith(
      '16n',
      0,
      0.9
    )
  })

  test('plays snare drum for MIDI note 40', () => {
    playDrumNote(40, 0, 0.85, mockKit)
    expect(mockKit.snare.triggerAttackRelease).toHaveBeenCalledWith(
      '16n',
      0,
      0.85
    )
  })

  test('plays hihat for MIDI note 42', () => {
    playDrumNote(42, 0, 0.6, mockKit)
    expect(mockKit.hihat.triggerAttackRelease).toHaveBeenCalledWith(
      8000,
      '32n',
      0,
      expect.closeTo(0.42, 0.01)
    )
  })

  test('plays hihat for MIDI note 44', () => {
    playDrumNote(44, 0, 0.5, mockKit)
    expect(mockKit.hihat.triggerAttackRelease).toHaveBeenCalledWith(
      8000,
      '32n',
      0,
      expect.closeTo(0.35, 0.01)
    )
  })

  test('plays crash for MIDI note 49', () => {
    playDrumNote(49, 0, 0.8, mockKit)
    expect(mockKit.crash.triggerAttackRelease).toHaveBeenCalledWith(
      4000,
      '4n',
      0,
      expect.closeTo(0.56, 0.01)
    )
  })

  test('plays crash for MIDI note 57', () => {
    playDrumNote(57, 0, 0.9, mockKit)
    expect(mockKit.crash.triggerAttackRelease).toHaveBeenCalledWith(
      4000,
      '4n',
      0,
      expect.closeTo(0.63, 0.01)
    )
  })

  test('plays tom (mapped to kick) for MIDI note 41', () => {
    playDrumNote(41, 0, 0.7, mockKit)
    expect(mockKit.kick.triggerAttackRelease).toHaveBeenCalledWith(
      'G1',
      '8n',
      0,
      expect.closeTo(0.56, 0.01)
    )
  })

  test('plays ride (mapped to hihat) for MIDI note 51', () => {
    playDrumNote(51, 0, 0.8, mockKit)
    expect(mockKit.hihat.triggerAttackRelease).toHaveBeenCalledWith(
      5000,
      '8n',
      0,
      expect.closeTo(0.4, 0.01)
    )
  })

  test('defaults to hihat for unknown MIDI notes', () => {
    playDrumNote(99, 0, 0.7, mockKit)
    expect(mockKit.hihat.triggerAttackRelease).toHaveBeenCalled()
  })

  test('clamps velocity to valid range (0-1)', () => {
    playDrumNote(35, 0, 2.5, mockKit) // Above 1
    expect(mockKit.kick.triggerAttackRelease).toHaveBeenCalledWith(
      'C1',
      '8n',
      0,
      1
    )

    vi.clearAllMocks()
    playDrumNote(35, 0, -0.5, mockKit) // Below 0
    expect(mockKit.kick.triggerAttackRelease).toHaveBeenCalledWith(
      'C1',
      '8n',
      0,
      0
    )
  })

  test('handles non-finite velocity values', () => {
    playDrumNote(35, 0, NaN, mockKit)
    expect(mockKit.kick.triggerAttackRelease).toHaveBeenCalledWith(
      'C1',
      '8n',
      0,
      0
    )

    vi.clearAllMocks()
    playDrumNote(35, 0, Infinity, mockKit)
    expect(mockKit.kick.triggerAttackRelease).toHaveBeenCalledWith(
      'C1',
      '8n',
      0,
      1
    )
  })

  test('does not crash when kit is null', () => {
    expect(() => playDrumNote(35, 0, 0.8, null)).not.toThrow()
  })

  test('does not crash when kit is undefined', () => {
    expect(() => playDrumNote(35, 0, 0.8, undefined)).not.toThrow()
  })

  test('handles Tone.js errors gracefully', () => {
    mockKit.kick.triggerAttackRelease.mockImplementation(() => {
      throw new Error('Tone.js error')
    })

    expect(() => playDrumNote(35, 0, 0.8, mockKit)).not.toThrow()
  })

  test('applies velocity scaling correctly for different drum types', () => {
    // Snare with velScale 0.4
    playDrumNote(37, 0, 1.0, mockKit)
    expect(mockKit.snare.triggerAttackRelease).toHaveBeenCalledWith(
      '32n',
      0,
      0.4
    )

    vi.clearAllMocks()
    // Hihat with velScale 0.7
    playDrumNote(42, 0, 1.0, mockKit)
    expect(mockKit.hihat.triggerAttackRelease).toHaveBeenCalledWith(
      8000,
      '32n',
      0,
      0.7
    )
  })
})