import { test, describe, mock } from 'node:test'
import assert from 'node:assert/strict'

// Mock applyTraitUnlocks
const mockApplyTraitUnlocks = mock.fn((state, unlocks) => {
    const band = { ...state.band }
    // Deep copy members to avoid mutation issues in test
    band.members = band.members.map(m => ({ ...m, traits: [...m.traits] }))

    unlocks.forEach(u => {
        const member = band.members.find(m => m.id === u.memberId)
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
  test('UNLOCK_TRAIT unlocks a trait for a band member', () => {
    const initialState = createInitialState()
    initialState.band.members = [
        { id: 'matze', name: 'Matze', traits: [] },
        { id: 'lars', name: 'Lars', traits: [] }
    ]

    const action = {
      type: ActionTypes.UNLOCK_TRAIT,
      payload: { memberId: 'matze', traitId: 'gear_nerd' }
    }

    const nextState = gameReducer(initialState, action)

    // Verify mock was called
    assert.equal(mockApplyTraitUnlocks.mock.calls.length, 1)

    // Verify state change (simulated by mock)
    const matze = nextState.band.members.find(m => m.id === 'matze')
    assert.equal(matze.traits.length, 1)
    assert.equal(matze.traits[0].id, 'gear_nerd')
  })

  test('UNLOCK_TRAIT adds toast', () => {
    const initialState = createInitialState()
    // Setup state so mock can find member
    initialState.band.members = [{ id: 'matze', traits: [] }]

    const action = {
        type: ActionTypes.UNLOCK_TRAIT,
        payload: { memberId: 'matze', traitId: 'gear_nerd' }
    }
    const nextState = gameReducer(initialState, action)
    assert.ok(nextState.toasts.length > 0, 'Should add a toast')
    assert.ok(nextState.toasts[0].message.includes('Unlocked'), 'Toast should mention unlock')
  })
})
