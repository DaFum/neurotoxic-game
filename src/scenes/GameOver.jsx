/*
 * (#1) Actual Updates: Refactored GameOver.jsx into smaller, maintainable UI components (GameOverBackground, GameOverHeader, GameOverStats, GameOverButtons).
 * (#2) Next Steps: Continue monitoring for other bulky scenes requiring similar extraction.
 * (#3) Found Errors + Solutions: N/A
 */
import { useEffect } from 'react'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { GameOverBackground } from './gameover/GameOverBackground'
import { GameOverHeader } from './gameover/GameOverHeader'
import { GameOverStats } from './gameover/GameOverStats'
import { GameOverButtons } from './gameover/GameOverButtons'

/**
 * Scene displayed when the game ends (bankruptcy or health failure).
 */
export const GameOver = () => {
  const { changeScene, player, loadGame, resetState } = useGameState()

  useEffect(() => {
    if (!player || player.score === undefined) {
      changeScene(GAME_PHASES.MENU)
    }
  }, [player, changeScene])

  const handleRetry = () => {
    if (loadGame()) {
      // Already handled by loadGame logic
    } else {
      changeScene(GAME_PHASES.MENU)
    }
  }

  const handleReturnToMenu = () => {
    resetState()
    changeScene(GAME_PHASES.MENU)
  }

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-void-black z-50 text-center p-8 relative overflow-hidden'>
      <GameOverBackground />
      <GameOverHeader />
      <GameOverStats player={player} />
      <GameOverButtons
        onRetry={handleRetry}
        onReturnToMenu={handleReturnToMenu}
      />
    </div>
  )
}

export default GameOver
