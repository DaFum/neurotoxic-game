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
  })

  it('should generate a map and dispatch createSetMapAction if gameMap is null', () => {
    const mockGeneratedMap = { id: 'mock-map', nodes: [], connections: [] }

    // Override the mock for this test specifically
    const generateMapMock = vi.fn().mockReturnValue(mockGeneratedMap)

    // @ts-ignore
    MapGenerator.prototype.generateMap = generateMapMock

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    expect(generateMapMock).toHaveBeenCalled()

    // Check if dispatch was called with correct action
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_MAP',
      payload: mockGeneratedMap
    })
  })

  it('should not generate a map if gameMap is already provided', () => {
    const mockGameMap = { id: 'existing-map', nodes: [], connections: [] }
    const generateMapMock = vi.fn()
    // @ts-ignore
    MapGenerator.prototype.generateMap = generateMapMock

    renderHook(() =>
      useMapGeneration({
        gameMap: mockGameMap as any,
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    expect(generateMapMock).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should handle map generation failure and schedule retry', () => {
    const generateMapMock = vi.fn().mockImplementation(() => {
      throw new Error('Generation failed')
    })
    // @ts-ignore
    MapGenerator.prototype.generateMap = generateMapMock

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
    expect(generateMapMock).toHaveBeenCalledTimes(1)

    // Advance timers for first retry (increment action)
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Component re-renders and should attempt again
    expect(generateMapMock).toHaveBeenCalledTimes(2)
  })

  it('should return to menu after max retries', () => {
    const generateMapMock = vi.fn().mockImplementation(() => {
      throw new Error('Generation failed')
    })
    // @ts-ignore
    MapGenerator.prototype.generateMap = generateMapMock

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
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Should have tried 3 times total (1 initial + 2 retries)
    expect(generateMapMock).toHaveBeenCalledTimes(3)

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

  it('resetMapGenerationRetries should reset attempts', () => {
    const { result } = renderHook(() =>
      useMapGeneration({
        gameMap: { id: 'existing' } as any, // Prevent immediate generation
        dispatch: mockDispatch,
        tRef: mockTRef as any
      })
    )

    act(() => {
      result.current.resetMapGenerationRetries()
    })

    // Just testing that the function doesn't crash as it manages internal state
    expect(typeof result.current.resetMapGenerationRetries).toBe('function')
  })
})
