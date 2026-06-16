// Generates a directed acyclic graph (DAG) for the tour
/*
 * #1 Updates:
 * - Refactored index-based `for` loops (previously converted from `forEach` closures) to `for...of` loops across multiple map generation steps to improve readability while maintaining the performance benefits of avoiding closure allocations.
 * - Hoisted constant definitions (`padding = 10`) outside the main simulation iteration loop in `resolveOverlaps`.
 * - Optimized `pickRandomSubset` to avoid shallow copying the source array when picking small subsets (k = 1 or k = 2), avoiding heap allocations in hot loops.
 * - Added a sparse Fisher-Yates shuffle optimization using a Map for small sample sizes (`k < n/4`) to avoid `O(n)` array shallow copy overhead.
 * - Refactored MapGenerator into smaller files to improve maintainability and readability.
 *
 * - Monitor performance for exceptionally large maps (depth > 50).
 * - Consider WebWorker offloading if `resolveOverlaps` becomes a bottleneck on mobile.
 *
 * #3 Errors + Solutions:
 * - Issue: `pickRandomSubset` was performing a shallow copy of the entire array via the spread operator `[...arr]` on every invocation, causing performance bottlenecks in hot loops.
 * - Solution: Added fast-paths for `k = 1` and `k = 2` that select random elements directly via index calculation, avoiding a full shallow copy of the source array for the most common use cases while still allocating the returned subset array.
 * - Issue: The shallow copy strategy was also causing unnecessary heap allocations for other small random subset selections (`k < n/4`).
 * - Solution: Implemented the sparse Fisher-Yates shuffle optimization.
 */

import { ALL_VENUES } from '../data/venues'
import { StateError } from './errorHandler'
import { HQ_ITEMS } from '../data/hqItems'
import { finiteNumberOr } from './finiteNumber'
import type { Venue } from '../types'
import {
  getCityKeyFromVenueId,
  deriveCityTraits
} from './mapGenerator/cityTraits'
import {
  assignInitialCoordinates,
  resolveOverlaps
} from './mapGenerator/layout'
import { pickRandomSubset } from './mapGenerator/mathUtils'
import type {
  GeneratedMapNode,
  MapGeneratorState,
  VenuePools
} from './mapGenerator/types'

export { getCityKeyFromVenueId, deriveCityTraits }
export type { GeneratedMapNode, MapGeneratorState, VenuePools }

let cachedHomeVenue: Venue | null = null
let cachedFinaleVenue: Venue | null = null
let cachedVenuesLength: number = -1

const getVenueCoord = (venue: Venue, axis: 'x' | 'y', fallback: number) =>
  finiteNumberOr(venue[axis], fallback)

/**
 * Procedural generation for the game map using a Directed Acyclic Graph (DAG).
 */
export class MapGenerator {
  /**
   * Mutable RNG seed advanced by `random()`.
   */
  seed: number

  /**
   * Creates a new MapGenerator instance.
   * @param seed - The seed for the random number generator.
   */
  constructor(seed: number) {
    const s = Number(seed)
    this.seed = Number.isFinite(s) ? s : Date.now()
  }

  /**
   * Linear Congruential Generator for seeded random numbers.
   * @returns A float between 0 and 1.
   */
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  /**
   * Generates a tour map with layers of nodes.
   * Structure: Array of Layers. Each Layer has Nodes. Each Node has connections to next layer.
   * @param depth - The number of layers in the map. Defaults to `10`.
   * @returns The generated map object containing layers, nodes, and connections.
   *
   * @throws {@link StateError}
   * Throws when required venue pools are missing or empty.
   */
  generateMap(depth: number = 10): MapGeneratorState {
    const validDepth = Math.floor(depth)
    if (!Number.isFinite(validDepth) || validDepth < 1) {
      return {
        layers: [],
        nodes: {},
        nodeList: [],
        connections: [],
        cityStates: {}
      }
    }

    const map: MapGeneratorState = {
      layers: [],
      nodes: {},
      nodeList: [],
      connections: [],
      cityStates: {}
    }

    // Layer 0: Stendal (Home)
    const homeVenue = this._resolveHomeVenue()
    const startNode: GeneratedMapNode = {
      id: 'node_0_0',
      layer: 0,
      venue: homeVenue,
      status: 'unlocked' as const, // unlocked, completed, locked
      type: 'START' as const,
      x: getVenueCoord(homeVenue, 'x', 50),
      y: getVenueCoord(homeVenue, 'y', 10)
    }
    map.layers.push([startNode])
    map.nodes[startNode.id] = startNode
    map.nodeList.push(startNode)

    // Filter venues by difficulty for progression
    const { easyVenues, mediumVenues, hardVenues } =
      this._partitionVenuesByDifficulty()

    // Track used venues to avoid duplicates
    const usedVenueIds = new Set<string>()
    usedVenueIds.add(homeVenue.id)

    const inventoryAddItems = HQ_ITEMS.gear.filter(
      i => i.effect?.type === 'inventory_add'
    ) as import('../types/components').PurchaseItem[]

    // Pre-reserve Finale Venue (Leipzig Arena) so it is not picked randomly
    if (cachedFinaleVenue) usedVenueIds.add(cachedFinaleVenue.id)

    const pools = {
      easyVenues,
      mediumVenues,
      hardVenues,
      usedVenueIds
    }

    this._generateIntermediateLayers(map, validDepth, pools, inventoryAddItems)
    this._generateConnections(map, validDepth)
    this._generateFinaleLayer(map, validDepth, hardVenues, pools)

    // Extracted layout logic
    assignInitialCoordinates(map.nodeList, () => this.random())
    resolveOverlaps(map.nodeList, () => this.random())

    this._populateCityStates(map)

    return map
  }

  /**
   * Generates deterministic city traits for each unique city found on the generated map.
   */
  _populateCityStates(map: MapGeneratorState): void {
    for (const node of map.nodeList) {
      if (node.venue && node.venue.id) {
        const cityName = getCityKeyFromVenueId(node.venue.id)
        if (!cityName) continue

        // Reuse the hash-based derivation so newly generated maps and
        // backfilled legacy saves produce the same traits for the same city.
        if (!Object.hasOwn(map.cityStates, cityName)) {
          map.cityStates[cityName] = deriveCityTraits(cityName)
        }
      }
    }
  }

  /**
   * Resolves the home (layer-0) venue, refreshing the module venue cache when
   * `ALL_VENUES` has changed.
   * @returns The "stendal_proberaum" home venue.
   * @throws {@link StateError} When the home venue is absent from `ALL_VENUES`.
   */
  _resolveHomeVenue(): Venue {
    if (cachedVenuesLength !== ALL_VENUES.length) {
      cachedHomeVenue = null
      cachedFinaleVenue = null
      for (const v of ALL_VENUES) {
        if (v.id === 'stendal_proberaum') {
          cachedHomeVenue = v
        } else if (v.id === 'leipzig_arena') {
          cachedFinaleVenue = v
        }

        if (cachedHomeVenue && cachedFinaleVenue) {
          break
        }
      }
      cachedVenuesLength = ALL_VENUES.length
    }

    if (!cachedHomeVenue) {
      throw new StateError(
        'Home venue "stendal_proberaum" not found in ALL_VENUES'
      )
    }
    return cachedHomeVenue
  }

  /**
   * Partitions non-home venues into easy/medium/hard difficulty pools.
   * @returns The three difficulty-bucketed venue pools.
   */
  _partitionVenuesByDifficulty(): VenuePools {
    const easyVenues: Venue[] = []
    const mediumVenues: Venue[] = []
    const hardVenues: Venue[] = []
    for (let i = 0; i < ALL_VENUES.length; i++) {
      const v = ALL_VENUES[i]
      if (!v) continue
      const diff = v.diff
      if (typeof diff === 'number' && diff <= 2) {
        if (v.type !== 'HOME') easyVenues.push(v)
      } else if (diff === 3) {
        if (v.type !== 'HOME') mediumVenues.push(v)
      } else if (typeof diff === 'number' && diff >= 4) {
        if (v.type !== 'HOME') hardVenues.push(v)
      }
    }
    return { easyVenues, mediumVenues, hardVenues }
  }

  /**
   * Generates intermediate layers of the map.
   * @param map - Mutable map state being populated.
   * @param depth - The total depth of the map.
   * @param pools - The available and fallback venue pools.
   */
  _generateIntermediateLayers(
    map: MapGeneratorState,
    depth: number,
    pools: VenuePools & { usedVenueIds: Set<string> },
    inventoryAddItems: import('../types/components').PurchaseItem[]
  ): void {
    const { easyVenues, mediumVenues, hardVenues, usedVenueIds } = pools

    const countAvailableVenues = (pool: Venue[]) => {
      let available = 0
      for (let k = 0; k < pool.length; k++) {
        const venue = pool[k]
        if (!venue) continue
        if (!usedVenueIds.has(venue.id)) {
          available++
        }
      }
      return available
    }

    for (let i = 1; i < depth; i++) {
      const layerNodes = []
      // Determine node count for this layer (2-4 branching)
      const nodeCount = Math.floor(this.random() * 3) + 2

      // Compute available counts once per layer, then decrement as venues are reserved
      const available = {
        easy: countAvailableVenues(easyVenues),
        medium: countAvailableVenues(mediumVenues),
        hard: countAvailableVenues(hardVenues)
      }

      for (let j = 0; j < nodeCount; j++) {
        const venue = this._pickIntermediateVenue(i, j, pools, available)
        const nodeType = this._rollNodeType(venue)

        const node: GeneratedMapNode = {
          id: `node_${i}_${j}`,
          layer: i,
          venue, // Note: Venue references might be duplicated across layers, which is okay for "touring"
          status: 'locked',
          type: nodeType,
          x: getVenueCoord(venue, 'x', 50),
          y: getVenueCoord(venue, 'y', i * 10 + 10)
        }

        if (nodeType === 'SUPPLY_STOP') {
          node.shopInventory = pickRandomSubset(inventoryAddItems, 3, () =>
            this.random()
          )
        }

        layerNodes.push(node)
        map.nodes[node.id] = node
        map.nodeList.push(node)
      }
      map.layers.push(layerNodes)
    }
  }

  /**
   * Chooses the difficulty pool to draw from for a layer, cascading to other
   * pools when the layer's primary pool has no unused venues left. Pure — reads
   * `available` counts without mutating state or consuming RNG.
   * @param layerIndex - Current layer index (1-based intermediate layer).
   * @param pools - Difficulty venue pools.
   * @param available - Remaining counts per difficulty pool.
   * @returns The chosen pool array and its remaining-available count.
   */
  _selectVenuePool(
    layerIndex: number,
    pools: VenuePools,
    available: { easy: number; medium: number; hard: number }
  ): { poolArray: Venue[]; poolLength: number } {
    const { easyVenues, mediumVenues, hardVenues } = pools
    const i = layerIndex

    let poolArray: Venue[]
    let poolLength: number

    if (i < 3) {
      poolArray = easyVenues
      poolLength = available.easy
    } else if (i < 7) {
      poolArray = mediumVenues
      poolLength = available.medium
    } else {
      poolArray = hardVenues
      poolLength = available.hard
    }

    // Fallback when primary pool is exhausted
    if (poolLength === 0) {
      if (i < 3) {
        poolArray = mediumVenues
        poolLength = available.medium
        if (poolLength === 0) {
          poolArray = hardVenues
          poolLength = available.hard
        }
      } else if (i < 7) {
        poolArray = hardVenues
        poolLength = available.hard
      } else {
        // Hard pool exhausted: cascade down through medium then easy
        poolArray = mediumVenues
        poolLength = available.medium
        if (poolLength === 0) {
          poolArray = easyVenues
          poolLength = available.easy
        }
      }
    }

    return { poolArray, poolLength }
  }

  /**
   * Selects (and reserves) a venue for an intermediate-layer node, cascading
   * through difficulty pools and a duplicate-allowing fallback when a pool is
   * exhausted. Mutates `pools.usedVenueIds` and the `available` counts.
   * @param layerIndex - Current layer index (1-based intermediate layer).
   * @param nodeIndex - Node index within the layer (for error context).
   * @param pools - Difficulty venue pools plus the reserved-id set.
   * @param available - Mutable remaining counts per difficulty pool.
   * @returns The selected venue.
   * @throws {@link StateError} When no venue can be selected.
   */
  _pickIntermediateVenue(
    layerIndex: number,
    nodeIndex: number,
    pools: VenuePools & { usedVenueIds: Set<string> },
    available: { easy: number; medium: number; hard: number }
  ): Venue {
    const { easyVenues, mediumVenues, hardVenues, usedVenueIds } = pools
    const i = layerIndex
    const j = nodeIndex

    const { poolArray, poolLength } = this._selectVenuePool(i, pools, available)

    let venue: Venue | null = null

    if (poolLength > 0) {
      // Dynamic subset selection with single pass filtering
      let targetIndex = Math.floor(this.random() * poolLength)
      for (let k = 0; k < poolArray.length; k++) {
        const v = poolArray[k]
        if (!v) continue
        if (!usedVenueIds.has(v.id)) {
          if (targetIndex === 0) {
            venue = v
            break
          }
          targetIndex--
        }
      }

      if (!venue) {
        throw new StateError(
          `Failed to select venue from pool at layer=${i} index=${j}`,
          {
            layer: i,
            index: j,
            targetIndex,
            poolLength: poolArray.length,
            usedVenueIds: usedVenueIds.size
          }
        )
      }

      usedVenueIds.add(venue.id)
      if (poolArray === easyVenues) available.easy--
      else if (poolArray === mediumVenues) available.medium--
      else available.hard--
    } else {
      // Absolute zero-resort fallback: allow duplicates from full pool to prevent crash,
      // but exclude specialized venues.
      const fallbackArray =
        i < 3 ? easyVenues : i < 7 ? mediumVenues : hardVenues
      let fallbackLength = 0
      for (let k = 0; k < fallbackArray.length; k++) {
        const v = fallbackArray[k]
        if (!v) continue
        if (v.id !== 'leipzig_arena' && v.id !== 'stendal_proberaum') {
          fallbackLength++
        }
      }
      if (fallbackLength === 0) {
        throw new StateError(`Empty fallback pool for difficulty ${i}`)
      }

      let targetIndex = Math.floor(this.random() * fallbackLength)
      for (let k = 0; k < fallbackArray.length; k++) {
        const v = fallbackArray[k]
        if (!v) continue
        if (v.id !== 'leipzig_arena' && v.id !== 'stendal_proberaum') {
          if (targetIndex === 0) {
            venue = v
            break
          }
          targetIndex--
        }
      }

      if (!venue) {
        throw new StateError(
          `Failed to select venue from fallback pool at layer=${i} index=${j}`,
          {
            layer: i,
            index: j,
            targetIndex,
            poolLength: fallbackArray.length
          }
        )
      }
    }

    return venue
  }

  /**
   * Rolls a node type from a single RNG draw (~70% GIG/FESTIVAL, ~20%
   * REST_STOP/SUPPLY_STOP, ~10% SPECIAL); large-capacity gigs become FESTIVAL.
   * @param venue - Venue used to upgrade large-capacity gigs to FESTIVAL.
   * @returns The selected node type.
   */
  _rollNodeType(venue: Venue): GeneratedMapNode['type'] {
    const typeRoll = this.random()
    let nodeType: GeneratedMapNode['type'] = 'GIG'
    if (typeRoll > 0.9) nodeType = 'SPECIAL'
    else if (typeRoll > 0.8) nodeType = 'SUPPLY_STOP'
    else if (typeRoll > 0.7) nodeType = 'REST_STOP'
    else if ((venue.capacity ?? 0) >= 1000) nodeType = 'FESTIVAL'
    return nodeType
  }

  /**
   * Generates connections between layers.
   * @param map - Mutable map state whose layer nodes receive connections.
   * @param depth - The total depth of the map.
   */
  _generateConnections(map: MapGeneratorState, depth: number): void {
    // Generate Connections
    // Ensure every node in layer I connects to at least one in I+1
    // Ensure every node in layer I+1 has at least one parent in I
    const connectedToIds = new Set()

    for (let i = 0; i < depth - 1; i++) {
      const currentLayer = map.layers[i]
      const nextLayer = map.layers[i + 1]

      if (!currentLayer) {
        throw new StateError(
          `Missing map layer ${i} during connection generation`
        )
      }
      if (!nextLayer) {
        throw new StateError(
          `Missing map layer ${i + 1} during connection generation`
        )
      }

      // Forward pass: ensure everyone connects forward
      for (const node of currentLayer) {
        // Pick 1-2 random targets in next layer
        const numTargets = Math.floor(this.random() * 2) + 1
        const targets = pickRandomSubset(nextLayer, numTargets, () =>
          this.random()
        )
        for (const target of targets) {
          map.connections.push({ from: node.id, to: target.id })
          connectedToIds.add(target.id)
        }
      }

      // Backward pass check: ensure everyone has a parent
      // (Simplified: Just ensure nextLayer nodes are reachable. If not, force connect from random parent)
      for (const node of nextLayer || []) {
        const hasParent = connectedToIds.has(node.id)
        if (!hasParent) {
          const randomParent =
            currentLayer[Math.floor(this.random() * currentLayer.length)]
          if (!randomParent) {
            throw new StateError(
              `Failed to select parent in layer ${i} for node ${node.id}`
            )
          }
          map.connections.push({ from: randomParent.id, to: node.id })
          connectedToIds.add(node.id)
        }
      }
    }
  }

  /**
   * Generates the finale layer.
   * @param map - Mutable map state receiving finale nodes and connections.
   * @param depth - The total depth of the map.
   * @param hardVenues - The hard venues array.
   * @param pools - Venue usage tracker shared with earlier layers.
   */
  _generateFinaleLayer(
    map: MapGeneratorState,
    depth: number,
    hardVenues: Venue[],
    pools: { usedVenueIds: Set<string> }
  ): void {
    // Finale Layer
    const finaleVenue = cachedFinaleVenue || hardVenues[0]

    if (!finaleVenue) {
      throw new StateError('No hard venues available for the finale layer.')
    }

    const { usedVenueIds } = pools
    usedVenueIds.add(finaleVenue.id)

    const endNode: GeneratedMapNode = {
      id: `node_${depth}_0`,
      layer: depth,
      venue: finaleVenue,
      status: 'locked',
      type: 'FINALE',
      x: getVenueCoord(finaleVenue, 'x', 50),
      y: getVenueCoord(finaleVenue, 'y', 90)
    }
    map.layers.push([endNode])
    map.nodes[endNode.id] = endNode
    map.nodeList.push(endNode)

    // Connect last layer to finale
    const lastLayer = map.layers[depth - 1]
    if (lastLayer) {
      for (const node of lastLayer) {
        map.connections.push({ from: node.id, to: endNode.id })
      }
    }
  }

  /**
   * Legacy interface to support tests.
   */
  pickRandomSubset<T>(arr: readonly T[], count: number): T[] {
    return pickRandomSubset(arr, count, () => this.random())
  }
}
