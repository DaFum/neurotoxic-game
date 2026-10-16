import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLeaderboardSync } from '../../src/hooks/useLeaderboardSync'
import { logger } from '../../src/utils/logger'

// Mock Logger
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('../../src/utils/errorHandler', async () => {
  const { createStorageErrorMock } =
    await import('../mocks/storageErrorMock.js')
  return createStorageErrorMock()
})
describe('useLeaderboardSync', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    global.fetch = mockFetch
  })

  afterEach(() => {
    delete global.fetch
  })

  it('skips sync if player ID is missing', () => {
    const gameState = {
      player: {
        playerId: null,
        playerName: '',
        money: 100,
        fame: 0,
        day: 5,
        stats: {
          totalDistance: 0,
          conflictsResolved: 0,
          stageDives: 0
        }
      },
      social: {
        instagram: 0,
        tiktok: 0,
        youtube: 0,
        newsletter: 0
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips sync if day has not advanced beyond last synced day', () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '5')
    const gameState = {
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money: 100,
        fame: 0,
        day: 5,
        stats: {
          totalDistance: 0,
          conflictsResolved: 0,
          stageDives: 0
        }
      },
      social: {
        instagram: 0,
        tiktok: 0,
        youtube: 0,
        newsletter: 0
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('syncs stats if day > last synced day and player is valid', async () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '4')
    mockFetch.mockResolvedValue({ ok: true })

    // Provide all required properties via GameState structure used by the hook
    const gameState = {
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money: 500,
        fame: 100,
        day: 5,
        passiveFollowers: 500,
        stats: {
          totalDistance: 120,
          conflictsResolved: 3,
          stageDives: 10
        }
      },
      social: {
        instagram: 1000,
        tiktok: 200,
        youtube: 300,
        newsletter: 50
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: 'id-123',
          playerName: 'Player1',
          money: 500,
          day: 5,
          fame: 100,
          followers: 1550, // 1000 + 200 + 300 + 50
          distance: 120,
          conflicts: 3,
          stageDives: 10
        })
      })
    })

    expect(localStorage.getItem('neurotoxic_last_synced_day:id-123')).toBe('5')
  })

  it('sums followers with non-finite platform counts treated as 0', async () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '4')
    mockFetch.mockResolvedValue({ ok: true })

    renderHook(() =>
      useLeaderboardSync({
        player: {
          playerId: 'id-123',
          playerName: 'Player1',
          money: 500,
          fame: 100,
          day: 5,
          stats: { totalDistance: 0, conflictsResolved: 0, stageDives: 0 }
        },
        social: { instagram: NaN, tiktok: 200, youtube: 300, newsletter: 50 }
      })
    )

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.followers).toBe(550)
  })

  it('dedupes concurrent syncs for the same player and day', async () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '4')
    let resolveFetch
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = () => resolve({ ok: true })
        })
    )

    const makeState = money => ({
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money,
        fame: 100,
        day: 5,
        stats: {
          totalDistance: 120,
          conflictsResolved: 3,
          stageDives: 10
        }
      },
      social: { instagram: 1000 }
    })

    // The marker is only written after the fetch resolves; a second effect
    // run during the in-flight request must not start another POST.
    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState(500)
    })
    rerender(makeState(600))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    resolveFetch()
    await waitFor(() => {
      expect(localStorage.getItem('neurotoxic_last_synced_day:id-123')).toBe(
        '5'
      )
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('keeps synced-day marker monotonic when older in-flight sync resolves last', async () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '4')
    const resolversByDay = new Map()

    mockFetch.mockImplementation((_, options) => {
      const parsedBody = JSON.parse(options.body)
      const requestDay = parsedBody.day
      return new Promise(resolve => {
        resolversByDay.set(requestDay, () => resolve({ ok: true }))
      })
    })

    const makeState = day => ({
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money: 500,
        fame: 100,
        day,
        stats: {
          totalDistance: 120,
          conflictsResolved: 3,
          stageDives: 10
        }
      },
      social: { instagram: 1000 }
    })

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState(5)
    })
    rerender(makeState(6))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    const resolveDay6 = resolversByDay.get(6)
    const resolveDay5 = resolversByDay.get(5)
    expect(resolveDay6).toBeTypeOf('function')
    expect(resolveDay5).toBeTypeOf('function')
    resolveDay6()

    await waitFor(() => {
      expect(localStorage.getItem('neurotoxic_last_synced_day:id-123')).toBe(
        '6'
      )
    })

    resolveDay5()
    await waitFor(() => {
      expect(localStorage.getItem('neurotoxic_last_synced_day:id-123')).toBe(
        '6'
      )
    })
  })

  it('does not update localStorage if sync fails', async () => {
    localStorage.setItem('neurotoxic_last_synced_day:id-123', '4')
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Server Error' })

    const gameState = {
      player: {
        playerId: 'id-123',
        playerName: 'Player1',
        money: 500,
        fame: 100,
        day: 5,
        stats: {
          totalDistance: 120,
          conflictsResolved: 3,
          stageDives: 10
        }
      },
      social: {
        instagram: 1000
      }
    }

    renderHook(() => useLeaderboardSync(gameState))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Should still be 4 because sync failed
    expect(localStorage.getItem('neurotoxic_last_synced_day:id-123')).toBe('4')
  })

  it('logs concurrent 404 responses once and disables later session syncs', async () => {
    vi.resetModules()
    const { useLeaderboardSync: useSessionLeaderboardSync } =
      await import('../../src/hooks/useLeaderboardSync')
    const resolvers = []
    mockFetch.mockImplementation(
      () => new Promise(resolve => resolvers.push(resolve))
    )
    const makeState = day => ({
      player: {
        playerId: 'missing-endpoint-player',
        playerName: 'Player',
        money: 500,
        fame: 100,
        day,
        stats: { totalDistance: 0, conflictsResolved: 0, stageDives: 0 }
      },
      social: {}
    })
    const { rerender } = renderHook(state => useSessionLeaderboardSync(state), {
      initialProps: makeState(5)
    })
    rerender(makeState(6))
    expect(mockFetch).toHaveBeenCalledTimes(2)

    await act(async () => {
      for (const resolve of resolvers) resolve({ status: 404, ok: false })
    })
    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      'Leaderboard',
      'Stats endpoint unavailable (404). Disabling stat sync for this session.'
    )
    expect(
      localStorage.getItem('neurotoxic_last_synced_day:missing-endpoint-player')
    ).toBeNull()

    rerender(makeState(7))
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
