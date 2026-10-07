import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState'
import { applyEventDelta } from '../../src/utils/gameState'
import { eventEngine } from '../../src/utils/eventEngine'
import { addContrabandToBand } from '../../src/utils/contrabandStashUtils'
import { addContrabandHelper } from '../../src/context/reducers/bandReducer'
import { CONTRABAND_BY_ID } from '../../src/data/contraband'

const stashAddDelta = entries => ({
  player: {},
  band: { stashAdd: entries },
  social: {},
  flags: {}
})

test('c_diy_overdrive is a validated catalogue entry with an equipment effect', () => {
  const item = CONTRABAND_BY_ID.get('c_diy_overdrive')
  assert.ok(item, 'catalogue must contain c_diy_overdrive')
  assert.equal(item.type, 'equipment')
  assert.equal(item.applyOnAdd, true)
  assert.equal(item.stackable, false)
  assert.equal(item.effectType, 'crit')
  assert.equal(item.rarity, 'uncommon')
})

test('the contraband effect handler emits a stashAdd entry with a minted instance id', () => {
  const delta = eventEngine.applyResult(
    {
      type: 'composite',
      effects: [{ type: 'contraband', itemId: 'c_diy_overdrive' }]
    },
    {}
  )
  assert.equal(delta.band.stashAdd.length, 1)
  assert.equal(delta.band.stashAdd[0].contrabandId, 'c_diy_overdrive')
  assert.equal(typeof delta.band.stashAdd[0].instanceId, 'string')
  assert.ok(delta.band.stashAdd[0].instanceId.length > 0)
})

test('the contraband effect handler ignores a missing or non-string item id', () => {
  for (const itemId of [undefined, '', 5, null, {}]) {
    const delta = eventEngine.applyResult(
      { type: 'composite', effects: [{ type: 'contraband', itemId }] },
      {}
    )
    assert.equal(delta.band.stashAdd, undefined, String(itemId))
  }
})

test('applyEventDelta stashAdd adds the item and applies its equipment bonus once', () => {
  const state = createInitialState()
  const before = state.band.crit ?? 0
  const next = applyEventDelta(
    state,
    stashAddDelta([{ contrabandId: 'c_diy_overdrive', instanceId: 'inst_1' }])
  )
  assert.equal(next.band.stash.c_diy_overdrive.instanceId, 'inst_1')
  assert.equal(next.band.stash.c_diy_overdrive.applied, true)
  assert.equal(next.band.crit, before + 0.03)
  // The input state is untouched.
  assert.equal(state.band.stash.c_diy_overdrive, undefined)
})

test('applyEventDelta stashAdd drops unknown, forbidden and malformed entries', () => {
  const state = createInitialState()
  const next = applyEventDelta(
    state,
    stashAddDelta([
      { contrabandId: 'c_not_real', instanceId: 'a' },
      { contrabandId: '__proto__', instanceId: 'b' },
      { contrabandId: 42 },
      null,
      'c_diy_overdrive'
    ])
  )
  assert.deepEqual(Object.keys(next.band.stash), Object.keys(state.band.stash))
})

test('a duplicate non-stackable stashAdd is a no-op (no second bonus)', () => {
  const state = createInitialState()
  const once = applyEventDelta(
    state,
    stashAddDelta([{ contrabandId: 'c_diy_overdrive', instanceId: 'inst_1' }])
  )
  const twice = applyEventDelta(
    once,
    stashAddDelta([{ contrabandId: 'c_diy_overdrive', instanceId: 'inst_2' }])
  )
  assert.equal(twice.band.crit, once.band.crit)
  assert.equal(twice.band.stash.c_diy_overdrive.instanceId, 'inst_1')
})

test('addContrabandHelper and the event stash path produce the same stash entry', () => {
  const state = createInitialState()
  const viaHelper = addContrabandHelper(state, {
    contrabandId: 'c_diy_overdrive',
    instanceId: 'same'
  })
  const viaDelta = applyEventDelta(
    state,
    stashAddDelta([{ contrabandId: 'c_diy_overdrive', instanceId: 'same' }])
  )
  assert.deepEqual(viaDelta.band.stash, viaHelper.band.stash)
  assert.equal(viaDelta.band.crit, viaHelper.band.crit)
})

test('addContrabandToBand returns the identical band reference when nothing changes', () => {
  const state = createInitialState()
  assert.equal(
    addContrabandToBand(state.band, { contrabandId: 'c_missing' }),
    state.band
  )
  assert.equal(
    addContrabandToBand(state.band, { contrabandId: '__proto__' }),
    state.band
  )
})
