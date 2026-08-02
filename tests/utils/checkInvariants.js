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

  for (const member of band.members) {
    if (member.stamina < 0 || member.stamina > (member.staminaMax ?? 100))
      violations.push(`${member.name} stamina out of bounds: ${member.stamina}`)
    if (member.mood < 0 || member.mood > 100)
      violations.push(`${member.name} mood out of bounds: ${member.mood}`)
  }

  if (player.van) {
    if (player.van.fuel < 0 || player.van.fuel > 100)
      violations.push(`van.fuel out of [0,100]: ${player.van.fuel}`)
    if (player.van.condition < 0 || player.van.condition > 100)
      violations.push(`van.condition out of [0,100]: ${player.van.condition}`)
  }

  return violations
}
