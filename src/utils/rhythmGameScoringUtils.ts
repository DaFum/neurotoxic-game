/**
 * Pure functions for rhythm game scoring logic.
 */
import { logger } from './logger'

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
  CORRUPTION_BURST_SCORE_MULTIPLIER: 2,
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
 * @param baseHitWindow - Base hit window in ms.
 * @param hitWindowBonus - Bonus hit window from modifiers.
 * @param laneIndex - Lane index.
 * @param guitarDifficulty - Modifier for guitar lane difficulty.
 * @returns The calculated dynamic hit window.
 */
export const calculateDynamicHitWindow = (
  baseHitWindow: number,
  hitWindowBonus = 0,
  laneIndex: number,
  guitarDifficulty = 1.0
): number => {
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
 * @param laneIndex - Lane index.
 * @param drumMultiplier - Modifier for drum lane points.
 * @param guitarScoreMult - Modifier for guitar lane points.
 * @param bassScoreMult - Modifier for bass lane points.
 * @param guestlist - Whether guestlist modifier is active.
 * @returns The calculated base points.
 */
export const calculatePoints = (
  laneIndex: number,
  drumMultiplier = 1.0,
  guitarScoreMult = 1.0,
  bassScoreMult = 1.0,
  guestlist = false
): number => {
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
      logger.error(
        'rhythmGameScoringUtils',
        `Unknown lane index: ${laneIndex}`,
        null
      )
      throw new Error(`Unknown lane index: ${laneIndex}`)
  }

  // Guestlist Effect: +20% score
  if (guestlist) points *= CONSTANTS.GUESTLIST_MULTIPLIER

  return points
}

/**
 * Calculates the final score for a hit.
 * @param basePoints - Points awarded for the hit.
 * @param currentCombo - Current combo count.
 * @param toxicModeActive - Whether toxic mode is active.
 * @param hasPerfektionist - Whether the Perfektionist trait is active.
 * @param currentAccuracy - Current hit accuracy percentage.
 * @param isCorruptionBurstActive - Whether corruption burst is active.
 * @returns The final calculated score increment.
 */
export const calculateFinalScore = (
  basePoints: number,
  currentCombo: number,
  toxicModeActive: boolean,
  hasPerfektionist: boolean,
  currentAccuracy: number,
  isCorruptionBurstActive: boolean = false
): number => {
  let finalScore = basePoints + currentCombo * CONSTANTS.COMBO_POINT_BONUS

  if (isCorruptionBurstActive) {
    finalScore *= CONSTANTS.CORRUPTION_BURST_SCORE_MULTIPLIER
  }

  if (toxicModeActive) {
    finalScore *= CONSTANTS.TOXIC_MODE_SCORE_MULTIPLIER
  }

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
 * @param count - Number of misses.
 * @param isEmptyHit - Whether it was an empty hit.
 * @param currentOverload - Current overload amount.
 * @param currentHealth - Current health amount.
 * @param crowdDecay - Crowd decay modifier.
 * @returns The calculated miss impact.
 */
export const calculateMissImpact = (
  count = 1,
  isEmptyHit = false,
  currentOverload = 0,
  currentHealth = CONSTANTS.MAX_HEALTH,
  crowdDecay = 1.0
): {
  penalty: number
  nextOverload: number
  decayPerMiss: number
  nextHealth: number
} => {
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
