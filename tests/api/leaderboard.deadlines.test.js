import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiRouteMocks } from '../utils/apiRouteMocks.js'

const redis = vi.hoisted(() => ({
  duplicate() {
    return { ...redis, on: vi.fn(), destroy: vi.fn() }
  },
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
import {
  isLeaderboardRateLimited,
  RATE_LIMIT_SCRIPT
} from '../../lib/leaderboard.js'

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

it('isLeaderboardRateLimited bounds a stalled Redis eval operation', async () => {
  redis.eval.mockImplementationOnce(() => new Promise(() => {}))
  const check = isLeaderboardRateLimited(
    /** @type {import('../../lib/apiTypes.js').ApiRequest} */ ({
      socket: { remoteAddress: '127.0.0.1' }
    }),
    'stats',
    5,
    60,
    redis
  )
  const failure = expect(check).rejects.toThrow('Redis deadline exceeded')
  await vi.advanceTimersByTimeAsync(1000)
  await failure
})

it('closes a late connection after its request expires', async () => {
  const { createRedisRequest } = await import('../../lib/redisDeadline.js')
  let finishConnect
  const isolated = {
    on: vi.fn(),
    connect: vi.fn(
      () =>
        new Promise(resolve => {
          finishConnect = resolve
        })
    ),
    destroy: vi.fn()
  }
  const shared = { duplicate: vi.fn(() => isolated), destroy: vi.fn() }
  const request = createRedisRequest(shared)
  const { withRedisDeadline } = await import('../../lib/redisDeadline.js')
  const connection = withRedisDeadline(isolated, () => request.connect()).catch(
    () => 'expired'
  )
  await vi.advanceTimersByTimeAsync(1000)
  expect(await connection).toBe('expired')
  request.close()
  expect(isolated.destroy).toHaveBeenCalledTimes(1)
  expect(shared.destroy).not.toHaveBeenCalled()
  finishConnect()
  await vi.advanceTimersByTimeAsync(0)
  expect(isolated.destroy).toHaveBeenCalledTimes(2)
})

it('keeps capacity occupied until a late connection settles', async () => {
  const { createRedisRequest } = await import('../../lib/redisDeadline.js')
  const connection = Promise.withResolvers()
  const shared = {
    duplicate: () => ({
      on: vi.fn(),
      connect: () => connection.promise,
      destroy: vi.fn()
    })
  }
  const requests = Array.from({ length: 256 }, () => createRedisRequest(shared))
  const pending = requests[0].connect()
  requests[0].close()
  expect(() => createRedisRequest(shared)).toThrow(
    'Redis request capacity exceeded'
  )
  connection.resolve()
  await pending
  const next = createRedisRequest(shared)
  next.close()
  for (const request of requests.slice(1)) request.close()
})

it('releases capacity even when a private client throws during cleanup', async () => {
  const { createRedisRequest } = await import('../../lib/redisDeadline.js')
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const shared = {
    duplicate: () => ({
      on: vi.fn(),
      destroy: () => {
        throw new Error('closed')
      }
    })
  }
  const requests = Array.from({ length: 256 }, () => createRedisRequest(shared))
  expect(() => requests[0].close()).not.toThrow()
  const next = createRedisRequest(shared)
  for (const request of [...requests.slice(1), next]) request.close()
  log.mockRestore()
})

it('cleans up and releases capacity after connect rejects late', async () => {
  const { createRedisRequest } = await import('../../lib/redisDeadline.js')
  const connection = Promise.withResolvers()
  const isolated = {
    on: vi.fn(),
    destroy: vi.fn(),
    connect: () => connection.promise
  }
  const shared = { duplicate: () => isolated }
  const request = createRedisRequest(shared)
  const pending = request.connect()
  request.close()
  connection.reject(new Error('connection failed'))
  await expect(pending).rejects.toThrow('connection failed')
  expect(isolated.destroy).toHaveBeenCalledTimes(2)
  const next = createRedisRequest(shared)
  next.close()
})
