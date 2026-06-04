import { useEffect, useRef, memo } from 'react'
import { logger } from '../utils/logger'
import type { PixiController, PixiStageProps } from '../types/components'
import type { RhythmGameRefState } from '../types/rhythmGame'

type PixiStageComponentType = <TState = RhythmGameRefState>(
  props: PixiStageProps<TState>
) => ReturnType<typeof PixiStageComponent>

/**
 * Renders the Pixi.js stage for the rhythm game.
 * [STATE SAFETY BOUNDARY]: The Pixi.js renderer is initialized once per unmount cycle.
 * `gameStateRef` ensures access to mutating game state without triggering React re-renders.
 * [CLEANUP BOUNDARY]: The internal app instance destroys textures and tickers recursively upon unmount via `dispose()`.
 * @param props - Pixi stage refs, per-frame update callback, and controller factory.
 * @returns Pixi canvas wrapper.
 */
const PixiStageComponent = <TState = RhythmGameRefState,>(
  props: PixiStageProps<TState>
) => {
  const { gameStateRef, update } = props
  const controllerFactory = props.controllerFactory
  const containerRef = useRef<HTMLDivElement | null>(null)
  const updateRef = useRef(update)
  const controllerRef = useRef<PixiController | null>(null)

  useEffect(() => {
    updateRef.current = update
  }, [update])

  useEffect(() => {
    let mounted = true
    const controller = controllerFactory({
      containerRef,
      gameStateRef,
      updateRef
    })
    controllerRef.current = controller

    controller
      .init()
      .then(() => {
        if (!mounted || controllerRef.current !== controller) {
          controller.dispose()
        }
      })
      .catch(err => {
        if (mounted && controllerRef.current === controller) {
          logger.error('PixiStage', 'Pixi Stage Init Failed', err)
        }
      })

    return () => {
      mounted = false
      if (controllerRef.current === controller) {
        controller.dispose()
        controllerRef.current = null
      }
    }
    // gameStateRef is a stable useRef – dependency is constant
  }, [gameStateRef, controllerFactory])

  return (
    <div
      className='absolute inset-0 z-(--z-stage) pointer-events-none'
      ref={containerRef}
    />
  )
}
/**
 * Renders the memoized Pixi canvas host for a stage controller.
 * @param props - Pixi stage refs, per-frame update callback, and controller factory.
 */
export const PixiStage = memo(
  PixiStageComponent
) as unknown as PixiStageComponentType
