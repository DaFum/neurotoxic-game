import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateSaveData } from '../../src/utils/saveValidator'
import { createInitialState } from '../../src/context/initialState.ts'
import {
  createPersistedState,
  createRawLoadPayload
} from '../../src/context/usePersistence.ts'
import { handleLoadGame } from '../../src/context/reducers/systemReducer.ts'

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

  it('roundtrips a new save with normalized regional gig history', () => {
    const state = createInitialState()
    state.gameMap = {}
    state.social.regionalGigHistory = { berlin: [4, 2, 4] }
    const parsed = JSON.parse(JSON.stringify(createPersistedState(state)))
    assert.equal(validateSaveData(parsed), true)
    const loaded = handleLoadGame(state, createRawLoadPayload(parsed, []))
    assert.deepEqual(loaded.social.regionalGigHistory, { berlin: [2, 4] })
  })

  it('rejects malformed or unbounded regional gig history', () => {
    for (const history of [
      { berlin: '4' },
      { berlin: [0] },
      { berlin: [-1] },
      { berlin: [1.5] },
      { berlin: [Infinity] },
      Object.fromEntries(
        Array.from({ length: 101 }, (_, i) => [`region${i}`, [1]])
      ),
      { berlin: Array.from({ length: 257 }, (_, i) => i) },
      JSON.parse('{"__proto__":[1]}')
    ]) {
      const data = getValidData()
      data.social.regionalGigHistory = history
      assert.throws(
        () => validateSaveData(data),
        /regionalGigHistory|Prototype pollution detected: __proto__/
      )
    }
  })

  describe('root object validation', () => {
    ;[null, 'invalid', []].forEach(input => {
      it(`throws if data is ${JSON.stringify(input)}`, () => {
        assert.throws(() => validateSaveData(input), {
          name: 'StateError',
          message: /Save data must be an object/
        })
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
    it('normalizes player.day to a 1-based integer', () => {
      const data = getValidData()
      data.player.day = 3.75

      assert.equal(validateSaveData(data), true)
      assert.equal(data.player.day, 3)
    })

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
    ;[0, '', false].forEach(van => {
      it(`throws if player.van is ${JSON.stringify(van)}`, () => {
        const data = getValidData()
        data.player.van = van
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: /player.van must be an object/
        })
      })
    })

    it('clamps persisted van condition and breakdown chance', () => {
      const data = getValidData()
      data.player.van = { condition: 140, breakdownChance: -2 }

      assert.equal(validateSaveData(data), true)
      assert.equal(data.player.van.condition, 100)
      assert.equal(data.player.van.breakdownChance, 0)
    })
  })

  describe('band validation', () => {
    it('preserves stamina above 100 when staminaMax supports it', () => {
      const data = getValidData()
      data.band.members = [
        { name: 'Matze', stamina: 110, staminaMax: 110, mood: 80 }
      ]

      assert.equal(validateSaveData(data), true)
      assert.equal(data.band.members[0].stamina, 110)
    })

    it('persists the fallback for invalid member staminaMax values', () => {
      for (const staminaMax of [-20, Number.NaN, '120']) {
        const data = getValidData()
        data.band.members = [
          { name: 'Matze', stamina: 150, staminaMax, mood: 80 }
        ]

        assert.equal(validateSaveData(data), true)
        assert.equal(data.band.members[0].staminaMax, 100)
        assert.equal(data.band.members[0].stamina, 100)
      }
    })

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

    it('throws if band.members is a falsy non-array value', () => {
      for (const members of [false, 0, '']) {
        const data = getValidData()
        data.band.members = members
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: /band.members must be an array/
        })
      }
    })

    it('accepts a null band.members as a legacy missing roster', () => {
      const data = getValidData()
      data.band.members = null
      assert.strictEqual(validateSaveData(data), true)
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
    ;['constructor', '__proto__', 'prototype'].forEach(poisonKey => {
      it(`throws if a relationship key is ${poisonKey}`, () => {
        const data = getValidData()
        // JSON.parse creates an own property named '__proto__' without touching the prototype chain
        const rel = JSON.parse(`{"${poisonKey}": 75}`)
        data.band.members = [{ name: 'Matze', relationships: rel }]
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message: new RegExp(`Prototype pollution detected: ${poisonKey}`)
        })
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

    it('throws if activeDeals remainingGigs is fractional or non-positive', () => {
      for (const remainingGigs of [0.5, 0, -1]) {
        const data = getValidData()
        data.social.activeDeals = [{ id: 'deal1', remainingGigs }]
        assert.throws(() => validateSaveData(data), {
          name: 'StateError',
          message:
            /activeDeals\[0\].remainingGigs must be an integer greater than zero/
        })
      }
    })

    it('clamps negative social counters to zero', () => {
      const data = getValidData()
      data.social.instagram = -5000
      data.social.tiktok = -1
      data.social.youtube = -2
      data.social.newsletter = -3
      data.social.viral = -20
      data.social.reputationCooldown = -100

      assert.strictEqual(validateSaveData(data), true)
      assert.strictEqual(data.social.instagram, 0)
      assert.strictEqual(data.social.tiktok, 0)
      assert.strictEqual(data.social.youtube, 0)
      assert.strictEqual(data.social.newsletter, 0)
      assert.strictEqual(data.social.viral, 0)
      assert.strictEqual(data.social.reputationCooldown, 0)
    })

    it('clamps negative social counters during hydration', () => {
      const state = createInitialState()
      state.gameMap = {}
      const parsed = JSON.parse(JSON.stringify(createPersistedState(state)))
      parsed.social.instagram = -5000
      parsed.social.viral = -20
      parsed.social.reputationCooldown = -100

      const loaded = handleLoadGame(state, createRawLoadPayload(parsed, []))
      assert.equal(loaded.social.instagram, 0)
      assert.equal(loaded.social.viral, 0)
      assert.equal(loaded.social.reputationCooldown, 0)
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

      const influencerFieldCases = [
        {
          field: 'tier',
          base: { trait: 'music_snob', score: 10 },
          type: 'string'
        },
        { field: 'trait', base: { tier: 'Micro', score: 10 }, type: 'string' },
        {
          field: 'score',
          base: { tier: 'Micro', trait: 'music_snob' },
          type: 'number'
        }
      ]
      influencerFieldCases.forEach(({ field, base, type }) => {
        it(`throws if ${field} is missing or invalid`, () => {
          const data = getValidData()
          data.social.influencers = { inf1: base }
          assert.throws(() => validateSaveData(data), {
            name: 'StateError',
            message: new RegExp(
              `social.influencers.inf1.${field} must be a ${type}`
            )
          })
        })
      })
    })
  })

  describe('gameMap validation', () => {
    it('accepts the persisted nullable gameMap contract', () => {
      const data = getValidData()
      data.gameMap = null

      assert.equal(validateSaveData(data), true)
    })

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
