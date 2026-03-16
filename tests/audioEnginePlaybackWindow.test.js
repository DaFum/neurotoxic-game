// TODO: Implement this
import assert from 'node:assert'
import { test } from 'node:test'
import { importAudioEngine } from './audioTestUtils.js'

const { audioEngine, skipIfImportFailed } = await importAudioEngine()

test('playSFX', async t => {
  if (skipIfImportFailed(t)) return
  const { playSFX, audioState } = await import('../src/utils/audio/playback.js')
  const moduleState =
    audioState || (await import('../src/utils/audio/state.js')).audioState

  await t.test('does nothing if not setup or missing sfxSynth', () => {
    moduleState.isSetup = false
    moduleState.sfxSynth = null
    playSFX('hit') // Should not throw
    assert.ok(true)
  })

  await t.test('calls triggerAttackRelease for different types', () => {
    moduleState.isSetup = true
    const calls = []
    moduleState.sfxSynth = {
      triggerAttackRelease: (...args) => calls.push(args)
    }

    playSFX('hit')
    assert.strictEqual(calls.length, 1)
    assert.strictEqual(calls[0][0], 'A5') // hit

    playSFX('miss')
    assert.strictEqual(calls.length, 2)
    assert.strictEqual(calls[1][0], 'D2') // miss

    playSFX('cash')
    assert.strictEqual(calls.length, 4) // cash makes 2 calls
    assert.strictEqual(calls[2][0], 'B5')

    const originalDrumKit = moduleState.drumKit
    try {
      // simulate no drum kit or missing kick drum
      moduleState.drumKit = null

      playSFX('travel')
      // tests drum kit kick fallback
      assert.strictEqual(calls.length, 5)
      assert.strictEqual(calls[4][0], 'G1') // fallback travel

      // Test unknown type
      playSFX('unknown-type')
      assert.strictEqual(calls.length, 5) // Should not increase
    } finally {
      moduleState.drumKit = originalDrumKit
      moduleState.isSetup = false
      moduleState.sfxSynth = null
    }
  })
})

test('setMusicVolume & setSFXVolume', async t => {
  if (skipIfImportFailed(t)) return
  // audioState may not be directly exported or might be called differently in the real module
  // Check the export and fall back if needed
  const { setMusicVolume, setSFXVolume, audioState } =
    await import('../src/utils/audio/playback.js')
  const moduleState =
    audioState || (await import('../src/utils/audio/state.js')).audioState

  await t.test('setMusicVolume clamps value to [0, 1] and ramps gain', () => {
    let mockGain = {
      gain: {
        rampTo: val => {
          mockGain.val = val
        }
      }
    }
    moduleState.musicGain = mockGain

    // Normal
    const resultNormal = setMusicVolume(0.5)
    assert.strictEqual(resultNormal, true)
    assert.strictEqual(mockGain.val, 0.5)

    // Low boundary
    setMusicVolume(-1.5)
    assert.strictEqual(mockGain.val, 0)

    // High boundary
    setMusicVolume(2.5)
    assert.strictEqual(mockGain.val, 1)

    // Cleanup
    moduleState.musicGain = null
  })

  await t.test(
    'setMusicVolume returns false if musicGain is not initialized',
    () => {
      moduleState.musicGain = null
      const result = setMusicVolume(0.5)
      assert.strictEqual(result, false)
    }
  )

  await t.test('setSFXVolume clamps value to [0, 1] and ramps gain', () => {
    let mockGain = {
      gain: {
        rampTo: val => {
          mockGain.val = val
        }
      }
    }
    moduleState.sfxGain = mockGain

    // Normal
    const resultNormal = setSFXVolume(0.7)
    assert.strictEqual(resultNormal, true)
    assert.strictEqual(mockGain.val, 0.7)

    // Low boundary
    setSFXVolume(-0.1)
    assert.strictEqual(mockGain.val, 0)

    // High boundary
    setSFXVolume(1.1)
    assert.strictEqual(mockGain.val, 1)

    // Cleanup
    moduleState.sfxGain = null
  })

  await t.test(
    'setSFXVolume returns false if sfxGain is not initialized',
    () => {
      moduleState.sfxGain = null
      const result = setSFXVolume(0.5)
      assert.strictEqual(result, false)
    }
  )
})

test('stopGigPlayback', async t => {
  if (skipIfImportFailed(t)) return

  const { stopGigPlayback, audioState } =
    await import('../src/utils/audio/playback.js')
  const moduleState =
    audioState || (await import('../src/utils/audio/state.js')).audioState

  await t.test(
    'calls cleanupGigPlayback and logs if source exists',
    async () => {
      // Setup Tone raw context and state to track stops
      let stopCalled = false
      const mockSource = {
        stop: () => {
          stopCalled = true
        },
        disconnect: () => {}
      }

      moduleState.gigSource = mockSource
      moduleState.gigFilename = 'test.ogg'

      // since stopGigPlayback uses getGigTimeMs() in its log when gigSource is present,
      // we need to make sure getGigTimeMs doesn't crash.
      // getGigTimeMs needs rawContext.currentTime
      const ToneModule = await import('tone')
      const mockTone = ToneModule.default || ToneModule.Tone || ToneModule
      const context = mockTone.getContext()
      if (!context.rawContext) context.rawContext = { currentTime: 0 }
      else context.rawContext.currentTime = 0

      stopGigPlayback()

      // Test that the source was stopped by cleanup (which stopGigPlayback calls)
      assert.strictEqual(stopCalled, true)

      // Check that state was cleared by cleanup
      assert.strictEqual(moduleState.gigSource, null)
    }
  )
})

test('calculateGigPlaybackWindow', async t => {
  if (skipIfImportFailed(t)) return
  const { calculateGigPlaybackWindow } = audioEngine

  await t.test('Happy Path: valid inputs within buffer range', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 10,
      baseOffsetMs: 1000,
      seekOffsetMs: 500,
      durationMs: 2000
    })
    // 1000 + 500 = 1500ms = 1.5s
    assert.strictEqual(result.offsetSeconds, 1.5)
    // 2000ms = 2s
    assert.strictEqual(result.safeDurationSeconds, 2)
    assert.strictEqual(result.didResetOffsets, false)
    assert.strictEqual(result.nextBaseOffsetMs, 1000)
    assert.strictEqual(result.nextSeekOffsetMs, 500)
  })

  await t.test('Clamps duration to remaining buffer', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 2,
      baseOffsetMs: 1500,
      seekOffsetMs: 0,
      durationMs: 2000
    })
    // 1500ms = 1.5s. Remaining buffer = 2 - 1.5 = 0.5s
    // Requested duration 2s. Should clamp to 0.5s.
    assert.strictEqual(result.offsetSeconds, 1.5)
    assert.strictEqual(result.safeDurationSeconds, 0.5)
  })

  await t.test('Resets offsets when they exceed buffer duration', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 1,
      baseOffsetMs: 1500,
      seekOffsetMs: 0,
      durationMs: 1000
    })
    // Offset 1.5s >= Buffer 1s. Should reset.
    assert.strictEqual(result.offsetSeconds, 0)
    assert.strictEqual(result.nextBaseOffsetMs, 0)
    assert.strictEqual(result.nextSeekOffsetMs, 0)
    assert.strictEqual(result.didResetOffsets, true)
    // Since offset reset to 0, safeDuration should now be min(1s, 1s - 0s) = 1s
    assert.strictEqual(result.safeDurationSeconds, 1)
  })

  await t.test('Resets offsets when exactly at buffer duration', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 1,
      baseOffsetMs: 1000,
      seekOffsetMs: 0,
      durationMs: 500
    })
    // Offset 1s >= Buffer 1s. Should reset.
    assert.strictEqual(result.offsetSeconds, 0)
    assert.strictEqual(result.didResetOffsets, true)
  })

  await t.test('Handles null duration (play to end)', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 5,
      baseOffsetMs: 1000,
      seekOffsetMs: 0,
      durationMs: null
    })
    // Offset 1s.
    assert.strictEqual(result.offsetSeconds, 1)
    // Duration null means play until end.
    // safeDurationSeconds logic: durationSeconds is null.
    // safeDurationSeconds = null (which means full duration in source.start)
    assert.strictEqual(result.safeDurationSeconds, null)
  })

  await t.test('Handles zero duration request', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 5,
      baseOffsetMs: 0,
      seekOffsetMs: 0,
      durationMs: 0
    })
    assert.strictEqual(result.safeDurationSeconds, 0)
  })

  await t.test('Handles zero buffer duration', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 0,
      baseOffsetMs: 1000,
      seekOffsetMs: 0,
      durationMs: 2000
    })
    // Buffer duration 0.
    // safeBufferDurationSec = 0.
    // Logic: if (safeBufferDurationSec > 0 && ...) -> false. No reset.
    // offsetSeconds = 1.0
    assert.strictEqual(result.offsetSeconds, 1.0)
    // safeDurationSeconds calculation:
    // durationSeconds = 2.
    // condition: durationSeconds != null && safeBufferDurationSec > 0 -> false.
    // returns durationSeconds = 2.
    assert.strictEqual(result.safeDurationSeconds, 2)
  })

  await t.test('Handles negative inputs (clamps to 0)', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: -5,
      baseOffsetMs: -1000,
      seekOffsetMs: -500,
      durationMs: -2000
    })
    // All inputs clamped to 0.
    assert.strictEqual(result.offsetSeconds, 0)
    assert.strictEqual(result.safeDurationSeconds, 0)
    assert.strictEqual(result.nextBaseOffsetMs, 0)
    assert.strictEqual(result.nextSeekOffsetMs, 0)
  })

  await t.test('Handles NaN inputs (treats as 0)', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: Number.NaN,
      baseOffsetMs: Number.NaN,
      seekOffsetMs: Number.NaN,
      durationMs: Number.NaN
    })
    // All inputs treated as 0 due to !Number.isFinite check.
    assert.strictEqual(result.offsetSeconds, 0)
    // Duration NaN -> null safeDurationMs -> null safeDurationSeconds ?
    // implementation: safeDurationMs = Number.isFinite(NaN) ? ... : null
    // So safeDurationMs is null.
    // safeDurationSeconds is null.
    assert.strictEqual(result.safeDurationSeconds, null)
    assert.strictEqual(result.nextBaseOffsetMs, 0)
  })

  await t.test('Handles Infinity inputs (treats as 0)', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: Infinity,
      baseOffsetMs: Infinity,
      seekOffsetMs: Infinity,
      durationMs: Infinity
    })
    // Infinity is not finite. Clamps to 0 or null.
    assert.strictEqual(result.offsetSeconds, 0)
    assert.strictEqual(result.safeDurationSeconds, null)
  })

  await t.test('Handles null/undefined inputs explicitly', () => {
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: undefined,
      baseOffsetMs: null,
      seekOffsetMs: undefined,
      durationMs: undefined
    })
    // undefined/null are not finite. Defaults to 0 / null.
    assert.strictEqual(result.offsetSeconds, 0)
    assert.strictEqual(result.safeDurationSeconds, null)
  })

  await t.test('Complex scenario: Seek + Base offset near end', () => {
    // Buffer 10s. Base 8s. Seek 1.5s. Total offset 9.5s.
    // Duration 2s.
    // Should clamp duration to 0.5s.
    const result = calculateGigPlaybackWindow({
      bufferDurationSec: 10,
      baseOffsetMs: 8000,
      seekOffsetMs: 1500,
      durationMs: 2000
    })
    assert.strictEqual(result.offsetSeconds, 9.5)
    assert.strictEqual(result.safeDurationSeconds, 0.5)
  })
})
