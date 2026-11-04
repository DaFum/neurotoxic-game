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
  })

  it('does not drop a higher score queued while a request is pending', async () => {
    const first = Promise.withResolvers<{ ok: boolean; status: number }>()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const sending = submit('song1', 100)
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
