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
 * Increments the bucket and sets or repairs its expiry in one step, so a
 * counter can never exist without a TTL. Returns the new count.
 */
export const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('TTL', KEYS[1]) < 0 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
return count
`

/**
 * Counts a submission against the endpoint's five-request, sixty-second bucket.
 * The caller connects Redis before invoking this helper.
 * @param {import('./apiTypes.js').ApiRequest} req
 * @param {'song' | 'stats'} endpoint
 * @returns {Promise<boolean>}
 */
export async function isLeaderboardRateLimited(req, endpoint) {
  const rateLimitKey = `rate_limit:${endpoint}:${normalizeIp(req)}`
  const requests = await client.eval(RATE_LIMIT_SCRIPT, {
    keys: [rateLimitKey],
    arguments: ['60']
  })
  return Number(requests) > 5
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
