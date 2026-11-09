import process from 'node:process'
import { Buffer } from 'node:buffer'
import sharedClient from '../lib/redis.js'
import { createRedisRequest, withRedisDeadline } from '../lib/redisDeadline.js'
import { connectRedisRequest } from '../lib/apiMiddleware.js'
import { isLeaderboardRateLimited } from '../lib/leaderboard.js'

// Existing catalogue prompts peak below 200 characters; 1024 also accommodates
// composed chassis/repair prompts and future catalogue text without an allowlist.
const MAX_PROMPT_LENGTH = 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const IMAGE_TIMEOUT_MS = 60000

/**
 * @param {import('../lib/apiTypes.js').ApiQueryValue} value
 * @returns {boolean}
 */
function validDimension(value) {
  if (value === undefined) return true
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return false
  const dimension = Number(value)
  return Number.isInteger(dimension) && dimension >= 1 && dimension <= 2048
}

/**
 * Relays deterministic images without exposing the server-only provider key.
 * @param {import('../lib/apiTypes.js').ApiRequest} req
 * @param {import('../lib/apiTypes.js').ApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const key = process.env.Flux?.trim()
  if (!key)
    return res.status(503).json({ error: 'Image generation unavailable' })

  let redisRequest
  try {
    redisRequest = createRedisRequest(sharedClient)
    const client = redisRequest.client
    await connectRedisRequest(redisRequest)
    const limited = await withRedisDeadline(client, () =>
      isLeaderboardRateLimited(req, 'image', 100, 60, client)
    )
    if (limited) return res.status(429).json({ error: 'Too many requests' })
  } catch {
    return res.status(503).json({ error: 'Image generation unavailable' })
  } finally {
    redisRequest?.close()
  }

  const { prompt, width, height } = req.query ?? {}
  if (
    typeof prompt !== 'string' ||
    !prompt.trim() ||
    prompt.length > MAX_PROMPT_LENGTH
  ) {
    return res.status(400).json({ error: 'Invalid prompt' })
  }
  if (!validDimension(width) || !validDimension(height)) {
    return res.status(400).json({ error: 'Invalid image dimensions' })
  }

  const size = `${width === undefined ? '' : `&width=${width}`}${height === undefined ? '' : `&height=${height}`}`
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux&seed=666${size}&=`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS)
  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: controller.signal,
      redirect: 'error'
    })
    const contentType = upstream.headers.get('content-type') ?? ''
    if (!upstream.ok || !contentType.toLowerCase().startsWith('image/')) {
      await upstream.body?.cancel()
      return res.status(502).json({ error: 'Image generation unavailable' })
    }
    const reader = upstream.body?.getReader()
    if (!reader)
      return res.status(502).json({ error: 'Image generation unavailable' })
    const chunks = []
    let length = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_IMAGE_BYTES) {
        await reader.cancel()
        return res.status(502).json({ error: 'Image generation unavailable' })
      }
      chunks.push(Buffer.from(value))
    }
    res.setHeader('Content-Type', contentType)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')
    return res.status(200).end(Buffer.concat(chunks, length))
  } catch {
    return res.status(502).json({ error: 'Image generation unavailable' })
  } finally {
    clearTimeout(timeout)
  }
}
