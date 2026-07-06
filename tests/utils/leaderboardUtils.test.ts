import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitLeaderboardScores } from '../../src/utils/leaderboardUtils'
import { logger } from '../../src/utils/logger'
import type { GameState, PostGigSummary } from '../../src/types'

vi.mock('../../src/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('../../src/data/songs', () => ({
  SONGS_BY_ID: new Map([
    ['song1', { leaderboardId: 'lb_song1' }],
    ['song2', { leaderboardId: 'lb_song2' }]
  ])
}))

describe('leaderboardUtils', () => {
  let player: GameState['player']
  let lastGigStats: PostGigSummary

  beforeEach(() => {
    vi.clearAllMocks()

    player = {
      playerId: 'p1',
      playerName: 'Player One'
    } as unknown as GameState['player']
    lastGigStats = {
      score: 100,
      accuracy: 95,
      songStats: [{ songId: 'song1', score: 100, accuracy: 95 }]
    } as unknown as PostGigSummary
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('submitLeaderboardScores error paths', () => {
    it('should clear timeout and log error when fetch fails', async () => {
      const mockError = new Error('Network failure')
      vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(mockError))

      const spyClearTimeout = vi.spyOn(globalThis, 'clearTimeout')

      await submitLeaderboardScores({
        player,
        lastGigStats,
        currentGig: null,
        setlist: []
      })

      expect(spyClearTimeout).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'PostGig',
        'Batch score submit failed',
        mockError
      )
    })

    it('should clear timeout and log error when response is not ok', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValueOnce('Internal Server Error')
        })
      )

      const spyClearTimeout = vi.spyOn(globalThis, 'clearTimeout')

      await submitLeaderboardScores({
        player,
        lastGigStats,
        currentGig: null,
        setlist: []
      })

      expect(spyClearTimeout).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'PostGig',
        'Batch score submit failed',
        expect.objectContaining({ message: 'HTTP 500: Internal Server Error' })
      )
    })
  })
})
