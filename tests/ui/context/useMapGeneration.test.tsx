import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMapGeneration } from '../../../src/context/useMapGeneration'
import { MapGenerator } from '../../../src/utils/mapGenerator'
import { GAME_PHASES } from '../../../src/context/gameConstants'
import { setupJSDOM } from '../../testUtils'
import { handleError } from '../../../src/utils/errorHandler'

// Mock dependencies
vi.mock('../../../src/utils/mapGenerator', () => {
  return {
    MapGenerator: class MockMapGenerator {
      generateMap() {
        return { id: 'mocked-map' }
      }
    }
  }
})

vi.mock('../../../src/utils/errorHandler', () => {
  return {
    handleError: vi.fn(),
    StateError: class StateError extends Error {
      details: any
      constructor(message: string, details: any) {
        super(message)
        this.details = details
      }
    }
  }
})

describe('useMapGeneration', () => {
  const mockDispatch = vi.fn()
  const mockTRef = {
    current: vi.fn().mockImplementation((key, options) => options?.defaultValue || key)
  }

  beforeEach(() => {
    setupJSDOM()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should generate a map and dispatch createSetMapAction if gameMap is null', () => {
    const mockGeneratedMap = { id: 'mock-map', nodes: [], connections: [] }

    // Override the mock for this test specifically
    const generateMapSpy = vi.spyOn(MapGenerator.prototype, 'generateMap').mockReturnValue(mockGeneratedMap as any)

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    expect(generateMapSpy).toHaveBeenCalled()

    // Check if dispatch was called with correct action
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_MAP',
      payload: mockGeneratedMap
    })
  })

  it('should not generate a map if gameMap is already provided', () => {
    const mockGameMap = { id: 'existing-map', nodes: [], connections: [] }
    const generateMapSpy = vi.spyOn(MapGenerator.prototype, 'generateMap')

    renderHook(() =>
      useMapGeneration({
        gameMap: mockGameMap as any,
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    expect(generateMapSpy).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should handle map generation failure and schedule retry', () => {
    const generateMapSpy = vi.spyOn(MapGenerator.prototype, 'generateMap').mockImplementation(() => {
      throw new Error('Generation failed')
    })

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    expect(handleError).toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_MAP' }))

    // Initial attempt throws, schedules retry
    expect(generateMapSpy).toHaveBeenCalledTimes(1)

    // Advance timers for first retry (increment action)
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Component re-renders and should attempt again
    expect(generateMapSpy).toHaveBeenCalledTimes(2)
  })

  it('should return to menu after max retries', () => {
    const generateMapSpy = vi.spyOn(MapGenerator.prototype, 'generateMap').mockImplementation(() => {
      throw new Error('Generation failed')
    })

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    // Initial + max retries (2)
    act(() => {
      vi.advanceTimersByTime(250)
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Should have tried 3 times total (1 initial + 2 retries)
    expect(generateMapSpy).toHaveBeenCalledTimes(3)

    // Verify it returned to menu
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_MAP',
      payload: null
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHANGE_SCENE',
        payload: GAME_PHASES.MENU
      })
    )

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_TOAST',
        payload: expect.objectContaining({
          type: 'error'
        })
      })
    )
  })

  it('resetMapGenerationRetries should reset attempts and clear scheduled retries', () => {
    const generateMapSpy = vi.spyOn(MapGenerator.prototype, 'generateMap').mockImplementation(() => {
      throw new Error('Generation failed')
    })

    const { result } = renderHook(() =>
      useMapGeneration({
        gameMap: null,
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    expect(generateMapSpy).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.resetMapGenerationRetries()
    })

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(generateMapSpy).toHaveBeenCalledTimes(1)
  })
})
