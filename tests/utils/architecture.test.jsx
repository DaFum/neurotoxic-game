import { test } from 'vitest'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { ALL_RAW_EVENTS } from '../../src/data/events/index'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer'
import { handleAdvanceQuest } from '../../src/context/reducers/questReducer'
import { handleSetLastGigStats } from '../../src/context/reducers/gigReducer'
import { QUEST_APOLOGY_TOUR } from '../../src/data/questsConstants'

const SRC_ROOT = path.resolve(process.cwd(), 'src')
const GAME_STATE_MODULE = path.join(SRC_ROOT, 'context', 'GameState.tsx')
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx'])

const findSourceFiles = async directory => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await findSourceFiles(absolutePath)))
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath)
    }
  }

  return files
}

const relativeSourcePath = absolutePath =>
  path.relative(process.cwd(), absolutePath).replaceAll(path.sep, '/')

const createMockGameState = () => ({
  player: {
    name: 'Test Player',
    money: 100,
    fame: 0,
    fameLevel: 1,
    skill: 1,
    energy: 100,
    day: 1,
    location: 'home',
    stats: { consecutiveBadShows: 0 }
  },
  band: {
    name: 'Test Band',
    harmony: 1,
    members: [],
    inventory: {}
  },
  social: {
    zealotryLevel: 0,
    controversyLevel: 0,
    connections: []
  },
  reputationByRegion: {},
  activeQuests: [],
  toasts: [],
  venueBlacklist: [],
  activeStoryFlags: [],
  pendingEvents: [],
  version: 1,
  currentScene: 'main_menu',
  rivalBand: null,
  gameMap: null,
  currentGig: null,
  setlist: [],
  lastGigStats: null,
  activeEvent: null,
  isScreenshotMode: false,
  eventCooldowns: [],
  settings: {
    volume: 1,
    difficulty: 'normal',
    dyslexiaFont: false,
    highContrast: false,
    reduceMotion: false
  }
})

test('Events DB has global unique IDs across all categories', () => {
  const allIds = new Set()
  const duplicates = []

  for (const event of ALL_RAW_EVENTS) {
    if (!event || typeof event.id !== 'string') continue
    if (allIds.has(event.id)) {
      duplicates.push(event.id)
    } else {
      allIds.add(event.id)
    }
  }

  assert.strictEqual(
    duplicates.length,
    0,
    `Found duplicate event IDs: ${duplicates.join(', ')}`
  )
})

test('Production source does not consume deprecated useGameState hook', async () => {
  const sourceFiles = await findSourceFiles(SRC_ROOT)
  const offenders = []

  for (const filePath of sourceFiles) {
    if (filePath === GAME_STATE_MODULE) continue

    const source = await fs.readFile(filePath, 'utf8')
    if (source.includes('useGameState')) {
      offenders.push(relativeSourcePath(filePath))
    }
  }

  assert.deepStrictEqual(
    offenders,
    [],
    `Deprecated useGameState references found:\n${offenders.join('\n')}`
  )
})

test('Quests correctly trigger failure when deadlines exceed day advance', () => {
  const initialState = createMockGameState()
  initialState.player.day = 10
  initialState.activeQuests = [
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
  ]

  // Advancing to day 11 should fail the first quest
  const nextState = handleAdvanceDay(initialState, {})

  assert.strictEqual(
    nextState.activeQuests.length,
    1,
    'Failed quest should be removed'
  )
  assert.strictEqual(
    nextState.activeQuests[0].id,
    'test_safe_quest',
    'Safe quest should remain'
  )
  assert.strictEqual(
    nextState.social.controversyLevel,
    10,
    'Penalty should be applied'
  )
  assert.ok(
    nextState.toasts.some(t => t.id === 'test_deadline_quest-fail'),
    'Failure toast should be added'
  )
})

test('Quest completion paths through quest reducer work correctly', () => {
  const initialState = createMockGameState()
  initialState.activeQuests = [
    {
      id: 'test_completion_quest',
      label: 'Test Completion Quest',
      required: 5,
      progress: 4,
      moneyReward: 50
    }
  ]

  const nextState = handleAdvanceQuest(initialState, {
    questId: 'test_completion_quest',
    amount: 1
  })

  assert.strictEqual(
    nextState.activeQuests.length,
    0,
    'Completed quest should be removed'
  )
  assert.strictEqual(nextState.player.money, 150, 'Reward should be applied')
  assert.ok(
    nextState.toasts.some(t => t.id.includes('test_completion_quest-money')),
    'Reward toast should be added'
  )
})

test('Quest completion paths through gig reducer work correctly', () => {
  const initialState = createMockGameState()
  initialState.activeQuests = [
    {
      id: QUEST_APOLOGY_TOUR,
      label: 'Apology Tour',
      required: 1,
      progress: 0,
      moneyReward: 100
    }
  ]
  initialState.currentGig = { id: 'test_gig', score: 100, capacity: 200 }

  const nextState = handleSetLastGigStats(initialState, {
    score: 100,
    isGoodShow: true,
    venueId: 'test_venue'
  })

  assert.strictEqual(
    nextState.activeQuests.length,
    0,
    'Completed quest should be removed'
  )
  assert.strictEqual(nextState.player.money, 200, 'Reward should be applied')
  assert.ok(
    nextState.toasts.some(t => t.id.includes(`${QUEST_APOLOGY_TOUR}-money`)),
    'Reward toast should be added'
  )
})
