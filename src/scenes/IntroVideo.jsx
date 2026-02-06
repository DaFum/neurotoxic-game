import React, { useRef, useEffect } from 'react'
import { useGameState } from '../context/GameState'
import introVideo from '../assets/Neurotoxic_start.webm'
import { GlitchButton } from '../ui/GlitchButton'

/**
 * Scene for playing the intro video before the main menu.
 */
export const IntroVideo = () => {
  const { changeScene } = useGameState()
  const videoRef = useRef(null)

  const handleEnd = () => {
    changeScene('MENU')
  }

  useEffect(() => {
    // Attempt to play video on mount
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn('Intro video autoplay blocked:', error)
        // Optionally show a "Click to Play" overlay here if needed,
        // but the Skip button serves as a way to proceed.
      })
    }
  }, [])

  return (
    <div className='relative w-full h-full bg-black overflow-hidden flex items-center justify-center z-[100]'>
      <video
        ref={videoRef}
        src={introVideo}
        className='w-full h-full object-cover'
        playsInline
        onEnded={handleEnd}
        onClick={handleEnd} // Click video to skip
      />

      <div className='absolute bottom-8 right-8 z-50 opacity-80 hover:opacity-100 transition-opacity'>
        <GlitchButton onClick={handleEnd}>
          SKIP INTRO
        </GlitchButton>
      </div>
    </div>
  )
}
