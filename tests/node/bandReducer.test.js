import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  handleUpdateBand,
  handleConsumeItem,
  handleUnlockTrait
} from '../../src/context/reducers/bandReducer'

describe('bandReducer', () => {
  let baseState

  beforeEach(() => {
    baseState = {
      band: {
        harmony: 50,
        inventory: {
          consumable_item: 5,
          boolean_item: true
        },
        members: [{ id: 'm1', name: 'Matze', traits: {} }]
      },
      toasts: []
    }
  })

  describe('handleUpdateBand', () => {
    it('should correctly merge object updates', () => {
      const payload = { fame: 10 }
      const nextState = handleUpdateBand(baseState, payload)

      assert.strictEqual(nextState.band.fame, 10)
      assert.strictEqual(nextState.band.harmony, 50)
    })

    it('should support functional updates', () => {
      const payload = prev => ({ harmony: prev.harmony + 10 })
      const nextState = handleUpdateBand(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 60)
    })

    it('should clamp harmony to 1-100', () => {
      let payload = { harmony: 150 }
      let nextState = handleUpdateBand(baseState, payload)
      assert.strictEqual(nextState.band.harmony, 100)

      payload = { harmony: -50 }
      nextState = handleUpdateBand(baseState, payload)
      assert.strictEqual(nextState.band.harmony, 1)
    })

    it('should safely ignore invalid payloads', () => {
      const invalidPayloads = [null, undefined, [], 'string', 123]

      invalidPayloads.forEach(payload => {
        const nextState = handleUpdateBand(baseState, payload)
        assert.strictEqual(
          nextState,
          baseState,
          `Payload ${JSON.stringify(payload)} should be ignored`
        )
      })
    })
  })

  describe('handleConsumeItem', () => {
    it('should decrement numeric items', () => {
      const nextState = handleConsumeItem(baseState, 'consumable_item')

      assert.strictEqual(nextState.band.inventory.consumable_item, 4)
      // verify immutability
      assert.strictEqual(baseState.band.inventory.consumable_item, 5)
    })

    it('should toggle boolean items to false', () => {
      const nextState = handleConsumeItem(baseState, 'boolean_item')

      assert.strictEqual(nextState.band.inventory.boolean_item, false)
    })

    it('should safely ignore missing items', () => {
      const nextState = handleConsumeItem(baseState, 'non_existent_item')

      assert.strictEqual(nextState.band.inventory.non_existent_item, undefined)
    })
  })

  describe('handleUnlockTrait', () => {
    it('should correctly unlock a trait and add toast', () => {
      // With real applyTraitUnlocks, we need a valid character to unlock on.
      // We set Matze with a known valid trait id 'tech_wizard'.
      const payload = { memberId: 'm1', traitId: 'tech_wizard' }
      const nextState = handleUnlockTrait(baseState, payload)

      const matze = nextState.band.members.find(m => m.id === 'm1')
      assert.ok(matze.traits.tech_wizard)
      assert.strictEqual(matze.traits.tech_wizard.id, 'tech_wizard')
      assert.ok(nextState.toasts.length > 0)
    })

    it('should skip unlock if invalid member/trait', () => {
      const payload = { memberId: 'm2', traitId: 'tech_wizard' }
      const nextState = handleUnlockTrait(baseState, payload)

      assert.strictEqual(nextState.toasts.length, 0) // No trait unlocked toast
    })
  })
})
