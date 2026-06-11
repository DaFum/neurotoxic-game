import type { RandomFn } from '../../types/callbacks'

export const pick = <T>(arr: readonly T[], rng: RandomFn): T | undefined => {
  if (arr.length === 0) return undefined
  const idx = Math.max(
    0,
    Math.min(arr.length - 1, Math.floor(rng() * arr.length))
  )
  return arr[idx]
}

export const roundTo = (value: number, step: number): number =>
  Math.round(value / step) * step
