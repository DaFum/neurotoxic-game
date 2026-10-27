/**
 * @fileoverview An older active save never stored `expedition.cargo`. Loading
 * derives it once from the committed loadout, so every reader (Authority
 * exits, archive claims, stash, merch) sees the same manifest (#3394).
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import { startedState } from '../expeditionLifecycleFixture.js'

const CONTRABAND = [{ stashKey: 'c_void_energy', instanceId: null, stacks: 2 }]

/** A persisted active run as an older build wrote it: loadout, no cargo. */
const legacyExpedition = () => {
  const state = startedState()
  const expedition = JSON.parse(JSON.stringify(state.expedition))
  expedition.loadout.build.contraband = CONTRABAND
  delete expedition.cargo
  return { state, expedition }
}

test('loading an active save without cargo derives it from the loadout', () => {
  const { state, expedition } = legacyExpedition()
  const loaded = sanitizeExpeditionState(
    expedition,
    state.runSeed,
    state.lastGigStats
  )
  assert.equal(loaded.status, 'active')
  assert.deepEqual(loaded.cargo.contraband, CONTRABAND)
  assert.deepEqual(loaded.cargo.merch, loaded.loadout.build.merch)
})

test('a stored cargo is kept as it is, not re-derived', () => {
  const { state, expedition } = legacyExpedition()
  expedition.cargo = {
    spareParts: 0,
    supplies: 0,
    technicalGearItemIds: [],
    merch: [],
    contraband: []
  }
  const loaded = sanitizeExpeditionState(
    expedition,
    state.runSeed,
    state.lastGigStats
  )
  assert.deepEqual(loaded.cargo.contraband, [])
})

test('an idle run gets no derived cargo', () => {
  const loaded = sanitizeExpeditionState({ status: 'idle' })
  assert.equal(loaded.cargo, undefined)
})
