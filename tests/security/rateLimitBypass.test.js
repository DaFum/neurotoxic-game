import { test, describe, beforeEach, vi, afterEach } from 'vitest'
import assert from 'node:assert'

const mockRedisClient = {
  isOpen: true,
  expire: vi.fn(() => Promise.resolve()),
  // The rate-limit script; the test supplies a per-key counter.
  eval: vi.fn(),
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

    // Reset the rate-limit counter
    let counts = {}
    mockRedisClient.eval.mockImplementation((_script, { keys: [key] }) => {
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
    assert.strictEqual(
      res.status.mock.lastCall[0],
      429,
      'FIX: Rate limit should NOT be bypassed via x-forwarded-for spoofing'
    )
    assert.deepStrictEqual(res.json.mock.lastCall[0], {
      error: 'Too many requests'
    })
  })

  test('VULNERABILITY FIX: Should NOT be able to bypass rate limit via x-real-ip spoofing by default', async () => {
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res)
    }

    // 1. Fill rate limit for real IP 127.0.0.1 while changing x-real-ip on each request
    for (let i = 0; i < 5; i++) {
      const req = {
        method: 'POST',
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'x-real-ip': `10.0.0.${i + 1}` }, // Changing spoofed x-real-ip
        body: { playerId: 'p1', playerName: 'n1', money: 100 }
      }
      await statsHandler(req, res)
      assert.strictEqual(res.status.mock.lastCall[0], 200)
    }

    // 6th request with SAME socket IP but DIFFERENT x-real-ip should be blocked (429)
    const req6 = {
      method: 'POST',
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'x-real-ip': '10.0.0.99' },
      body: { playerId: 'p1', playerName: 'n1', money: 100 }
    }
    await statsHandler(req6, res)
    assert.strictEqual(
      res.status.mock.lastCall[0],
      429,
      'Rate limit should NOT be bypassed via x-real-ip spoofing in default mode'
    )
    assert.deepStrictEqual(res.json.mock.lastCall[0], {
      error: 'Too many requests'
    })
  })

  test('VULNERABILITY FIX: Should not be bypassed by whitespace-only x-real-ip', async () => {
    process.env.TRUST_PROXY = 'true'
    try {
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
    } finally {
      delete process.env.TRUST_PROXY
    }
  })

  test('DEPLOYMENT DEPENDENCY: trusted-mode nonblank x-real-ip takes precedence over x-forwarded-for', async () => {
    process.env.TRUST_PROXY = 'true'
    try {
      const { normalizeIp } = await import('../../lib/apiUtils.js')

      const req = {
        socket: { remoteAddress: '10.0.0.1' },
        headers: {
          'x-real-ip': ' 203.0.113.50 ',
          'x-forwarded-for': '198.51.100.1, 198.51.100.2'
        }
      }

      const ip = normalizeIp(req)
      // Nonblank x-real-ip takes precedence over x-forwarded-for (deployment dependency check)
      assert.strictEqual(ip, '203.0.113.50')
    } finally {
      delete process.env.TRUST_PROXY
    }
  })

  test('DEPLOYMENT DEPENDENCY: trusted-mode different x-real-ip values select different bucket keys', async () => {
    process.env.TRUST_PROXY = 'true'
    try {
      const { normalizeIp } = await import('../../lib/apiUtils.js')

      const req1 = {
        socket: { remoteAddress: '10.0.0.1' },
        headers: { 'x-real-ip': '198.51.100.10' }
      }
      const req2 = {
        socket: { remoteAddress: '10.0.0.1' },
        headers: { 'x-real-ip': '198.51.100.20' }
      }

      const ip1 = normalizeIp(req1)
      const ip2 = normalizeIp(req2)

      assert.strictEqual(ip1, '198.51.100.10')
      assert.strictEqual(ip2, '198.51.100.20')
      assert.notStrictEqual(ip1, ip2)
    } finally {
      delete process.env.TRUST_PROXY
    }
  })
})
