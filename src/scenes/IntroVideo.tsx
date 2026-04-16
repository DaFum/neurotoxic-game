// @ts-nocheck
import { useRef, useEffect, useState, useCallback } from 'react'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import introVideo from '../assets/Neurotoxic_start.webm'
import { AutoplayOverlay } from './intro/components/AutoplayOverlay'
import { SkipButton } from './intro/components/SkipButton'
import { logger } from '../utils/logger'

/**
 * Scene for playing the intro video before the main menu.
 */
export const IntroVideo = () => {
  const { changeScene } = useGameState()
  const videoRef = useRef(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  const handleEnd = useCallback(() => {
    changeScene(GAME_PHASES.MENU)
  }, [changeScene])

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch(err => logger.error('IntroVideo', 'Manual play failed', err))
    }
  }

  useEffect(() => {
    // Attempt to play video on mount
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        logger.warn('IntroVideo', 'Intro video autoplay blocked', error)
        setAutoplayBlocked(true)
      })
    }
  }, [])

  return (
    <div className='relative w-full h-full bg-void-black overflow-hidden flex items-center justify-center z-[100]'>
      <video
        ref={videoRef}
        src={introVideo}
        className='w-full h-full object-cover'
        playsInline
        muted
        onEnded={handleEnd}
        onError={handleEnd} // Auto-skip if video fails to load (e.g. missing asset)
        onClick={handleEnd} // Click video to skip (if playing)
      />

      {/* Autoplay Blocked Overlay */}
      {autoplayBlocked && <AutoplayOverlay onPlay={handleManualPlay} />}

      {/* Skip Button */}
      <SkipButton onSkip={handleEnd} />
    </div>
  )
}

export default IntroVideo
