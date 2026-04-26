import { useEffect } from 'react'
import { safeStorageOperation } from '../utils/errorHandler'
import { logger } from '../utils/logger'

let leaderboardStatsEndpointUnavailable = false
let hasLoggedUnavailableEndpoint = false

if ((import.meta as any).hot) {
  ;(import.meta as any).hot.dispose(() => {
    leaderboardStatsEndpointUnavailable = false
    hasLoggedUnavailableEndpoint = false
  })
}

const getLeaderboardSyncEnabledFlag = () => {
  const viteFlag = (import.meta as any).env?.VITE_ENABLE_LEADERBOARD_SYNC
  if (typeof viteFlag === 'string') {
    return viteFlag.toLowerCase() !== 'false'
  }

  const processFlag =
    typeof process !== 'undefined'
      ? process?.env?.VITE_ENABLE_LEADERBOARD_SYNC
      : undefined
  if (typeof processFlag === 'string') {
    return processFlag.toLowerCase() !== 'false'
  }

  return true
}

/**
 * Validates if the player state is ready for leaderboard sync.
 * @param {string} playerId - The player's ID.
 * @param {string} playerName - The player's name.
 * @param {number} day - The current game day.
 * @param {number} money - The player's current money.
 * @returns {boolean} True if valid.
 */
export const isValidForSync = (
  playerId: unknown,
  playerName: unknown,
  day: unknown,
  money: unknown
) => {
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
export const calculateTotalFollowers = (social: any) => {
  return (
    (social?.instagram || 0) +
    (social?.tiktok || 0) +
    (social?.youtube || 0) +
    (social?.newsletter || 0)
  )
}

/**
 * Creates the payload to be sent to the leaderboard API.
 * @param {string} playerId - The player's ID.
 * @param {string} playerName - The player's name.
 * @param {number} money - The player's money.
 * @param {number} day - The current game day.
 * @param {number} fame - The player's fame.
 * @param {number} totalDistance - The total distance traveled.
 * @param {number} conflictsResolved - The total conflicts resolved.
 * @param {number} stageDives - The total stage dives.
 * @param {number} totalFollowers - The calculated total followers.
 * @returns {object} The payload object.
 */
export const createSyncPayload = (
  playerId: unknown,
  playerName: unknown,
  money: unknown,
  day: unknown,
  fame: unknown,
  totalDistance: unknown,
  conflictsResolved: unknown,
  stageDives: unknown,
  totalFollowers: unknown
) => {
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
 * @returns {Promise<boolean>} true when synced; false when intentionally skipped.
 */
export const syncLeaderboardStats = async (payload: any) => {
  if (!getLeaderboardSyncEnabledFlag() || leaderboardStatsEndpointUnavailable) {
    return false
  }

  const response = await fetch('/api/leaderboard/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (response.status === 404) {
    leaderboardStatsEndpointUnavailable = true
    if (!hasLoggedUnavailableEndpoint) {
      hasLoggedUnavailableEndpoint = true
      logger.info(
        'Leaderboard',
        'Stats endpoint unavailable (404). Disabling stat sync for this session.'
      )
    }
    return false
  }

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`)
  }

  return true
}

/**
 * Hook to sync player stats to the global leaderboards.
 * @param {object} state - The current game state.
 */
export const useLeaderboardSync = (state: any) => {
  const { player, social } = state || {}
  const { playerId, playerName, money, day, fame, stats } = player || {}
  const { totalDistance, conflictsResolved, stageDives } = stats || {}

  const totalFollowers = calculateTotalFollowers(social)

  useEffect(() => {
    // 1. Strict Validation
    if (!isValidForSync(playerId, playerName, day, money)) {
      return
    }

    const syncStats = async () => {
      // 2. Check if already synced for this day (Player-Specific)
      const syncKey = `neurotoxic_last_synced_day:${playerId}`
      const lastSyncedDay = parseInt(
        safeStorageOperation('getLastSyncedDay', () =>
          localStorage.getItem(syncKey)
        ) || '0',
        10
      )

      if (day <= lastSyncedDay) return

      // 3. Sync Logic
      try {
        const payload = createSyncPayload(
          playerId,
          playerName,
          money,
          day,
          fame,
          totalDistance,
          conflictsResolved,
          stageDives,
          totalFollowers
        )

        const didSync = await syncLeaderboardStats(payload)
        if (!didSync) return

        // 4. Update Synced State
        safeStorageOperation('setLastSyncedDay', () =>
          localStorage.setItem(syncKey, day.toString())
        )
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
