import {
  calculateRefuelCost,
  calculateTravelExpenses,
  EXPENSE_CONSTANTS
} from './economyEngine'
import { validateBloodBankDonation } from './bloodBankUtils'
import { GAME_CONSTANTS } from '../context/gameConstants'
import { finiteNumberOr } from './finiteNumber'
import type { BandState } from '../types'
import type { AssetModifiers } from '../types/assets'

type MapConnection = { from?: unknown; to?: unknown }
type GameNode = { type?: unknown }
type GameMapLike =
  | { connections?: unknown; nodes?: Record<string, GameNode | undefined> }
  | null
  | undefined

const isMapConnection = (value: unknown): value is MapConnection =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Checks if a target node is connected to the source node.
 * @param gameMap - Map whose `connections` list is scanned for the directed edge.
 * @param fromNodeId - Edge source; the check is directional (`from` → `to`).
 * @param targetNodeId - Edge destination; only a matching `from` → `to` connection counts as connected.
 * @returns True if connected.
 */
export const isConnected = (
  gameMap: GameMapLike,
  fromNodeId: string,
  targetNodeId: string
): boolean => {
  if (!gameMap) return false
  const connections = Array.isArray(gameMap.connections)
    ? gameMap.connections
    : []
  for (let i = 0; i < connections.length; i++) {
    const c = connections[i]
    if (!isMapConnection(c)) continue
    if (c.from === fromNodeId && c.to === targetNodeId) {
      return true
    }
  }
  return false
}

/**
 * Determines the visibility state of a node based on its layer.
 * @param nodeLayer - Target node layer.
 * @param currentLayer - Current player layer.
 * @returns 'visible', 'dimmed', or 'hidden'.
 */
export const getNodeVisibility = (
  nodeLayer: number,
  currentLayer: number
): 'visible' | 'dimmed' | 'hidden' => {
  if (nodeLayer <= currentLayer + 1) return 'visible'
  if (nodeLayer === currentLayer + 2) return 'dimmed'
  return 'hidden'
}

/**
 * Normalizes a venue object or string into a raw ID string, stripping legacy namespacing.
 * @param venue - The venue object or string to normalize.
 * @returns The normalized string ID, or null.
 */
export const normalizeVenueId = (venue: unknown): string | null => {
  if (!venue) return null
  let id: unknown = venue
  if (typeof venue === 'object' && venue !== null) {
    const venueRecord = venue as Record<string, unknown>
    const rawId = venueRecord.id
    id =
      rawId === null ||
      rawId === undefined ||
      rawId === '' ||
      rawId === false ||
      rawId === 0
        ? venueRecord.name
        : rawId
  }

  if (typeof id === 'string') {
    const isVenues = id.startsWith('venues:')
    const hasName = id.endsWith('.name')
    if (isVenues && hasName) {
      id = id.slice(7, -5)
    } else if (isVenues) {
      id = id.slice(7)
    } else if (hasName) {
      if (!id.includes(':')) {
        id = id.slice(0, -5)
      }
    }
  }

  return typeof id === 'string' && id.length > 0 ? id : null
}

/**
 * Optional precomputed values that let {@link checkSoftlock} mirror the real
 * travel gate (`totalCost + getTotalDailyObligations`) and asset fuel
 * modifiers. Callers compute these with `getTotalDailyObligations` /
 * `getActiveAssetModifiers`; mapUtils stays free of those dependencies.
 */
export interface SoftlockContext {
  /** Total daily obligations added on top of each neighbor's travel cost. */
  dailyObligations?: number
  /** Active asset modifiers applied to fuel-consumption estimates. */
  assetModifiers?: AssetModifiers
}

const GIG_LIKE_NODE_TYPES = new Set(['GIG', 'FESTIVAL', 'FINALE'])

/**
 * Derives the canonical region (city) reputation key from a location value.
 *
 * @remarks
 * `player.location` is canonically stored as `venues:<venue_id>.name` (see
 * `migratePlayerLocation`), while regional reputation and perRegion quest
 * scopes must be keyed per city. This helper is the single converter both
 * writers (gig reputation, region quest events) and readers (booking refusal,
 * quest scope stamping) share — mixing raw locations and city keys is what
 * previously made the regional booking ban unreachable. City derivation
 * mirrors `getCityKeyFromVenueId` (prefix before the first underscore) but
 * falls back to the full id for underscore-less city keys like `stendal`
 * instead of returning an empty string.
 *
 * @param location - Raw location value (`venues:<id>.name` key, bare venue id, or city key).
 * @returns The city key, or null when no usable string was provided.
 */
export const getRegionKeyForLocation = (location: unknown): string | null => {
  const venueId = normalizeVenueId(location)
  if (!venueId) return null
  const idx = venueId.indexOf('_')
  return idx > 0 ? venueId.slice(0, idx) : venueId
}

/**
 * Checks if the player is softlocked (stranded): no connected node is
 * affordable in both fuel and cash, and no in-place escape exists.
 *
 * @remarks
 * Mirrors the travel gate: a neighbor counts as reachable only when the tank
 * covers its fuel draw AND cash covers travel cost plus total daily
 * obligations (arrival advances the day). Escape hatches that defuse a
 * stranded verdict: the current node is a playable gig (GIG/FESTIVAL/FINALE
 * not yet played, i.e. not `lastGigNodeId`), a blood-bank donation is still
 * possible (cash source without traveling), or an affordable refuel would
 * make a neighbor reachable. The FINALE node is never reported as stranded:
 * it has no outgoing connections by map design, so being there is the end of
 * the route, not a resource failure.
 *
 * @param gameMap - Map supplying the current node and its connections used to test for any affordable move.
 * @param player - The player state object.
 * @param band - The band state object. Defaults to `null`.
 * @param context - Optional precomputed daily obligations and asset modifiers for travel-gate accuracy. Defaults to `{}`.
 * @returns True if stranded.
 */
export const checkSoftlock = (
  gameMap: GameMapLike,
  player:
    | ({ currentNodeId?: unknown; van?: unknown; money?: unknown } & Record<
        string,
        unknown
      >)
    | null
    | undefined,
  band: unknown = null,
  context: SoftlockContext = {}
): boolean => {
  if (!gameMap || !player || typeof player.currentNodeId !== 'string')
    return false

  // The finale has no outgoing connections by design — never stranded there.
  if (gameMap.nodes?.[player.currentNodeId]?.type === 'FINALE') return false

  const van =
    typeof player.van === 'object' && player.van !== null
      ? (player.van as {
          fuel?: unknown
          condition?: unknown
          upgrades?: unknown
          breakdownChance?: unknown
        })
      : undefined
  const currentFuel = finiteNumberOr(van?.fuel, 0)
  const playerMoney = Math.max(0, finiteNumberOr(player.money, 0))
  const nodes = gameMap.nodes ?? {}
  const currentNode = nodes[player.currentNodeId]
  const bandStateForTravel = (
    typeof band === 'object' &&
    band !== null &&
    Array.isArray((band as { members?: unknown }).members)
      ? (band as { members: unknown[] })
      : null
  ) as Pick<BandState, 'members'> | null

  const connections = Array.isArray(gameMap.connections)
    ? gameMap.connections
    : []

  const playerStateForTravel = {
    money: playerMoney,
    fameLevel: finiteNumberOr(player.fameLevel, 0),
    van: {
      fuel: currentFuel,
      condition: finiteNumberOr(van?.condition, 100),
      upgrades: Array.isArray(van?.upgrades)
        ? van.upgrades.filter(
            (upgrade): upgrade is string => typeof upgrade === 'string'
          )
        : [],
      breakdownChance: finiteNumberOr(van?.breakdownChance, 0)
    }
  }

  // Same daily-obligation term the travel gate adds on top of travel cost
  // (arrival advances the day). Without context this stays 0, keeping the
  // check conservative for legacy callers.
  const dailyObligations = Math.max(
    0,
    finiteNumberOr(context.dailyObligations, 0)
  )
  const assetModifiers = context.assetModifiers

  const neighborCosts: { fuelLiters: number; cashImpact: number }[] = []
  for (let i = 0; i < connections.length; i++) {
    const c = connections[i]
    if (!isMapConnection(c)) continue
    if (c.from === player.currentNodeId && typeof c.to === 'string') {
      const n = nodes[c.to]
      if (n) {
        const { fuelLiters, totalCost } = calculateTravelExpenses(
          n,
          currentNode,
          playerStateForTravel,
          bandStateForTravel,
          assetModifiers
        )
        neighborCosts.push({
          fuelLiters: finiteNumberOr(fuelLiters, 0),
          cashImpact: finiteNumberOr(totalCost, 0) + dailyObligations
        })
      }
    }
  }

  const canReach = (fuel: number, money: number): boolean =>
    neighborCosts.some(n => fuel >= n.fuelLiters && money >= n.cashImpact)

  if (canReach(currentFuel, playerMoney)) return false

  // Escape hatch: an unplayed gig at the current node can still earn money.
  if (
    typeof currentNode?.type === 'string' &&
    GIG_LIKE_NODE_TYPES.has(currentNode.type) &&
    player.lastGigNodeId !== player.currentNodeId
  ) {
    return false
  }

  // Escape hatch: a blood-bank donation is a cash source without traveling.
  const bandForDonation = bandStateForTravel as Partial<BandState> | null
  if (
    validateBloodBankDonation(bandForDonation, {
      harmonyCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_HARMONY_COST,
      staminaCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_STAMINA_COST
    })
  ) {
    return false
  }

  // Escape hatch: an affordable refuel that makes a neighbor reachable.
  const refuelCost = calculateRefuelCost(currentFuel)
  if (refuelCost > 0 && playerMoney >= refuelCost) {
    if (
      canReach(EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL, playerMoney - refuelCost)
    ) {
      return false
    }
  }

  return true
}
