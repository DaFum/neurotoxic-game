import { useEffect, useState, useRef, memo } from 'react'
import PropTypes from 'prop-types'

/**
 * Overlay component that renders projectiles (heckler items).
 * @param {object} props
 * @param {object} props.gameStateRef - Mutable game state ref containing projectiles array.
 */
export const HecklerOverlay = memo(function HecklerOverlay({ gameStateRef }) {
  const [items, setItems] = useState([])
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    let rAF
    const loop = () => {
      if (gameStateRef.current) {
        const hasProjectiles = gameStateRef.current.projectiles.length > 0
        const hasItems = itemsRef.current.length > 0

        // Only update if projectiles exist or if we need to clear them
        if (hasProjectiles) {
          setItems([...gameStateRef.current.projectiles])
        } else if (hasItems) {
          setItems([])
        }
      }
      rAF = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(rAF)
  }, [gameStateRef])

  return (
    <div className='absolute inset-0 pointer-events-none overflow-hidden z-20'>
      {items.map(p => (
        <div
          key={p.id}
          className='absolute text-4xl drop-shadow-lg'
          style={{
            left: p.x,
            top: p.y,
            transform: `rotate(${p.rotation * 57.29}deg)` // rad to deg
          }}
        >
          {p.type === 'bottle' ? '🍾' : '🍅'}
        </div>
      ))}
    </div>
  )
})

HecklerOverlay.propTypes = {
  gameStateRef: PropTypes.shape({
    current: PropTypes.shape({
      projectiles: PropTypes.array
    })
  }).isRequired
}
