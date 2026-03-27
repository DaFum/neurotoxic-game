/**
 * Pure functions for rhythm game scoring logic.
 */

/**
 * Calculates the dynamic hit window for a specific lane.
 * @param {number} baseHitWindow - Base hit window in ms.
 * @param {number} hitWindowBonus - Bonus hit window from modifiers.
 * @param {number} laneIndex - Lane index.
 * @param {number} guitarDifficulty - Modifier for guitar lane difficulty.
 * @returns {number} The calculated dynamic hit window.
 */
export const calculateDynamicHitWindow = (
  baseHitWindow,
  hitWindowBonus = 0,
  laneIndex,
  guitarDifficulty = 1.0
) => {
  let hitWindow = baseHitWindow + hitWindowBonus

  // Dynamic Hit Window (Guitar Custom: easier to hit = larger window)
  if (laneIndex === 0) {
    const difficultyFactor = Math.max(0.1, guitarDifficulty)
    hitWindow /= difficultyFactor
  }

  return hitWindow
}

/**
 * Calculates the points awarded for hitting a note.
 * @param {number} laneIndex - Lane index.
 * @param {number} drumMultiplier - Modifier for drum lane points.
 * @param {number} guitarScoreMult - Modifier for guitar lane points.
 * @param {number} bassScoreMult - Modifier for bass lane points.
 * @param {boolean} guestlist - Whether guestlist modifier is active.
 * @returns {number} The calculated base points.
 */
export const calculatePoints = (
  laneIndex,
  drumMultiplier = 1.0,
  guitarScoreMult = 1.0,
  bassScoreMult = 1.0,
  guestlist = false
) => {
  let points = 100

  // Dynamic Score Multiplier
  if (laneIndex === 1) points *= drumMultiplier
  if (laneIndex === 0) points *= guitarScoreMult
  if (laneIndex === 2) points *= bassScoreMult

  // Guestlist Effect: +20% score
  if (guestlist) points *= 1.2

  return points
}

/**
 * Calculates the final score for a hit.
 * @param {number} basePoints - Points awarded for the hit.
 * @param {number} currentCombo - Current combo count.
 * @param {boolean} toxicModeActive - Whether toxic mode is active.
 * @param {boolean} hasPerfektionist - Whether the Perfektionist trait is active.
 * @param {number} currentAccuracy - Current hit accuracy percentage.
 * @returns {number} The final calculated score increment.
 */
export const calculateFinalScore = (
  basePoints,
  currentCombo,
  toxicModeActive,
  hasPerfektionist,
  currentAccuracy
) => {
  let finalScore = basePoints + currentCombo * 10
  if (toxicModeActive) finalScore *= 4

  // Perfektionist Trait: +15% score if accuracy > 85%
  if (hasPerfektionist && currentAccuracy > 85) {
    finalScore *= 1.15
  }

  return Math.floor(finalScore)
}

/**
 * Calculates the impact of a miss.
 * @param {number} count - Number of misses.
 * @param {boolean} isEmptyHit - Whether it was an empty hit.
 * @param {number} currentOverload - Current overload amount.
 * @param {number} currentHealth - Current health amount.
 * @param {number} crowdDecay - Crowd decay modifier.
 * @returns {{ penalty: number, nextOverload: number, decayPerMiss: number, nextHealth: number }} The calculated miss impact.
 */
export const calculateMissImpact = (
  count = 1,
  isEmptyHit = false,
  currentOverload = 0,
  currentHealth = 100,
  crowdDecay = 1.0
) => {
  // Overload penalty
  const penalty = isEmptyHit ? 2 : 5
  const nextOverload = Math.max(0, currentOverload - penalty * count)

  // Health decay
  const basePenalty = isEmptyHit ? 1 : 2
  const decayPerMiss = basePenalty * Math.max(0.1, crowdDecay)
  const nextHealth = Math.max(
    0,
    Math.min(100, currentHealth - decayPerMiss * count)
  )

  return { penalty, nextOverload, decayPerMiss, nextHealth }
}
