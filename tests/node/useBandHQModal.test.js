import { test, describe, before, after, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'

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

mock.module('../../src/context/GameState.tsx', {
  namedExports: {
    useGameState: mockUseGameState
  }
})

mock.module('../../src/hooks/useAudioControl', {
  namedExports: {
    useAudioControl: mock.fn(() => ({
      audioState: {},
      handleAudioChange: () => {}
    }))
  }
})

const { useBandHQModal } = await import('../../src/hooks/useBandHQModal')

describe('useBandHQModal', () => {
  before(() => {
    setupJSDOM()
  })

  after(() => {
    teardownJSDOM()
  })

  afterEach(() => {
    cleanup()
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
