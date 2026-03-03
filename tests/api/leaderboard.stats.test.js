import test from 'node:test'
import assert from 'node:assert'
import { mock } from 'node:test'

const mockMulti = {
  zAdd: mock.fn(),
  exec: mock.fn(() => Promise.resolve())
}

const mockRedisClient = {
  isOpen: true,
  zAdd: mock.fn(),
  zRangeWithScores: mock.fn(),
  hmGet: mock.fn(),
  hSet: mock.fn(),
  multi: mock.fn(() => mockMulti),
  disconnect: mock.fn(),
  on: mock.fn(),
  connect: mock.fn()
}

// Since stats.js imports the client directly as the default export of lib/redis.js
mock.module('../../lib/redis.js', { defaultExport: mockRedisClient })

const API_PATH = '../../api/leaderboard/stats.js'
let importCounter = 0

test('Leaderboard Stats API', async t => {
  let statsModule

  t.beforeEach(async () => {
    mockRedisClient.zAdd.mock.resetCalls()
    mockRedisClient.zRangeWithScores.mock.resetCalls()
    mockRedisClient.hmGet.mock.resetCalls()
    mockRedisClient.hSet.mock.resetCalls()
    mockMulti.zAdd.mock.resetCalls()
    mockMulti.exec.mock.resetCalls()

    // Dynamically import module with deterministic incrementing counter
    importCounter++
    statsModule = await import(API_PATH + '?t=' + importCounter)
  })

  await t.test('POST handles valid stats update', async () => {
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

  await t.test('POST rejects missing required fields', async () => {
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

  await t.test('GET retrieves stat leaderboard', async () => {
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

  await t.test('GET handles invalid stat type', async () => {
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

  await t.test('POST rejects undefined body', async () => {
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

  await t.test(
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

  await t.test('GET enforces limit constraints', async () => {
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

  await t.test('Rejects unsupported HTTP methods', async () => {
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
