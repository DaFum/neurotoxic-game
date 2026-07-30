import client from '../../lib/redis.js'
import {
  normalizeIp,
  hasPrototypePollution,
  sanitizePlayerName,
  toPublicPlayerRef
} from '../../lib/apiUtils.js'
import { resolveLeaderboardId } from '../../lib/leaderboardSongIds.js'

const MAX_SONG_ID_LENGTH = 64

/**
 * Handles score submissions and leaderboard requests for songs.
 *
 * POST requests validate and store player scores, retaining only higher scores.
 * GET requests return ranked leaderboard entries with public player references and names.
 * Other methods receive a 405 response.
 *
 * @param {import('../../lib/apiTypes.js').ApiRequest} req - The HTTP request.
 * @param {import('../../lib/apiTypes.js').ApiResponse} res - The HTTP response.
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Ensure connection
      if (!client.isOpen) {
        await client.connect()
      }

      // Rate Limiting (5 requests per 60s)
      const ip = normalizeIp(req)
      const rateLimitKey = `rate_limit:song:${ip}`
      const requests = await client.incr(rateLimitKey)
      if (requests === 1) {
        await client.expire(rateLimitKey, 60)
      }
      if (requests > 5) {
        return res.status(429).json({ error: 'Too many requests' })
      }

      // Anti-Tamper / Prototype Pollution Check
      if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
      ) {
        return res
          .status(400)
          .json({ error: 'Invalid payload structure: expected object' })
      }
      if (hasPrototypePollution(req.body)) {
        return res.status(400).json({ error: 'Invalid payload structure' })
      }

      const body = /** @type {Record<string, unknown>} */ (req.body)
      const { playerId, playerName, songId, score, scores } = body

      // Basic Type Checks
      if (typeof playerId !== 'string' || typeof playerName !== 'string') {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const hasSingle = typeof songId === 'string' && typeof score === 'number'
      const hasScores = Array.isArray(scores)

      if (!hasSingle && !hasScores) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Length-validate the sanitized/trimmed name (what actually gets
      // persisted), not the raw input, so the bound applies to the stored value.
      const trimmedName = sanitizePlayerName(playerName).trim()
      if (trimmedName.length < 1 || trimmedName.length > 100) {
        return res.status(400).json({ error: 'Invalid playerName length' })
      }

      // Validation for keys
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(playerId)) {
        return res.status(400).json({ error: 'Invalid playerId format' })
      }

      /** @type {unknown[]} */
      const itemsToProcess = hasScores ? scores : [{ songId, score }]

      if (itemsToProcess.length === 0) {
        return res.status(400).json({ error: 'No scores provided' })
      }
      if (itemsToProcess.length > 100) {
        return res
          .status(400)
          .json({ error: 'Batch size exceeds limit of 100' })
      }

      // Validate all items before processing
      /** @type {Array<{ songId: string, score: number }>} */
      const validatedItems = []
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i]
        if (!item || typeof item !== 'object') {
          return res.status(400).json({ error: 'Invalid score item' })
        }
        const scoreItem = /** @type {Record<string, unknown>} */ (item)
        if (
          typeof scoreItem.songId !== 'string' ||
          typeof scoreItem.score !== 'number'
        ) {
          return res.status(400).json({ error: 'Missing required fields' })
        }
        if (
          !Number.isFinite(scoreItem.score) ||
          scoreItem.score < 0 ||
          scoreItem.score > 10000000
        ) {
          return res.status(400).json({ error: 'Invalid score value' })
        }
        if (
          !/^[a-zA-Z0-9_-]+$/.test(scoreItem.songId) ||
          scoreItem.songId.length > MAX_SONG_ID_LENGTH
        ) {
          return res.status(400).json({ error: 'Invalid songId format' })
        }
        const leaderboardId = resolveLeaderboardId(scoreItem.songId)
        if (!leaderboardId) {
          return res.status(400).json({ error: 'Unknown songId' })
        }
        validatedItems.push({ songId: leaderboardId, score: scoreItem.score })
      }

      // v4: hSet accepts object
      await client.hSet('players', { [playerId]: trimmedName })

      const multi = client.multi()
      for (const item of validatedItems) {
        multi.zAdd(
          `lb:song:${item.songId}`,
          { score: item.score, value: playerId },
          { GT: true }
        )
      }
      await multi.exec()

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Song score update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      const songId = req.query?.songId
      if (songId === undefined || songId === '') {
        return res.status(400).json({ error: 'Missing songId' })
      }

      if (
        typeof songId !== 'string' ||
        !/^[a-zA-Z0-9_-]+$/.test(songId) ||
        songId.length > MAX_SONG_ID_LENGTH
      ) {
        return res.status(400).json({ error: 'Invalid songId format' })
      }
      const leaderboardId = resolveLeaderboardId(songId)
      if (!leaderboardId) {
        return res.status(400).json({ error: 'Unknown songId' })
      }

      const limitParam = req.query?.limit
      let limit =
        typeof limitParam === 'string'
          ? Number.parseInt(limitParam, 10)
          : Number.NaN
      if (Number.isNaN(limit)) limit = 100
      limit = Math.min(Math.max(1, limit), 100)

      // Ensure connection
      if (!client.isOpen) {
        await client.connect()
      }

      // v4: zRangeWithScores(key, min, max, options)
      const range = await client.zRangeWithScores(
        `lb:song:${leaderboardId}`,
        0,
        limit - 1,
        {
          REV: true
        }
      )

      if (!range.length) return res.status(200).json([])

      const playerIds = range.map(r => r.value) // value not member
      const names = await client.hmGet('players', playerIds)

      // playerId is the write credential and the raw Redis member key — never
      // publish it. See toPublicPlayerRef.
      const leaderboard = range.map((entry, index) => ({
        rank: index + 1,
        playerRef: toPublicPlayerRef(entry.value),
        playerName: names[index] || 'Unknown',
        score: entry.score
      }))

      return res.status(200).json(leaderboard)
    } catch (error) {
      console.error('Song leaderboard fetch error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
