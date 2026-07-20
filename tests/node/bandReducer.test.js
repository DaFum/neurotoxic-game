import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleUpdateBand,
  handleConsumeItem,
  handleUnlockTrait
} from '../../src/context/reducers/bandReducer'

describe('bandReducer', () => {
  /** @type {import('../../src/types').GameState} */
  let baseState

  beforeEach(() => {
    baseState = /** @type {import('../../src/types').GameState} */ ({
      band: {
        harmony: 50,
        inventory: {
          consumable_item: 5,
          boolean_item: true
        },
        members: [{ id: 'm1', name: 'Matze', traits: {} }]
      },
      toasts: []
    })
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

    it('should retain existing member numeric values for non-finite patches', () => {
      baseState.band.members = [
        {
          id: 'm1',
          name: 'Matze',
          traits: {},
          stamina: 80,
          staminaMax: 120,
          mood: 60
        }
      ]

      const nextState = handleUpdateBand(baseState, {
        members: [
          {
            id: 'm1',
            stamina: NaN,
            staminaMax: Infinity,
            mood: -Infinity
          }
        ]
      })

      assert.strictEqual(nextState.band.members[0].stamina, 80)
      assert.strictEqual(nextState.band.members[0].staminaMax, 120)
      assert.strictEqual(nextState.band.members[0].mood, 60)
    })

    it('should default new member numeric values for non-finite patches', () => {
      const nextState = handleUpdateBand(baseState, {
        members: [
          {
            id: 'm2',
            name: 'Lars',
            stamina: NaN,
            staminaMax: Infinity,
            mood: -Infinity
          }
        ]
      })

      const newMember = nextState.band.members.find(
        member => member.id === 'm2'
      )
      assert.ok(newMember)
      assert.strictEqual(newMember.stamina, 100)
      assert.strictEqual(newMember.staminaMax, 100)
      assert.strictEqual(newMember.mood, 50)
    })

    it('should strip self-relationships and non-finite values from member patches', () => {
      const nextState = handleUpdateBand(baseState, {
        members: [
          {
            id: 'm1',
            relationships: {
              m1: 50,
              Matze: 40,
              matze: 30,
              m2: 250,
              m3: NaN,
              m4: 10
            }
          }
        ]
      })

      const member = nextState.band.members[0]
      assert.strictEqual(Object.hasOwn(member.relationships, 'm1'), false)
      assert.strictEqual(Object.hasOwn(member.relationships, 'Matze'), false)
      assert.strictEqual(Object.hasOwn(member.relationships, 'matze'), false)
      assert.strictEqual(Object.hasOwn(member.relationships, 'm3'), false)
      assert.strictEqual(member.relationships.m2, 100)
      assert.strictEqual(member.relationships.m4, 10)
    })

    it('should strip mixed-case self-relationship keys', () => {
      const nextState = handleUpdateBand(baseState, {
        members: [
          {
            id: 'm1',
            relationships: { M1: 50, MATZE: 40, MaTzE: 30, m2: 10 }
          }
        ]
      })

      const member = nextState.band.members[0]
      assert.deepStrictEqual(member.relationships, { m2: 10 })
    })

    it('should keep existing relationships when the patch value is invalid', () => {
      baseState.band.members = [
        {
          id: 'm1',
          name: 'Matze',
          traits: {},
          relationships: { m2: 40 }
        }
      ]

      for (const invalid of [null, undefined, 'broken', 7, ['m2']]) {
        const nextState = handleUpdateBand(baseState, {
          members: [{ id: 'm1', relationships: invalid }]
        })
        assert.deepStrictEqual(
          nextState.band.members[0].relationships,
          { m2: 40 },
          `invalid payload ${String(invalid)} must not erase relationships`
        )
      }
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

    it('should return state unchanged (no quest event) for unowned items', () => {
      const nextState = handleConsumeItem(baseState, 'non_existent_item')

      // Unowned item must be a strict no-op so item-used quest progress
      // cannot be farmed by dispatching CONSUME_ITEM without ownership.
      assert.strictEqual(nextState, baseState)
    })

    it('should not consume or emit for a zero-count item', () => {
      const zeroState = {
        ...baseState,
        band: {
          ...baseState.band,
          inventory: { ...baseState.band.inventory, consumable_item: 0 }
        }
      }
      const nextState = handleConsumeItem(zeroState, 'consumable_item')

      assert.strictEqual(nextState, zeroState)
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
