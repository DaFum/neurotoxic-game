import { logger } from './logger'
import { handleError } from './errorHandler'
import { GAME_PHASES } from '../context/gameConstants'
import {
  clampMemberStamina,
  clampMemberMood,
  clampPlayerFame,
  calculateFameLevel,
  clampBandHarmony,
  BALANCE_CONSTANTS,
  finiteNumberOr
} from './gameState'
import { secureRandom } from './crypto'
import i18n from '../i18n'
import { normalizeVenueId } from './mapUtils'
import { clampUnit } from './numberUtils'
import { VENUES_BY_ID } from '../data/venues'
import type { BandState, MapNode, PlayerState, Venue } from '../types'

/**
 * Map-node shape accepted by shared arrival processing.
 */
export type ArrivalNode = Omit<Partial<MapNode>, 'type' | 'venue'> & {
  type: string
  venue?: unknown
}

/**
 * Arrival node narrowed to venue-bearing gig node types.
 */
export type GigArrivalNode<T = ArrivalNode> = T & {
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

/**
 * Result returned by arrival processing for the caller to route scene changes.
 */
export type ArrivalResult = {
  /** Scene to navigate to after processing. Hook is responsible for calling changeScene. */
  scene: import('../types/game').GamePhase
  /** True when startGig was called successfully. Hook must not call changeScene when true. */
  gigStarted: boolean
}

/**
 * Calculates new harmony value if band has harmony regen active.
 *
 * @param band - The current band state.
 * @returns The new harmony value, or null if regen is not applicable.
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
 *
 * @param node - Node to test; nullish or non-gig nodes return false.
 * @returns True if the node is a GIG, FESTIVAL, or FINALE.
 */
export const isGigNode = <T extends { type?: string }>(
  node: T | null | undefined
): node is GigArrivalNode<T> => {
  return (
    node?.type === 'GIG' || node?.type === 'FESTIVAL' || node?.type === 'FINALE'
  )
}

type ProcessTravelEventsOptions = {
  includeGigNodes?: boolean
}

/**
 * Triggers travel events if applicable for the current node.
 *
 * @param node - Arrival node whose type gates which travel events may fire; a nullish node fires none.
 * @param triggerEvent - The function to trigger events.
 * @param options - Travel-event options.
 * @returns True if a travel event was triggered.
 */
export const processTravelEvents = (
  node: ArrivalNode | null | undefined,
  triggerEvent: (category: string, triggerPoint?: string) => boolean,
  options: ProcessTravelEventsOptions = {}
): boolean => {
  if (isGigNode(node) && !options.includeGigNodes) {
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
  onShowSupplyStop?: (
    inventory: import('../types/components').PurchaseItem[]
  ) => void
  eventAlreadyActive?: boolean
  rng?: () => number
}

/**
 * Shared logic for handling arrival at a map node.
 *
 * This can be used by both the legacy travel system and the arrival logic hook.
 *
 * @param params - Arrival processing context:
 * `node`, `band`, `player`, update callbacks, event/gig callbacks, optional
 * HQ or supply-stop callbacks, active-event state, and RNG.
 * @returns Arrival scene routing and gig-start status.
 */
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
    onShowSupplyStop,
    eventAlreadyActive = false,
    rng = secureRandom
  } = params
  switch (node.type) {
    case 'supplyStop': {
      addToast(
        i18n.t('ui:arrival.supplyStop', {
          defaultValue: 'You arrived at a Supply Stop.'
        }),
        'info'
      )
      if (onShowSupplyStop) {
        const inventory = Array.isArray(node.shopInventory)
          ? (node.shopInventory as import('../types/components').PurchaseItem[])
          : []
        onShowSupplyStop(inventory)
      }
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
    case 'REST_STOP': {
      const members = band?.members ?? []
      const newMembers = [...members]
      for (let i = 0; i < members.length; i++) {
        const m = members[i]
        if (!m) continue
        const newStamina = clampMemberStamina(
          finiteNumberOr(m.stamina, 0) + 20,
          finiteNumberOr(m.staminaMax, 100)
        )
        const newMood = clampMemberMood(finiteNumberOr(m.mood, 0) + 10)
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
      // Band tourSuccess effect (contraband): scales down the probabilistic
      // cancellation chance; the deterministic harmony <= 1 cancel stands.
      const tourSuccess = clampUnit(finiteNumberOr(band?.tourSuccess, 0))
      const cancellationChance =
        BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE * (1 - tourSuccess)
      const luckCheck = rng() < cancellationChance
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
          const currentFame = player.fame ?? 0
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
