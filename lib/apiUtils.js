import { createHash } from 'node:crypto'

/**
 * Determines the client IP address used as the rate-limit bucket key.
 *
 * @remarks
 * SECURITY: forwarding headers are consulted only when `TRUST_PROXY === 'true'`;
 * otherwise the socket address is authoritative and all headers are ignored.
 *
 * Be aware of the precedence: when `TRUST_PROXY` is on, a non-empty `x-real-ip`
 * is returned VERBATIM and short-circuits the `x-forwarded-for` handling below.
 * Only the `x-forwarded-for` path applies the last-hop rule. A client that can
 * reach the origin directly can therefore choose its own rate-limit bucket by
 * sending `x-real-ip`. Deploy behind a proxy that strips or overwrites both
 * headers, or drop the `x-real-ip` branch.
 *
 * @param {import('./apiTypes.js').ApiRequest} req - The incoming HTTP request.
 * @returns {string} The selected IP address, or `'unknown'` when no socket address is available.
 */
export function normalizeIp(req) {
  const remoteAddress = req.socket?.remoteAddress || 'unknown'

  // If not behind a trusted proxy, ignore all forwarding headers
  if (globalThis.process?.env?.TRUST_PROXY !== 'true') {
    return remoteAddress
  }

  // Check x-real-ip first (often set by single-hop proxies like Nginx)
  const realIp = req.headers?.['x-real-ip']
  if (typeof realIp === 'string') {
    const trimmed = realIp.trim()
    if (trimmed) {
      return trimmed
    }
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
        const proxyIp = ips[ips.length - 1]
        if (proxyIp) {
          return proxyIp
        }
      }
    }
  }

  return remoteAddress
}

/**
 * Removes control characters from a player display name before persistence.
 * The stored value is later rendered client-side where React auto-escapes it,
 * so HTML injection is not the concern; this strips C0/C1 control characters,
 * DEL, and Unicode bidirectional formatting characters (LRM/RLM, the
 * embedding/override block, and the isolate block) that would otherwise corrupt
 * or spoof leaderboard display or server logs. Callers must still trim and
 * length-validate the result.
 * @param {string} name - The raw player name. Non-string input yields `''`.
 * @returns {string} The name with control/bidi characters removed.
 */
export function sanitizePlayerName(name) {
  if (typeof name !== 'string') {
    return ''
  }
  let out = ''
  for (const ch of name) {
    const code = ch.codePointAt(0)
    const isControl =
      code === undefined ||
      code <= 0x1f ||
      (code >= 0x7f && code <= 0x9f) ||
      (code >= 0x200e && code <= 0x200f) ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    if (!isControl) {
      out += ch
    }
  }
  return out
}

/**
 * Recursively checks if an object or array contains keys that could lead to prototype pollution.
 * @param {unknown} input - The input to check.
 * @param {Set<object>} [visited=new Set()] - Set of visited objects to prevent circular references.
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
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true
    }

    if (hasPrototypePollution(Reflect.get(input, key), visited, depth + 1)) {
      return true
    }
  }

  return false
}

/**
 * Derives a stable, opaque public reference for a player ID.
 *
 * @remarks
 * SECURITY: `playerId` is a client-generated UUID kept in localStorage, and it
 * is the ONLY authorization a write carries — there is no auth on the write
 * endpoints. Returning it in a public GET response therefore hands every reader
 * the credential needed to rename that player and overwrite their scores, and
 * it exposes the raw Redis sorted-set member key (`api/leaderboard/AGENTS.md`
 * forbids publishing internal storage keys).
 *
 * This derives a one-way reference instead: stable across requests, so it still
 * works as a client-side list key, but useless as a write credential. Do not
 * "simplify" this back to the raw id.
 *
 * @param {unknown} playerId - Internal player identifier.
 * @returns {string} The first 16 hexadecimal characters of the SHA-256 hash, or `'unknown'` for invalid input.
 */
export function toPublicPlayerRef(playerId) {
  if (typeof playerId !== 'string' || playerId.length === 0) return 'unknown'
  return createHash('sha256').update(playerId).digest('hex').slice(0, 16)
}
