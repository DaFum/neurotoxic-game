import sharedClient from '../../lib/redis.js'
import {
  createRedisRequest,
  withRedisDeadline
} from '../../lib/redisDeadline.js'
import { hasPrototypePollution } from '../../lib/apiUtils.js'
import { MAX_PUBLISHED_BALANCE } from '../../lib/leaderboardLimits.js'
import {
  connectRedisRequest,
  isLeaderboardWriteRateLimited
} from '../../lib/apiMiddleware.js'
import {
  parseLeaderboardLimit,
  validateLeaderboardPlayer,
  fetchLeaderboard
} from '../../lib/leaderboard.js'

const MAX_STAT_VALUE = 999999999999 // reasonable max for followers/fame

/**
 * @typedef {{
 *   statKey: string,
 *   boardKey: string,
 *   getValue: (body: Record<string, unknown>) => number
 * }} BoardDefinition
 */

/**
 * Ordered definition of boards, mapping stat key to Redis sorted set key and
 * value extractor.
 * @type {BoardDefinition[]}
 */
export const BOARD_DEFINITIONS = [
  {
    statKey: 'balance',
    boardKey: 'lb:balance',
    getValue: (/** @type {Record<string, unknown>} */ body) =>
      Math.min(Number(body.money), MAX_PUBLISHED_BALANCE)
  },
  {
    statKey: 'fame',
    boardKey: 'lb:fame',
    getValue: (/** @type {Record<string, unknown>} */ body) =>
      clampStat(body.fame)
  },
  {
    statKey: 'followers',
    boardKey: 'lb:followers',
    getValue: (/** @type {Record<string, unknown>} */ body) =>
      clampStat(body.followers)
  },
  {
    statKey: 'distance',
    boardKey: 'lb:distance',
    getValue: (/** @type {Record<string, unknown>} */ body) =>
      clampStat(body.distance)
  },
  {
    statKey: 'conflicts',
    boardKey: 'lb:conflicts',
    getValue: (/** @type {Record<string, unknown>} */ body) =>
      clampStat(body.conflicts)
  },
  {
    statKey: 'stage_dives',
    boardKey: 'lb:stage_dives',
    getValue: (/** @type {Record<string, unknown>} */ body) =>
      clampStat(body.stageDives)
  }
]

const VALID_STATS = BOARD_DEFINITIONS.map(d => d.statKey)

// Applies a snapshot only when its revision is newer than the stored one, and
// writes the display name and every board in the same atomic step. KEYS[1] is
// the revision hash, KEYS[2] the player-name hash, KEYS[3..] the sorted sets;
// ARGV[1] is the player id, ARGV[2] the revision, ARGV[3] the name and ARGV[4..]
// the scores in board order. Returns { applied, stored revision }: 1 when
// applied, 0 when stale (the stored revision lets the client catch up).
export const WRITE_IF_NEWER_SCRIPT = `
local current = tonumber(redis.call('HGET', KEYS[1], ARGV[1])) or 0
if tonumber(ARGV[2]) <= current then return {0, current} end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('HSET', KEYS[2], ARGV[1], ARGV[3])
for i = 3, #KEYS do redis.call('ZADD', KEYS[i], ARGV[i + 1], ARGV[1]) end
return {1, tonumber(ARGV[2])}`

// The unversioned counterpart: last-write-wins for a player who never sent a
// revision, but refused outright once one is stored, so an old client cannot
// roll a revision-protected player back. Same key order as the versioned script
// without the revision argument: KEYS[1] revision hash, KEYS[2] players, KEYS[3..]
// sorted sets; ARGV[1] player id, ARGV[2] name, ARGV[3..] scores. Never writes
// `lb:revision`, so such a player stays last-write-wins. HEXISTS rather than a
// numeric check: "was ever versioned" is the boundary, a malformed stored value
// must not reopen it. Returns { applied, stored revision } like the versioned one.
export const WRITE_IF_UNVERSIONED_SCRIPT = `
if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 1 then
  return {0, tonumber(redis.call('HGET', KEYS[1], ARGV[1])) or 0}
end
redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])
for i = 3, #KEYS do redis.call('ZADD', KEYS[i], ARGV[i], ARGV[1]) end
return {1, 0}`

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
    /** @type {ReturnType<typeof createRedisRequest> | undefined} */
    let redisRequest
    try {
      redisRequest = createRedisRequest(sharedClient)
      const client = redisRequest.client
      await connectRedisRequest(redisRequest)

      if (await isLeaderboardWriteRateLimited(req, 'stats', client)) {
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
      const { playerId, playerName, money, revision } = body

      // Basic Type Checks
      if (
        typeof playerId !== 'string' ||
        typeof playerName !== 'string' ||
        typeof money !== 'number'
      ) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Detailed Validation
      if (!Number.isFinite(money) || money < 0) {
        return res.status(400).json({ error: 'Invalid money value' })
      }

      const player = validateLeaderboardPlayer(playerId, playerName)
      if ('error' in player) {
        return res.status(400).json(player)
      }

      // An optional monotonic snapshot revision lets the server drop a request
      // that was overtaken in flight. Clients without one keep last-write-wins
      // until the player has stored a revision, after which they are refused.
      const hasRevision = revision !== undefined
      if (
        hasRevision &&
        !(
          typeof revision === 'number' &&
          Number.isSafeInteger(revision) &&
          revision > 0 &&
          // The client treats MAX_SAFE_INTEGER as exhausted and could never
          // send a newer revision after it (readStoredRevision).
          revision < Number.MAX_SAFE_INTEGER
        )
      ) {
        return res.status(400).json({ error: 'Invalid revision' })
      }

      // Derive scores and boardKeys from the single ordered board-to-payload definition
      const scores = BOARD_DEFINITIONS.map(d => String(d.getValue(body)))
      // NOTE: intentionally no GT flag in either script, unlike song.js. These
      // boards track the player's CURRENT stats, and money legitimately
      // decreases, so GT would silently redefine lb:balance as "peak balance
      // ever". That is a gameplay decision, not a security fix. The
      // write-authorization weakness (playerId is a client-generated
      // localStorage UUID and the only credential) is mitigated by no longer
      // publishing it in GET responses; closing it properly needs real auth and
      // is out of scope.
      const boardKeys = BOARD_DEFINITIONS.map(d => d.boardKey)
      const result = hasRevision
        ? await withRedisDeadline(client, () =>
            client.eval(WRITE_IF_NEWER_SCRIPT, {
              keys: ['lb:revision', 'players', ...boardKeys],
              arguments: [
                playerId,
                String(revision),
                String(player.playerName),
                ...scores
              ]
            })
          )
        : await withRedisDeadline(client, () =>
            client.eval(WRITE_IF_UNVERSIONED_SCRIPT, {
              keys: ['lb:revision', 'players', ...boardKeys],
              arguments: [playerId, String(player.playerName), ...scores]
            })
          )
      const reply = Array.isArray(result) ? result : []
      if (Number(reply[0]) !== 1) {
        // Not an error: a newer snapshot already landed (or, for an unversioned
        // request, the player is revision-protected). The stored revision lets a
        // client whose own sequence fell behind catch up.
        return res
          .status(200)
          .json({ success: true, stale: true, revision: Number(reply[1]) })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Stats update error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    } finally {
      redisRequest?.close()
    }
  } else if (req.method === 'GET') {
    /** @type {ReturnType<typeof createRedisRequest> | undefined} */
    let redisRequest
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

      redisRequest = createRedisRequest(sharedClient)
      const client = redisRequest.client
      await connectRedisRequest(redisRequest)

      const leaderboard = await fetchLeaderboard(`lb:${stat}`, limit, client)

      return res.status(200).json(leaderboard)
    } catch (error) {
      console.error('Stats fetch error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    } finally {
      redisRequest?.close()
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method Not Allowed' })
}
