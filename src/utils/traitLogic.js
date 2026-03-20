/**
 * Utility functions for checking character traits.
 * Centralizes logic for trait effects and conditions.
 */

/**
 * Checks if a specific member has a trait.
 * @param {object} member - The band member object.
 * @param {string} traitId - The ID of the trait to check.
 * @returns {boolean} True if the member has the trait.
 */
export const hasTrait = (member, traitId) => {
  if (!member || !member.traits || !Array.isArray(member.traits)) {
    return false
  }
  return member.traits.some(t => t.id === traitId)
}

/**
 * Checks if any member in the band has a specific trait.
 * @param {object} bandState - The band state object (containing members array).
 * @param {string} traitId - The ID of the trait to check.
 * @returns {boolean} True if any member has the trait.
 */
export const bandHasTrait = (bandState, traitId) => {
  if (!bandState || !bandState.members || !Array.isArray(bandState.members)) {
    return false
  }
  return bandState.members.some(member => hasTrait(member, traitId))
}
