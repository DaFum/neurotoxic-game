import process from 'process'

/**
 * Extracts and normalizes the client IP address from a request.
 * Handles x-forwarded-for lists and falls back to socket remoteAddress.
 *
 * SECURITY: Only trusts x-forwarded-for or x-real-ip if TRUST_PROXY environment variable is 'true'.
 * When TRUST_PROXY is enabled, it uses the last IP in the x-forwarded-for chain to prevent spoofing.
 *
 * @param {Object} req - The incoming HTTP request.
 * @returns {string} The normalized IP address or 'unknown'.
 */
export function normalizeIp(req) {
  const remoteAddress = req.socket?.remoteAddress || 'unknown'

  // If not behind a trusted proxy, ignore all forwarding headers
  if (process.env.TRUST_PROXY !== 'true') {
    return remoteAddress
  }

  // Check x-real-ip first (often set by single-hop proxies like Nginx)
  const realIp = req.headers?.['x-real-ip']
  if (realIp && typeof realIp === 'string') {
    return realIp.trim()
  }

  let forwarded = req.headers?.['x-forwarded-for']
  if (forwarded) {
    if (Array.isArray(forwarded)) {
      forwarded = forwarded.join(',')
    }

    if (typeof forwarded === 'string') {
      const ips = forwarded
        .split(',')
        .map(ip => ip.trim())
        .filter(Boolean)
      if (ips.length > 0) {
        // Use the LAST IP in the list.
        // In X-Forwarded-For: client, proxy1, proxy2
        // proxy2 is the one that reached our trusted immediate proxy.
        // If we only trust one hop, proxy2 is the most reliable "client" we can see.
        return ips[ips.length - 1]
      }
    }
  }

  return remoteAddress
}

/**
 * Recursively checks if an object or array contains keys that could lead to prototype pollution.
 * @param {any} input - The input to check.
 * @param {Set<any>} [visited=new Set()] - Set of visited objects to prevent circular references.
 * @param {number} [depth=0] - The current recursion depth.
 * @returns {boolean} True if prototype pollution is detected.
 */
export function hasPrototypePollution(input, visited = new Set(), depth = 0) {
  if (depth > 100) {
    return true
  }

  if (!input || typeof input !== 'object') {
    return false
  }

  if (visited.has(input)) {
    return false
  }
  visited.add(input)

  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      if (hasPrototypePollution(input[i], visited, depth + 1)) {
        return true
      }
    }
    return false
  }

  const keys = Reflect.ownKeys(input)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true
    }

    if (hasPrototypePollution(input[key], visited, depth + 1)) {
      return true
    }
  }

  return false
}
