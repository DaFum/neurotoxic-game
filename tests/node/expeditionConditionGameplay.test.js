/**
 * @fileoverview Technical Condition changes the gig, not just the PreGig text.
 *
 * The condition profile advertises four penalties. If the rhythm owners never
 * read them the player is shown a reduced hit window while play stays
 * identical, which is the invisible-debuff-in-reverse the design forbids. These
 * suites drive the real producers — the gig modifier producer, the physics
 * setup that owns the hit windows, and the two scoring helpers that own the
 * miss cost and the streak meter — and pin each advertised axis to its effect.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getGigModifiers } from '../../src/utils/simulationUtils'
import { setupGigPhysics } from '../../src/utils/audio/gigPhysics'
import {
  calculateActiveCrowdDecay,
  calculateHitOverload
} from '../../src/utils/rhythmGameScoringUtils'
import { getExpeditionConditionPerformanceProfile } from '../../src/domain/expedition/condition'
import { createInitialState } from '../../src/context/initialState'
import { startedState } from '../expeditionLifecycleFixture.js'

/** A condition snapshot with every group at the given value. */
const condition = (pa, instruments, stageGear) => ({
  pa,
  instruments,
  stageGear,
  defects: []
})

const HEALTHY = getExpeditionConditionPerformanceProfile(
  condition(100, 100, 100)
)
const WRECKED = getExpeditionConditionPerformanceProfile(condition(20, 20, 20))

const fixtureBand = () => createInitialState().band

/** A map with one node the player stands on, as `setupGigPhysics` expects. */
const fixtureMapAndNode = () => {
  const state = startedState()
  const nodeId = state.player.currentNodeId
  assert.ok(state.gameMap?.nodes?.[nodeId], 'the fixture map has no start node')
  return { gameMap: state.gameMap, nodeId }
}

describe('the profile reaches the gig modifier producer', () => {
  it('carries the profile itself rather than copied numbers', () => {
    const modifiers = getGigModifiers(fixtureBand(), {}, WRECKED)
    assert.deepEqual(modifiers.expeditionCondition, WRECKED)
  })

  it('routes an audio hazard through the existing damaged-gear channel', () => {
    assert.ok(WRECKED.audioHazardLevel >= 1)
    assert.equal(getGigModifiers(fixtureBand(), {}, WRECKED).noteJitter, true)
  })

  it('leaves Career play untouched', () => {
    const modifiers = getGigModifiers(fixtureBand(), {})
    assert.equal(modifiers.expeditionCondition, undefined)
    assert.equal(modifiers.noteJitter, false)
  })

  it('adds no hazard at healthy condition', () => {
    assert.equal(HEALTHY.audioHazardLevel, 0)
    assert.equal(getGigModifiers(fixtureBand(), {}, HEALTHY).noteJitter, false)
  })
})

describe('timingMultiplier tightens the real hit windows', () => {
  const physics = profile => {
    const { gameMap, nodeId } = fixtureMapAndNode()
    const setup = setupGigPhysics(
      fixtureBand(),
      {},
      undefined,
      gameMap,
      nodeId,
      undefined,
      profile
    )
    assert.ok(setup, 'gig physics setup failed')
    return setup
  }

  it('scales every lane by the profile multiplier', () => {
    assert.ok(WRECKED.timingMultiplier < 1)
    const healthy = physics(HEALTHY).hitWindows
    const wrecked = physics(WRECKED).hitWindows
    for (let lane = 0; lane < healthy.length; lane++) {
      assert.equal(
        wrecked[lane],
        healthy[lane] * WRECKED.timingMultiplier,
        `lane ${lane}`
      )
    }
  })

  it('leaves the windows alone without a profile', () => {
    assert.deepEqual(physics(null).hitWindows, physics(HEALTHY).hitWindows)
  })
})

describe('missStaminaMultiplier raises the cost of a miss', () => {
  it('composes with the other decay sources', () => {
    assert.ok(WRECKED.missStaminaMultiplier > 1)
    const base = calculateActiveCrowdDecay(1, undefined, false, 2)
    const worn = calculateActiveCrowdDecay(
      1,
      undefined,
      false,
      2,
      WRECKED.missStaminaMultiplier
    )
    assert.equal(worn, base * WRECKED.missStaminaMultiplier)
  })

  it('is neutral when omitted or non-finite', () => {
    const base = calculateActiveCrowdDecay(1, undefined, false, 2)
    assert.equal(calculateActiveCrowdDecay(1, undefined, false, 2, 1), base)
    assert.equal(
      calculateActiveCrowdDecay(1, undefined, false, 2, Number.NaN),
      base
    )
  })
})

describe('comboRecoveryMultiplier slows the streak meter', () => {
  it('reduces the overload a clean hit grants', () => {
    assert.ok(WRECKED.comboRecoveryMultiplier < 1)
    const full = calculateHitOverload(0, false).nextOverload
    const worn = calculateHitOverload(
      0,
      false,
      WRECKED.comboRecoveryMultiplier
    ).nextOverload
    assert.ok(worn < full)
    assert.equal(worn, full * WRECKED.comboRecoveryMultiplier)
  })

  it('is neutral when omitted or non-finite', () => {
    const full = calculateHitOverload(0, false).nextOverload
    assert.equal(calculateHitOverload(0, false, 1).nextOverload, full)
    assert.equal(calculateHitOverload(0, false, Number.NaN).nextOverload, full)
  })
})
