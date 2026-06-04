import { memo, useCallback, useRef, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface RoadieTouchSurfaceProps {
  handleMoveUp: () => void
  handleMoveLeft: () => void
  handleMoveDown: () => void
  handleMoveRight: () => void
}

type TouchPoint = {
  x: number
  y: number
}

const SWIPE_THRESHOLD_PX = 24
const TAP_DEAD_ZONE_PX = 18

/**
 * Renders the Roadie Touch Surface component from handleMoveUp, handleMoveLeft, handleMoveDown, and handleMoveRight.
 * @param props - Directional movement callbacks for touch input.
 * @returns The rendered Roadie Touch Surface UI.
 */
export const RoadieTouchSurface = memo(function RoadieTouchSurface({
  handleMoveUp,
  handleMoveLeft,
  handleMoveDown,
  handleMoveRight
}: RoadieTouchSurfaceProps) {
  const { t } = useTranslation(['ui'])
  const touchStartRef = useRef<TouchPoint | null>(null)

  const triggerMove = useCallback(
    (dx: number, dy: number) => {
      if (dx < 0) {
        handleMoveLeft()
      } else if (dx > 0) {
        handleMoveRight()
      } else if (dy < 0) {
        handleMoveUp()
      } else if (dy > 0) {
        handleMoveDown()
      }
    },
    [handleMoveDown, handleMoveLeft, handleMoveRight, handleMoveUp]
  )

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
          triggerMove(deltaX > 0 ? 1 : -1, 0)
        } else {
          triggerMove(0, deltaY > 0 ? 1 : -1)
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
        triggerMove(relativeX > 0 ? 1 : -1, 0)
      } else {
        triggerMove(0, relativeY > 0 ? 1 : -1)
      }
    },
    [triggerMove]
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
