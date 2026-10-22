import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLeaderboardSync } from '../../src/hooks/useLeaderboardSync'
import { logger } from '../../src/utils/logger'
import { resetStorageFallback } from '../../src/utils/storage'

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

const makeState = (overrides = {}) => {
  const { playerId = 'id-123', social, ...player } = overrides
  return {
    player: {
      playerId,
      playerName: 'Player1',
      money: 500,
      fame: 100,
      day: 5,
      stats: { totalDistance: 120, conflictsResolved: 3, stageDives: 10 },
      ...player
    },
    social: social ?? { instagram: 1000 }
  }
}

// A fetch Response look-alike: the hook always reads the JSON body.
const okResponse = () => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true })
})

const bodies = fetchMock =>
  fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body))

// The sync state machine (coalescing, throttle, retry and backoff, revisions,
// stale handling) is covered in tests/node/leaderboardSyncController.test.js.
// These tests only pin the hook wiring: the snapshot built from game state,
// the real storage, `fetch`, timers and the injected clock.
describe('useLeaderboardSync', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // The hook writes through the storage helpers, whose degraded-storage flag
    // survives `clear()` (see tests/AGENTS.md).
    resetStorageFallback()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.useRealTimers()
    delete global.fetch
  })

  it('skips sync if player ID is missing', () => {
    renderHook(() =>
      useLeaderboardSync(makeState({ playerId: null, playerName: '' }))
    )

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips sync when the snapshot matches the last synced one', () => {
    // The marker is stored through the JSON storage helper, so it is a quoted
    // string in localStorage.
    localStorage.setItem(
      'neurotoxic_last_synced_snapshot:fresh-player',
      JSON.stringify(JSON.stringify(['Player1', 500, 5, 100, 1000, 120, 3, 10]))
    )

    renderHook(() =>
      useLeaderboardSync(makeState({ playerId: 'fresh-player' }))
    )

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('syncs the current stats with a revision when the player is valid', async () => {
    mockFetch.mockResolvedValue(okResponse())

    renderHook(() =>
      useLeaderboardSync(
        makeState({
          playerId: 'sync-valid',
          social: {
            instagram: 1000,
            tiktok: 200,
            youtube: 300,
            newsletter: 50
          }
        })
      )
    )

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(mockFetch.mock.calls[0][0]).toBe('/api/leaderboard/stats')
    const [body] = bodies(mockFetch)
    expect(body).toMatchObject({
      playerId: 'sync-valid',
      playerName: 'Player1',
      money: 500,
      day: 5,
      fame: 100,
      followers: 1550, // 1000 + 200 + 300 + 50
      distance: 120,
      conflicts: 3,
      stageDives: 10
    })
    expect(Number.isSafeInteger(body.revision)).toBe(true)
    expect(body.revision).toBeGreaterThan(0)

    await waitFor(() =>
      expect(
        localStorage.getItem('neurotoxic_last_synced_snapshot:sync-valid')
      ).not.toBeNull()
    )
  })

  it('caps only the published balance at 10,000,000 and keeps the other stats', async () => {
    mockFetch.mockResolvedValue(okResponse())
    const wallets = [10_000_000, 10_000_001, 2_500_000_000]

    for (const money of wallets) {
      renderHook(() =>
        useLeaderboardSync(makeState({ playerId: `rich-${money}`, money }))
      )
    }

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
    expect(
      bodies(mockFetch).map(({ playerId, money, fame, followers, day }) => ({
        playerId,
        money,
        fame,
        followers,
        day
      }))
    ).toEqual(
      wallets.map(money => ({
        playerId: `rich-${money}`,
        money: 10_000_000,
        fame: 100,
        followers: 1000,
        day: 5
      }))
    )
  })

  it('sums followers with non-finite platform counts treated as 0', async () => {
    mockFetch.mockResolvedValue(okResponse())

    renderHook(() =>
      useLeaderboardSync(
        makeState({
          playerId: 'sum-followers',
          social: {
            instagram: NaN,
            tiktok: 200,
            youtube: 300,
            newsletter: 50
          }
        })
      )
    )

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    expect(bodies(mockFetch)[0].followers).toBe(550)
  })

  it('publishes same-day changes, including decreases, after the throttle', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'same-day', money: 500 })
    })
    await act(async () => {})
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Same day: spend money and gain fame. Nothing is dropped, it is held for
    // the rate-limit window and then sent.
    rerender(makeState({ playerId: 'same-day', money: 300, fame: 160 }))
    await act(async () => {})
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(bodies(mockFetch)[1]).toMatchObject({
      day: 5,
      money: 300,
      fame: 160
    })
  })

  it('sends strictly increasing revisions even if the clock goes backwards', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(okResponse())
    // A previous session already used a revision far ahead of this clock.
    localStorage.setItem('neurotoxic_stats_revision:rev', '9999999999999')
    const clock = { now: () => 1000, today: () => new Date(1000) }

    const { rerender } = renderHook(state => useLeaderboardSync(state, clock), {
      initialProps: makeState({ playerId: 'rev', money: 500 })
    })
    await act(async () => {})
    rerender(makeState({ playerId: 'rev', money: 400 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })

    const revisions = bodies(mockFetch).map(body => body.revision)
    expect(revisions).toEqual([10000000000000, 10000000000001])
  })

  it('logs concurrent 404 responses once and disables later session syncs', async () => {
    vi.resetModules()
    const { useLeaderboardSync: useSessionLeaderboardSync } =
      await import('../../src/hooks/useLeaderboardSync')
    const resolvers = []
    mockFetch.mockImplementation(
      () => new Promise(resolve => resolvers.push(resolve))
    )
    const makeMissingState = day =>
      makeState({
        playerId: 'missing-endpoint-player',
        playerName: 'Player',
        day,
        stats: { totalDistance: 0, conflictsResolved: 0, stageDives: 0 },
        social: {}
      })
    const { rerender } = renderHook(state => useSessionLeaderboardSync(state), {
      initialProps: makeMissingState(5)
    })
    rerender(makeMissingState(6))
    // Changes during the in-flight request are coalesced, not sent in parallel.
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      for (const resolve of resolvers) resolve({ status: 404, ok: false })
    })
    expect(logger.info).toHaveBeenCalledExactlyOnceWith(
      'Leaderboard',
      'Stats endpoint unavailable (404). Disabling stat sync for this session.'
    )
    expect(
      localStorage.getItem(
        'neurotoxic_last_synced_snapshot:missing-endpoint-player'
      )
    ).toBeNull()

    rerender(makeMissingState(7))
    await act(async () => {})
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
