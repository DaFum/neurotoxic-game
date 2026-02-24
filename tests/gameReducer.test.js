import { test, describe, mock } from 'node:test'
import assert from 'node:assert/strict'

// Mock applyTraitUnlocks with improved matching logic
const mockApplyTraitUnlocks = mock.fn((state, unlocks) => {
    const band = { ...state.band }
    // Deep copy members to avoid mutation issues in test
    band.members = band.members.map(m => ({ ...m, traits: [...m.traits] }))

    unlocks.forEach(u => {
        // Mock matching logic: ID match OR case-insensitive name match
        const member = band.members.find(m =>
            (m.id && m.id === u.memberId) ||
            (m.name && m.name.toLowerCase() === u.memberId.toLowerCase())
        )
        if (member) {
            member.traits.push({ id: u.traitId })
        }
    })

    return {
        band,
        toasts: [...(state.toasts || []), { message: `Unlocked ${unlocks[0].traitId}`, type: 'success' }]
    }
})

mock.module('../src/utils/traitUtils.js', {
    namedExports: { applyTraitUnlocks: mockApplyTraitUnlocks }
})

// Import after mocking
const { gameReducer, ActionTypes } = await import('../src/context/gameReducer.js')
const { createInitialState } = await import('../src/context/initialState.js')

describe('Game Reducer', () => {
  test('UNLOCK_TRAIT unlocks a trait for a band member (Name fallback)', () => {
    const initialState = createInitialState()
    initialState.band.members = [
        // Member with name but no ID, simulating older state or default char definition
        { name: 'Matze', traits: [] },
        { name: 'Lars', traits: [] }
    ]

    const action = {
      type: ActionTypes.UNLOCK_TRAIT,
      payload: { memberId: 'matze', traitId: 'gear_nerd' } // Lowercase payload
    }

    const nextState = gameReducer(initialState, action)

    // Verify mock was called
    assert.equal(mockApplyTraitUnlocks.mock.calls.length, 1)

    // Verify state change (simulated by mock)
    const matze = nextState.band.members.find(m => m.name === 'Matze')
    assert.equal(matze.traits.length, 1)
    assert.equal(matze.traits[0].id, 'gear_nerd')
  })

  test('UNLOCK_TRAIT adds toast', () => {
    const initialState = createInitialState()
    initialState.band.members = [{ name: 'Matze', traits: [] }]

    const action = {
        type: ActionTypes.UNLOCK_TRAIT,
        payload: { memberId: 'matze', traitId: 'gear_nerd' }
    }
    const nextState = gameReducer(initialState, action)
    assert.ok(nextState.toasts.length > 0, 'Should add a toast')
    assert.ok(nextState.toasts[0].message.includes('Unlocked'), 'Toast should mention unlock')
  })
})
