import assert from 'node:assert'
import { test, mock } from 'node:test'

// Setup env before mocking/importing anything
process.env.neurotoxic_REDIS_URL = 'redis://mock'

// Mocking the redis client before any imports
mock.module('../../lib/redis.js', {
  defaultExport: {
    isOpen: true,
    connect: async () => {},
    hSet: async () => {},
    zAdd: async () => {},
    on: () => {},
    multi: () => ({
      zAdd: () => {},
      exec: async () => []
    })
  }
})

// Mock import.meta.env
globalThis.__IMPORT_META_ENV__ = {
  VITE_LEADERBOARD_TOKEN: 'test-token-123'
}

import { generateSignature } from '../../src/utils/crypto.js'
const songHandler = (await import('../../api/leaderboard/song.js')).default
const statsHandler = (await import('../../api/leaderboard/stats.js')).default

const SECRET = 'test-token-123'
process.env.LEADERBOARD_TOKEN = SECRET

const createMockRes = () => {
  const res = {
    status: function (code) {
      this.statusCode = code
      return this
    },
    json: function (data) {
      this.body = data
      return this
    },
    end: function () {
      return this
    },
    setHeader: function () {
      return this
    }
  }
  return res
}

test('API endpoints should reject requests without signature', async () => {
  const req = {
    method: 'POST',
    headers: {},
    body: { playerId: 'p1', playerName: 'Player 1', songId: 's1', score: 100 }
  }
  const res = createMockRes()

  await songHandler(req, res)
  assert.strictEqual(res.statusCode, 401)
  assert.strictEqual(res.body.error, 'Missing signature')

  const res2 = createMockRes()
  await statsHandler(req, res2)
  assert.strictEqual(res2.statusCode, 401)
})

test('API endpoints should reject requests with invalid signature', async () => {
  const req = {
    method: 'POST',
    headers: { 'x-lb-signature': 'invalid' },
    body: { playerId: 'p1', playerName: 'Player 1', songId: 's1', score: 100 }
  }
  const res = createMockRes()

  await songHandler(req, res)
  assert.strictEqual(res.statusCode, 403)
  assert.strictEqual(res.body.error, 'Invalid signature')
})

test('API endpoints should accept requests with valid signature', async () => {
  const body = { playerId: 'p1', playerName: 'Player 1', songId: 's1', score: 100 }
  const signature = await generateSignature(JSON.stringify(body), SECRET)

  const req = {
    method: 'POST',
    headers: { 'x-lb-signature': signature },
    body: body
  }
  const res = createMockRes()

  await songHandler(req, res)
  assert.strictEqual(res.statusCode, 200)
  assert.strictEqual(res.body.success, true)
})

test('Stats API endpoint should accept requests with valid signature', async () => {
  const body = {
    playerId: 'p1',
    playerName: 'Player 1',
    money: 100,
    fame: 10,
    followers: 5,
    distance: 2,
    conflicts: 0,
    stageDives: 1
  }
  const signature = await generateSignature(JSON.stringify(body), SECRET)

  const req = {
    method: 'POST',
    headers: { 'x-lb-signature': signature },
    body: body
  }
  const res = createMockRes()

  await statsHandler(req, res)
  assert.strictEqual(res.statusCode, 200)
  assert.strictEqual(res.body.success, true)
})
