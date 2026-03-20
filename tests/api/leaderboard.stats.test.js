// 🟢🧪⚙️ NEXUS ENCAPSULATES ALL OPTIMIZED TEST ARTIFACTS W '🟢🧪⚙️'s 🟢🧪⚙️
// Async handling strategy:
// This test suite leverages Native Node.js test runner mocking capabilities.
// Redis external I/O operations are strictly mocked by intercepting the `lib/redis.js` import using `mock.module()`.
// Since our Redis mock methods return resolved Promises and are explicitly awaited, we avoid dangling event loop ticks.
// Proper cleanup is ensured via `afterEach` where `mockRedisClient.disconnect()` handles teardown, and
// all mock counters are strictly reset in `beforeEach` (`mockFn.mock.resetCalls()`) rather than totally destroying the mock module.

import { test, mock, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'

const mockMulti = {
  zAdd: mock.fn(),
  exec: mock.fn(() => Promise.resolve())
}

const mockRedisClient = {
  isOpen: true,
  zAdd: mock.fn(() => Promise.resolve()),
  zRangeWithScores: mock.fn(() => Promise.resolve([])),
  hmGet: mock.fn(() => Promise.resolve([])),
  hSet: mock.fn(() => Promise.resolve()),
  multi: mock.fn(() => mockMulti),
  disconnect: mock.fn(() => Promise.resolve()),
  on: mock.fn(),
  connect: mock.fn(() => Promise.resolve())
}

// Since stats.js imports the client directly as the default export of lib/redis.js
mock.module('../../lib/redis.js', { defaultExport: mockRedisClient })

describe('Leaderboard Stats API', () => {
  let statsModule

  beforeEach(async () => {
    mockRedisClient.isOpen = true
    mockRedisClient.zAdd.mock.resetCalls()
    mockRedisClient.zRangeWithScores.mock.resetCalls()
    mockRedisClient.hmGet.mock.resetCalls()
    mockRedisClient.hSet.mock.resetCalls()
    mockRedisClient.disconnect.mock.resetCalls()
    mockRedisClient.on.mock.resetCalls()
    mockRedisClient.connect.mock.resetCalls()
    mockMulti.zAdd.mock.resetCalls()
    mockMulti.exec.mock.resetCalls()

    // Import module once properly
    statsModule = await import('../../api/leaderboard/stats.js')
  })

  afterEach(async () => {
    await mockRedisClient.disconnect()
  })

  test('POST handles valid stats update', async () => {
    const req = {
      method: 'POST',
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
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 200)
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
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
      body: {
        playerId: 'test-band'
        // missing playerName and money
      }
    }
    const res = {
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0].arguments[0].error,
      'Missing required fields'
    )
  })

  test('POST rejects excessively long playerName', async () => {
    const req = {
      method: 'POST',
      body: {
        playerId: 'test-band',
        playerName: 'A'.repeat(101), // over the 100 character limit
        money: 100
      }
    }
    const res = {
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0].arguments[0].error,
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
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    mockRedisClient.zRangeWithScores.mock.mockImplementationOnce(() =>
      Promise.resolve([
        { value: 'band1', score: 100 },
        { value: 'band2', score: 50 }
      ])
    )

    mockRedisClient.hmGet.mock.mockImplementationOnce(() =>
      Promise.resolve(['Band One', 'Band Two'])
    )

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 200)
    assert.strictEqual(res.json.mock.calls[0].arguments[0].length, 2)
    assert.strictEqual(res.json.mock.calls[0].arguments[0][0].playerId, 'band1')
    assert.strictEqual(
      res.json.mock.calls[0].arguments[0][0].playerName,
      'Band One'
    )
    assert.strictEqual(res.json.mock.calls[0].arguments[0][0].score, 100)
  })

  test('GET handles invalid stat type', async () => {
    const req = {
      method: 'GET',
      query: {
        stat: 'invalid_stat'
      }
    }
    const res = {
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0].arguments[0].error,
      'Invalid stat requested'
    )
  })

  test('POST rejects undefined body', async () => {
    const req = {
      method: 'POST',
      body: undefined
    }
    const res = {
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 400)
    assert.deepStrictEqual(
      res.json.mock.calls[0].arguments[0].error,
      'Missing required fields'
    )
  })

  test(
    'POST handles extreme and negative stat values correctly',
    async () => {
      const req = {
        method: 'POST',
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
        status: mock.fn(() => res),
        json: mock.fn(() => res)
      }

      await statsModule.default(req, res)

      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200)

      // Verify clampStat worked
      const zAddCalls = mockMulti.zAdd.mock.calls
      const fameCall = zAddCalls.find(call => call.arguments[0] === 'lb:fame')
      const followersCall = zAddCalls.find(
        call => call.arguments[0] === 'lb:followers'
      )
      const distanceCall = zAddCalls.find(
        call => call.arguments[0] === 'lb:distance'
      )

      assert.strictEqual(fameCall.arguments[1].score, 0)
      assert.strictEqual(followersCall.arguments[1].score, 999999999999) // MAX_STAT_VALUE
      assert.strictEqual(distanceCall.arguments[1].score, 0)
    }
  )

  test('GET enforces limit constraints', async () => {
    const req = {
      method: 'GET',
      query: {
        stat: 'fame',
        limit: '9999' // Should clamp to 100
      }
    }
    const res = {
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    mockRedisClient.zRangeWithScores.mock.mockImplementationOnce(() =>
      Promise.resolve([])
    )

    await statsModule.default(req, res)

    // Limit index is 99 because zRangeWithScores is inclusive (0 to limit - 1)
    assert.strictEqual(
      mockRedisClient.zRangeWithScores.mock.calls[0].arguments[2],
      99
    )
  })

  test('Rejects unsupported HTTP methods', async () => {
    const req = {
      method: 'DELETE'
    }
    const res = {
      status: mock.fn(() => res),
      json: mock.fn(() => res),
      setHeader: mock.fn(),
      end: mock.fn()
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.setHeader.mock.calls[0].arguments[0], 'Allow')
    assert.deepStrictEqual(res.setHeader.mock.calls[0].arguments[1], [
      'GET',
      'POST'
    ])
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 405)
  })
})
// 🟢🧪⚙️ NEXUS TEST ARTIFACT END 🟢🧪⚙️
