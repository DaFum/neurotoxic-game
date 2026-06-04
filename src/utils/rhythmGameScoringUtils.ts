/**
 * Pure functions for rhythm game scoring logic.
 */
import { logger } from './logger'

/**
 * Stable lane indices used by rhythm input, note scheduling, and scoring.
 */
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
 * Resolves the effective hit window for one rhythm lane.
 *
 * @param baseHitWindow - Base hit window in milliseconds.
 * @param hitWindowBonus - Flat bonus from active gig modifiers.
 * @param laneIndex - Lane receiving the note input.
 * @param guitarDifficulty - Guitar-lane divisor. Values below the minimum
 * difficulty floor are clamped before division.
 * @returns Hit window in milliseconds after lane-specific modifiers.
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
 * Resolves base note points before combo and toxic/corruption multipliers.
 *
 * @param laneIndex - Lane that received the hit.
 * @param drumMultiplier - Drum-lane score multiplier.
 * @param guitarScoreMult - Guitar-lane score multiplier.
 * @param bassScoreMult - Bass-lane score multiplier.
 * @param guestlist - Whether the guestlist modifier adds its score bonus.
 * @returns Base points for a valid hit.
 *
 * @throws Error when `laneIndex` is not one of the supported rhythm lanes.
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
 * Applies combo, toxic mode, corruption burst, and trait multipliers to a hit.
 *
 * @param basePoints - Lane-adjusted base points for the hit.
 * @param currentCombo - Current combo count before this score increment.
 * @param toxicModeActive - Whether toxic mode multiplies the score.
 * @param hasPerfektionist - Whether the Perfektionist trait can award its
 * accuracy-based bonus.
 * @param currentAccuracy - Current hit accuracy percentage.
 * @param isCorruptionBurstActive - Whether corruption burst multiplies the hit.
 * @returns Floored score increment for the hit.
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
 * Resolves overload recovery and crowd-energy loss from missed input.
 *
 * @param count - Number of misses represented by this update.
 * @param isEmptyHit - Whether the miss came from pressing an empty lane instead
 * of missing a scheduled note.
 * @param currentOverload - Current overload amount before applying the penalty.
 * @param currentHealth - Current crowd-energy value before decay.
 * @param crowdDecay - Crowd-decay multiplier, floored to the minimum decay.
 * @returns Miss penalty, per-miss decay, and clamped next overload/health values.
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
