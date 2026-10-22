import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_MERCH_PRICES, MERCH_MAX_PRICES } from '../../src/data/merch.ts'
import { DEFAULT_BAND_STATE } from '../../src/context/initialState.ts'
import { sanitizeBandUpdates } from '../../src/context/updateSanitizers.ts'
import { handleUpdateBand } from '../../src/context/reducers/bandReducer.ts'
import { createUpdateBandAction } from '../../src/context/actionCreators.ts'
import { sanitizeBand } from '../../src/context/reducers/sanitizers/stateSanitizers.ts'

const hostilePrices = () => ({
  shirts: 1e9,
  patches: 3,
  hoodies: Number.POSITIVE_INFINITY,
  vinyl: -4,
  cds: Number.NaN,
  bogus: 5
})

const expectedPrices = () => ({ shirts: MERCH_MAX_PRICES.shirts, patches: 3 })

test('MERCH_MAX_PRICES covers every merch item above its default price', () => {
  assert.deepEqual(
    Object.keys(MERCH_MAX_PRICES).sort(),
    Object.keys(DEFAULT_MERCH_PRICES).sort()
  )
  for (const [key, max] of Object.entries(MERCH_MAX_PRICES)) {
    assert.ok(Number.isInteger(max), `${key} max is an integer`)
    assert.ok(max > DEFAULT_MERCH_PRICES[key], `${key} max above default`)
  }
})

test('sanitizeBandUpdates clamps over-max prices and drops invalid entries', () => {
  const result = sanitizeBandUpdates({ merchPrices: hostilePrices() })
  assert.deepEqual(result.merchPrices, expectedPrices())
})

test('band updates through the creator and reducer store clamped prices', () => {
  const state = { band: structuredClone(DEFAULT_BAND_STATE) }
  for (const payload of [
    { merchPrices: hostilePrices() },
    () => ({ merchPrices: hostilePrices() }),
    createUpdateBandAction({ merchPrices: hostilePrices() }).payload,
    createUpdateBandAction(() => ({ merchPrices: hostilePrices() })).payload
  ]) {
    const next = handleUpdateBand(state, payload)
    assert.deepEqual(next.band.merchPrices, expectedPrices())
  }
})

test('save hydration clamps over-max merch prices', () => {
  const band = sanitizeBand({
    ...structuredClone(DEFAULT_BAND_STATE),
    merchPrices: hostilePrices()
  })
  assert.deepEqual(band.merchPrices, expectedPrices())
})
