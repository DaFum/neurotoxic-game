import { test, mock } from 'node:test'
import assert from 'node:assert'
import { createMockTone, MockGain, MockPolySynth } from './mockUtils.js'

// 1. Mock Tone.js
const mockTone = createMockTone()
mockTone.context = mockTone.getContext()
mock.module('tone', { namedExports: mockTone })

// 2. Mock Logger
const mockLogger = {
  debug: mock.fn(),
  warn: mock.fn(),
  error: mock.fn(),
  info: mock.fn()
}
mock.module('../src/utils/logger.js', { namedExports: { logger: mockLogger } })

// 3. Mock cleanupUtils
const mockCleanup = {
  stopTransportAndClear: mock.fn(),
  cleanupGigPlayback: mock.fn(),
  cleanupAmbientPlayback: mock.fn(),
  cleanupTransportEvents: mock.fn()
}
mock.module('../src/utils/audio/cleanupUtils.js', { namedExports: mockCleanup })

// Now import the SUT and audioState
const {
  safeDispose,
  setupAudio,
  ensureAudioContext,
  disposeAudio,
  getRawAudioContext,
  getAudioContextTimeSec,
  getToneStartTimeSec
} = await import('../src/utils/audio/setup.js')
const { audioState } = await import('../src/utils/audio/state.js')

test('Audio Setup Utilities', async t => {
  await t.test('safeDispose', async t => {
    await t.test('returns null when node is null', () => {
      assert.strictEqual(safeDispose(null), null)
    })

    await t.test('returns null when node has no dispose method', () => {
      assert.strictEqual(safeDispose({}), null)
    })

    await t.test('calls dispose and returns null', () => {
      const node = { dispose: mock.fn() }
      assert.strictEqual(safeDispose(node), null)
      assert.strictEqual(node.dispose.mock.calls.length, 1)
    })

    await t.test('swallows error and logs it', () => {
      const error = new Error('Dispose failed')
      const node = {
        dispose: mock.fn(() => {
          throw error
        })
      }
      mockLogger.debug.mock.resetCalls()
      assert.strictEqual(safeDispose(node), null)
      assert.strictEqual(mockLogger.debug.mock.calls.length, 1)
      assert.strictEqual(mockLogger.debug.mock.calls[0].arguments[2], error)
    })
  })

  await t.test('Context Helpers', async t => {
    await t.test('getRawAudioContext returns context or rawContext', () => {
      const ctx = getRawAudioContext()
      assert.ok(ctx)
      assert.strictEqual(ctx, mockTone.getContext().rawContext)
    })

    await t.test('getAudioContextTimeSec returns currentTime', () => {
      const ctx = getRawAudioContext()
      ctx.currentTime = 123.45
      assert.strictEqual(getAudioContextTimeSec(), 123.45)
    })

    await t.test('getToneStartTimeSec adds lookAhead', () => {
      const toneCtx = mockTone.getContext()
      toneCtx.lookAhead = 0.1
      assert.strictEqual(getToneStartTimeSec(10), 10.1)
    })
  })

  await t.test('setupAudio', async t => {
    t.beforeEach(() => {
      audioState.isSetup = false
      audioState.setupLock = null
      audioState.setupError = null
      mockTone.start.mock.resetCalls()
      mockTone.setContext.mock.resetCalls()
      mockTone.start.mock.mockImplementation(async () => {})
      MockGain.shouldFail = false
    })

    await t.test('initializes audio state successfully', async () => {
      await setupAudio()
      assert.strictEqual(audioState.isSetup, true)
      assert.ok(audioState.guitar)
      assert.ok(audioState.bass)
      assert.ok(audioState.drumKit)
      assert.ok(audioState.masterLimiter)
      assert.strictEqual(mockTone.setContext.mock.calls.length, 1)
      assert.strictEqual(mockTone.start.mock.calls.length, 1)
    })

    await t.test('returns early if already setup', async () => {
      audioState.isSetup = true
      await setupAudio()
      assert.strictEqual(mockTone.start.mock.calls.length, 0)
    })

    await t.test('handles concurrent setup calls', async () => {
      let resolveStart
      const startPromise = new Promise(r => {
        resolveStart = r
      })
      mockTone.start.mock.mockImplementation(() => startPromise)

      const p1 = setupAudio()
      const p2 = setupAudio()

      assert.ok(audioState.setupLock)

      resolveStart()
      await Promise.all([p1, p2])

      assert.strictEqual(mockTone.start.mock.calls.length, 1)
    })

    await t.test('handles setup errors', async () => {
      const error = new Error('Setup failed')

      // setupAudio calls Tone.setContext(nextToneContext)
      // Use mockImplementation instead of reassigning the property
      mockTone.setContext.mock.mockImplementation(() => { throw error })

      try {
        await assert.rejects(setupAudio(), (err) => {
            return err === error
        })
        assert.strictEqual(audioState.isSetup, false)
        assert.strictEqual(audioState.setupError, error)
      } finally {
        mockTone.setContext.mock.mockImplementation(() => {})
      }
    })
  })

  await t.test('disposeAudio', async t => {
    await t.test('cleans up resources and resets isSetup', async () => {
      await setupAudio()
      assert.strictEqual(audioState.isSetup, true)

      disposeAudio()

      assert.strictEqual(audioState.isSetup, false)
      assert.strictEqual(audioState.guitar, null)
      assert.strictEqual(audioState.bass, null)
      assert.strictEqual(audioState.drumKit, null)
      assert.strictEqual(mockCleanup.stopTransportAndClear.mock.calls.length >= 1, true)
    })
  })

  await t.test('ensureAudioContext', async t => {
    t.beforeEach(() => {
      audioState.isSetup = true
      audioState.rebuildLock = null
      mockTone.getContext().rawContext.state = 'running'
      mockTone.getContext().state = 'running'
    })

    await t.test('returns true if already running', async () => {
      const result = await ensureAudioContext()
      assert.strictEqual(result, true)
    })

    await t.test('attempts to resume if suspended', async () => {
      let state = 'suspended'
      const context = mockTone.getContext()

      // Setup dynamic state for this test
      const originalStateDesc = Object.getOwnPropertyDescriptor(context.rawContext, 'state')

      Object.defineProperty(context.rawContext, 'state', {
        get: () => state,
        set: v => { state = v },
        configurable: true
      })
      Object.defineProperty(context, 'state', {
        get: () => state,
        set: v => { state = v },
        configurable: true
      })

      const resumeMock = mock.fn(async () => {
        state = 'running'
      })
      context.resume = resumeMock

      try {
        const result = await ensureAudioContext()
        assert.strictEqual(result, true)
        // resume is called on Tone.context
        assert.strictEqual(resumeMock.mock.calls.length, 1)
      } finally {
        if (originalStateDesc) {
            Object.defineProperty(context.rawContext, 'state', originalStateDesc)
            Object.defineProperty(context, 'state', originalStateDesc)
        }
      }
    })

    await t.test('rebuilds if context is closed', async () => {
      let state = 'closed'
      const context = mockTone.getContext()

      Object.defineProperty(context.rawContext, 'state', {
        get: () => state,
        set: v => {
          state = v
        },
        configurable: true
      })
      Object.defineProperty(context, 'state', {
        get: () => state,
        set: v => {
          state = v
        },
        configurable: true
      })

      // When setupAudio is called (via rebuild), it triggers Tone.start()
      // We use this as a hook to change the state to 'running'
      mockTone.start.mock.mockImplementation(async () => {
        state = 'running'
      })

      const result = await ensureAudioContext()
      assert.strictEqual(result, true)
      assert.strictEqual(mockTone.start.mock.calls.length >= 1, true)
    })

    await t.test('handles concurrent rebuild calls', async () => {
        mockTone.getContext().rawContext.state = 'closed'
        let resolveStart
        const startPromise = new Promise(r => { resolveStart = r })
        mockTone.start.mock.mockImplementation(() => startPromise)

        const p1 = ensureAudioContext()
        const p2 = ensureAudioContext()

        assert.ok(audioState.rebuildLock)

        resolveStart()
        await Promise.all([p1, p2])
        // Should have only triggered rebuild once
    })
  })
})
