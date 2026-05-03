import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

// Mocks
const mockAudioEngine = {
  stopAudio: mock.fn(),
  playNoteAtTime: mock.fn(),
  getGigTimeMs: mock.fn(() => 1000),
  getAudioTimeMs: mock.fn(() => 1000),
  getPlayRequestId: mock.fn(() => 1)
}
const mockAudioManager = {
  playSFX: mock.fn()
}
const mockGigStats = {
  updateGigPerformanceStats: mock.fn(stats => stats),
  buildGigStatsSnapshot: mock.fn(() => ({ accuracy: 100 })),
  calculateAccuracy: mock.fn(() => 100)
}
const mockTimingUtils = {
  getScheduledHitTimeMs: mock.fn()
}
const mockRhythmUtils = {
  checkHit: mock.fn()
}

// Apply mocks
mock.module(
  new URL('../../src/utils/audio/audioEngine.ts', import.meta.url).href,
  {
    namedExports: mockAudioEngine
  }
)
mock.module(
  new URL('../../src/utils/audio/AudioManager.ts', import.meta.url).href,
  {
    namedExports: { audioManager: mockAudioManager }
  }
)
mock.module(new URL('../../src/utils/gigStats.ts', import.meta.url).href, {
  namedExports: mockGigStats
})
mock.module(
  new URL('../../src/utils/audio/timingUtils.ts', import.meta.url).href,
  {
    namedExports: mockTimingUtils
  }
)
mock.module(new URL('../../src/utils/rhythmUtils.ts', import.meta.url).href, {
  namedExports: mockRhythmUtils
})

const _stableI18n = {
  t: (key, options) => {
    const template = options?.defaultValue || key
    return options
      ? template.replace(/\{\{(\w+)\}\}/g, (_, token) =>
          String(options[token] ?? `{{${token}}}`)
        )
      : template
  },
  i18n: { language: 'en' }
}
mock.module('react-i18next', {
  namedExports: {
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useTranslation: () => _stableI18n,
    Trans: ({ i18nKey }) => i18nKey,
    initReactI18next: { type: '3rdParty', init: () => {} }
  }
})
mock.module('react', {
  namedExports: {
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useCallback: fn => fn,
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useRef: initialValue => ({ current: initialValue }),
    useEffect: () => {}
  }
})

// Import hook (must be after mocks)
const { useRhythmGameScoring } =
  await import('../../src/hooks/rhythmGame/useRhythmGameScoring')

describe('useRhythmGameScoring Game Over', () => {
  beforeEach(() => {
    for (const fn of Object.values(mockAudioEngine)) fn.mock?.resetCalls()
    for (const fn of Object.values(mockAudioManager)) fn.mock?.resetCalls()
    for (const fn of Object.values(mockGigStats)) fn.mock?.resetCalls()
    for (const fn of Object.values(mockTimingUtils)) fn.mock?.resetCalls()
    for (const fn of Object.values(mockRhythmUtils)) fn.mock?.resetCalls()
  })

  afterEach(() => {})

  test('marks game over and stops audio on collapse', t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })

    const gameStateRef = {
      current: {
        stats: { misses: 0 },
        combo: 10,
        health: 10, // Low health
        overload: 0,
        isToxicMode: false,
        isGameOver: false,
        lanes: [{}, {}, {}],
        notes: [],
        modifiers: {}
      }
    }

    const setters = {
      setScore: mock.fn(),
      setCombo: mock.fn(),
      setHealth: mock.fn(updater => {
        if (typeof updater === 'function') {
          const newVal = updater(gameStateRef.current.health)
          gameStateRef.current.health = newVal
          return newVal
        }
        gameStateRef.current.health = updater
        return updater
      }),
      setOverload: mock.fn(),
      setIsToxicMode: mock.fn(),
      setIsGameOver: mock.fn()
    }

    const contextActions = {
      addToast: mock.fn(),
      changeScene: mock.fn(),
      hasUpgrade: mock.fn(() => false),
      setLastGigStats: mock.fn(),
      endGig: mock.fn()
    }

    // Because useRhythmGameScoring relies on React's lifecycle and returns state closures,
    // we can invoke the hook function directly in node:test to get its exposed methods
    // without spinning up JSDOM. Note: If it had inner `useEffect`s that fired on mount,
    // those wouldn't fire here, but since `handleMiss` is just a pure callback returned,
    // we can invoke it immediately.
    const result = useRhythmGameScoring({
      gameStateRef,
      setters,
      contextActions
    })

    // Trigger miss to reduce health below 0
    // Default penalty is 2 per miss. Health is 10. Need 5 misses.
    result.handleMiss(5, false) // 5 misses * 2 dmg = 10 dmg -> 0 health

    t.mock.timers.runAll()

    // Check if stopAudio was called
    assert.equal(
      mockAudioEngine.stopAudio.mock.calls.length,
      1,
      'stopAudio should be called'
    )

    assert.equal(
      gameStateRef.current.isGameOver,
      true,
      'isGameOver should be true on game over'
    )
  })
})
