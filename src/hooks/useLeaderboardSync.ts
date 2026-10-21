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
  /** Consecutive stale responses, so two writers cannot loop at the base rate. */
  staleStreak: number
  /** Snapshot key of the failed request a retry is waiting on. */
  retryKey: string | null
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

/** A non-success response; `status` decides whether a retry can help. */
class SyncHttpError extends Error {
  readonly status: number
  constructor(status: number, statusText: string) {
    super(`Sync failed: ${statusText}`)
    this.status = status
  }
}

type SyncResult =
  | { status: 'synced' }
  | { status: 'skipped' }
  | { status: 'stale'; revision: number }

/** Network errors, rate limiting and server errors can succeed later. */
const isRetryable = (error: unknown): boolean =>
  !(error instanceof SyncHttpError) ||
  error.status === 429 ||
  error.status >= 500

/**
 * Sends the payload to the leaderboard API.
 * @param payload - The data to sync.
 * @returns `synced` when applied, `stale` with the server's revision when a
 * newer one was already stored, `skipped` when intentionally not sent.
 *
 * @throws {@link Error}
 * Throws when the stats endpoint exists but returns a non-success response.
 */
const syncLeaderboardStats = async (
  payload: LeaderboardStatsPayload,
  allocateRevision: () => number
): Promise<SyncResult> => {
  if (!getLeaderboardSyncEnabledFlag() || leaderboardStatsEndpointUnavailable) {
    return { status: 'skipped' }
  }

  // Allocated only once the request really goes out, so a skipped flush does
  // not burn a revision or write storage.
  const response = await fetch('/api/leaderboard/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, revision: allocateRevision() })
  })

  if (response.status === 404) {
    if (!leaderboardStatsEndpointUnavailable) {
      logger.info(
        'Leaderboard',
        'Stats endpoint unavailable (404). Disabling stat sync for this session.'
      )
    }
    leaderboardStatsEndpointUnavailable = true
    return { status: 'skipped' }
  }

  if (!response.ok) {
    throw new SyncHttpError(response.status, response.statusText)
  }

  const body: unknown = await response.json().catch(() => null)
  if (
    typeof body === 'object' &&
    body !== null &&
    Object.hasOwn(body, 'stale') &&
    (body as { stale?: unknown }).stale === true
  ) {
    const revision = Object.hasOwn(body, 'revision')
      ? (body as { revision?: unknown }).revision
      : undefined
    return { status: 'stale', revision: finiteNumberOr(revision, 0) }
  }
  return { status: 'synced' }
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
    staleStreak: 0,
    retryKey: null,
    timer: null
  }
  syncSlots.set(playerId, slot)
  return slot
}

/** The stored revision, or 0 when it is not one the API would accept. */
const readStoredRevision = (playerId: string): number => {
  // Storage is untrusted: a value the API would reject (not a safe integer, or
  // exhausted) was never accepted server-side, so start from the clock instead.
  const raw = finiteNumberOr(
    getSafeStorageItem<unknown>(revisionStorageKey(playerId), 0),
    0
  )
  return Number.isSafeInteger(raw) && raw > 0 && raw < Number.MAX_SAFE_INTEGER
    ? raw
    : 0
}

/**
 * Next monotonic snapshot revision for a player. Persisted before sending, so
 * a retry or a reload can never reuse or lower a revision this client sent. A
 * revision the server holds beyond it (cleared storage, a clock set back) is
 * learned from the stale response and adopted by `adoptServerRevision`.
 */
const nextRevision = (playerId: string, clock: IClock): number => {
  const revision = Math.max(
    readStoredRevision(playerId) + 1,
    Math.floor(clock.now())
  )
  setSafeStorageItem(revisionStorageKey(playerId), revision)
  return revision
}

const adoptServerRevision = (playerId: string, revision: number): void => {
  if (
    Number.isSafeInteger(revision) &&
    revision > readStoredRevision(playerId)
  ) {
    setSafeStorageItem(revisionStorageKey(playerId), revision)
  }
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
    const result = await syncLeaderboardStats(payload, () =>
      nextRevision(payload.playerId, clock)
    )
    if (result.status === 'synced') {
      slot.failures = 0
      slot.staleStreak = 0
      slot.retryKey = null
      slot.lastSentKey = key
      setSafeStorageItem(lastSyncedKeyStorageKey(payload.playerId), key)
      logger.info('Leaderboard', `Synced stats for day ${payload.day}`)
    } else if (result.status === 'stale') {
      // The server holds a newer revision than this client has used. Adopt it
      // and send the snapshot again, or the board would stay on the old one.
      adoptServerRevision(payload.playerId, result.revision)
      // The server holds a snapshot this client never confirmed, so the last
      // confirmed key no longer says what is stored: forget it, or a pending
      // snapshot that equals it would be skipped and the board left behind.
      slot.lastSentKey = null
      setSafeStorageItem(lastSyncedKeyStorageKey(payload.playerId), '')
      slot.pending ??= payload
      // The first catch-up goes out at the base interval; if the server is
      // still ahead (a second tab or device), back off like a failure.
      slot.staleStreak += 1
      if (slot.staleStreak > 1) {
        slot.failures = slot.retryKey === key ? slot.failures + 1 : 1
        slot.retryKey = key
      }
    }
  } catch (error) {
    // Silent fail for leaderboard sync to not disrupt gameplay
    logger.warn('Leaderboard', 'Stats sync failed', error)
    // Only a failure that can clear up is retried (network, 429, 5xx), with
    // backoff and never faster than the rate limit; a rejected payload would
    // fail the same way every time. A newer pending snapshot wins.
    if (isRetryable(error)) {
      slot.failures = slot.retryKey === key ? slot.failures + 1 : 1
      slot.retryKey = key
      slot.pending ??= payload
    }
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
  if (slot.inFlight) return
  // Re-plan an existing timer: the pending snapshot may have changed, and a
  // fresh one must not wait out the backoff of the one it replaced.
  if (slot.timer) clearTimeout(slot.timer)
  slot.timer = null
  // The backoff belongs to the failed snapshot; a newer one is a fresh attempt.
  const retrying =
    slot.failures > 0 &&
    slot.pending !== null &&
    snapshotKey(slot.pending) === slot.retryKey
  const interval = retrying
    ? Math.min(MAX_RETRY_INTERVAL_MS, MIN_SYNC_INTERVAL_MS * 2 ** slot.failures)
    : MIN_SYNC_INTERVAL_MS
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
