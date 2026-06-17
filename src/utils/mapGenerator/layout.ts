import type { GeneratedMapNode } from './types'

/**
 * Assigns initial coordinates to map nodes.
 * @param nodeList - Mutable list of nodes needing layout coordinates.
 * @param random - A function returning a float between 0 and 1.
 */
export function assignInitialCoordinates(
  nodeList: GeneratedMapNode[],
  random: () => number
): void {
  // Assign initial coordinates with jitter and resolve overlaps
  // Increased jitter to +/- 5 to help initial separation
  for (const node of nodeList) {
    const baseX = node.x
    const baseY = node.y
    node.x = baseX + (random() * 10 - 5)
    node.y = baseY + (random() * 10 - 5)
  }
}

/**
 * Retrieves candidate node indices from neighboring cells that have an index greater than j.
 * @param grid - The spatial partitioning grid.
 * @param cellX - The X coordinate of the current cell.
 * @param cellY - The Y coordinate of the current cell.
 * @param j - The index of the current node to preserve directionality.
 * @returns Array of candidate node indices.
 */
function getNeighborCandidates(
  grid: Map<number, number[]>,
  cellX: number,
  cellY: number,
  j: number
): number[] {
  const candidates: number[] = []

  for (let cx = cellX - 1; cx <= cellX + 1; cx++) {
    for (let cy = cellY - 1; cy <= cellY + 1; cy++) {
      const key = cx * 1000 + cy
      const cell = grid.get(key)
      if (!cell) continue

      for (let c = 0; c < cell.length; c++) {
        const k = cell[c]
        if (k === undefined) continue
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
 * Buckets nodes into a spatial hash grid for O(1) neighbor lookups.
 * @param nodeList - Nodes to bucket by position.
 * @param cellSize - Grid cell size in map-percentage units.
 * @returns Map of packed cell key to node indices.
 */
function buildSpatialGrid(
  nodeList: GeneratedMapNode[],
  cellSize: number
): Map<number, number[]> {
  const grid = new Map<number, number[]>()
  for (let j = 0; j < nodeList.length; j++) {
    const n = nodeList[j]
    if (!n) continue
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
  return grid
}

/**
 * Nudges nodes away from the map edges (in place).
 * @param nodeList - Nodes to adjust.
 * @param padding - Edge margin in map-percentage units.
 */
function applyWallRepulsion(
  nodeList: GeneratedMapNode[],
  padding: number
): void {
  for (const n of nodeList) {
    if (n.x < padding) n.x += 0.2
    if (n.x > 100 - padding) n.x -= 0.2
    if (n.y < padding) n.y += 0.2
    if (n.y > 100 - padding) n.y -= 0.2
  }
}

/**
 * Hard-clamps node coordinates into the visible [5, 95] map range (in place).
 * @param nodeList - Nodes to clamp.
 */
function clampNodePositions(nodeList: GeneratedMapNode[]): void {
  for (const n of nodeList) {
    n.x = Math.max(5, Math.min(95, n.x))
    n.y = Math.max(5, Math.min(95, n.y))
  }
}

/**
 * Iteratively pushes overlapping nodes apart to ensure visibility.
 * Note: This method mutates the node objects in the provided list.
 * @param nodeList - The list of nodes.
 * @param random - A function returning a float between 0 and 1.
 */
export function resolveOverlaps(
  nodeList: GeneratedMapNode[],
  random: () => number
): void {
  const iterations = 150 // Increased iterations
  const minDistance = 6 // % of map width/height (approx 2x pin size)
  const minDistanceSq = minDistance * minDistance
  const padding = 10 // Wall repulsion bounds
  // Reduce movement strength over time to stabilize
  let strength = 0.5

  // Optimization: Spatial partitioning to avoid O(N^2) checks
  const cellSize = minDistance

  for (let i = 0; i < iterations; i++) {
    let moved = false

    const grid = buildSpatialGrid(nodeList, cellSize)

    for (let j = 0; j < nodeList.length; j++) {
      const n1 = nodeList[j]
      if (!n1) continue
      const cellX = Math.floor(n1.x / cellSize)
      const cellY = Math.floor(n1.y / cellSize)

      // Gather candidates from neighboring cells
      const candidates = getNeighborCandidates(grid, cellX, cellY, j)

      candidates.sort((a, b) => a - b)

      for (let c = 0; c < candidates.length; c++) {
        const k = candidates[c]
        if (k === undefined) continue
        const n2 = nodeList[k]
        if (!n2) continue

        let dx = n1.x - n2.x
        let dy = n1.y - n2.y
        const distSq = dx * dx + dy * dy

        if (distSq < minDistanceSq) {
          moved = true
          let dist = Math.sqrt(distSq)

          if (dist < 0.1) {
            // Exact overlap (or very close), push randomly. Guard against
            // a zero offset (which would collapse `dist` to 0 and break
            // the resolution math below) by falling back to a small bias.
            const rawDx = random() - 0.5
            const rawDy = random() - 0.5
            dx = rawDx === 0 ? 0.1 : rawDx
            dy = rawDy === 0 ? 0.1 : rawDy
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
    applyWallRepulsion(nodeList, padding)

    // If no overlaps processed, we can exit early (optional optimization)
    if (!moved) break

    // Damping
    strength *= 0.995
  }

  // Final hard clamp
  clampNodePositions(nodeList)
}
