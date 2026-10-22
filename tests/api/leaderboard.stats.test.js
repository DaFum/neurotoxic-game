// 🟢🧪⚙️ NEXUS ENCAPSULATES ALL OPTIMIZED TEST ARTIFACTS W '🟢🧪⚙️'s 🟢🧪⚙️
// Async handling strategy:
// This test suite leverages Vitest mocking capabilities.
// Redis external I/O operations are strictly mocked by intercepting the `lib/redis.js` import using `vi.mock()`.
// Since our Redis mock methods return resolved Promises and are explicitly awaited, we avoid dangling event loop ticks.
// Proper cleanup is ensured via `afterEach` where `mockRedisClient.disconnect()` handles teardown, and
// all mock counters are strictly reset in `beforeEach`.

import { test, describe, beforeEach, afterEach, vi } from 'vitest'
import assert from 'node:assert'
import { createApiRouteMocks } from '../utils/apiRouteMocks.js'
import { toPublicPlayerRef } from '../../lib/apiUtils.js'

const mockMulti = {
  zAdd: vi.fn(),
  exec: vi.fn(() => Promise.resolve())
}

const mockRedisClient = {
  isOpen: true,
  zAdd: vi.fn(() => Promise.resolve()),
  zRangeWithScores: vi.fn(() => Promise.resolve([])),
  hmGet: vi.fn(() => Promise.resolve([])),
  hSet: vi.fn(() => Promise.resolve()),
  incr: vi.fn(() => Promise.resolve(1)),
  expire: vi.fn(() => Promise.resolve()),
  multi: vi.fn(() => mockMulti),
  eval: vi.fn(() => Promise.resolve([1, 1])),
  disconnect: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  connect: vi.fn(() => Promise.resolve())
}

// Since stats.js imports the client directly as the default export of lib/redis.js
vi.mock('../../lib/redis', () => ({
  default: mockRedisClient
}))

describe('Leaderboard Stats API', () => {
  let statsModule

  beforeEach(async () => {
    mockRedisClient.isOpen = true
    mockRedisClient.incr.mockClear()
    mockRedisClient.expire.mockClear()
    mockRedisClient.zAdd.mockClear()
    mockRedisClient.zRangeWithScores.mockClear()
    mockRedisClient.hmGet.mockClear()
    mockRedisClient.hSet.mockClear()
    mockRedisClient.disconnect.mockClear()
    mockRedisClient.on.mockClear()
    mockRedisClient.connect.mockClear()
    mockRedisClient.eval.mockClear()
    mockRedisClient.eval.mockImplementation(() => Promise.resolve([1, 1]))
    mockMulti.zAdd.mockClear()
    mockMulti.exec.mockClear()

    // Import module once properly
    statsModule = await import('../../api/leaderboard/stats')
  })

  afterEach(async () => {
    await mockRedisClient.disconnect()
  })

  test('POST handles valid stats update', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'test-band',
        playerName: 'Test Band',
        money: 100,
        fame: 10,
        followers: 500,
        distance: 50,
        conflicts: 2,
        stageDives: 5
      }
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 200)
    assert.deepStrictEqual(res.json.mock.calls[0][0], {
      success: true
    })

    // Check hSet was called
    assert.strictEqual(mockRedisClient.hSet.mock.calls.length, 1)

    // Checks that all 6 stats have been zAdd'ed in multi
    assert.strictEqual(mockMulti.zAdd.mock.calls.length, 6)
    assert.strictEqual(mockMulti.exec.mock.calls.length, 1)
  })

  const revisionRequest = revision => ({
    method: 'POST',
    headers: { 'x-forwarded-for': '127.0.0.1' },
    body: {
      playerId: 'test-band',
      playerName: 'Test Band',
      money: 100,
      fame: 10,
      followers: 500,
      distance: 50,
      conflicts: 2,
      stageDives: 5,
      revision
    }
  })

  test('POST with a revision applies all boards atomically in one script', async () => {
    const { res } = createApiRouteMocks()
    await statsModule.default(revisionRequest(1700000000000), res)

    assert.strictEqual(res.status.mock.calls[0][0], 200)
    assert.deepStrictEqual(res.json.mock.calls[0][0], { success: true })
    assert.strictEqual(mockRedisClient.eval.mock.calls.length, 1)
    const [script, options] = mockRedisClient.eval.mock.calls[0]
    assert.match(script, /HGET/)
    assert.deepStrictEqual(options.keys, [
      'lb:revision',
      'players',
      'lb:balance',
      'lb:fame',
      'lb:followers',
      'lb:distance',
      'lb:conflicts',
      'lb:stage_dives'
    ])
    assert.deepStrictEqual(options.arguments, [
      'test-band',
      '1700000000000',
      'Test Band',
      '100',
      '10',
      '500',
      '50',
      '2',
      '5'
    ])
    // The legacy non-atomic path is not used when a revision is present.
    assert.strictEqual(mockMulti.exec.mock.calls.length, 0)
    // The display name is written inside the same guarded script, never by a
    // separate call an older request could finish after a newer one.
    assert.strictEqual(mockRedisClient.hSet.mock.calls.length, 0)
  })

  test('POST with a stale revision is acknowledged but not applied', async () => {
    mockRedisClient.eval.mockImplementation(() => Promise.resolve([0, 9]))
    const { res } = createApiRouteMocks()
    await statsModule.default(revisionRequest(5), res)

    assert.strictEqual(res.status.mock.calls[0][0], 200)
    // The stored revision is returned so the client can catch up.
    assert.deepStrictEqual(res.json.mock.calls[0][0], {
      success: true,
      stale: true,
      revision: 9
    })
    // A stale snapshot must not rewrite the display name either.
    assert.strictEqual(mockRedisClient.hSet.mock.calls.length, 0)
  })

  // The published balance is capped at 10,000,000; a richer wallet is not a
  // reason to drop the whole snapshot (fame, followers and the rest).
  for (const [money, published] of [
    [10_000_000, '10000000'],
    [10_000_001, '10000000'],
    [2_500_000_000, '10000000']
  ]) {
    test(`POST with a revision publishes money ${money} as ${published} and keeps the other stats`, async () => {
      const req = revisionRequest(1700000000000)
      req.body.money = money
      const { res } = createApiRouteMocks()
      await statsModule.default(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 200)
      assert.deepStrictEqual(res.json.mock.calls[0][0], { success: true })
      assert.deepStrictEqual(mockRedisClient.eval.mock.calls[0][1].arguments, [
        'test-band',
        '1700000000000',
        'Test Band',
        published,
        '10',
        '500',
        '50',
        '2',
        '5'
      ])
    })

    test(`POST without a revision publishes money ${money} as ${published} and keeps the other stats`, async () => {
      const req = revisionRequest(undefined)
      req.body.money = money
      const { res } = createApiRouteMocks()
      await statsModule.default(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 200)
      assert.deepStrictEqual(
        mockMulti.zAdd.mock.calls.map(([key, { score }]) => [key, score]),
        [
          ['lb:balance', Number(published)],
          ['lb:fame', 10],
          ['lb:followers', 500],
          ['lb:distance', 50],
          ['lb:conflicts', 2],
          ['lb:stage_dives', 5]
        ]
      )
    })
  }

  test('POST still rejects a negative or non-finite money value', async () => {
    for (const bad of [-1, Number.NaN, Infinity]) {
      const req = revisionRequest(1700000000000)
      req.body.money = bad
      const { res } = createApiRouteMocks()
      await statsModule.default(req, res)
      assert.strictEqual(res.status.mock.calls[0][0], 400, String(bad))
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Invalid money value'
      })
    }
    assert.strictEqual(mockRedisClient.eval.mock.calls.length, 0)
  })

  test('POST rejects an invalid revision', async () => {
    for (const bad of [0, -1, 1.5, '7', null, Number.NaN, 2 ** 60]) {
      const { res } = createApiRouteMocks()
      await statsModule.default(revisionRequest(bad), res)
      assert.strictEqual(res.status.mock.calls[0][0], 400, String(bad))
    }
    assert.strictEqual(mockRedisClient.eval.mock.calls.length, 0)
  })

  test('POST rejects missing required fields', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'test-band'
        // missing playerName and money
      }
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0][0].error,
      'Missing required fields'
    )
  })

  test('POST rejects excessively long playerName', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'test-band',
        playerName: 'A'.repeat(101), // over the 100 character limit
        money: 100
      }
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0][0].error,
      'Invalid playerName length'
    )
  })

  test('GET retrieves stat leaderboard', async () => {
    const req = {
      method: 'GET',
      query: {
        stat: 'fame',
        limit: '10'
      }
    }
    const { res } = createApiRouteMocks()

    mockRedisClient.zRangeWithScores.mockImplementationOnce(() =>
      Promise.resolve([
        { value: 'band1', score: 100 },
        { value: 'band2', score: 50 }
      ])
    )

    mockRedisClient.hmGet.mockImplementationOnce(() =>
      Promise.resolve(['Band One', 'Band Two'])
    )

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 200)
    assert.strictEqual(res.json.mock.calls[0][0].length, 2)
    // Raw playerId (the write credential) must not be published.
    assert.strictEqual(res.json.mock.calls[0][0][0].playerId, undefined)
    assert.strictEqual(
      res.json.mock.calls[0][0][0].playerRef,
      toPublicPlayerRef('band1')
    )
    assert.strictEqual(res.json.mock.calls[0][0][0].playerName, 'Band One')
    assert.strictEqual(res.json.mock.calls[0][0][0].score, 100)
  })

  test('GET handles invalid stat type', async () => {
    const req = {
      method: 'GET',
      query: {
        stat: 'invalid_stat'
      }
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0][0].error,
      'Invalid stat requested'
    )
  })

  test('POST rejects undefined body', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: undefined
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0][0].error,
      'Missing required fields'
    )
  })

  test('POST handles extreme and negative stat values correctly', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'extreme-band',
        playerName: 'Extreme',
        money: 500,
        fame: -100, // Negative should clamp to 0
        followers: 1000000000000000000, // Huge should clamp to MAX_STAT_VALUE
        distance: NaN, // Invalid should clamp to 0
        conflicts: -5,
        stageDives: Infinity
      }
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 200)

    // Verify clampStat worked
    const zAddCalls = mockMulti.zAdd.mock.calls
    const fameCall = zAddCalls.find(call => call[0] === 'lb:fame')
    const followersCall = zAddCalls.find(call => call[0] === 'lb:followers')
    const distanceCall = zAddCalls.find(call => call[0] === 'lb:distance')

    assert.strictEqual(fameCall[1].score, 0)
    assert.strictEqual(followersCall[1].score, 999999999999) // MAX_STAT_VALUE
    assert.strictEqual(distanceCall[1].score, 0)
  })

  test('GET enforces limit constraints', async () => {
    const req = {
      method: 'GET',
      query: {
        stat: 'fame',
        limit: '9999' // Should clamp to 100
      }
    }
    const { res } = createApiRouteMocks()

    mockRedisClient.zRangeWithScores.mockImplementationOnce(() =>
      Promise.resolve([])
    )

    await statsModule.default(req, res)

    // Limit index is 99 because zRangeWithScores is inclusive (0 to limit - 1)
    assert.strictEqual(mockRedisClient.zRangeWithScores.mock.calls[0][2], 99)
  })

  test('Rejects unsupported HTTP methods', async () => {
    const req = {
      method: 'DELETE'
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.setHeader.mock.calls[0][0], 'Allow')
    assert.deepStrictEqual(res.setHeader.mock.calls[0][1], ['GET', 'POST'])
    assert.strictEqual(res.status.mock.calls[0][0], 405)
  })

  test('POST rate limit exceeded returns 429', async () => {
    mockRedisClient.incr.mockImplementationOnce(() => Promise.resolve(6))

    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'test-band',
        playerName: 'Test Band',
        money: 100
      }
    }
    const { res } = createApiRouteMocks()

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 429)
    assert.deepStrictEqual(res.json.mock.calls[0][0], {
      error: 'Too many requests'
    })
  })
})
// 🟢🧪⚙️ NEXUS TEST ARTIFACT END 🟢🧪⚙️
