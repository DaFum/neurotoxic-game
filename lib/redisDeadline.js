/** Maximum time to wait for a Redis connection or command response. */
export const REDIS_DEADLINE_MS = 1000

/**
 * Bounds the entire operation, including a command already sent to Redis.
 * @template T
 * @param {{readonly isOpen: boolean, destroy: () => void}} client
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function withRedisDeadline(client, operation) {
  let timer
  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('Redis deadline exceeded'))
          // Flush pending operations; do not leave a dead socket reusable.
          if (client.isOpen) client.destroy()
        }, REDIS_DEADLINE_MS)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}
