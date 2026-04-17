import client from '../../lib/redis.js'
import { normalizeIp, hasPrototypePollution } from '../../lib/apiUtils.js'

const VALID_STATS = [
  'balance',
  'fame',
  'followers',
  'distance',
  'conflicts',
  'stage_dives'
]
const MAX_STAT_VALUE = 999999999999 // reasonable max for followers/fame

const clampStat = val => {
  if (!Number.isFinite(val)) return 0
  return Math.min(Math.max(0, val), MAX_STAT_VALUE)
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      if (!client.isOpen) {
        await client.connect()
      }

      // Rate Limiting (5 requests per 60s)
      const ip = normalizeIp(req)
      const rateLimitKey = `rate_limit:stats:${ip}`
      const requests = await client.incr(rateLimitKey)
      if (requests === 1) {
        await client.expire(rateLimitKey, 60)
      }
      if (requests > 5) {
        return res.status(429).json({ error: 'Too many requests' })
      }

      if (
        !req.body ||
        typeof req.body !== 'object' ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Anti-Tamper / Prototype Pollution Check
      if (hasPrototypePollution(req.body)) {
        return res.status(400).json({ error: 'Invalid payload structure' })
      }

      const {
        playerId,
        playerName,
        money,
        fame,
        followers,
        distance,
        conflicts,
        stageDives
      } = req.body

      // Basic Type Checks
      if (
        typeof playerId !== 'string' ||
        typeof playerName !== 'string' ||
        typeof money !== 'number'
      ) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Detailed Validation
      if (!Number.isFinite(money) || money < 0 || money > 10000000) {
        return res.status(400).json({ error: 'Invalid money value' })
      }

      if (playerName.length > 100) {
        return res.status(400).json({ error: 'Invalid playerName length' })
      }

      const trimmedName = playerName.trim()
      if (trimmedName.length < 1) {
        return res.status(400).json({ error: 'Invalid playerName length' })
      }

      // Basic sanitization/validation for playerId key
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(playerId)) {
        return res.status(400).json({ error: 'Invalid playerId format' })
      }

      // Safe numbers for stats (clamped 0 to MAX)
      const safeFame = clampStat(fame)
      const safeFollowers = clampStat(followers)
      const safeDistance = clampStat(distance)
      const safeConflicts = clampStat(conflicts)
      const safeStageDives = clampStat(stageDives)

      // v4: hSet accepts object
      await client.hSet('players', { [playerId]: trimmedName })

      // v4: zAdd(key, { score, value })
      // Update multiple sorted sets
      const multi = client.multi()
      multi.zAdd('lb:balance', { score: money, value: playerId })
      multi.zAdd('lb:fame', { score: safeFame, value: playerId })
      multi.zAdd('lb:followers', { score: safeFollowers, value: playerId })
      multi.zAdd('lb:distance', { score: safeDistance, value: playerId })
      multi.zAdd('lb:conflicts', { score: safeConflicts, value: playerId })
      multi.zAdd('lb:stage_dives', { score: safeStageDives, value: playerId })

      await multi.exec()

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Stats update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      let limit = parseInt(req.query.limit, 10)
      if (isNaN(limit)) limit = 100
      limit = Math.min(Math.max(1, limit), 100)

      const stat = req.query.stat || 'balance'
      if (!VALID_STATS.includes(stat)) {
        return res.status(400).json({ error: 'Invalid stat requested' })
      }

      if (!client.isOpen) {
        await client.connect()
      }

      const sortedSetKey = `lb:${stat}`

      // v4: zRangeWithScores returns [{ score: number, value: string }]
      // REV: true for descending
      const range = await client.zRangeWithScores(sortedSetKey, 0, limit - 1, {
        REV: true
      })

      if (!range.length) return res.status(200).json([])

      // range is [{ value: 'id', score: 100 }, ...]
      const len = range.length
      const playerIds = new Array(len)
      for (let i = 0; i < len; i++) {
        playerIds[i] = range[i].value
      }

      // v4: hmGet returns string[] (aligned with keys)
      const names = await client.hmGet('players', playerIds)

      // hmGet returns array of values corresponding to keys
      const leaderboard = new Array(len)
      for (let i = 0; i < len; i++) {
        leaderboard[i] = {
          rank: i + 1,
          playerId: playerIds[i], // 'value' not 'member' in node-redis v4
          playerName: names[i] || 'Unknown',
          score: range[i].score
        }
      }

      return res.status(200).json(leaderboard)
    } catch (error) {
      console.error('Stats fetch error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
