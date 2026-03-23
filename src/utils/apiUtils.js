/**
 * Extracts and normalizes the client IP address from a request.
 * Handles x-forwarded-for lists and falls back to socket remoteAddress.
 *
 * @param {Object} req - The incoming HTTP request.
 * @returns {string} The normalized IP address or 'unknown'.
 */
export function normalizeIp(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list of IPs.
    // The first IP is the original client.
    const ips = forwarded.split(',')
    for (const ip of ips) {
      const trimmed = ip.trim()
      if (trimmed) {
        return trimmed
      }
    }
  }

  return req.socket?.remoteAddress || 'unknown'
}
