import React from 'react'
import { useGameState } from '../context/GameState'
import { GlitchButton } from '../ui/GlitchButton'

/**
 * Scene displayed when the game ends (bankruptcy or health failure).
 */
export const GameOver = () => {
  const { changeScene, player, loadGame, resetState, settings } = useGameState()

  /**
   * Attempts to load the last save or returns to menu.
   */
  const handleRetry = () => {
    if (loadGame()) {
      // Already handled by loadGame logic which sets scene to OVERWORLD usually
    } else {
      changeScene('MENU')
    }
  }

  const handleReturnToMenu = () => {
    resetState()
    changeScene('MENU')
  }

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 text-center p-8'>
      {settings?.crtEnabled && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50' />
      )}
      <h1 className='text-8xl text-(--blood-red) font-[Metal_Mania] mb-4 animate-bounce'>
        SOLD OUT
      </h1>
      <h2 className='text-2xl text-(--ash-gray) font-mono mb-12 uppercase tracking-widest'>
        The tour has ended prematurely.
      </h2>

      <div className='border border-(--blood-red) p-8 w-full max-w-lg mb-8 bg-(--blood-red)/10'>
        <div className='grid grid-cols-2 gap-4 text-left font-mono text-lg'>
          <span className='text-(--ash-gray)'>DAYS SURVIVED:</span>
          <span className='text-(--star-white) text-right'>{player.day}</span>

          <span className='text-(--ash-gray)'>FAME REACHED:</span>
          <span className='text-(--star-white) text-right'>{player.fame}</span>

          <span className='text-(--ash-gray)'>LOCATION:</span>
          <span className='text-(--star-white) text-right'>
            {player.location}
          </span>

          <span className='text-(--ash-gray)'>CITIES VISITED:</span>
          <span className='text-(--star-white) text-right'>
            {player.visitedCities?.length || 0}
          </span>
        </div>
      </div>

      <div className='flex gap-4'>
        <GlitchButton
          onClick={handleRetry}
          className='border-(--star-white) text-(--star-white)'
        >
          LOAD LAST SAVE
        </GlitchButton>
        <GlitchButton
          onClick={handleReturnToMenu}
          className='border-(--blood-red) text-(--blood-red)'
        >
          RETURN TO MENU
        </GlitchButton>
      </div>
    </div>
  )
}
