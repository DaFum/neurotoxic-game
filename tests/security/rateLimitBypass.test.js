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
    mockRedisClient.incr.mockImplementation(key => {
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
  })

  test('FIX VERIFICATION: Should ignore x-forwarded-for when TRUST_PROXY is not enabled', async () => {
    delete process.env.TRUST_PROXY
    const { normalizeIp } = await import('../../lib/apiUtils.js')

    const req = {
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'x-forwarded-for': '1.1.1.1' }
    }

    const ip = normalizeIp(req)
    assert.strictEqual(ip, '127.0.0.1')
  })

  test('FIX VERIFICATION: Should use last IP in x-forwarded-for when TRUST_PROXY is enabled', async () => {
    process.env.TRUST_PROXY = 'true'
    const { normalizeIp } = await import('../../lib/apiUtils.js')

    const req = {
      socket: { remoteAddress: '10.0.0.1' }, // Immediate Proxy IP
      headers: { 'x-forwarded-for': 'client-ip, proxy1-ip' }
    }

    const ip = normalizeIp(req)
    assert.strictEqual(ip, 'proxy1-ip')
  })
})
