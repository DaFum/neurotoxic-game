import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

// state.ts only imports the logger at runtime (its Tone.js imports are
// type-only), so the logger is the single dependency this suite has to stub.
const mockLogger = {
  warn: mock.fn(),
  debug: mock.fn(),
  error: mock.fn(),
  info: mock.fn()
}
mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: { logger: mockLogger }
})

const { audioState, audioResourceRegistry, releaseAudioResource } =
  await import('../../src/utils/audio/state')

const createNode = ({ stop, disposeThrows } = {}) => ({
  ...(stop ? { stop } : {}),
  dispose: mock.fn(() => {
    if (disposeThrows) throw disposeThrows
  })
})

const createSource = ({ stopThrows, disconnectThrows } = {}) => ({
  stop: mock.fn(() => {
    if (stopThrows) throw stopThrows
  }),
  disconnect: mock.fn(() => {
    if (disconnectThrows) throw disconnectThrows
  })
})

const createKit = () => ({
  kick: createNode(),
  snare: createNode(),
  hihat: createNode(),
  crash: createNode()
})

// Asserted in registry order, not sorted: the order IS the teardown contract.
// Sources lead so buffer playback stops before the buses feeding it are
// disposed, and the master chain trails so it outlives everything routed into
// it. `masterCorruption` is absent on purpose — it is declared on `audioState`
// and read by `corruptionEffects.ts`, but never assigned anywhere, so there is
// nothing to release.
const EXPECTED_REGISTRY_KEYS = [
  'gigSource',
  'ambientSource',
  'guitar',
  'bass',
  'drumKit',
  'sfxSynth',
  'sfxGain',
  'musicGain',
  'midiLead',
  'midiBass',
  'midiDrumKit',
  'midiReverbSend',
  'midiReverb',
  'midiDryBus',
  'distortion',
  'guitarChorus',
  'guitarEq',
  'widener',
  'bassEq',
  'bassComp',
  'drumBus',
  'reverbSend',
  'reverb',
  'masterCorruptionDistortion',
  'masterCorruptionBypass',
  'masterCorruptionWetGain',
  'neuroDistortion',
  'masterComp',
  'masterLimiter'
]

test('audioResourceRegistry covers every disposable audioState slot', () => {
  assert.deepStrictEqual(
    [...audioResourceRegistry.keys()],
    EXPECTED_REGISTRY_KEYS
  )

  for (const [key, entry] of audioResourceRegistry) {
    assert.strictEqual(entry.key, key)
    assert.strictEqual(typeof entry.ref, 'function')
    assert.strictEqual(typeof entry.dispose, 'function')
    assert.ok(Object.hasOwn(audioState, key), `${key} must exist on audioState`)
  }
})

test('entry.ref reads the live slot', () => {
  const node = createNode()
  const entry = audioResourceRegistry.get('guitar')

  assert.strictEqual(entry.ref(), null)
  audioState.guitar = node
  assert.strictEqual(entry.ref(), node)
  releaseAudioResource('guitar')
})

test('node release', async t => {
  t.beforeEach(() => {
    mockLogger.debug.mock.resetCalls()
    audioState.guitar = null
    audioState.guitarChorus = null
  })

  await t.test('disposes the node and empties the slot', () => {
    const node = createNode()
    audioState.guitar = node

    releaseAudioResource('guitar')

    assert.strictEqual(node.dispose.mock.calls.length, 1)
    assert.strictEqual(audioState.guitar, null)
  })

  await t.test('stops a stoppable node before disposing it', () => {
    const order = []
    const node = {
      stop: mock.fn(() => order.push('stop')),
      dispose: mock.fn(() => order.push('dispose'))
    }
    audioState.guitarChorus = node

    releaseAudioResource('guitarChorus')

    assert.deepStrictEqual(order, ['stop', 'dispose'])
    assert.strictEqual(audioState.guitarChorus, null)
  })

  await t.test('skips stop on an already-disposed node', () => {
    const node = createNode({ stop: mock.fn() })
    node.disposed = true
    audioState.guitarChorus = node

    releaseAudioResource('guitarChorus')

    assert.strictEqual(node.stop.mock.calls.length, 0)
    assert.strictEqual(node.dispose.mock.calls.length, 1)
  })

  await t.test('logs a failing dispose and still empties the slot', () => {
    const error = new Error('Disposal failed')
    audioState.guitar = createNode({ disposeThrows: error })

    releaseAudioResource('guitar')

    assert.ok(
      mockLogger.debug.mock.calls.some(
        call =>
          call.arguments[1] === 'Node disposal failed (likely benign)' &&
          call.arguments[2] === error
      )
    )
    assert.strictEqual(audioState.guitar, null)
  })

  await t.test('stays silent when stop reports InvalidStateError', () => {
    const invalidState = new Error('already stopped')
    invalidState.name = 'InvalidStateError'
    audioState.guitarChorus = createNode({
      stop: mock.fn(() => {
        throw invalidState
      })
    })

    releaseAudioResource('guitarChorus')

    assert.strictEqual(mockLogger.debug.mock.calls.length, 0)
  })

  await t.test('logs any other stop failure', () => {
    const error = new Error('Stop failed')
    audioState.guitarChorus = createNode({
      stop: mock.fn(() => {
        throw error
      })
    })

    releaseAudioResource('guitarChorus')

    assert.ok(
      mockLogger.debug.mock.calls.some(
        call =>
          call.arguments[1] === 'guitarChorus stop failed' &&
          call.arguments[2] === error
      )
    )
  })
})

test('drum-kit release disposes every voice once', async t => {
  for (const key of ['drumKit', 'midiDrumKit']) {
    await t.test(key, () => {
      const kit = createKit()
      audioState[key] = kit

      releaseAudioResource(key)

      for (const voice of ['kick', 'snare', 'hihat', 'crash']) {
        assert.strictEqual(
          kit[voice].dispose.mock.calls.length,
          1,
          `${key}.${voice} should be disposed`
        )
      }
      assert.strictEqual(audioState[key], null)
    })
  }
})

test('source release', async t => {
  t.beforeEach(() => {
    mockLogger.debug.mock.resetCalls()
    audioState.ambientSource = null
  })

  await t.test('stops and disconnects the source', () => {
    const source = createSource()
    audioState.ambientSource = source

    releaseAudioResource('ambientSource')

    assert.strictEqual(source.stop.mock.calls.length, 1)
    assert.strictEqual(source.disconnect.mock.calls.length, 1)
    assert.strictEqual(audioState.ambientSource, null)
    assert.strictEqual(mockLogger.debug.mock.calls.length, 0)
  })

  await t.test('is a no-op on an empty slot', () => {
    releaseAudioResource('ambientSource')

    assert.strictEqual(audioState.ambientSource, null)
    assert.strictEqual(mockLogger.debug.mock.calls.length, 0)
  })

  await t.test('disconnects even when stop throws', () => {
    const error = new Error('Stop failed')
    const source = createSource({ stopThrows: error })
    audioState.ambientSource = source

    releaseAudioResource('ambientSource')

    assert.strictEqual(source.disconnect.mock.calls.length, 1)
    assert.ok(
      mockLogger.debug.mock.calls.some(
        call =>
          call.arguments[1] === 'ambientSource stop failed' &&
          call.arguments[2] === error
      )
    )
  })

  await t.test('logs a failing disconnect', () => {
    const error = new Error('Disconnect failed')
    audioState.ambientSource = createSource({ disconnectThrows: error })

    releaseAudioResource('ambientSource')

    assert.ok(
      mockLogger.debug.mock.calls.some(
        call =>
          call.arguments[1] === 'ambientSource disconnect failed' &&
          call.arguments[2] === error
      )
    )
    assert.strictEqual(audioState.ambientSource, null)
  })
})

test('gigSource release', async t => {
  const seedGigState = () => {
    audioState.gigBuffer = { duration: 1 }
    audioState.gigFilename = 'song.ogg'
    audioState.gigStartCtxTime = 12
    audioState.gigSeekOffsetMs = 500
    audioState.gigBaseOffsetMs = 250
    audioState.gigDurationMs = 30000
    audioState.gigOnEnded = () => {}
    audioState.gigIsPaused = true
  }

  const assertGigStateReset = () => {
    assert.strictEqual(audioState.gigSource, null)
    assert.strictEqual(audioState.gigBuffer, null)
    assert.strictEqual(audioState.gigFilename, null)
    assert.strictEqual(audioState.gigStartCtxTime, null)
    assert.strictEqual(audioState.gigSeekOffsetMs, 0)
    assert.strictEqual(audioState.gigBaseOffsetMs, 0)
    assert.strictEqual(audioState.gigDurationMs, null)
    assert.strictEqual(audioState.gigOnEnded, null)
    assert.strictEqual(audioState.gigIsPaused, false)
  }

  await t.test('stops the source and clears the gig clock', () => {
    const source = createSource()
    seedGigState()
    audioState.gigSource = source

    releaseAudioResource('gigSource')

    assert.strictEqual(source.stop.mock.calls.length, 1)
    assert.strictEqual(source.disconnect.mock.calls.length, 1)
    assertGigStateReset()
  })

  await t.test('clears the gig clock even with no active source', () => {
    seedGigState()
    audioState.gigSource = null

    releaseAudioResource('gigSource')

    assertGigStateReset()
  })
})
