import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { handleCraftItem } from '../../src/context/reducers/bandReducer'
import { DEFAULT_BAND_STATE } from '../../src/context/initialState'

const makeState = stash => ({
  band: { ...DEFAULT_BAND_STATE, stash },
  toasts: [],
  activeQuests: []
})

describe('bandReducer - handleCraftItem', () => {
  it('consumes inputs and adds the crafted output', () => {
    // recipe_cursed_pick: 2x c_sticky_plectrum -> c_cursed_pick
    const state = makeState({
      c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 2 }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_cursed_pick',
      toastId: 'craft_toast'
    })

    assert.ok(!Object.hasOwn(next.band.stash, 'c_sticky_plectrum'))
    assert.ok(Object.hasOwn(next.band.stash, 'c_cursed_pick'))
    assert.ok(
      next.toasts.some(
        t => t.type === 'success' && t.messageKey === 'ui:toast.crafted'
      )
    )
  })

  it('leaves leftover input stacks when more than required', () => {
    const state = makeState({
      c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 5 }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_cursed_pick',
      toastId: 'craft_toast'
    })
    assert.equal(next.band.stash.c_sticky_plectrum.stacks, 3)
  })

  it('refuses and warns when inputs are missing', () => {
    const state = makeState({
      c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 1 }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_cursed_pick',
      toastId: 'craft_toast'
    })
    // input untouched, no output
    assert.equal(next.band.stash.c_sticky_plectrum.stacks, 1)
    assert.ok(!Object.hasOwn(next.band.stash, 'c_cursed_pick'))
    assert.ok(
      next.toasts.some(
        t =>
          t.type === 'error' && t.messageKey === 'ui:toast.craftMissingInputs'
      )
    )
  })

  it('rolls back (keeps inputs) when the output cannot be added', () => {
    // recipe_amped_synth: 3x c_void_energy -> c_amped_synth (non-stackable).
    // Already owning the non-stackable output makes addContrabandHelper reject,
    // so inputs must remain untouched and a craftFailed toast is emitted.
    const state = makeState({
      c_void_energy: { id: 'c_void_energy', stacks: 3 },
      c_amped_synth: { id: 'c_amped_synth', stacks: null }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_amped_synth',
      toastId: 'craft_toast'
    })

    assert.equal(next.band.stash.c_void_energy.stacks, 3)
    assert.ok(
      next.toasts.some(
        t => t.type === 'error' && t.messageKey === 'ui:toast.craftFailed'
      )
    )
  })

  it('returns state unchanged for an unknown recipe', () => {
    const state = makeState({})
    const next = handleCraftItem(state, {
      recipeId: 'recipe_does_not_exist',
      toastId: 'craft_toast'
    })
    assert.strictEqual(next, state)
  })
})
