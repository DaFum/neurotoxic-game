/**
 * Leaderboard stats sync controller.
 *
 * @remarks
 * Plain logic with every environment dependency injected (`fetch`, clock,
 * storage, timers, logger, the enable flag), so the whole state machine runs
 * under `node:test`. `useLeaderboardSync` is a thin effect on top of it.
 *
 * Every stat change is queued as the latest snapshot and flushed through one
 * in-flight request per player, throttled to the endpoint's rate limit. Each
 * request carries a monotonic revision so the server can drop one that was
 * overtaken. The board is honor-based: values are client-reported and not
 * verified.
 */
import { finiteNumberOr } from './finiteNumber'
import type { IClock } from './clock'
import type { LeaderboardStatsPayload } from '../types/leaderboard'

/**
 * The stats endpoint allows 5 requests a minute per IP, so one player never
 * sends more often than this, however fast their stats change.
 */
export const MIN_SYNC_INTERVAL_MS = 15000
const MAX_RETRY_INTERVAL_MS = 5 * 60 * 1000

/** The part of a fetch Response the controller reads. */
type SyncResponse = {
  ok: boolean
  status: number
  statusText?: string
  json(): Promise<unknown>
}

export type LeaderboardSyncDeps = {
  fetch: (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string }
  ) => Promise<SyncResponse>
  clock: IClock
  /** Untrusted string-keyed storage; reads return whatever was stored. */
  storage: {
    read: (key: string) => unknown
    write: (key: string, value: unknown) => void
  }
  timers: {
    setTimeout: (callback: () => void, ms: number) => unknown
    clearTimeout: (handle: unknown) => void
  }
  logger: {
    info: (source: string, message: string) => void
    warn: (source: string, message: string, error?: unknown) => void
  }
  isEnabled: () => boolean
}

export type LeaderboardSyncController = {
  /** Queues the latest snapshot for a player and flushes it when due. */
  submit: (payload: LeaderboardStatsPayload, clock?: IClock) => void
  /** Cancels pending timers and forgets all per-player state. */
  dispose: () => void
}

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
  timer: unknown
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
 * The part of a payload that decides whether the server's copy is current.
 *
 * @param payload - The stats snapshot.
 * @returns A stable key for the snapshot.
 */
export const snapshotKey = (payload: LeaderboardStatsPayload): string =>
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

const lastSyncedKeyStorageKey = (playerId: string): string =>
  `neurotoxic_last_synced_snapshot:${playerId}`
const revisionStorageKey = (playerId: string): string =>
  `neurotoxic_stats_revision:${playerId}`

/**
 * Creates a sync controller around the given environment.
 *
 * @param deps - Injected fetch, clock, storage, timers, logger and enable flag.
 * @returns The controller; its state lives and dies with the instance.
 */
export const createLeaderboardSyncController = (
  deps: LeaderboardSyncDeps
): LeaderboardSyncController => {
  // Coalesces stat changes: while a request is in flight or throttled, only the
  // newest snapshot is kept and sent afterwards, so a change is never dropped
  // and the board is never left on the first snapshot of the day.
  const slots = new Map<string, SyncSlot>()
  let endpointUnavailable = false

  const getSlot = (playerId: string): SyncSlot => {
    const existing = slots.get(playerId)
    if (existing) return existing
    // Storage is untrusted: only a string marker counts as a prior sync.
    const stored = deps.storage.read(lastSyncedKeyStorageKey(playerId))
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
    slots.set(playerId, slot)
    return slot
  }

  /** The stored revision, or 0 when it is not one the API would accept. */
  const readStoredRevision = (playerId: string): number => {
    // A value the API would reject (not a safe integer, or exhausted) was never
    // accepted server-side, so start from the clock instead.
    const raw = finiteNumberOr(
      deps.storage.read(revisionStorageKey(playerId)),
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
    deps.storage.write(revisionStorageKey(playerId), revision)
    return revision
  }

  const adoptServerRevision = (playerId: string, revision: number): void => {
    if (
      Number.isSafeInteger(revision) &&
      revision > readStoredRevision(playerId)
    ) {
      deps.storage.write(revisionStorageKey(playerId), revision)
    }
  }

  /**
   * Sends the payload to the leaderboard API.
   *
   * @returns `synced` when applied, `stale` with the server's revision when a
   * newer one was already stored, `skipped` when intentionally not sent.
   * @throws {@link Error} when the stats endpoint exists but answers with a
   * non-success response.
   */
  const send = async (
    payload: LeaderboardStatsPayload,
    allocateRevision: () => number
  ): Promise<SyncResult> => {
    if (!deps.isEnabled() || endpointUnavailable) {
      return { status: 'skipped' }
    }

    // Allocated only once the request really goes out, so a skipped flush does
    // not burn a revision or write storage.
    const response = await deps.fetch('/api/leaderboard/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, revision: allocateRevision() })
    })

    if (response.status === 404) {
      if (!endpointUnavailable) {
        deps.logger.info(
          'Leaderboard',
          'Stats endpoint unavailable (404). Disabling stat sync for this session.'
        )
      }
      endpointUnavailable = true
      return { status: 'skipped' }
    }

    if (!response.ok) {
      throw new SyncHttpError(response.status, response.statusText ?? '')
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
      const result = await send(payload, () =>
        nextRevision(payload.playerId, clock)
      )
      if (result.status === 'synced') {
        slot.failures = 0
        slot.staleStreak = 0
        slot.retryKey = null
        slot.lastSentKey = key
        deps.storage.write(lastSyncedKeyStorageKey(payload.playerId), key)
        deps.logger.info('Leaderboard', `Synced stats for day ${payload.day}`)
      } else if (result.status === 'stale') {
        // The server holds a newer revision than this client has used. Adopt it
        // and send the snapshot again, or the board would stay on the old one.
        adoptServerRevision(payload.playerId, result.revision)
        // The server holds a snapshot this client never confirmed, so the last
        // confirmed key no longer says what is stored: forget it, or a pending
        // snapshot that equals it would be skipped and the board left behind.
        slot.lastSentKey = null
        deps.storage.write(lastSyncedKeyStorageKey(payload.playerId), '')
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
      deps.logger.warn('Leaderboard', 'Stats sync failed', error)
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
    if (slot.timer !== null) deps.timers.clearTimeout(slot.timer)
    slot.timer = null
    // The backoff belongs to the failed snapshot; a newer one is a fresh attempt.
    const retrying =
      slot.failures > 0 &&
      slot.pending !== null &&
      snapshotKey(slot.pending) === slot.retryKey
    const interval = retrying
      ? Math.min(
          MAX_RETRY_INTERVAL_MS,
          MIN_SYNC_INTERVAL_MS * 2 ** slot.failures
        )
      : MIN_SYNC_INTERVAL_MS
    const wait =
      slot.lastSentAt === null
        ? 0
        : Math.max(0, interval - (clock.now() - slot.lastSentAt))
    if (wait === 0) {
      void flushSlot(slot, clock)
      return
    }
    slot.timer = deps.timers.setTimeout(() => {
      void flushSlot(slot, clock)
    }, wait)
  }

  return {
    submit: (payload, clock = deps.clock) => {
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
    },
    dispose: () => {
      endpointUnavailable = false
      for (const slot of slots.values()) {
        if (slot.timer !== null) deps.timers.clearTimeout(slot.timer)
      }
      slots.clear()
    }
  }
}
