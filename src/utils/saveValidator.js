/**
 * Save Data Validation Utility
 * Performs deep schema validation on loaded game state to prevent
 * data corruption and malicious injection.
 */

import { ALLOWED_TRENDS } from '../data/socialTrends.js'
import { StateError } from './errorHandler.js'
import { clampBandHarmony, clampPlayerMoney } from './gameStateUtils.js'

const isPlainObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Validates the structure and types of the save data.
 * @param {any} data - The parsed JSON data from localStorage.
 * @returns {boolean} True if valid, throws error if invalid.
 */
export const validateSaveData = data => {
  checkPrototypePollution(data);

  if (!isPlainObject(data)) {
    throw new StateError('Save data must be an object')
  }

  const requiredTopLevelKeys = ['player', 'band', 'social', 'gameMap']
  for (const key of requiredTopLevelKeys) {
    if (!data[key]) {
      throw new StateError(`Missing required top-level key: ${key}`)
    }
  }

  // Validate Player
  validatePlayer(data.player)

  // Validate Band
  validateBand(data.band)

  // Validate Social
  validateSocial(data.social)

  // Validate GameMap (simplified check)
  if (!isPlainObject(data.gameMap)) {
    throw new StateError('gameMap must be an object')
  }

  return true
}

const validatePlayer = player => {
  if (!isPlainObject(player)) throw new StateError('player must be an object')

  const numericFields = ['money', 'day', 'time', 'score', 'fame', 'fameLevel']
  for (const field of numericFields) {
    if (player[field] !== undefined && typeof player[field] !== 'number') {
      throw new StateError(`player.${field} must be a number`)
    }
    if (field === 'fame' && player[field] !== undefined) {
      player[field] = Math.max(0, player[field])
    }
    if (field === 'score' && player[field] !== undefined) {
      player[field] = Math.max(0, player[field])
    }
  }

  if (player.money !== undefined) {
    if (!Number.isFinite(player.money)) {
      throw new StateError('player.money must be a finite number')
    }
    player.money = clampPlayerMoney(player.money)
  }

  if (player.van && !isPlainObject(player.van)) {
    throw new StateError('player.van must be an object')
  }

  if (
    player.playerId !== undefined &&
    player.playerId !== null &&
    typeof player.playerId !== 'string'
  ) {
    throw new StateError('player.playerId must be a string or null')
  }

  if (
    player.playerName !== undefined &&
    typeof player.playerName !== 'string'
  ) {
    throw new StateError('player.playerName must be a string')
  }
}


const BANNED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

const checkPrototypePollution = (obj) => {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      if (BANNED_KEYS.has(key)) {
        throw new StateError(`Prototype pollution detected: ${key}`);
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        checkPrototypePollution(obj[key]);
      }
    }
  }
}


const validateBand = band => {
  if (!isPlainObject(band)) throw new StateError('band must be an object')

  if (band.members && !Array.isArray(band.members)) {
    throw new StateError('band.members must be an array')
  }

  if (band.members) {
    band.members.forEach((member, index) => {
      if (!isPlainObject(member)) {
        throw new StateError(`band.members[${index}] must be an object`)
      }
      if (typeof member.name !== 'string') {
        throw new StateError(`band.members[${index}].name must be a string`)
      }
      if (member.mood !== undefined) {
        if (typeof member.mood !== 'number' || !Number.isFinite(member.mood)) {
          throw new StateError(`band.members[${index}].mood must be a finite number`)
        }
        member.mood = Math.min(100, Math.max(0, member.mood))
      }
      if (member.stamina !== undefined) {
        if (typeof member.stamina !== 'number' || !Number.isFinite(member.stamina)) {
          throw new StateError(`band.members[${index}].stamina must be a finite number`)
        }
        member.stamina = Math.min(100, Math.max(0, member.stamina))
      }
      if (member.relationships !== undefined) {
        if (!isPlainObject(member.relationships)) {
          throw new StateError(
            `band.members[${index}].relationships must be an object`
          )
        }
        Object.entries(member.relationships).forEach(([relKey, relVal]) => {
          if (BANNED_KEYS.has(relKey)) {
            throw new StateError(
              `band.members[${index}].relationships.${relKey} is a reserved key`
            )
          }
          if (!Number.isFinite(relVal) || relVal < 0 || relVal > 100) {
            throw new StateError(
              `band.members[${index}].relationships.${relKey} must be a finite number in [0, 100]`
            )
          }
        })
      }
    })
  }

  if (band.harmony !== undefined) {
    if (typeof band.harmony !== 'number') {
      throw new StateError('band.harmony must be a number')
    }
    if (!Number.isFinite(band.harmony)) {
      throw new StateError('band.harmony must be a finite number')
    }
    band.harmony = clampBandHarmony(band.harmony)
  }
}

const validateSocial = social => {
  if (!isPlainObject(social)) throw new StateError('social must be an object')

  Object.entries(social).forEach(([key, val]) => {
    if (key === 'lastGigDay' && val === null) return
    if (key === 'egoFocus' && (val === null || typeof val === 'string')) return
    if (key === 'sponsorActive' && typeof val === 'boolean') return

    if (key === 'trend') {
      if (typeof val === 'string' && ALLOWED_TRENDS.includes(val)) return
      throw new StateError(`Social trend "${val}" is invalid`)
    }

    if (key === 'activeDeals') {
      if (!Array.isArray(val))
        throw new StateError('social.activeDeals must be an array')
      val.forEach((deal, i) => {
        if (!isPlainObject(deal))
          throw new StateError(`activeDeals[${i}] must be an object`)
        if (typeof deal.id !== 'string')
          throw new StateError(`activeDeals[${i}].id must be a string`)
        if (typeof deal.remainingGigs !== 'number')
          throw new StateError(
            `activeDeals[${i}].remainingGigs must be a number`
          )
      })
      return
    }

    if (key === 'brandReputation') {
      if (!isPlainObject(val))
        throw new StateError('social.brandReputation must be an object')
      Object.entries(val).forEach(([align, score]) => {
        if (typeof score !== 'number')
          throw new StateError(`brandReputation.${align} must be a number`)
      })
      return
    }

    if (key === 'influencers') {
      if (!isPlainObject(val))
        throw new StateError('social.influencers must be an object')
      Object.entries(val).forEach(([id, influencer]) => {
        if (!isPlainObject(influencer))
          throw new StateError(`social.influencers.${id} must be an object`)
        if (typeof influencer.tier !== 'string')
          throw new StateError(`social.influencers.${id}.tier must be a string`)
        if (typeof influencer.trait !== 'string')
          throw new StateError(
            `social.influencers.${id}.trait must be a string`
          )
        if (typeof influencer.score !== 'number')
          throw new StateError(
            `social.influencers.${id}.score must be a number`
          )
      })
      return
    }

    if (typeof val !== 'number') {
      throw new StateError(`Social value "${key}" must be a number: ${val}`)
    }
  })
}
