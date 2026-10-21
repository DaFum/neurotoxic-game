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

  it('coalesces changes during an in-flight request into one trailing snapshot', async () => {
    vi.useFakeTimers()
    let resolveFirst
    mockFetch.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = () => resolve(okResponse())
        })
    )
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'coalesce', money: 500 })
    })
    await act(async () => {})
    rerender(makeState({ playerId: 'coalesce', money: 600 }))
    rerender(makeState({ playerId: 'coalesce', money: 700 }))
    await act(async () => {})
    // Still only the first request: no overlapping POSTs.
    expect(mockFetch).toHaveBeenCalledTimes(1)

    resolveFirst()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    // The intermediate 600 snapshot is skipped; only the latest goes out.
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(bodies(mockFetch)[1].money).toBe(700)
  })

  it('queues a return to the previously synced snapshot while another is in flight', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'revert', money: 500 })
    })
    await act(async () => {})
    expect(mockFetch).toHaveBeenCalledTimes(1) // X (500) is now on the server

    let resolveA
    mockFetch.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveA = () => resolve(okResponse())
        })
    )
    rerender(makeState({ playerId: 'revert', money: 400 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2) // A (400) is in flight

    // The live state goes back to X while A is still on the wire.
    rerender(makeState({ playerId: 'revert', money: 500 }))
    resolveA()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })

    // The server would otherwise stay on A; X must be sent again.
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(bodies(mockFetch)[2].money).toBe(500)
  })

  it('publishes the final-day snapshot without another day tick', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'final-day', day: 9, fame: 100 })
    })
    await act(async () => {})
    rerender(makeState({ playerId: 'final-day', day: 9, fame: 900 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })

    expect(bodies(mockFetch).at(-1)).toMatchObject({ day: 9, fame: 900 })
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

  it('restarts from the clock when the stored revision is not a safe integer', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(okResponse())
    localStorage.setItem('neurotoxic_stats_revision:huge', '1e20')
    const clock = { now: () => 5000, today: () => new Date(5000) }

    renderHook(() => useLeaderboardSync(makeState({ playerId: 'huge' }), clock))
    await act(async () => {})

    const [body] = bodies(mockFetch)
    expect(Number.isSafeInteger(body.revision)).toBe(true)
    expect(body.revision).toBe(5000)
  })

  it('does not mark the snapshot as synced if the request fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Server Error' })

    renderHook(() => useLeaderboardSync(makeState({ playerId: 'fails' })))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    await waitFor(() => expect(logger.warn).toHaveBeenCalled())
    expect(
      localStorage.getItem('neurotoxic_last_synced_snapshot:fails')
    ).toBeNull()
  })

  it('retries a failed snapshot with backoff when nothing newer arrives', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    })
    mockFetch.mockResolvedValue(okResponse())

    renderHook(() => useLeaderboardSync(makeState({ playerId: 'retry' })))
    await act(async () => {})
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Not before the backoff has passed.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(bodies(mockFetch)[1].money).toBe(500)
    expect(
      localStorage.getItem('neurotoxic_last_synced_snapshot:retry')
    ).not.toBeNull()
  })

  it('does not retry an old snapshot over a newer pending one', async () => {
    vi.useFakeTimers()
    let rejectFirst
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectFirst = () => reject(new Error('network'))
        })
    )
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'retry-newer', money: 500 })
    })
    await act(async () => {})
    rerender(makeState({ playerId: 'retry-newer', money: 900 }))
    rejectFirst()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000)
    })

    expect(bodies(mockFetch).map(body => body.money)).toEqual([500, 900])
  })

  it('does not retry a rejected payload (permanent 4xx)', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    })

    renderHook(() => useLeaderboardSync(makeState({ playerId: 'rejected' })))
    await act(async () => {})
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('retries after a 429 and caps the backoff', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    })

    renderHook(() => useLeaderboardSync(makeState({ playerId: 'limited' })))
    await act(async () => {})
    // Backoff 30s, 60s, 120s, 240s, then capped at 300s.
    for (const wait of [30, 60, 120, 240, 300, 300]) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(wait * 1000)
      })
    }
    expect(mockFetch).toHaveBeenCalledTimes(7)
  })

  it('sends a newer snapshot at the base interval while an older one backs off', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'x' })
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'x' })
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'fresh-attempt', money: 500 })
    })
    await act(async () => {})
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2) // failures = 2, next retry 60s

    rerender(makeState({ playerId: 'fresh-attempt', money: 800 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(bodies(mockFetch)[2].money).toBe(800)
  })

  it('adopts the server revision from a stale response and resends', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ success: true, stale: true, revision: 9e12 })
    })
    mockFetch.mockResolvedValue(okResponse())
    const clock = { now: () => 1000, today: () => new Date(1000) }

    renderHook(() =>
      useLeaderboardSync(makeState({ playerId: 'behind' }), clock)
    )
    await act(async () => {})
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })

    const revisions = bodies(mockFetch).map(body => body.revision)
    expect(revisions).toEqual([1000, 9e12 + 1])
    expect(
      localStorage.getItem('neurotoxic_last_synced_snapshot:behind')
    ).not.toBeNull()
  })

  it('does not allocate a revision for a skipped flush', async () => {
    vi.useFakeTimers()
    // A fresh module: the 404 verdict is session state and must not leak.
    vi.resetModules()
    const { useLeaderboardSync: useFreshSync } =
      await import('../../src/hooks/useLeaderboardSync')
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    const { rerender } = renderHook(state => useFreshSync(state), {
      initialProps: makeState({ playerId: 'skipped-flush', money: 500 })
    })
    await act(async () => {})
    const key = 'neurotoxic_stats_revision:skipped-flush'
    const stored = localStorage.getItem(key)
    expect(stored).not.toBeNull()

    // The endpoint is now known to be missing: later flushes send nothing.
    rerender(makeState({ playerId: 'skipped-flush', money: 900 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(key)).toBe(stored)
  })

  it('resends a snapshot that equals the last confirmed one after a stale response', async () => {
    vi.useFakeTimers()
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'stale-revert', money: 500 })
    })
    await act(async () => {})
    expect(mockFetch).toHaveBeenCalledTimes(1) // X (500) confirmed

    let resolveY
    mockFetch.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveY = () =>
            resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({ success: true, stale: true, revision: 9e12 })
            })
        })
    )
    rerender(makeState({ playerId: 'stale-revert', money: 400 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2) // Y (400) in flight

    // Back to X while Y is on the wire; another tab then wrote Z.
    rerender(makeState({ playerId: 'stale-revert', money: 500 }))
    resolveY()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })

    expect(mockFetch).toHaveBeenCalledTimes(3)
    const last = bodies(mockFetch)[2]
    expect(last.money).toBe(500)
    expect(last.revision).toBeGreaterThan(9e12)
  })

  it('counts the backoff per snapshot, not across different ones', async () => {
    vi.useFakeTimers()
    const fail = { ok: false, status: 500, statusText: 'x' }
    mockFetch.mockResolvedValueOnce(fail) // K1 fails
    mockFetch.mockResolvedValueOnce(fail) // K2 fails
    mockFetch.mockResolvedValue(okResponse())

    const { rerender } = renderHook(state => useLeaderboardSync(state), {
      initialProps: makeState({ playerId: 'per-snapshot', money: 500 })
    })
    await act(async () => {})
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // A newer snapshot goes out at the base interval and fails too.
    rerender(makeState({ playerId: 'per-snapshot', money: 800 }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Its first retry waits 30 s, not the 60 s a carried-over count would give.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(bodies(mockFetch)[2].money).toBe(800)
  })

  it('backs off when the server keeps answering stale', async () => {
    vi.useFakeTimers()
    const stale = revision => ({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, stale: true, revision })
    })
    mockFetch.mockResolvedValueOnce(stale(5e12))
    mockFetch.mockResolvedValueOnce(stale(6e12))
    mockFetch.mockResolvedValue(okResponse())

    renderHook(() => useLeaderboardSync(makeState({ playerId: 'two-tabs' })))
    await act(async () => {})
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2) // first catch-up: base interval

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2) // second stale: now backing off
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(3)
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
