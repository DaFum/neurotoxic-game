/** Characters that render blank or alter the display/log direction. */
const INVISIBLE_NAME_CHARS = /[\p{Cc}\p{Cf}\u115F\u1160\u2800\u3164\uFFA0]/gu

/**
 * Removes invisible characters before validating or persisting an alias.
 * @param {unknown} name
 * @returns {string}
 */
function sanitizePlayerName(name) {
  return typeof name === 'string' ? name.replace(INVISIBLE_NAME_CHARS, '') : ''
}

/**
 * Shared display-name validation for the identity form and leaderboard API.
 * @param {unknown} name
 * @returns {{error: string} | {playerName: string}}
 */
export function validatePlayerName(name) {
  const playerName = sanitizePlayerName(name).trim()
  if (playerName.length < 1 || playerName.length > 100) {
    return { error: 'Invalid playerName length' }
  }
  if (!/[\p{L}\p{N}\p{P}\p{S}]/u.test(playerName)) {
    return { error: 'Invalid playerName' }
  }
  return { playerName }
}
