import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizeAssets,
  sanitizeCrowdfundCampaigns,
  sanitizeLiabilities,
  sanitizeRngSeed
} from '../../src/context/reducers/assetSanitizers.ts'

const validAsset = (overrides = {}) => ({
  id: 'asset_1',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 80,
  baseUpkeep: 20,
  baseDailyRevenue: 0,
  slots: [],
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0.005,
  ...overrides
})

describe('sanitizeAssets', () => {
  it('accepts a fully valid asset', () => {
    const out = sanitizeAssets([validAsset()])
    assert.equal(out.length, 1)
    assert.equal(out[0].id, 'asset_1')
  })

  it('drops items with unknown kind', () => {
    const out = sanitizeAssets([validAsset({ kind: 'not_a_real_kind' })])
    assert.equal(out.length, 0)
  })

  it('drops items with invalid chassisTier', () => {
    const out = sanitizeAssets([validAsset({ chassisTier: 99 })])
    assert.equal(out.length, 0)
  })

  it('drops items with unknown acquisitionMode', () => {
    const out = sanitizeAssets([validAsset({ acquisitionMode: 'magic' })])
    assert.equal(out.length, 0)
  })

  it('clamps condition to 0..100', () => {
    const out = sanitizeAssets([validAsset({ condition: 200 })])
    assert.equal(out[0].condition, 100)
    const out2 = sanitizeAssets([validAsset({ condition: -50 })])
    assert.equal(out2[0].condition, 0)
  })

  it('coerces non-finite numeric fields via finiteNumberOr with sensible fallbacks', () => {
    const out = sanitizeAssets([
      validAsset({
        baseUpkeep: Infinity,
        baseDailyRevenue: NaN,
        condition: NaN
      })
    ])
    // Numeric monetary fields fall back to 0 (Infinity is rejected as non-finite).
    assert.equal(out[0].baseUpkeep, 0)
    assert.equal(out[0].baseDailyRevenue, 0)
    // Condition falls back to 100 (full health) when missing/NaN — sensible
    // default for restoring a partially-corrupted save without making players
    // start broken.
    assert.equal(out[0].condition, 100)
  })

  it('strips hostile prototype keys', () => {
    const hostile = JSON.parse(
      '{"__proto__":{"polluted":true},"id":"a","kind":"tourbus_chassis","chassisFlavor":"legit","chassisTier":1,"condition":50,"baseUpkeep":10,"baseDailyRevenue":0,"slots":[],"acquiredOnDay":1,"acquisitionMode":"cash","baseRiskEventChance":0.005}'
    )
    const out = sanitizeAssets([hostile])
    assert.equal(out.length, 1)
    // Empty objects must NOT have an own "polluted" property. Reading
    // {}.polluted via the prototype chain would also return undefined
    // legitimately, masking pollution — Object.hasOwn is the convention.
    assert.equal(Object.hasOwn({}, 'polluted'), false)
  })

  it('drops duplicate ids', () => {
    const out = sanitizeAssets([
      validAsset({ id: 'dup' }),
      validAsset({ id: 'dup' })
    ])
    assert.equal(out.length, 1)
  })

  it('returns [] for non-array input', () => {
    assert.deepEqual(sanitizeAssets(null), [])
    assert.deepEqual(sanitizeAssets({}), [])
    assert.deepEqual(sanitizeAssets('nope'), [])
  })

  it('removes child-slots whose parent module is no longer installed', () => {
    const out = sanitizeAssets([
      validAsset({
        slots: [
          {
            id: 'slot1',
            slotType: 'tb_trailer_addon',
            position: { x: 0, y: 0 },
            installedModuleId: null,
            addedByModuleId: 'nonexistent_parent'
          }
        ]
      })
    ])
    // child slot was added by a now-uninstalled parent → removed
    assert.equal(out[0].slots.length, 0)
  })
})

describe('sanitizeLiabilities', () => {
  it('drops orphan liabilities pointing at non-existent assets', () => {
    const assets = [{ id: 'a1' }]
    const out = sanitizeLiabilities(
      [
        {
          id: 'l1',
          source: 'loan',
          assetId: 'a1',
          principalRemaining: 100,
          interestRate: 0.05,
          dailyPayment: 1,
          termDaysRemaining: 60,
          defaultCounter: 0
        },
        {
          id: 'l2',
          source: 'loan',
          assetId: 'orphan_asset',
          principalRemaining: 100,
          interestRate: 0.05,
          dailyPayment: 1,
          termDaysRemaining: 60,
          defaultCounter: 0
        }
      ],
      assets
    )
    assert.equal(out.length, 1)
    assert.equal(out[0].id, 'l1')
  })

  it('drops liabilities with unknown source', () => {
    const out = sanitizeLiabilities(
      [
        {
          id: 'l1',
          source: 'gangster_credit',
          assetId: 'a1',
          principalRemaining: 100,
          interestRate: 0.05,
          dailyPayment: 1,
          termDaysRemaining: 60,
          defaultCounter: 0
        }
      ],
      [{ id: 'a1' }]
    )
    assert.equal(out.length, 0)
  })

  it('strips hostile keys and dedupes by id', () => {
    const out = sanitizeLiabilities(
      [
        {
          id: 'dup',
          source: 'loan',
          assetId: 'a1',
          principalRemaining: 100,
          interestRate: 0.05,
          dailyPayment: 1,
          termDaysRemaining: 60,
          defaultCounter: 0
        },
        {
          id: 'dup',
          source: 'loan',
          assetId: 'a1',
          principalRemaining: 100,
          interestRate: 0.05,
          dailyPayment: 1,
          termDaysRemaining: 60,
          defaultCounter: 0
        }
      ],
      [{ id: 'a1' }]
    )
    assert.equal(out.length, 1)
  })
})

describe('sanitizeCrowdfundCampaigns', () => {
  it('accepts a valid campaign', () => {
    const out = sanitizeCrowdfundCampaigns([
      {
        id: 'c1',
        assetSpec: {
          kind: 'tourbus_chassis',
          flavor: 'legit',
          chassisTier: 1
        },
        targetAmount: 4000,
        fameStake: 50,
        daysRemaining: 14,
        plannedSuccessRoll: 0.4
      }
    ])
    assert.equal(out.length, 1)
    assert.equal(out[0].resolvedOutcome, undefined)
  })

  it('preserves resolvedOutcome if valid', () => {
    const out = sanitizeCrowdfundCampaigns([
      {
        id: 'c1',
        assetSpec: {
          kind: 'tourbus_chassis',
          flavor: 'legit',
          chassisTier: 1
        },
        targetAmount: 4000,
        fameStake: 50,
        daysRemaining: 0,
        plannedSuccessRoll: 0.4,
        resolvedOutcome: 'success'
      }
    ])
    assert.equal(out[0].resolvedOutcome, 'success')
  })

  it('drops invalid outcome value', () => {
    const out = sanitizeCrowdfundCampaigns([
      {
        id: 'c1',
        assetSpec: {
          kind: 'tourbus_chassis',
          flavor: 'legit',
          chassisTier: 1
        },
        targetAmount: 4000,
        fameStake: 50,
        daysRemaining: 0,
        plannedSuccessRoll: 0.4,
        resolvedOutcome: 'maybe'
      }
    ])
    assert.equal(out[0].resolvedOutcome, undefined)
  })

  it('drops campaigns with invalid assetSpec', () => {
    const out = sanitizeCrowdfundCampaigns([
      {
        id: 'c1',
        assetSpec: 'not an object',
        targetAmount: 4000,
        fameStake: 50,
        daysRemaining: 14,
        plannedSuccessRoll: 0.4
      }
    ])
    assert.equal(out.length, 0)
  })
})

describe('sanitizeRngSeed', () => {
  it('keeps a valid non-negative finite integer', () => {
    assert.equal(sanitizeRngSeed(12345), 12345)
  })

  it('floors a finite float', () => {
    assert.equal(sanitizeRngSeed(12.7), 12)
  })

  it('preserves signed legacy seeds by coercing them to UInt32', () => {
    assert.equal(sanitizeRngSeed(-1), 0xffffffff)
  })

  it('rejects NaN, Infinity and non-numbers', () => {
    assert.equal(typeof sanitizeRngSeed(NaN), 'number')
    assert.notEqual(sanitizeRngSeed(NaN), 0) // falls back to Date.now()
    assert.equal(typeof sanitizeRngSeed('seed'), 'number')
    assert.equal(typeof sanitizeRngSeed(null), 'number')
  })
})
