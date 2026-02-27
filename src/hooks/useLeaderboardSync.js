import { useEffect } from 'react'
import { logger } from '../utils/logger'

/**
 * Hook to sync player balance to the global leaderboard.
 * @param {object} player - The current player state.
 */
export const useLeaderboardSync = player => {
  useEffect(() => {
    const syncBalance = async () => {
      // 1. Validation
      if (!player?.playerId || !player?.playerName) return

      // 2. Check if already synced for this day
      const lastSyncedDay = parseInt(
        localStorage.getItem('neurotoxic_last_synced_day') || '0',
        10
      )

      if (player.day <= lastSyncedDay) return

      // 3. Sync Logic
      try {
        const response = await fetch('/api/leaderboard/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.playerId,
            playerName: player.playerName,
            money: player.money,
            day: player.day
          })
        })

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`)
        }

        // 4. Update Synced State
        localStorage.setItem(
          'neurotoxic_last_synced_day',
          player.day.toString()
        )
        logger.info('Leaderboard', `Synced balance for day ${player.day}`)
      } catch (error) {
        // Silent fail for leaderboard sync to not disrupt gameplay
        logger.warn('Leaderboard', 'Balance sync failed', error)
      }
    }

    syncBalance()
  }, [player])
}
