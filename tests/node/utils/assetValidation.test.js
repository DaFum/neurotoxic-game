import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { CHASSIS_CONFIG } from '../../../src/utils/assetConfig'
import {
  VALID_ASSET_KINDS,
  VALID_ASSET_FLAVORS
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
})
