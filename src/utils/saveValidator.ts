/**
 * Save Data Validation Utility
 * Performs deep schema validation on loaded game state to prevent
 * data corruption and malicious injection.
 */

import { ALLOWED_TRENDS, ALLOWED_TRENDS_SET } from '../data/socialTrends'
import { StateError } from './errorHandler'
import {
  clampBandHarmony,
  clampPlayerMoney,
  clampNonNegative
} from './gameState'
import { FORBIDDEN_KEYS, isForbiddenKey, isLooseRecord } from './objectUtils'
import { isFiniteNumber, finiteNumberOr } from './finiteNumber'

const PLAYER_NUMERIC_FIELDS = [
  'money',
  'day',
  'time',
  'score',
  'fame',
  'fameLevel'
] as const
const PLAYER_NON_NEGATIVE_FIELDS: ReadonlySet<string> = new Set([
  'time',
  'score',
  'fame',
  'fameLevel'
])

/**
 * Validates the structure and types of the save data.
 * @param data - The parsed JSON data from localStorage.
 * @returns True if valid, throws error if invalid.
 */
export const validateSaveData = (data: unknown): boolean => {
  checkPrototypePollution(data)

  if (!isLooseRecord(data)) {
    throw new StateError('Save data must be an object')
  }

  const requiredTopLevelKeys = ['player', 'band', 'social', 'gameMap']
  for (const key of requiredTopLevelKeys) {
    if (!data[key]) {
      throw new StateError(`Missing required top-level key: ${key}`)
    }
  }

  if (data.version !== undefined && !/^\d+$/.test(String(data.version))) {
    throw new StateError('Save version must be an integer')
  }

  // Validate Player
  validatePlayer(data.player)

  // Validate Band
  validateBand(data.band)

  // Validate Social
  validateSocial(data.social)

  // Validate GameMap (simplified check)
  if (!isLooseRecord(data.gameMap)) {
    throw new StateError('gameMap must be an object')
  }

  return true
}

const validatePlayer = (player: unknown): void => {
  if (!isLooseRecord(player)) throw new StateError('player must be an object')

  const p = player as Record<string, unknown>

  for (const field of PLAYER_NUMERIC_FIELDS) {
    const val = p[field]
    if (val !== undefined) {
      if (typeof val !== 'number') {
        throw new StateError(`player.${field} must be a number`)
      }
      if (!Number.isFinite(val)) {
        throw new StateError(`player.${field} must be a finite number`)
      }
    }
    if (PLAYER_NON_NEGATIVE_FIELDS.has(field) && val !== undefined) {
      p[field] = clampNonNegative(val as number)
    }
  }
  // Day is 1-based; clamp corrupted saves up to the minimum valid day.
  if (typeof p.day === 'number') {
    p.day = Math.max(1, finiteNumberOr(p.day, 1))
  }

  if (p.money !== undefined) {
    if (!Number.isFinite(p.money as number)) {
      throw new StateError('player.money must be a finite number')
    }
    p.money = clampPlayerMoney(p.money as number)
  }

  if (p.van != null && !isLooseRecord(p.van)) {
    throw new StateError('player.van must be an object')
  }

  // Backfill/Validate clinicVisits
  if (
    p.clinicVisits === undefined ||
    typeof p.clinicVisits !== 'number' ||
    !Number.isFinite(p.clinicVisits as number)
  ) {
    p.clinicVisits = 0
  } else {
    p.clinicVisits = clampNonNegative(Math.floor(p.clinicVisits as number))
  }

  if (
    p.playerId !== undefined &&
    p.playerId !== null &&
    typeof p.playerId !== 'string'
  ) {
    throw new StateError('player.playerId must be a string or null')
  }

  if (p.playerName !== undefined && typeof p.playerName !== 'string') {
    throw new StateError('player.playerName must be a string')
  }
}

const checkPrototypePollution = (obj: unknown): void => {
  if (typeof obj !== 'object' || obj === null) return

  // Explicitly reject forbidden own-properties before iterating because
  // non-enumerable keys are not guaranteed to be visited by the for...in loop below.
  // Iterate the canonical FORBIDDEN_KEYS set so this stays in sync as it grows.
  for (const forbidden of FORBIDDEN_KEYS) {
    if (Object.hasOwn(obj, forbidden)) {
      throw new StateError(`Prototype pollution detected: ${forbidden}`)
    }
  }

  // Iterate over properties to recursively check nested objects
  const asObj = obj as Record<string, unknown>
  for (const key in asObj) {
    if (!Object.hasOwn(asObj, key)) continue
    if (isForbiddenKey(key)) {
      throw new StateError(`Prototype pollution detected: ${key}`)
    }
    const nested = asObj[key]
    if (typeof nested === 'object' && nested !== null) {
      checkPrototypePollution(nested)
    }
  }
}

const validateBand = (band: unknown): void => {
  if (!isLooseRecord(band)) throw new StateError('band must be an object')

  const typedBand = band as Record<string, unknown>
  if (typedBand.members && !Array.isArray(typedBand.members)) {
    throw new StateError('band.members must be an array')
  }

  if (Array.isArray(typedBand.members)) {
    const members = typedBand.members as unknown[]
    for (let index = 0, len = members.length; index < len; index++) {
      const member = members[index]
      if (!isLooseRecord(member)) {
        throw new StateError(`band.members[${index}] must be an object`)
      }
      const m = member as Record<string, unknown>
      if (typeof m.name !== 'string') {
        throw new StateError(`band.members[${index}].name must be a string`)
      }
      for (const stat of ['mood', 'stamina'] as const) {
        const val = m[stat]
        if (val !== undefined) {
          if (!isFiniteNumber(val)) {
            throw new StateError(
              `band.members[${index}].${stat} must be a finite number`
            )
          }
          m[stat] = Math.min(100, clampNonNegative(val as number))
        }
      }
      for (const stat of [
        'skill',
        'charisma',
        'technical',
        'improv',
        'composition'
      ] as const) {
        const val = m[stat]
        if (val != null && !isFiniteNumber(val)) {
          throw new StateError(
            `band.members[${index}].${stat} must be a finite number`
          )
        }
      }
      if (m.role != null && typeof m.role !== 'string') {
        throw new StateError(`band.members[${index}].role must be a string`)
      }
      if (m.baseStats !== undefined && !isLooseRecord(m.baseStats)) {
        throw new StateError(
          `band.members[${index}].baseStats must be an object`
        )
      }
      if (isLooseRecord(m.baseStats)) {
        const baseStats = m.baseStats as Record<string, unknown>
        for (const baseStatKey in baseStats) {
          if (!Object.hasOwn(baseStats, baseStatKey)) continue
          const baseStatVal = baseStats[baseStatKey]
          if (
            typeof baseStatVal !== 'number' ||
            !Number.isFinite(baseStatVal)
          ) {
            throw new StateError(
              `band.members[${index}].baseStats.${baseStatKey} must be a finite number`
            )
          }
        }
      }
      if (m.equipment !== undefined && !isLooseRecord(m.equipment)) {
        throw new StateError(
          `band.members[${index}].equipment must be an object`
        )
      }
      if (m.relationships !== undefined) {
        if (!isLooseRecord(m.relationships)) {
          throw new StateError(
            `band.members[${index}].relationships must be an object`
          )
        }
        const rels = m.relationships as Record<string, unknown>
        for (const relKey in rels) {
          if (!Object.hasOwn(rels, relKey)) continue
          const relVal = rels[relKey]
          if (isForbiddenKey(relKey)) {
            throw new StateError(
              `band.members[${index}].relationships.${relKey} is a reserved key`
            )
          }
          if (
            !Number.isFinite(relVal as number) ||
            (relVal as number) < 0 ||
            (relVal as number) > 100
          ) {
            throw new StateError(
              `band.members[${index}].relationships.${relKey} must be a finite number in [0, 100]`
            )
          }
        }
      }
    }
  }

  if (typedBand.harmony !== undefined) {
    if (typeof typedBand.harmony !== 'number') {
      throw new StateError('band.harmony must be a number')
    }
    if (!Number.isFinite(typedBand.harmony as number)) {
      throw new StateError('band.harmony must be a finite number')
    }
    typedBand.harmony = clampBandHarmony(typedBand.harmony as number)
  }
}

const validateSocial = (social: unknown): void => {
  if (!isLooseRecord(social)) throw new StateError('social must be an object')

  const typedSocial = social as Record<string, unknown>
  for (const key in typedSocial) {
    if (!Object.hasOwn(typedSocial, key)) continue
    const val = typedSocial[key]
    if (key === 'lastGigDay' && val === null) continue
    if (key === 'lastGigDifficulty') {
      if (val === null) continue
      if (isFiniteNumber(val)) continue
      throw new StateError(`Invalid social property format: ${key}`)
    }
    if (key === 'lastPirateBroadcastDay' && val === null) continue
    if (key === 'lastDarkWebLeakDay' && val === null) continue
    if (key === 'egoFocus' && (val === null || typeof val === 'string'))
      continue

    // Backwards compatibility: Ignore legacy sponsorActive boolean
    if (key === 'sponsorActive' && typeof val === 'boolean') continue

    if (key === 'trend') {
      if (
        typeof val === 'string' &&
        ALLOWED_TRENDS_SET.has(val as (typeof ALLOWED_TRENDS)[number])
      )
        continue
      throw new StateError(`Social trend "${val}" is invalid`)
    }

    if (key === 'activeDeals') {
      if (!Array.isArray(val))
        throw new StateError('social.activeDeals must be an array')
      ;(val as unknown[]).forEach((deal, i) => {
        if (!isLooseRecord(deal))
          throw new StateError(`activeDeals[${i}] must be an object`)
        const d = deal as Record<string, unknown>
        if (typeof d.id !== 'string')
          throw new StateError(`activeDeals[${i}].id must be a string`)
        if (typeof d.remainingGigs !== 'number')
          throw new StateError(
            `activeDeals[${i}].remainingGigs must be a number`
          )
        if (!Number.isFinite(d.remainingGigs))
          throw new StateError(
            `activeDeals[${i}].remainingGigs must be a finite number`
          )
      })
      continue
    }

    if (key === 'brandReputation') {
      if (!isLooseRecord(val))
        throw new StateError('social.brandReputation must be an object')
      const br = val as Record<string, unknown>
      for (const align in br) {
        if (!Object.hasOwn(br, align)) continue
        const score = br[align]
        if (typeof score !== 'number')
          throw new StateError(`brandReputation.${align} must be a number`)
        if (!Number.isFinite(score))
          throw new StateError(
            `brandReputation.${align} must be a finite number`
          )
      }
      continue
    }

    if (key === 'influencers') {
      if (!isLooseRecord(val))
        throw new StateError('social.influencers must be an object')
      const infs = val as Record<string, unknown>
      for (const id in infs) {
        if (!Object.hasOwn(infs, id)) continue
        const influencer = infs[id]
        if (!isLooseRecord(influencer))
          throw new StateError(`social.influencers.${id} must be an object`)
        const inf = influencer as Record<string, unknown>
        if (typeof inf.tier !== 'string')
          throw new StateError(`social.influencers.${id}.tier must be a string`)
        if (typeof inf.trait !== 'string')
          throw new StateError(
            `social.influencers.${id}.trait must be a string`
          )
        if (typeof inf.score !== 'number')
          throw new StateError(
            `social.influencers.${id}.score must be a number`
          )
        if (!Number.isFinite(inf.score))
          throw new StateError(
            `social.influencers.${id}.score must be a finite number`
          )
      }
      continue
    }

    if (typeof val !== 'number') {
      throw new StateError(`Social value "${key}" must be a number: ${val}`)
    }
    if (!Number.isFinite(val)) {
      throw new StateError(
        `Social value "${key}" must be a finite number: ${val}`
      )
    }
  }
}
