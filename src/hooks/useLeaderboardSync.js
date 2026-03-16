// TODO: Implement this
import { useEffect } from 'react'
import { logger } from '../utils/logger'

/**
 * Hook to sync player stats to the global leaderboards.
 * @param {object} state - The current game state.
 */
export const useLeaderboardSync = state => {
  const { player, social } = state || {}
  const { playerId, playerName, money, day, fame, stats } = player || {}
  const { totalDistance, conflictsResolved, stageDives } = stats || {}

  const totalFollowers =
    (social?.instagram || 0) +
    (social?.tiktok || 0) +
    (social?.youtube || 0) +
    (social?.newsletter || 0)

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

    const syncStats = async () => {
      // 2. Check if already synced for this day (Player-Specific)
      const syncKey = `neurotoxic_last_synced_day:${playerId}`
      const lastSyncedDay = parseInt(localStorage.getItem(syncKey) || '0', 10)

      if (day <= lastSyncedDay) return

      // 3. Sync Logic
      try {
        const payload = {
          playerId,
          playerName,
          money,
          day,
          fame: fame || 0,
          followers: totalFollowers,
          distance: totalDistance || 0,
          conflicts: conflictsResolved || 0,
          stageDives: stageDives || 0
        }

        const response = await fetch('/api/leaderboard/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`)
        }

        // 4. Update Synced State
        localStorage.setItem(syncKey, day.toString())
        logger.info('Leaderboard', `Synced stats for day ${day}`)
      } catch (error) {
        // Silent fail for leaderboard sync to not disrupt gameplay
        logger.warn('Leaderboard', 'Stats sync failed', error)
      }
    }

    syncStats()
  }, [
    playerId,
    playerName,
    money,
    day,
    fame,
    totalFollowers,
    totalDistance,
    conflictsResolved,
    stageDives
  ])
}
