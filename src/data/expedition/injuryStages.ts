/**
 * The ordered injury-stage vocabularies for Band members and Crew.
 *
 * @remarks
 * Each tuple is weakest first, so an index comparison ranks severity. The
 * `ExpeditionBandInjuryStage` and `ExpeditionCrewInjuryStage` types are derived
 * from these tuples, and every runtime membership or severity check reads them
 * rather than restating the stages.
 */

import type {
  ExpeditionBandInjuryStage,
  ExpeditionCrewInjuryStage
} from '../../types/expedition'

/** Band injury stages, weakest first. */
export const EXPEDITION_BAND_INJURY_STAGES = [
  'none',
  'light',
  'serious',
  'critical'
] as const

/** Crew injury stages, weakest first. Crew never reach `critical`. */
export const EXPEDITION_CREW_INJURY_STAGES = [
  'none',
  'light',
  'serious'
] as const

/**
 * Narrows an untrusted value to a Band injury stage.
 *
 * @param value - Raw candidate, e.g. from a save.
 * @returns True when the value is one of {@link EXPEDITION_BAND_INJURY_STAGES}.
 */
export const isBandInjuryStage = (
  value: unknown
): value is ExpeditionBandInjuryStage =>
  typeof value === 'string' &&
  (EXPEDITION_BAND_INJURY_STAGES as readonly string[]).includes(value)

/**
 * Narrows an untrusted value to a Crew injury stage.
 *
 * @param value - Raw candidate, e.g. from a save.
 * @returns True when the value is one of {@link EXPEDITION_CREW_INJURY_STAGES}.
 */
export const isCrewInjuryStage = (
  value: unknown
): value is ExpeditionCrewInjuryStage =>
  typeof value === 'string' &&
  (EXPEDITION_CREW_INJURY_STAGES as readonly string[]).includes(value)
