// 🟢🧪⚙️ NEXUS ENCAPSULATES ALL OPTIMIZED TEST ARTIFACTS W '🟢🧪⚙️'s 🟢🧪⚙️
// Async handling strategy:
// This test suite leverages Native Node.js test runner mocking capabilities.
// Redis external I/O operations are strictly mocked by intercepting the `lib/redis.js` import using `mock.module()`.
// Since our Redis mock methods return resolved Promises and are explicitly awaited, we avoid dangling event loop ticks.
// Proper cleanup is ensured via `afterEach` where `mockRedisClient.disconnect()` handles teardown, and
// all mock counters are strictly reset in `beforeEach` (`mockFn.mock.resetCalls()`) rather than totally destroying the mock module.

import { test, describe, beforeEach, afterEach, vi } from "vitest"
import assert from 'node:assert'

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
  disconnect: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  connect: vi.fn(() => Promise.resolve())
}

// Since stats.js imports the client directly as the default export of lib/redis.js
vi.mock('../../lib/redis.js', () => ({
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
    mockRedisClient.incr.mockClear()
    mockRedisClient.expire.mockClear()
    mockRedisClient.disconnect.mockClear()
    mockRedisClient.on.mockClear()
    mockRedisClient.connect.mockClear()
    mockMulti.zAdd.mockClear()
    mockMulti.exec.mockClear()

    // Import module once properly
    statsModule = await import('../../api/leaderboard/stats.js')
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
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

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

  test('POST rejects missing required fields', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'test-band'
        // missing playerName and money
      }
    }
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

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
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

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
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

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
    assert.strictEqual(res.json.mock.calls[0][0][0].playerId, 'band1')
    assert.strictEqual(
      res.json.mock.calls[0][0][0].playerName,
      'Band One'
    )
    assert.strictEqual(res.json.mock.calls[0][0][0].score, 100)
  })

  test('GET handles invalid stat type', async () => {
    const req = {
      method: 'GET',
      query: {
        stat: 'invalid_stat'
      }
    }
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

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
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

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
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 200)

    // Verify clampStat worked
    const zAddCalls = mockMulti.zAdd.mock.calls
    const fameCall = zAddCalls.find(call => call[0] === 'lb:fame')
    const followersCall = zAddCalls.find(
      call => call[0] === 'lb:followers'
    )
    const distanceCall = zAddCalls.find(
      call => call[0] === 'lb:distance'
    )

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
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    mockRedisClient.zRangeWithScores.mockImplementationOnce(() =>
      Promise.resolve([])
    )

    await statsModule.default(req, res)

    // Limit index is 99 because zRangeWithScores is inclusive (0 to limit - 1)
    assert.strictEqual(
      mockRedisClient.zRangeWithScores.mock.calls[0][2],
      99
    )
  })

  test('Rejects unsupported HTTP methods', async () => {
    const req = {
      method: 'DELETE'
    }
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
      setHeader: vi.fn(),
      end: vi.fn()
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.setHeader.mock.calls[0][0], 'Allow')
    assert.deepStrictEqual(res.setHeader.mock.calls[0][1], [
      'GET',
      'POST'
    ])
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
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0][0], 429)
    assert.deepStrictEqual(res.json.mock.calls[0][0], {
      error: 'Too many requests'
    })
  })
})
// 🟢🧪⚙️ NEXUS TEST ARTIFACT END 🟢🧪⚙️
