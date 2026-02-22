import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validateSaveData } from '../src/utils/saveValidator.js'

describe('saveValidator', () => {
  const getValidData = () => ({
    player: {
      money: 100,
      day: 1,
      time: 12,
      score: 0,
      fame: 0,
      fameLevel: 1,
      van: {}
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

  it('returns true for valid save data', () => {
    const data = getValidData()
    assert.strictEqual(validateSaveData(data), true)
  })

  describe('root object validation', () => {
    it('throws if data is null', () => {
      assert.throws(() => validateSaveData(null), /Save data must be an object/)
    })

    it('throws if data is not an object', () => {
      assert.throws(() => validateSaveData('invalid'), /Save data must be an object/)
    })

    it('throws if data is an array', () => {
      assert.throws(() => validateSaveData([]), /Save data must be an object/)
    })

    it('throws if required top-level keys are missing', () => {
      const keys = ['player', 'band', 'social', 'gameMap']
      keys.forEach(key => {
        const data = getValidData()
        delete data[key]
        assert.throws(() => validateSaveData(data), new RegExp(`Missing required top-level key: ${key}`))
      })
    })
  })

  describe('player validation', () => {
    it('throws if player is not an object', () => {
      const data = getValidData()
      data.player = 'not an object'
      assert.throws(() => validateSaveData(data), /player must be an object/)
    })

    it('throws if numeric fields are not numbers', () => {
      const numericFields = ['money', 'day', 'time', 'score', 'fame', 'fameLevel']
      numericFields.forEach(field => {
        const data = getValidData()
        data.player[field] = 'not a number'
        assert.throws(() => validateSaveData(data), new RegExp(`player.${field} must be a number`))
      })
    })

    it('throws if player.van is not an object', () => {
      const data = getValidData()
      data.player.van = 'not an object'
      assert.throws(() => validateSaveData(data), /player.van must be an object/)
    })
  })

  describe('band validation', () => {
    it('throws if band is not an object', () => {
      const data = getValidData()
      data.band = 'not an object'
      assert.throws(() => validateSaveData(data), /band must be an object/)
    })

    it('throws if band.members is not an array', () => {
      const data = getValidData()
      data.band.members = {}
      assert.throws(() => validateSaveData(data), /band.members must be an array/)
    })

    it('throws if band member is not an object', () => {
      const data = getValidData()
      data.band.members = ['not an object']
      assert.throws(() => validateSaveData(data), /band.members\[0\] must be an object/)
    })

    it('throws if band member name is not a string', () => {
      const data = getValidData()
      data.band.members = [{ name: 123 }]
      assert.throws(() => validateSaveData(data), /band.members\[0\].name must be a string/)
    })

    it('throws if band.harmony is not a number', () => {
      const data = getValidData()
      data.band.harmony = 'not a number'
      assert.throws(() => validateSaveData(data), /band.harmony must be a number/)
    })
  })

  describe('social validation', () => {
    it('throws if social is not an object', () => {
      const data = getValidData()
      data.social = 'not an object'
      assert.throws(() => validateSaveData(data), /social must be an object/)
    })

    it('throws if social values are not numbers (except lastGigDay)', () => {
      const data = getValidData()
      data.social.fans = 'not a number'
      assert.throws(() => validateSaveData(data), /Social value "fans" must be a number/)
    })

    it('allows lastGigDay to be null', () => {
      const data = getValidData()
      data.social.lastGigDay = null
      assert.strictEqual(validateSaveData(data), true)
    })

    it('throws if lastGigDay is not a number or null', () => {
      const data = getValidData()
      data.social.lastGigDay = 'not a number'
      assert.throws(() => validateSaveData(data), /Social value "lastGigDay" must be a number/)
    })
  })

  describe('gameMap validation', () => {
    it('throws if gameMap is not an object', () => {
      const data = getValidData()
      data.gameMap = 'not an object'
      assert.throws(() => validateSaveData(data), /gameMap must be an object/)
    })
  })
})
