import { memo, useCallback, useRef, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { RoadieControlsProps } from '../../../types/components'

type TouchPoint = {
  x: number
  y: number
}

const SWIPE_THRESHOLD_PX = 24
const TAP_DEAD_ZONE_PX = 18

export const RoadieControls = memo(function RoadieControls({
  showControls,
  setShowControls,
  handleMoveUp,
  handleMoveLeft,
  handleMoveDown,
  handleMoveRight
}: RoadieControlsProps) {
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
        event.currentTarget.setPointerCapture?.(event.pointerId)
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
    <>
      <div
        data-testid='roadie-touch-surface'
        aria-label={t('ui:roadieRun.controls.touchAria')}
        className='absolute inset-0 z-20 md:hidden pointer-events-auto touch-none select-none'
        onPointerDown={handleTouchPointerDown}
        onPointerUp={handleTouchPointerEnd}
        onPointerCancel={clearTouchStart}
        onLostPointerCapture={clearTouchStart}
      />

      {/* Controls Toggle (Desktop Mode Support) */}
      <button
        type='button'
        className='absolute top-4 right-4 z-50 p-2 bg-void-black/50 text-toxic-green border border-toxic-green rounded hover:bg-toxic-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green pointer-events-auto text-xs font-mono hidden md:block'
        onClick={() => setShowControls(prev => !prev)}
        aria-label={t('ui:roadieRun.controls.toggleAria')}
      >
        {showControls
          ? t('ui:roadieRun.controls.hide')
          : t('ui:roadieRun.controls.show')}
      </button>

      {/* Controls Hint */}
      <div className='absolute bottom-4 left-8 text-star-white/50 text-sm font-mono pointer-events-none hidden md:block'>
        {t('ui:roadieRun.controls.movementHint')}
      </div>

      <div className='absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-3 py-1 border border-star-white/20 bg-void-black/60 text-star-white/60 text-xs font-mono pointer-events-none md:hidden'>
        {t('ui:roadieRun.controls.touchHint')}
      </div>

      {/* Optional desktop D-Pad */}
      <div
        className={`absolute bottom-24 right-8 z-40 hidden grid-cols-3 gap-2 pointer-events-auto ${showControls ? 'md:grid' : ''}`}
      >
        <div />
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
          onClick={handleMoveUp}
          aria-label={t('ui:moveUp', { defaultValue: 'Move Up' })}
        >
          ▲
        </button>
        <div />
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
          onClick={handleMoveLeft}
          aria-label={t('ui:moveLeft', { defaultValue: 'Move Left' })}
        >
          ◄
        </button>
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
          onClick={handleMoveDown}
          aria-label={t('ui:moveDown', { defaultValue: 'Move Down' })}
        >
          ▼
        </button>
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
          onClick={handleMoveRight}
          aria-label={t('ui:moveRight', { defaultValue: 'Move Right' })}
        >
          ►
        </button>
      </div>
    </>
  )
})
