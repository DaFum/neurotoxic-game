import { useEffect, useRef, memo } from 'react'
import PropTypes from 'prop-types'

/**
 * Overlay component that renders projectiles (heckler items).
 * Optimized to bypass React renders during animation.
 * @param {object} props
 * @param {object} props.gameStateRef - Mutable game state ref containing projectiles array.
 */
export const HecklerOverlay = memo(function HecklerOverlay({ gameStateRef }) {
  const containerRef = useRef(null)
  // Cache for created DOM nodes, keyed by projectile ID
  const nodeCacheRef = useRef(new Map())

  useEffect(() => {
    let rAF
    const loop = () => {
      if (gameStateRef.current && containerRef.current) {
        const projectiles = gameStateRef.current.projectiles
        const container = containerRef.current
        const nodeCache = nodeCacheRef.current

        // Create a set of current IDs for easy lookup
        const currentIds = new Set(projectiles.map(p => p.id))

        // Remove old nodes that are no longer in the state
        for (const [id, node] of nodeCache.entries()) {
          if (!currentIds.has(id)) {
            container.removeChild(node)
            nodeCache.delete(id)
          }
        }

        // Add new nodes and update existing ones
        for (let i = 0; i < projectiles.length; i++) {
          const p = projectiles[i]
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
          node.style.left = `${p.x}px`
          node.style.top = `${p.y}px`
          node.style.transform = `rotate(${p.rotation * 57.29}deg)`
        }
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

HecklerOverlay.propTypes = {
  gameStateRef: PropTypes.shape({
    current: PropTypes.shape({
      projectiles: PropTypes.array
    })
  }).isRequired
}
