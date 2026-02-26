import { useEffect, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import { createPixiStageController } from './PixiStageController'
import { logger } from '../utils/logger'

/**
 * Renders the Pixi.js stage for the rhythm game.
 * @param {{ gameStateRef: object, update: Function, controllerFactory: Function }} props - Component props.
 * @returns {JSX.Element} Pixi canvas wrapper.
 */
export const PixiStage = memo(
  ({ gameStateRef, update, controllerFactory = createPixiStageController }) => {
    const containerRef = useRef(null)
    const updateRef = useRef(update)
    const controllerRef = useRef(null)

    useEffect(() => {
      updateRef.current = update
    }, [update])

    useEffect(() => {
      let mounted = true
      controllerRef.current = controllerFactory({
        containerRef,
        gameStateRef,
        updateRef
      })

      controllerRef.current
        .init()
        .then(() => {
          if (!mounted) {
            controllerRef.current?.dispose()
            controllerRef.current = null
          }
        })
        .catch(err => {
          if (mounted) {
            logger.error('PixiStage', 'Pixi Stage Init Failed', err)
          }
        })

      return () => {
        mounted = false
        if (controllerRef.current) {
          controllerRef.current.dispose()
          controllerRef.current = null
        }
      }
      // gameStateRef is a stable useRef – dependency is constant
    }, [gameStateRef, controllerFactory])

    return (
      <div
        className='absolute inset-0 z-20 pointer-events-none'
        ref={containerRef}
      />
    )
  }
)

PixiStage.propTypes = {
  gameStateRef: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,
  controllerFactory: PropTypes.func
}
