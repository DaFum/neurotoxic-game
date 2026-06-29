import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { CHASSIS_CONFIG } from '../../../src/utils/assetConfig'
import {
  VALID_ASSET_KINDS,
  VALID_ASSET_FLAVORS,
  VALID_ASSET_TIERS,
  VALID_ASSET_ACQUISITION_MODES
} from '../../../src/utils/assetValidation'

describe('assetValidation', () => {
  it('VALID_ASSET_KINDS contains all chassis config keys', () => {
    const configKeys = Object.keys(CHASSIS_CONFIG)
    assert.equal(VALID_ASSET_KINDS.size, configKeys.length)
    for (const key of configKeys) {
      assert.ok(
        VALID_ASSET_KINDS.has(key),
        `VALID_ASSET_KINDS should contain ${key}`
      )
    }
  })

  it('VALID_ASSET_FLAVORS contains expected flavors', () => {
    const expected = ['legit', 'diy']
    assert.equal(VALID_ASSET_FLAVORS.size, expected.length)
    for (const flavor of expected) {
      assert.ok(
        VALID_ASSET_FLAVORS.has(flavor),
        `VALID_ASSET_FLAVORS should contain ${flavor}`
      )
    }
  })

  it('VALID_ASSET_TIERS contains expected tiers', () => {
    const expected = [1, 2, 3]
    assert.equal(VALID_ASSET_TIERS.size, expected.length)
    for (const tier of expected) {
      assert.ok(
        VALID_ASSET_TIERS.has(tier),
        `VALID_ASSET_TIERS should contain ${tier}`
      )
    }
  })

  it('VALID_ASSET_ACQUISITION_MODES contains expected modes', () => {
    const expected = ['cash', 'loan', 'crowdfund']
    assert.equal(VALID_ASSET_ACQUISITION_MODES.size, expected.length)
    for (const mode of expected) {
      assert.ok(
        VALID_ASSET_ACQUISITION_MODES.has(mode),
        `VALID_ASSET_ACQUISITION_MODES should contain ${mode}`
      )
    }
  })
})
