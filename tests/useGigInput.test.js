import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mocks
const mockAudioManager = {
  ensureAudioContext: mock.fn()
}

const mockGigStats = {
  buildGigStatsSnapshot: mock.fn(() => ({ score: 100 }))
}

const mockErrorHandler = {
  handleError: mock.fn()
}

const mockStopAudio = mock.fn()

// Mock imports
mock.module('../src/utils/AudioManager.js', {
  namedExports: { audioManager: mockAudioManager }
})
mock.module('../src/utils/gigStats.js', {
  namedExports: { buildGigStatsSnapshot: mockGigStats.buildGigStatsSnapshot }
})
mock.module('../src/utils/errorHandler.js', {
  namedExports: { handleError: mockErrorHandler.handleError }
})
// Mock dynamic import
mock.module('../src/utils/audioEngine.js', {
  namedExports: { stopAudio: mockStopAudio }
})

const { useGigInput } = await import('../src/hooks/useGigInput.js')

describe('useGigInput', () => {
  let actions
  let gameStateRef
  let activeEvent
  let setActiveEvent
  let changeScene
  let addToast
  let setLastGigStats
  let triggerBandAnimation

  beforeEach(() => {
    setupJSDOM()
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
    activeEvent = null
    setActiveEvent = mock.fn()
    changeScene = mock.fn()
    addToast = mock.fn()
    setLastGigStats = mock.fn()
    triggerBandAnimation = mock.fn()

    mockAudioManager.ensureAudioContext.mock.resetCalls()
    mockStopAudio.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('handleLaneInput calls registerInput and triggerBandAnimation', () => {
    const { result } = renderHook(() =>
      useGigInput({
        actions,
        gameStateRef,
        activeEvent,
        setActiveEvent,
        changeScene,
        addToast,
        setLastGigStats,
        triggerBandAnimation
      })
    )

    act(() => {
      result.current.handleLaneInput(0, true)
    })

    assert.equal(actions.registerInput.mock.calls.length, 1)
    assert.deepEqual(actions.registerInput.mock.calls[0].arguments, [0, true])
    assert.equal(triggerBandAnimation.mock.calls.length, 1)
    assert.deepEqual(triggerBandAnimation.mock.calls[0].arguments, [0])
    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
  })

  test('Escape key toggles pause menu', () => {
    renderHook(() =>
      useGigInput({
        actions,
        gameStateRef,
        activeEvent,
        setActiveEvent,
        changeScene,
        addToast,
        setLastGigStats,
        triggerBandAnimation
      })
    )

    act(() => {
      const event = new window.KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
    })

    assert.equal(setActiveEvent.mock.calls.length, 1)
    const callArg = setActiveEvent.mock.calls[0].arguments[0]
    assert.equal(callArg.title, 'PAUSED')
  })

  test('Resume from pause menu', () => {
    // Start with activeEvent set (paused)
    const props = {
      actions,
      gameStateRef,
      activeEvent: { title: 'PAUSED' },
      setActiveEvent,
      changeScene,
      addToast,
      setLastGigStats,
      triggerBandAnimation
    }

    renderHook(() => useGigInput(props))

    act(() => {
      const event = new window.KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
    })

    assert.equal(setActiveEvent.mock.calls.length, 1)
    assert.equal(setActiveEvent.mock.calls[0].arguments[0], null)
    assert.equal(addToast.mock.calls.length, 1)
    assert.equal(addToast.mock.calls[0].arguments[0], 'Resumed')
  })

  test('Lane key triggers input', () => {
    renderHook(() =>
      useGigInput({
        actions,
        gameStateRef,
        activeEvent,
        setActiveEvent,
        changeScene,
        addToast,
        setLastGigStats,
        triggerBandAnimation
      })
    )

    act(() => {
      const event = new window.KeyboardEvent('keydown', { key: 'a' }) // lane 0
      window.dispatchEvent(event)
    })

    assert.equal(actions.registerInput.mock.calls.length, 1)
    assert.deepEqual(actions.registerInput.mock.calls[0].arguments, [0, true])
    assert.equal(triggerBandAnimation.mock.calls.length, 1)
  })
})
