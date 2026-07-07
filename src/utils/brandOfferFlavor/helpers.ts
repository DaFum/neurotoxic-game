import type { RandomFn } from '../../types/callbacks'
import { selectRandomItem } from '../selectionUtils'

/**
 * Selects a random element from an array using a provided random number generator.
 * Thin wrapper around the shared `selectRandomItem`, preserving this module's
 * `undefined` (rather than `null`) empty-array contract.
 *
 * @typeParam T - The type of elements contained in the array.
 * @param arr - The source array from which to pick an element.
 * @param rng - A callback function that returns a random float between 0 (inclusive) and 1 (exclusive).
 * @returns A randomly selected element from the array, or undefined if the array is empty.
 */
export const pick = <T>(arr: readonly T[], rng: RandomFn): T | undefined =>
  selectRandomItem(arr, rng) ?? undefined

/**
 * Rounds a numeric value to the nearest multiple of a specified step.
 *
 * @param value - The original numeric value to be rounded.
 * @param step - The interval to which the value should be rounded. Must be a positive, non-zero number to avoid division by zero.
 * @returns The rounded value aligned to the nearest step.
 */
export const roundTo = (value: number, step: number): number =>
  Math.round(value / step) * step
