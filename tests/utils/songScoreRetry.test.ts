import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { submitLeaderboardScores } from '../../src/utils/leaderboardUtils'
import type { GameState, PostGigSummary } from '../../src/types'

vi.mock('../../src/data/songs', () => ({
  SONGS_BY_ID: new Map([
    ['song1', { leaderboardId: 'lb_song1' }],
    ['song2', { leaderboardId: 'lb_song2' }]
  ])
}))
vi.mock('../../src/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}))

const player = {
  playerId: 'retry-player',
  playerName: 'Player'
} as GameState['player']
const submit = (songId = 'song1', score = 100) =>
  submitLeaderboardScores({
    player,
    lastGigStats: {
      songStats: [{ songId, score, accuracy: 95 }]
    } as PostGigSummary,
    currentGig: null,
    setlist: []
  })

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv('VITE_ENABLE_LEADERBOARD_SYNC', 'true')
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    }
  })
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('durable song score retries', () => {
  it('retries a timed-out request and ignores its late success', async () => {
    const pending = Promise.withResolvers<{ ok: boolean; status: number }>()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const sending = submit()
    await vi.advanceTimersByTimeAsync(5000)
    await sending
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true)
    pending.resolve({ ok: true, status: 200 })
    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not retry a permanently rejected score', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'invalid score'
    })
    vi.stubGlobal('fetch', fetchMock)
    await submit()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  for (const status of [408, 429, 500]) {
    it(`retries HTTP ${status} without waiting for another gig`, async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status, text: async () => 'retry' })
        .mockResolvedValueOnce({ ok: true, status: 200 })
      vi.stubGlobal('fetch', fetchMock)
      await submit()
      await vi.advanceTimersByTimeAsync(15_000)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(JSON.parse(fetchMock.mock.calls[1][1].body).scores[0].score).toBe(
        100
      )
    })
  }

  it('keeps an old score when the next gig submits a different song', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    await submit()
    await submit('song2', 200)
    const sent = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(
      sent.scores.map((entry: { songId: string }) => entry.songId).sort()
    ).toEqual(['lb_song1', 'lb_song2'])
  })

  it('recovers pending scores from persistent storage after a reload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')))
    await submit()
    vi.clearAllTimers()
    vi.resetModules()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const fresh = await import('../../src/utils/leaderboardUtils')
    expect(fresh).toHaveProperty('retryPendingLeaderboardScores')
    await fresh.retryPendingLeaderboardScores(player)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).scores[0].score).toBe(
      100
    )
    await fresh.retryPendingLeaderboardScores(player)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not drop a higher score queued while a request is pending', async () => {
    const first = Promise.withResolvers<{ ok: boolean; status: number }>()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const sending = submit('song1', 100)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const newer = submit('song1', 200)
    first.resolve({ ok: true, status: 200 })
    await Promise.all([sending, newer])
    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).scores[0].score).toBe(
      200
    )
  })
})

describe('cross-tab score queue', () => {
  it('serializes concurrent score merges across module instances', async () => {
    const gate = Promise.withResolvers<void>()
    let tail: Promise<unknown> = gate.promise
    const request = vi.fn((_name: string, callback: () => unknown) => {
      const next = tail.then(callback)
      tail = next.catch(() => {})
      return next
    })
    vi.stubGlobal('navigator', { locks: { request } })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    vi.resetModules()
    const first = await import('../../src/utils/leaderboardUtils')
    vi.resetModules()
    const second = await import('../../src/utils/leaderboardUtils')
    const send = (module: typeof first, songId: string, score: number) =>
      module.submitLeaderboardScores({
        player,
        lastGigStats: {
          songStats: [{ songId, score, accuracy: 95 }]
        } as PostGigSummary,
        currentGig: null,
        setlist: []
      })
    const operations = [
      send(first, 'song1', 200),
      send(second, 'song1', 100),
      send(second, 'song2', 300)
    ]
    expect(
      localStorage.getItem('neurotoxic_pending_song_scores:retry-player')
    ).toBeNull()
    gate.resolve()
    await Promise.all(operations)
    const stored = JSON.parse(
      localStorage.getItem('neurotoxic_pending_song_scores:retry-player')!
    )
    expect(stored).toEqual(
      expect.arrayContaining([
        { songId: 'lb_song1', score: 200, accuracy: 95 },
        { songId: 'lb_song2', score: 300, accuracy: 95 }
      ])
    )
    expect(request).toHaveBeenCalledTimes(3)
    expect(new Set(request.mock.calls.map(([name]) => name)).size).toBe(1)
  })

  it('retries acknowledgement after a lock failure and releases the in-flight request', async () => {
    const request = vi
      .fn()
      .mockImplementationOnce((_name: string, callback: () => unknown) =>
        Promise.resolve(callback())
      )
      .mockRejectedValueOnce(new Error('lock unavailable'))
      .mockImplementation((_name: string, callback: () => unknown) =>
        Promise.resolve(callback())
      )
    vi.stubGlobal('navigator', { locks: { request } })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    await submit()
    expect(
      JSON.parse(
        localStorage.getItem('neurotoxic_pending_song_scores:retry-player')!
      )[0].score
    ).toBe(100)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(
      JSON.parse(
        localStorage.getItem('neurotoxic_pending_song_scores:retry-player')!
      )
    ).toEqual([])
  })

  it('retries a score that could not acquire a lock for persistence', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('lock unavailable'))
      .mockImplementation((_name: string, callback: () => unknown) =>
        Promise.resolve(callback())
      )
    vi.stubGlobal('navigator', { locks: { request } })
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)
    await submit()
    expect(fetchMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(15_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(
      JSON.parse(
        localStorage.getItem('neurotoxic_pending_song_scores:retry-player')!
      )[0].score
    ).toBe(100)
  })

  it('holds acknowledgement cleanup until the same player lock is available', async () => {
    const firstResponse = Promise.withResolvers<{
      ok: boolean
      status: number
    }>()
    const gate = Promise.withResolvers<void>()
    let tail: Promise<unknown> = Promise.resolve()
    const request = vi.fn((_name: string, callback: () => unknown) => {
      const next = tail.then(callback)
      tail = next.catch(() => {})
      return next
    })
    vi.stubGlobal('navigator', { locks: { request } })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValueOnce(firstResponse.promise)
        .mockRejectedValue(new Error('offline'))
    )
    const sending = submit()
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    const holding = request(
      'neurotoxic_pending_song_scores:retry-player',
      () => gate.promise
    )
    firstResponse.resolve({ ok: true, status: 200 })
    await Promise.resolve()
    await Promise.resolve()
    const newer = submit('song1', 200)
    await Promise.resolve()
    expect(
      JSON.parse(
        localStorage.getItem('neurotoxic_pending_song_scores:retry-player')!
      )[0].score
    ).toBe(100)
    gate.resolve()
    await Promise.all([holding, sending, newer])
    await vi.advanceTimersByTimeAsync(15_000)
    const pending = JSON.parse(
      localStorage.getItem('neurotoxic_pending_song_scores:retry-player')!
    )
    expect(pending[0].score).toBe(200)
  })
})
