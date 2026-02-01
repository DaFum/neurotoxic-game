// Generates a directed acyclic graph (DAG) for the tour
import { ALL_VENUES } from '../data/venues.js'

/**
 * Procedural generation for the game map using a Directed Acyclic Graph (DAG).
 */
export class MapGenerator {
  /**
   * Creates a new MapGenerator instance.
   * @param {number} seed - The seed for the random number generator.
   */
  constructor (seed) {
    const s = Number(seed)
    this.seed = Number.isFinite(s) ? s : Date.now()
  }

  /**
   * Linear Congruential Generator for seeded random numbers.
   * @returns {number} A float between 0 and 1.
   */
  random () {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  /**
   * Generates a tour map with layers of nodes.
   * Structure: Array of Layers. Each Layer has Nodes. Each Node has connections to next layer.
   * @param {number} [depth=10] - The number of layers in the map.
   * @returns {object} The generated map object containing layers, nodes, and connections.
   */
  generateMap (depth = 10) {
    const map = {
      layers: [],
      nodes: {}, // Map ID to Node Object
      connections: [] // List of [fromId, toId]
    }

    // Layer 0: Stendal (Home)
    const homeVenue = ALL_VENUES.find(v => v.id === 'stendal_proberaum')
    const startNode = {
      id: 'node_0_0',
      layer: 0,
      venue: homeVenue,
      status: 'unlocked', // unlocked, completed, locked
      type: 'START'
    }
    map.layers.push([startNode])
    map.nodes[startNode.id] = startNode

    // Filter venues by difficulty for progression
    const easyVenues = ALL_VENUES.filter(v => v.diff <= 2 && v.type !== 'HOME')
    const mediumVenues = ALL_VENUES.filter(v => v.diff === 3)
    const hardVenues = ALL_VENUES.filter(v => v.diff >= 4)

    // Generate intermediate layers
    for (let i = 1; i < depth; i++) {
      const layerNodes = []
      // Determine node count for this layer (2-4 branching)
      const nodeCount = Math.floor(this.random() * 3) + 2

      for (let j = 0; j < nodeCount; j++) {
        let venuePool
        if (i < 3) venuePool = easyVenues
        else if (i < 7) venuePool = mediumVenues
        else venuePool = hardVenues

        // Pick random venue
        const venue = venuePool[Math.floor(this.random() * venuePool.length)]

        // Determine Node Type based on probability
        // ~70% GIG, ~20% REST_STOP, ~10% SPECIAL
        const typeRoll = this.random()
        let nodeType = 'GIG'
        if (typeRoll > 0.9) nodeType = 'SPECIAL'
        else if (typeRoll > 0.7) nodeType = 'REST_STOP'

        const node = {
          id: `node_${i}_${j}`,
          layer: i,
          venue, // Note: Venue references might be duplicated across layers, which is okay for "touring"
          status: 'locked',
          type: nodeType
        }
        layerNodes.push(node)
        map.nodes[node.id] = node
      }
      map.layers.push(layerNodes)
    }

    // Generate Connections
    // Ensure every node in layer I connects to at least one in I+1
    // Ensure every node in layer I+1 has at least one parent in I
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
        })
      })

      // Backward pass check: ensure everyone has a parent
      // (Simplified: Just ensure nextLayer nodes are reachable. If not, force connect from random parent)
      nextLayer.forEach(node => {
        const hasParent = map.connections.some(c => c.to === node.id)
        if (!hasParent) {
          const randomParent =
            currentLayer[Math.floor(this.random() * currentLayer.length)]
          map.connections.push({ from: randomParent.id, to: node.id })
        }
      })
    }

    // Finale Layer
    const finaleVenue =
      ALL_VENUES.find(v => v.id === 'leipzig_arena') || hardVenues[0]
    const endNode = {
      id: `node_${depth}_0`,
      layer: depth,
      venue: finaleVenue,
      status: 'locked',
      type: 'FINALE'
    }
    map.layers.push([endNode])
    map.nodes[endNode.id] = endNode

    // Connect last layer to finale
    map.layers[depth - 1].forEach(node => {
      map.connections.push({ from: node.id, to: endNode.id })
    })

    return map
  }

  /**
   * Picks a random subset of items from an array.
   * @param {Array} arr - The source array.
   * @param {number} count - The number of items to pick.
   * @returns {Array} A new array with the selected items.
   */
  pickRandomSubset (arr, count) {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, count)
  }
}
