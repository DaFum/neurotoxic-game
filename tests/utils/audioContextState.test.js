import { describe, it } from 'node:test'
import assert from 'node:assert'
import { isClosedAudioContextState } from '../../src/utils/audioContextState.js'

describe('isClosedAudioContextState', () => {
  it('returns true when state is closed', () => {
    assert.strictEqual(isClosedAudioContextState('closed'), true)
  })

  it('returns false when state is running', () => {
    assert.strictEqual(isClosedAudioContextState('running'), false)
  })

  it('returns false when state is suspended', () => {
    assert.strictEqual(isClosedAudioContextState('suspended'), false)
  })

  it('returns false when state is interrupted', () => {
    assert.strictEqual(isClosedAudioContextState('interrupted'), false)
  })

  it('returns false for unknown state', () => {
    assert.strictEqual(isClosedAudioContextState('unknown'), false)
  })
})
