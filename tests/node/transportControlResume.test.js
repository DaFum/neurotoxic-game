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
  stop: mock.fn(),
  cancel: mock.fn(),
  clear: mock.fn(),
  position: 0
}

let gateRefuses = false
// When set, the audio-context gate waits on this promise before running `fn`,
// modelling a context that is still resuming.
let gateDelay = null
let contextTimeSec = 0

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
    getAudioContextTimeSec: () => contextTimeSec,
    // Mirrors the real contract: `null` means the guard refused to run `fn`.
    withAudioContext: mock.fn(async fn => {
      if (gateDelay) await gateDelay
      return gateRefuses ? null : await fn()
    })
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

const { resumeAudio, pauseAudio, stopAudio, getTransportState } =
  await import('../../src/utils/audio/transportControl')
const { startTransportAt } =
  await import('../../src/utils/audio/transportStart')
const { audioState, resetGigState } =
  await import('../../src/utils/audio/state')

const reset = () => {
  resetGigState()
  gateRefuses = false
  gateDelay = null
  contextTimeSec = 0
  transport.state = 'paused'
  transport.start.mock.resetCalls()
  transport.pause.mock.resetCalls()
  transport.stop.mock.resetCalls()
  audioState.transportScheduledStart = null
  audioState.transportDeferredStart = null
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

test('a pause that lands while a resume waits on the context gate wins', async () => {
  reset()
  let releaseGate
  gateDelay = new Promise(resolve => {
    releaseGate = resolve
  })
  audioState.gigIsPaused = true

  const pendingResume = resumeAudio()
  await pauseAudio()
  releaseGate()

  assert.strictEqual(await pendingResume, false)
  assert.strictEqual(transport.start.mock.calls.length, 0)
  assert.strictEqual(audioState.gigIsPaused, true)
})

test('pausing before a scheduled transport start defers it until resume', async () => {
  reset()
  transport.state = 'stopped'
  contextTimeSec = 10
  // Lead-in: the transport is scheduled to start 2s from now at offset 3s.
  startTransportAt(12, 3)
  transport.start.mock.resetCalls()

  contextTimeSec = 11
  await pauseAudio()
  assert.strictEqual(transport.stop.mock.calls.length, 1)

  // Resume 5s later: the remaining 1s of lead-in is kept and the offset reused.
  contextTimeSec = 16
  audioState.gigIsPaused = false
  assert.strictEqual(await resumeAudio(), true)
  assert.deepStrictEqual(transport.start.mock.calls[0].arguments, [17, 3])
})

test('a deferred transport start reports as paused', async () => {
  reset()
  transport.state = 'stopped'
  contextTimeSec = 10
  startTransportAt(12, 0)
  contextTimeSec = 11
  await pauseAudio()

  // The rhythm loop only resumes a `paused` transport; Tone's `stopped` would
  // leave the deferred start pending forever.
  assert.strictEqual(getTransportState(), 'paused')
})

test('pausing in a lead-in defers the scheduled start while the transport runs', async () => {
  reset()
  // The next song's lead-in start is scheduled, and the overlay's resume has
  // already restarted the transport when a gig event pauses it again.
  transport.state = 'started'
  contextTimeSec = 10
  startTransportAt(12, 0)
  transport.start.mock.resetCalls()

  contextTimeSec = 11
  await pauseAudio()
  // `pause()` would leave the scheduled restart in Tone's timeline, so the
  // transport would start by itself while the event overlay is still open.
  assert.strictEqual(transport.pause.mock.calls.length, 0)
  assert.strictEqual(transport.stop.mock.calls.length, 1)
  transport.state = 'stopped'
  assert.strictEqual(getTransportState(), 'paused')

  contextTimeSec = 16
  audioState.gigIsPaused = false
  assert.strictEqual(await resumeAudio(), true)
  assert.deepStrictEqual(transport.start.mock.calls[0].arguments, [17, 0])
})

test('stopping audio drops a deferred transport start', async () => {
  reset()
  transport.state = 'stopped'
  contextTimeSec = 10
  startTransportAt(12, 0)
  contextTimeSec = 11
  await pauseAudio()
  stopAudio()
  transport.start.mock.resetCalls()

  audioState.gigIsPaused = false
  await resumeAudio()
  assert.strictEqual(transport.start.mock.calls.length, 0)
})

test('a transport start that throws leaves no phantom scheduled start', () => {
  reset()
  transport.start.mock.mockImplementationOnce(() => {
    throw new Error('start failed')
  })
  assert.throws(() => startTransportAt(12, 0))
  assert.strictEqual(audioState.transportScheduledStart, null)
})

test('a deferred start survives a re-schedule that throws', async () => {
  reset()
  transport.state = 'stopped'
  contextTimeSec = 10
  startTransportAt(12, 0)
  contextTimeSec = 11
  await pauseAudio()
  transport.start.mock.mockImplementationOnce(() => {
    throw new Error('start failed')
  })
  audioState.gigIsPaused = false

  assert.strictEqual(await resumeAudio(), false)
  assert.ok(audioState.transportDeferredStart)
})
