// 🟢🧪⚙️ NEXUS ENCAPSULATES ALL OPTIMIZED TEST ARTIFACTS W '🟢🧪⚙️'s 🟢🧪⚙️
// Async handling strategy:
// Uses Vitest mocking capabilities to hermetically intercept `lib/redis.js` external dependencies.
// Redis calls are simulated by mock functions returning explicit resolved/rejected promises. This ensures:
// 1) Test isolation and parallel execution safety.
// 2) Deterministic promise resolution preventing asynchronous open handles or leakage.
// 3) Proper test setup isolation using mock counter resets in `beforeEach`.

import { test, describe, beforeEach, afterEach, vi } from 'vitest'
import assert from 'node:assert'

const mockClient = {
  isOpen: true,
  connect: vi.fn(() => Promise.resolve()),
  hSet: vi.fn(() => Promise.resolve()),
  zAdd: vi.fn(() => Promise.resolve()),
  zRangeWithScores: vi.fn(() => Promise.resolve([])),
  hmGet: vi.fn(() => Promise.resolve([])),
  incr: vi.fn(() => Promise.resolve(1)),
  expire: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(() => Promise.resolve()),
  on: vi.fn()
}

vi.mock('../../lib/redis', () => ({
  default: mockClient
}))

describe('Leaderboard API - Song', () => {
  let handler

  beforeEach(async () => {
    // Import handler dynamically after mocking
    const module = await import('../../api/leaderboard/song')
    handler = module.default

    mockClient.isOpen = true
    mockClient.connect.mockClear()
    mockClient.incr.mockClear()
    mockClient.expire.mockClear()
    mockClient.hSet.mockClear()
    mockClient.zAdd.mockClear()
    mockClient.zRangeWithScores.mockClear()
    mockClient.hmGet.mockClear()
    mockClient.disconnect.mockClear()
  })

  afterEach(async () => {
    await mockClient.disconnect()
  })

  const createRes = () => {
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
      setHeader: vi.fn(),
      end: vi.fn()
    }
    return res
  }

  describe('POST requests', () => {
    test('missing or invalid body returns 400', async () => {
      const bodies = [null, undefined, []]

      for (const body of bodies) {
        const req = {
          method: 'POST',
          headers: { 'x-forwarded-for': '127.0.0.1' },
          body
        }
        const res = createRes()

        await handler(req, res)

        assert.strictEqual(res.status.mock.calls[0][0], 400)
        assert.deepStrictEqual(res.json.mock.calls[0][0], {
          error: 'Invalid payload structure: expected object'
        })
      }
    })

    test('missing required fields returns 400', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'player1',
          playerName: 'Player One',
          songId: 'song1'
          // missing score
        }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 400)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Missing required fields'
      })
    })

    test('invalid score value returns 400', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'player1',
          playerName: 'Player One',
          songId: 'song1',
          score: -50
        }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 400)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Invalid score value'
      })
    })

    test('invalid playerName length returns 400', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'player1',
          playerName: '   ',
          songId: 'song1',
          score: 1000
        }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 400)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Invalid playerName length'
      })
    })

    test('invalid playerId format returns 400', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'invalid player id!',
          playerName: 'Player',
          songId: 'song1',
          score: 1000
        }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 400)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Invalid playerId format'
      })
    })

    test('invalid songId format returns 400 for POST', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'player1',
          playerName: 'Player',
          songId: 'invalid song id!',
          score: 1000
        }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 400)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Invalid songId format'
      })
    })

    test('successful update calls redis commands and returns 200', async () => {
      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'player1',
          playerName: 'Player One',
          songId: 'song1',
          score: 1000
        }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(mockClient.hSet.mock.calls.length, 1)
      assert.deepStrictEqual(mockClient.hSet.mock.calls[0], [
        'players',
        { player1: 'Player One' }
      ])

      assert.strictEqual(mockClient.zAdd.mock.calls.length, 1)
      assert.deepStrictEqual(mockClient.zAdd.mock.calls[0], [
        'lb:song:song1',
        { score: 1000, value: 'player1' },
        { GT: true }
      ])

      assert.strictEqual(res.status.mock.calls[0][0], 200)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        success: true
      })
    })

    test('rate limit exceeded returns 429', async () => {
      mockClient.incr.mockImplementationOnce(() => Promise.resolve(6))

      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'player1',
          playerName: 'Player One',
          songId: 'song1',
          score: 1000
        }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 429)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Too many requests'
      })
    })

    test('internal server error returns 500 for POST', async () => {
      mockClient.hSet.mockImplementationOnce(() => {
        return Promise.reject(new Error('Redis down'))
      })

      const req = {
        method: 'POST',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        body: {
          playerId: 'player1',
          playerName: 'Player',
          songId: 'song1',
          score: 1000
        }
      }
      const res = createRes()

      // Silence console.error for this test
      const originalConsoleError = console.error
      console.error = () => {}

      try {
        await handler(req, res)
      } finally {
        console.error = originalConsoleError
      }

      assert.strictEqual(res.status.mock.calls[0][0], 500)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Internal Server Error'
      })
    })
  })

  describe('GET requests', () => {
    test('missing songId returns 400', async () => {
      const req = {
        method: 'GET',
        query: {}
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 400)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Missing songId'
      })
    })

    test('invalid songId format returns 400 for GET', async () => {
      const req = {
        method: 'GET',
        query: { songId: 'invalid song id!' }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 400)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Invalid songId format'
      })
    })

    test('returns empty array if no results', async () => {
      mockClient.zRangeWithScores.mockImplementationOnce(async () => [])

      const req = {
        method: 'GET',
        query: { songId: 'song1' }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(mockClient.zRangeWithScores.mock.calls.length, 1)
      assert.strictEqual(res.status.mock.calls[0][0], 200)
      assert.deepStrictEqual(res.json.mock.calls[0][0], [])
    })

    test('returns formatted leaderboard', async () => {
      mockClient.zRangeWithScores.mockImplementationOnce(async () => [
        { score: 1000, value: 'player1' },
        { score: 500, value: 'player2' }
      ])

      mockClient.hmGet.mockImplementationOnce(async () => [
        'Player One',
        'Player Two'
      ])

      const req = {
        method: 'GET',
        query: { songId: 'song1', limit: '2' }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(mockClient.zRangeWithScores.mock.calls.length, 1)
      assert.deepStrictEqual(mockClient.zRangeWithScores.mock.calls[0], [
        'lb:song:song1',
        0,
        1,
        { REV: true }
      ])

      assert.strictEqual(mockClient.hmGet.mock.calls.length, 1)
      assert.deepStrictEqual(mockClient.hmGet.mock.calls[0], [
        'players',
        ['player1', 'player2']
      ])

      assert.strictEqual(res.status.mock.calls[0][0], 200)
      assert.deepStrictEqual(res.json.mock.calls[0][0], [
        { rank: 1, playerId: 'player1', playerName: 'Player One', score: 1000 },
        { rank: 2, playerId: 'player2', playerName: 'Player Two', score: 500 }
      ])
    })

    test('handles missing player names fallback to Unknown', async () => {
      mockClient.zRangeWithScores.mockImplementationOnce(async () => [
        { score: 1000, value: 'player1' }
      ])

      mockClient.hmGet.mockImplementationOnce(async () => [null])

      const req = {
        method: 'GET',
        query: { songId: 'song1' }
      }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.status.mock.calls[0][0], 200)
      assert.deepStrictEqual(res.json.mock.calls[0][0], [
        { rank: 1, playerId: 'player1', playerName: 'Unknown', score: 1000 }
      ])
    })

    test('internal server error returns 500 for GET', async () => {
      mockClient.zRangeWithScores.mockImplementationOnce(() => {
        return Promise.reject(new Error('Redis down'))
      })

      const req = {
        method: 'GET',
        query: { songId: 'song1' }
      }
      const res = createRes()

      // Silence console.error for this test
      const originalConsoleError = console.error
      console.error = () => {}

      try {
        await handler(req, res)
      } finally {
        console.error = originalConsoleError
      }

      assert.strictEqual(res.status.mock.calls[0][0], 500)
      assert.deepStrictEqual(res.json.mock.calls[0][0], {
        error: 'Internal Server Error'
      })
    })
  })

  describe('Other methods', () => {
    test('PUT returns 405 Method Not Allowed', async () => {
      const req = { method: 'PUT' }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(res.setHeader.mock.calls.length, 1)
      assert.deepStrictEqual(res.setHeader.mock.calls[0], [
        'Allow',
        ['GET', 'POST']
      ])

      assert.strictEqual(res.status.mock.calls[0][0], 405)
      assert.strictEqual(res.end.mock.calls.length, 1)
      assert.deepStrictEqual(res.end.mock.calls[0], ['Method PUT Not Allowed'])
    })
  })

  describe('Connection handling', () => {
    test('connects to redis if not open', async () => {
      mockClient.isOpen = false
      mockClient.zRangeWithScores.mockImplementationOnce(async () => [])

      const req = { method: 'GET', query: { songId: 'song1' } }
      const res = createRes()

      await handler(req, res)

      assert.strictEqual(mockClient.connect.mock.calls.length, 1)
    })
  })
})
// 🟢🧪⚙️ NEXUS TEST ARTIFACT END 🟢🧪⚙️
