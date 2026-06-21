import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleSetGig,
  handleStartGig,
  handleSetLastGigStats
} from '../../src/context/reducers/gigReducer'
import { DEFAULT_GIG_MODIFIERS } from '../../src/context/initialState'
import {
  DEFAULT_MINIGAME_STATE,
  GAME_PHASES
} from '../../src/context/gameConstants'
import { QuestLifecycle } from '../../src/domain/questLifecycle.ts'

describe('gigReducer', () => {
  let baseState

  beforeEach(() => {
    baseState = {
      player: {
        stats: { consecutiveBadShows: 0 },
        day: 1,
        location: 'venues:some_venue.name'
      },
      band: {
        harmony: 50,
        members: []
      },
      social: { loyalty: 0 },
      currentGig: null,
      currentScene: GAME_PHASES.OVERWORLD,
      gigModifiers: {},
      reputationByRegion: { some: 0 },
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
    it('should initialize gig state and transition to PRE_GIG', () => {
      const payload = { id: 'gig2', name: 'Starting Gig' }
      const nextState = handleStartGig(baseState, payload)

      assert.deepStrictEqual(nextState.currentGig, payload)
      assert.strictEqual(nextState.currentScene, GAME_PHASES.PRE_GIG)
      assert.deepStrictEqual(nextState.gigModifiers, DEFAULT_GIG_MODIFIERS)
    })

    it('resets stale minigame state from a prior abandoned setup minigame', () => {
      baseState.minigame = { active: true, type: 'ROADIE', someField: 1 }
      const nextState = handleStartGig(baseState, { id: 'gig2', name: 'Gig' })

      assert.deepStrictEqual(nextState.minigame, DEFAULT_MINIGAME_STATE)
    })

    it('does not clear lastGigStats (needed by gig milestones on ADVANCE_DAY)', () => {
      baseState.lastGigStats = { score: 80 }
      const nextState = handleStartGig(baseState, { id: 'gig2', name: 'Gig' })

      assert.deepStrictEqual(nextState.lastGigStats, { score: 80 })
    })
  })

  describe('handleSetLastGigStats', () => {
    it('should skip trait unlocks and reputation for practice gig', () => {
      baseState.currentGig = { isPractice: true }
      const payload = { score: 95 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.deepStrictEqual(nextState.lastGigStats, payload)
      assert.strictEqual(nextState.reputationByRegion.some, 0) // no rep change
    })

    it('should process bad show correctly', () => {
      baseState.currentGig = { id: 'v1', name: 'Test Venue' }
      const payload = { score: 20 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.player.stats.consecutiveBadShows, 1)
      assert.strictEqual(nextState.reputationByRegion.some, -10)
    })

    it('should process 3 bad shows into prove yourself quest', () => {
      baseState.currentGig = { id: 'v1', name: 'Test Venue' }
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
      baseState.currentGig = { id: 'v1' }
      baseState.reputationByRegion.some = -25
      const payload = { score: 20 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.reputationByRegion.some, -35)
      // blacklisting occurs <= -30
      assert.ok(nextState.venueBlacklist?.includes('v1'))
    })

    it('should process good show correctly and clear consecutive bad shows', () => {
      baseState.currentGig = { id: 'v1', capacity: 100 }
      baseState.player.stats.consecutiveBadShows = 2
      const payload = { score: 70 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.player.stats.consecutiveBadShows, 0)
      assert.strictEqual(nextState.reputationByRegion.some, 5)
    })

    it('should apply bonus reputation for very high score', () => {
      baseState.currentGig = { id: 'v1' }
      const payload = { score: 95 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.strictEqual(nextState.reputationByRegion.some, 10)
    })

    it('should advance apology tour quest on good score and small capacity', () => {
      baseState.currentGig = { id: 'v1', capacity: 250 }
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

    it('should not advance quest_apology_tour when capacity is missing', () => {
      baseState.currentGig = { id: 'v1' }
      baseState.activeQuests = [
        { id: 'quest_apology_tour', progress: 0, required: 5 }
      ]
      const payload = { score: 70 }
      const nextState = handleSetLastGigStats(baseState, payload)

      const apologyQuest = nextState.activeQuests.find(
        q => q.id === 'quest_apology_tour'
      )
      assert.strictEqual(apologyQuest.progress, 0)
    })

    it('should not advance small-venue quests when capacity exceeds 300', () => {
      // small_venue_good_gig dispatch is gated on capacity <= 300 in gigReducer.
      // A 301-cap venue must still produce a good_gig but no small_venue_good_gig.
      baseState.currentGig = { id: 'v1', capacity: 301 }
      baseState.activeQuests = [
        { id: 'quest_apology_tour', progress: 0, required: 5 }
      ]
      const payload = { score: 70 }
      const nextState = handleSetLastGigStats(baseState, payload)

      const apologyQuest = nextState.activeQuests.find(
        q => q.id === 'quest_apology_tour'
      )
      assert.strictEqual(apologyQuest.progress, 0)
    })

    it('should queue consequences_comeback_album when apology tour complete and controversy recovered', () => {
      baseState.currentGig = { id: 'v1', capacity: 100 }
      baseState.activeStoryFlags = ['apology_tour_complete']
      baseState.social = { loyalty: 0, controversyLevel: 20 }
      const payload = { score: 50 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.ok(
        nextState.pendingEvents?.includes('consequences_comeback_album'),
        'comeback album event should be queued'
      )
    })

    it('should not queue consequences_comeback_album when controversy is still high', () => {
      baseState.currentGig = { id: 'v1', capacity: 100 }
      baseState.activeStoryFlags = ['apology_tour_complete']
      baseState.social = { loyalty: 0, controversyLevel: 45 }
      const payload = { score: 50 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.ok(
        !nextState.pendingEvents?.includes('consequences_comeback_album'),
        'comeback album event should not be queued when controversy >= 30'
      )
    })

    it('should not duplicate consequences_comeback_album across repeated qualifying gigs', () => {
      baseState.currentGig = { id: 'v1', capacity: 100 }
      baseState.activeStoryFlags = ['apology_tour_complete']
      baseState.social = { loyalty: 0, controversyLevel: 20 }

      const afterFirst = handleSetLastGigStats(baseState, { score: 50 })
      const afterSecond = handleSetLastGigStats(afterFirst, { score: 50 })

      const occurrences = (afterSecond.pendingEvents || []).filter(
        id => id === 'consequences_comeback_album'
      ).length
      assert.strictEqual(
        occurrences,
        1,
        'comeback album should be queued exactly once'
      )
    })

    it('should not queue consequences_comeback_album when comeback already triggered', () => {
      baseState.currentGig = { id: 'v1', capacity: 100 }
      baseState.activeStoryFlags = [
        'apology_tour_complete',
        'comeback_triggered'
      ]
      baseState.social = { loyalty: 0, controversyLevel: 10 }
      const payload = { score: 50 }
      const nextState = handleSetLastGigStats(baseState, payload)

      assert.ok(
        !nextState.pendingEvents?.includes('consequences_comeback_album'),
        'comeback album should not re-queue once comeback_triggered'
      )
    })

    it('should auto-complete ego management quest on high harmony', () => {
      baseState.band.harmony = 60
      // Seed the quest through the registry-aware addQuest path so the
      // threshold (required: harmony level) and deadline come from
      // QUEST_REGISTRY, not from a hardcoded fixture.
      baseState = QuestLifecycle.addQuest(baseState, {
        id: 'quest_ego_management'
      })
      const payload = { score: 50 }
      const nextState = handleSetLastGigStats(baseState, payload)

      // When the quest completes, it is removed from activeQuests.
      const quest = nextState.activeQuests.find(
        q => q.id === 'quest_ego_management'
      )
      assert.strictEqual(quest, undefined)
    })

    it('should grant base harmony for completing practice mode', () => {
      baseState.currentGig = { isPractice: true }
      baseState.band.harmony = 50
      const nextState = handleSetLastGigStats(baseState, { score: 80 })

      assert.strictEqual(nextState.band.harmony, 51)
    })

    it('should scale practice harmony gain by band practiceGain effect', () => {
      baseState.currentGig = { isPractice: true }
      baseState.band.harmony = 50
      baseState.band.practiceGain = 1 // +100% practice gains
      const nextState = handleSetLastGigStats(baseState, { score: 80 })

      assert.strictEqual(nextState.band.harmony, 52)
    })

    it('should add stress after a real gig and clamp at 100', () => {
      baseState.currentGig = { id: 'v1', capacity: 100 }
      const nextState = handleSetLastGigStats(baseState, { score: 70 })
      assert.strictEqual(nextState.band.stress, 5)

      baseState.band.stress = 98
      const capped = handleSetLastGigStats(baseState, { score: 70 })
      assert.strictEqual(capped.band.stress, 100)
    })

    it('should not add stress for practice mode', () => {
      baseState.currentGig = { isPractice: true }
      const nextState = handleSetLastGigStats(baseState, { score: 70 })
      assert.strictEqual(nextState.band.stress, undefined)
    })
  })
})
