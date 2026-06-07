import { calculateRefuelCost, calculateTravelExpenses } from './economyEngine'
import { finiteNumberOr } from './finiteNumber'
import type { BandState } from '../types'

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
 * Checks if the player is softlocked (stranded) due to lack of fuel and money.
 * @param gameMap - Map supplying the current node and its connections used to test for any affordable move.
 * @param player - The player state object.
 * @param band - The band state object. Defaults to `null`.
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
  band: unknown = null
): boolean => {
  if (!gameMap || !player || typeof player.currentNodeId !== 'string')
    return false

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
    money: finiteNumberOr(player.money, 0),
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

  let canReachAny = false
  for (let i = 0; i < connections.length; i++) {
    const c = connections[i]
    if (!isMapConnection(c)) continue
    if (c.from === player.currentNodeId && typeof c.to === 'string') {
      const n = nodes[c.to]
      if (n) {
        const { fuelLiters } = calculateTravelExpenses(
          n,
          currentNode,
          playerStateForTravel,
          bandStateForTravel
        )
        if (currentFuel >= fuelLiters) {
          canReachAny = true
          break
        }
      }
    }
  }

  // If cannot reach any neighbor, check if can afford refuel
  // EXCEPTION: If current node is a GIG, player can earn money, so not stranded.
  if (!canReachAny && currentNode?.type !== 'GIG') {
    const refuelCost = calculateRefuelCost(currentFuel)
    const playerMoney = Math.max(0, finiteNumberOr(player.money, 0))
    return playerMoney < refuelCost
  }
  return false
}
