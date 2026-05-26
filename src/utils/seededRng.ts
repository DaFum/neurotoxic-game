/**
 * Deterministic seeded RNG helpers for asset ticks and crowdfund resolution.
 *
 * The asset system requires deterministic random rolls so save/reload yields
 * identical outcomes. The reducer must remain pure, so RNG is pre-rolled in
 * the action creator and passed via action payload as a stream of 0..1 values.
 *
 * `mulberry32` is a small, fast, well-distributed PRNG suitable for game RNG.
 * It is NOT cryptographically secure — for security-sensitive paths use
 * `src/utils/crypto.ts` instead.
 */

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generates `length` deterministic random numbers in [0, 1) from the given seed.
 * Same seed + length always produces the same array.
 */
export const createRngStream = (seed: number, length: number): number[] => {
  const rng = mulberry32(seed)
  const out: number[] = new Array(length)
  for (let i = 0; i < length; i++) out[i] = rng()
  return out
}

/**
 * Advances a seed by one step. Used in the `advanceDay` action creator so the
 * next day's RNG stream uses a fresh seed; persisted in `state.rngSeed`.
 */
export const nextSeed = (seed: number): number => {
  // One step of mulberry32 mixed back into 32-bit space.
  const rng = mulberry32(seed)
  return (rng() * 2 ** 32) >>> 0
}
