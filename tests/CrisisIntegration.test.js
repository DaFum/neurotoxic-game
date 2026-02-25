import { describe, it, expect } from 'vitest'
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
      expect(nextState.reputationByRegion.Berlin).toBe(0)
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
      expect(nextState.reputationByRegion.Munich).toBe(10)
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
      expect(band.harmony).toBe(77)
      
      // Normal mood drift from 80 is -2
      // Under stress, it should be -1 more => -3 total (mood goes to 77)
      expect(band.members[0].mood).toBe(77)
    })

    it('should drop sponsor with 20% chance if controversy is >= 80', () => {
      const state = createInitialState()
      state.social.controversyLevel = 85
      state.social.sponsorActive = true
      
      // rng() < 0.2 triggers the drop
      const rngDrop = () => 0.1
      const resultDropped = calculateDailyUpdates(state, rngDrop)
      expect(resultDropped.social.sponsorActive).toBe(false)
      
      // rng() >= 0.2 keeps the sponsor
      const rngKeep = () => 0.5
      const resultKept = calculateDailyUpdates(state, rngKeep)
      expect(resultKept.social.sponsorActive).toBe(true)
    })
  })
})
