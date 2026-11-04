import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiRouteMocks } from '../utils/apiRouteMocks.js'

const redis = vi.hoisted(() => ({
  isOpen: true,
  connect: vi.fn(),
  eval: vi.fn(),
  zRangeWithScores: vi.fn(),
  hmGet: vi.fn(),
  destroy: vi.fn()
}))
vi.mock('../../lib/redis.js', () => ({ default: redis }))
import stats from '../../api/leaderboard/stats.js'
import song from '../../api/leaderboard/song.js'

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  redis.isOpen = true
  redis.eval.mockResolvedValue(1)
})
afterEach(() => vi.useRealTimers())

describe('leaderboard Redis deadlines', () => {
  for (const [endpoint, handler] of [
    ['stats', stats],
    ['song', song]
  ]) {
    for (const method of ['GET', 'POST']) {
      for (const phase of ['connect', 'command']) {
        it(`${endpoint} ${method} bounds a stalled ${phase}`, async () => {
          const pending = () => new Promise(() => {})
          if (phase === 'connect') {
            redis.isOpen = false
            redis.connect.mockImplementation(pending)
          } else {
            redis.eval.mockImplementation(pending)
            redis.zRangeWithScores.mockImplementation(pending)
          }
          const { req, res } = createApiRouteMocks({
            method,
            query: { stat: 'balance', songId: '01_kranker_schrank' },
            body: {
              playerId: 'player',
              playerName: 'Player',
              money: 10,
              songId: '01_kranker_schrank',
              score: 100
            }
          })
          const response = handler(req, res)
          await vi.advanceTimersByTimeAsync(1500)
          expect(res.status).toHaveBeenCalledWith(500)
          await response
          expect(res.json).toHaveBeenCalledWith({
            error: 'Internal Server Error'
          })
          if (phase === 'command')
            expect(redis.destroy).toHaveBeenCalledTimes(1)
          if (phase === 'connect') expect(redis.eval).not.toHaveBeenCalled()
        })
      }
    }
  }
})
