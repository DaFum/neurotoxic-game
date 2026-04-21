import { useEffect, useRef, memo } from 'react'

type ProjectileId = string | number

interface Projectile {
  id: ProjectileId
  x: number
  y: number
  rotation: number
  type?: string
}

interface HecklerStateRef {
  current: {
    projectiles?: unknown[]
  } | null
}

interface HecklerOverlayProps {
  gameStateRef: HecklerStateRef
}

// Helper to update/create DOM nodes and remove stale ones in a single pass
function updateOverlayNodes(
  projectiles: Projectile[],
  nodeCache: Map<ProjectileId, HTMLDivElement>,
  seenIds: Set<ProjectileId>,
  container: HTMLDivElement
): void {
  seenIds.clear()

  // 1. Update existing nodes and add new ones
  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i]
    seenIds.add(p.id)
    let node = nodeCache.get(p.id)

    if (!node) {
      // Create element if it doesn't exist
      node = document.createElement('div')
      node.className = 'absolute text-4xl drop-shadow-lg'
      node.textContent = p.type === 'bottle' ? '🍾' : '🍅'
      container.appendChild(node)
      nodeCache.set(p.id, node)
    }

    // Update position and rotation directly bypassing React render
    // Use translate3d to force hardware acceleration and avoid layout thrashing
    // by not modifying top/left which triggers paint/layout cycles
    node.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation * (180 / Math.PI)}deg)`
  }

  // 2. Remove old nodes that are no longer in the state.
  // Optimization: `nodeCache` will always contain at least every ID in `seenIds`
  // after the loop above (either pre-existing or newly created). Therefore, if
  // sizes match, there are exactly zero stale nodes to remove.
  if (nodeCache.size > seenIds.size) {
    for (const id of nodeCache.keys()) {
      if (!seenIds.has(id)) {
        const node = nodeCache.get(id)
        if (node) {
          container.removeChild(node)
          nodeCache.delete(id)
        }
      }
    }
  }
}

/**
 * Overlay component that renders projectiles (heckler items).
 * Optimized to bypass React renders during animation.
 * @param {object} props
 * @param {object} props.gameStateRef - Mutable game state ref containing projectiles array.
 */
export const HecklerOverlay = memo(function HecklerOverlay({
  gameStateRef
}: HecklerOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // Cache for created DOM nodes, keyed by projectile ID
  const nodeCacheRef = useRef<Map<ProjectileId, HTMLDivElement>>(new Map())
  // Persistent Set to avoid GC allocations during O(1) lookups
  const seenIdsRef = useRef<Set<ProjectileId>>(new Set())

  useEffect(() => {
    let rAF = 0
    const loop = () => {
      if (gameStateRef.current && containerRef.current) {
        const projectiles = (gameStateRef.current.projectiles ??
          []) as Projectile[]
        const container = containerRef.current
        const nodeCache = nodeCacheRef.current
        const seenIds = seenIdsRef.current

        updateOverlayNodes(projectiles, nodeCache, seenIds, container)
      }
      rAF = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(rAF)
    }
  }, [gameStateRef])

  return (
    <div
      ref={containerRef}
      className='absolute inset-0 pointer-events-none overflow-hidden z-20'
    />
  )
})
