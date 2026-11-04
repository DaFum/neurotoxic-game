import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createApiRouteMocks } from '../utils/apiRouteMocks.js'
import {
  isLeaderboardRateLimited,
  RATE_LIMIT_SCRIPT
} from '../../lib/leaderboard.js'

const client = vi.hoisted(() => ({
  duplicate() {
    return { ...client, on: vi.fn(), destroy: vi.fn() }
  },
  isOpen: true,
  connect: vi.fn(),
  eval: vi.fn()
}))
vi.mock('../../lib/redis.js', () => ({ default: client }))
const secret = 'sk_image_test_secret'
const fetchMock = vi.fn()
let handler

beforeEach(async () => {
  vi.resetAllMocks()
  client.isOpen = true
  client.eval.mockResolvedValue(1)
  vi.stubEnv('Flux', ` ${secret} `)
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(
    new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'Content-Type': 'image/png' }
    })
  )
  handler = (await import('../../api/image.js')).default
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
const request = async (
  query = { prompt: 'metal & pixel art' },
  method = 'GET'
) => {
  const { req, res } = createApiRouteMocks({ method, query })
  await handler({ ...req, socket: { remoteAddress: '127.0.0.1' } }, res)
  return res
}

describe('protected image proxy', () => {
  test('rejects unsupported methods before configuration checks', async () => {
    const res = await request(undefined, 'POST')
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET'])
    expect(fetchMock).not.toHaveBeenCalled()
  })
  test.each([undefined, '', '  '])('missing key %j fails closed', async key => {
    vi.stubEnv('Flux', key)
    const res = await request()
    expect(res.status).toHaveBeenCalledWith(503)
    expect(client.eval).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
  test.each([
    {},
    { prompt: '' },
    { prompt: '  ' },
    { prompt: ['one', 'two'] },
    { prompt: 'a'.repeat(1025) },
    ...['', 'NaN', 'Infinity', '1.2', '0', '2049', ['512']].flatMap(value => [
      { prompt: 'test', width: value },
      { prompt: 'test', height: value }
    ])
  ])('invalid query %j returns 400', async query => {
    const res = await request(query)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  test('budget allows the hundredth image and blocks the next', async () => {
    client.eval.mockResolvedValueOnce(100).mockResolvedValueOnce(101)
    expect((await request()).status).toHaveBeenCalledWith(200)
    expect((await request()).status).toHaveBeenCalledWith(429)
    expect(client.eval).toHaveBeenCalledWith(RATE_LIMIT_SCRIPT, {
      keys: ['rate_limit:image:127.0.0.1'],
      arguments: ['60']
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  test.each(['connect', 'eval'])(
    'Redis %s failure returns 503 without leaking errors',
    async operation => {
      client.isOpen = operation !== 'connect'
      client[operation].mockRejectedValue(new Error(secret))
      const res = await request()
      expect(res.status).toHaveBeenCalledWith(503)
      expect(JSON.stringify(res.json.mock.calls)).not.toContain(secret)
      expect(fetchMock).not.toHaveBeenCalled()
    }
  )
  test.each(['connect', 'eval'])(
    'Redis %s timeout returns 503 and does not start an upstream request',
    async operation => {
      vi.useFakeTimers()
      try {
        client.isOpen = operation !== 'connect'
        const isolated = {
          ...client,
          on: vi.fn(),
          destroy: vi.fn(),
          connect: vi.fn().mockResolvedValue(undefined),
          eval: vi.fn().mockResolvedValue(1)
        }
        vi.spyOn(client, 'duplicate').mockReturnValue(isolated)
        isolated[operation].mockReturnValue(new Promise(() => {}))
        const response = request()
        await vi.advanceTimersByTimeAsync(60000)
        const res = await response
        expect(res.status).toHaveBeenCalledWith(503)
        expect(res.json).toHaveBeenCalledWith({
          error: 'Image generation unavailable'
        })
        expect(fetchMock).not.toHaveBeenCalled()
        expect(isolated.destroy).toHaveBeenCalledTimes(1)
        expect(client.eval).not.toHaveBeenCalled()
        expect(isolated[operation]).toHaveBeenCalledTimes(1)
        expect(vi.getTimerCount()).toBe(0)
      } finally {
        vi.useRealTimers()
      }
    }
  )
  test('clears the Redis deadline after a rate-limit decision', async () => {
    vi.useFakeTimers()
    try {
      client.eval.mockResolvedValue(101)
      expect((await request()).status).toHaveBeenCalledWith(429)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
  test('does not start rate limiting after a timed-out connection eventually opens', async () => {
    vi.useFakeTimers()
    try {
      const connection = Promise.withResolvers()
      client.isOpen = false
      client.connect.mockReturnValue(connection.promise)
      const response = request()
      await vi.advanceTimersByTimeAsync(60000)
      expect((await response).status).toHaveBeenCalledWith(503)
      connection.resolve()
      await Promise.resolve()
      expect(client.eval).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
  test.each([401, 402, 429, 500])(
    'upstream %i returns generic 502 and never leaks credentials',
    async status => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      fetchMock.mockResolvedValue(
        new Response(secret, {
          status,
          headers: { 'Content-Type': 'text/plain' }
        })
      )
      const res = await request()
      expect(res.status).toHaveBeenCalledWith(502)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Image generation unavailable'
      })
      expect(
        JSON.stringify([res.json.mock.calls, log.mock.calls])
      ).not.toContain(secret)
      expect(res.end).not.toHaveBeenCalled()
    }
  )
  test('relays only image bytes and authenticates only through a header', async () => {
    const res = await request({
      prompt: 'metal & pixel art',
      width: '512',
      height: '768'
    })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'https://gen.pollinations.ai/image/metal%20%26%20pixel%20art?model=flux&seed=666&width=512&height=768&='
    )
    expect(url).not.toContain(secret)
    expect(url).not.toContain('key=')
    expect(options.headers).toEqual({ Authorization: `Bearer ${secret}` })
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png')
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff'
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=2592000, immutable'
    )
    expect(res.end).toHaveBeenCalledWith(Buffer.from([1, 2, 3]))
  })
  test.each(['text/html', 'application/json'])(
    'rejects upstream content type %s',
    async contentType => {
      fetchMock.mockResolvedValue(
        new Response(secret, { headers: { 'Content-Type': contentType } })
      )
      expect((await request()).status).toHaveBeenCalledWith(502)
    }
  )
  test('rejects oversized bodies even without a content-length header', async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array(10 * 1024 * 1024 + 1), {
        headers: { 'Content-Type': 'image/png' }
      })
    )
    expect((await request()).status).toHaveBeenCalledWith(502)
  })
  test('upstream timeout aborts and returns a generic error', async () => {
    vi.useFakeTimers()
    try {
      fetchMock.mockImplementation(
        (_url, { signal }) =>
          new Promise((_resolve, reject) =>
            signal.addEventListener('abort', () => reject(new Error(secret)))
          )
      )
      const response = request()
      await vi.advanceTimersByTimeAsync(60000)
      expect((await response).status).toHaveBeenCalledWith(502)
    } finally {
      vi.useRealTimers()
    }
  })
})

test('shared limiter preserves leaderboard defaults and accepts image budgets', async () => {
  client.eval.mockResolvedValue(6)
  expect(await isLeaderboardRateLimited({}, 'song')).toBe(true)
  expect(client.eval.mock.lastCall[1].arguments).toEqual(['60'])
  expect(await isLeaderboardRateLimited({}, 'image', 100, 120)).toBe(false)
  expect(client.eval.mock.lastCall[1].arguments).toEqual(['120'])
})
