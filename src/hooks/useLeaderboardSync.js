import { useEffect } from 'react'
import { logger } from '../utils/logger'

/**
 * Validates if the player state is ready for leaderboard sync.
 * @param {object} player - The player state object.
 * @returns {boolean} True if valid.
 */
export const isValidForSync = player => {
  if (!player) return false

  const { playerId, playerName, day, money } = player

  return (
    !!playerId &&
    !!playerName &&
    typeof day === 'number' &&
    typeof money === 'number' &&
    Number.isFinite(day) &&
    Number.isFinite(money) &&
    day >= 0 &&
    money >= 0
  )
}

/**
 * Calculates the total followers from the social state.
 * @param {object} social - The social state object.
 * @returns {number} The total sum of followers.
 */
export const calculateTotalFollowers = social => {
  return (
    (social?.instagram || 0) +
    (social?.tiktok || 0) +
    (social?.youtube || 0) +
    (social?.newsletter || 0)
  )
}

/**
 * Creates the payload to be sent to the leaderboard API.
 * @param {object} player - The player state object.
 * @param {number} totalFollowers - The calculated total followers.
 * @returns {object} The payload object.
 */
export const createSyncPayload = (player, totalFollowers) => {
  const { playerId, playerName, money, day, fame, stats } = player
  const { totalDistance, conflictsResolved, stageDives } = stats || {}

  return {
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
}

/**
 * Sends the payload to the leaderboard API.
 * @param {object} payload - The data to sync.
 * @returns {Promise<void>}
 */
export const syncLeaderboardStats = async payload => {
  const response = await fetch('/api/leaderboard/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`)
  }
}

/**
 * Hook to sync player stats to the global leaderboards.
 * @param {object} state - The current game state.
 */
export const useLeaderboardSync = state => {
  const { player, social } = state || {}
  const { playerId, playerName, money, day, fame, stats } = player || {}
  const { totalDistance, conflictsResolved, stageDives } = stats || {}

  const totalFollowers = calculateTotalFollowers(social)

  useEffect(() => {
    // 1. Strict Validation
    if (!isValidForSync(player)) {
      return
    }

    const syncStats = async () => {
      // 2. Check if already synced for this day (Player-Specific)
      const syncKey = `neurotoxic_last_synced_day:${playerId}`
      const lastSyncedDay = parseInt(localStorage.getItem(syncKey) || '0', 10)

      if (day <= lastSyncedDay) return

      // 3. Sync Logic
      try {
        const payload = createSyncPayload(player, totalFollowers)

        await syncLeaderboardStats(payload)

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
  ]) // Keep primitive deps for reliable React updates
}
