import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { createPixiStageController } from './PixiStageController'
import { logger } from '../utils/logger'

/**
 * Renders the Pixi.js stage for the rhythm game.
 * @param {{ logic: { gameStateRef: object, stats: object, update: Function }, controllerFactory: Function }} props - Component props.
 * @returns {JSX.Element} Pixi canvas wrapper.
 */
export const PixiStage = ({ logic, controllerFactory = createPixiStageController }) => {
  const containerRef = useRef(null)
  const { gameStateRef, update } = logic
  const updateRef = useRef(update)
  const statsRef = useRef(logic.stats)
  const controllerRef = useRef(null)

  useEffect(() => {
    updateRef.current = update
  }, [update])

  useEffect(() => {
    statsRef.current = logic.stats
  }, [logic.stats])

  useEffect(() => {
    controllerRef.current = controllerFactory({
      containerRef,
      gameStateRef,
      updateRef,
      statsRef
    })

    controllerRef.current.init().catch(err => {
      logger.error('PixiStage', 'Pixi Stage Init Failed', err)
    })

    return () => {
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

PixiStage.propTypes = {
  logic: PropTypes.shape({
    gameStateRef: PropTypes.object.isRequired,
    update: PropTypes.func.isRequired,
    stats: PropTypes.shape({
      score: PropTypes.number,
      combo: PropTypes.number,
      health: PropTypes.number,
      overload: PropTypes.number,
      isToxicMode: PropTypes.bool,
      isGameOver: PropTypes.bool,
      isAudioReady: PropTypes.bool
    }).isRequired
  }).isRequired,
  controllerFactory: PropTypes.func
}
