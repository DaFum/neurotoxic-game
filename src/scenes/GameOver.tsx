import { useEffect, useState } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { GameOverBackground } from './gameover/GameOverBackground'
import { GameOverHeader } from './gameover/GameOverHeader'
import { GameOverStats } from './gameover/GameOverStats'
import {
  GameOverButtons,
  type GameOverLoadAvailability
} from './gameover/GameOverButtons'

/**
 * Scene displayed when the game ends — defeat (bankruptcy, stranded) or
 * victory (FINALE gig completed, `player.stats.tourCompleted`).
 *
 * @remarks
 * Handles routing back to the main menu and conditionally reloading the game
 * based on the player's final state and retry choice.
 *
 * @returns A rendered game over overlay with stats, header, and action buttons.
 */
export const GameOver = () => {
  const player = useGameSelector(state => state.player)
  const { changeScene, loadGame, previewLoadGame, resetState } =
    useGameActions()
  // Unknown until the stored save has been previewed.
  const [loadAvailability, setLoadAvailability] =
    useState<GameOverLoadAvailability>('pending')

  useEffect(() => {
    if (!player || player.score === undefined) {
      changeScene(GAME_PHASES.MENU)
    }
  }, [player, changeScene])

  // Evaluated one task after mount, not inside the mount effect: the provider
  // autosaves the ending in an effect of its own, and a preview taken here must
  // see what that wrote. The router mounts this screen a render after that
  // autosave, so today both orders read the same save; the deferral keeps the
  // preview right if the screen is ever mounted in the same commit.
  useEffect(() => {
    const evaluation = setTimeout(() => {
      setLoadAvailability(
        previewLoadGame().status === 'terminal' ? 'ending' : 'available'
      )
    }, 0)
    return () => clearTimeout(evaluation)
  }, [previewLoadGame])

  const handleRetry = () => {
    // The save can have changed since the screen was evaluated, so ask again:
    // a save that only records this ending is never loaded from here.
    if (previewLoadGame().status === 'terminal') {
      setLoadAvailability('ending')
      return
    }
    if (loadGame().ok) {
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
        loadAvailability={loadAvailability}
        onRetry={handleRetry}
        onReturnToMenu={handleReturnToMenu}
      />
    </div>
  )
}
