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

test('Leaderboard Stats API', async (t) => {
  let statsModule

  t.beforeEach(async () => {
    mockRedisClient.zAdd.mock.resetCalls()
    mockRedisClient.zRangeWithScores.mock.resetCalls()
    mockRedisClient.hmGet.mock.resetCalls()
    mockRedisClient.hSet.mock.resetCalls()
    mockMulti.zAdd.mock.resetCalls()
    mockMulti.exec.mock.resetCalls()

    // Dynamically import module
    statsModule = await import(API_PATH + '?t=' + Date.now())
  })

  t.afterEach(() => {
    // Reset any required state if needed
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
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], { success: true })

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
        playerId: 'test-band',
        // missing playerName and money
      }
    }
    const res = {
      status: mock.fn(() => res),
      json: mock.fn(() => res)
    }

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 400)
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0].error, 'Missing required fields')
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

    mockRedisClient.zRangeWithScores.mock.mockImplementationOnce(() => Promise.resolve([
      { value: 'band1', score: 100 },
      { value: 'band2', score: 50 }
    ]))

    mockRedisClient.hmGet.mock.mockImplementationOnce(() => Promise.resolve([
      'Band One',
      'Band Two'
    ]))

    await statsModule.default(req, res)

    assert.strictEqual(res.status.mock.calls[0].arguments[0], 200)
    assert.strictEqual(res.json.mock.calls[0].arguments[0].length, 2)
    assert.strictEqual(res.json.mock.calls[0].arguments[0][0].playerId, 'band1')
    assert.strictEqual(res.json.mock.calls[0].arguments[0][0].playerName, 'Band One')
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
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0].error, 'Invalid stat requested')
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
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0].error, 'Missing required fields')
  })
})
