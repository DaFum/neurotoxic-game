import test from 'node:test'
import assert from 'node:assert/strict'
import { QuestProgress, QuestEvents } from '../../src/utils/questProgress.ts'
import { handleSetLastGigStats } from '../../src/context/reducers/gigReducer.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'
import { createGoodGigQuestEvent } from '../../src/quests/producers/gigQuestEvents.ts'

test('questProgress: applies events without mutating progress rules', async t => {
  await t.test('does not dynamically mutate or replace rule objects', () => {
    const originalRule = Object.freeze({
      event: 'gig.good',
      amount: 'fixed',
      fixedAmount: 1
    })
    const quest = {
      id: 'custom_venue_quest',
      progress: 0,
      required: 3,
      repeatPolicy: 'perVenue',
      scopeKey: 'venue_123',
      progressRules: [originalRule]
    }
    const state = {
      activeQuests: [quest]
    }

    const event = createGoodGigQuestEvent({
      score: 5000,
      accuracy: 85,
      capacity: 200,
      venueId: 'venue_123',
      region: 'berlin',
      failed: false
    })

    const nextState = QuestProgress.applyEvent(state, event)

    assert.equal(nextState.activeQuests[0].progress, 1)
    // Rule reference is unmodified and was not wrapped or replaced with scope
    assert.strictEqual(quest.progressRules[0], originalRule)
    assert.strictEqual(originalRule.match, undefined)
  })

  await t.test(
    'matches scope for perRegion quests without dynamic rule patching',
    () => {
      const originalRule = Object.freeze({
        event: 'gig.good',
        amount: 'fixed',
        fixedAmount: 1
      })
      const quest = {
        id: 'custom_region_quest',
        progress: 0,
        required: 3,
        repeatPolicy: 'perRegion',
        scopeKey: 'berlin',
        progressRules: [originalRule]
      }
      const state = {
        activeQuests: [quest]
      }

      const matchingEvent = createGoodGigQuestEvent({
        score: 5000,
        accuracy: 85,
        capacity: 200,
        venueId: 'venue_other',
        region: 'berlin',
        failed: false
      })

      const nonMatchingEvent = createGoodGigQuestEvent({
        score: 5000,
        accuracy: 85,
        capacity: 200,
        venueId: 'venue_other',
        region: 'munich',
        failed: false
      })

      const stateAfterNonMatch = QuestProgress.applyEvent(
        state,
        nonMatchingEvent
      )
      assert.equal(stateAfterNonMatch.activeQuests[0].progress, 0)

      const stateAfterMatch = QuestProgress.applyEvent(state, matchingEvent)
      assert.equal(stateAfterMatch.activeQuests[0].progress, 1)
    }
  )

  await t.test(
    'normalizes event context including accuracy, capacity, and failed',
    () => {
      const quest = {
        id: 'test_context_quest',
        progress: 0,
        required: 2,
        progressRules: [
          {
            event: 'gig.completed',
            amount: 'fixed',
            fixedAmount: 1
          }
        ]
      }
      const state = { activeQuests: [quest] }

      const event = {
        type: 'gig.completed',
        score: 12000,
        accuracy: 92,
        capacity: 150,
        failed: false,
        venueId: 'v_sub',
        region: 'hamburg'
      }

      const nextState = QuestProgress.applyEvent(state, event)
      assert.equal(nextState.activeQuests[0].progress, 1)
    }
  )

  await t.test(
    'gig completion quest events in gigReducer carry full canonical payload',
    () => {
      const emitted = []
      const originalEmit = QuestEvents.emit
      QuestEvents.emit = (state, event) => {
        emitted.push(event)
        return originalEmit(state, event)
      }

      try {
        const baseState = {
          player: {
            stats: { consecutiveBadShows: 0 },
            day: 1,
            location: 'venues:berlin_club.name'
          },
          band: { harmony: 50, members: [] },
          social: { loyalty: 0 },
          currentGig: { id: 'berlin_club', capacity: 180 },
          currentScene: GAME_PHASES.POST_GIG,
          gigModifiers: {},
          reputationByRegion: { berlin: 10 },
          activeQuests: [],
          activeStoryFlags: [],
          toasts: [],
          quests: {}
        }

        handleSetLastGigStats(baseState, {
          score: 15000,
          accuracy: 92,
          failed: false
        })
      } finally {
        QuestEvents.emit = originalEmit
      }

      const gigCompleted = emitted.find(e => e.type === 'gig.completed')
      assert.ok(gigCompleted, 'gig.completed was emitted')
      assert.equal(gigCompleted.context.score, 15000)
      assert.equal(gigCompleted.context.accuracy, 92)
      assert.equal(gigCompleted.context.failed, false)
      assert.equal(gigCompleted.context.capacity, 180)
      assert.equal(gigCompleted.context.venueId, 'berlin_club')
      assert.equal(gigCompleted.context.region, 'berlin')
      assert.equal(gigCompleted.success, true)

      const venueGigCompleted = emitted.find(
        e => e.type === 'venue.gigCompleted'
      )
      assert.ok(venueGigCompleted, 'venue.gigCompleted was emitted')
      assert.equal(venueGigCompleted.context.capacity, 180)
      assert.equal(venueGigCompleted.context.accuracy, 92)
      assert.equal(venueGigCompleted.context.failed, false)

      const goodGig = emitted.find(e => e.type === 'gig.good')
      assert.ok(goodGig, 'gig.good was emitted')
      assert.equal(goodGig.context.accuracy, 92)
      assert.equal(goodGig.context.failed, false)
      assert.equal(goodGig.context.capacity, 180)

      const venueGoodGig = emitted.find(e => e.type === 'venue.goodGig')
      assert.ok(venueGoodGig, 'venue.goodGig was emitted')
      assert.equal(venueGoodGig.context.accuracy, 92)
      assert.equal(venueGoodGig.context.failed, false)
      assert.equal(venueGoodGig.context.capacity, 180)

      const smallVenue = emitted.find(e => e.type === 'gig.smallVenueGood')
      assert.ok(smallVenue, 'gig.smallVenueGood was emitted')
      assert.equal(smallVenue.context.accuracy, 92)
      assert.equal(smallVenue.context.failed, false)
      assert.equal(smallVenue.context.capacity, 180)
    }
  )

  await t.test(
    'gig completion with failure sets success to false and failed to true',
    () => {
      const emitted = []
      const originalEmit = QuestEvents.emit
      QuestEvents.emit = (state, event) => {
        emitted.push(event)
        return originalEmit(state, event)
      }

      try {
        const baseState = {
          player: {
            stats: { consecutiveBadShows: 0 },
            day: 1,
            location: 'venues:berlin_club.name'
          },
          band: { harmony: 50, members: [] },
          social: { loyalty: 0 },
          currentGig: { id: 'berlin_club', capacity: 180 },
          currentScene: GAME_PHASES.POST_GIG,
          gigModifiers: {},
          reputationByRegion: { berlin: 10 },
          activeQuests: [],
          activeStoryFlags: [],
          toasts: [],
          quests: {}
        }

        handleSetLastGigStats(baseState, {
          score: 3000,
          accuracy: 25,
          failed: true
        })
      } finally {
        QuestEvents.emit = originalEmit
      }

      const gigCompleted = emitted.find(e => e.type === 'gig.completed')
      assert.ok(gigCompleted)
      assert.equal(gigCompleted.context.failed, true)
      assert.equal(gigCompleted.success, false)

      // Good gig events are not emitted on failure
      assert.equal(
        emitted.some(e => e.type === 'gig.good'),
        false
      )
      assert.equal(
        emitted.some(e => e.type === 'gig.smallVenueGood'),
        false
      )
    }
  )
})
