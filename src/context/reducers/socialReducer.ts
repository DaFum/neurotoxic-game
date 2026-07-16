import i18n from '../../i18n'
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
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampPlayerFame,
  calculateFameLevel,
  clampLoyalty,
  clampZealotry,
  clampControversyLevel,
  clampNonNegative,
  isFiniteNumber,
  finiteNumberOr
} from '../../utils/gameState'
import {
  sanitizeSuccessToast,
  buildDeterministicToastId
} from './toastSanitizers'
import { QuestEvents } from '../../utils/questProgress'
import {
  createSocialControversyChangedQuestEvent,
  createSocialLoyaltyChangedQuestEvent,
  createSocialTrendMatchedQuestEvent
} from '../../quests/producers/socialQuestEvents'
import {
  createBrandDealFailedQuestEvent,
  createBrandTrustChangedQuestEvent
} from '../../quests/producers/brandQuestEvents'
import {
  createVenueBlacklistedQuestEvent,
  createVenueUnblacklistedQuestEvent
} from '../../quests/producers/venueQuestEvents'
import { VENUES_BY_ID } from '../../data/venues'
import { isForbiddenKey } from '../../utils/objectUtils'

/** Controversy at or above this voids active brand deals. */
const DEAL_BREAK_CONTROVERSY = 85
/** Brand trust lost with each deal that collapses under controversy. */
const DEAL_BREAK_TRUST_PENALTY = 10

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
 *
 * @remarks
 * Currency values in `optionsPatch` must be preformatted with
 * `formatCurrency(value, i18n.language, signDisplay)` before dispatch because
 * toast options are baked into state.
 */
const appendDeltaSuccessToast = (
  nextState: GameState,
  successToast: unknown,
  prevToasts: GameState['toasts'] | undefined,
  optionsPatch: Record<string, number | string>
): void => {
  if (!successToast) return
  // Action creators stamp toast UUIDs; this fallback only covers malformed
  // direct dispatches and must stay deterministic (reducer purity).
  const safeToast = sanitizeSuccessToast(successToast, {
    fallbackId: buildDeterministicToastId('social-toast', prevToasts),
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
 * Assembles the post-action state shared by merch-press and zealotry-style
 * social actions: identical player (money/fame/fameLevel) and band (harmony)
 * updates, with a caller-provided social slice.
 *
 * @param state - Game state before the action.
 * @param updates - Clamped money/fame/harmony values and the fully built social slice.
 * @returns State with player, band, and social updates merged.
 */
const buildSocialActionNextState = (
  state: GameState,
  updates: { money: number; fame: number; harmony: number; social: SocialState }
): GameState => ({
  ...state,
  player: {
    ...state.player,
    money: updates.money,
    fame: updates.fame,
    fameLevel: calculateFameLevel(updates.fame)
  },
  band: {
    ...state.band,
    harmony: updates.harmony
  },
  social: updates.social
})

/**
 * Merges sanitized social-state updates while preserving reducer-owned clamps and validation.
 *
 * @param state - Game state before the social patch.
 * @param payload - Partial social patch or updater function. Numeric fields,
 * active deals, and trend data are normalized before merge.
 * @returns State with social updates merged, or the original state when the
 * payload is invalid.
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
    updates.zealotry = clampZealotry(
      finiteNumberOr(Number(updates.zealotry), 0)
    )
  }

  if (updates.loyalty !== undefined) {
    updates.loyalty = clampLoyalty(finiteNumberOr(Number(updates.loyalty), 0))
  }

  if (updates.controversyLevel !== undefined) {
    updates.controversyLevel = clampControversyLevel(
      finiteNumberOr(Number(updates.controversyLevel), 0)
    )
  }

  if (updates.activeDeals !== undefined) {
    if (!Array.isArray(updates.activeDeals)) {
      logger.warn('GameState', 'Invalid activeDeals update (must be array)')
      delete updates.activeDeals
    } else {
      // Validate structure of items
      const validDeals = updates.activeDeals.filter((d: unknown) => {
        if (!d || typeof d !== 'object') return false
        const deal = d as Record<string, unknown>
        // Own-property checks before reading untrusted fields so inherited
        // prototype-chain values can't pass validation (project convention).
        if (
          !Object.hasOwn(deal, 'id') ||
          !Object.hasOwn(deal, 'remainingGigs')
        ) {
          return false
        }
        const { id, remainingGigs } = deal
        return (
          typeof id === 'string' &&
          typeof remainingGigs === 'number' &&
          Number.isInteger(remainingGigs) &&
          remainingGigs > 0
        )
      })
      if (validDeals.length !== updates.activeDeals.length) {
        logger.warn(
          'GameState',
          'Filtered invalid deals from activeDeals update'
        )
      }
      updates.activeDeals = validDeals
    }
  }

  let nextState: GameState = {
    ...state,
    social: { ...state.social, ...updates }
  }

  if (updates.loyalty !== undefined) {
    const amount = nextState.social.loyalty - state.social.loyalty
    if (amount !== 0) {
      nextState = QuestEvents.emit(
        nextState,
        createSocialLoyaltyChangedQuestEvent({
          amount,
          reason: 'update_social'
        })
      )
    }
  }
  if (updates.controversyLevel !== undefined) {
    const amount =
      nextState.social.controversyLevel - state.social.controversyLevel
    if (amount !== 0) {
      nextState = QuestEvents.emit(
        nextState,
        createSocialControversyChangedQuestEvent({
          amount,
          reason: 'update_social'
        })
      )
    }
  }
  if (
    updates.trend !== undefined &&
    nextState.social.trend !== state.social.trend
  ) {
    nextState = QuestEvents.emit(
      nextState,
      createSocialTrendMatchedQuestEvent({ trendId: nextState.social.trend })
    )
  }

  // Sponsors abandon a band that becomes too toxic. When this update pushes
  // controversy across the break threshold, every active brand deal collapses
  // and reports as failed. Crossing-only so deals added at high controversy by
  // other flows are not retroactively voided.
  const prevControversy = clampControversyLevel(
    finiteNumberOr(state.social.controversyLevel, 0)
  )
  const nextControversy = clampControversyLevel(
    finiteNumberOr(nextState.social.controversyLevel, 0)
  )
  const activeDeals = nextState.social.activeDeals
  if (
    prevControversy < DEAL_BREAK_CONTROVERSY &&
    nextControversy >= DEAL_BREAK_CONTROVERSY &&
    Array.isArray(activeDeals) &&
    activeDeals.length > 0
  ) {
    const brokenDeals = activeDeals
    // Burned trust: each broken deal drags down the brand's reputation.
    const nextBrandReputation = { ...(nextState.social.brandReputation || {}) }
    for (const deal of brokenDeals) {
      const alignment =
        deal && typeof deal === 'object' && typeof deal.alignment === 'string'
          ? deal.alignment
          : undefined
      if (alignment && !isForbiddenKey(alignment)) {
        nextBrandReputation[alignment] = Math.max(
          0,
          finiteNumberOr(nextBrandReputation[alignment], 0) -
            DEAL_BREAK_TRUST_PENALTY
        )
      }
    }
    nextState = {
      ...nextState,
      social: {
        ...nextState.social,
        activeDeals: [],
        brandReputation: nextBrandReputation
      },
      toasts: [
        ...(nextState.toasts || []),
        {
          // Deterministic id keeps the reducer pure (no RNG in reducers).
          id: buildDeterministicToastId('deals-broken-toast', nextState.toasts),
          messageKey: 'ui:toast.dealsBroken',
          type: 'error'
        }
      ]
    }
    for (const deal of brokenDeals) {
      const dealId =
        deal && typeof deal === 'object' && typeof deal.id === 'string'
          ? deal.id
          : 'unknown'
      const alignment =
        deal && typeof deal === 'object' && typeof deal.alignment === 'string'
          ? deal.alignment
          : undefined
      nextState = QuestEvents.emit(
        nextState,
        createBrandDealFailedQuestEvent({ dealId, reason: 'controversy' })
      )
      if (alignment) {
        nextState = QuestEvents.emit(
          nextState,
          createBrandTrustChangedQuestEvent({
            brandId: alignment,
            amount: -DEAL_BREAK_TRUST_PENALTY
          })
        )
      }
    }
  }

  return nextState
}

const VENUE_DEFENSE_LOYALTY_THRESHOLD = 30
const VENUE_DEFENSE_LOYALTY_COST = 15

/**
 * Blacklists a venue after a bad gig unless fan loyalty absorbs the penalty.
 *
 * @param state - Current game state before blacklist handling.
 * @param venueId - Venue id to blacklist.
 * @param toastId - Toast id to use for player feedback.
 * @returns Updated state with a blacklist entry or loyalty-defense side effect.
 */
export const handleAddVenueBlacklist = (
  state: GameState,
  { venueId, toastId }: { venueId: string; toastId: string }
): GameState => {
  const nextState = { ...state }
  // Intentional design: when loyalty is high enough, loyal fans defend the
  // band and prevent the venue from blacklisting them, at the cost of some
  // loyalty points.
  if (nextState.social.loyalty >= VENUE_DEFENSE_LOYALTY_THRESHOLD) {
    nextState.social = {
      ...nextState.social,
      loyalty: nextState.social.loyalty - VENUE_DEFENSE_LOYALTY_COST
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
    return QuestEvents.emit(
      nextState,
      createVenueBlacklistedQuestEvent({ venueId, reason: 'low_loyalty' })
    )
  }
  return nextState
}

const UNBLACKLIST_BASE_COST = 250
const UNBLACKLIST_COST_PER_CAPACITY = 2

/**
 * Calculates the amends cost required to remove a venue from the blacklist.
 *
 * Bigger rooms have longer memories, so the fee scales with capacity on top
 * of a flat base.
 *
 * @param venueId - Venue id to price.
 * @returns Currency cost to unblacklist the venue.
 */
export const getUnblacklistCost = (venueId: string): number => {
  const venue = VENUES_BY_ID.get(venueId)
  const capacity =
    venue && isFiniteNumber(venue.capacity) ? Math.max(0, venue.capacity) : 0
  return UNBLACKLIST_BASE_COST + capacity * UNBLACKLIST_COST_PER_CAPACITY
}

/**
 * Pays amends to remove a venue from the blacklist and emits venue quest progress.
 *
 * @param state - Current game state before amends are paid.
 * @param venueId - Venue id to unblacklist.
 * @param toastId - Toast id for feedback.
 * @returns Updated state with money deducted and venue removed, or feedback when amends are unavailable.
 */
export const handleUnblacklistVenue = (
  state: GameState,
  { venueId, toastId }: { venueId: string; toastId: string }
): GameState => {
  const blacklist = state.venueBlacklist ?? []
  if (!venueId || !blacklist.includes(venueId)) {
    return state
  }

  const cost = getUnblacklistCost(venueId)
  const currentMoney = clampPlayerMoney(state.player.money)
  if (currentMoney !== state.player.money) {
    logger.warn('GameState', 'Invalid player funds state for unblacklist')
    return state
  }

  if (currentMoney < cost) {
    return {
      ...state,
      toasts: [
        ...(state.toasts || []),
        {
          id: toastId,
          messageKey: 'ui:toast.amendsTooExpensive',
          options: {
            venueLabel: `venues:${venueId}.name`,
            amount: formatCurrency(cost, i18n.language)
          },
          type: 'error'
        }
      ]
    }
  }

  const nextState: GameState = {
    ...state,
    player: { ...state.player, money: clampPlayerMoney(currentMoney - cost) },
    venueBlacklist: blacklist.filter(id => id !== venueId),
    toasts: [
      ...(state.toasts || []),
      {
        id: toastId,
        messageKey: 'ui:toast.amendsMade',
        options: { venueLabel: `venues:${venueId}.name` },
        type: 'success'
      }
    ]
  }

  return QuestEvents.emit(
    nextState,
    createVenueUnblacklistedQuestEvent({ venueId, reason: 'amends' })
  )
}

/**
 * Runs a merch press campaign that trades money and harmony for loyalty, fame, and controversy changes.
 *
 * @param state - Current game state before the merch press.
 * @param payload - Merch press costs, gains, and optional success toast.
 * @returns Updated state with clamped social/player/band deltas, or the original state when validation fails.
 */
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

  const cost = clampNonNegative(parsedCost)
  const loyaltyGain = parsedLoyaltyGain
  const controversyGain = parsedControversyGain
  const harmonyCost = clampNonNegative(parsedHarmonyCost)
  const fameGain = clampNonNegative(parsedFameGain)
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

  const currentLoyalty = finiteNumberOr(state.social.loyalty, 0)
  const currentControversy = finiteNumberOr(state.social.controversyLevel, 0)
  const currentFame = finiteNumberOr(state.player.fame, 0)

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextLoyalty = clampLoyalty(currentLoyalty + loyaltyGain)
  const nextControversy = clampControversyLevel(
    currentControversy + controversyGain
  )
  const nextFame = clampPlayerFame(currentFame + fameGain)

  const nextState = buildSocialActionNextState(state, {
    money: nextMoney,
    fame: nextFame,
    harmony: nextHarmony,
    social: {
      ...state.social,
      loyalty: nextLoyalty,
      controversyLevel: nextControversy
    }
  })

  appendDeltaSuccessToast(nextState, successToast, state.toasts, {
    deltaLoyalty: nextLoyalty - currentLoyalty,
    deltaControversy: nextControversy - currentControversy,
    deltaHarmony: nextHarmony - currentHarmony,
    deltaFame: nextFame - currentFame,
    cost: formatCurrency(nextMoney - currentMoney, i18n.language, 'always')
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

  const currentFame = finiteNumberOr(state.player.fame, 0)
  const currentZealotry = finiteNumberOr(state.social.zealotry, 0)
  const currentControversy = finiteNumberOr(state.social.controversyLevel, 0)

  const nextMoney = clampPlayerMoney(currentMoney - cost)
  const nextHarmony = clampBandHarmony(currentHarmony - harmonyCost)
  const nextFame = clampPlayerFame(currentFame + fameGain)
  const nextZealotry = clampZealotry(currentZealotry + zealotryGain)
  const nextControversy = clampControversyLevel(
    currentControversy + controversyGain
  )

  const nextState = buildSocialActionNextState(state, {
    money: nextMoney,
    fame: nextFame,
    harmony: nextHarmony,
    social: {
      ...state.social,
      zealotry: nextZealotry,
      controversyLevel: nextControversy,
      [dayField]: playerDay
    }
  })

  appendDeltaSuccessToast(nextState, successToast, state.toasts, {
    deltaFame: nextFame - currentFame,
    deltaZealotry: nextZealotry - currentZealotry,
    deltaControversy: nextControversy - currentControversy,
    deltaHarmony: nextHarmony - currentHarmony,
    cost: formatCurrency(nextMoney - currentMoney, i18n.language, 'always')
  })

  return nextState
}

/**
 * Applies the once-per-day pirate broadcast social action.
 *
 * @param state - Current game state before the broadcast.
 * @param payload - Broadcast cost, optional gains, harmony cost, and optional success toast.
 * @returns Updated state with zealotry-style deltas, or the original state when validation or cooldown checks fail.
 */
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

/**
 * Applies the once-per-day dark-web leak social action.
 *
 * @param state - Current game state before the leak.
 * @param payload - Required leak cost and gains, harmony cost, and optional success toast.
 * @returns Updated state with zealotry-style deltas, or the original state when validation or cooldown checks fail.
 */
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
