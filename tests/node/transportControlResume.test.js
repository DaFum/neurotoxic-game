/**
 * @fileoverview `resumeAudio` failure reporting.
 *
 * `resumeAudio`'s return value gates whether callers clear the paused state and
 * announce that audio resumed. Reporting success while the transport is not
 * running is the exact failure the `withAudioContext` guard was added to prevent,
 * so both failure modes — a refused audio-context gate and a transport that
 * throws on start — must surface as `false`.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const transport = {
  state: 'paused',
  start: mock.fn(async () => {}),
  pause: mock.fn(async () => {}),
  stop: mock.fn()
}

let gateRefuses = false

mock.module('tone', {
  namedExports: {
    getTransport: () => transport,
    getContext: () => ({ rawContext: { currentTime: 0, state: 'running' } }),
    context: { state: 'running', resume: mock.fn(async () => {}) },
    getDestination: () => ({ mute: false }),
    now: () => 0
  }
})

mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    ensureAudioContext: mock.fn(async () => true),
    getRawAudioContext: () => ({ currentTime: 0, state: 'running' }),
    getAudioContextTimeSec: () => 0,
    // Mirrors the real contract: `null` means the guard refused to run `fn`.
    withAudioContext: mock.fn(async fn => (gateRefuses ? null : await fn()))
  }
})

mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: {
    logger: {
      debug: mock.fn(),
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn()
    }
  }
})

const { resumeAudio } = await import('../../src/utils/audio/transportControl')
const { audioState, resetGigState } =
  await import('../../src/utils/audio/state')

const reset = () => {
  resetGigState()
  gateRefuses = false
  transport.state = 'paused'
  transport.start.mock.resetCalls()
}

test('resumeAudio reports failure when the audio-context gate refuses', async () => {
  reset()
  gateRefuses = true
  // `gigIsPaused` false is the case that used to return `true` regardless: with
  // no gig to resume, the transport start was the only work, and a refused gate
  // meant it never happened.
  audioState.gigIsPaused = false

  assert.strictEqual(await resumeAudio(), false)
  assert.strictEqual(transport.start.mock.calls.length, 0)
})

test('resumeAudio reports failure when the transport start rejects', async () => {
  reset()
  audioState.gigIsPaused = false
  transport.start.mock.mockImplementationOnce(async () => {
    throw new Error('transport start rejected')
  })

  assert.strictEqual(await resumeAudio(), false)
})

test('resumeAudio reports success when the transport starts and no gig is paused', async () => {
  reset()
  audioState.gigIsPaused = false

  assert.strictEqual(await resumeAudio(), true)
  assert.strictEqual(transport.start.mock.calls.length, 1)
})

test('resumeAudio skips the transport start when it is not paused', async () => {
  reset()
  transport.state = 'started'
  audioState.gigIsPaused = false

  assert.strictEqual(await resumeAudio(), true)
  assert.strictEqual(transport.start.mock.calls.length, 0)
})
