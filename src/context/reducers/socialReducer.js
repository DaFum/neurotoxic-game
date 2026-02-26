import { logger } from '../../utils/logger.js'
import { ALLOWED_TRENDS } from '../../data/socialTrends.js'

/**
 * Handles social update actions
 * @param {Object} state - Current state
 * @param {Object} payload - Social updates
 * @returns {Object} Updated state
 */
export const handleUpdateSocial = (state, payload) => {
  let updates = payload

  // Support functional updates: updateSocial(prev => ...)
  if (typeof updates === 'function') {
    updates = updates(state.social)
  }

  if (!updates || typeof updates !== 'object') return state

  updates = { ...updates }

  // Validate special fields
  if (updates.trend !== undefined) {
    if (!ALLOWED_TRENDS.includes(updates.trend)) {
      logger.warn('GameState', `Invalid trend update: ${updates.trend}`)
      delete updates.trend
    }
  }

  if (
    updates.sponsorActive !== undefined &&
    typeof updates.sponsorActive !== 'boolean'
  ) {
    logger.warn(
      'GameState',
      'Invalid sponsorActive update (must be boolean)'
    )
    delete updates.sponsorActive
  }

  if (updates.activeDeals !== undefined) {
    if (!Array.isArray(updates.activeDeals)) {
      logger.warn('GameState', 'Invalid activeDeals update (must be array)')
      delete updates.activeDeals
    } else {
      // Validate structure of items
      const validDeals = updates.activeDeals.filter(
        d =>
          d &&
          typeof d === 'object' &&
          typeof d.id === 'string' &&
          typeof d.remainingGigs === 'number'
      )
      if (validDeals.length !== updates.activeDeals.length) {
        logger.warn(
          'GameState',
          'Filtered invalid deals from activeDeals update'
        )
      }
      updates.activeDeals = validDeals
    }
  }

  return { ...state, social: { ...state.social, ...updates } }
}

export const handleAddVenueBlacklist = (state, venueName) => {
  let nextState = { ...state }
  if (nextState.social.loyalty >= 30) {
    nextState.social = {
      ...nextState.social,
      loyalty: nextState.social.loyalty - 15
    }
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: Date.now().toString(),
        message: `Loyal fans defended you — venue gave one more chance!`,
        type: 'info'
      }
    ]
  } else {
    nextState.venueBlacklist = [...(nextState.venueBlacklist || []), venueName]
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: Date.now().toString(),
        message: `BLACKLISTED: ${venueName}`,
        type: 'error'
      }
    ]
  }
  return nextState
}
