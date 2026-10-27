import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { addContrabandToBand } from '../../src/utils/contrabandStashUtils'
import { startedState } from '../expeditionLifecycleFixture'

/**
 * Roadie delivery of an apply-on-add equipment item (#3405) and of contraband
 * during a Tour (#3404): the reducer reverses what acquisition actually
 * applied, and only packed cargo can be delivered.
 */

const PENDANT = 'c_abyssal_pendant' // harmony -10, non-stackable
const SYNTH = 'c_amped_synth' // stamina_max +10, non-stackable

const ownEquipment = (state, id, harmony) => {
  const band = addContrabandToBand(
    { ...state.band, harmony },
    { contrabandId: id, instanceId: `inst_${id}` }
  )
  return { ...state, band }
}

const startRoadie = state =>
  gameReducer(state, {
    type: ActionTypes.START_ROADIE_MINIGAME,
    payload: { gigId: 'gig_1' }
  })

const deliver = (state, id, equipmentDamage = 0) =>
  gameReducer(startRoadie(state), {
    type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
    payload: {
      equipmentDamage,
      contrabandDelivered: 1,
      deliveredStashItemId: id
    }
  })

describe('roadie delivery of apply-on-add equipment (#3405)', () => {
  it('acquisition at harmony 5 records the clamped delta', () => {
    const owned = ownEquipment(createInitialState(), PENDANT, 5)
    assert.equal(owned.band.harmony, 1)
    assert.equal(owned.band.stash[PENDANT].appliedValue, -4)
  })

  it('refunds the applied -4, not the nominal -10', () => {
    const owned = ownEquipment(createInitialState(), PENDANT, 5)
    owned.band.harmony = 50 // recovered before the gig

    const next = deliver(owned, PENDANT)

    assert.equal(next.band.harmony, 54)
    assert.ok(!Object.hasOwn(next.band.stash, PENDANT))
  })

  it('never stores harmony above 100', () => {
    const owned = ownEquipment(createInitialState(), PENDANT, 5)
    owned.band.harmony = 100

    assert.equal(deliver(owned, PENDANT).band.harmony, 100)
  })

  it('settles the Roadie harmony loss before the refund', () => {
    const owned = ownEquipment(createInitialState(), PENDANT, 5)
    owned.band.harmony = 50

    // Damage 20 costs 4 harmony; the 4 refunded brings it back.
    assert.equal(deliver(owned, PENDANT, 20).band.harmony, 50)
  })

  it('falls back to the nominal value for an entry with no recorded delta', () => {
    const owned = ownEquipment(createInitialState(), PENDANT, 50)
    delete owned.band.stash[PENDANT].appliedValue
    owned.band.harmony = 95

    // -(-10) = +10, clamped to 100.
    assert.equal(deliver(owned, PENDANT).band.harmony, 100)
  })

  it('keeps current stamina under the lowered maximum', () => {
    const base = createInitialState()
    base.band.members = [
      { id: 'm1', name: 'A', stamina: 100, staminaMax: 100 },
      { id: 'm2', name: 'B', stamina: 80, staminaMax: 100 }
    ]
    const owned = ownEquipment(base, SYNTH, 50)
    // Filled up to the enhanced cap.
    owned.band.members = owned.band.members.map(m => ({
      ...m,
      stamina: m.staminaMax
    }))
    assert.equal(owned.band.members[0].staminaMax, 110)

    const next = deliver(owned, SYNTH)

    for (const member of next.band.members) {
      assert.equal(member.staminaMax, 100)
      assert.ok(member.stamina <= member.staminaMax)
    }
  })

  it('still credits the delivery and consumes the item once', () => {
    const owned = ownEquipment(createInitialState(), PENDANT, 50)
    const before = owned.player.money

    const once = deliver(owned, PENDANT)
    assert.equal(once.player.money, before + 50)

    // A repeat on the finished minigame is ignored.
    const twice = gameReducer(once, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: {
        equipmentDamage: 0,
        contrabandDelivered: 1,
        deliveredStashItemId: PENDANT
      }
    })
    assert.strictEqual(twice, once)
  })

  it('leaves the effect applied while stacks remain', () => {
    const owned = ownEquipment(createInitialState(), PENDANT, 50)
    owned.band.stash[PENDANT] = { ...owned.band.stash[PENDANT], stacks: 2 }
    const harmony = owned.band.harmony

    const next = deliver(owned, PENDANT)

    assert.equal(next.band.stash[PENDANT].stacks, 1)
    assert.equal(next.band.harmony, harmony)
  })
})

describe('roadie delivery during a Tour (#3404)', () => {
  const tourWithStash = (stash, contraband) => {
    const state = startedState({ money: 5000 })
    return {
      ...state,
      band: { ...state.band, stash },
      expedition: {
        ...state.expedition,
        cargo: { ...state.expedition.cargo, contraband }
      }
    }
  }
  const item = (id, stacks, instanceId = `inst_${id}`) => ({
    id,
    type: 'consumable',
    instanceId,
    stacks
  })

  it('gives no bonus and keeps an item left at HQ', () => {
    const state = tourWithStash({ c_gig_program: item('c_gig_program', 1) }, [])
    const next = deliver(state, 'c_gig_program')

    assert.equal(next.player.money, state.player.money)
    assert.equal(next.band.stash.c_gig_program.stacks, 1)
    assert.deepEqual(next.expedition.cargo.contraband, [])
    assert.equal(next.minigame.active, false)
  })

  it('debits the stash and the manifest together for a packed stack', () => {
    const state = tourWithStash({ c_gig_program: item('c_gig_program', 3) }, [
      { stashKey: 'c_gig_program', instanceId: 'inst_c_gig_program', stacks: 2 }
    ])
    const next = deliver(state, 'c_gig_program')

    assert.equal(next.player.money, state.player.money + 50)
    assert.equal(next.band.stash.c_gig_program.stacks, 2)
    assert.equal(next.expedition.cargo.contraband[0].stacks, 1)
  })

  it('drops the manifest entry with the last packed unit', () => {
    const state = tourWithStash({ c_gig_program: item('c_gig_program', 1) }, [
      { stashKey: 'c_gig_program', instanceId: null, stacks: 1 }
    ])
    const next = deliver(state, 'c_gig_program')

    assert.ok(!Object.hasOwn(next.band.stash, 'c_gig_program'))
    assert.deepEqual(next.expedition.cargo.contraband, [])
  })

  it('refuses a packed entry bound to another instance', () => {
    const state = tourWithStash({ c_gig_program: item('c_gig_program', 1) }, [
      { stashKey: 'c_gig_program', instanceId: 'someone_else', stacks: 1 }
    ])
    const next = deliver(state, 'c_gig_program')

    assert.equal(next.player.money, state.player.money)
    assert.equal(next.band.stash.c_gig_program.stacks, 1)
  })

  it('pays only once when the completion is repeated', () => {
    const state = tourWithStash({ c_gig_program: item('c_gig_program', 2) }, [
      { stashKey: 'c_gig_program', instanceId: null, stacks: 2 }
    ])
    const once = deliver(state, 'c_gig_program')
    const twice = gameReducer(once, {
      type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
      payload: {
        equipmentDamage: 0,
        contrabandDelivered: 1,
        deliveredStashItemId: 'c_gig_program'
      }
    })

    assert.strictEqual(twice, once)
    assert.equal(once.expedition.cargo.contraband[0].stacks, 1)
  })

  it('keeps Career behavior outside a Tour', () => {
    const base = createInitialState()
    base.band.stash = { c_gig_program: item('c_gig_program', 1) }
    const next = deliver(base, 'c_gig_program')

    assert.equal(next.player.money, base.player.money + 50)
    assert.ok(!Object.hasOwn(next.band.stash, 'c_gig_program'))
  })
})
