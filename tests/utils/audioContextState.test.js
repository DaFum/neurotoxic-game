import { describe, it, vi } from "vitest";
import assert from 'node:assert'
import {
  isClosedAudioContextState,
  getPreferredAudioContextState,
  canResumeAudioContextState
} from '../../src/utils/audioContextState.js'

describe('getPreferredAudioContextState', () => {
  it('returns rawContextState when available', () => {
    assert.strictEqual(
      getPreferredAudioContextState({
        rawContextState: 'running',
        toneContextState: 'suspended'
      }),
      'running'
    )
  })

  it('returns toneContextState when rawContextState is unavailable', () => {
    assert.strictEqual(
      getPreferredAudioContextState({ toneContextState: 'suspended' }),
      'suspended'
    )
    assert.strictEqual(
      getPreferredAudioContextState({
        rawContextState: null,
        toneContextState: 'suspended'
      }),
      'suspended'
    )
  })

  it('returns "unknown" when neither state is available', () => {
    assert.strictEqual(getPreferredAudioContextState({}), 'unknown')
    assert.strictEqual(
      getPreferredAudioContextState({
        rawContextState: null,
        toneContextState: undefined
      }),
      'unknown'
    )
  })
})

describe('canResumeAudioContextState', () => {
  it('returns true when state is suspended', () => {
    assert.strictEqual(canResumeAudioContextState('suspended'), true)
  })

  it('returns true when state is interrupted', () => {
    assert.strictEqual(canResumeAudioContextState('interrupted'), true)
  })

  it('returns false when state is running', () => {
    assert.strictEqual(canResumeAudioContextState('running'), false)
  })

  it('returns false when state is closed', () => {
    assert.strictEqual(canResumeAudioContextState('closed'), false)
  })
})

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
