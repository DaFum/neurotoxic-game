import { finiteNumberOr } from '../gameStateUtils'

export const asNumber = (value: unknown): number => finiteNumberOr(value, 0)

export const toStringArray = (value: string[] | Set<string> | undefined): string[] => {
  if (!value) return []
  return Array.isArray(value) ? value : Array.from(value)
}

/**
 * Filters and selects an event based on context, priority, and probability.
 */