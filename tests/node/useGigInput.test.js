import {
  test,
  describe,
  before,
  after,
  beforeEach,
  afterEach,
  mock
} from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'

// Mocks
const mockAudioManager = {
  ensureAudioContext: mock.fn(() => Promise.resolve(true))
}

const mockGigStats = {
  buildGigStatsSnapshot: mock.fn(() => ({ score: 100 }))
}

const mockErrorHandler = {
  handleError: mock.fn()
}

const mockStopAudio = mock.fn()

// Mock imports

mock.module(import.meta.resolve('../../src/utils/gigStats.ts'), {
  namedExports: { buildGigStatsSnapshot: mockGigStats.buildGigStatsSnapshot }
})
mock.module(import.meta.resolve('../../src/utils/errorHandler.ts'), {
  namedExports: { handleError: mockErrorHandler.handleError }
})
// Mock dynamic import
mock.module(import.meta.resolve('../../src/utils/audio/audioEngine.ts'), {
  namedExports: {
    audioManager: mockAudioManager,
    audioService: mockAudioManager,
    stopAudio: mockStopAudio,
    enableCorruptionBurstAudio: mock.fn(),
    disableCorruptionBurstAudio: mock.fn()
  }
})

const { useGigInput } = await import('../../src/hooks/useGigInput')

describe('useGigInput', () => {
  let actions
  let gameStateRef
  let triggerBandAnimation
  let onTogglePause

  before(() => {
    setupJSDOM()
  })

  after(() => {
    teardownJSDOM()
  })

  beforeEach(() => {
    actions = { registerInput: mock.fn() }
    gameStateRef = {
      current: {
        lanes: [{ key: 'a' }, { key: 's' }],
        score: 100,
        stats: {},
        toxicTimeTotal: 0,
        hasSubmittedResults: false
      }
    }
    triggerBandAnimation = mock.fn()
    onTogglePause = mock.fn()

    mockAudioManager.ensureAudioContext.mock.resetCalls()
    mockStopAudio.mock.resetCalls()
    mockGigStats.buildGigStatsSnapshot.mock.resetCalls()
    mockErrorHandler.handleError.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
  })

  const renderUseGigInput = () =>
    renderHook(() =>
      useGigInput({
        actions,
        gameStateRef,
        triggerBandAnimation,
        onTogglePause
      })
    )

  test('handleLaneInput calls registerInput and triggerBandAnimation', () => {
    const { result } = renderUseGigInput()

    act(() => {
      result.current.handleLaneInput(0, true)
    })

    assert.equal(actions.registerInput.mock.calls.length, 1)
    assert.deepEqual(actions.registerInput.mock.calls[0].arguments, [0, true])
    assert.equal(triggerBandAnimation.mock.calls.length, 1)
    assert.deepEqual(triggerBandAnimation.mock.calls[0].arguments, [0])
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
  })

  test('unlocks audio before registering a press and animates after registration', () => {
    const events = []
    mockAudioManager.ensureAudioContext.mock.mockImplementationOnce(() => {
      events.push('unlock')
      return Promise.resolve(true)
    })
    actions.registerInput = mock.fn((index, active) => {
      events.push(['input', index, active])
    })
    triggerBandAnimation = mock.fn(index => {
      events.push(['animation', index])
    })
    const { result } = renderUseGigInput()

    act(() => {
      result.current.handleLaneInput(1, true)
      result.current.handleLaneInput(1, false)
    })

    assert.deepEqual(events, [
      'unlock',
      ['input', 1, true],
      ['animation', 1],
      ['input', 1, false]
    ])
  })

  test('releasing a lane before a press does not unlock audio or animate', () => {
    const { result } = renderUseGigInput()

    act(() => {
      result.current.handleLaneInput(0, false)
    })

    assert.deepEqual(actions.registerInput.mock.calls[0].arguments, [0, false])
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 0)
    assert.equal(triggerBandAnimation.mock.calls.length, 0)
  })

  test('keeps the lane handler stable when only the pause callback changes', () => {
    const { result, rerender } = renderUseGigInput()
    const handleLaneInput = result.current.handleLaneInput

    onTogglePause = mock.fn()
    rerender()

    assert.equal(result.current.handleLaneInput, handleLaneInput)
  })

  test('Escape key toggles pause menu', () => {
    renderUseGigInput()

    act(() => {
      const event = new window.KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
    })

    assert.equal(onTogglePause.mock.calls.length, 1)
  })

  test('Lane key triggers input', () => {
    renderUseGigInput()

    act(() => {
      const event = new window.KeyboardEvent('keydown', { key: 'a' }) // lane 0
      window.dispatchEvent(event)
    })

    assert.equal(actions.registerInput.mock.calls.length, 1)
    assert.deepEqual(actions.registerInput.mock.calls[0].arguments, [0, true])
    assert.equal(triggerBandAnimation.mock.calls.length, 1)
  })

  test('calls ensureAudioContext when handleLaneInput is triggered', () => {
    const { result } = renderUseGigInput()

    act(() => {
      result.current.handleLaneInput(0, true)
    })

    // Verify ensureAudioContext was called
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
    // Verify the standard input flow still works
    assert.equal(actions.registerInput.mock.calls.length, 1)
    assert.deepEqual(actions.registerInput.mock.calls[0].arguments, [0, true])
  })

  test('handles error gracefully when ensureAudioContext throws', () => {
    // Mock ensureAudioContext to throw an error on first call

    mockAudioManager.ensureAudioContext.mock.mockImplementationOnce(() => {
      throw new Error('Audio context initialization failed')
    })

    const { result } = renderUseGigInput()

    // Calling handleLaneInput when ensureAudioContext throws should propagate the error
    assert.throws(
      () => {
        act(() => {
          result.current.handleLaneInput(0, true)
        })
      },
      {
        message: /Audio context initialization failed/
      }
    )

    // Verify ensureAudioContext was called
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
  })

  test('window blur clears held lane visuals without registering a hit', () => {
    gameStateRef.current.lanes = [
      { key: 'a', active: true },
      { key: 's', active: true }
    ]
    renderUseGigInput()

    act(() => {
      window.dispatchEvent(new window.Event('blur'))
    })

    assert.deepEqual(
      gameStateRef.current.lanes.map(lane => lane.active),
      [false, false]
    )
    assert.equal(actions.registerInput.mock.calls.length, 0)
  })

  test('window blur listener is removed on unmount', () => {
    const { unmount } = renderUseGigInput()
    unmount()
    gameStateRef.current.lanes = [{ key: 'a', active: true }]

    window.dispatchEvent(new window.Event('blur'))

    assert.equal(gameStateRef.current.lanes[0].active, true)
  })
})
