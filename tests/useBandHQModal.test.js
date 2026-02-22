import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

// Mock context to prevent errors during render
const mockUseGameState = mock.fn(() => ({
  player: {},
  band: {},
  social: {},
  settings: {},
  setlist: [],
  updatePlayer: mock.fn(),
  updateBand: mock.fn(),
  addToast: mock.fn(),
  updateSettings: mock.fn(),
  deleteSave: mock.fn(),
  setSetlist: mock.fn()
}))

mock.module('../src/context/GameState.jsx', {
  namedExports: {
    useGameState: mockUseGameState
  }
})

mock.module('../src/hooks/useAudioControl.js', {
  namedExports: {
    useAudioControl: mock.fn(() => ({
      audioState: {},
      handleAudioChange: () => {}
    }))
  }
})

describe('useBandHQModal', () => {
  let useBandHQModal

  beforeEach(async () => {
    setupJSDOM()
    // Dynamic import to ensure mocks are applied
    const module = await import('../src/hooks/useBandHQModal.js')
    useBandHQModal = module.useBandHQModal
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('toggles modal state correctly', () => {
    const { result } = renderHook(() => useBandHQModal())

    assert.equal(result.current.showHQ, false)

    act(() => {
      result.current.openHQ()
    })
    assert.equal(result.current.showHQ, true)

    act(() => {
      result.current.closeHQ()
    })
    assert.equal(result.current.showHQ, false)
  })
})
