/**
 * DEV-only registry of read-only runtime hooks for browser tests.
 *
 * @remarks
 * Follows the `window.gameState` gating in `GameState.tsx`: everything here is a
 * no-op unless `import.meta.env.DEV` is set, so a production build registers
 * nothing and exposes nothing. Hooks are owned by the component or controller
 * that registers them and are removed again on its teardown.
 */

import type { TourbusObstacleType } from '../types/tourbus'

/** Copied lane, pause, transport and hit/miss state of the rhythm game. */
type RhythmTestSnapshot = {
  /** Active flag of each lane, in lane order. */
  laneActive: boolean[]
  /** Whether the player paused the gig. */
  userPaused: boolean
  /** Tone transport state as the audio engine reports it. */
  transportState: string
  /** Gig clock in milliseconds. */
  gigTimeMs: number
  /** Notes hit so far, perfect or not. */
  hits: number
  /** Notes missed so far. */
  misses: number
}

/** Read-only view of the running rhythm game. */
type RhythmTestApi = {
  getSnapshot: () => RhythmTestSnapshot
}

/** One obstacle a Tourbus test places. */
type TourbusTestObstacle = {
  id: string | number
  lane: number
  y: number
  type: TourbusObstacleType
}

/** Replaces the Tourbus obstacle list and pins the speed; spawning stays off. */
type TourbusTestFixture = {
  fixedSpeed: number
  spawnEnabled: false
  obstacles: TourbusTestObstacle[]
}

/** Copied Tourbus state: lane, damage, pickups, collisions and obstacles. */
type TourbusTestSnapshot = {
  busLane: number
  damage: number
  pickupCount: number
  collidedIds: (string | number)[]
  obstacles: {
    id: string | number
    lane: number
    y: number
    type: TourbusTestObstacle['type']
    collided: boolean
  }[]
}

/** Test control and read-only view of the Tourbus minigame logic. */
type TourbusTestApi = {
  setFixture: (fixture: TourbusTestFixture) => void
  getSnapshot: () => TourbusTestSnapshot
}

/** Manual frame stepping for the Tourbus stage. */
type TourbusFramesApi = {
  enableManualFrames: () => void
  stepFrame: (deltaMS: number) => void
}

/** Every hook a browser test can find on `window.neurotoxicTestHooks`. */
export type DevTestHooks = {
  rhythm?: RhythmTestApi
  tourbus?: TourbusTestApi
  tourbusFrames?: TourbusFramesApi
}

declare global {
  interface Window {
    neurotoxicTestHooks?: DevTestHooks
  }
}

// Read when a hook registers, like the `window.gameState` gating, so a
// production build (where `DEV` is false) registers nothing.
const isDev = (): boolean =>
  typeof import.meta !== 'undefined' &&
  !!(import.meta as unknown as Record<string, unknown>).env &&
  !!(
    (import.meta as unknown as Record<string, unknown>).env as Record<
      string,
      unknown
    >
  ).DEV

/**
 * Registers a test hook.
 *
 * @param name - Hook key on `window.neurotoxicTestHooks`.
 * @param api - The hook implementation.
 * @returns A cleanup that removes the hook, but only while it is still this
 * `api`: a newer registration under the same name is left alone. A no-op
 * outside DEV.
 */
export const registerTestHook = <K extends keyof DevTestHooks>(
  name: K,
  api: NonNullable<DevTestHooks[K]>
): (() => void) => {
  if (!isDev() || typeof window === 'undefined') return () => {}
  const hooks: DevTestHooks = window.neurotoxicTestHooks ?? {}
  hooks[name] = api
  window.neurotoxicTestHooks = hooks
  return () => {
    const current = window.neurotoxicTestHooks
    if (current?.[name] === api) delete current[name]
  }
}
