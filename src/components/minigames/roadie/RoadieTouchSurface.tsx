import { memo, useCallback, useRef, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface RoadieTouchSurfaceProps {
  onMove: (dx: number, dy: number) => void
}

type TouchPoint = {
  x: number
  y: number
}

const SWIPE_THRESHOLD_PX = 24
const TAP_DEAD_ZONE_PX = 18

/**
 * Provides swipe and tap movement zones for Roadie touch controls.
 * @param props - Directional movement callback for touch input.
 */
export const RoadieTouchSurface = memo(function RoadieTouchSurface({
  onMove
}: RoadieTouchSurfaceProps) {
  const { t } = useTranslation(['ui'])
  const touchStartRef = useRef<TouchPoint | null>(null)

  const handleTouchPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      touchStartRef.current = {
        x: event.clientX,
        y: event.clientY
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is best-effort; synthetic or unsupported events still move.
      }
    },
    []
  )

  const handleTouchPointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start) return

      const deltaX = event.clientX - start.x
      const deltaY = event.clientY - start.y
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX >= SWIPE_THRESHOLD_PX || absY >= SWIPE_THRESHOLD_PX) {
        if (absX > absY) {
          onMove(deltaX > 0 ? 1 : -1, 0)
        } else {
          onMove(0, deltaY > 0 ? 1 : -1)
        }
        return
      }

      const rect = event.currentTarget.getBoundingClientRect()
      const relativeX = event.clientX - (rect.left + rect.width / 2)
      const relativeY = event.clientY - (rect.top + rect.height / 2)
      const tapAbsX = Math.abs(relativeX)
      const tapAbsY = Math.abs(relativeY)

      if (tapAbsX < TAP_DEAD_ZONE_PX && tapAbsY < TAP_DEAD_ZONE_PX) return

      if (tapAbsX > tapAbsY) {
        onMove(relativeX > 0 ? 1 : -1, 0)
      } else {
        onMove(0, relativeY > 0 ? 1 : -1)
      }
    },
    [onMove]
  )

  const clearTouchStart = useCallback(() => {
    touchStartRef.current = null
  }, [])

  return (
    <section
      data-testid='roadie-touch-surface'
      aria-label={t('ui:roadieRun.controls.touchAria')}
      className='absolute inset-0 z-(--z-stage) md:hidden pointer-events-auto touch-none select-none'
      onPointerDown={handleTouchPointerDown}
      onPointerUp={handleTouchPointerEnd}
      onPointerCancel={clearTouchStart}
      onLostPointerCapture={clearTouchStart}
    />
  )
})
