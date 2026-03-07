import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'

import {
  handleSetGig,
  handleStartGig,
  handleSetLastGigStats
} from '../src/context/reducers/gigReducer.js'
import { DEFAULT_GIG_MODIFIERS } from '../src/context/initialState.js'

describe('gigReducer', () => {
  let baseState

  beforeEach(() => {
    baseState = {
      player: {
        stats: { consecutiveBadShows: 0 },
        day: 1,
        location: 'venues:some_venue'
      },
      band: {
        harmony: 50,
        members: []
      },
      social: { loyalty: 0 },
      currentGig: null,
      currentScene: 'OVERWORLD',
      gigModifiers: {},
      reputationByRegion: { 'venues:some_venue': 0 },
      activeQuests: [],
      activeStoryFlags: [],
      toasts: [],
      quests: {
        quest_apology_tour: { id: 'quest_apology_tour', progress: 0 },
        quest_prove_yourself: { id: 'quest_prove_yourself', progress: 0 },
        quest_ego_management: { id: 'quest_ego_management', completed: false }
      }
    }
  })

  describe('handleSetGig', () => {
    it('should set current gig state', () => {
      const payload = { id: 'gig1', name: 'Test Gig' }
      const nextState = handleSetGig(baseState, payload)

      assert.deepStrictEqual(nextState.currentGig, payload)
    })
  })

  describe('handleStartGig', () => {
    it('should initialize gig state and transition to PREGIG', () => {
      const payload = { id: 'gig2', name: 'Starting Gig' }
      const nextState = handleStartGig(baseState, payload)

      assert.deepStrictEqual(nextState.currentGig, payload)
      assert.strictEqual(nextState.currentScene, 'PREGIG')
      assert.deepStrictEqual(nextState.gigModifiers, DEFAULT_GIG_MODIFIERS)
    })
  })

  describe('handleSetLastGigStats', () => {
    it('should skip trait unlocks and reputation for practice gig', () => {
      baseState.currentGig = { isPractice: true }
      const payload = { score: 95 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.deepStrictEqual(nextState.lastGigStats, payload)
      assert.strictEqual(nextState.reputationByRegion['venues:some_venue'], 0) // no rep change
    })

    it('should process bad show correctly', () => {
      baseState.currentGig = { venue: { id: 'v1' } }
      const payload = { score: 20 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.player.stats.consecutiveBadShows, 1)
      assert.strictEqual(nextState.reputationByRegion['venues:some_venue'], -10)
    })

    it('should process 3 bad shows into prove yourself quest', () => {
      baseState.currentGig = { venue: { id: 'v1' } }
      baseState.player.stats.consecutiveBadShows = 2
      const payload = { score: 20 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.player.stats.consecutiveBadShows, 3)
      assert.ok(
        nextState.activeQuests.some(q => q.id === 'quest_prove_yourself')
      )
      assert.ok(
        nextState.toasts.some(t => t.message === 'ui:toast.three_disasters')
      )
    })

    it('should handle venue blacklisting on terrible reputation', () => {
      baseState.currentGig = { venue: { id: 'v1' } }
      baseState.reputationByRegion['venues:some_venue'] = -25
      const payload = { score: 20 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.reputationByRegion['venues:some_venue'], -35)
      // blacklisting occurs <= -30
      assert.ok(nextState.venueBlacklist?.includes('v1'))
    })

    it('should process good show correctly and clear consecutive bad shows', () => {
      baseState.currentGig = { venue: { id: 'v1', capacity: 100 } }
      baseState.player.stats.consecutiveBadShows = 2
      const payload = { score: 70 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.player.stats.consecutiveBadShows, 0)
      assert.strictEqual(nextState.reputationByRegion['venues:some_venue'], 5)
    })

    it('should apply bonus reputation for very high score', () => {
      baseState.currentGig = { venue: { id: 'v1' } }
      const payload = { score: 95 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.reputationByRegion['venues:some_venue'], 10)
    })

    it('should advance apology tour quest on good score and small capacity', () => {
      baseState.currentGig = { venue: { capacity: 250 } }
      baseState.activeQuests = [
        { id: 'quest_apology_tour', progress: 0, required: 5 }
      ]
      const payload = { score: 70 }
      const nextState = handleSetLastGigStats(baseState, payload)

      const quest = nextState.activeQuests.find(
        q => q.id === 'quest_apology_tour'
      )
      assert.strictEqual(quest.progress, 1)
    })

    it('should auto-complete ego management quest on high harmony', () => {
      baseState.band.harmony = 60
      baseState.activeQuests = [
        { id: 'quest_ego_management', completed: false }
      ]
      const payload = { score: 50 }
      const nextState = handleSetLastGigStats(baseState, payload)

      // When the quest completes, it is removed from activeQuests.
      const quest = nextState.activeQuests.find(
        q => q.id === 'quest_ego_management'
      )
      assert.strictEqual(quest, undefined)
    })
  })
})
