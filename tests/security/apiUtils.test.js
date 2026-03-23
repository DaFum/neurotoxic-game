import { test } from 'node:test'
import assert from 'node:assert'
import { normalizeIp } from '../../lib/apiUtils.js'

test('normalizeIp returns socket remoteAddress when x-forwarded-for is missing', () => {
  const req = {
    headers: {},
    socket: { remoteAddress: '1.2.3.4' }
  }
  assert.strictEqual(normalizeIp(req), '1.2.3.4')
})

test('normalizeIp IGNORES x-forwarded-for when TRUST_PROXY is not true', () => {
  process.env.TRUST_PROXY = 'false'
  const req = {
    headers: { 'x-forwarded-for': '10.0.0.1, 1.2.3.4' },
    socket: { remoteAddress: '1.2.3.4' }
  }
  assert.strictEqual(normalizeIp(req), '1.2.3.4')
  delete process.env.TRUST_PROXY
})

test('normalizeIp RESPECTS x-forwarded-for when TRUST_PROXY is true', () => {
  process.env.TRUST_PROXY = 'true'
  const req = {
    headers: { 'x-forwarded-for': '10.0.0.1, 1.2.3.4' },
    socket: { remoteAddress: '1.2.3.4' }
  }
  assert.strictEqual(normalizeIp(req), '10.0.0.1')
  delete process.env.TRUST_PROXY
})

test('normalizeIp handles x-forwarded-for array when TRUST_PROXY is true', () => {
  process.env.TRUST_PROXY = 'true'
  const req = {
    headers: { 'x-forwarded-for': ['10.0.0.1', '1.2.3.4'] },
    socket: { remoteAddress: '1.2.3.4' }
  }
  assert.strictEqual(normalizeIp(req), '10.0.0.1')
  delete process.env.TRUST_PROXY
})

test('normalizeIp returns unknown if no IP found', () => {
  const req = {
    headers: {},
    socket: {}
  }
  assert.strictEqual(normalizeIp(req), 'unknown')
})
