import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  NullAudioEngine,
  createStubAudioEngine,
  toneAudioEngine
} from '../../src/utils/audio/audioEngineInterface'

const ENGINE_METHODS = [
  'getGigTimeMs',
  'startGig',
  'stopGig',
  'scheduleNote',
  'ensureAudioContext',
  'playSongSequence',
  'stopAudio',
  'getTransportState',
  'pauseAudio',
  'resumeAudio',
  'setCorruptionEffect',
  'enableCorruptionBurstAudio',
  'disableCorruptionBurstAudio',
  'getToneAbsoluteTimeMs',
  'playSFX',
  'stopMusic',
  'getPlayRequestId'
]

describe('IAudioEngine implementations', () => {
  test('the real engine implements the whole surface', () => {
    for (const method of ENGINE_METHODS) {
      assert.equal(
        typeof toneAudioEngine[method],
        'function',
        `toneAudioEngine.${method}`
      )
    }
  })

  test('NullAudioEngine reports a frozen clock and does nothing else', async () => {
    const engine = new NullAudioEngine()

    assert.equal(engine.getGigTimeMs(), 0)
    assert.equal(await engine.startGig({ filename: 'x.ogg' }), false)
    assert.doesNotThrow(() => {
      engine.stopGig()
      engine.scheduleNote(60, 'guitar', 0, 127)
    })
  })

  test('NullAudioEngine needs no AudioContext', () => {
    // Constructing and driving it must not touch any audio global; the whole
    // point is that CI can run gig logic without a Web Audio implementation.
    const engine = new NullAudioEngine()

    for (let i = 0; i < 100; i++) engine.scheduleNote(60, 'drums', i)
    assert.equal(engine.getGigTimeMs(), 0)
  })

  test('the stub engine reports a caller-driven gig clock', () => {
    let now = 0
    const engine = createStubAudioEngine(() => now)

    assert.equal(engine.getGigTimeMs(), 0)
    now = 1234
    assert.equal(engine.getGigTimeMs(), 1234)
  })

  test('every implementation satisfies the same surface', () => {
    const implementations = [
      toneAudioEngine,
      new NullAudioEngine(),
      createStubAudioEngine(() => 0)
    ]

    for (const engine of implementations) {
      for (const method of ENGINE_METHODS) {
        assert.equal(typeof engine[method], 'function')
      }
    }
  })
})

describe('createStubAudioEngine play-request id', () => {
  test('advances on session start and on invalidation', () => {
    const engine = createStubAudioEngine(() => 0)
    const initial = engine.getPlayRequestId()

    engine.startGig({ filename: 'x.ogg' })
    const afterStart = engine.getPlayRequestId()
    assert.notEqual(afterStart, initial)

    engine.stopAudio()
    assert.notEqual(engine.getPlayRequestId(), afterStart)
  })

  test('is stable while no session boundary is crossed', () => {
    const engine = createStubAudioEngine(() => 0)
    const id = engine.getPlayRequestId()

    engine.scheduleNote(60, 'guitar', 0, 127)
    engine.playSFX('hit')

    assert.equal(engine.getPlayRequestId(), id)
  })

  test('each stub keeps its own counter', () => {
    const a = createStubAudioEngine(() => 0)
    const b = createStubAudioEngine(() => 0)

    a.startGig({ filename: 'x.ogg' })

    assert.notEqual(a.getPlayRequestId(), b.getPlayRequestId())
  })
})

describe('audio engine injection', () => {
  /**
   * Importing the audio singleton at module scope in a gig consumer prevents
   * substitution in tests — the whole point of the interface. Each consumer
   * must take the engine from the context (hooks) or from its options (the
   * Pixi controller).
   */
  const CONSUMERS = [
    'src/hooks/rhythmGame/useRhythmGameInput.ts',
    'src/hooks/rhythmGame/useRhythmGameScoring.ts',
    'src/hooks/rhythmGame/useRhythmGameLoop.ts',
    'src/hooks/rhythmGame/scoring/useHandleHit.ts',
    'src/hooks/rhythmGame/scoring/useHandleMiss.ts',
    'src/hooks/rhythmGame/useRhythmGameAudio.ts',
    'src/components/PixiStageController.ts'
  ]

  // Consumers of the playback lifecycle, not just the clock. A substituted
  // engine only prevents `AudioContext` creation if these go through it too.
  const PLAYBACK_CONSUMERS = [
    'src/hooks/rhythmGame/useRhythmGameAudio.ts',
    'src/hooks/rhythmGame/useRhythmGameLoop.ts',
    'src/hooks/rhythmGame/scoring/useHandleMiss.ts',
    'src/hooks/useRhythmGameLogic.ts'
  ]

  for (const file of PLAYBACK_CONSUMERS) {
    test(`${file} drives playback through the injected engine`, () => {
      const source = readFileSync(file, 'utf8')

      for (const singleton of [
        'stopAudio()',
        'playSongSequence(',
        'audioService.ensureAudioContext(',
        'audioService.playSFX(',
        'audioService.stopMusic(',
        'getTransportState()',
        'pauseAudio(',
        'resumeAudio(',
        'setCorruptionEffect(',
        'enableCorruptionBurstAudio(',
        'disableCorruptionBurstAudio(',
        'getToneAbsoluteTimeMs(',
        'getPlayRequestId('
      ]) {
        const bare = new RegExp(
          `(^|[^.\\w])${singleton.replace(/[().]/g, m => '\\' + m)}`,
          'm'
        )
        assert.doesNotMatch(
          source,
          bare,
          `${file} calls ${singleton} on the singleton instead of the engine`
        )
      }
      assert.match(source, /useAudioEngine/)
    })
  }

  test('the composition root mounts the seam without an audio submodule import', () => {
    // `src/utils/audio/AGENTS.md`: imports from outside that directory must go
    // through the `audioEngine.ts` hub. `AudioEngineProvider` defaults its
    // `engine` prop precisely so `App` can mount the seam without reaching for
    // `toneAudioEngine` itself.
    const source = readFileSync('src/App.tsx', 'utf8')

    assert.doesNotMatch(
      source,
      /from '\.\/utils\/audio\//,
      'App.tsx imports an audio submodule instead of relying on the provider default'
    )
    assert.match(source, /<AudioEngineProvider>/)
  })

  // Pure gig helpers take their audio operations as callbacks, so they never
  // use `useAudioEngine` and the consumer loop above cannot cover them. A hub
  // import here bypasses the injected engine just as effectively: this is
  // exactly how the corruption-burst release escaped the seam.
  const CALLBACK_ONLY_HELPERS = ['src/utils/rhythmGameLoopUtils.ts']

  for (const file of CALLBACK_ONLY_HELPERS) {
    test(`${file} imports nothing from the audio hub`, () => {
      const source = readFileSync(file, 'utf8')

      assert.doesNotMatch(
        source,
        /from '\.\/audio\/audioEngine'/,
        `${file} imports the audio hub instead of taking a callback`
      )
    })
  }

  for (const file of CONSUMERS) {
    test(`${file} does not import the gig clock at module scope`, () => {
      const source = readFileSync(file, 'utf8')

      assert.doesNotMatch(
        source,
        /^\s*getGigTimeMs,?$/m,
        'imports getGigTimeMs directly instead of using the injected engine'
      )
      // A bare call (not `engine.getGigTimeMs()`) means the singleton.
      assert.doesNotMatch(
        source,
        /(^|[^.\w])getGigTimeMs\(\)(?!`)/m,
        'calls the audio singleton instead of the injected engine'
      )
      assert.match(
        source,
        /useAudioEngine|params\.audioEngine/,
        'must resolve the engine through injection'
      )
    })
  }
})
