import assert from 'node:assert'
import { test } from 'node:test'

import {
  canResumeAudioContextState,
  getAudioResumeTarget,
  getPreferredAudioContextState,
  isClosedAudioContextState
} from '../src/utils/audioContextState.js'

test('getPreferredAudioContextState prefers raw context state', () => {
  assert.strictEqual(
    getPreferredAudioContextState({
      rawContextState: 'closed',
      toneContextState: 'running'
    }),
    'closed'
  )
})

test('getPreferredAudioContextState falls back to tone context state', () => {
  assert.strictEqual(
    getPreferredAudioContextState({
      rawContextState: null,
      toneContextState: 'suspended'
    }),
    'suspended'
  )
})

test('getPreferredAudioContextState returns unknown when no state exists', () => {
  assert.strictEqual(
    getPreferredAudioContextState({
      rawContextState: undefined,
      toneContextState: undefined
    }),
    'unknown'
  )
})

test('canResumeAudioContextState only allows resumable states', () => {
  assert.strictEqual(canResumeAudioContextState('suspended'), true)
  assert.strictEqual(canResumeAudioContextState('interrupted'), true)
  assert.strictEqual(canResumeAudioContextState('closed'), false)
  assert.strictEqual(canResumeAudioContextState('running'), false)
})

test('isClosedAudioContextState only matches closed state', () => {
  assert.strictEqual(isClosedAudioContextState('closed'), true)
  assert.strictEqual(isClosedAudioContextState('suspended'), false)
  assert.strictEqual(isClosedAudioContextState('running'), false)
})

test('getAudioResumeTarget prefers Tone context resume implementation', () => {
  const toneContext = { resume: () => Promise.resolve('tone') }
  const rawContext = { resume: () => Promise.resolve('raw') }
  assert.strictEqual(
    getAudioResumeTarget({ toneContext, rawContext }),
    toneContext
  )
})

test('getAudioResumeTarget falls back to raw context when needed', () => {
  const rawContext = { resume: () => Promise.resolve('raw') }
  assert.strictEqual(
    getAudioResumeTarget({ toneContext: {}, rawContext }),
    rawContext
  )
})

test('getAudioResumeTarget returns null when no resume method exists', () => {
  assert.strictEqual(
    getAudioResumeTarget({ toneContext: {}, rawContext: {} }),
    null
  )
})
