/**
 * Save Data Validation Utility
 * Performs deep schema validation on loaded game state to prevent
 * data corruption and malicious injection.
 */

import { ALLOWED_TRENDS } from '../data/socialTrends.js'
import { StateError } from './errorHandler.js'

const isPlainObject = value =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Validates the structure and types of the save data.
 * @param {any} data - The parsed JSON data from localStorage.
 * @returns {boolean} True if valid, throws error if invalid.
 */
export const validateSaveData = data => {
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
  }

  if (player.van && !isPlainObject(player.van)) {
    throw new StateError('player.van must be an object')
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
    })
  }

  if (typeof band.harmony !== 'number') {
    throw new StateError('band.harmony must be a number')
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
          throw new StateError(`activeDeals[${i}].remainingGigs must be a number`)
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

    if (typeof val !== 'number') {
      throw new StateError(`Social value "${key}" must be a number: ${val}`)
    }
  })
}
