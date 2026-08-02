/**
 * Shared state-invariant checker.
 *
 * Runner-agnostic on purpose: both the `node:test` suites and the Vitest
 * security suites import it, so it must not pull in a test runner.
 */

/**
 * Checks all core invariants against a state object.
 *
 * @param {object} state - Game state to inspect.
 * @returns {string[]} Violation strings; an empty array means the state is clean.
 */
export function checkInvariants(state) {
  const violations = []
  const { player, band } = state

  if (player.money < 0) violations.push(`money < 0: ${player.money}`)
  if (!Number.isInteger(player.money))
    violations.push(`money not integer: ${player.money}`)
  if (player.fame < 0) violations.push(`fame < 0: ${player.fame}`)
  if (band.harmony < 1 || band.harmony > 100)
    violations.push(`harmony out of [1,100]: ${band.harmony}`)

  if (!Array.isArray(band.members)) {
    violations.push(`band.members is not an array: ${String(band.members)}`)
  }

  for (const member of Array.isArray(band.members) ? band.members : []) {
    if (!member || typeof member !== 'object') {
      violations.push(`band member is not an object: ${String(member)}`)
      continue
    }
    if (member.stamina < 0 || member.stamina > (member.staminaMax ?? 100))
      violations.push(`${member.name} stamina out of bounds: ${member.stamina}`)
    if (member.mood < 0 || member.mood > 100)
      violations.push(`${member.name} mood out of bounds: ${member.mood}`)
  }

  if (player.van !== undefined && player.van !== null) {
    if (typeof player.van !== 'object' || Array.isArray(player.van)) {
      violations.push(`van is not an object: ${String(player.van)}`)
    } else {
      // A corrupted van drops the numeric fields entirely; `undefined < 0` is
      // false, so the bounds check alone would silently pass.
      for (const field of ['fuel', 'condition']) {
        const value = player.van[field]
        if (!Number.isFinite(value)) {
          violations.push(`van.${field} is not finite: ${String(value)}`)
        } else if (value < 0 || value > 100) {
          violations.push(`van.${field} out of [0,100]: ${value}`)
        }
      }
    }
  }

  return violations
}
