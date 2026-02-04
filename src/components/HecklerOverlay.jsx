import React, { useEffect, useState } from 'react'

export const HecklerOverlay = ({ gameStateRef }) => {
  const [items, setItems] = useState([])

  useEffect(() => {
    let rAF
    const loop = () => {
      if (gameStateRef.current) {
        // Only update if projectiles exist
        if (gameStateRef.current.projectiles.length > 0) {
          setItems([...gameStateRef.current.projectiles])
        } else if (items.length > 0) {
          setItems([])
        }
      }
      rAF = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(rAF)
  }, [gameStateRef]) // Remove 'items' dependency to avoid loop

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
}
