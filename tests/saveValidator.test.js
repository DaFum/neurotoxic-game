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
      assert.throws(() => validateSaveData(null), {
        name: 'StateError',
        message: /Save data must be an object/
      })
    })

    it('throws if data is not an object', () => {
      assert.throws(() => validateSaveData('invalid'), {
        name: 'StateError',
        message: /Save data must be an object/
      })
    })

    it('throws if data is an array', () => {
      assert.throws(() => validateSaveData([]), {
        name: 'StateError',
        message: /Save data must be an object/
      })
    })

    it('throws if required top-level keys are missing', () => {
      const keys = ['player', 'band', 'social', 'gameMap']
      keys.forEach(key => {
        const data = getValidData()
        delete data[key]
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: new RegExp(`Missing required top-level key: ${key}`)
        })
      })
    })
  })

  describe('player validation', () => {
    it('throws if player is not an object', () => {
      const data = getValidData()
      data.player = 'not an object'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /player must be an object/
      })
    })

    it('throws if numeric fields are not numbers', () => {
      const numericFields = [
        'money',
        'day',
        'time',
        'score',
        'fame',
        'fameLevel'
      ]
      numericFields.forEach(field => {
        const data = getValidData()
        data.player[field] = 'not a number'
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: new RegExp(`player.${field} must be a number`)
        })
      })
    })

    it('throws if player.van is not an object', () => {
      const data = getValidData()
      data.player.van = 'not an object'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /player.van must be an object/
      })
    })
  })

  describe('band validation', () => {
    it('throws if band is not an object', () => {
      const data = getValidData()
      data.band = 'not an object'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /band must be an object/
      })
    })

    it('throws if band.members is not an array', () => {
      const data = getValidData()
      data.band.members = {}
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /band.members must be an array/
      })
    })

    it('throws if band member is not an object', () => {
      const data = getValidData()
      data.band.members = ['not an object']
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /band.members\[0\] must be an object/
      })
    })

    it('throws if band member name is not a string', () => {
      const data = getValidData()
      data.band.members = [{ name: 123 }]
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /band.members\[0\].name must be a string/
      })
    })

    it('throws if band.harmony is not a number', () => {
      const data = getValidData()
      data.band.harmony = 'not a number'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /band.harmony must be a number/
      })
    })

    it('throws if band.harmony is not finite', () => {
      const data = getValidData()
      data.band.harmony = Number.NaN
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /band.harmony must be a finite number/
      })
    })

    it('clamps band.harmony into gameplay range', () => {
      const data = getValidData()
      data.band.harmony = 500
      assert.strictEqual(validateSaveData(data), true)
      assert.strictEqual(data.band.harmony, 100)
    })

    it('clamps player.money to non-negative integer', () => {
      const data = getValidData()
      data.player.money = -42.9
      assert.strictEqual(validateSaveData(data), true)
      assert.strictEqual(data.player.money, 0)
    })

    it('throws if player.money is not finite', () => {
      const data = getValidData()
      data.player.money = Number.POSITIVE_INFINITY
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /player.money must be a finite number/
      })
    })

    it('allows missing band.harmony for legacy saves', () => {
      const data = getValidData()
      delete data.band.harmony
      assert.strictEqual(validateSaveData(data), true)
    })

    it('accepts a valid relationships object on a band member', () => {
      const data = getValidData()
      data.band.members = [
        { name: 'Matze', relationships: { alex: 75, sara: 0 } }
      ]
      assert.strictEqual(validateSaveData(data), true)
    })

    it('throws if member relationships is not a plain object', () => {
      const data = getValidData()
      data.band.members = [{ name: 'Matze', relationships: [50, 75] }]
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /band\.members\[0\]\.relationships must be an object/
      })
    })

    it('throws if a relationship score is out of range', () => {
      const data = getValidData()
      data.band.members = [{ name: 'Matze', relationships: { sara: 150 } }]
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message:
          /band\.members\[0\]\.relationships\.sara must be a finite number/
      })
    })

    it('throws if a relationship key is a reserved prototype-polluting name', () => {
      const data = getValidData()
      data.band.members = [
        { name: 'Matze', relationships: { constructor: 75 } }
      ]
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message:
          /band\.members\[0\]\.relationships\.constructor is a reserved key/
      })
    })

    it('throws if a relationship key is __proto__', () => {
      const data = getValidData()
      // JSON.parse creates an own property named '__proto__' without touching the prototype chain
      const rel = JSON.parse('{"__proto__": 75}')
      data.band.members = [{ name: 'Matze', relationships: rel }]
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message:
          /band\.members\[0\]\.relationships\.__proto__ is a reserved key/
      })
    })

    it('throws if a relationship key is prototype', () => {
      const data = getValidData()
      data.band.members = [{ name: 'Matze', relationships: { prototype: 75 } }]
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message:
          /band\.members\[0\]\.relationships\.prototype is a reserved key/
      })
    })
  })

  describe('social validation', () => {
    it('throws if social is not an object', () => {
      const data = getValidData()
      data.social = 'not an object'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /social must be an object/
      })
    })

    it('throws if social values are not numbers (except lastGigDay)', () => {
      const data = getValidData()
      data.social.fans = 'not a number'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /Social value "fans" must be a number/
      })
    })

    it('allows lastGigDay to be null', () => {
      const data = getValidData()
      data.social.lastGigDay = null
      assert.strictEqual(validateSaveData(data), true)
    })

    it('throws if lastGigDay is not a number or null', () => {
      const data = getValidData()
      data.social.lastGigDay = 'not a number'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /Social value "lastGigDay" must be a number/
      })
    })

    it('validates activeDeals correctly', () => {
      const data = getValidData()
      data.social.activeDeals = [{ id: 'deal1', remainingGigs: 3 }]
      assert.strictEqual(validateSaveData(data), true)
    })

    it('throws if activeDeals is not an array', () => {
      const data = getValidData()
      data.social.activeDeals = 'invalid'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /social.activeDeals must be an array/
      })
    })

    it('throws if activeDeals items are invalid', () => {
      const data = getValidData()
      data.social.activeDeals = [{ id: 123 }]
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /activeDeals\[0\].id must be a string/
      })

      data.social.activeDeals = [{ id: 'deal1' }] // Missing remainingGigs
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /activeDeals\[0\].remainingGigs must be a number/
      })
    })

    describe('influencers validation', () => {
      it('validates influencers correctly', () => {
        const data = getValidData()
        data.social.influencers = {
          inf1: { tier: 'Micro', trait: 'music_snob', score: 10 }
        }
        assert.strictEqual(validateSaveData(data), true)
      })

      it('throws if influencers is not an object', () => {
        const data = getValidData()
        data.social.influencers = 'not an object'
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: /social.influencers must be an object/
        })
      })

      it('throws if an influencer is not an object', () => {
        const data = getValidData()
        data.social.influencers = { inf1: 'not an object' }
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: /social.influencers.inf1 must be an object/
        })
      })

      it('throws if tier is missing or invalid', () => {
        const data = getValidData()
        data.social.influencers = { inf1: { trait: 'music_snob', score: 10 } }
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: /social.influencers.inf1.tier must be a string/
        })
      })

      it('throws if trait is missing or invalid', () => {
        const data = getValidData()
        data.social.influencers = { inf1: { tier: 'Micro', score: 10 } }
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: /social.influencers.inf1.trait must be a string/
        })
      })

      it('throws if score is missing or invalid', () => {
        const data = getValidData()
        data.social.influencers = {
          inf1: { tier: 'Micro', trait: 'music_snob' }
        }
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: /social.influencers.inf1.score must be a number/
        })
      })
    })
  })

  describe('gameMap validation', () => {
    it('throws if gameMap is not an object', () => {
      const data = getValidData()
      data.gameMap = 'not an object'
      assert.throws(() => validateSaveData(data), {
        name: 'StateError',
        message: /gameMap must be an object/
      })
    })
  })
})
