import { logger } from './logger'
import { handleError, StateError } from './errorHandler'
import { GAME_PHASES } from '../context/gameConstants'
import {
  clampMemberStamina,
  readMemberMood,
  readMemberStamina,
  clampMemberMood,
  clampPlayerFame,
  calculateFameLevel,
  clampBandHarmony,
  calcCancellationRisk,
  BALANCE_CONSTANTS,
  finiteNumberOr
} from './gameState'
import { secureRandom } from './crypto'
import i18n from '../i18n'
import { normalizeVenueId } from './mapUtils'
import { clampUnit, formatNumber } from './numberUtils'
import { VENUES_BY_ID } from '../data/venues'
import { isExpeditionLegacyHqEffectActive } from '../domain/expedition/legacyHqPolicy'
import type { BandState, MapNode, PlayerState, Venue } from '../types'
import type { UpdateBandPayload } from '../types/actions'
import type { ExpeditionAccessLock } from '../domain/expedition/fame'
import type { OptionalToastCallback } from '../types/callbacks'

/**
 * Map-node shape accepted by shared arrival processing.
 */
type ArrivalNode = Omit<Partial<MapNode>, 'type' | 'venue'> & {
  type: string
  venue?: unknown
}

/**
 * Arrival node narrowed to venue-bearing gig node types.
 */
type GigArrivalNode<T = ArrivalNode> = T & {
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
type ArrivalResult = {
  /** Scene to navigate to after processing. Hook is responsible for calling changeScene. */
  scene: import('../types/game').GamePhase
  /** True when startGig was called successfully. Hook must not call changeScene when true. */
  gigStarted: boolean
}

/**
 * Calculates new harmony value if band has harmony regen active.
 *
 * @param band - The current band state.
 * @param isExpeditionRunActive - True while an Expedition run is active.
 * @returns The new harmony value, or null if regen is not applicable.
 *
 * @remarks
 * The regen comes from the Mobile Studio, which is `between_tours_only`: the
 * band keeps the van, but the comfort does not follow it onto the road. The
 * flag is persisted on the band rather than carried as an `hqUpgrades` id, so
 * the policy has to be applied at each consumer instead of once at the id.
 */
export const processHarmonyRegen = (
  band: Pick<BandState, 'harmony' | 'harmonyRegenTravel'> | null | undefined,
  isExpeditionRunActive: boolean = false
): number | null => {
  if (
    band?.harmonyRegenTravel &&
    isExpeditionLegacyHqEffectActive(
      isExpeditionRunActive,
      'hq_van_sound_system'
    )
  ) {
    return clampBandHarmony(finiteNumberOr(band.harmony, 1) + 5)
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

/**
 * Checks if arrival at the node takes the gig branch of `handleNodeArrival`.
 *
 * @param node - Node to test; nullish nodes return false.
 * @returns True for GIG, FESTIVAL, FINALE and the legacy CITY type.
 *
 * @remarks
 * Unlike `isGigNode`, this includes legacy CITY: it still gets travel events,
 * but arrival books its venue exactly like a GIG node.
 */
export const isGigArrivalNode = (
  node: { type?: string } | null | undefined
): boolean => isGigNode(node) || node?.type === 'CITY'

/**
 * Resolves the node type arrival logic must act on.
 *
 * @param node - The map node the band stands on.
 * @param nodeId - That node's id (map fixtures may omit `node.id`).
 * @param expedition - Expedition slice carrying the persisted `arrivedOverlay`.
 * @returns `node` itself, or a copy typed `SPECIAL` when a Legendary converted
 * this node on the move that reached it.
 *
 * @remarks
 * The conversion is what the run travelled, so a Ghost Route escape that
 * landed on a Gig node must not play the show it was the escape from. Normal
 * arrival and same-node re-entry both read this, and `handleStartGig` refuses
 * a converted current node, so neither path can book it.
 */
export const resolveArrivalNode = <T extends { type?: string }>(
  node: T,
  nodeId: string | null | undefined,
  expedition:
    { arrivedOverlay?: { nodeId?: unknown } | null } | null | undefined
): T => {
  const overlayNodeId = expedition?.arrivedOverlay?.nodeId
  if (
    typeof overlayNodeId !== 'string' ||
    overlayNodeId !== nodeId ||
    node.type === 'SPECIAL'
  ) {
    return node
  }
  return { ...node, type: 'SPECIAL' }
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
  updateBand: (p: UpdateBandPayload) => void
  updatePlayer: (p: Partial<PlayerState>) => void
  triggerEvent: (category: string, triggerPoint?: string) => boolean
  startGig: (venue: Venue) => void
  addToast: OptionalToastCallback
  onShowHQ?: () => void
  onShowSupplyStop?: (
    inventory: import('../types/components').PurchaseItem[]
  ) => void
  eventAlreadyActive?: boolean
  rng?: () => number
  /**
   * Fame access lock on this node's booking, from
   * `getExpeditionNodeBookingLock`. When set, the band arrives but the gig is
   * not booked, mirroring the `START_GIG` reducer refusal.
   */
  bookingLock?: ExpeditionAccessLock | null
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
    rng = secureRandom,
    bookingLock = null
  } = params
  switch (node.type) {
    case 'SUPPLY_STOP': {
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
    // 'REST' is the legacy spelling kept alive by save sanitisation; it means
    // the same stop, so it must not fall through to the unhandled branch.
    case 'REST':
    case 'REST_STOP': {
      // A functional update reads the reducer's current members: arrival has
      // just dispatched the day tick, so a patch built from the `band` the
      // caller captured would overwrite the tick's mood, stamina, traits and
      // expired buffs. Only `{ id, stamina, mood }` is sent; the reducer merges
      // by id, so every other field and each member's position stay as they are.
      updateBand(prev => {
        const members = prev?.members ?? []
        const patches: Partial<BandState['members'][number]>[] = []
        for (let i = 0; i < members.length; i++) {
          const m = members[i]
          if (!m || typeof m.id !== 'string') continue
          const staminaMax = finiteNumberOr(m.staminaMax, 100)
          patches.push({
            id: m.id,
            stamina: clampMemberStamina(
              readMemberStamina(m.stamina, staminaMax) + 20,
              staminaMax
            ),
            mood: clampMemberMood(readMemberMood(m.mood) + 10)
          })
        }
        return { members: patches as BandState['members'] }
      })
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
    // 'CITY' is the legacy venue-bearing node type still accepted by save
    // sanitisation; it resolves a venue exactly like a GIG node does.
    case 'CITY':
    case 'FESTIVAL':
    case 'FINALE':
    case 'GIG': {
      // Checked before the harmony roll: a promoter who never booked the band
      // is not a cancelled show, so it costs no Fame.
      if (bookingLock) {
        addToast(
          i18n.t('ui:arrival.bookingFameLocked', {
            fame: formatNumber(bookingLock.minimumFame, i18n.language)
          }),
          'warning'
        )
        return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
      }
      const harmony = clampBandHarmony(band?.harmony)

      // Show cancellation check: Deterministic for harmony <= 1, probabilistic for low harmony (Chaos Tour Mechanic)
      const isLowHarmony = harmony < BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD
      // Band tourSuccess effect (contraband): scales down the probabilistic
      // cancellation chance; the deterministic harmony <= 1 cancel stands.
      const tourSuccess = clampUnit(finiteNumberOr(band?.tourSuccess, 0))
      const cancellationChance = calcCancellationRisk(
        harmony,
        BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD,
        BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE,
        tourSuccess
      )
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
          const currentFame = finiteNumberOr(player.fame, 0)
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
      const unhandledType = (node as ArrivalNode).type
      logger.warn(
        'ArrivalLogic',
        'Unhandled node type — routing to OVERWORLD',
        { type: unhandledType }
      )
      // Silent telemetry as well as the log: a node type the generator can
      // emit but arrival cannot handle is a defect, not a normal branch.
      handleError(
        new StateError('Unhandled map node type on arrival', {
          type: String(unhandledType)
        }),
        { silent: true, source: 'arrivalUtils.handleNodeArrival' }
      )
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
  }
}
