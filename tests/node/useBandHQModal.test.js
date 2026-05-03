import { test, describe, before, after, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

let mockPendingBandHQOpen = false
const mockSetPendingBandHQOpen = mock.fn()

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

mock.module('../../src/context/GameState', {
  namedExports: {
    useGameState: mockUseGameState,
    useGameSelector: mock.fn(selector =>
      selector({ pendingBandHQOpen: mockPendingBandHQOpen })
    ),
    useGameActions: mock.fn(() => ({
      setPendingBandHQOpen: mockSetPendingBandHQOpen
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
    mockPendingBandHQOpen = false
    mockSetPendingBandHQOpen.mock.resetCalls()
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

  test('initializes with pendingBandHQOpen and clears it', async () => {
    mockPendingBandHQOpen = true
    const { result } = renderHook(() => useBandHQModal())

    // It starts with true because of initial state sync in useState(pendingBandHQOpen)
    assert.equal(result.current.showHQ, true)

    // The effect will run and call setPendingBandHQOpen(false) in a timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    assert.equal(mockSetPendingBandHQOpen.mock.calls.length, 1)
    assert.deepEqual(mockSetPendingBandHQOpen.mock.calls[0].arguments, [false])
  })

  test('responds to open-modal event', () => {
    const { result } = renderHook(() => useBandHQModal())

    assert.equal(result.current.showHQ, false)

    act(() => {
      const event = new window.CustomEvent('open-modal', {
        detail: { target: 'bandhq' }
      })
      window.dispatchEvent(event)
    })

    assert.equal(result.current.showHQ, true)
  })

  test('ignores other open-modal events', () => {
    const { result } = renderHook(() => useBandHQModal())

    assert.equal(result.current.showHQ, false)

    act(() => {
      const event = new window.CustomEvent('open-modal', {
        detail: { target: 'other' }
      })
      window.dispatchEvent(event)
    })

    assert.equal(result.current.showHQ, false)
  })
})
