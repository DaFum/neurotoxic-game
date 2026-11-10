import {
  calculateGuaranteedDailyCost,
  calculateRefuelCost,
  calculateTravelExpenses,
  EXPENSE_CONSTANTS
} from './economy'
import {
  BLOOD_BANK_STAMINA_RESERVE,
  getBloodBankDonation,
  validateBloodBankDonation
} from './bloodBankUtils'
import { REST_STAMINA_GAIN } from '../context/gameConstants'
import { SLEEPING_BAGS_STAMINA_PER_DAY } from '../data/inventoryItems'
import { getActiveDealBenefits } from './brandDealBenefits'
import { calculateDailyNetCost } from './dailyNetCost'
import { shouldTriggerBankruptcy } from './economy/logisticsLogic'
import { finiteNumberOr } from './finiteNumber'
import { calculateFameLevel } from './gameState/calculations'
import {
  clampBandHarmony,
  clampMemberStamina,
  readVanCondition
} from './gameState/clamps'
import { getCityPrefix } from './mapGenerator/cityTraits'
import type { BandState, SocialState } from '../types'
import type { AssetModifiers, LongTermAsset, Liability } from '../types/assets'
import {
  projectRestLiabilities,
  getRestAssetDailyCost
} from './restLiabilityProjection'
import type {
  ConsumableRecovery,
  PendingRestEffects
} from '../types/restRecovery'

type RawMapConnection = { from?: unknown; to?: unknown }
type GameNode = { type?: unknown }
type GameMapLike =
  | {
      connections?: unknown
      edges?: unknown
      nodes?: Record<string, GameNode | undefined>
    }
  | null
  | undefined

const isMapConnection = (value: unknown): value is RawMapConnection =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Precomputes and returns a set of reachable outgoing target node IDs from a given node.
 * Provides O(1) membership lookups for map node connectivity checks.
 *
 * @param gameMap - Map whose `connections` and `edges` lists are both scanned for outgoing edges.
 * @param currentNodeId - Node ID to find outgoing connections from.
 * @returns ReadonlySet of connected target node IDs.
 */
export const getConnectedTargetIds = (
  gameMap: GameMapLike,
  currentNodeId: string | null | undefined
): ReadonlySet<string> => {
  if (!gameMap || !currentNodeId) return new Set()
  const outgoing = new Set<string>()
  for (const rawList of [gameMap.connections, gameMap.edges]) {
    if (!Array.isArray(rawList)) continue
    for (let i = 0; i < rawList.length; i++) {
      const c = rawList[i]
      if (!isMapConnection(c)) continue
      if (c.from === currentNodeId && typeof c.to === 'string') {
        outgoing.add(c.to)
      }
    }
  }
  return outgoing
}

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
  if (!targetNodeId) return false
  return getConnectedTargetIds(gameMap, fromNodeId).has(targetNodeId)
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
  /** Cash included in reserve-fee pricing but unavailable for recovery or travel. */
  protectedCash?: number
  /** One-use carried recovery, with caps relaxed in favour of escape. */
  consumableRecovery?: Partial<ConsumableRecovery>
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
    assets?: LongTermAsset[]
    liabilities?: Record<string, Liability>
  }[] & { exhaustive?: boolean }
  /**
   * Booking-gate predicate for a candidate neighbor. Callers pass a closure
   * over `getNodeAccessStatus` so the softlock verdict cannot drift from the
   * gate `useHandleTravel` actually enforces. Omitted means "no gate", which
   * keeps legacy callers conservative.
   */
  isNodeAccessible?: (node: unknown) => boolean
  /**
   * Enables the rest-in-van escape: days of positive net income (asset revenue
   * or YouTube ad revenue above the obligations) earned by resting. Pass it
   * for ordinary play only; an active Expedition settles days from its own
   * spendable slice. `dailyObligations` must then be the full
   * `getTotalDailyObligations` figure.
   */
  restRecovery?: {
    /**
     * Social slice supplying the YouTube followers the day tick pays on and
     * the brand deals whose stamina regen it adds.
     */
    social: Partial<Pick<SocialState, 'youtube' | 'activeDeals'>>
    /** Ordinary-play settlement; omitted keeps the legacy static-cost path. */
    assets?: LongTermAsset[]
    liabilities?: Record<string, Liability>
    pendingFameEffects?: PendingRestEffects
  }
}

const GIG_LIKE_NODE_TYPES = new Set(['GIG', 'FESTIVAL', 'FINALE'])

/**
 * Upper bound on immediate donations before carried recovery. Harmony is
 * clamped to 100 and the cheapest donation costs 15, so a legal band can
 * donate at most six times in a row. Rest/recovery uses an uncapped budget.
 */
const MAX_SIMULATED_DONATIONS = 8

/**
 * Rest days the softlock check looks ahead when resting earns money. One week:
 * long enough for modest income to close a typical shortfall, short enough
 * that the inputs held constant (follower decay, loan terms, asset wear) stay
 * close to what the real ticks settle. Each real rest re-runs the check on the
 * settled state, so an optimistic look-ahead only postpones a verdict that the
 * settled numbers then confirm.
 */
const MAX_SIMULATED_REST_DAYS = 7

/**
 * Upper bound on the harmony one day tick adds (`dailyTickLogic`): the +3
 * regen below 50, Soundproofing's +1 and the Mobile Studio's +5, counted
 * whether or not the band owns them and before the tick's decay and drains.
 */
const MAX_TICK_HARMONY_GAIN = 3 + 1 + 5

/**
 * Upper bound on the stamina one day tick adds to a member from its fixed
 * sources (`dailyTickLogic`): +3 above 60 harmony, +2 from Instagram, +3 from
 * cyber_lungs, +3 from the sofa, +1 from the old couch and the sleeping bags,
 * all counted, with no base decay subtracted (it takes nothing from an empty
 * member). Brand-deal and asset regen are added from the live state.
 */
const MAX_FIXED_TICK_STAMINA_GAIN =
  3 + 2 + 3 + 3 + 1 + SLEEPING_BAGS_STAMINA_PER_DAY

/** Maximum minimum stamina after optimistically dividing targeted items. */
const getRecoveredMinimumStamina = (
  band: Partial<BandState> | null,
  recovery: ConsumableRecovery
): number => {
  const stamina = (band?.members ?? [])
    .map(member => finiteNumberOr(member.stamina, 0) + recovery.memberStamina)
    .sort((a, b) => a - b)
  let level = stamina[0] ?? 0
  let pool = recovery.targetedStamina
  for (let i = 1; i < stamina.length; i++) {
    const next = stamina[i] ?? level
    const cost = (next - level) * i
    if (pool < cost) return level + pool / i
    pool -= cost
    level = next
  }
  return level + pool / Math.max(1, stamina.length)
}

/**
 * Closed-form optimistic donation budget. Marrow dominates blood in both
 * resources: giving up one marrow frees at most two bloods, worth at most
 * its payout. Strict harmony and inclusive stamina match the donation gate.
 * Caps and indivisible targeted items are relaxed; stock is credited once.
 */
const getBestDonationTotal = (
  harmony: number,
  stamina: number,
  fameLevel: number
): number => {
  const marrow = getBloodBankDonation('marrow', fameLevel)!
  const blood = getBloodBankDonation('blood', fameLevel)!
  const count = (h: number, s: number, hCost: number, sCost: number) =>
    Math.max(0, Math.min(Math.ceil(h / hCost) - 1, Math.floor(s / sCost)))
  const m = count(harmony, stamina, marrow.harmonyCost, marrow.staminaCost)
  const b = count(
    harmony - m * marrow.harmonyCost,
    stamina - m * marrow.staminaCost,
    blood.harmonyCost,
    blood.staminaCost
  )
  return Math.max(
    0,
    finiteNumberOr(m * marrow.moneyGain + b * blood.moneyGain, 0)
  )
}

/**
 * Optimistic cumulative donation credit before, between and after up to seven
 * rests. Resource refunds have no caps and omit drains. Costs use the lowest
 * reachable fame; payouts use the highest. This bound need not describe one
 * realizable sequence, since only a false stranded verdict ends the run.
 */
const getRestDonationTotals = (
  band: Partial<BandState> | null,
  fameLevelAfterRest: (restDays: number) => number,
  todayTotal: number,
  tickStaminaGain: number,
  recovery: ConsumableRecovery
): number[] => {
  const totals = [todayTotal]
  const members = band?.members ?? []
  // Persisted saves are sanitized; fallback 1 mirrors the live tick for callers
  // supplying non-finite harmony before rest or item use.
  const harmony = finiteNumberOr(band?.harmony, 1) + recovery.harmony
  const lowestStamina = getRecoveredMinimumStamina(band, recovery)
  for (let restDays = 1; restDays <= MAX_SIMULATED_REST_DAYS; restDays++) {
    const budget =
      members.length === 0
        ? 0
        : getBestDonationTotal(
            harmony + restDays * MAX_TICK_HARMONY_GAIN,
            lowestStamina +
              restDays * (REST_STAMINA_GAIN + tickStaminaGain) -
              BLOOD_BANK_STAMINA_RESERVE,
            fameLevelAfterRest(restDays)
          )
    totals.push(Math.max(totals[restDays - 1] ?? 0, budget))
  }
  return totals
}

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
 * cash without traveling, up to {@link MAX_SIMULATED_REST_DAYS} days of
 * resting (only with `context.restRecovery`, alone or after any asset-sale
 * combination) reach the cash through positive net income or through the
 * donations the restored stamina allows again (before, between and after the
 * rests), or an affordable refuel would
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
  const protectedCash = Math.max(0, finiteNumberOr(context.protectedCash, 0))
  // Keep a shortfall below the floor: recovery must first restore that cash
  // before it becomes spendable, and pricing must use the actual balance.
  const playerMoney =
    Math.max(0, finiteNumberOr(player.money, 0)) - protectedCash
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
  // (blood bank, refuel, each asset-sale combination, each rest day) and the
  // map is fixed. A neighbor the booking gate refuses (blacklist, regional
  // ban, prove-yourself capacity cap) is not a real escape route; the gate
  // reads only the node, so it is asked once per node, not per scenario.
  const travelTargets: GameNode[] = []
  for (let i = 0; i < connections.length; i++) {
    const c = connections[i]
    if (!isMapConnection(c)) continue
    if (c.from === player.currentNodeId && typeof c.to === 'string') {
      const n = nodes[c.to]
      if (n) travelTargets.push(n)
    }
  }
  for (const nodeId in nodes) {
    if (!Object.hasOwn(nodes, nodeId)) continue
    if (nodeId === player.currentNodeId) continue
    const node = nodes[nodeId]
    if (node?.type === 'START') travelTargets.push(node)
  }
  const accessibleTargets = travelTargets.filter(
    n => context.isNodeAccessible?.(n) ?? true
  )

  const checkReachabilityWithMoneyAndFuel = (
    fuel: number,
    money: number,
    customContext?: {
      dailyObligations?: number
      assetModifiers?: AssetModifiers
      fameLevel?: number
      assets?: LongTermAsset[]
      liabilities?: Record<string, Liability>
    }
  ): boolean => {
    const activeDailyObligations = finiteNumberOr(
      customContext?.dailyObligations,
      dailyObligations
    )
    const activeAssetModifiers = customContext?.assetModifiers ?? assetModifiers
    const pricingState = {
      ...playerStateForTravel,
      fameLevel: finiteNumberOr(
        customContext?.fameLevel,
        playerStateForTravel.fameLevel
      ),
      money: Math.max(0, money + protectedCash),
      van: { ...playerStateForTravel.van, fuel }
    }

    for (const n of accessibleTargets) {
      const { fuelLiters, totalCost } = calculateTravelExpenses(
        n,
        currentNode,
        pricingState,
        bandStateForTravel,
        activeAssetModifiers
      )
      if (
        fuel >= finiteNumberOr(fuelLiters, 0) * fuelMultiplier &&
        Math.max(0, money) >=
          calculateTravelCashRequired(totalCost, activeDailyObligations)
      )
        return true
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

  const refuelCost = calculateRefuelCost(currentFuel)
  const evaluateScenario = (
    scenarioMoney: number,
    customCtx?: Parameters<typeof checkReachabilityWithMoneyAndFuel>[2]
  ) => {
    if (
      checkReachabilityWithMoneyAndFuel(currentFuel, scenarioMoney, customCtx)
    )
      return true
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
  const recovery: ConsumableRecovery = {
    harmony: Math.max(
      0,
      finiteNumberOr(context.consumableRecovery?.harmony, 0)
    ),
    targetedStamina: Math.max(
      0,
      finiteNumberOr(context.consumableRecovery?.targetedStamina, 0)
    ),
    memberStamina: Math.max(
      0,
      finiteNumberOr(context.consumableRecovery?.memberStamina, 0)
    )
  }
  const donationSteps = getDonationProceedsSteps(
    bandForDonation,
    player.fameLevel
  )
  if (
    bandForDonation?.members?.length &&
    (recovery.harmony > 0 ||
      recovery.targetedStamina > 0 ||
      recovery.memberStamina > 0)
  ) {
    donationSteps.push(
      getBestDonationTotal(
        finiteNumberOr(bandForDonation.harmony, 1) + recovery.harmony,
        getRecoveredMinimumStamina(bandForDonation, recovery) -
          BLOOD_BANK_STAMINA_RESERVE,
        playerStateForTravel.fameLevel
      )
    )
  }
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

  // Escape hatch: resting in the van. Each day is priced as the tick settles
  // it: the deterministic living cost from the shared helper plus the asset
  // and loan terms already folded into `scenarioDailyObligations`. A day that
  // pays more than it costs is income; donations made before resting stay
  // available on top. A rest also restores stamina, so the band can donate,
  // rest and donate again; that is worth paying for a rest day while the
  // donation bound still grows. Every approximation here errs towards an
  // escape (see `getRestDonationTotals`): only the bankruptcy the tick itself
  // would declare ends the look-ahead.
  const restRecovery = context.restRecovery
  const donationTotal = Math.max(0, ...donationSteps)
  const rawEffects = restRecovery?.pendingFameEffects
  const validEffect = (entry: unknown): entry is Record<string, unknown> =>
    typeof entry === 'object' &&
    entry !== null &&
    typeof (entry as { restDay?: unknown }).restDay === 'number' &&
    Number.isFinite((entry as { restDay: number }).restDay) &&
    (entry as { restDay: number }).restDay > 0 &&
    (entry as { restDay: number }).restDay <= MAX_SIMULATED_REST_DAYS
  const fameDrops = (
    Array.isArray(rawEffects?.fameDrops) ? rawEffects.fameDrops : []
  )
    .filter(validEffect)
    .map(entry => ({
      restDay: Math.ceil(finiteNumberOr(entry.restDay, 1)),
      amount: Math.max(0, finiteNumberOr(entry.amount, 0))
    }))
  const successes = (
    Array.isArray(rawEffects?.successes) ? rawEffects.successes : []
  )
    .filter(validEffect)
    .map(entry => ({
      restDay: Math.ceil(finiteNumberOr(entry.restDay, 1)),
      fame: Math.max(0, finiteNumberOr(entry.fame, 0)),
      dailyIncome: Math.max(0, finiteNumberOr(entry.dailyIncome, 0)),
      passiveFame: Math.ceil(Math.max(0, finiteNumberOr(entry.passiveFame, 0))),
      saleProceeds: Math.max(0, finiteNumberOr(entry.saleProceeds, 0))
    }))
  const hasPendingEffects = fameDrops.length > 0 || successes.length > 0
  // Asset regen and passive fame from the pre-sale modifiers: a sale only
  // removes boni. The tick pays a fractional rate in whole units, at most its
  // ceiling a day. Passive fame lands before the day is settled, so a rest can
  // lift the fame level and every donation payout with it; the living and
  // travel costs, which also grow with the level, stay at today's level.
  const passiveFamePerDay = Math.ceil(
    Math.max(0, finiteNumberOr(assetModifiers?.famePassivePerDay, 0))
  )
  const fame = finiteNumberOr(player.fame, 0)
  const restDonationTotals = getRestDonationTotals(
    bandForDonation,
    restDays =>
      Math.max(
        playerStateForTravel.fameLevel,
        calculateFameLevel(
          finiteNumberOr(
            fame +
              restDays * passiveFamePerDay +
              successes.reduce(
                (sum, effect) =>
                  sum +
                  (effect.restDay <= restDays
                    ? effect.fame +
                      (restDays - effect.restDay) * effect.passiveFame
                    : 0),
                0
              ),
            Number.MAX_VALUE
          )
        )
      ),
    donationTotal,
    MAX_FIXED_TICK_STAMINA_GAIN +
      getActiveDealBenefits(restRecovery?.social?.activeDeals)
        .staminaRegenPerDay +
      Math.ceil(
        Math.max(0, finiteNumberOr(assetModifiers?.staminaRegenBonusPerDay, 0))
      ),
    recovery
  )
  const finalRestDonationTotal =
    restDonationTotals[MAX_SIMULATED_REST_DAYS] ?? donationTotal
  // Living costs do not depend on the sale scenario, only the asset and loan
  // terms do, so each rest day's figure is computed once.
  const restLivingCosts = (() => {
    if (!restRecovery) return null
    const bandForRest = bandStateForTravel ?? { members: [] }
    const today = Math.max(1, Math.floor(finiteNumberOr(player.day, 1)))
    const byRestDay = [0]
    const costLevels = [playerStateForTravel.fameLevel]
    const guaranteedCosts = [
      calculateGuaranteedDailyCost(
        playerStateForTravel,
        bandForRest,
        restRecovery.social
      )
    ]
    for (let restDay = 1; restDay <= MAX_SIMULATED_REST_DAYS; restDay++) {
      const drops = fameDrops.reduce(
        (sum, effect) => sum + (effect.restDay <= restDay ? effect.amount : 0),
        0
      )
      const costLevel =
        drops > 0
          ? Math.min(
              playerStateForTravel.fameLevel,
              calculateFameLevel(Math.max(0, fame - drops))
            )
          : playerStateForTravel.fameLevel
      costLevels.push(costLevel)
      guaranteedCosts.push(
        calculateGuaranteedDailyCost(
          { fameLevel: costLevel },
          bandForRest,
          restRecovery.social
        )
      )
      byRestDay.push(
        calculateDailyNetCost(
          { day: today + restDay, fameLevel: costLevel },
          bandForRest,
          restRecovery.social
        )
      )
    }
    return {
      guaranteed: calculateGuaranteedDailyCost(
        playerStateForTravel,
        bandForRest,
        restRecovery.social
      ),
      byRestDay,
      costLevels,
      guaranteedCosts
    }
  })()
  const canRecoverByResting = (
    scenarioDailyObligations: number,
    startingMoney: number,
    customCtx?: Parameters<typeof checkReachabilityWithMoneyAndFuel>[2]
  ): boolean => {
    if (!restLivingCosts) return false
    const assetAndLoanCost =
      scenarioDailyObligations - restLivingCosts.guaranteed
    // Cash without any donation: clamped as the tick clamps it, and unclamped
    // for the bankruptcy test, which the donations made before the rest
    // cushion.
    let restedMoney = startingMoney
    let settledMoney = startingMoney
    let projectedAssets = customCtx?.assets ?? restRecovery?.assets
    let projectedLiabilities =
      customCtx?.liabilities ?? restRecovery?.liabilities
    const initialAssetCost = projectedAssets
      ? getRestAssetDailyCost(projectedAssets)
      : 0
    for (let restDay = 1; restDay <= MAX_SIMULATED_REST_DAYS; restDay++) {
      const guaranteed =
        restLivingCosts.guaranteedCosts[restDay] ?? restLivingCosts.guaranteed
      const costLevel =
        restLivingCosts.costLevels[restDay] ?? playerStateForTravel.fameLevel
      const newAssetIncome = successes.reduce(
        (sum, effect) =>
          sum + (effect.restDay < restDay ? effect.dailyIncome : 0),
        0
      )
      const nextAssetIncome = successes.reduce(
        (sum, effect) =>
          sum + (effect.restDay <= restDay ? effect.dailyIncome : 0),
        0
      )
      const saleCredit = successes.reduce(
        (sum, effect) =>
          sum + (effect.restDay <= restDay ? effect.saleProceeds : 0),
        0
      )
      let dayCost = assetAndLoanCost + (restLivingCosts.byRestDay[restDay] ?? 0)
      let departureContext = {
        ...customCtx,
        fameLevel: costLevel,
        dailyObligations:
          scenarioDailyObligations +
          guaranteed -
          restLivingCosts.guaranteed -
          nextAssetIncome
      }
      if (projectedAssets && projectedLiabilities) {
        // Settle asset cash before loans, then living costs. Missing payments
        // are skipped, and foreclosure/payoff changes the arrival obligations.
        const availableMoney = Math.max(0, settledMoney)
        const projection = projectRestLiabilities(
          availableMoney -
            Math.min(initialAssetCost, getRestAssetDailyCost(projectedAssets)),
          projectedAssets,
          projectedLiabilities
        )
        projectedAssets = projection.assets
        projectedLiabilities = projection.liabilities
        dayCost =
          availableMoney -
          projection.money +
          (restLivingCosts.byRestDay[restDay] ?? 0)
        departureContext = {
          ...departureContext,
          dailyObligations:
            Math.min(
              scenarioDailyObligations +
                guaranteed -
                restLivingCosts.guaranteed,
              guaranteed +
                Math.min(initialAssetCost, projection.assetDailyCost) +
                projection.installmentDailyCost
            ) - nextAssetIncome,
          // Retain the best fuel consumption: optimistic cash/donation paths
          // can pay a loan that the no-donation projection forecloses.
          assetModifiers: {
            ...projection.assetModifiers,
            fuelMultiplier: Math.min(
              finiteNumberOr(
                (customCtx?.assetModifiers ?? assetModifiers)?.fuelMultiplier,
                1
              ),
              projection.assetModifiers.fuelMultiplier
            )
          }
        }
      }
      dayCost -= newAssetIncome
      const isIncomeDay = dayCost < 0
      restedMoney = Math.max(-protectedCash, restedMoney - dayCost)
      settledMoney -= dayCost
      // The tick clamps cash at 0 and bankrupts an empty band only while
      // obligations are due (`shouldTriggerBankruptcy`).
      const donatedBeforeRest = restDonationTotals[restDay - 1] ?? 0
      if (
        shouldTriggerBankruptcy(
          Math.max(0, settledMoney + donatedBeforeRest),
          0,
          finiteNumberOr(
            departureContext?.dailyObligations,
            scenarioDailyObligations
          )
        )
      )
        break
      if (
        isIncomeDay &&
        evaluateWithDonations(restedMoney + saleCredit, departureContext)
      )
        return true
      const restTotal = restDonationTotals[restDay] ?? 0
      // Only the largest total is tried. The travel reserve fee,
      // floor(cash / 1000) * 5, rises by at most 5 a step, so a smaller cash
      // level beats a larger one only when they lie under 5 apart; distinct
      // totals never do (marrow pays five bloods plus 0 to 4, so any two
      // differ by at least a blood minus 8 * 4, i.e. 68).
      if (
        (restTotal > donationTotal ||
          hasPendingEffects ||
          projectedLiabilities !== undefined) &&
        evaluateScenario(restedMoney + restTotal + saleCredit, departureContext)
      )
        return true
      // A day that costs money only pays off while the bound still grows.
      if (
        !hasPendingEffects &&
        projectedLiabilities === undefined &&
        !isIncomeDay &&
        restTotal >= finalRestDonationTotal
      )
        break
    }
    return false
  }

  if (canRecoverByResting(dailyObligations, playerMoney)) return false

  // Escape hatch: non-negative net asset proceeds across possible sale
  // combinations, each optionally followed by resting on the post-sale terms.
  if (context.postSaleScenarios && context.postSaleScenarios.length > 0) {
    for (const scenario of context.postSaleScenarios) {
      const totalMoney = playerMoney + finiteNumberOr(scenario.assetProceeds, 0)
      if (evaluateWithDonations(totalMoney, scenario)) return false
      if (
        canRecoverByResting(
          finiteNumberOr(scenario.dailyObligations, dailyObligations),
          totalMoney,
          scenario
        )
      )
        return false
    }
  }

  // Failure to find a sale escape only proves stranding after a complete search.
  // A bounded search must not turn an untested combination into a terminal crisis.
  return context.postSaleScenarios?.exhaustive !== false
}
