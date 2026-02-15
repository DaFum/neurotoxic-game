/**
 * Save Data Validation Utility
 * Performs deep schema validation on loaded game state to prevent
 * data corruption and malicious injection.
 */

/**
 * Validates the structure and types of the save data.
 * @param {any} data - The parsed JSON data from localStorage.
 * @returns {boolean} True if valid, throws error if invalid.
 */
export const validateSaveData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Save data must be an object')
  }

  const requiredTopLevelKeys = ['player', 'band', 'social', 'gameMap']
  for (const key of requiredTopLevelKeys) {
    if (!data[key]) {
      throw new Error(`Missing required top-level key: ${key}`)
    }
  }

  // Validate Player
  validatePlayer(data.player)

  // Validate Band
  validateBand(data.band)

  // Validate Social
  validateSocial(data.social)

  // Validate GameMap (simplified check)
  if (typeof data.gameMap !== 'object') {
    throw new Error('gameMap must be an object')
  }

  return true
}

const validatePlayer = (player) => {
  if (typeof player !== 'object') throw new Error('player must be an object')

  const numericFields = ['money', 'day', 'time', 'score', 'fame', 'fameLevel']
  for (const field of numericFields) {
    if (player[field] !== undefined && typeof player[field] !== 'number') {
      throw new Error(`player.${field} must be a number`)
    }
  }

  if (player.van && typeof player.van !== 'object') {
    throw new Error('player.van must be an object')
  }
}

const validateBand = (band) => {
  if (typeof band !== 'object') throw new Error('band must be an object')

  if (band.members && !Array.isArray(band.members)) {
    throw new Error('band.members must be an array')
  }

  if (band.members) {
    band.members.forEach((member, index) => {
      if (typeof member !== 'object') {
        throw new Error(`band.members[${index}] must be an object`)
      }
      if (typeof member.name !== 'string') {
        throw new Error(`band.members[${index}].name must be a string`)
      }
    })
  }

  if (typeof band.harmony !== 'number') {
    throw new Error('band.harmony must be a number')
  }
}

const validateSocial = (social) => {
  if (typeof social !== 'object') throw new Error('social must be an object')

  Object.values(social).forEach((val) => {
    if (typeof val !== 'number') {
      throw new Error('Social values must be numbers')
    }
  })
}
