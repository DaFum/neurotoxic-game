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
export const hasTrait = (member: unknown, traitId: string): boolean => {
  if (
    !member ||
    !member ||
    typeof member !== 'object' ||
    !('traits' in member) ||
    typeof (member as Record<string, unknown>).traits !== 'object' ||
    Array.isArray((member as Record<string, unknown>).traits)
  ) {
    return false
  }
  return Object.hasOwn(
    (member as Record<string, unknown>).traits as Record<string, unknown>,
    traitId
  )
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
  // Using a for loop instead of .some() to avoid array allocation if performance is critical,
  // though band members array is small (usually 3-4).
  for (let i = 0; i < bandState.members.length; i++) {
    if (hasTrait(bandState.members[i], traitId)) {
      return true
    }
  }
  return false
}
