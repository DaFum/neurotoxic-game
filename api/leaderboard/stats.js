import client from '../../lib/redis.js'
import { hasPrototypePollution } from '../../lib/apiUtils.js'
import {
  parseLeaderboardLimit,
  isLeaderboardRateLimited,
  validateLeaderboardPlayer,
  fetchLeaderboard
} from '../../lib/leaderboard.js'

const VALID_STATS = [
  'balance',
  'fame',
  'followers',
  'distance',
  'conflicts',
  'stage_dives'
]
const MAX_STAT_VALUE = 999999999999 // reasonable max for followers/fame

/**
 * @param {unknown} val
 * @returns {number}
 */
const clampStat = val => {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0
  return Math.min(Math.max(0, val), MAX_STAT_VALUE)
}

/**
 * Handles leaderboard stat updates and retrieval requests.
 *
 * @remarks
 * GET returns `{ rank, playerRef, playerName, score }`; `playerRef` is an opaque
 * hash, never the raw `playerId` (see `toPublicPlayerRef`). Unlike `song.js`,
 * the POST zAdds deliberately omit the GT flag: these boards track CURRENT
 * stats and money legitimately decreases, so GT would silently redefine
 * `lb:balance` as "peak balance ever".
 *
 * @param {import('../../lib/apiTypes.js').ApiRequest} req - The incoming API request.
 * @param {import('../../lib/apiTypes.js').ApiResponse} res - The response object.
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      if (!client.isOpen) {
        await client.connect()
      }

      if (await isLeaderboardRateLimited(req, 'stats')) {
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

      const body = /** @type {Record<string, unknown>} */ (req.body)
      const {
        playerId,
        playerName,
        money,
        fame,
        followers,
        distance,
        conflicts,
        stageDives
      } = body

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

      const player = validateLeaderboardPlayer(playerId, playerName)
      if ('error' in player) {
        return res.status(400).json(player)
      }

      // Safe numbers for stats (clamped 0 to MAX)
      const safeFame = clampStat(fame)
      const safeFollowers = clampStat(followers)
      const safeDistance = clampStat(distance)
      const safeConflicts = clampStat(conflicts)
      const safeStageDives = clampStat(stageDives)

      // v4: hSet accepts object
      await client.hSet('players', { [playerId]: player.playerName })

      // v4: zAdd(key, { score, value })
      // Update multiple sorted sets
      // NOTE: intentionally no GT flag here, unlike song.js. These boards track
      // the player's CURRENT stats, and money legitimately decreases, so GT
      // would silently redefine lb:balance as "peak balance ever". That is a
      // gameplay decision, not a security fix. The write-authorization weakness
      // (playerId is a client-generated localStorage UUID and the only
      // credential) is mitigated here by no longer publishing it in GET
      // responses; closing it properly needs real auth and is out of scope.
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
      const limit = parseLeaderboardLimit(req.query?.limit)

      const requestedStat = req.query?.stat
      // Treat an empty value the same as absent, matching the pre-hardening
      // `req.query.stat || 'balance'` behavior so `?stat=` still renders the
      // default board instead of 400-ing an older bookmarked client.
      const stat =
        requestedStat === undefined || requestedStat === ''
          ? 'balance'
          : requestedStat
      if (typeof stat !== 'string' || !VALID_STATS.includes(stat)) {
        return res.status(400).json({ error: 'Invalid stat requested' })
      }

      if (!client.isOpen) {
        await client.connect()
      }

      const leaderboard = await fetchLeaderboard(`lb:${stat}`, limit)

      return res.status(200).json(leaderboard)
    } catch (error) {
      console.error('Stats fetch error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
