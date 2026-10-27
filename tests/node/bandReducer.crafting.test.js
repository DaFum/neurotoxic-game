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
  it('reverts apply-on-add equipment effects when consumed as a crafting input', () => {
    // c_rusty_strings adds +5 luck. When it's consumed for recipe_blood_pick, that luck should be reverted.
    const state = makeState({
      c_bone_dust: { id: 'c_bone_dust', stacks: 2 },
      c_rusty_strings: { id: 'c_rusty_strings', stacks: 1 }
    })
    state.band.luck = 5 // Simulate the luck from having equipped c_rusty_strings

    const next = handleCraftItem(state, {
      recipeId: 'recipe_blood_pick',
      instanceId: 'crafted-blood-pick',
      toastId: 'craft_toast_blood_pick'
    })

    // The luck should be reduced by 5, down to 0
    assert.equal(next.band.luck, 0)
    // Both inputs consumed
    assert.ok(!Object.hasOwn(next.band.stash, 'c_rusty_strings'))
    assert.ok(!Object.hasOwn(next.band.stash, 'c_bone_dust'))
    // Output added
    assert.ok(Object.hasOwn(next.band.stash, 'c_blood_pick'))
  })

  it('counts a stored non-stackable input (stacks: null) as one owned unit', () => {
    // Non-stackable contraband is stored with `stacks: null`.
    const state = makeState({
      c_bone_dust: { id: 'c_bone_dust', stacks: 2 },
      c_rusty_strings: { id: 'c_rusty_strings', stacks: null }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_blood_pick',
      instanceId: 'crafted-blood-pick-null',
      toastId: 'craft_toast_blood_pick_null'
    })
    assert.ok(!Object.hasOwn(next.band.stash, 'c_rusty_strings'))
    assert.ok(Object.hasOwn(next.band.stash, 'c_blood_pick'))
  })

  it('consumes inputs and adds the crafted output', () => {
    // recipe_cursed_pick: 2x c_sticky_plectrum -> c_cursed_pick
    const state = makeState({
      c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 2 }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_cursed_pick',
      instanceId: 'crafted-pick',
      toastId: 'craft_toast'
    })

    assert.ok(!Object.hasOwn(next.band.stash, 'c_sticky_plectrum'))
    assert.ok(Object.hasOwn(next.band.stash, 'c_cursed_pick'))
    assert.equal(next.band.stash.c_cursed_pick.instanceId, 'crafted-pick')
    assert.ok(
      next.toasts.some(
        t => t.type === 'success' && t.messageKey === 'ui:toast.crafted'
      )
    )
  })

  it('correctly crafts cursed setlist and consumes occult materials', () => {
    // recipe_cursed_setlist: 3x c_grimoire_page + 1x c_void_ash -> c_cursed_setlist
    const state = makeState({
      c_grimoire_page: { id: 'c_grimoire_page', stacks: 3 },
      c_void_ash: { id: 'c_void_ash', stacks: 2 }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_cursed_setlist',
      instanceId: 'crafted-setlist',
      toastId: 'craft_toast_setlist'
    })

    // Grimoire page fully consumed
    assert.ok(!Object.hasOwn(next.band.stash, 'c_grimoire_page'))
    // Void ash consumed 1 unit, 1 remaining
    assert.ok(Object.hasOwn(next.band.stash, 'c_void_ash'))
    assert.equal(next.band.stash.c_void_ash.stacks, 1)

    // Output added
    assert.ok(Object.hasOwn(next.band.stash, 'c_cursed_setlist'))
    assert.equal(next.band.stash.c_cursed_setlist.instanceId, 'crafted-setlist')
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
      instanceId: 'crafted-pick',
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
      instanceId: 'crafted-pick',
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
      instanceId: 'crafted-synth',
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
      instanceId: 'crafted-missing',
      toastId: 'craft_toast'
    })
    assert.strictEqual(next, state)
  })

  it('returns state unchanged for a missing crafted instance id', () => {
    const state = makeState({
      c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 2 }
    })
    const next = handleCraftItem(state, {
      recipeId: 'recipe_cursed_pick',
      instanceId: '',
      toastId: 'craft_toast'
    })

    assert.strictEqual(next, state)
  })

  it('reverts the catalog value for an input that records no clamped delta', () => {
    // The add was clamped, so it moved the stat by 3, not the catalog 5.
    const state = makeState({
      c_bone_dust: { id: 'c_bone_dust', stacks: 2 },
      c_rusty_strings: { id: 'c_rusty_strings', stacks: 1, appliedValue: 3 }
    })
    state.band.luck = 5

    const next = handleCraftItem(state, {
      recipeId: 'recipe_blood_pick',
      instanceId: 'crafted-blood-pick-applied',
      toastId: 'craft_toast_blood_pick_applied'
    })

    // Only clamped harmony/stress records a delta; luck reverts its catalog +5.
    assert.equal(next.band.luck, 0)
  })

  it('ignores a forged appliedValue and reverts the catalog value', () => {
    const state = makeState({
      c_bone_dust: { id: 'c_bone_dust', stacks: 2 },
      c_rusty_strings: {
        id: 'c_rusty_strings',
        stacks: 1,
        appliedValue: -1000000
      }
    })
    state.band.luck = 5

    const next = handleCraftItem(state, {
      recipeId: 'recipe_blood_pick',
      instanceId: 'crafted-blood-pick-forged',
      toastId: 'craft_toast_blood_pick_forged'
    })

    assert.equal(next.band.luck, 0)
  })

  describe('during an active Tour (#3403)', () => {
    const withCargo = (stash, contraband) => {
      const state = makeState(stash)
      state.expedition = {
        status: 'active',
        runId: 'run_1',
        loadout: null,
        cargo: {
          spareParts: 0,
          supplies: 0,
          technicalGearItemIds: [],
          merch: [],
          contraband
        }
      }
      return state
    }
    const craftPick = state =>
      handleCraftItem(state, {
        recipeId: 'recipe_cursed_pick',
        instanceId: 'crafted-pick',
        toastId: 'craft_toast'
      })

    it('debits the stash and the packed manifest together', () => {
      const state = withCargo(
        { c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 3 } },
        [{ stashKey: 'c_sticky_plectrum', instanceId: null, stacks: 3 }]
      )
      const next = craftPick(state)

      assert.equal(next.band.stash.c_sticky_plectrum.stacks, 1)
      const cargo = next.expedition.cargo.contraband
      assert.equal(
        cargo.find(e => e.stashKey === 'c_sticky_plectrum').stacks,
        1
      )
      // The output travels with the run so it stays usable.
      assert.equal(cargo.find(e => e.stashKey === 'c_cursed_pick').stacks, 1)
    })

    it('drops a packed entry that is crafted away entirely', () => {
      const state = withCargo(
        { c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 2 } },
        [{ stashKey: 'c_sticky_plectrum', instanceId: null, stacks: 2 }]
      )
      const next = craftPick(state)

      assert.ok(
        !next.expedition.cargo.contraband.some(
          e => e.stashKey === 'c_sticky_plectrum'
        )
      )
      assert.ok(Object.hasOwn(next.band.stash, 'c_cursed_pick'))
    })

    it('refuses ingredients left at HQ and consumes nothing', () => {
      const state = withCargo(
        { c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 2 } },
        []
      )
      const next = craftPick(state)

      assert.equal(next.band.stash.c_sticky_plectrum.stacks, 2)
      assert.ok(!Object.hasOwn(next.band.stash, 'c_cursed_pick'))
      assert.deepEqual(next.expedition.cargo.contraband, [])
      assert.ok(
        next.toasts.some(t => t.messageKey === 'ui:toast.craftMissingInputs')
      )
    })

    it('refuses when only part of the required stacks is packed', () => {
      const state = withCargo(
        { c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 3 } },
        [{ stashKey: 'c_sticky_plectrum', instanceId: null, stacks: 1 }]
      )
      const next = craftPick(state)

      assert.equal(next.band.stash.c_sticky_plectrum.stacks, 3)
      assert.equal(next.expedition.cargo.contraband[0].stacks, 1)
    })

    it('keeps the original behavior outside an active run', () => {
      const state = makeState({
        c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 2 }
      })
      state.expedition = { status: 'prepared' }
      const next = craftPick(state)

      assert.ok(Object.hasOwn(next.band.stash, 'c_cursed_pick'))
      assert.equal(next.expedition.status, 'prepared')
    })

    it('stays a pure no-op on a repeated identical request', () => {
      const state = withCargo(
        { c_sticky_plectrum: { id: 'c_sticky_plectrum', stacks: 2 } },
        [{ stashKey: 'c_sticky_plectrum', instanceId: null, stacks: 2 }]
      )
      const once = craftPick(state)
      const twice = craftPick(once)

      // The second request has no packed inputs left, so nothing more is spent.
      assert.ok(
        twice.toasts.some(t => t.messageKey === 'ui:toast.craftMissingInputs')
      )
      assert.deepEqual(twice.expedition.cargo, once.expedition.cargo)
      assert.deepEqual(twice.band.stash, once.band.stash)
    })
  })
})
