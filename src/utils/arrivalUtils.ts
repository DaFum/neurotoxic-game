import { logger } from './logger'
import { handleError } from './errorHandler'
import { GAME_PHASES } from '../context/gameConstants'
import {
  clampMemberStamina,
  clampMemberMood,
  clampPlayerFame,
  calculateFameLevel,
  clampBandHarmony,
  BALANCE_CONSTANTS
} from './gameStateUtils'
import { secureRandom } from './crypto'
import i18n from '../i18n'
import { normalizeVenueId } from './mapUtils'
import { VENUES_BY_ID } from '../data/venues'
import type { BandState, MapNode, PlayerState, Venue } from '../types/game'

type ArrivalNode = Omit<Partial<MapNode>, 'type' | 'venue'> & {
  type: string
  venue?: unknown
}

type GigArrivalNode = ArrivalNode & {
  type: 'GIG' | 'FESTIVAL' | 'FINALE'
}

const isArrivalVenueObject = (value: unknown): value is Venue => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return typeof (value as { name?: unknown }).name === 'string'
}

const resolveArrivalVenue = (node: ArrivalNode): Venue | null => {
  if (isArrivalVenueObject(node.venue)) return node.venue

  const venueId =
    normalizeVenueId(node.venue) ??
    (typeof node.venueId === 'string' ? normalizeVenueId(node.venueId) : null)
  if (!venueId) return null

  return VENUES_BY_ID.get(venueId) ?? null
}

export type ArrivalResult = {
  /** Scene to navigate to after processing. Hook is responsible for calling changeScene. */
  scene: import('../types/game').GamePhase
  /** True when startGig was called successfully. Hook must not call changeScene when true. */
  gigStarted: boolean
}

/**
 * Shared logic for handling arrival at a map node.
 * This can be used by both the legacy travel system and the new arrival logic hook.
 *
 * @param {object} params
 * @param {object} params.node - The node being arrived at.
 * @param {object} params.band - Current band state.
 * @param {object} params.player - Current player state (inventory, stats, etc.).
 * @param {Function} params.updateBand - Function to update band state.
 * @param {Function} params.updatePlayer - Function to update player state (handles side effects).
 * @param {Function} params.triggerEvent - Function to trigger events.
 * @param {Function} params.startGig - Function to start a gig.
 * @param {Function} params.addToast - Function to show notifications.
 * @param {Function} [params.changeScene] - Function to change scene (fallback).
 * @param {Function} [params.onShowHQ] - Optional callback to show HQ (for START node).
 * @param {boolean} [params.eventAlreadyActive=false] - Whether an event is already active (to prevent stacking).
 * @param {Function} [params.rng=secureRandom] - RNG function for probabilistic outcomes.
 */
/**
 * Calculates new harmony value if band has harmony regen active.
 * @param {object} band - The current band state.
 * @returns {number|null} The new harmony value, or null if regen is not applicable.
 */
export const processHarmonyRegen = (
  band: Pick<BandState, 'harmony' | 'harmonyRegenTravel'> | null | undefined
): number | null => {
  if (band?.harmonyRegenTravel) {
    return clampBandHarmony((band.harmony ?? 0) + 5)
  }
  return null
}

/**
 * Checks if the current node is a gig node.
 * @param {object} node - The current node.
 * @returns {boolean} True if the node is a GIG, FESTIVAL, or FINALE.
 */
export const isGigNode = (
  node: ArrivalNode | null | undefined
): node is GigArrivalNode => {
  return (
    node?.type === 'GIG' || node?.type === 'FESTIVAL' || node?.type === 'FINALE'
  )
}

/**
 * Triggers travel events if applicable for the current node.
 * @param {object} node - The current node.
 * @param {Function} triggerEvent - The function to trigger events.
 * @returns {boolean} True if a travel event was triggered.
 */
export const processTravelEvents = (
  node: ArrivalNode | null | undefined,
  triggerEvent: (category: string, triggerPoint?: string) => boolean
): boolean => {
  if (isGigNode(node)) {
    return false
  }

  let travelEventActive = triggerEvent('transport', 'travel')
  if (!travelEventActive) {
    travelEventActive = triggerEvent('band', 'travel')
  }
  return travelEventActive
}

type HandleNodeArrivalParams = {
  node: ArrivalNode
  band: BandState
  player: PlayerState
  updateBand: (p: Partial<BandState>) => void
  updatePlayer: (p: Partial<PlayerState>) => void
  triggerEvent: (category: string, triggerPoint?: string) => boolean
  startGig: (venue: Venue) => void
  addToast: (msg: string, level?: string) => void
  onShowHQ?: () => void
  eventAlreadyActive?: boolean
  rng?: () => number
}

export const handleNodeArrival = (
  params: HandleNodeArrivalParams
): ArrivalResult => {
  const {
    node,
    band,
    player,
    updateBand,
    updatePlayer,
    triggerEvent,
    startGig,
    addToast,
    onShowHQ,
    eventAlreadyActive = false,
    rng = secureRandom
  } = params
  switch (node.type) {
    case 'REST_STOP': {
      const members = band?.members ?? []
      const newMembers = new Array(members.length)
      for (let i = 0; i < members.length; i++) {
        const m = members[i]
        const newStamina = clampMemberStamina(m.stamina + 20, m.staminaMax)
        const newMood = clampMemberMood(m.mood + 10)
        newMembers[i] = {
          ...m,
          stamina: newStamina,
          mood: newMood
        }
      }
      updateBand({ members: newMembers })
      addToast(
        i18n.t('ui:arrival.restedAtStop', {
          defaultValue: 'Rested at stop. Band feels better.'
        }),
        'success'
      )
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
    case 'SPECIAL': {
      if (!eventAlreadyActive) {
        const specialEvent = triggerEvent('special')
        if (!specialEvent) {
          addToast(
            i18n.t('ui:arrival.specialNothingHappened', {
              defaultValue: 'A mysterious place, but nothing happened.'
            }),
            'info'
          )
        }
      }
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
    case 'START': {
      if (onShowHQ) onShowHQ()
      addToast(
        i18n.t('ui:arrival.homeSweetHome', {
          defaultValue: 'Home Sweet Home.'
        }),
        'success'
      )
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
    case 'FESTIVAL':
    case 'FINALE':
    case 'GIG': {
      const harmony = clampBandHarmony(band?.harmony)

      // Show cancellation check: Deterministic for harmony <= 1, probabilistic for low harmony (Chaos Tour Mechanic)
      const isLowHarmony = harmony < BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD
      const luckCheck =
        rng() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE
      const shouldCancel = harmony <= 1 || (isLowHarmony && luckCheck)

      if (shouldCancel) {
        addToast(
          i18n.t('ui:arrival.showCancelled', {
            defaultValue:
              'Show cancelled! The band refused to go on stage due to low harmony.'
          }),
          'error'
        )

        // Apply fame penalty directly (double the standard bad gig loss)
        if (player && updatePlayer) {
          const currentFame = player.fame || 0
          const loss = BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG * 2
          const newFame = clampPlayerFame(currentFame - loss)
          updatePlayer({
            fame: newFame,
            fameLevel: calculateFameLevel(newFame)
          })
        }

        return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
      }

      const venue = resolveArrivalVenue(node)
      if (!venue) {
        addToast(
          i18n.t('ui:errors.invalidVenueData', {
            defaultValue: 'Invalid venue data.'
          }),
          'error'
        )
        return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
      }

      logger.info('ArrivalLogic', 'Starting Gig at destination', {
        venue: venue.name
      })
      try {
        startGig(venue)
        return { scene: GAME_PHASES.OVERWORLD, gigStarted: true }
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:arrival.failedToStartGig', {
            defaultValue: 'Failed to start Gig.'
          })
        })
        return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
      }
    }
    default: {
      logger.warn(
        'ArrivalLogic',
        'Unhandled node type — routing to OVERWORLD',
        { type: (node as ArrivalNode).type }
      )
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
  }
}
