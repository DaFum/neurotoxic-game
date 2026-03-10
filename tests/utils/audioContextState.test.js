import { describe, it, expect } from 'vitest'
import { isClosedAudioContextState } from '../../src/utils/audioContextState.js'

describe('isClosedAudioContextState', () => {
  it('returns true when state is closed', () => {
    expect(isClosedAudioContextState('closed')).toBe(true)
  })

  it('returns false when state is running', () => {
    expect(isClosedAudioContextState('running')).toBe(false)
  })

  it('returns false when state is suspended', () => {
    expect(isClosedAudioContextState('suspended')).toBe(false)
  })

  it('returns false when state is interrupted', () => {
    expect(isClosedAudioContextState('interrupted')).toBe(false)
  })

  it('returns false for unknown state', () => {
    expect(isClosedAudioContextState('unknown')).toBe(false)
  })
})
