import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { createResetStateAction } from '../../src/context/actionCreators.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { defaultStorageAdapter } from '../../src/utils/storage.ts'
import { InMemoryAdapter } from '../../src/utils/storageAdapter.ts'

const UINT32_MAX = 0xffffffff

const isUint32 = value =>
  Number.isInteger(value) && value >= 0 && value <= UINT32_MAX

const buildState = () => ({
  ...createInitialState({ rngSeed: 11, runSeed: 22, savedSettings: {} }),
  unlocks: ['kept_unlock']
})

/**
 * Runs `fn` while counting storage reads on the default adapter and every
 * Web Crypto draw, so a test can assert the reduction touched neither.
 */
const withSideEffectSpies = fn => {
  const storageGet = mock.method(defaultStorageAdapter, 'get')
  const randomValues = mock.method(globalThis.crypto, 'getRandomValues')
  try {
    return fn({ storageGet, randomValues })
  } finally {
    storageGet.mock.restore()
    randomValues.mock.restore()
  }
}

describe('RESET_STATE determinism', () => {
  it('reduces the same state and action to deep-equal results', () => {
    const state = buildState()
    const action = createResetStateAction({ unlocks: ['kept_unlock'] })

    const first = gameReducer(state, action)
    const second = gameReducer(state, action)

    assert.deepEqual(first, second)
  })

  it('performs no storage read and no randomness during reduction', () => {
    const state = buildState()
    const action = createResetStateAction({ unlocks: ['kept_unlock'] })

    withSideEffectSpies(({ storageGet, randomValues }) => {
      gameReducer(state, action)
      assert.equal(storageGet.mock.callCount(), 0, 'no storage read')
      assert.equal(randomValues.mock.callCount(), 0, 'no crypto draw')
    })
  })

  it('builds the fresh run from the stamped payload seeds', () => {
    const state = buildState()
    const next = gameReducer(state, {
      type: ActionTypes.RESET_STATE,
      payload: { rngSeed: 123, runSeed: 456, savedSettings: {} }
    })

    assert.equal(next.rngSeed, 123)
    assert.equal(next.runSeed, 456)
    assert.equal(next.player.money, createInitialState().player.money)
  })

  it('falls back deterministically for hostile or missing seeds', () => {
    const state = buildState()
    const hostileSeeds = [
      undefined,
      null,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      -1,
      1.5,
      UINT32_MAX + 1,
      '5',
      true,
      [7]
    ]

    withSideEffectSpies(({ storageGet, randomValues }) => {
      for (const seed of hostileSeeds) {
        const action = {
          type: ActionTypes.RESET_STATE,
          payload: { rngSeed: seed, runSeed: seed }
        }
        const first = gameReducer(state, action)
        const second = gameReducer(state, action)
        assert.deepEqual(first, second, `seed ${String(seed)} is replayable`)
        assert.ok(isUint32(first.rngSeed), `rngSeed for ${String(seed)}`)
        assert.ok(isUint32(first.runSeed), `runSeed for ${String(seed)}`)
        // The fallback derives from the prior run, never reuses it verbatim.
        assert.notEqual(first.rngSeed, state.rngSeed)
        assert.notEqual(first.runSeed, state.runSeed)
      }
      assert.equal(storageGet.mock.callCount(), 0, 'no storage read')
      assert.equal(randomValues.mock.callCount(), 0, 'no crypto draw')
    })
  })

  it('layers stamped saved settings under the preserved settings', () => {
    const state = {
      ...buildState(),
      settings: { crtEnabled: false, tutorialSeen: false, logLevel: 2 }
    }

    const next = gameReducer(state, {
      type: ActionTypes.RESET_STATE,
      payload: {
        rngSeed: 1,
        runSeed: 2,
        savedSettings: { tutorialSeen: true, logLevel: 0 },
        settings: { crtEnabled: true }
      }
    })

    // Explicit override wins; stamped stored settings fill the rest.
    assert.deepEqual(next.settings, {
      crtEnabled: true,
      tutorialSeen: true,
      logLevel: 0,
      gamepadLaneBindings: [2, 0, 1]
    })
  })

  it('preserves and overrides gamepad bindings through the existing settings layers', () => {
    const state = buildState()
    state.settings.gamepadLaneBindings = [4, 5, 6]
    const reset = overrides =>
      gameReducer(state, {
        type: ActionTypes.RESET_STATE,
        payload: {
          rngSeed: 1,
          runSeed: 2,
          savedSettings: { gamepadLaneBindings: [10, 11, 12] },
          ...overrides
        }
      }).settings.gamepadLaneBindings
    assert.deepEqual(reset({}), [4, 5, 6])
    assert.deepEqual(reset({ settings: {} }), [10, 11, 12])
    assert.deepEqual(
      reset({ settings: { gamepadLaneBindings: [13, 14, 15] } }),
      [13, 14, 15]
    )
  })
})

describe('createResetStateAction', () => {
  it('stamps fresh UInt32 seeds and the injected adapter settings', () => {
    const storage = new InMemoryAdapter()
    storage.set(
      'neurotoxic_global_settings',
      JSON.stringify({ tutorialSeen: true, bogus: 'x' })
    )

    const action = createResetStateAction({ unlocks: ['a'] }, storage)

    assert.equal(action.type, ActionTypes.RESET_STATE)
    assert.ok(isUint32(action.payload.rngSeed))
    assert.ok(isUint32(action.payload.runSeed))
    assert.deepEqual(action.payload.unlocks, ['a'])
    assert.deepEqual(action.payload.savedSettings, { tutorialSeen: true })
  })
})
