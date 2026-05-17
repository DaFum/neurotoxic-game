import { formatCurrency } from '../../utils/numberUtils'
import type {
  GameState,
  SocialState,
  MerchPressPayload,
  PirateBroadcastPayload,
  DarkWebLeakPayload
} from '../../types'
import { logger } from '../../utils/logger'
import { ALLOWED_TRENDS } from '../../data/socialTrends'
import { getSafeUUID } from '../../utils/crypto'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampPlayerFame,
  calculateFameLevel,
  clampLoyalty,
  clampZealotry,
  clampControversyLevel
} from '../../utils/gameStateUtils'
import { sanitizeSuccessToast } from './toastSanitizers'

type ZealotryPayloadParsed = {
  cost: number
  fameGain: number
  zealotryGain: number
  controversyGain: number
  harmonyCost: number
}

/**
 * Parses and validates the numeric fields shared by pirate-broadcast and
 * dark-web-leak payloads. Returns null when any required field is invalid
 * (non-finite or negative) - callers should bail with the unchanged state.
 *
 * `optionalGainFields` lets pirate-broadcast treat its fameGain / zealotryGain
 * / controversyGain as optional (defaulting to 0 when missing) while still
 * validating the value when present.
 */
const parseZealotryActionPayload = (
  payload: {
    cost?: unknown
    fameGain?: unknown
    zealotryGain?: unknown
    controversyGain?: unknown
    harmonyCost?: unknown
  },
  optionalGainFields = false
): ZealotryPayloadParsed | null => {
  if (!payload || typeof payload !== 'object') return null
  const parsedCost = Number(payload.cost)
  const parsedFameGain = Number(payload.fameGain)
  const parsedZealotryGain = Number(payload.zealotryGain)
  const parsedControversyGain = Number(payload.controversyGain)
  const parsedHarmonyCost = Number(payload.harmonyCost)

  const requireGain = (raw: unknown, parsed: number): boolean =>
    optionalGainFields
      ? raw != null && (!Number.isFinite(parsed) || parsed < 0)
      : !Number.isFinite(parsed) || parsed < 0

  if (
    !Number.isFinite(parsedCost) ||
    parsedCost < 0 ||
    requireGain(payload.fameGain, parsedFameGain) ||
    requireGain(payload.zealotryGain, parsedZealotryGain) ||
    requireGain(payload.controversyGain, parsedControversyGain) ||
    !Number.isFinite(parsedHarmonyCost) ||
    parsedHarmonyCost < 0
  ) {
    return null
  }

  return {
    cost: parsedCost,
    fameGain:
      optionalGainFields && payload.fameGain == null ? 0 : parsedFameGain,
    zealotryGain:
      optionalGainFields && payload.zealotryGain == null
        ? 0
        : parsedZealotryGain,
    controversyGain:
      optionalGainFields && payload.controversyGain == null
        ? 0
        : parsedControversyGain,
    harmonyCost: parsedHarmonyCost
  }
}

/**
 * Builds a sanitized success toast (with deltas patched in) and appends it
 * to `nextState.toasts` when present. No-op when `successToast` is falsy.
 */
const appendDeltaSuccessToast = (
  nextState: GameState,
  successToast: unknown,
  prevToasts: GameState['toasts'] | undefined,
  optionsPatch: Record<string, number>
): void => {
  if (!successToast) return
  const safeToast = sanitizeSuccessToast(successToast, {
    fallbackId: getSafeUUID(),
    optionsPatch
  })
  if (safeToast) {
    nextState.toasts = [...(prevToasts || []), safeToast]
  }
}

/**
 * Validates state.player.money and state.band.harmony are within expected
 * bounds for zealotry-style actions. Returns the parsed numbers, or null when
 * the state itself is corrupted - callers should bail with unchanged state.
 */
const readPlayerFundsAndHarmony = (
  state: GameState
): { money: number; harmony: number } | null => {
  const money = Number(state.player.money)
  const harmony = Number(state.band.harmony)
  if (
    !Number.isFinite(money) ||
    !Number.isFinite(harmony) ||
    money < 0 ||
    harmony < 1 ||
    harmony > 100
  ) {
    return null
  }
  return { money, harmony }
}

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
    updates.zealotry = clampZealotry(Number(updates.zealotry) || 0)
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
  const nextState = { ...state }
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
  payload: MerchPressPayload
): GameState => {
  const parsedCost = Number(payload.cost)
  const parsedLoyaltyGain = Number(payload.loyaltyGain)
  const parsedControversyGain = Number(payload.controversyGain)
  const parsedHarmonyCost = Number(payload.harmonyCost)
  const parsedFameGain = payload.fameGain == null ? 0 : Number(payload.fameGain)
  if (
    !Number.isFinite(parsedCost) ||
    !Number.isFinite(parsedLoyaltyGain) ||
    !Number.isFinite(parsedControversyGain) ||
    !Number.isFinite(parsedHarmonyCost) ||
    !Number.isFinite(parsedFameGain)
  ) {
    logger.warn('GameState', 'Invalid numeric payload for MERCH_PRESS')
    return state
  }

  const cost = Math.max(0, parsedCost)
  const loyaltyGain = parsedLoyaltyGain
  const controversyGain = parsedControversyGain
  const harmonyCost = Math.max(0, parsedHarmonyCost)
  const fameGain = Math.max(0, parsedFameGain)
  const successToast = payload.successToast

  const currentMoney = clampPlayerMoney(state.player.money)
  const currentHarmony = clampBandHarmony(state.band.harmony)

  if (
    currentMoney !== state.player.money ||
    currentHarmony !== state.band.harmony
  ) {
    logger.warn('GameState', 'Invalid player funds or harmony state')
    return state
  }

  if (currentMoney < cost || currentHarmony < harmonyCost) {
    logger.warn('GameState', 'Insufficient funds or harmony for merch press')
    return state
  }

  const currentLoyalty = Number(state.social.loyalty) || 0
  const currentControversy = Number(state.social.controversyLevel) || 0
  const currentFame = Number(state.player.fame) || 0

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextLoyalty = clampLoyalty(currentLoyalty + loyaltyGain)
  const nextControversy = clampControversyLevel(
    currentControversy + controversyGain
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

  appendDeltaSuccessToast(nextState, successToast, state.toasts, {
    deltaLoyalty: nextLoyalty - currentLoyalty,
    deltaControversy: nextControversy - currentControversy,
    deltaHarmony: nextHarmony - currentHarmony,
    deltaFame: nextFame - currentFame,
    cost: currentMoney - nextMoney
  })

  return nextState
}

type ZealotryDayField = 'lastPirateBroadcastDay' | 'lastDarkWebLeakDay'

const applyZealotryAction = (
  state: GameState,
  payload: PirateBroadcastPayload | DarkWebLeakPayload | null | undefined,
  dayField: ZealotryDayField,
  options: {
    optionalGainFields: boolean
    duplicateLogMessage: string
    insufficientLogMessage: string
    invalidLogMessage: string
    invalidPayloadShapeLogMessage?: string
  }
): GameState => {
  const playerDay = Number.isFinite(state.player.day)
    ? (state.player.day as number)
    : 0

  // Payload-shape validation runs first so a malformed payload sent on the
  // same day as a successful broadcast logs an "invalid payload" warning
  // (not the misleading "already triggered today") for debuggability.
  if (options.invalidPayloadShapeLogMessage) {
    if (!payload || typeof payload !== 'object') {
      logger.warn('GameState', options.invalidPayloadShapeLogMessage)
      return state
    }
  }

  if (!payload) {
    logger.warn('GameState', options.invalidLogMessage)
    return state
  }

  const parsed = parseZealotryActionPayload(payload, options.optionalGainFields)
  if (!parsed) {
    logger.warn('GameState', options.invalidLogMessage)
    return state
  }

  if (state.social[dayField] === playerDay) {
    logger.warn('GameState', options.duplicateLogMessage)
    return state
  }

  const { cost, fameGain, zealotryGain, controversyGain, harmonyCost } = parsed
  const successToast = payload.successToast

  const funds = readPlayerFundsAndHarmony(state)
  if (!funds) {
    logger.warn('GameState', 'Invalid player funds or harmony state')
    return state
  }
  const currentMoney = funds.money
  const currentHarmony = funds.harmony

  if (currentMoney < cost || currentHarmony < harmonyCost) {
    logger.warn('GameState', options.insufficientLogMessage)
    return state
  }

  const currentFame = Number(state.player.fame) || 0
  const currentZealotry = Number(state.social.zealotry) || 0
  const currentControversy = Number(state.social.controversyLevel) || 0

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextFame = clampPlayerFame(currentFame + fameGain)
  const nextZealotry = clampZealotry(currentZealotry + zealotryGain)
  const nextControversy = clampControversyLevel(
    currentControversy + controversyGain
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
      [dayField]: playerDay
    }
  }

  appendDeltaSuccessToast(nextState, successToast, state.toasts, {
    deltaFame: nextFame - currentFame,
    deltaZealotry: nextZealotry - currentZealotry,
    deltaControversy: nextControversy - currentControversy,
    deltaHarmony: nextHarmony - currentHarmony,
    cost: currentMoney - nextMoney
  })

  return nextState
}

export const handlePirateBroadcast = (
  state: GameState,
  payload: PirateBroadcastPayload
): GameState =>
  applyZealotryAction(state, payload, 'lastPirateBroadcastDay', {
    optionalGainFields: true,
    duplicateLogMessage: 'Pirate broadcast already triggered today',
    insufficientLogMessage: 'Insufficient funds or harmony for broadcast',
    invalidLogMessage: 'Invalid pirate broadcast payload'
  })

export const handleDarkWebLeak = (
  state: GameState,
  payload: DarkWebLeakPayload | null | undefined
): GameState =>
  applyZealotryAction(state, payload, 'lastDarkWebLeakDay', {
    optionalGainFields: false,
    duplicateLogMessage: 'Dark web leak already triggered today',
    insufficientLogMessage: 'Insufficient funds or harmony for dark web leak',
    invalidLogMessage: 'Invalid dark web leak payload',
    invalidPayloadShapeLogMessage: 'Invalid payload for DARK_WEB_LEAK'
  })
