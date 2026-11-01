/// <reference types="vite/client" />
import { useEffect } from 'react'
import { getSafeStorageItem, setSafeStorageItem } from '../utils/storage'
import { finiteNumberOr } from '../utils/finiteNumber'
import { logger } from '../utils/logger'
import { systemClock, type IClock } from '../utils/clock'
import { createLeaderboardSyncController } from '../utils/leaderboardSyncController'
import { MAX_PUBLISHED_BALANCE } from '../../lib/leaderboardLimits.js'
import type { GameState } from '../types'
import type { LeaderboardStatsPayload } from '../types/leaderboard'

/**
 * One controller per session: its per-player slots and the "endpoint missing"
 * verdict are shared by every hook instance. Environment access is resolved at
 * call time so tests can swap `fetch` and timers.
 */
const controller = createLeaderboardSyncController({
  fetch: (url, init) => fetch(url, init),
  clock: systemClock,
  storage: {
    read: key => getSafeStorageItem<unknown>(key, null),
    write: (key, value) => setSafeStorageItem(key, value)
  },
  timers: {
    setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
    clearTimeout: handle =>
      globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>)
  },
  logger,
  isEnabled: () => getLeaderboardSyncEnabledFlag()
})

// Disposal is terminal: the reloaded module builds a fresh controller, and the
// old one aborts its requests and ignores anything that settles afterwards.
if (import.meta.hot) {
  import.meta.hot.dispose(() => controller.dispose())
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
    finiteNumberOr(social?.instagram, 0) +
    finiteNumberOr(social?.tiktok, 0) +
    finiteNumberOr(social?.youtube, 0) +
    finiteNumberOr(social?.newsletter, 0)
  )
}

/**
 * Creates the payload to be sent to the leaderboard API.
 * @param playerId - The player's ID.
 * @param playerName - The player's name.
 * @param money - The player's money; published capped at `MAX_PUBLISHED_BALANCE`.
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
    // Only the published value is capped, never the wallet itself.
    money: Math.min(money, MAX_PUBLISHED_BALANCE),
    day,
    fame: finiteNumberOr(fame, 0),
    followers: totalFollowers,
    distance: finiteNumberOr(totalDistance, 0),
    conflicts: finiteNumberOr(conflictsResolved, 0),
    stageDives: finiteNumberOr(stageDives, 0)
  }
}

/**
 * Hook to sync player stats to the global leaderboards.
 *
 * @remarks
 * Every stat change is queued as the latest snapshot and flushed through one
 * in-flight request per player, throttled to the endpoint's rate limit. Each
 * request carries a monotonic revision so the server can drop one that was
 * overtaken. The board is honor-based: values are client-reported and not
 * verified.
 *
 * @param state - The current game state.
 * @param clock - Clock used for throttling and revisions. Defaults to the system clock.
 */
export const useLeaderboardSync = (
  state: GameState,
  clock: IClock = systemClock
): void => {
  const { playerId, playerName, money, day, fame, stats } = state.player
  const { totalDistance, conflictsResolved, stageDives } = stats
  const social = state.social

  const totalFollowers = calculateTotalFollowers(social)

  useEffect(() => {
    // Strict validation
    if (!isValidForSync(playerId, playerName, day, money)) {
      return
    }

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
    controller.submit(payload, clock)
  }, [
    playerId,
    playerName,
    money,
    day,
    fame,
    totalFollowers,
    totalDistance,
    conflictsResolved,
    stageDives,
    clock
  ]) // Keep primitive deps for reliable React updates
}
