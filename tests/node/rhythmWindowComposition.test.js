/**
 * @fileoverview Real physics initialization followed by the real hit-window
 * resolution: each flat timing adjustment lands exactly once (#3388), and the
 * physics drum multiplier is the trait-only half that scoring composes with
 * equipment (#3386).
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { setupGigPhysics } from '../../src/utils/audio/gigPhysics'
import { resolveLaneHitWindow } from '../../src/utils/rhythmGameScoringUtils'
import { createInitialState } from '../../src/context/initialState'
import { startedState } from '../expeditionLifecycleFixture.js'

const neutral = {
  tempoBonus: 0,
  timingWindowMultiplier: 1,
  guitarDifficulty: 1
}

const physicsFor = (harmony, gigModifiers = {}) => {
  const state = startedState()
  const band = { ...createInitialState().band, harmony }
  const setup = setupGigPhysics(
    band,
    gigModifiers,
    undefined,
    state.gameMap,
    state.player.currentNodeId,
    undefined
  )
  assert.ok(setup)
  return setup
}

describe('flat hit-window adjustments apply once', () => {
  const neutralHarmony = physicsFor(50)

  it('high harmony grants exactly its declared bonus', () => {
    const setup = physicsFor(90)
    const delta =
      resolveLaneHitWindow(setup.hitWindows[1], 1, neutral) -
      resolveLaneHitWindow(neutralHarmony.hitWindows[1], 1, neutral)
    assert.equal(delta, 20)
  })

  it('low harmony imposes exactly its declared penalty', () => {
    const setup = physicsFor(10)
    const delta =
      resolveLaneHitWindow(setup.hitWindows[1], 1, neutral) -
      resolveLaneHitWindow(neutralHarmony.hitWindows[1], 1, neutral)
    assert.equal(delta, -25)
  })

  it('keeps Soundcheck on top of the harmony bonus', () => {
    const setup = physicsFor(90, { soundcheck: true })
    const delta =
      resolveLaneHitWindow(setup.hitWindows[1], 1, neutral) -
      resolveLaneHitWindow(neutralHarmony.hitWindows[1], 1, neutral)
    assert.equal(delta, 50)
  })
})

describe('physics drum multiplier', () => {
  it('is the trait multiplier alone, ignoring owned equipment', () => {
    const plain = physicsFor(50).mergedModifiers.drumMultiplier
    assert.equal(plain, 1)
  })
})
