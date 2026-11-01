import {
  calculateRefuelCost,
  calculateTravelExpenses,
  EXPENSE_CONSTANTS
} from './economy'
import {
  getBloodBankDonation,
  validateBloodBankDonation
} from './bloodBankUtils'
import { finiteNumberOr } from './finiteNumber'
import {
  clampBandHarmony,
  clampMemberStamina,
  readVanCondition
} from './gameState/clamps'
import { getCityPrefix } from './mapGenerator/cityTraits'
import type { BandState } from '../types'
import type { AssetModifiers } from '../types/assets'

type RawMapConnection = { from?: unknown; to?: unknown }
type GameNode = { type?: unknown }
type GameMapLike =
  | { connections?: unknown; nodes?: Record<string, GameNode | undefined> }
  | null
  | undefined

const isMapConnection = (value: unknown): value is RawMapConnection =>
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
    } else if (hasName && !id.includes(':')) {
      id = id.slice(0, -5)
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
interface SoftlockContext {
  /** Total daily obligations added on top of each neighbor's travel cost. */
  dailyObligations?: number
  /** Active asset modifiers applied to fuel-consumption estimates. */
  assetModifiers?: AssetModifiers
  /**
   * Effective Expedition fuel-consumption multiplier, so a leg is priced at the
   * litres settlement will burn. Omitted means neutral (`1`).
   */
  fuelMultiplier?: number
  /** Array of hypothetical post-sale combinations, each specifying the generated proceeds and the resulting obligations/modifiers if those specific assets were sold. */
  postSaleScenarios?: {
    assetProceeds: number
    dailyObligations: number
    assetModifiers: AssetModifiers
  }[]
  /**
   * Booking-gate predicate for a candidate neighbor. Callers pass a closure
   * over `getNodeAccessStatus` so the softlock verdict cannot drift from the
   * gate `useHandleTravel` actually enforces. Omitted means "no gate", which
   * keeps legacy callers conservative.
   */
  isNodeAccessible?: (node: unknown) => boolean
}

const GIG_LIKE_NODE_TYPES = new Set(['GIG', 'FESTIVAL', 'FINALE'])

/**
 * Upper bound on consecutive donations the softlock check simulates. Harmony
 * is clamped to 100 and the cheapest donation costs 15, so a legal band can
 * donate at most six times in a row; the bound only guards corrupted state.
 */
const MAX_SIMULATED_DONATIONS = 8

/**
 * Cumulative cash a run of back-to-back blood-bank donations raises, one entry
 * per donation the band can still legally make.
 *
 * @remarks
 * Each step applies the reducer's harmony and stamina costs and clamps, so
 * eligibility for the next donation is judged on the drained band. Marrow is
 * taken while eligible: it pays more per point of harmony and of stamina than
 * blood, so this order reaches the largest legal total.
 *
 * @param band - Band whose harmony and member stamina fund the donations.
 * @param fameLevel - Persisted fame level scaling every payout.
 * @returns Running proceeds after the 1st, 2nd, ... donation.
 */
const getDonationProceedsSteps = (
  band: Partial<BandState> | null,
  fameLevel: unknown
): number[] => {
  const steps: number[] = []
  const marrow = getBloodBankDonation('marrow', fameLevel)
  const blood = getBloodBankDonation('blood', fameLevel)
  if (!band || !marrow || !blood) return steps
  let simulated = band
  let proceeds = 0
  while (steps.length < MAX_SIMULATED_DONATIONS) {
    const donation = validateBloodBankDonation(simulated, marrow)
      ? marrow
      : validateBloodBankDonation(simulated, blood)
        ? blood
        : null
    if (!donation) break
    proceeds += donation.moneyGain
    steps.push(proceeds)
    simulated = {
      harmony: clampBandHarmony(
        finiteNumberOr(simulated.harmony, 0) - donation.harmonyCost
      ),
      members: (simulated.members ?? []).map(member => ({
        ...member,
        stamina: clampMemberStamina(
          finiteNumberOr(member.stamina, 0) - donation.staminaCost,
          finiteNumberOr(member.staminaMax, 100)
        )
      }))
    }
  }
  return steps
}

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
 * shares `getCityPrefix` with `getCityKeyFromVenueId` (prefix before the first
 * underscore) but falls back to the full id for underscore-less city keys like
 * `stendal` instead of returning an empty string.
 *
 * @param location - Raw location value (`venues:<id>.name` key, bare venue id, or city key).
 * @returns The city key, or null when no usable string was provided.
 */
export const getRegionKeyForLocation = (location: unknown): string | null => {
  const venueId = normalizeVenueId(location)
  if (!venueId) return null
  return getCityPrefix(venueId) || venueId
}

/**
 * Cash a travel leg needs up front. Arrival advances the day, so the tank-and-
 * wallet gate must cover the trip cost plus the day's obligations; negative
 * obligations (net asset income) never lower the requirement below the trip
 * cost, since the income arrives only after the travel debit.
 *
 * @param totalCost - Immediate travel cost.
 * @param dailyObligations - Total daily obligations the arrival tick charges.
 * @returns `max(totalCost, totalCost + dailyObligations)`; non-finite inputs count as `0`.
 */
export const calculateTravelCashRequired = (
  totalCost: unknown,
  dailyObligations: unknown
): number => {
  const cost = finiteNumberOr(totalCost, 0)
  return Math.max(cost, cost + finiteNumberOr(dailyObligations, 0))
}

/** Regional reputation at or below this value blacklists the band from booking in that region. */
export const REGION_BLACKLIST_THRESHOLD = -30

/**
 * Converts a node's numeric map coordinates into absolute CSS percentage values.
 *
 * @param node - An object containing x and y map coordinates (0-100).
 * @param transform - Optional CSS transform string to append to the style object.
 * @returns A style object containing left and top percentages, plus the transform if provided.
 */
export const nodeToPercentPosition = (
  node: { x: number; y: number },
  transform?: string
): { left: string; top: string; transform?: string } => {
  const position = { left: `${node.x}%`, top: `${node.y}%` }
  return transform ? { ...position, transform } : position
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
 * not yet played, i.e. not `lastGigNodeId`), a run of legal blood-bank
 * donations (alone or on top of any asset-sale combination) raises enough
 * cash without traveling, or an affordable refuel would make a neighbor
 * reachable. The FINALE node is never reported as stranded:
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
      condition: readVanCondition(van?.condition),
      upgrades: (() => {
        if (!Array.isArray(van?.upgrades)) return []
        const upgrades: string[] = []
        for (let i = 0, len = van.upgrades.length; i < len; i++) {
          const upgrade = van.upgrades[i]
          if (typeof upgrade === 'string') upgrades.push(upgrade)
        }
        return upgrades
      })(),
      breakdownChance: finiteNumberOr(van?.breakdownChance, 0)
    }
  }

  // Same daily-obligation term the travel gate adds on top of travel cost
  // (arrival advances the day). Without context this stays 0, keeping the
  // check conservative for legacy callers.
  const dailyObligations = finiteNumberOr(context.dailyObligations, 0)
  const assetModifiers = context.assetModifiers
  const fuelMultiplier = Math.max(0, finiteNumberOr(context.fuelMultiplier, 1))

  // The travel gate (`checkTravelPrerequisites`) admits every START node
  // regardless of visibility or connectivity, and the map surfaces it as
  // reachable. Generated connections only point one layer forward, so the
  // return trip to HQ is normally not an outgoing neighbor — scanning
  // connections alone would call an affordable HQ return "stranded".
  // Collected once: the reachability check below runs per escape scenario
  // (blood bank, refuel, each asset-sale combination) and `nodes` is fixed.
  const startNodes: GameNode[] = []
  for (const nodeId in nodes) {
    if (!Object.hasOwn(nodes, nodeId)) continue
    if (nodeId === player.currentNodeId) continue
    const node = nodes[nodeId]
    if (node?.type === 'START') startNodes.push(node)
  }

  const checkReachabilityWithMoneyAndFuel = (
    fuel: number,
    money: number,
    customContext?: {
      dailyObligations?: number
      assetModifiers?: AssetModifiers
    }
  ): boolean => {
    const activeDailyObligations = finiteNumberOr(
      customContext?.dailyObligations,
      dailyObligations
    )
    const activeAssetModifiers = customContext?.assetModifiers ?? assetModifiers

    const canReachNode = (n: GameNode): boolean => {
      const { fuelLiters, totalCost } = calculateTravelExpenses(
        n,
        currentNode,
        {
          ...playerStateForTravel,
          money,
          van: { ...playerStateForTravel.van, fuel }
        },
        bandStateForTravel,
        activeAssetModifiers
      )
      // A neighbor the booking gate refuses (blacklist, regional ban,
      // prove-yourself capacity cap) is not a real escape route.
      const accessAllowed = context.isNodeAccessible?.(n) ?? true
      return (
        accessAllowed &&
        fuel >= finiteNumberOr(fuelLiters, 0) * fuelMultiplier &&
        money >= calculateTravelCashRequired(totalCost, activeDailyObligations)
      )
    }

    for (let i = 0; i < connections.length; i++) {
      const c = connections[i]
      if (!isMapConnection(c)) continue
      if (c.from === player.currentNodeId && typeof c.to === 'string') {
        const n = nodes[c.to]
        if (n && canReachNode(n)) return true
      }
    }

    for (const startNode of startNodes) {
      if (canReachNode(startNode)) return true
    }

    return false
  }

  // Escape hatch: an unplayed gig at the current node can still earn money.
  if (
    typeof currentNode?.type === 'string' &&
    GIG_LIKE_NODE_TYPES.has(currentNode.type) &&
    player.lastGigNodeId !== player.currentNodeId
  ) {
    return false
  }

  const bandForDonation = bandStateForTravel as Partial<BandState> | null

  const evaluateScenario = (
    scenarioMoney: number,
    customCtx?: Parameters<typeof checkReachabilityWithMoneyAndFuel>[2]
  ) => {
    if (
      checkReachabilityWithMoneyAndFuel(currentFuel, scenarioMoney, customCtx)
    )
      return true
    const refuelCost = calculateRefuelCost(currentFuel)
    if (refuelCost > 0 && scenarioMoney >= refuelCost) {
      return checkReachabilityWithMoneyAndFuel(
        EXPENSE_CONSTANTS.transport.maxFuel,
        scenarioMoney - refuelCost,
        customCtx
      )
    }
    return false
  }

  // Escape hatch: blood-bank donations are a cash source without traveling,
  // and the band can donate repeatedly while harmony and stamina allow, on
  // top of whatever an asset sale raises.
  const donationSteps = getDonationProceedsSteps(
    bandForDonation,
    player.fameLevel
  )
  const evaluateWithDonations = (
    scenarioMoney: number,
    customCtx?: Parameters<typeof checkReachabilityWithMoneyAndFuel>[2]
  ): boolean => {
    if (evaluateScenario(scenarioMoney, customCtx)) return true
    for (const proceeds of donationSteps) {
      if (evaluateScenario(scenarioMoney + proceeds, customCtx)) return true
    }
    return false
  }

  if (evaluateWithDonations(playerMoney)) return false

  // Escape hatch: positive net asset proceeds across possible sale combinations.
  if (context.postSaleScenarios && context.postSaleScenarios.length > 0) {
    for (const scenario of context.postSaleScenarios) {
      const totalMoney = playerMoney + finiteNumberOr(scenario.assetProceeds, 0)
      if (evaluateWithDonations(totalMoney, scenario)) return false
    }
  }

  return true
}
