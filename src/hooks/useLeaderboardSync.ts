/// <reference types="vite/client" />
import { useEffect } from 'react'
import { getSafeStorageItem, setSafeStorageItem } from '../utils/storage'
import { finiteNumberOr } from '../utils/finiteNumber'
import { logger } from '../utils/logger'
import { systemClock, type IClock } from '../utils/clock'
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

/**
 * The stats endpoint allows 5 requests a minute per IP, so one player never
 * sends more often than this, however fast their stats change.
 */
const MIN_SYNC_INTERVAL_MS = 15000
const MAX_RETRY_INTERVAL_MS = 5 * 60 * 1000

/** Per-player sync state: at most one request in flight, latest snapshot kept. */
type SyncSlot = {
  inFlight: boolean
  /** Snapshot key of the request currently on the wire, if any. */
  inFlightKey: string | null
  pending: LeaderboardStatsPayload | null
  lastSentKey: string | null
  lastSentAt: number | null
  /** Consecutive failed requests, for the retry backoff. */
  failures: number
  timer: ReturnType<typeof setTimeout> | null
}

let leaderboardStatsEndpointUnavailable = false
// Coalesces stat changes: while a request is in flight or throttled, only the
// newest snapshot is kept and sent afterwards, so a change is never dropped
// and the board is never left on the first snapshot of the day.
const syncSlots = new Map<string, SyncSlot>()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    leaderboardStatsEndpointUnavailable = false
    for (const slot of syncSlots.values()) {
      if (slot.timer) clearTimeout(slot.timer)
    }
    syncSlots.clear()
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
const syncLeaderboardStats = async (
  payload: LeaderboardStatsPayload & { revision: number }
) => {
  if (!getLeaderboardSyncEnabledFlag() || leaderboardStatsEndpointUnavailable) {
    return false
  }

  const response = await fetch('/api/leaderboard/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (response.status === 404) {
    if (!leaderboardStatsEndpointUnavailable) {
      logger.info(
        'Leaderboard',
        'Stats endpoint unavailable (404). Disabling stat sync for this session.'
      )
    }
    leaderboardStatsEndpointUnavailable = true
    return false
  }

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`)
  }

  return true
}

const snapshotKey = (payload: LeaderboardStatsPayload): string =>
  JSON.stringify([
    payload.playerName,
    payload.money,
    payload.day,
    payload.fame,
    payload.followers,
    payload.distance,
    payload.conflicts,
    payload.stageDives
  ])

const lastSyncedKeyStorageKey = (playerId: string) =>
  `neurotoxic_last_synced_snapshot:${playerId}`
const revisionStorageKey = (playerId: string) =>
  `neurotoxic_stats_revision:${playerId}`

const getSlot = (playerId: string): SyncSlot => {
  const existing = syncSlots.get(playerId)
  if (existing) return existing
  // localStorage is untrusted: only a string marker counts as a prior sync.
  const stored = getSafeStorageItem<unknown>(
    lastSyncedKeyStorageKey(playerId),
    null
  )
  const slot: SyncSlot = {
    inFlight: false,
    inFlightKey: null,
    pending: null,
    lastSentKey: typeof stored === 'string' ? stored : null,
    lastSentAt: null,
    failures: 0,
    timer: null
  }
  syncSlots.set(playerId, slot)
  return slot
}

/**
 * Next monotonic snapshot revision for a player. Persisted before sending, so
 * a retry or a reload can never reuse or lower a revision the server has seen.
 */
const nextRevision = (playerId: string, clock: IClock): number => {
  const raw = finiteNumberOr(
    getSafeStorageItem<unknown>(revisionStorageKey(playerId), 0),
    0
  )
  // Storage is untrusted: a value the API would reject (not a safe integer, or
  // exhausted) was never accepted server-side, so start from the clock instead.
  const stored =
    Number.isSafeInteger(raw) && raw > 0 && raw < Number.MAX_SAFE_INTEGER
      ? raw
      : 0
  const revision = Math.max(stored + 1, Math.floor(clock.now()))
  setSafeStorageItem(revisionStorageKey(playerId), revision)
  return revision
}

const flushSlot = async (slot: SyncSlot, clock: IClock): Promise<void> => {
  slot.timer = null
  const payload = slot.pending
  if (!payload || slot.inFlight) return
  slot.pending = null
  const key = snapshotKey(payload)
  if (key === slot.lastSentKey) return

  slot.inFlight = true
  slot.inFlightKey = key
  slot.lastSentAt = clock.now()
  try {
    const didSync = await syncLeaderboardStats({
      ...payload,
      revision: nextRevision(payload.playerId, clock)
    })
    slot.failures = 0
    if (didSync) {
      slot.lastSentKey = key
      setSafeStorageItem(lastSyncedKeyStorageKey(payload.playerId), key)
      logger.info('Leaderboard', `Synced stats for day ${payload.day}`)
    }
  } catch (error) {
    // Silent fail for leaderboard sync to not disrupt gameplay
    logger.warn('Leaderboard', 'Stats sync failed', error)
    // Keep the snapshot for a retry (backoff, never faster than the rate limit)
    // unless a newer one is already waiting.
    slot.failures += 1
    slot.pending ??= payload
  } finally {
    slot.inFlight = false
    slot.inFlightKey = null
    // A change that arrived during the request goes out next.
    if (slot.pending && snapshotKey(slot.pending) !== slot.lastSentKey) {
      scheduleFlush(slot, clock)
    }
  }
}

const scheduleFlush = (slot: SyncSlot, clock: IClock): void => {
  if (slot.timer || slot.inFlight) return
  const interval =
    slot.failures === 0
      ? MIN_SYNC_INTERVAL_MS
      : Math.min(
          MAX_RETRY_INTERVAL_MS,
          MIN_SYNC_INTERVAL_MS * 2 ** slot.failures
        )
  const wait =
    slot.lastSentAt === null
      ? 0
      : Math.max(0, interval - (clock.now() - slot.lastSentAt))
  if (wait === 0) {
    void flushSlot(slot, clock)
    return
  }
  slot.timer = setTimeout(() => {
    void flushSlot(slot, clock)
  }, wait)
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
    const slot = getSlot(payload.playerId)
    // What the server will hold once nothing is pending: the request on the
    // wire if there is one, else the last confirmed snapshot. Returning to an
    // older snapshot while a different one is in flight is therefore still a
    // change and must be queued.
    if (snapshotKey(payload) === (slot.inFlightKey ?? slot.lastSentKey)) {
      slot.pending = null
      return
    }
    slot.pending = payload
    scheduleFlush(slot, clock)
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
