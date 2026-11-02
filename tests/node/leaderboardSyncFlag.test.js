import { afterEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { isLeaderboardSyncEnabled } from '../../src/utils/leaderboardSyncFlag.ts'

const KEY = 'VITE_ENABLE_LEADERBOARD_SYNC'

describe('isLeaderboardSyncEnabled', () => {
  const original = process.env[KEY]

  afterEach(() => {
    if (original === undefined) delete process.env[KEY]
    else process.env[KEY] = original
  })

  test('is enabled when the flag is unset', () => {
    delete process.env[KEY]
    assert.equal(isLeaderboardSyncEnabled(), true)
  })

  test('is disabled only by a case-insensitive "false"', () => {
    for (const value of ['false', 'FALSE', 'False']) {
      process.env[KEY] = value
      assert.equal(isLeaderboardSyncEnabled(), false, value)
    }
    for (const value of ['true', '', '0', 'no', 'off']) {
      process.env[KEY] = value
      assert.equal(isLeaderboardSyncEnabled(), true, JSON.stringify(value))
    }
  })

  test('reads the flag at call time', () => {
    process.env[KEY] = 'false'
    assert.equal(isLeaderboardSyncEnabled(), false)
    delete process.env[KEY]
    assert.equal(isLeaderboardSyncEnabled(), true)
  })
})
