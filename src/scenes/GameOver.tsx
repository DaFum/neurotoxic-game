import { useEffect } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { GameOverBackground } from './gameover/GameOverBackground'
import { GameOverHeader } from './gameover/GameOverHeader'
import { GameOverStats } from './gameover/GameOverStats'
import { GameOverButtons } from './gameover/GameOverButtons'

/**
 * Scene displayed when the game ends — defeat (bankruptcy, stranded) or
 * victory (FINALE gig completed, `player.stats.tourCompleted`).
 */
export const GameOver = () => {
  const player = useGameSelector(state => state.player)
  const { changeScene, loadGame, resetState } = useGameActions()

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
    <div className='flex flex-col items-center justify-center h-full w-full bg-void-black z-(--z-overlay) text-center p-8 relative overflow-hidden'>
      <GameOverBackground />
      <GameOverHeader victory={player?.stats?.tourCompleted === true} />
      <GameOverStats player={player} />
      <GameOverButtons
        onRetry={handleRetry}
        onReturnToMenu={handleReturnToMenu}
      />
    </div>
  )
}
