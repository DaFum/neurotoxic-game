/**
 * Extracts and normalizes the client IP address from a request.
 * Handles x-forwarded-for lists and falls back to socket remoteAddress.
 *
 * NOTE: x-forwarded-for is only trusted if process.env.TRUST_PROXY is set to 'true'.
 *
 * @param {Object} req - The incoming HTTP request.
 * @returns {string} The normalized IP address or 'unknown'.
 */
export function normalizeIp(req) {
  const trustProxy = process.env.TRUST_PROXY === 'true'
  const forwarded = req.headers?.['x-forwarded-for']

  if (trustProxy && forwarded) {
    let forwardedStr = forwarded
    // Some environments pass this as an array
    if (Array.isArray(forwarded)) {
      forwardedStr = forwarded.join(',')
    }
    // x-forwarded-for can be a comma-separated list of IPs.
    // The first IP is the original client.
    const ips = typeof forwardedStr === 'string' ? forwardedStr.split(',') : []
    for (const ip of ips) {
      const trimmed = ip.trim()
      if (trimmed) {
        return trimmed
      }
    }
  }

  return req.socket?.remoteAddress || 'unknown'
}
