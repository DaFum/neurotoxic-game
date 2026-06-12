/// <reference types="vite/client" />
import { useEffect } from 'react'
import { getSafeStorageItem, setSafeStorageItem } from '../utils/storage'
import { finiteNumberOr } from '../utils/finiteNumber'
import { logger } from '../utils/logger'
import type { GameState } from '../types'

type LeaderboardStatsPayload = {
  playerId: string
  playerName: string
  money: number
  day: number
  fame: number
  followers: number
  distance: number
  conflicts: number
  stageDives: number
}

let leaderboardStatsEndpointUnavailable = false
let hasLoggedUnavailableEndpoint = false
// Dedupes concurrent syncs: the effect fires per stat change and the
// last-synced-day marker is only written after the fetch resolves, so without
// this every stat change within one day launched another POST.
const inFlightSyncs = new Set<string>()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    leaderboardStatsEndpointUnavailable = false
    hasLoggedUnavailableEndpoint = false
    inFlightSyncs.clear()
  })
}

const getLeaderboardSyncEnabledFlag = () => {
  const viteFlag = import.meta.env?.VITE_ENABLE_LEADERBOARD_SYNC
  if (typeof viteFlag === 'string') {
    return viteFlag.toLowerCase() !== 'false'
  }

  const processEnvSource = globalThis as {
    process?: { env?: Record<string, string | undefined> }
  }
  const processFlag =
    processEnvSource.process != null &&
    typeof processEnvSource.process === 'object'
      ? processEnvSource.process.env?.VITE_ENABLE_LEADERBOARD_SYNC
      : undefined
  if (typeof processFlag === 'string') {
    return processFlag.toLowerCase() !== 'false'
  }

  return true
}

/**
 * Validates if the player state is ready for leaderboard sync.
 * @param playerId - The player's ID.
 * @param playerName - The player's name.
 * @param day - The current game day.
 * @param money - The player's current money.
 * @returns True if valid.
 */
const isValidForSync = (
  playerId: string | null | undefined,
  playerName: string | null | undefined,
  day: number | null | undefined,
  money: number | null | undefined
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
 * @param social - The social state object.
 * @returns The total sum of followers.
 */
const calculateTotalFollowers = (social: GameState['social']) => {
  return (
    (social?.instagram ?? 0) +
    (social?.tiktok ?? 0) +
    (social?.youtube ?? 0) +
    (social?.newsletter ?? 0)
  )
}

/**
 * Creates the payload to be sent to the leaderboard API.
 * @param playerId - The player's ID.
 * @param playerName - The player's name.
 * @param money - The player's money.
 * @param day - The current game day.
 * @param fame - The player's fame.
 * @param totalDistance - The total distance traveled.
 * @param conflictsResolved - The total conflicts resolved.
 * @param stageDives - The total stage dives.
 * @param totalFollowers - The calculated total followers.
 * @returns The payload object.
 */
const createSyncPayload = (
  playerId: string,
  playerName: string,
  money: number,
  day: number,
  fame: number | null | undefined,
  totalDistance: number | null | undefined,
  conflictsResolved: number | null | undefined,
  stageDives: number | null | undefined,
  totalFollowers: number
): LeaderboardStatsPayload => {
  return {
    playerId,
    playerName,
    money,
    day,
    fame: fame ?? 0,
    followers: totalFollowers,
    distance: totalDistance ?? 0,
    conflicts: conflictsResolved ?? 0,
    stageDives: stageDives ?? 0
  }
}

/**
 * Sends the payload to the leaderboard API.
 * @param payload - The data to sync.
 * @returns true when synced; false when intentionally skipped.
 *
 * @throws {@link Error}
 * Throws when the stats endpoint exists but returns a non-success response.
 */
const syncLeaderboardStats = async (payload: LeaderboardStatsPayload) => {
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
 * @param state - The current game state.
 */
export const useLeaderboardSync = (state: GameState): void => {
  const { playerId, playerName, money, day, fame, stats } = state.player
  const { totalDistance, conflictsResolved, stageDives } = stats
  const social = state.social

  const totalFollowers = calculateTotalFollowers(social)

  useEffect(() => {
    // 1. Strict Validation
    if (!isValidForSync(playerId, playerName, day, money)) {
      return
    }

    const syncStats = async () => {
      // 2. Check if already synced for this day (Player-Specific)
      const syncKey = `neurotoxic_last_synced_day:${playerId}`
      // localStorage is untrusted: the parsed marker may be any JSON value.
      const lastSyncedDay = finiteNumberOr(
        getSafeStorageItem<unknown>(syncKey, 0),
        0
      )

      if (day <= lastSyncedDay) return

      // 3. Dedupe: one request per player and day. The marker below is only
      // written after the await, so concurrent effect runs would all pass the
      // lastSyncedDay check and POST duplicate intermediate snapshots.
      const flightKey = `${playerId}:${day}`
      if (inFlightSyncs.has(flightKey)) return
      inFlightSyncs.add(flightKey)

      // 4. Sync Logic
      try {
        const payload = createSyncPayload(
          playerId ?? '',
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

        // 5. Update Synced State. Keep the marker monotonic: a slower sync
        // for an earlier day must not lower it after a later day completed.
        const markerDay = finiteNumberOr(
          getSafeStorageItem<unknown>(syncKey, 0),
          0
        )
        setSafeStorageItem(syncKey, Math.max(markerDay, day))
        logger.info('Leaderboard', `Synced stats for day ${day}`)
      } catch (error) {
        // Silent fail for leaderboard sync to not disrupt gameplay
        logger.warn('Leaderboard', 'Stats sync failed', error)
      } finally {
        inFlightSyncs.delete(flightKey)
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
