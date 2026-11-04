import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { submitLeaderboardScores } from '../../src/utils/leaderboardUtils'
import type { GameState, PostGigSummary } from '../../src/types'
import { listStorageKeys, resetStorageFallback } from '../../src/utils/storage'

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
  resetStorageFallback()
  vi.useFakeTimers()
  vi.stubEnv('VITE_ENABLE_LEADERBOARD_SYNC', 'true')
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    get length() {
      return store.size
    },
    key: (index: number) => [...store.keys()][index] ?? null,
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
  it('bounds offline journal entries while retaining the best scores per song', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const otherKey = 'neurotoxic_pending_song_scores:other:item:keep'
    localStorage.setItem(
      otherKey,
      JSON.stringify({ songId: 'lb_song1', score: 999, accuracy: 99 })
    )
    localStorage.setItem('unrelated', 'keep')
    for (let score = 1; score <= 40; score++) await submit('song1', score)
    for (let score = 40; score >= 1; score--) await submit('song2', score)
    const prefix = 'neurotoxic_pending_song_scores:retry-player:item:'
    const journalKeys = [...Array(localStorage.length)]
      .map((_, i) => localStorage.key(i))
      .filter(key => key?.startsWith(prefix))
    expect(journalKeys.length).toBeLessThanOrEqual(2)
    expect(localStorage.getItem(otherKey)).not.toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
    vi.clearAllTimers()
    vi.resetModules()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const fresh = await import('../../src/utils/leaderboardUtils')
    await fresh.retryPendingLeaderboardScores(player)
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body).scores).toEqual(
      expect.arrayContaining([
        { songId: 'lb_song1', score: 40, accuracy: 95 },
        { songId: 'lb_song2', score: 40, accuracy: 95 }
      ])
    )
  })

  it('keeps a concurrently written higher score while pruning', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await submit('song1', 100)
    const prefix = 'neurotoxic_pending_song_scores:retry-player:item:'
    const originalRemove = localStorage.removeItem.bind(localStorage)
    let interleaved = false
    let concurrent: Promise<void> | undefined
    const removeItem = vi
      .spyOn(localStorage, 'removeItem')
      .mockImplementation(key => {
        if (key.startsWith(prefix) && !interleaved) {
          interleaved = true
          concurrent = submit('song1', 300)
        }
        originalRemove(key)
      })
    await submit('song1', 200)
    await concurrent
    expect(interleaved).toBe(true)
    removeItem.mockRestore()
    vi.clearAllTimers()
    vi.resetModules()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const fresh = await import('../../src/utils/leaderboardUtils')
    await fresh.retryPendingLeaderboardScores(player)
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body).scores).toEqual([
      { songId: 'lb_song1', score: 300, accuracy: 95 }
    ])
  })

  it('does not journal invalid scores', async () => {
    vi.stubGlobal('navigator', {})
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await submit('song1', -1)
    await submit('song1', 10_000_001)
    const prefix = 'neurotoxic_pending_song_scores:retry-player:item:'
    expect(listStorageKeys().filter(key => key.startsWith(prefix))).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('invalid submissions cannot displace valid pending scores', async () => {
    const key = 'neurotoxic_pending_song_scores:retry-player'
    localStorage.setItem(
      key,
      JSON.stringify([{ songId: 'lb_song1', score: 100, accuracy: 95 }])
    )
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    for (const [submitted, expected] of [
      [10_000_001, 100],
      [200, 200],
      [150, 200],
      [10_000_001, 200]
    ]) {
      await submit('song1', submitted)
      expect(JSON.parse(localStorage.getItem(key)!)).toEqual([
        { songId: 'lb_song1', score: expected, accuracy: 95 }
      ])
    }
  })

  it('keeps persisted journal entries when the higher score is only buffered', async () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await submit('song1', 100)
    const prefix = 'neurotoxic_pending_song_scores:retry-player:item:'
    const originalKeys = [...Array(localStorage.length)]
      .map((_, i) => localStorage.key(i))
      .filter(key => key?.startsWith(prefix))
    expect(originalKeys).toHaveLength(1)
    const originalSet = localStorage.setItem.bind(localStorage)
    const setItem = vi
      .spyOn(localStorage, 'setItem')
      .mockImplementation((key, value) => {
        if (key.startsWith(prefix)) throw new Error('quota')
        originalSet(key, value)
      })
    for (let score = 200; score <= 240; score++) await submit('song1', score)
    expect(localStorage.getItem(originalKeys[0]!)).not.toBeNull()
    expect(
      listStorageKeys().filter(key => key.startsWith(prefix))
    ).toHaveLength(2)
    setItem.mockRestore()
  })

  it.each([
    [
      'different songs',
      'song2',
      [
        { songId: 'lb_song1', score: 100, accuracy: 95 },
        { songId: 'lb_song2', score: 200, accuracy: 95 }
      ]
    ],
    [
      'the same song',
      'song1',
      [{ songId: 'lb_song1', score: 200, accuracy: 95 }]
    ]
  ])(
    'recovers %s from overlapping tabs without Web Locks after reload',
    async (_label, secondSong, expected) => {
      vi.stubGlobal('navigator', {})
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
      const originalSet = localStorage.setItem.bind(localStorage)
      let second: Promise<void> | undefined
      let interleaved = false
      const setItem = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementation((key, value) => {
          if (
            key === 'neurotoxic_pending_song_scores:retry-player' &&
            !interleaved
          ) {
            interleaved = true
            second = submit(secondSong, 200)
          }
          originalSet(key, value)
        })
      const first = submit('song1', 100)
      await first
      await second
      expect(interleaved).toBe(true)
      setItem.mockRestore()
      vi.clearAllTimers()
      vi.resetModules()
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
      vi.stubGlobal('fetch', fetchMock)
      const fresh = await import('../../src/utils/leaderboardUtils')
      await fresh.retryPendingLeaderboardScores(player)
      const scores = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body).scores
      expect(scores).toHaveLength(expected.length)
      expect(scores).toEqual(expect.arrayContaining(expected))
      await fresh.retryPendingLeaderboardScores(player)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(
        [...Array(localStorage.length)]
          .map((_, i) => localStorage.key(i))
          .filter(key => key?.includes(':item:'))
      ).toEqual([])
    }
  )

  it('keeps a newer score when acknowledgement overlaps its write without Web Locks', async () => {
    vi.stubGlobal('navigator', {})
    const response = Promise.withResolvers<{ ok: boolean; status: number }>()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(response.promise)
      .mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    const first = submit('song1', 100)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const originalSet = localStorage.setItem.bind(localStorage)
    let second: Promise<void> | undefined
    let interleaved = false
    const setItem = vi
      .spyOn(localStorage, 'setItem')
      .mockImplementation((key, value) => {
        if (
          key === 'neurotoxic_pending_song_scores:retry-player' &&
          value === '[]' &&
          !interleaved
        ) {
          interleaved = true
          second = submit('song1', 200)
        }
        originalSet(key, value)
      })
    response.resolve({ ok: true, status: 200 })
    await first
    await second
    expect(interleaved).toBe(true)
    setItem.mockRestore()
    vi.clearAllTimers()
    vi.resetModules()
    const fresh = await import('../../src/utils/leaderboardUtils')
    await fresh.retryPendingLeaderboardScores(player)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body).scores).toEqual([
      { songId: 'lb_song1', score: 200, accuracy: 95 }
    ])
    await fresh.retryPendingLeaderboardScores(player)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

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
    expect(listStorageKeys().filter(key => key.includes(':item:'))).toEqual([])
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
