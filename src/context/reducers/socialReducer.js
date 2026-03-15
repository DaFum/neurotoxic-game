import { logger } from '../../utils/logger.js'
import { ALLOWED_TRENDS } from '../../data/socialTrends.js'
import {
  clampPlayerMoney,
  clampBandHarmony
} from '../../utils/gameStateUtils.js'

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

  if (updates.zealotry !== undefined) {
    updates.zealotry = Math.max(0, Math.min(100, Number(updates.zealotry) || 0))
  }

  if (
    updates.sponsorActive !== undefined &&
    typeof updates.sponsorActive !== 'boolean'
  ) {
    logger.warn('GameState', 'Invalid sponsorActive update (must be boolean)')
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
        id: crypto.randomUUID(),
        message: `ui:toast.fans_defended`,
        type: 'info'
      }
    ]
  } else {
    nextState.venueBlacklist = [...(nextState.venueBlacklist || []), venueId]
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: crypto.randomUUID(),
        message: `ui:toast.blacklisted|${JSON.stringify({ venueLabel: `venues:${venueId}.name` })}`,
        type: 'error'
      }
    ]
  }
  return nextState
}

export const handlePirateBroadcast = (state, payload) => {
  if (!payload || typeof payload !== 'object') {
    logger.warn('GameState', 'Invalid payload for PIRATE_BROADCAST')
    return state
  }

  const cost = Number(payload.cost) || 0
  const fameGain = Number(payload.fameGain) || 0
  const zealotryGain = Number(payload.zealotryGain) || 0
  const controversyGain = Number(payload.controversyGain) || 0
  const harmonyCost = Number(payload.harmonyCost) || 0
  const successToast = payload.successToast

  const currentMoney = Number(state.player.money) || 0
  const currentHarmony = Number(state.band.harmony) || 0
  const currentFame = Number(state.player.fame) || 0
  const currentZealotry = Number(state.social.zealotry) || 0
  const currentControversy = Number(state.social.controversyLevel) || 0

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextFame = Math.max(0, currentFame + fameGain)
  const nextZealotry = Math.max(
    0,
    Math.min(100, currentZealotry + zealotryGain)
  )
  const nextControversy = Math.max(
    0,
    Math.min(100, currentControversy + controversyGain)
  )

  const nextState = {
    ...state,
    player: {
      ...state.player,
      money: nextMoney,
      fame: nextFame
    },
    band: {
      ...state.band,
      harmony: nextHarmony
    },
    social: {
      ...state.social,
      zealotry: nextZealotry,
      controversyLevel: nextControversy,
      lastPirateBroadcastDay: state.player.day
    }
  }

  if (successToast) {
    const deltaFame = nextFame - currentFame
    const deltaZealotry = nextZealotry - currentZealotry
    const deltaControversy = nextControversy - currentControversy
    const deltaHarmony = nextHarmony - currentHarmony
    const actualCost = currentMoney - nextMoney

    nextState.toasts = [
      ...(state.toasts || []),
      {
        id: crypto.randomUUID(),
        ...successToast,
        options: {
          ...successToast.options,
          deltaFame,
          deltaZealotry,
          deltaControversy,
          deltaHarmony,
          cost: actualCost
        }
      }
    ]
  }

  return nextState
}
