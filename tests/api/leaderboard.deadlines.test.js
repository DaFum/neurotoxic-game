import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiRouteMocks } from '../utils/apiRouteMocks.js'

const redis = vi.hoisted(() => ({
  isOpen: true,
  connect: vi.fn(),
  eval: vi.fn(),
  zRangeWithScores: vi.fn(),
  hmGet: vi.fn(),
  multi: vi.fn(),
  destroy: vi.fn()
}))
vi.mock('../../lib/redis.js', () => ({ default: redis }))
import stats, {
  WRITE_IF_NEWER_SCRIPT,
  WRITE_IF_UNVERSIONED_SCRIPT
} from '../../api/leaderboard/stats.js'
import song, {
  SET_NAME_IF_UNVERSIONED_SCRIPT
} from '../../api/leaderboard/song.js'
import { RATE_LIMIT_SCRIPT } from '../../lib/leaderboard.js'

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
          if (phase === 'command') expect(redis.destroy).not.toHaveBeenCalled()
          if (phase === 'connect') expect(redis.eval).not.toHaveBeenCalled()
        })
      }
    }
  }
})

it('stats GET bounds a stalled name lookup after the leaderboard range resolves', async () => {
  redis.zRangeWithScores.mockResolvedValue([{ value: 'player', score: 10 }])
  redis.hmGet.mockImplementation(() => new Promise(() => {}))
  const { req, res } = createApiRouteMocks({
    method: 'GET',
    query: { stat: 'balance' }
  })
  const response = stats(req, res)
  await vi.advanceTimersByTimeAsync(0)
  expect(redis.hmGet).toHaveBeenCalledWith('players', ['player'])
  expect(res.status).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1500)
  await response
  expect(res.status).toHaveBeenCalledWith(500)
  expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
})

for (const [description, handler, body, script, stallExec] of [
  ['stats score write', stats, {}, WRITE_IF_UNVERSIONED_SCRIPT, false],
  [
    'versioned stats score write',
    stats,
    { revision: 1 },
    WRITE_IF_NEWER_SCRIPT,
    false
  ],
  ['song name write', song, {}, SET_NAME_IF_UNVERSIONED_SCRIPT, false],
  ['song score transaction', song, {}, SET_NAME_IF_UNVERSIONED_SCRIPT, true]
]) {
  it(`${description} bounds a stalled write after rate limiting`, async () => {
    const pending = () => new Promise(() => {})
    const exec = vi.fn().mockImplementation(pending)
    const multi = { zAdd: vi.fn(), exec }
    redis.multi.mockReturnValue(multi)
    redis.eval.mockResolvedValueOnce(1)
    if (stallExec) redis.eval.mockResolvedValueOnce(1)
    else redis.eval.mockImplementationOnce(pending)
    const { req, res } = createApiRouteMocks({
      method: 'POST',
      body: {
        playerId: 'player',
        playerName: 'Player',
        money: 10,
        songId: '01_kranker_schrank',
        score: 100,
        ...body
      }
    })
    const response = handler(req, res)
    await vi.advanceTimersByTimeAsync(0)
    expect(redis.eval).toHaveBeenCalledTimes(2)
    expect(redis.eval.mock.calls[0][0]).toBe(RATE_LIMIT_SCRIPT)
    expect(redis.eval.mock.calls[1][0]).toBe(script)
    if (stallExec) {
      expect(multi.zAdd).toHaveBeenCalledTimes(1)
      expect(exec).toHaveBeenCalledTimes(1)
    } else {
      expect(redis.multi).not.toHaveBeenCalled()
    }
    expect(res.status).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1500)
    await response
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
  })
}

it('a timed-out request does not interrupt another Redis operation', async () => {
  const { withRedisDeadline } = await import('../../lib/redisDeadline.js')
  let finishOther
  const other = new Promise(resolve => {
    finishOther = resolve
  })
  const timedOut = withRedisDeadline(redis, () => new Promise(() => {}))
  await vi.advanceTimersByTimeAsync(500)
  const concurrent = withRedisDeadline(redis, () => other)
  const failure = expect(timedOut).rejects.toThrow('Redis deadline exceeded')
  await vi.advanceTimersByTimeAsync(500)
  await failure
  expect(redis.destroy).not.toHaveBeenCalled()
  finishOther('ok')
  await expect(concurrent).resolves.toBe('ok')
  await expect(
    withRedisDeadline(redis, () => Promise.resolve('next'))
  ).resolves.toBe('next')
})
