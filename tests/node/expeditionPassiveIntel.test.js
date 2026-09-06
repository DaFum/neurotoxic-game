/**
 * @fileoverview G5 Task 4 — Region identity that bites, and bounded free Intel.
 *
 * Two rules are proven here. A Region may refuse a whole event family outright
 * (the corporate Heat ceiling), which a clamped weight could never express. And
 * Career familiarity may hand out a little Intel for free without ever making a
 * committed Scout redundant or reaching the identity reveal.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getExpeditionRoutePressureProfile } from '../../src/domain/expedition/routeProfile.ts'
import { EXPEDITION_REGIONS } from '../../src/data/expedition/regions.ts'
import {
  MAX_NODE_INTEL_LEVEL,
  getExpeditionIntelCapability,
  getExpeditionNodeIntelLevel,
  resolveExpeditionIntelReveal
} from '../../src/domain/expedition/nodeIntel.ts'
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'
import { startedState } from '../expeditionLifecycleFixture.js'

/** The fixture run, re-pointed at one Region and given a Career history. */
const runIn = (regionId, career = {}, expedition = {}, reputation = {}) => {
  const base = startedState({ money: 5000 })
  return {
    ...base,
    reputationByRegion: { ...base.reputationByRegion, ...reputation },
    career: { ...base.career, ...career },
    expedition: {
      ...base.expedition,
      ...expedition,
      loadout: {
        ...base.expedition.loadout,
        regionId,
        tourTypeId: 'standard_tour'
      }
    }
  }
}

/** A Career whose counters derive at least the requested rank. */
const careerAt = base => ({
  ...base,
  completedExpeditionRuns: 5,
  finalizedExpeditionRuns: 5,
  completedExpeditionRegionIds: ['home_turf', 'festival_fields']
})

const withHeat = (state, heat) => ({
  ...state,
  expedition: {
    ...state.expedition,
    pressure: { ...state.expedition.pressure, heat }
  }
})

describe('G5 — a Region can refuse a family, not merely down-weight it', () => {
  it('declares the ceiling as data on exactly one Region', () => {
    const declaring = Object.values(EXPEDITION_REGIONS).filter(
      region => region.corporateSponsorHeatCeiling !== undefined
    )
    assert.deepEqual(
      declaring.map(region => region.id),
      ['corporate_circuit']
    )
    assert.equal(declaring[0].corporateSponsorHeatCeiling, 60)
  })

  it('keeps Contract pressure while the run stays under the ceiling', () => {
    const cold = withHeat(runIn('corporate_circuit'), 59)
    assert.ok(
      getExpeditionRoutePressureProfile(cold)
        .sponsorContractEventWeightMultiplier > 1,
      'the corporate Region leans on Contracts while it is cool'
    )
  })

  it('makes corporate Sponsors ineligible at and above the ceiling', () => {
    for (const heat of [60, 61, 100]) {
      assert.equal(
        getExpeditionRoutePressureProfile(
          withHeat(runIn('corporate_circuit'), heat)
        ).sponsorContractEventWeightMultiplier,
        0,
        `heat ${heat} must take the family off the table entirely`
      )
    }
  })

  it('leaves Regions that declare no ceiling alone at any Heat', () => {
    const hot = withHeat(runIn('underground_scene'), 100)
    assert.ok(
      getExpeditionRoutePressureProfile(hot)
        .sponsorContractEventWeightMultiplier > 0
    )
  })
})

describe('G5 — familiarity is bounded free Intel', () => {
  it('grants nothing to a Career with no history in the Region', () => {
    const capability = getExpeditionIntelCapability(runIn('home_turf'))
    assert.deepEqual(capability.familiarNodeIds, [])
    assert.equal(capability.passiveLevelFloor, 0)
  })

  it('gives no free reveal for finishing a run in the Region', () => {
    // Finishing a run here buys a Level-0 presence hint, never payout-level
    // Intel: the contract keeps the Level-1 reveal behind Region reputation so
    // familiarity cannot stand in for a Scout or a Contact.
    const state = runIn('home_turf', {
      completedExpeditionRegionIds: ['home_turf']
    })
    const capability = getExpeditionIntelCapability(state)
    assert.deepEqual(capability.familiarNodeIds, [])
    assert.equal(capability.hasRecoveryOrSponsorHint, true)
  })

  it('gives no free reveal for Career rank either', () => {
    const state = runIn(
      'home_turf',
      careerAt({
        completedExpeditionRegionIds: ['home_turf', 'industrial_belt']
      })
    )
    const capability = getExpeditionIntelCapability(state)
    assert.deepEqual(capability.familiarNodeIds, [])
    assert.equal(capability.hasRivalOrSponsorCategoryHint, true)
  })

  it('holds the reveal below the reputation threshold', () => {
    const state = runIn(
      'home_turf',
      { completedExpeditionRegionIds: ['home_turf'] },
      {},
      { home_turf: 49 }
    )
    assert.deepEqual(getExpeditionIntelCapability(state).familiarNodeIds, [])
  })

  it('grants exactly one reveal at the reputation threshold', () => {
    for (const reputation of [50, 80, 100]) {
      const state = runIn('home_turf', {}, {}, { home_turf: reputation })
      assert.equal(
        getExpeditionIntelCapability(state).familiarNodeIds.length,
        1,
        `reputation ${reputation} must entitle exactly one node`
      )
    }
  })

  it('is deterministic for a route step and re-drawn on the next one', () => {
    const state = runIn('home_turf', {}, {}, { home_turf: 60 })
    const first = getExpeditionIntelCapability(state).familiarNodeIds
    assert.deepEqual(getExpeditionIntelCapability(state).familiarNodeIds, first)
    const nextStep = {
      ...state,
      expedition: {
        ...state.expedition,
        routeStep: state.expedition.routeStep + 1
      }
    }
    assert.notDeepEqual(
      getExpeditionIntelCapability(nextStep).familiarNodeIds,
      first
    )
  })

  it('only ever reveals the road ahead, never a passed-up branch', () => {
    const state = runIn('home_turf', {}, {}, { home_turf: 60 })
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )
    // Unvisited is not the same as ahead: after the first branch the layers
    // the run passed up stay unvisited forever, and spending the entitlement
    // on one of those would reveal a node the run can never reach.
    for (let routeStep = 0; routeStep < 6; routeStep += 1) {
      const atStep = {
        ...state,
        expedition: { ...state.expedition, routeStep }
      }
      for (const nodeId of getExpeditionIntelCapability(atStep)
        .familiarNodeIds) {
        assert.ok(
          !atStep.expedition.visitedNodeIds.includes(nodeId),
          `step ${routeStep} revealed an already-walked node`
        )
        assert.ok(
          map.meta[nodeId].routeStep > routeStep,
          `step ${routeStep} revealed ${nodeId} at layer ${map.meta[nodeId].routeStep}`
        )
      }
    }
  })

  it('reads the familiar node at level 1 and every other node at level 0', () => {
    const state = runIn('home_turf', {}, {}, { home_turf: 60 })
    const capability = getExpeditionIntelCapability(state)
    const [familiar] = capability.familiarNodeIds
    assert.equal(getExpeditionNodeIntelLevel(state, familiar, capability), 1)
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )
    const other = map.nodeOrder.find(
      nodeId =>
        nodeId !== familiar &&
        map.meta[nodeId].routeStep > state.expedition.routeStep
    )
    assert.equal(getExpeditionNodeIntelLevel(state, other, capability), 0)
  })

  it('never carries a familiar node to the identity reveal by itself', () => {
    const state = runIn('home_turf', {}, {}, { home_turf: 60 })
    const capability = getExpeditionIntelCapability(state)
    for (const nodeId of capability.familiarNodeIds) {
      assert.ok(
        getExpeditionNodeIntelLevel(state, nodeId, capability) <
          MAX_NODE_INTEL_LEVEL
      )
    }
  })

  it('does not let the free reveal be re-spent as a perk floor', () => {
    const state = runIn('home_turf', {}, {}, { home_turf: 60 })
    const capability = getExpeditionIntelCapability(state)
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )
    const resolution = resolveExpeditionIntelReveal(
      state,
      {
        nodeId: capability.familiarNodeIds[0],
        source: 'perk_floor',
        expectedLevel: 1,
        expectedRouteStep: state.expedition.routeStep
      },
      map,
      capability
    )
    assert.deepEqual(resolution, { ok: false, reason: 'SOURCE_NOT_ENTITLED' })
  })

  it('leaves a committed Scout strictly better than familiarity', () => {
    const state = runIn('home_turf', {}, {}, { home_turf: 60 })
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )
    assert.ok(
      getExpeditionIntelCapability(state).familiarNodeIds.length <
        map.nodeOrder.length,
      'familiarity must never cover the whole route the way a Scout does'
    )
  })
})
