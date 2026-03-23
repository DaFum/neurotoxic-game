import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert'

// We will mock checkTraitUnlocks using `mock.module` which works natively in newer Node versions
mock.module('../src/utils/unlockCheck.js', {
  namedExports: {
    checkTraitUnlocks: mock.fn(() => [
      { memberId: 'm1', traitId: 'tech_wizard' }
    ])
  }
})

// Using a dynamic import so the mock applies before the module is loaded
const { handleSetActiveEvent, handleApplyEventDelta } =
  await import('../src/context/reducers/eventReducer.js')

describe('eventReducer', () => {
  let baseState

  beforeEach(() => {
    baseState = {
      activeEvent: null,
      band: {
        harmony: 50,
        members: [{ id: 'm1', name: 'Matze', traits: {} }] // Matze exists in characters.js
      },
      player: {
        money: 1000
      },
      toasts: [],
      inventory: {},
      activeStoryFlags: []
    }
  })

  describe('handleSetActiveEvent', () => {
    it('should set the active event', () => {
      const payload = { title: 'Test Event', type: 'story' }
      const nextState = handleSetActiveEvent(baseState, payload)

      assert.deepStrictEqual(nextState.activeEvent, payload)
    })

    it('should clear the active event if payload is null', () => {
      baseState.activeEvent = { title: 'Old Event' }
      const nextState = handleSetActiveEvent(baseState, null)

      assert.strictEqual(nextState.activeEvent, null)
    })
  })

  describe('handleApplyEventDelta', () => {
    it('should apply simple deltas through applyEventDelta', () => {
      const payload = {
        band: { harmony: 10 },
        player: { money: -100 }
      }
      const nextState = handleApplyEventDelta(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 60)
      assert.strictEqual(nextState.player.money, 900)
    })

    it('should apply traits correctly if the delta triggers checkTraitUnlocks', () => {
      const payload = {
        band: { harmony: -5 }
      }
      const nextState = handleApplyEventDelta(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 45)
      // checkTraitUnlocks is mocked to return a tech_wizard trait for member m1,
      // and the real trait application logic should add that trait to Matze and emit at least one toast.
      const matze = nextState.band.members.find(m => m.name === 'Matze')
      assert.ok(matze)
      assert.ok(Object.hasOwn(matze.traits, 'tech_wizard'))
      assert.ok(nextState.toasts.length > 0)
    })
  })
})
