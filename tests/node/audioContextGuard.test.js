/**
 * @fileoverview Tests for the `withAudioContext` autoplay guard.
 *
 * Browser autoplay policies leave the context suspended until a user gesture, so
 * `start`/`stop` against a suspended context is a real failure mode: silent
 * playback or a throwing node. These cases pin the guard's outcomes: run,
 * resume-then-run (through the right resume per state), and refuse-with-a-log.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

// Each resume only clears the state it is actually able to clear on a real
// browser: `Tone.context.resume()` handles `suspended`, while iOS Safari's
// `interrupted` requires the native `AudioContext.resume()`. Keeping the fakes
// asymmetric is what makes the `interrupted` case meaningful.
const rawContext = {
  state: 'running',
  resume: mock.fn(async () => {
    rawContext.state = 'running'
    toneContext.state = 'running'
  })
}
const toneContext = {
  state: 'running',
  resume: mock.fn(async () => {
    if (rawContext.state === 'interrupted') return
    rawContext.state = 'running'
    toneContext.state = 'running'
  })
}

mock.module('tone', {
  namedExports: {
    getContext: () => ({ rawContext }),
    get context() {
      return toneContext
    },
    getTransport: () => ({ start: mock.fn(), stop: mock.fn() })
  }
})

const warn = mock.fn()

mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: {
    logger: { debug: mock.fn(), info: mock.fn(), warn, error: mock.fn() }
  }
})

const { withAudioContext } = await import('../../src/utils/audio/context')

const reset = (state = 'running') => {
  rawContext.state = state
  toneContext.state = state
  rawContext.resume.mock.resetCalls()
  toneContext.resume.mock.resetCalls()
  warn.mock.resetCalls()
}

test('withAudioContext runs the operation on a running context', async () => {
  reset('running')
  const run = mock.fn(() => 'played')

  const result = await withAudioContext(run, 'test')

  assert.strictEqual(result, 'played')
  assert.strictEqual(run.mock.calls.length, 1)
  assert.strictEqual(toneContext.resume.mock.calls.length, 0)
  assert.strictEqual(warn.mock.calls.length, 0)
})

test('withAudioContext resumes a suspended context before running', async () => {
  reset('suspended')
  const run = mock.fn(() => 'played')

  const result = await withAudioContext(run, 'test')

  assert.strictEqual(result, 'played')
  assert.strictEqual(toneContext.resume.mock.calls.length, 1)
  assert.strictEqual(run.mock.calls.length, 1)
})

test('withAudioContext resumes the iOS interrupted state natively', async () => {
  reset('interrupted')
  const run = mock.fn(() => 'played')

  const result = await withAudioContext(run, 'test')

  assert.strictEqual(result, 'played')
  assert.strictEqual(run.mock.calls.length, 1)
  // `Tone.context.resume()` does not clear `interrupted` on iOS Safari, so the
  // guard must go through the native context — the same split
  // `ensureAudioContext()` makes.
  assert.strictEqual(rawContext.resume.mock.calls.length, 1)
  assert.strictEqual(toneContext.resume.mock.calls.length, 0)
})

test('withAudioContext refuses and logs when resume does not take', async () => {
  reset('suspended')
  toneContext.resume.mock.mockImplementationOnce(async () => {
    // A resume that the browser accepts but does not honour, because no user
    // gesture has happened yet.
  })
  const run = mock.fn(() => 'played')

  const result = await withAudioContext(run, 'blockedOp')

  assert.strictEqual(result, null)
  assert.strictEqual(run.mock.calls.length, 0)
  const messages = warn.mock.calls.map(call => call.arguments[1])
  assert.ok(
    messages.some(message => message.includes('blockedOp')),
    `expected a warning naming the operation, got ${JSON.stringify(messages)}`
  )
  assert.ok(messages.some(message => message.includes('suspended')))
})

test('withAudioContext refuses a closed context without resuming it', async () => {
  reset('closed')
  const run = mock.fn(() => 'played')

  const result = await withAudioContext(run, 'closedOp')

  assert.strictEqual(result, null)
  assert.strictEqual(run.mock.calls.length, 0)
  // Rebuilding a closed context is `ensureAudioContext()`'s job, not this guard's.
  assert.strictEqual(toneContext.resume.mock.calls.length, 0)
  assert.ok(
    warn.mock.calls.some(call => call.arguments[1].includes('closed')),
    'the refusal must name the closed state'
  )
})

test('withAudioContext lets an error from the operation propagate', async () => {
  reset('running')

  await assert.rejects(
    () =>
      withAudioContext(() => {
        throw new Error('node failure')
      }, 'throwingOp'),
    /node failure/
  )
})

test('withAudioContext reports a failed resume and still refuses', async () => {
  reset('suspended')
  toneContext.resume.mock.mockImplementationOnce(async () => {
    throw new Error('resume rejected')
  })
  const run = mock.fn(() => 'played')

  const result = await withAudioContext(run, 'rejectedOp')

  assert.strictEqual(result, null)
  assert.strictEqual(run.mock.calls.length, 0)
  assert.ok(
    warn.mock.calls.some(call =>
      call.arguments[1].includes('context resume failed')
    ),
    'the rejected resume must be logged'
  )
})

test('withAudioContext refuses when the context state read throws', async () => {
  reset('running')
  const run = mock.fn(() => 'played')
  const descriptor = Object.getOwnPropertyDescriptor(rawContext, 'state')
  Object.defineProperty(rawContext, 'state', {
    configurable: true,
    get() {
      throw new Error('context detached')
    }
  })

  try {
    const result = await withAudioContext(run, 'readFailure')

    assert.strictEqual(result, null)
    assert.strictEqual(run.mock.calls.length, 0)
    assert.ok(
      warn.mock.calls.some(call =>
        call.arguments[1].includes('audio context state read failed')
      ),
      'the failed state read must be logged'
    )
  } finally {
    Object.defineProperty(rawContext, 'state', descriptor)
  }
})
