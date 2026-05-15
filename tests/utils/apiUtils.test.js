import { test, describe, afterEach } from 'vitest'
import assert from 'node:assert'

describe('normalizeIp', () => {
  const originalEnv = process.env.TRUST_PROXY

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.TRUST_PROXY
    } else {
      process.env.TRUST_PROXY = originalEnv
    }
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

    // Cleanup to prevent test pollution
    delete process.env.TRUST_PROXY
  })
})
