import test from 'node:test'
import assert from 'node:assert/strict'
import { handleClinicHeal, handleClinicEnhance } from '../src/context/reducers/clinicReducer.js'

test('clinicReducer', async t => {
  await t.test('handleClinicHeal', async t2 => {
    await t2.test('heals member and deducts cost, clamps bounds', () => {
      const state = {
        player: { money: 500, fame: 100, clinicVisits: 0 },
        band: {
          members: [
            { id: 'm1', name: 'M1', stamina: 50, mood: 50 },
            { id: 'm2', name: 'M2', stamina: 100, mood: 100 }
          ]
        }
      }

      const payload = {
        memberId: 'm1',
        cost: 100,
        fameCost: 0,
        staminaGain: 60, // Should clamp to 100
        moodGain: 10
      }

      const nextState = handleClinicHeal(state, payload)

      assert.equal(nextState.player.money, 400)
      assert.equal(nextState.player.clinicVisits, 1)
      assert.equal(nextState.band.members[0].stamina, 100)
      assert.equal(nextState.band.members[0].mood, 60)
      assert.equal(nextState.band.members[1].stamina, 100)
    })

    await t2.test('fails if not enough money', () => {
      const state = {
        player: { money: 50, fame: 100, clinicVisits: 0 },
        band: { members: [{ id: 'm1', stamina: 50 }] }
      }

      const payload = { memberId: 'm1', cost: 100 }
      const nextState = handleClinicHeal(state, payload)

      assert.equal(nextState, state) // Returns original state
    })
  })

  await t.test('handleClinicEnhance', async t2 => {
    await t2.test('adds trait and deducts fame', () => {
      const state = {
        player: { money: 1000, fame: 500, clinicVisits: 0 },
        band: {
          members: [
            { id: 'm1', traits: ['existing_trait'] }
          ]
        }
      }

      const payload = {
        memberId: 'm1',
        cost: 0,
        fameCost: 500,
        trait: 'cyber_lungs'
      }

      const nextState = handleClinicEnhance(state, payload)

      assert.equal(nextState.player.fame, 0)
      assert.equal(nextState.player.clinicVisits, 1)
      assert.deepEqual(nextState.band.members[0].traits, ['existing_trait', 'cyber_lungs'])
    })

    await t2.test('fails if missing trait', () => {
      const state = {
        player: { money: 1000, fame: 500 },
        band: { members: [{ id: 'm1', traits: [] }] }
      }

      const payload = { memberId: 'm1', cost: 0, fameCost: 100 }
      const nextState = handleClinicEnhance(state, payload)

      assert.equal(nextState, state)
    })
  })
})
