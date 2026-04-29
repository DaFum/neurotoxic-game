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
mock.module('../../src/utils/audio/AudioManager', {
  namedExports: { audioManager: mockAudioManager }
})
mock.module('../../src/utils/gigStats', {
  namedExports: { buildGigStatsSnapshot: mockGigStats.buildGigStatsSnapshot }
})
mock.module('../../src/utils/errorHandler', {
  namedExports: { handleError: mockErrorHandler.handleError }
})
// Mock dynamic import
mock.module('../../src/utils/audio/audioEngine', {
  namedExports: { stopAudio: mockStopAudio }
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
})
