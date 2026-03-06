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
      const { trend: _trend, ...restUpdates } = updates
      updates = restUpdates
    }
  }

  if (
    updates.sponsorActive !== undefined &&
    typeof updates.sponsorActive !== 'boolean'
  ) {
    logger.warn('GameState', 'Invalid sponsorActive update (must be boolean)')
    const { sponsorActive: _sponsorActive, ...restUpdates } = updates
    updates = restUpdates
  }

  if (updates.activeDeals !== undefined) {
    if (!Array.isArray(updates.activeDeals)) {
      logger.warn('GameState', 'Invalid activeDeals update (must be array)')
      const { activeDeals: _activeDeals, ...restUpdates } = updates
      updates = restUpdates
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

export const handleAddVenueBlacklist = (state, venueId) => {
  let nextState = { ...state }
  // Intentional design: If loyalty is high enough (>= 30), loyal fans will defend the band
  // and prevent the venue from blacklisting them, at the cost of 15 loyalty points.
  if (nextState.social.loyalty >= 30) {
    nextState.social = {
      ...nextState.social,
      loyalty: nextState.social.loyalty - 15
    }
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: Date.now().toString(),
        message: `ui:toast.fans_defended`,
        type: 'info'
      }
    ]
  } else {
    nextState.venueBlacklist = [...(nextState.venueBlacklist || []), venueId]
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: Date.now().toString(),
        message: `ui:toast.blacklisted|${JSON.stringify({ venue: venueId, venueLabel: `venues:${venueId}.name` })}`,
        type: 'error'
      }
    ]
  }
  return nextState
}
