import { withRedisDeadline } from './redisDeadline.js'
import { isLeaderboardRateLimited } from './leaderboard.js'

/**
 * Opens a request's private Redis client unless it is already open, bounded by
 * the shared Redis deadline.
 *
 * @remarks
 * Rejects on a connect failure or deadline; the caller still owns `close()`.
 * `api/image.js` does not use this: its connect and rate-limit check share one
 * longer deadline instead of one `REDIS_DEADLINE_MS` each.
 *
 * @param {ReturnType<typeof import('./redisDeadline.js').createRedisRequest>} redisRequest
 * @returns {Promise<void>}
 */
export async function connectRedisRequest(redisRequest) {
  const client = redisRequest.client
  if (!client.isOpen) {
    await withRedisDeadline(client, () => redisRequest.connect())
  }
}

/**
 * Counts a leaderboard write against its five-per-sixty-seconds bucket, bounded
 * by the shared Redis deadline. The caller connects `client` first.
 *
 * @param {import('./apiTypes.js').ApiRequest} req
 * @param {'song' | 'stats'} endpoint
 * @param {typeof import('./redis.js').default} client
 * @returns {Promise<boolean>} Whether the request is over budget.
 */
export function isLeaderboardWriteRateLimited(req, endpoint, client) {
  return withRedisDeadline(client, () =>
    isLeaderboardRateLimited(req, endpoint, 5, 60, client)
  )
}
