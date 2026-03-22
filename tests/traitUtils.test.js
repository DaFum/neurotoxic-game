import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { applyTraitUnlocks } from '../src/utils/traitUtils.js'

describe('Trait Utils', () => {
  test('applyTraitUnlocks finds member by ID', () => {
    const state = {
      band: {
        // Name 'Matze' allows it to resolve CHARACTERS.MATZE
        members: [{ id: 'matze_uuid', name: 'Matze', traits: {} }]
      },
      toasts: []
    }
    const unlocks = [{ memberId: 'matze_uuid', traitId: 'gear_nerd' }]

    const result = applyTraitUnlocks(state, unlocks)

    const member = result.band.members[0]
    assert.ok(member.traits['gear_nerd'])
    assert.equal(member.traits['gear_nerd'].id, 'gear_nerd')
    assert.equal(result.toasts.length, 1)
  })

  test('applyTraitUnlocks finds member by Name (case-insensitive)', () => {
    const state = {
      band: {
        members: [{ name: 'Matze', traits: {} }]
      },
      toasts: []
    }
    const unlocks = [{ memberId: 'matze', traitId: 'gear_nerd' }] // 'matze' vs 'Matze'

    const result = applyTraitUnlocks(state, unlocks)

    const member = result.band.members[0]
    assert.ok(member.traits['gear_nerd'])
    assert.equal(member.traits['gear_nerd'].id, 'gear_nerd')
  })

  test('applyTraitUnlocks ignores if already unlocked', () => {
    const state = {
      band: {
        members: [
          {
            id: 'matze',
            name: 'Matze',
            traits: { gear_nerd: { id: 'gear_nerd', name: 'Gear Nerd' } }
          }
        ]
      },
      toasts: []
    }
    const unlocks = [{ memberId: 'matze', traitId: 'gear_nerd' }]

    const result = applyTraitUnlocks(state, unlocks)

    const member = result.band.members[0]
    assert.ok(member.traits['gear_nerd'])
    assert.equal(Object.keys(member.traits).length, 1)
    assert.equal(result.toasts.length, 0)
  })
})
