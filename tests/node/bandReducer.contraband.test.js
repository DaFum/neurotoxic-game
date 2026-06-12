import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  addContrabandHelper,
  handleUseContraband
} from '../../src/context/reducers/bandReducer'
import { DEFAULT_BAND_STATE } from '../../src/context/initialState'

describe('bandReducer - Contraband', () => {
  describe('addContrabandHelper', () => {
    it('adds an item to the stash', () => {
      const state = { band: { ...DEFAULT_BAND_STATE, stash: {} } }
      const payload = { contrabandId: 'c_void_energy', instanceId: 'test-123' }
      const newState = addContrabandHelper(state, payload)
      assert.equal(Object.keys(newState.band.stash).length, 1)
      assert.equal(Object.values(newState.band.stash)[0].instanceId, 'test-123')
      assert.equal(Object.values(newState.band.stash)[0].applied, false)
    })

    it('applies immediate effects for applyOnAdd equipment (luck)', () => {
      const state = { band: { ...DEFAULT_BAND_STATE, stash: {}, luck: 0 } }
      const payload = {
        contrabandId: 'c_rusty_strings',
        instanceId: 'test-456'
      } // luck +5
      const newState = addContrabandHelper(state, payload)
      assert.equal(newState.band.luck, 5)
      assert.equal(Object.values(newState.band.stash)[0].applied, true)
    })

    it('applies immediate effects for applyOnAdd equipment (stamina_max)', () => {
      const state = {
        band: {
          ...DEFAULT_BAND_STATE,
          stash: {},
          members: [{ id: 'm1', staminaMax: 100 }]
        }
      }
      const payload = {
        contrabandId: 'c_amped_synth',
        instanceId: 'test-synth'
      } // staminaMax +10
      const newState = addContrabandHelper(state, payload)
      assert.equal(newState.band.members[0].staminaMax, 110)
      assert.equal(Object.values(newState.band.stash)[0].applied, true)
    })
  })

  describe('handleUseContraband', () => {
    it('removes consumable items when used and applies targeted effect', () => {
      const state = {
        band: {
          ...DEFAULT_BAND_STATE,
          stash: {
            c_void_energy: {
              id: 'c_void_energy',
              instanceId: 'test-123',
              type: 'consumable',
              effectType: 'stamina',
              value: 50
            }
          },
          members: [{ id: 'm1', stamina: 20 }]
        }
      }
      const payload = {
        instanceId: 'test-123',
        contrabandId: 'c_void_energy',
        memberId: 'm1'
      }
      const newState = handleUseContraband(state, payload)

      assert.equal(Object.keys(newState.band.stash).length, 0) // Item consumed
      assert.equal(newState.band.members[0].stamina, 70) // 20 + 50
    })

    it('adds temporary duration items to activeContrabandEffects', () => {
      const state = {
        band: {
          ...DEFAULT_BAND_STATE,
          stash: {
            c_cursed_pick: {
              id: 'c_cursed_pick',
              instanceId: 'test-789',
              type: 'consumable',
              effectType: 'guitar_difficulty',
              value: -0.2,
              duration: 1
            }
          },
          activeContrabandEffects: [],
          performance: { guitarDifficulty: 1.0 }
        }
      }
      const payload = { instanceId: 'test-789', contrabandId: 'c_cursed_pick' }
      const newState = handleUseContraband(state, payload)

      assert.equal(Object.keys(newState.band.stash).length, 0)
      assert.equal(newState.band.activeContrabandEffects.length, 1)
      assert.equal(
        newState.band.activeContrabandEffects[0].remainingDuration,
        1
      )
      assert.equal(
        newState.band.activeContrabandEffects[0].effectType,
        'guitar_difficulty'
      )
    })

    it('uses finite fallbacks for harmony consumable effects', () => {
      const state = {
        band: {
          ...DEFAULT_BAND_STATE,
          harmony: Number.NaN,
          stash: {
            c_test_harmony: {
              id: 'c_test_harmony',
              instanceId: 'test-harmony',
              type: 'consumable',
              effectType: 'harmony',
              value: 4
            }
          }
        }
      }
      const payload = {
        instanceId: 'test-harmony',
        contrabandId: 'c_test_harmony'
      }

      const newState = handleUseContraband(state, payload)

      assert.equal(newState.band.harmony, 5)
    })

    it('uses finite fallbacks for stress consumable effects', () => {
      const state = {
        band: {
          ...DEFAULT_BAND_STATE,
          stress: 40,
          stash: {
            c_test_stress: {
              id: 'c_test_stress',
              instanceId: 'test-stress',
              type: 'consumable',
              effectType: 'stress',
              value: Number.NaN
            }
          }
        }
      }
      const payload = {
        instanceId: 'test-stress',
        contrabandId: 'c_test_stress'
      }

      const newState = handleUseContraband(state, payload)

      // A non-finite value must no-op the addend instead of collapsing stress to 0.
      assert.equal(newState.band.stress, 40)
    })

    it('uses finite fallbacks for guitar_difficulty effects', () => {
      const state = {
        band: {
          ...DEFAULT_BAND_STATE,
          performance: { guitarDifficulty: 1.5 },
          stash: {
            c_test_gd: {
              id: 'c_test_gd',
              instanceId: 'test-gd',
              type: 'equipment',
              effectType: 'guitar_difficulty',
              value: Number.NaN
            }
          }
        }
      }
      const payload = {
        instanceId: 'test-gd',
        contrabandId: 'c_test_gd'
      }

      const newState = handleUseContraband(state, payload)

      // A non-finite value must not poison guitarDifficulty with NaN.
      assert.equal(newState.band.performance.guitarDifficulty, 1.5)
    })

    it('applies persistent untargeted effects directly if duration is not set', () => {
      const state = {
        band: {
          ...DEFAULT_BAND_STATE,
          stash: {
            c_leather_jacket: {
              id: 'c_leather_jacket',
              instanceId: 'test-patch',
              type: 'equipment',
              effectType: 'style',
              value: 3
            }
          },
          style: 0
        }
      }
      const payload = {
        instanceId: 'test-patch',
        contrabandId: 'c_leather_jacket'
      }
      const newState = handleUseContraband(state, payload)

      assert.equal(Object.keys(newState.band.stash).length, 1) // Equipment not removed
      assert.equal(Object.values(newState.band.stash)[0].applied, true)
      assert.equal(newState.band.style, 3)
    })
  })
})
