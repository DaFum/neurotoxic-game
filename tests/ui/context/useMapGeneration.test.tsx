import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMapGeneration } from '../../../src/context/useMapGeneration'
import { MapGenerator } from '../../../src/utils/mapGenerator'
import { GAME_PHASES } from '../../../src/context/gameConstants'
import type { GameMap } from '../../../src/types'
import type { TFunction } from 'i18next'
import type { MutableRefObject } from 'react'
import { setupJSDOM } from '../../testUtils'
import { handleError } from '../../../src/utils/errorHandler'

/**
 * Builds a map that satisfies the generated-map contract: one START node on
 * layer 0, enough layers, branch points, and node-type variety.
 */
const buildValidMap = () => {
  const nodes: Record<string, unknown> = {
    node_0_0: {
      id: 'node_0_0',
      layer: 0,
      type: 'START',
      x: 50,
      y: 0,
      status: 'unlocked',
      venue: { id: 'home', name: 'Home' }
    }
  }
  const connections: Array<{ from: string; to: string }> = []
  const types = ['GIG', 'REST_STOP', 'SPECIAL', 'SUPPLY_STOP', 'FINALE']
  let previous = ['node_0_0']
  for (let layer = 1; layer <= 5; layer++) {
    const current: string[] = []
    for (let index = 0; index < 2; index++) {
      const id = `node_${layer}_${index}`
      nodes[id] = {
        id,
        layer,
        type: types[(layer + index) % types.length],
        x: 20 + index * 40,
        y: layer * 15,
        status: 'locked',
        venue: { id: `venue_${layer}_${index}`, name: `Venue ${layer}${index}` }
      }
      current.push(id)
    }
    // Every previous node fans out to both nodes in this layer, so the map has
    // branch points rather than a single straight line.
    for (const from of previous) {
      for (const to of current) connections.push({ from, to })
    }
    previous = current
  }
  return { nodes, connections }
}

// Mock dependencies
vi.mock('../../../src/utils/mapGenerator', () => {
  return {
    MapGenerator: class MockMapGenerator {
      seed: unknown

      constructor(seed: unknown) {
        this.seed = seed
      }

      generateMap() {
        return buildValidMap()
      }
    }
  }
})

vi.mock('../../../src/utils/errorHandler', () => {
  return {
    handleError: vi.fn(),
    StateError: class StateError extends Error {
      details: Record<string, unknown>
      constructor(message: string, details: Record<string, unknown>) {
        super(message)
        this.details = details
      }
    }
  }
})

describe('useMapGeneration', () => {
  const TEST_RUN_SEED = 123456
  const mockDispatch = vi.fn()
  const mockTRef: MutableRefObject<TFunction> = {
    current: vi
      .fn()
      .mockImplementation(
        (key, options) => options?.defaultValue || key
      ) as unknown as TFunction
  } as MutableRefObject<TFunction>

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
    const mockGeneratedMap = buildValidMap()

    // Override the mock for this test specifically
    const generateMapSpy = vi
      .spyOn(MapGenerator.prototype, 'generateMap')
      .mockReturnValue(mockGeneratedMap as GameMap)

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
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
        gameMap: mockGameMap as GameMap,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
      })
    )

    expect(generateMapSpy).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('should handle map generation failure and schedule retry', () => {
    const generateMapSpy = vi
      .spyOn(MapGenerator.prototype, 'generateMap')
      .mockImplementation(() => {
        throw new Error('Generation failed')
      })

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
      })
    )

    expect(handleError).toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_MAP' })
    )

    // Initial attempt throws, schedules retry
    expect(generateMapSpy).toHaveBeenCalledTimes(1)

    // Advance timers for first retry (increment action)
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Component re-renders and should attempt again
    expect(generateMapSpy).toHaveBeenCalledTimes(2)
  })

  it('loads the committed fallback map after max retries', () => {
    const generateMapSpy = vi
      .spyOn(MapGenerator.prototype, 'generateMap')
      .mockImplementation(() => {
        throw new Error('Generation failed')
      })

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
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

    // Tier 2: the template map is loaded rather than dropping the run.
    const setMapCalls = mockDispatch.mock.calls.filter(
      ([action]) => action.type === 'SET_MAP'
    )
    expect(setMapCalls).toHaveLength(1)
    expect(Object.keys(setMapCalls[0][0].payload.nodes).length).toBeGreaterThan(
      0
    )

    // The player stays in the run: no menu bounce.
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHANGE_SCENE',
        payload: GAME_PHASES.MENU
      })
    )

    // …and is told the map is a backup, as a warning rather than an error.
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_TOAST',
        payload: expect.objectContaining({
          type: 'warning'
        })
      })
    )
  })

  it('returns to the menu when the fallback map itself is unusable', async () => {
    vi.spyOn(MapGenerator.prototype, 'generateMap').mockImplementation(() => {
      throw new Error('Generation failed')
    })
    const fallbackModule = await import('../../../src/utils/fallbackMap')
    vi.spyOn(fallbackModule, 'loadFallbackMap').mockReturnValue(null)

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
      })
    )

    act(() => {
      vi.advanceTimersByTime(250)
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })

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
        payload: expect.objectContaining({ type: 'error' })
      })
    )
  })

  it('rejects a structurally invalid generated map and retries', () => {
    const generateMapSpy = vi
      .spyOn(MapGenerator.prototype, 'generateMap')
      // A straight line of gig nodes: structurally parseable, not a game.
      .mockReturnValue({
        nodes: {
          node_0_0: {
            id: 'node_0_0',
            layer: 0,
            type: 'START',
            x: 0,
            y: 0,
            status: 'unlocked',
            venue: { id: 'home', name: 'Home' }
          }
        },
        connections: []
      } as unknown as GameMap)

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
      })
    )

    expect(handleError).toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_MAP' })
    )

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(generateMapSpy).toHaveBeenCalledTimes(2)
  })

  it('resetMapGenerationRetries should reset attempts and clear scheduled retries', () => {
    const generateMapSpy = vi
      .spyOn(MapGenerator.prototype, 'generateMap')
      .mockImplementation(() => {
        throw new Error('Generation failed')
      })

    const { result } = renderHook(() =>
      useMapGeneration({
        gameMap: null,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
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

  it('should handle map generation failure when a non-Error string is thrown', () => {
    const generateMapSpy = vi
      .spyOn(MapGenerator.prototype, 'generateMap')
      .mockImplementation(() => {
        throw 'Non-error string thrown'
      })

    renderHook(() =>
      useMapGeneration({
        gameMap: null,
        runSeed: TEST_RUN_SEED,
        dispatch: mockDispatch,
        tRef: mockTRef
      })
    )

    expect(handleError).toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_MAP' })
    )

    // Initial attempt throws, schedules retry
    expect(generateMapSpy).toHaveBeenCalledTimes(1)

    // Verify handleError was called with our string literal message
    expect(handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to generate a valid map',
        details: expect.objectContaining({
          originalError: 'Non-error string thrown'
        })
      }),
      expect.anything()
    )
  })

  describe('seeding', () => {
    /**
     * Records the seed each MapGenerator instance was constructed with.
     */
    const captureSeeds = (throwOnGenerate = false) => {
      const seeds: unknown[] = []
      vi.spyOn(MapGenerator.prototype, 'generateMap').mockImplementation(
        function (this: { seed?: number }) {
          seeds.push(this.seed)
          if (throwOnGenerate) throw new Error('generation failed')
          return buildValidMap() as unknown as GameMap
        }
      )
      return seeds
    }

    it('seeds MapGenerator with the persisted runSeed', () => {
      const seeds = captureSeeds()

      renderHook(() =>
        useMapGeneration({
          gameMap: null,
          runSeed: TEST_RUN_SEED,
          dispatch: mockDispatch,
          tRef: mockTRef
        })
      )

      expect(seeds).toEqual([TEST_RUN_SEED])
    })

    it('offsets the seed on each retry so a seed-specific bug is escapable', () => {
      const seeds = captureSeeds(true)

      renderHook(() =>
        useMapGeneration({
          gameMap: null,
          runSeed: TEST_RUN_SEED,
          dispatch: mockDispatch,
          tRef: mockTRef
        })
      )

      act(() => {
        vi.advanceTimersByTime(250)
      })
      act(() => {
        vi.advanceTimersByTime(250)
      })

      // The first attempt stays reproducible from the save; each retry walks
      // the sub-seed forward by one.
      expect(seeds).toEqual([
        TEST_RUN_SEED,
        TEST_RUN_SEED + 1,
        TEST_RUN_SEED + 2
      ])
    })

    it('ignores the ?seed= override in production builds', () => {
      const seeds = captureSeeds()
      window.history.replaceState({}, '', '/?seed=999')
      vi.stubEnv('PROD', true)

      try {
        renderHook(() =>
          useMapGeneration({
            gameMap: null,
            runSeed: TEST_RUN_SEED,
            dispatch: mockDispatch,
            tRef: mockTRef
          })
        )

        expect(seeds).toEqual([TEST_RUN_SEED])
      } finally {
        vi.unstubAllEnvs()
        window.history.replaceState({}, '', '/')
      }
    })

    it('honors a ?seed= override outside production builds', () => {
      const seeds = captureSeeds()
      window.history.replaceState({}, '', '/?seed=999')

      try {
        renderHook(() =>
          useMapGeneration({
            gameMap: null,
            runSeed: TEST_RUN_SEED,
            dispatch: mockDispatch,
            tRef: mockTRef
          })
        )

        expect(seeds).toEqual([999])
      } finally {
        window.history.replaceState({}, '', '/')
      }
    })
  })
})
