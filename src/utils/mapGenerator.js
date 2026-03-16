// Generates a directed acyclic graph (DAG) for the tour
import { ALL_VENUES } from '../data/venues.js'
import { StateError } from './errorHandler.js'

let cachedHomeVenue = null
let cachedFinaleVenue = null
let cachedVenuesLength = -1

/**
 * Procedural generation for the game map using a Directed Acyclic Graph (DAG).
 */
export class MapGenerator {
  /**
   * Creates a new MapGenerator instance.
   * @param {number} seed - The seed for the random number generator.
   */
  constructor(seed) {
    const s = Number(seed)
    this.seed = Number.isFinite(s) ? s : Date.now()
  }

  /**
   * Linear Congruential Generator for seeded random numbers.
   * @returns {number} A float between 0 and 1.
   */
  random() {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  /**
   * Generates a tour map with layers of nodes.
   * Structure: Array of Layers. Each Layer has Nodes. Each Node has connections to next layer.
   * @param {number} [depth=10] - The number of layers in the map.
   * @returns {object} The generated map object containing layers, nodes, and connections.
   */
  generateMap(depth = 10) {
    const validDepth = Math.floor(depth)
    if (!Number.isFinite(validDepth) || validDepth < 1) {
      return { layers: [], nodes: {}, nodeList: [], connections: [] }
    }

    const map = {
      layers: [],
      nodes: {}, // Map ID to Node Object
      nodeList: [], // Pre-allocated list for performance and GC reduction
      connections: [] // List of [fromId, toId]
    }

    // Layer 0: Stendal (Home)
    if (cachedVenuesLength !== ALL_VENUES.length) {
      cachedHomeVenue = ALL_VENUES.find(v => v.id === 'stendal_proberaum')
      cachedFinaleVenue = ALL_VENUES.find(v => v.id === 'leipzig_arena')
      cachedVenuesLength = ALL_VENUES.length
    }

    const homeVenue = cachedHomeVenue
    if (!homeVenue) {
      throw new StateError(
        'Home venue "stendal_proberaum" not found in ALL_VENUES'
      )
    }
    const startNode = {
      id: 'node_0_0',
      layer: 0,
      venue: homeVenue,
      status: 'unlocked', // unlocked, completed, locked
      type: 'START'
    }
    map.layers.push([startNode])
    map.nodes[startNode.id] = startNode
    map.nodeList.push(startNode)

    // Filter venues by difficulty for progression
    const easyVenues = []
    const mediumVenues = []
    const hardVenues = []
    for (let i = 0; i < ALL_VENUES.length; i++) {
      const v = ALL_VENUES[i]
      if (v.diff <= 2) {
        if (v.type !== 'HOME') easyVenues.push(v)
      } else if (v.diff === 3) {
        mediumVenues.push(v)
      } else if (v.diff >= 4) {
        hardVenues.push(v)
      }
    }

    // Track used venues to avoid duplicates
    const usedVenueIds = new Set()
    if (homeVenue) usedVenueIds.add(homeVenue.id)

    // Pre-reserve Finale Venue (Leipzig Arena) so it is not picked randomly
    if (cachedFinaleVenue) usedVenueIds.add(cachedFinaleVenue.id)

    // Optimization: Maintain dynamic available lengths to avoid .filter() in loops
    let availableEasyLength = 0
    let availableMediumLength = 0
    let availableHardLength = 0

    for (let i = 0; i < easyVenues.length; i++) {
      if (!usedVenueIds.has(easyVenues[i].id)) availableEasyLength++
    }
    for (let i = 0; i < mediumVenues.length; i++) {
      if (!usedVenueIds.has(mediumVenues[i].id)) availableMediumLength++
    }
    for (let i = 0; i < hardVenues.length; i++) {
      if (!usedVenueIds.has(hardVenues[i].id)) availableHardLength++
    }

    const pools = {
      easyVenues,
      mediumVenues,
      hardVenues,
      usedVenueIds,
      availableEasyLength,
      availableMediumLength,
      availableHardLength
    }

    this._generateIntermediateLayers(map, validDepth, pools)
    this._generateConnections(map, validDepth)
    this._generateFinaleLayer(map, validDepth, hardVenues)
    this._assignInitialCoordinates(map)

    // To ensure purity, we clone the nodes before resolving overlaps if possible,
    // but here we are mutating the map object we just created, which is local to this function.
    // However, the resolveOverlaps method signature implies it works on an array.
    // Given the context of "generating" a map, mutating the *newly created* nodes is acceptable locally,
    // but technically the method `resolveOverlaps` mutates its input.
    // For strict purity, we'd return new nodes, but `generateMap` owns `map`.
    // We will keep it mutating the *internal* map structure being built.
    this.resolveOverlaps(map.nodeList)

    return map
  }

  /**
   * Generates intermediate layers of the map.
   * @param {{layers: object[][], nodes: Object<string, object>, nodeList: object[], connections: object[]}} map - The map object.
   * @param {number} depth - The total depth of the map.
   * @param {{availableEasy: object[], availableMedium: object[], availableHard: object[], fallbackEasy: object[], fallbackMedium: object[], fallbackHard: object[]}} pools - The available and fallback venue pools.
   */
  _generateIntermediateLayers(map, depth, pools) {
    let {
      easyVenues,
      mediumVenues,
      hardVenues,
      usedVenueIds,
      availableEasyLength,
      availableMediumLength,
      availableHardLength
    } = pools

    for (let i = 1; i < depth; i++) {
      const layerNodes = []
      // Determine node count for this layer (2-4 branching)
      const nodeCount = Math.floor(this.random() * 3) + 2

      for (let j = 0; j < nodeCount; j++) {
        let poolArray
        let poolLength

        if (i < 3) {
          poolArray = easyVenues
          poolLength = availableEasyLength
        } else if (i < 7) {
          poolArray = mediumVenues
          poolLength = availableMediumLength
        } else {
          poolArray = hardVenues
          poolLength = availableHardLength
        }

        // Fallback to harder pools if the current pool is exhausted
        if (poolLength === 0) {
          if (i < 3) {
            poolArray = mediumVenues
            poolLength = availableMediumLength
          }
          if (poolLength === 0 && i < 7) {
            poolArray = hardVenues
            poolLength = availableHardLength
          }
        }

        let venue = null

        if (poolLength > 0) {
          // Dynamic subset selection with single pass filtering
          let targetIndex = Math.floor(this.random() * poolLength)
          for (let k = 0; k < poolArray.length; k++) {
            const v = poolArray[k]
            if (!usedVenueIds.has(v.id)) {
              if (targetIndex === 0) {
                venue = v
                break
              }
              targetIndex--
            }
          }

          usedVenueIds.add(venue.id)
          if (poolArray === easyVenues) availableEasyLength--
          else if (poolArray === mediumVenues) availableMediumLength--
          else if (poolArray === hardVenues) availableHardLength--
        } else {
          // Absolute zero-resort fallback: allow duplicates from full pool to prevent crash,
          // but exclude specialized venues.
          let fallbackArray =
            i < 3 ? easyVenues : i < 7 ? mediumVenues : hardVenues
          let fallbackLength = 0
          for (let k = 0; k < fallbackArray.length; k++) {
            const v = fallbackArray[k]
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
            if (v.id !== 'leipzig_arena' && v.id !== 'stendal_proberaum') {
              if (targetIndex === 0) {
                venue = v
                break
              }
              targetIndex--
            }
          }
        }

        // Determine Node Type based on probability and venue
        // ~70% GIG/FESTIVAL, ~20% REST_STOP, ~10% SPECIAL
        const typeRoll = this.random()
        let nodeType = 'GIG'
        if (typeRoll > 0.9) nodeType = 'SPECIAL'
        else if (typeRoll > 0.7) nodeType = 'REST_STOP'
        else if (venue.capacity >= 1000) nodeType = 'FESTIVAL'

        const node = {
          id: `node_${i}_${j}`,
          layer: i,
          venue, // Note: Venue references might be duplicated across layers, which is okay for "touring"
          status: 'locked',
          type: nodeType
        }
        layerNodes.push(node)
        map.nodes[node.id] = node
        map.nodeList.push(node)
      }
      map.layers.push(layerNodes)
    }
  }

  /**
   * Generates connections between layers.
   * @param {object} map - The map object.
   * @param {number} depth - The total depth of the map.
   */
  _generateConnections(map, depth) {
    // Generate Connections
    // Ensure every node in layer I connects to at least one in I+1
    // Ensure every node in layer I+1 has at least one parent in I
    const connectedToIds = new Set()

    for (let i = 0; i < depth - 1; i++) {
      const currentLayer = map.layers[i]
      const nextLayer = map.layers[i + 1]

      // Forward pass: ensure everyone connects forward
      currentLayer.forEach(node => {
        // Pick 1-2 random targets in next layer
        const targets = this.pickRandomSubset(
          nextLayer,
          Math.floor(this.random() * 2) + 1
        )
        targets.forEach(target => {
          map.connections.push({ from: node.id, to: target.id })
          connectedToIds.add(target.id)
        })
      })

      // Backward pass check: ensure everyone has a parent
      // (Simplified: Just ensure nextLayer nodes are reachable. If not, force connect from random parent)
      nextLayer.forEach(node => {
        const hasParent = connectedToIds.has(node.id)
        if (!hasParent) {
          const randomParent =
            currentLayer[Math.floor(this.random() * currentLayer.length)]
          map.connections.push({ from: randomParent.id, to: node.id })
          connectedToIds.add(node.id)
        }
      })
    }
  }

  /**
   * Generates the finale layer.
   * @param {object} map - The map object.
   * @param {number} depth - The total depth of the map.
   * @param {Array} hardVenues - The hard venues array.
   */
  _generateFinaleLayer(map, depth, hardVenues) {
    // Finale Layer
    const finaleVenue = cachedFinaleVenue || hardVenues[0]

    const endNode = {
      id: `node_${depth}_0`,
      layer: depth,
      venue: finaleVenue,
      status: 'locked',
      type: 'FINALE'
    }
    map.layers.push([endNode])
    map.nodes[endNode.id] = endNode
    map.nodeList.push(endNode)

    // Connect last layer to finale
    map.layers[depth - 1].forEach(node => {
      map.connections.push({ from: node.id, to: endNode.id })
    })
  }

  /**
   * Assigns initial coordinates to map nodes.
   * @param {object} map - The map object.
   */
  _assignInitialCoordinates(map) {
    // Assign initial coordinates with jitter and resolve overlaps
    // Increased jitter to +/- 5 to help initial separation
    map.nodeList.forEach(node => {
      const baseX = node.venue?.x ?? 50
      const baseY = node.venue?.y ?? 50
      node.x = baseX + (this.random() * 10 - 5)
      node.y = baseY + (this.random() * 10 - 5)
    })
  }

  /**
   * Retrieves candidate node indices from neighboring cells that have an index greater than j.
   * @param {Map} grid - The spatial partitioning grid.
   * @param {number} cellX - The X coordinate of the current cell.
   * @param {number} cellY - The Y coordinate of the current cell.
   * @param {number} j - The index of the current node to preserve directionality.
   * @returns {number[]} Array of candidate node indices.
   * @private
   */
  _getNeighborCandidates(grid, cellX, cellY, j) {
    const candidates = []

    for (let cx = cellX - 1; cx <= cellX + 1; cx++) {
      for (let cy = cellY - 1; cy <= cellY + 1; cy++) {
        const key = cx * 1000 + cy
        const cell = grid.get(key)
        if (!cell) continue

        for (let c = 0; c < cell.length; c++) {
          const k = cell[c]
          // Check only pairs once and preserve j < k direction
          if (k > j) {
            candidates.push(k)
          }
        }
      }
    }

    return candidates
  }

  /**
   * Iteratively pushes overlapping nodes apart to ensure visibility.
   * Note: This method mutates the node objects in the provided list.
   * @param {object[]} nodeList - The list of nodes.
   */
  resolveOverlaps(nodeList) {
    const iterations = 150 // Increased iterations
    const minDistance = 6 // % of map width/height (approx 2x pin size)
    const minDistanceSq = minDistance * minDistance
    // Reduce movement strength over time to stabilize
    let strength = 0.5

    // Optimization: Spatial partitioning to avoid O(N^2) checks
    const cellSize = minDistance

    for (let i = 0; i < iterations; i++) {
      let moved = false

      const grid = new Map()
      for (let j = 0; j < nodeList.length; j++) {
        const n = nodeList[j]
        const cellX = Math.floor(n.x / cellSize)
        const cellY = Math.floor(n.y / cellSize)
        const key = cellX * 1000 + cellY

        let cell = grid.get(key)
        if (!cell) {
          cell = []
          grid.set(key, cell)
        }
        cell.push(j)
      }

      for (let j = 0; j < nodeList.length; j++) {
        const n1 = nodeList[j]
        const cellX = Math.floor(n1.x / cellSize)
        const cellY = Math.floor(n1.y / cellSize)

        // Gather candidates from neighboring cells
        const candidates = this._getNeighborCandidates(grid, cellX, cellY, j)

        // To guarantee strict PRNG sequence parity, candidates MUST be processed
        // in ascending order of `k`, perfectly mimicking the original `for (let k = j + 1; ...)` loop.
        candidates.sort((a, b) => a - b)

        for (let c = 0; c < candidates.length; c++) {
          const k = candidates[c]
          const n2 = nodeList[k]

          let dx = n1.x - n2.x
          let dy = n1.y - n2.y
          const distSq = dx * dx + dy * dy

          if (distSq < minDistanceSq) {
            moved = true
            let dist = Math.sqrt(distSq)

            if (dist < 0.1) {
              // Exact overlap (or very close), push randomly
              dx = this.random() - 0.5 || 0.1
              dy = this.random() - 0.5 || 0.1
              dist = Math.sqrt(dx * dx + dy * dy)
            }

            const overlap = minDistance - dist
            const push = overlap * strength

            const moveX = (dx / dist) * push
            const moveY = (dy / dist) * push

            n1.x += moveX
            n1.y += moveY
            n2.x -= moveX
            n2.y -= moveY
          }
        }
      }

      // Wall repulsion (keep away from edges)
      nodeList.forEach(n => {
        const padding = 10
        if (n.x < padding) n.x += 0.2
        if (n.x > 100 - padding) n.x -= 0.2
        if (n.y < padding) n.y += 0.2
        if (n.y > 100 - padding) n.y -= 0.2
      })

      // If no overlaps processed, we can exit early (optional optimization)
      if (!moved) break

      // Damping
      strength *= 0.995
    }

    // Final hard clamp
    nodeList.forEach(n => {
      n.x = Math.max(5, Math.min(95, n.x))
      n.y = Math.max(5, Math.min(95, n.y))
    })
  }

  /**
   * Picks a random subset of items from an array.
   * @param {Array} arr - The source array.
   * @param {number} count - The number of items to pick.
   * @returns {Array} A new array with the selected items.
   */
  pickRandomSubset(arr, count) {
    const n = arr.length
    const k = Math.min(count, n)
    // For small k relative to n, a partial Fisher-Yates shuffle is faster
    // as it only requires O(k) swaps instead of O(n) swaps.
    const shuffled = [...arr]
    for (let i = 0; i < k; i++) {
      const j = i + Math.floor(this.random() * (n - i))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, k)
  }
}
