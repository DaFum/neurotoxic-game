import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validateSaveData } from '../src/utils/saveValidator.js'

describe('saveValidator - Leaderboard Identity', () => {
  const getValidData = () => ({
    player: {
      money: 100,
      day: 1,
      time: 12,
      score: 0,
      fame: 0,
      fameLevel: 1,
      van: {},
      playerId: 'test-uuid-123',
      playerName: 'TestPlayer'
    },
    band: {
      members: [{ name: 'Matze' }],
      harmony: 50
    },
    social: {
      fans: 10,
      lastGigDay: null
    },
    gameMap: {}
  })

  it('accepts valid playerId and playerName', () => {
    const data = getValidData()
    assert.strictEqual(validateSaveData(data), true)
  })

  it('accepts null playerId (uninitialized)', () => {
    const data = getValidData()
    data.player.playerId = null
    assert.strictEqual(validateSaveData(data), true)
  })

  it('accepts missing playerId and playerName (legacy saves)', () => {
    const data = getValidData()
    delete data.player.playerId
    delete data.player.playerName
    assert.strictEqual(validateSaveData(data), true)
  })

  it('throws if playerId is not a string or null', () => {
    const data = getValidData()
    data.player.playerId = 12345
    assert.throws(
      () => validateSaveData(data),
      { name: 'StateError', message: /player.playerId must be a string or null/ }
    )
  })

  it('throws if playerName is not a string', () => {
    const data = getValidData()
    data.player.playerName = 12345
    assert.throws(
      () => validateSaveData(data),
      { name: 'StateError', message: /player.playerName must be a string/ }
    )
  })
})
