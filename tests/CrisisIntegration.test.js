import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import { calculateDailyUpdates } from '../src/utils/simulationUtils.js'
import { createInitialState } from '../src/context/initialState.js'

describe('Crisis Management Integration', () => {
  describe('Gap A: Regional Reputation Penalty on Poor Performance', () => {
    it('should deduct 10 regional reputation if gig score is < 30', () => {
      const state = createInitialState()
      state.player.location = 'Berlin'
      state.reputationByRegion = { Berlin: 10 }

      const action = {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: { score: 25 }
      }

      const nextState = gameReducer(state, action)
      assert.strictEqual(nextState.reputationByRegion.Berlin, 0)
    })

    it('should NOT deduct regional reputation if gig score is >= 30', () => {
      const state = createInitialState()
      state.player.location = 'Munich'
      state.reputationByRegion = { Munich: 10 }

      const action = {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: { score: 50 }
      }

      const nextState = gameReducer(state, action)
      assert.strictEqual(nextState.reputationByRegion.Munich, 10)
    })
  })

  describe('Gap I & G: Controversy Passive Effects', () => {
    it('should drain more harmony/mood when controversy is >= 50', () => {
      const state = createInitialState()
      state.band.harmony = 80
      state.social.controversyLevel = 60

      // Setup a clean RNG for predictability
      const rng = () => 0.5

      const { band } = calculateDailyUpdates(state, rng)
      // Normal harmony drift from 80 is -2
      // Under stress, it should be -1 more => -3 total
      assert.strictEqual(band.harmony, 77)

      // Normal mood drift from 80 is -2
      // Under stress, it should be -1 more => -3 total (mood goes to 77)
      assert.strictEqual(band.members[0].mood, 77)
    })
  })
})
