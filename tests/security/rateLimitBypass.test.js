import { test, describe, beforeEach, vi, afterEach } from 'vitest'
import assert from 'node:assert'

const mockRedisClient = {
  isOpen: true,
  incr: vi.fn(),
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

describe('Rate Limit Bypass Security Tests', () => {
  let statsHandler
  const originalEnv = process.env.TRUST_PROXY

  beforeEach(async () => {
    // Reset env
    delete process.env.TRUST_PROXY

    statsHandler = (await import('../../api/leaderboard/stats')).default
    vi.clearAllMocks()
    mockRedisClient.isOpen = true

    // Reset incr mock
    let counts = {}
    mockRedisClient.incr.mockImplementation((key) => {
        counts[key] = (counts[key] || 0) + 1
        return Promise.resolve(counts[key])
    })
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.TRUST_PROXY
    } else {
      process.env.TRUST_PROXY = originalEnv
    }
  })

  test('VULNERABILITY FIX: Should NOT be able to bypass rate limit via x-forwarded-for spoofing by default', async () => {
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    // 1. Fill rate limit for real IP 127.0.0.1
    for (let i = 0; i < 5; i++) {
        const req = {
            method: 'POST',
            socket: { remoteAddress: '127.0.0.1' },
            headers: { 'x-forwarded-for': '1.1.1.1' }, // Spoofed
            body: { playerId: 'p1', playerName: 'n1', money: 100 }
        }
        await statsHandler(req, res)
        assert.strictEqual(res.status.mock.lastCall[0], 200)
    }

    // 6th request with SAME real IP but DIFFERENT spoofed IP should be blocked
    const req6 = {
        method: 'POST',
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'x-forwarded-for': '2.2.2.2' }, // Different spoofed IP
        body: { playerId: 'p1', playerName: 'n1', money: 100 }
    }
    await statsHandler(req6, res)
    assert.strictEqual(res.status.mock.lastCall[0], 429, 'FIX: Rate limit should NOT be bypassed via x-forwarded-for spoofing')
    assert.deepStrictEqual(res.json.mock.lastCall[0], { error: 'Too many requests' })
  })

  test('VULNERABILITY FIX: Should not be bypassed by whitespace-only x-real-ip', async () => {
    process.env.TRUST_PROXY = 'true'
    const { normalizeIp } = await import('../../lib/apiUtils.js')

    const req = {
        socket: { remoteAddress: '10.0.0.1' },
        headers: {
            'x-real-ip': '   ',
            'x-forwarded-for': 'client-ip, proxy1-ip'
        }
    }

    const ip = normalizeIp(req)
    // Should fall through to the next source (x-forwarded-for last hop)
    assert.strictEqual(ip, 'proxy1-ip')

    // Cleanup to prevent test pollution
    delete process.env.TRUST_PROXY
  })

})
