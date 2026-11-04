/** Maximum time to wait for a Redis connection or command response. */
export const REDIS_DEADLINE_MS = 1000

// Bound the number of private sockets, including connections still settling.
const MAX_REDIS_REQUESTS = 256
/** @type {WeakMap<object, number>} */
const activeRequests = new WeakMap()

/**
 * Owns a private connection for one request. Destroying it cannot affect other
 * requests. Keep its slot until a pending connection attempt actually settles.
 * @param {typeof import('./redis.js').default} sharedClient
 */
export function createRedisRequest(sharedClient) {
  const count = activeRequests.get(sharedClient) ?? 0
  if (count >= MAX_REDIS_REQUESTS) {
    throw new Error('Redis request capacity exceeded')
  }
  activeRequests.set(sharedClient, count + 1)
  const release = () => {
    const remaining = (activeRequests.get(sharedClient) ?? 1) - 1
    if (remaining === 0) activeRequests.delete(sharedClient)
    else activeRequests.set(sharedClient, remaining)
  }
  let client
  try {
    client = sharedClient.duplicate()
    client.on('error', err => console.error('Redis Client Error', err))
  } catch (error) {
    release()
    throw error
  }
  let closed = false
  let connecting = false
  const destroy = () => {
    try {
      client.destroy()
    } catch (error) {
      console.error('Redis Client Error', error)
    }
  }
  return {
    client,
    connect() {
      connecting = true
      try {
        return client.connect().finally(() => {
          connecting = false
          if (closed) {
            // node-redis can finish connecting after destroy during DNS lookup.
            destroy()
            release()
          }
        })
      } catch (error) {
        connecting = false
        throw error
      }
    },
    close() {
      if (closed) return
      closed = true
      destroy()
      if (!connecting) release()
    }
  }
}

/**
 * Bounds the entire operation, including a command already sent to Redis.
 * @template T
 * @param {{readonly isOpen: boolean, destroy: () => void}} _client
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function withRedisDeadline(_client, operation) {
  let timer
  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Redis deadline exceeded')),
          REDIS_DEADLINE_MS
        )
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}
