import { useEffect } from 'react'
import { logger } from '../utils/logger'

/**
 * Hook to sync player balance to the global leaderboard.
 * @param {object} player - The current player state.
 */
export const useLeaderboardSync = player => {
  const { playerId, playerName, money, day } = player || {}

  useEffect(() => {
    // 1. Strict Validation
    if (
      !playerId ||
      !playerName ||
      typeof day !== 'number' ||
      typeof money !== 'number' ||
      !Number.isFinite(day) ||
      !Number.isFinite(money) ||
      day < 0 ||
      money < 0
    ) {
      return
    }

    const syncBalance = async () => {
      // 2. Check if already synced for this day (Player-Specific)
      const syncKey = `neurotoxic_last_synced_day:${playerId}`
      const lastSyncedDay = parseInt(localStorage.getItem(syncKey) || '0', 10)

      if (day <= lastSyncedDay) return

      // 3. Sync Logic
      try {
        const response = await fetch('/api/leaderboard/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            playerName,
            money,
            day
          })
        })

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`)
        }

        // 4. Update Synced State
        localStorage.setItem(syncKey, day.toString())
        logger.info('Leaderboard', `Synced balance for day ${day}`)
      } catch (error) {
        // Silent fail for leaderboard sync to not disrupt gameplay
        logger.warn('Leaderboard', 'Balance sync failed', error)
      }
    }

    syncBalance()
  }, [playerId, playerName, money, day])
}
