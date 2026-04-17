/**
 * Extracts and normalizes the client IP address from a request.
 * Handles x-forwarded-for lists and falls back to socket remoteAddress.
 *
 * @param {Object} req - The incoming HTTP request.
 * @returns {string} The normalized IP address or 'unknown'.
 */
export function normalizeIp(req) {
  let forwarded = req.headers?.['x-forwarded-for']
  if (forwarded) {
    // Some environments pass this as an array
    if (Array.isArray(forwarded)) {
      forwarded = forwarded.join(',')
    }
    // x-forwarded-for can be a comma-separated list of IPs.
    // The first IP is the original client.
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : []
    for (const ip of ips) {
      const trimmed = ip.trim()
      if (trimmed) {
        return trimmed
      }
    }
  }

  return req.socket?.remoteAddress || 'unknown'
}

/**
 * Recursively checks if an object or array contains keys that could lead to prototype pollution.
 * @param {any} input - The input to check.
 * @param {Set<any>} [visited=new Set()] - Set of visited objects to prevent circular references.
 * @returns {boolean} True if prototype pollution is detected.
 */
export function hasPrototypePollution(input, visited = new Set()) {
  if (!input || typeof input !== 'object') {
    return false
  }

  if (visited.has(input)) {
    return false
  }
  visited.add(input)

  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      if (hasPrototypePollution(input[i], visited)) {
        return true
      }
    }
    return false
  }

  const keys = Object.keys(input)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true
    }

    if (hasPrototypePollution(input[key], visited)) {
      return true
    }
  }

  // Check for non-enumerable forbidden keys specifically
  if (
    Object.hasOwn(input, '__proto__') ||
    Object.hasOwn(input, 'constructor') ||
    Object.hasOwn(input, 'prototype')
  ) {
    return true
  }

  return false
}
