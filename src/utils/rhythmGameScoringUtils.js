/**
 * Pure functions for rhythm game scoring logic.
 */
import { logger } from './logger.js'

export const LANE_INDICES = {
  GUITAR: 0,
  DRUMS: 1,
  BASS: 2
}

const CONSTANTS = {
  GUITAR_MIN_DIFFICULTY: 0.1,
  BASE_POINTS: 100,
  GUESTLIST_MULTIPLIER: 1.2,
  COMBO_POINT_BONUS: 10,
  TOXIC_MODE_SCORE_MULTIPLIER: 4,
  PERFEKTIONIST_ACCURACY_THRESHOLD: 85,
  PERFEKTIONIST_BONUS_MULTIPLIER: 1.15,
  EMPTY_HIT_OVERLOAD_PENALTY: 2,
  NOTE_MISS_OVERLOAD_PENALTY: 5,
  EMPTY_HIT_HEALTH_DECAY: 1,
  NOTE_MISS_HEALTH_DECAY: 2,
  MIN_CROWD_DECAY: 0.1,
  MAX_HEALTH: 100
}

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
  if (laneIndex === LANE_INDICES.GUITAR) {
    const difficultyFactor = Math.max(
      CONSTANTS.GUITAR_MIN_DIFFICULTY,
      guitarDifficulty
    )
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
  let points = CONSTANTS.BASE_POINTS

  // Dynamic Score Multiplier
  switch (laneIndex) {
    case LANE_INDICES.GUITAR:
      points *= guitarScoreMult
      break
    case LANE_INDICES.DRUMS:
      points *= drumMultiplier
      break
    case LANE_INDICES.BASS:
      points *= bassScoreMult
      break
    default:
      logger.error('rhythmGameScoringUtils', `Unknown lane index: ${laneIndex}`)
      throw new Error(`Unknown lane index: ${laneIndex}`)
  }

  // Guestlist Effect: +20% score
  if (guestlist) points *= CONSTANTS.GUESTLIST_MULTIPLIER

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
  let finalScore = basePoints + currentCombo * CONSTANTS.COMBO_POINT_BONUS
  if (toxicModeActive) finalScore *= CONSTANTS.TOXIC_MODE_SCORE_MULTIPLIER

  // Perfektionist Trait: +15% score if accuracy > 85%
  if (
    hasPerfektionist &&
    currentAccuracy > CONSTANTS.PERFEKTIONIST_ACCURACY_THRESHOLD
  ) {
    finalScore *= CONSTANTS.PERFEKTIONIST_BONUS_MULTIPLIER
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
  currentHealth = CONSTANTS.MAX_HEALTH,
  crowdDecay = 1.0
) => {
  // Overload penalty
  const penalty = isEmptyHit
    ? CONSTANTS.EMPTY_HIT_OVERLOAD_PENALTY
    : CONSTANTS.NOTE_MISS_OVERLOAD_PENALTY
  const nextOverload = Math.max(0, currentOverload - penalty * count)

  // Health decay
  const basePenalty = isEmptyHit
    ? CONSTANTS.EMPTY_HIT_HEALTH_DECAY
    : CONSTANTS.NOTE_MISS_HEALTH_DECAY
  const decayPerMiss =
    basePenalty * Math.max(CONSTANTS.MIN_CROWD_DECAY, crowdDecay)
  const nextHealth = Math.max(
    0,
    Math.min(CONSTANTS.MAX_HEALTH, currentHealth - decayPerMiss * count)
  )

  return { penalty, nextOverload, decayPerMiss, nextHealth }
}
