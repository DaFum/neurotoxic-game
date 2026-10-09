import assert from 'node:assert/strict'
import test from 'node:test'
import {
  HIGH_CONTROVERSY_THRESHOLD,
  SCANDAL_CONTROVERSY_THRESHOLD,
  isCultAudience,
  isHighControversy,
  isScandalControversy
} from '../../src/utils/socialThresholds'
import { BALANCE_CONFIG, parseBalanceConfig } from '../../src/config/balance'

test('social thresholds come from BALANCE_CONFIG and keep the legacy 40/20 values', () => {
  assert.equal(
    HIGH_CONTROVERSY_THRESHOLD,
    BALANCE_CONFIG.social.highControversyThreshold
  )
  assert.equal(BALANCE_CONFIG.social.highControversyThreshold, 40)
  assert.equal(BALANCE_CONFIG.social.cultLoyaltyThreshold, 20)
})

test('isHighControversy is inclusive at the gate and rejects non-finite values', () => {
  assert.equal(isHighControversy(39.9), false)
  assert.equal(isHighControversy(40), true)
  for (const bad of [Number.NaN, Infinity, undefined, null, '90', true]) {
    assert.equal(isHighControversy(bad), false, String(bad))
  }
})

test('scandal tier comes from BALANCE_CONFIG and keeps the legacy 50 value', () => {
  assert.equal(
    SCANDAL_CONTROVERSY_THRESHOLD,
    BALANCE_CONFIG.social.scandalThreshold
  )
  assert.equal(BALANCE_CONFIG.social.scandalThreshold, 50)
})

test('isScandalControversy is inclusive at the gate and rejects non-finite values', () => {
  assert.equal(isScandalControversy(49.9), false)
  assert.equal(isScandalControversy(50), true)
  assert.equal(isScandalControversy(80), true)
  for (const bad of [Number.NaN, Infinity, undefined, null, '90', true]) {
    assert.equal(isScandalControversy(bad), false, String(bad))
  }
})

test('isCultAudience needs both gates', () => {
  assert.equal(isCultAudience(40, 20), true)
  assert.equal(isCultAudience(39, 50), false)
  assert.equal(isCultAudience(80, 19), false)
  assert.equal(isCultAudience(80, Number.NaN), false)
  assert.equal(isCultAudience(undefined, 80), false)
})

test('parseBalanceConfig requires the social section and range-checks it', () => {
  const raw = JSON.parse(JSON.stringify(BALANCE_CONFIG))
  delete raw.social
  assert.throws(() => parseBalanceConfig(raw), /missing section "social"/)
  const outOfRange = JSON.parse(JSON.stringify(BALANCE_CONFIG))
  outOfRange.social.highControversyThreshold = 101
  assert.throws(
    () => parseBalanceConfig(outOfRange),
    /highControversyThreshold/
  )
  const scandalOutOfRange = JSON.parse(JSON.stringify(BALANCE_CONFIG))
  scandalOutOfRange.social.scandalThreshold = -1
  assert.throws(() => parseBalanceConfig(scandalOutOfRange), /scandalThreshold/)
})
