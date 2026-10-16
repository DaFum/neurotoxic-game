import client from './redis.js'
import {
  normalizeIp,
  sanitizePlayerName,
  toPublicPlayerRef
} from './apiUtils.js'

/**
 * @param {import('./apiTypes.js').ApiQueryValue} limitParam
 * @returns {number}
 */
export function parseLeaderboardLimit(limitParam) {
  let limit =
    typeof limitParam === 'string'
      ? Number.parseInt(limitParam, 10)
      : Number.NaN
  if (Number.isNaN(limit)) limit = 100
  return Math.min(Math.max(1, limit), 100)
}

/**
 * Counts a submission against the endpoint's five-request, sixty-second bucket.
 * The caller connects Redis before invoking this helper.
 * @param {import('./apiTypes.js').ApiRequest} req
 * @param {'song' | 'stats'} endpoint
 * @returns {Promise<boolean>}
 */
export async function isLeaderboardRateLimited(req, endpoint) {
  const rateLimitKey = `rate_limit:${endpoint}:${normalizeIp(req)}`
  const requests = await client.incr(rateLimitKey)
  if (requests === 1) {
    await client.expire(rateLimitKey, 60)
  }
  return requests > 5
}

/**
 * Validates the stored name before the player key, after endpoint-specific checks.
 * @param {string} playerId
 * @param {string} playerName
 * @returns {{ error: string } | { playerName: string }}
 */
export function validateLeaderboardPlayer(playerId, playerName) {
  const trimmedName = sanitizePlayerName(playerName).trim()
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return { error: 'Invalid playerName length' }
  }
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(playerId)) {
    return { error: 'Invalid playerId format' }
  }
  return { playerName: trimmedName }
}

/**
 * Reads ranked entries, keeping raw player IDs private because they authorize writes.
 * The caller validates the board key and connects Redis first.
 * @param {string} sortedSetKey
 * @param {number} limit
 * @returns {Promise<Array<{ rank: number, playerRef: string, playerName: string, score: number }>>}
 */
export async function fetchLeaderboard(sortedSetKey, limit) {
  const range = await client.zRangeWithScores(sortedSetKey, 0, limit - 1, {
    REV: true
  })
  if (!range.length) return []

  const names = await client.hmGet(
    'players',
    range.map(entry => entry.value)
  )
  return range.map((entry, index) => ({
    rank: index + 1,
    playerRef: toPublicPlayerRef(entry.value),
    playerName: names[index] || 'Unknown',
    score: entry.score
  }))
}
