/**
 * Injectable wall-clock service.
 *
 * @remarks
 * Covers day advancement, timestamps, cooldowns, and persistence metadata.
 * **Not** gameplay timing: gig timing reads `audioEngine.getGigTimeMs()` and
 * must never be routed through this service.
 */
export interface IClock {
  /** Milliseconds since the epoch. */
  now(): number
  /** Current date. */
  today(): Date
}

/**
 * Real clock backed by the host environment.
 */
export const systemClock: IClock = {
  now: (): number => Date.now(),
  today: (): Date => new Date()
}

/**
 * Creates a clock frozen at a fixed instant, for deterministic tests.
 *
 * @param fixedNow - Milliseconds since the epoch that the clock reports.
 * @returns A clock that always returns `fixedNow`.
 */
export const createFixedClock = (fixedNow: number): IClock => ({
  now: (): number => fixedNow,
  today: (): Date => new Date(fixedNow)
})
