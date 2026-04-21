import { test, describe, beforeEach, vi } from 'vitest'
import assert from 'node:assert'

const mockRedisClient = {
  isOpen: true,
  incr: vi.fn(() => Promise.resolve(1)),
  expire: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(() => Promise.resolve()),
  connect: vi.fn(() => Promise.resolve()),
  hSet: vi.fn(() => Promise.resolve()),
  zAdd: vi.fn(() => Promise.resolve()),
  multi: vi.fn(() => ({
    zAdd: vi.fn(),
    exec: vi.fn(() => Promise.resolve())
  }))
}

vi.mock('../../lib/redis', () => ({
  default: mockRedisClient
}))

describe('API Prototype Pollution Security Tests', () => {
  let statsHandler
  let songHandler

  beforeEach(async () => {
    // Dynamically import to ensure mocks are applied
    statsHandler = (await import('../../api/leaderboard/stats')).default
    songHandler = (await import('../../api/leaderboard/song')).default
    vi.clearAllMocks()
    mockRedisClient.isOpen = true
  })

  test('Stats API should block nested prototype pollution', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.parse(
        '{ "playerId": "attacker", "playerName": "Attacker", "money": 100, "nested": { "__proto__": { "polluted": true } } }'
      )
    }
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    await statsHandler(req, res)

    // Before fix, this will likely be 200 because the check is shallow
    // After fix, it should be 400
    assert.strictEqual(
      res.status.mock.calls[0][0],
      400,
      'Nested prototype pollution in Stats API should be blocked'
    )
    assert.deepStrictEqual(res.json.mock.calls[0][0], {
      error: 'Invalid payload structure'
    })
  })

  test('Song API should block nested prototype pollution', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'attacker',
        playerName: 'Attacker',
        songId: 'song1',
        score: 100,
        nested: {
          constructor: { prototype: { polluted: true } }
        }
      }
    }
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    await songHandler(req, res)

    assert.strictEqual(
      res.status.mock.calls[0][0],
      400,
      'Nested prototype pollution in Song API should be blocked'
    )
    assert.deepStrictEqual(res.json.mock.calls[0][0], {
      error: 'Invalid payload structure'
    })
  })

  test('Stats API should block prototype pollution inside arrays', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: JSON.parse(
        '{ "playerId": "attacker", "playerName": "Attacker", "money": 100, "items": [ { "id": "valid" }, { "__proto__": { "polluted": true } } ] }'
      )
    }
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    await statsHandler(req, res)

    assert.strictEqual(
      res.status.mock.calls[0][0],
      400,
      'Prototype pollution inside arrays should be blocked'
    )
  })

  test('Stats API should still allow valid shallow payloads', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        playerId: 'valid-id',
        playerName: 'Valid Player',
        money: 100
      }
    }
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    await statsHandler(req, res)
    assert.strictEqual(res.status.mock.calls[0][0], 200)
  })
})
