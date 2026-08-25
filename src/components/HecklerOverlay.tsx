import { useEffect, useReducer, memo } from 'react'
import type { Projectile as HecklerProjectile } from '../utils/hecklerLogic'

/**
 * Represents a localized, stripped-down projectile used explicitly for rendering properties.
 */
type Projectile = Pick<
  HecklerProjectile,
  'id' | 'x' | 'y' | 'rotation' | 'type'
>

/**
 * A mutable reference container used to bypass normal React state updates for high-frequency game loop data.
 */
interface HecklerStateRef {
  current: {
    projectiles?: unknown[]
  } | null
}

/**
 * Component properties defining the dependencies for the heckler overlay renderer.
 */
interface HecklerOverlayProps {
  /** A mutable reference containing the live projectile data to be rendered. */
  gameStateRef: HecklerStateRef
}

/**
 * Overlay component that renders projectiles (heckler items).
 *
 * @remarks
 * Uses requestAnimationFrame to map state directly, rendering declaratively.
 *
 * @param props - Display data and refs for the heckler overlay component.
 * @returns A React component node displaying the active projectiles.
 */
export const HecklerOverlay = memo(function HecklerOverlay({
  gameStateRef
}: HecklerOverlayProps) {
  const [, forceRender] = useReducer(x => x + 1, 0)

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
      {projectiles.reduce<React.ReactNode[]>((acc, p) => {
        if (p && p.id !== undefined) {
          const x = p.x ?? 0
          const y = p.y ?? 0
          const rotation = p.rotation ?? 0
          acc.push(
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
        }
        return acc
      }, [])}
    </div>
  )
})
