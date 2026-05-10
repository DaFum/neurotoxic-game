import { test } from 'vitest'
import assert from 'node:assert/strict'
import { EVENTS_DB } from '../../src/data/events/index'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer'
import { handleAdvanceQuest } from '../../src/context/reducers/questReducer'
import { handleSetLastGigStats } from '../../src/context/reducers/gigReducer'
import { QUEST_APOLOGY_TOUR } from '../../src/data/questsConstants'

test('Events DB has global unique IDs across all categories', () => {
  const allIds = new Set()
  const duplicates = []

  for (const [category, events] of Object.entries(EVENTS_DB)) {
    for (const event of events) {
      if (allIds.has(event.id)) {
        duplicates.push(event.id)
      } else {
        allIds.add(event.id)
      }

      assert.strictEqual(event.category, category, `Event ${event.id} should have correct category ${category}`)
    }
  }

  assert.strictEqual(duplicates.length, 0, `Found duplicate event IDs: ${duplicates.join(', ')}`)
})

test('Quests correctly trigger failure when deadlines exceed day advance', () => {
  const initialState = {
    player: { day: 10, fame: 0 },
    band: { members: [], harmony: 1 },
    finances: { debt: 0, bills: 0, autoPayBills: false },
    social: { controversyLevel: 0 },
    activeQuests: [
      {
        id: 'test_deadline_quest',
        label: 'Test Deadline Quest',
        deadline: 10,
        failurePenalty: {
          social: { controversyLevel: 10 }
        }
      },
      {
        id: 'test_safe_quest',
        label: 'Test Safe Quest',
        deadline: 12
      }
    ],
    toasts: []
  }

  // Advancing to day 11 should fail the first quest
  const nextState = handleAdvanceDay(initialState, {})

  assert.strictEqual(nextState.activeQuests.length, 1, 'Failed quest should be removed')
  assert.strictEqual(nextState.activeQuests[0].id, 'test_safe_quest', 'Safe quest should remain')
  assert.strictEqual(nextState.social.controversyLevel, 10, 'Penalty should be applied')
  assert.ok(nextState.toasts.some(t => t.id === 'test_deadline_quest-fail'), 'Failure toast should be added')
})

test('Quest completion paths through gig/quest reducers work correctly', () => {
  const initialState = {
    player: { money: 100 },
    activeQuests: [
      {
        id: 'test_completion_quest',
        label: 'Test Completion Quest',
        required: 5,
        progress: 4,
        moneyReward: 50
      }
    ],
    toasts: []
  }

  const nextState = handleAdvanceQuest(initialState, { questId: 'test_completion_quest', amount: 1 })

  assert.strictEqual(nextState.activeQuests.length, 0, 'Completed quest should be removed')
  assert.strictEqual(nextState.player.money, 150, 'Reward should be applied')
  assert.ok(nextState.toasts.some(t => t.id.includes('test_completion_quest-money')), 'Reward toast should be added')
})

test('Quest completion paths through gig reducer work correctly', () => {
  const initialState = {
    player: { money: 100, stats: { consecutiveBadShows: 0 } },
    band: { inventory: {} },
    social: { zealotryLevel: 0, controversyLevel: 0 },
    activeQuests: [
      {
        id: QUEST_APOLOGY_TOUR,
        label: 'Apology Tour',
        required: 1,
        progress: 0,
        moneyReward: 100
      }
    ],
    toasts: [],
    reputationByRegion: {},
    currentGig: { id: 'test_gig', score: 100, capacity: 200 }
  }

  const nextState = handleSetLastGigStats(initialState, { score: 100, isGoodShow: true, venueId: 'test_venue' })

  assert.strictEqual(nextState.activeQuests.length, 0, 'Completed quest should be removed')
  assert.strictEqual(nextState.player.money, 200, 'Reward should be applied')
  assert.ok(nextState.toasts.some(t => t.id.includes(`${QUEST_APOLOGY_TOUR}-money`)), 'Reward toast should be added')
})
