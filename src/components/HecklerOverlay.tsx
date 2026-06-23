import { useEffect, useReducer, memo } from 'react'

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

/**
 * Overlay component that renders projectiles (heckler items).
 * Uses requestAnimationFrame to map state directly, rendering declaratively.
 * @param props - Display data and refs for the heckler overlay component.
 */
export const HecklerOverlay = memo(function HecklerOverlay({
  gameStateRef
}: HecklerOverlayProps) {
  const [, forceRender] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    let rAF = 0
    let wasActive = false
    const loop = () => {
      const hasProjectiles =
        (gameStateRef.current?.projectiles?.length ?? 0) > 0

      // Render if active, or if we just became inactive (to clear the DOM)
      if (hasProjectiles || wasActive) {
        forceRender()
      }
      wasActive = hasProjectiles

      rAF = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(rAF)
    }
  }, [gameStateRef])

  const projectiles = (gameStateRef.current?.projectiles ?? []) as Projectile[]

  return (
    <div className='absolute inset-0 pointer-events-none overflow-hidden z-(--z-stage)'>
      {projectiles
        .filter((p): p is Projectile => !!p && p.id !== undefined)
        .map((p) => {
          const x = p.x ?? 0
          const y = p.y ?? 0
          const rotation = p.rotation ?? 0
          return (
            <div
              key={p.id}
              className='absolute text-4xl drop-shadow-lg'
              style={{
                transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation * (180 / Math.PI)}deg)`
              }}
            >
              {p.type === 'bottle' ? '🍾' : '🍅'}
            </div>
          )
        })}
    </div>
  )
})
