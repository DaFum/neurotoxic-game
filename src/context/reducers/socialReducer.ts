import type { GameState, SocialState } from '../../types/game'
import { logger } from '../../utils/logger'
import { ALLOWED_TRENDS } from '../../data/socialTrends'
import { getSafeUUID } from '../../utils/crypto'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampPlayerFame,
  calculateFameLevel
} from '../../utils/gameStateUtils'
import { sanitizeSuccessToast } from './toastSanitizers'

/**
 * Handles social update actions
 * @param {Object} state - Current state
 * @param {Object} payload - Social updates
 * @returns {Object} Updated state
 */
export const handleUpdateSocial = (
  state: GameState,
  payload: Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>)
): GameState => {
  let updates = payload

  // Support functional updates: updateSocial(prev => ...)
  if (typeof updates === 'function') {
    updates = updates(state.social)
  }

  if (!updates || typeof updates !== 'object') return state

  updates = { ...updates }

  // Validate special fields
  if (updates.trend !== undefined) {
    if (
      typeof updates.trend !== 'string' ||
      !(ALLOWED_TRENDS as readonly string[]).includes(updates.trend)
    ) {
      logger.warn('GameState', `Invalid trend update: ${updates.trend}`)
      delete updates.trend
    }
  }

  if (updates.zealotry !== undefined) {
    updates.zealotry = Math.max(0, Math.min(100, Number(updates.zealotry) || 0))
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

export const handleAddVenueBlacklist = (
  state: GameState,
  { venueId, toastId }: { venueId: string; toastId: string }
): GameState => {
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
        id: toastId,
        messageKey: 'ui:toast.fans_defended',
        type: 'info'
      }
    ]
  } else {
    nextState.venueBlacklist = [...(nextState.venueBlacklist || []), venueId]
    nextState.toasts = [
      ...(nextState.toasts || []),
      {
        id: toastId,
        messageKey: 'ui:toast.blacklisted',
        options: { venueLabel: `venues:${venueId}.name` },
        type: 'error'
      }
    ]
  }
  return nextState
}

export const handleMerchPress = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  if (!payload || typeof payload !== 'object') {
    logger.warn('GameState', 'Invalid payload for MERCH_PRESS')
    return state
  }

  const cost = Math.max(0, Number(payload.cost) || 0)
  const loyaltyGain = Number(payload.loyaltyGain) || 0
  const controversyGain = Number(payload.controversyGain) || 0
  const harmonyCost = Math.max(0, Number(payload.harmonyCost) || 0)
  const fameGain = Math.max(0, Number(payload.fameGain) || 0)
  const successToast = payload.successToast

  const currentMoney = Number(state.player.money) || 0
  const currentHarmony = Number(state.band.harmony) || 0

  if (currentMoney < cost || currentHarmony < harmonyCost) {
    logger.warn('GameState', 'Insufficient funds or harmony for merch press')
    return state
  }

  const currentLoyalty = Number(state.social.loyalty) || 0
  const currentControversy = Number(state.social.controversyLevel) || 0
  const currentFame = Number(state.player.fame) || 0

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextLoyalty = Math.max(0, Math.min(100, currentLoyalty + loyaltyGain))
  const nextControversy = Math.max(
    0,
    Math.min(100, currentControversy + controversyGain)
  )
  const nextFame = clampPlayerFame(currentFame + fameGain)

  const nextState = {
    ...state,
    player: {
      ...state.player,
      money: nextMoney,
      fame: nextFame,
      fameLevel: calculateFameLevel(nextFame)
    },
    band: {
      ...state.band,
      harmony: nextHarmony
    },
    social: {
      ...state.social,
      loyalty: nextLoyalty,
      controversyLevel: nextControversy
    }
  }

  // Inventory rewards removed based on feedback that they are unused/orphaned
  // and do not add gameplay value.

  if (successToast) {
    const deltaLoyalty = nextLoyalty - currentLoyalty
    const deltaControversy = nextControversy - currentControversy
    const deltaHarmony = nextHarmony - currentHarmony
    const deltaFame = nextFame - currentFame
    const actualCost = currentMoney - nextMoney

    const safeToast = sanitizeSuccessToast(successToast, {
      fallbackId: getSafeUUID(),
      optionsPatch: {
        deltaLoyalty,
        deltaControversy,
        deltaHarmony,
        deltaFame,
        cost: actualCost
      }
    })
    if (safeToast) {
      nextState.toasts = [...(state.toasts || []), safeToast]
    }
  }

  return nextState
}

export const handlePirateBroadcast = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  if (!payload || typeof payload !== 'object') {
    logger.warn('GameState', 'Invalid payload for PIRATE_BROADCAST')
    return state
  }

  const cost = Number(payload.cost)
  const fameGain = Number(payload.fameGain) || 0
  const zealotryGain = Number(payload.zealotryGain) || 0
  const controversyGain = Number(payload.controversyGain) || 0
  const harmonyCost = Number(payload.harmonyCost)
  const successToast = payload.successToast

  if (!Number.isFinite(cost) || cost < 0) {
    logger.warn('GameState', 'Invalid pirate broadcast cost payload')
    return state
  }
  if (!Number.isFinite(harmonyCost) || harmonyCost < 0) {
    logger.warn('GameState', 'Invalid pirate broadcast harmonyCost payload')
    return state
  }

  const currentMoney = Number(state.player.money)
  const currentHarmony = Number(state.band.harmony)
  if (
    !Number.isFinite(currentMoney) ||
    !Number.isFinite(currentHarmony) ||
    currentMoney < 0 ||
    currentHarmony < 0
  ) {
    logger.warn('GameState', 'Invalid player funds or harmony state')
    return state
  }

  if (state.social.lastPirateBroadcastDay === state.player.day) {
    logger.warn('GameState', 'Pirate broadcast already triggered today')
    return state
  }

  if (currentMoney < cost || currentHarmony < harmonyCost) {
    logger.warn('GameState', 'Insufficient funds or harmony for broadcast')
    return state
  }

  const currentFame = Number(state.player.fame) || 0
  const currentZealotry = Number(state.social.zealotry) || 0
  const currentControversy = Number(state.social.controversyLevel) || 0

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextFame = clampPlayerFame(currentFame + fameGain)
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
      fame: nextFame,
      fameLevel: calculateFameLevel(nextFame)
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

    const safeToast = sanitizeSuccessToast(successToast, {
      fallbackId: getSafeUUID(),
      optionsPatch: {
        deltaFame,
        deltaZealotry,
        deltaControversy,
        deltaHarmony,
        cost: actualCost
      }
    })
    if (safeToast) {
      nextState.toasts = [...(state.toasts || []), safeToast]
    }
  }

  return nextState
}

export const handleDarkWebLeak = (state, payload) => {
  if (!payload || typeof payload !== 'object') {
    logger.warn('GameState', 'Invalid payload for DARK_WEB_LEAK')
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

  if (currentMoney < cost || currentHarmony < harmonyCost) {
    logger.warn('GameState', 'Insufficient funds or harmony for dark web leak')
    return state
  }

  const currentFame = Number(state.player.fame) || 0
  const currentZealotry = Number(state.social.zealotry) || 0
  const currentControversy = Number(state.social.controversyLevel) || 0

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextFame = clampPlayerFame(currentFame + fameGain)
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
      fame: nextFame,
      fameLevel: calculateFameLevel(nextFame)
    },
    band: {
      ...state.band,
      harmony: nextHarmony
    },
    social: {
      ...state.social,
      zealotry: nextZealotry,
      controversyLevel: nextControversy,
      lastDarkWebLeakDay: state.player.day || 0
    }
  }

  if (successToast) {
    const deltaFame = nextFame - currentFame
    const deltaZealotry = nextZealotry - currentZealotry
    const deltaControversy = nextControversy - currentControversy
    const messages = []

    if (deltaFame > 0) messages.push(`FAME +${deltaFame}`)
    if (deltaZealotry > 0) messages.push(`ZEALOTRY +${deltaZealotry}`)
    if (deltaControversy > 0) messages.push(`CONTROVERSY +${deltaControversy}`)
    if (harmonyCost > 0) messages.push(`HARMONY -${harmonyCost}`)

    nextState.toasts = [
      ...(state.toasts || []),
      {
        ...successToast,
        message: `${successToast.message} (${messages.join(' | ')})`
      }
    ]
  }

  return nextState
}
