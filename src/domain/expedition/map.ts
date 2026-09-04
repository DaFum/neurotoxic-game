/**
 * The one deterministic Expedition route builder.
 *
 * @remarks
 * Tour Prep preview and active play both call {@link buildExpeditionMap} with
 * the canonical root `GameState.runSeed`, so the previewed route and the played
 * route cannot diverge — that parity is what makes route choice a real
 * commitment rather than a reroll.
 *
 * The route is a layered DAG the player walks one layer per `routeStep`, which
 * is what puts the approved 7-9 *meaningful* nodes on a single playthrough
 * while still offering a genuine branch at nearly every step. Always-visible
 * facts (class, danger tier, reward tier, edges) live next to the intel-gated
 * `hidden` block; nothing here decides who may read that block — `nodeIntel`
 * owns entitlement.
 */

import { ALL_VENUES } from '../../data/venues'
import { EXPEDITION_ROUTE_RARE_REWARD_IDS } from './rewardLedger'
import { mulberry32 } from '../../utils/seededRng'
import {
  MAX_EXPEDITION_MEANINGFUL_NODES,
  MIN_EXPEDITION_MEANINGFUL_NODES,
  NEUTRAL_EXPEDITION_ROUTE_PROFILE
} from './defaults'
import type { GameState } from '../../types'
import type { MapNode, Venue } from '../../types/map'
import type { MapNodeType } from '../../utils/mapNodeTypes'
import type {
  ExpeditionMap,
  ExpeditionNodeClass,
  ExpeditionNodeMeta,
  ExpeditionRouteProfile,
  ExpeditionSpecialNodeSubtype,
  ExpeditionTier
} from '../../types/expedition'

/** Widest a middle layer may get, so a branch stays readable. */
const MAX_LAYER_WIDTH = 3

/** Narrowest a middle layer may get; `1` would remove the route decision. */
const MIN_LAYER_WIDTH = 2

/**
 * Maps an Expedition node class onto the existing overworld node-type union,
 * so the route stays renderable by the current map components.
 */
const NODE_TYPE_BY_CLASS: Record<ExpeditionNodeClass, MapNodeType> = {
  START: 'START',
  CLUB_GIG: 'GIG',
  FESTIVAL: 'FESTIVAL',
  SUPPLY_STOP: 'SUPPLY_STOP',
  REST_STOP: 'REST_STOP',
  SPECIAL: 'SPECIAL',
  FINALE: 'FINALE'
}

/** Classes that host an active gig and therefore need a real venue. */
const VENUE_CLASSES: ReadonlySet<ExpeditionNodeClass> =
  new Set<ExpeditionNodeClass>(['START', 'CLUB_GIG', 'FESTIVAL', 'FINALE'])

/**
 * Earliest `routeStep` at which voluntary extraction is offered.
 *
 * @remarks
 * The design requires early mistakes to stay recoverable, so the first two
 * steps are a commitment rather than a decision point; from here on the
 * push-your-luck choice is live at every non-finale node.
 */
export const FIRST_EXPEDITION_EXTRACTION_ROUTE_STEP = 3 as const

const clampInt = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(value)))

/**
 * Route depth below which a node never carries a rare reward.
 *
 * @remarks
 * A rare on the first hop would be secured before the first extraction window
 * even opens, which would drain the push-your-luck decision of its tension.
 */
const RARE_REWARD_MIN_DEPTH_RATIO = 0.3

/** Share of eligible nodes that carry a rare reward. */
const RARE_REWARD_CHANCE = 0.3

/**
 * Picks the rare reward a node yields, if any.
 *
 * @param roll - Deterministic roll from the route RNG.
 * @param depthRatio - Node depth as a fraction of the route length.
 * @param isStart - Whether the node is the start node.
 * @returns A registry reward id, or `null`.
 */
const pickRouteRareReward = (
  roll: number,
  depthRatio: number,
  isStart: boolean
): string | null => {
  if (isStart || depthRatio < RARE_REWARD_MIN_DEPTH_RATIO) return null
  if (roll >= RARE_REWARD_CHANCE) return null
  const pool = EXPEDITION_ROUTE_RARE_REWARD_IDS
  if (pool.length === 0) return null
  const index = Math.min(
    pool.length - 1,
    Math.floor((roll / RARE_REWARD_CHANCE) * pool.length)
  )
  return pool[index] ?? null
}

/**
 * FNV-1a over the canonical route description.
 *
 * @param value - Canonical serialization of the built route.
 * @returns Lowercase hex digest used as the structural identity.
 *
 * @remarks
 * The START transaction compares this against the hash of the map it rebuilds
 * from committed state, so a caller cannot start a run on a route the preview
 * never showed. It is a structural fingerprint, not a security primitive.
 */
export const hashExpeditionRoute = (value: string): string => {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/**
 * Resolves the meaningful-node count into the approved 7-9 corridor.
 *
 * @param profile - Route profile supplying the requested count.
 * @returns An integer inside the corridor.
 */
const resolveMeaningfulNodeCount = (
  profile: ExpeditionRouteProfile
): number => {
  const requested = Number.isFinite(profile.meaningfulNodeCount)
    ? profile.meaningfulNodeCount
    : NEUTRAL_EXPEDITION_ROUTE_PROFILE.meaningfulNodeCount
  return clampInt(
    requested,
    MIN_EXPEDITION_MEANINGFUL_NODES,
    MAX_EXPEDITION_MEANINGFUL_NODES
  )
}

const pickWeighted = (
  roll: number,
  entries: ReadonlyArray<{ value: ExpeditionNodeClass; weight: number }>
): ExpeditionNodeClass => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  if (total <= 0) return 'CLUB_GIG'
  let cursor = roll * total
  for (const entry of entries) {
    cursor -= entry.weight
    if (cursor < 0) return entry.value
  }
  return entries[entries.length - 1]?.value ?? 'CLUB_GIG'
}

const tierFromScore = (score: number): ExpeditionTier => {
  if (score < 0.34) return 'low'
  if (score < 0.67) return 'moderate'
  return 'high'
}

/**
 * Coarse danger contribution of a node class, before route depth.
 */
const CLASS_DANGER_BIAS: Record<ExpeditionNodeClass, number> = {
  START: 0,
  CLUB_GIG: 0.1,
  FESTIVAL: 0.25,
  SUPPLY_STOP: -0.1,
  REST_STOP: -0.25,
  SPECIAL: 0.35,
  FINALE: 0.4
}

/**
 * Coarse reward contribution of a node class, before route depth.
 */
const CLASS_REWARD_BIAS: Record<ExpeditionNodeClass, number> = {
  START: 0,
  CLUB_GIG: 0.1,
  FESTIVAL: 0.3,
  SUPPLY_STOP: -0.05,
  REST_STOP: -0.2,
  SPECIAL: 0.25,
  FINALE: 0.45
}

interface LayerPlan {
  layer: number
  width: number
}

/**
 * Plans layer widths so the player walks exactly `meaningfulNodeCount` layers.
 */
const planLayers = (
  meaningfulNodeCount: number,
  rng: () => number
): LayerPlan[] => {
  const plans: LayerPlan[] = [{ layer: 0, width: 1 }]
  // Layers 1..n-1 are the branching middle; the last meaningful layer is the
  // single Finale, so it is always reachable from every surviving route.
  for (let layer = 1; layer < meaningfulNodeCount; layer++) {
    const width =
      MIN_LAYER_WIDTH +
      Math.floor(rng() * (MAX_LAYER_WIDTH - MIN_LAYER_WIDTH + 1))
    plans.push({
      layer,
      width: clampInt(width, MIN_LAYER_WIDTH, MAX_LAYER_WIDTH)
    })
  }
  plans.push({ layer: meaningfulNodeCount, width: 1 })
  return plans
}

const nodeId = (layer: number, index: number): string => `exp_${layer}_${index}`

/**
 * Picks the venue pool entry for a gig-hosting node.
 *
 * @remarks
 * Real venues keep the route playable through the existing gig flow instead of
 * inventing a parallel venue system. The home venue is reserved for START.
 */
const pickVenue = (roll: number, offset: number): Venue | undefined => {
  const pool = ALL_VENUES.filter(venue => venue.type !== 'HOME')
  if (pool.length === 0) return undefined
  const index = (Math.floor(roll * pool.length) + offset) % pool.length
  return pool[index] as Venue | undefined
}

const pickHomeVenue = (): Venue | undefined =>
  (ALL_VENUES.find(venue => venue.type === 'HOME') ?? ALL_VENUES[0]) as
    Venue | undefined

/**
 * Bounded memo cache for built routes.
 *
 * @remarks
 * The builder is pure, and every reducer handler plus the map selector rebuilds
 * the route from the same inputs on each call. Caching keeps a state-change
 * cascade from re-running node generation dozens of times; the bound stops a
 * long session from retaining every route it ever previewed.
 */
const ROUTE_CACHE = new Map<string, ExpeditionMap>()
const ROUTE_CACHE_LIMIT = 8

/**
 * Builds the deterministic Expedition route for one run.
 *
 * @param runSeed - The canonical root `GameState.runSeed`.
 * @param tourTypeId - Committed Tour archetype id.
 * @param regionId - Committed Region id.
 * @param routeProfile - Route weights; G1 passes neutral values and G5 supplies
 * the typed Region/Tour profile without changing this signature.
 * @returns The route shared by Tour Prep preview and active play.
 */
export const buildExpeditionMap = (
  runSeed: number,
  tourTypeId: string,
  regionId: string,
  routeProfile: ExpeditionRouteProfile = NEUTRAL_EXPEDITION_ROUTE_PROFILE
): ExpeditionMap => {
  const seed = Math.trunc(Number.isFinite(runSeed) ? runSeed : 0) >>> 0
  const cacheKey = [
    seed,
    tourTypeId,
    regionId,
    routeProfile.meaningfulNodeCount,
    routeProfile.specialWeight,
    routeProfile.festivalWeight,
    routeProfile.restWeight,
    routeProfile.supplyWeight,
    routeProfile.undergroundAllowed,
    routeProfile.rivalAllowed
  ].join('|')
  const cached = ROUTE_CACHE.get(cacheKey)
  if (cached) return cached

  const rng = mulberry32(seed)
  const meaningfulNodeCount = resolveMeaningfulNodeCount(routeProfile)
  const layers = planLayers(meaningfulNodeCount, rng)

  const nodes: Record<string, MapNode> = {}
  const meta: Record<string, ExpeditionNodeMeta> = {}
  const nodeOrder: string[] = []
  const idsByLayer: string[][] = []

  const weightedEntries = [
    { value: 'CLUB_GIG', weight: 2 },
    { value: 'FESTIVAL', weight: Math.max(0, routeProfile.festivalWeight) },
    { value: 'SUPPLY_STOP', weight: Math.max(0, routeProfile.supplyWeight) },
    { value: 'REST_STOP', weight: Math.max(0, routeProfile.restWeight) }
  ] as const satisfies ReadonlyArray<{
    value: ExpeditionNodeClass
    weight: number
  }>

  // Reserved special placements. The design requires Rival and Underground
  // classes to exist on a Standard route, so they are placed rather than left
  // to a weighted roll that could omit them entirely.
  const middleLayerCount = meaningfulNodeCount - 1
  const rivalLayer = routeProfile.rivalAllowed
    ? clampInt(
        1 + Math.floor(rng() * Math.max(1, middleLayerCount - 2)),
        1,
        middleLayerCount
      )
    : -1
  let undergroundLayer = -1
  if (routeProfile.undergroundAllowed) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = clampInt(
        2 + Math.floor(rng() * Math.max(1, middleLayerCount - 1)),
        1,
        middleLayerCount
      )
      if (candidate !== rivalLayer) {
        undergroundLayer = candidate
        break
      }
    }
  }

  for (const plan of layers) {
    const layerIds: string[] = []
    for (let index = 0; index < plan.width; index++) {
      const id = nodeId(plan.layer, index)
      const isStart = plan.layer === 0
      const isFinale = plan.layer === meaningfulNodeCount

      let nodeClass: ExpeditionNodeClass
      let specialSubtype: ExpeditionSpecialNodeSubtype | null = null
      if (isStart) {
        nodeClass = 'START'
      } else if (isFinale) {
        nodeClass = 'FINALE'
      } else if (plan.layer === rivalLayer && index === 0) {
        nodeClass = 'SPECIAL'
        specialSubtype = 'RIVAL_ENCOUNTER'
      } else if (plan.layer === undergroundLayer && index === plan.width - 1) {
        nodeClass = 'SPECIAL'
        specialSubtype = rng() < 0.5 ? 'UNDERGROUND_MARKET' : 'BLACK_MARKET'
      } else {
        nodeClass = pickWeighted(rng(), weightedEntries)
      }

      const depthRatio = plan.layer / meaningfulNodeCount
      const dangerTier = tierFromScore(
        depthRatio * 0.6 + CLASS_DANGER_BIAS[nodeClass] + rng() * 0.15
      )
      const rewardTier = tierFromScore(
        depthRatio * 0.55 + CLASS_REWARD_BIAS[nodeClass] + rng() * 0.15
      )

      const venue = isStart
        ? pickHomeVenue()
        : VENUE_CLASSES.has(nodeClass)
          ? pickVenue(rng(), plan.layer + index)
          : undefined

      nodes[id] = {
        id,
        layer: plan.layer,
        type: NODE_TYPE_BY_CLASS[nodeClass],
        // Layer 0 is the only unlocked node at build time; arrival logic owns
        // progression from there.
        status: isStart ? 'unlocked' : 'locked',
        x: 50 + (index - (plan.width - 1) / 2) * 14,
        y: 8 + (plan.layer * 84) / Math.max(1, meaningfulNodeCount),
        neighbors: [],
        ...(venue ? { venue, venueId: venue.id } : {})
      }

      meta[id] = {
        nodeId: id,
        routeStep: plan.layer,
        nodeClass,
        specialSubtype,
        dangerTier,
        rewardTier,
        isMeaningful: !isStart,
        isExtractionWindow:
          !isStart &&
          !isFinale &&
          plan.layer >= FIRST_EXPEDITION_EXTRACTION_ROUTE_STEP,
        hidden: {
          exactPayout: Math.round(
            (40 + rng() * 260) * (1 + depthRatio) * (isFinale ? 2.5 : 1)
          ),
          exactWearCost: Math.round((2 + rng() * 10) * (1 + depthRatio)),
          eventId: rng() < 0.45 ? `exp_event_${plan.layer}_${index}` : null,
          rivalId:
            specialSubtype === 'RIVAL_ENCOUNTER' ? 'rival_primary' : null,
          authorityRisk: Math.round(rng() * 100) / 100,
          hiddenOpportunityId:
            rng() < 0.2 ? `exp_opportunity_${plan.layer}_${index}` : null,
          // Route rares are the greed the extraction decision is about, so
          // they sit on the deeper half of the route where the player has
          // already committed something.
          rareRewardId: pickRouteRareReward(rng(), depthRatio, isStart)
        }
      }

      layerIds.push(id)
      nodeOrder.push(id)
    }
    idsByLayer.push(layerIds)
  }

  // Edges: each node reaches its own index and the next one in the following
  // layer, so a route decision survives every width change while every node
  // stays reachable (orphans are adopted by the nearest predecessor).
  const connections: Array<{ from: string; to: string }> = []
  const addEdge = (from: string, to: string) => {
    if (from === to) return
    const fromNode = nodes[from]
    if (!fromNode) return
    const neighbors = Array.isArray(fromNode.neighbors)
      ? (fromNode.neighbors as string[])
      : []
    if (neighbors.includes(to)) return
    neighbors.push(to)
    fromNode.neighbors = neighbors
    connections.push({ from, to })
  }

  for (let layer = 0; layer < idsByLayer.length - 1; layer++) {
    const current = idsByLayer[layer] ?? []
    const next = idsByLayer[layer + 1] ?? []
    if (next.length === 0) continue
    for (let index = 0; index < current.length; index++) {
      const from = current[index]
      if (from === undefined) continue
      const primary = next[Math.min(index, next.length - 1)]
      if (primary !== undefined) addEdge(from, primary)
      const secondary = next[Math.min(index + 1, next.length - 1)]
      if (secondary !== undefined) addEdge(from, secondary)
    }
    for (let index = 0; index < next.length; index++) {
      const to = next[index]
      if (to === undefined) continue
      if (connections.some(edge => edge.to === to)) continue
      const from = current[Math.min(index, current.length - 1)]
      if (from !== undefined) addEdge(from, to)
    }
  }

  const startNodeId = idsByLayer[0]?.[0] ?? nodeId(0, 0)
  const finaleNodeId =
    idsByLayer[idsByLayer.length - 1]?.[0] ?? nodeId(meaningfulNodeCount, 0)

  const canonical = [
    `seed=${seed}`,
    `tour=${tourTypeId}`,
    `region=${regionId}`,
    `nodes=${nodeOrder
      .map(id => {
        const entry = meta[id]
        return entry
          ? `${id}:${entry.nodeClass}:${entry.specialSubtype ?? '-'}:${entry.dangerTier}:${entry.rewardTier}:${entry.hidden.rareRewardId ?? '-'}`
          : id
      })
      .join(',')}`,
    `edges=${connections.map(edge => `${edge.from}>${edge.to}`).join(',')}`
  ].join('|')

  const built: ExpeditionMap = {
    mapHash: hashExpeditionRoute(canonical),
    tourTypeId,
    regionId,
    runSeed: seed,
    startNodeId,
    finaleNodeId,
    nodes,
    connections,
    meta,
    nodeOrder
  }

  if (ROUTE_CACHE.size >= ROUTE_CACHE_LIMIT) {
    const oldest = ROUTE_CACHE.keys().next().value
    if (oldest !== undefined) ROUTE_CACHE.delete(oldest)
  }
  ROUTE_CACHE.set(cacheKey, built)
  return built
}

/**
 * Rebuilds the route of the currently active run.
 *
 * @param state - Current game state.
 * @returns The active route, or `null` when no run is active.
 *
 * @remarks
 * The route is always derived from the canonical root `runSeed` plus the
 * committed Tour/Region rather than stored, and the builder memoizes, so
 * repeated calls are cheap. Existing call sites inline this rebuild; new code
 * should go through here.
 */
export const getActiveExpeditionMap = (
  state: GameState
): ExpeditionMap | null => {
  const loadout = state.expedition?.loadout
  if (state.expedition?.status !== 'active' || !loadout) return null
  return buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )
}

/**
 * Lists the always-visible facts for one node.
 *
 * @param map - Built Expedition route.
 * @param targetNodeId - Node to describe.
 * @returns The unconditionally visible route facts, or `null` for an unknown id.
 *
 * @remarks
 * Deliberately excludes the `hidden` block: this is the projection a player
 * with intel level `0` may see, and keeping it a separate function stops a UI
 * from accidentally rendering intel it has not earned.
 */
export const getExpeditionNodePublicFacts = (
  map: ExpeditionMap,
  targetNodeId: string
): {
  nodeId: string
  routeStep: number
  nodeClass: ExpeditionNodeClass
  specialSubtype: ExpeditionSpecialNodeSubtype | null
  dangerTier: ExpeditionTier
  rewardTier: ExpeditionTier
  isExtractionWindow: boolean
  edges: string[]
} | null => {
  if (!Object.hasOwn(map.meta, targetNodeId)) return null
  const entry = map.meta[targetNodeId]
  if (!entry) return null
  return {
    nodeId: entry.nodeId,
    routeStep: entry.routeStep,
    nodeClass: entry.nodeClass,
    specialSubtype: entry.specialSubtype,
    dangerTier: entry.dangerTier,
    rewardTier: entry.rewardTier,
    isExtractionWindow: entry.isExtractionWindow,
    edges: map.connections
      .filter(edge => edge.from === targetNodeId)
      .map(edge => edge.to)
  }
}

/**
 * Checks that the Finale is reachable from the start node.
 *
 * @param map - Built Expedition route.
 * @returns True when a path exists.
 *
 * @remarks
 * The design forbids a silently unwinnable route, so this is asserted on every
 * built map rather than only in tests.
 */
export const isExpeditionFinaleReachable = (map: ExpeditionMap): boolean => {
  const adjacency = new Map<string, string[]>()
  for (const edge of map.connections) {
    const list = adjacency.get(edge.from)
    if (list) list.push(edge.to)
    else adjacency.set(edge.from, [edge.to])
  }
  const seen = new Set<string>([map.startNodeId])
  const queue = [map.startNodeId]
  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) continue
    if (current === map.finaleNodeId) return true
    for (const next of adjacency.get(current) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(next)
    }
  }
  return false
}
