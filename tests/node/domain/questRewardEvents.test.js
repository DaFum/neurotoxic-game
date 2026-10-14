import test from 'node:test'
import assert from 'node:assert/strict'
import { QuestLifecycle } from '../../../src/domain/questLifecycle.ts'
import { QuestEvents } from '../../../src/utils/questProgress.ts'
import { calculateFameLevel } from '../../../src/utils/gameState/index.ts'
import { handleApplyEventDelta } from '../../../src/context/reducers/eventReducer.ts'

const incomeQuest = (id, event, overrides = {}) => ({
  id,
  required: 10000,
  progress: 0,
  progressRules: [{ event, amount: 'event.amount' }],
  ...overrides
})
const progress = (state, id) =>
  state.activeQuests.find(q => q.id === id)?.progress
const freeze = (value, seen = new WeakSet()) => {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value)
    for (const child of Object.values(value)) freeze(child, seen)
    Object.freeze(value)
  }
  return value
}

test('direct quest completion credits canonical income quests once with the canonical region', () => {
  const state = freeze({
    player: {
      money: 1000,
      fame: 10,
      day: 4,
      location: 'venues:berlin_club.name'
    },
    activeQuests: [
      {
        id: 'payout',
        rewards: [
          { type: 'money', amount: 500 },
          { type: 'fame', amount: 200 }
        ]
      },
      { id: 'quest_payday', progress: 0, required: 1000 },
      {
        id: 'quest_local_legend',
        progress: 0,
        required: 500,
        scopeKey: 'berlin'
      },
      incomeQuest('other-region', 'fame.gained', {
        repeatPolicy: 'perRegion',
        scopeKey: 'hamburg',
        progressRules: [
          {
            event: 'fame.gained',
            amount: 'event.amount',
            match: { scope: 'region' }
          }
        ]
      })
    ]
  })
  const next = QuestLifecycle.completeQuest(state, { questId: 'payout' })
  assert.equal(next.player.money, 1500)
  assert.equal(next.player.fame, 210)
  assert.equal(next.player.fameLevel, calculateFameLevel(210))
  assert.equal(progress(next, 'quest_payday'), 500)
  assert.equal(progress(next, 'quest_local_legend'), 200)
  assert.equal(progress(next, 'other-region'), 0)
  assert.equal(QuestLifecycle.completeQuest(next, { questId: 'payout' }), next)
  assert.equal(state.player.money, 1000)
  assert.equal(progress(state, 'quest_payday'), 0)
})

test('quest reward events use positive effective gains after integer clamps', () => {
  for (const [amount, expected] of [
    [1.8, 1],
    [0.8, 0],
    [0, 0],
    [-2, 0]
  ]) {
    const state = freeze({
      player: { money: 10, fame: 10 },
      activeQuests: [
        {
          id: 'payout',
          rewards: [
            { type: 'money', amount },
            { type: 'fame', amount }
          ]
        },
        incomeQuest('cash', 'economy.moneyEarned'),
        incomeQuest('fame', 'fame.gained')
      ]
    })
    const next = QuestLifecycle.completeQuest(state, { questId: 'payout' })
    assert.equal(progress(next, 'cash'), expected, `money reward ${amount}`)
    assert.equal(progress(next, 'fame'), expected, `fame reward ${amount}`)
  }
})

test('an income event settles all consumers before reward completions and preserves chained progress', () => {
  const state = freeze({
    player: {
      money: 1000,
      fame: 0,
      day: 2,
      location: 'venues:berlin_club.name'
    },
    activeStoryFlags: ['source-active'],
    activeQuests: [
      incomeQuest('source', 'economy.moneyEarned', {
        required: 100,
        repeatPolicy: 'cooldown',
        cooldownDays: 5,
        startFlags: ['source-active'],
        completionFlags: ['source-complete'],
        rewards: [
          { type: 'money', amount: 100 },
          { type: 'fame', amount: 25 }
        ]
      }),
      incomeQuest('second', 'economy.moneyEarned', {
        required: 150,
        rewards: [{ type: 'fame', amount: 75 }]
      }),
      incomeQuest('cash-observer', 'economy.moneyEarned'),
      incomeQuest('fame-chain', 'fame.gained', {
        required: 100,
        rewards: [{ type: 'money', amount: 50 }]
      }),
      incomeQuest('fame-observer', 'fame.gained')
    ]
  })
  const next = QuestEvents.emit(state, {
    type: 'economy.moneyEarned',
    amount: 100
  })
  assert.equal(next.player.money, 1150)
  assert.equal(next.player.fame, 100)
  assert.equal(progress(next, 'cash-observer'), 250)
  assert.equal(progress(next, 'fame-observer'), 100)
  assert.deepEqual(next.completedQuestIds.slice().sort(), [
    'fame-chain',
    'second',
    'source'
  ])
  assert.deepEqual(next.questCooldowns, [
    { questId: 'source', expiresOnDay: 7 }
  ])
  assert.deepEqual(next.activeStoryFlags, ['source-complete'])
  assert.equal(
    next.toasts.filter(toast => toast.id === 'source-money').length,
    1
  )
  assert.equal(state.activeQuests.length, 5)
  assert.equal(progress(state, 'second'), 0)
})

test('multiple consumers of one event each pay once without completing themselves again', () => {
  const state = freeze({
    player: { money: 0, fame: 0, day: 1 },
    activeQuests: [
      ...[10, 20, 30].map(amount =>
        incomeQuest(`payout-${amount}`, 'economy.moneyEarned', {
          required: 100,
          repeatPolicy: 'cooldown',
          cooldownDays: 5,
          followupQuestId: `payout-${amount}`,
          rewards: [{ type: 'money', amount }]
        })
      ),
      incomeQuest('observer', 'economy.moneyEarned')
    ]
  })
  const next = QuestEvents.emit(state, {
    type: 'economy.moneyEarned',
    amount: 100
  })
  assert.equal(next.player.money, 60)
  assert.equal(progress(next, 'observer'), 160)
  assert.equal(next.activeQuests.length, 1)
  assert.equal(next.completedQuestIds.length, 3)
  assert.equal(next.questCooldowns.length, 3)
  assert.equal(next.toasts.length, 3)
  assert.equal(progress(state, 'observer'), 0)
})

test('event money and fame gains exclude nested quest reward gains from their own emissions', () => {
  const state = freeze({
    player: {
      money: 1000,
      fame: 0,
      day: 1,
      location: 'venues:berlin_club.name'
    },
    band: { harmony: 50, members: [] },
    activeStoryFlags: [],
    toasts: [],
    activeQuests: [
      { id: 'quest_payday', progress: 900, required: 1000 },
      {
        id: 'quest_local_legend',
        progress: 0,
        required: 500,
        scopeKey: 'berlin'
      },
      incomeQuest('cash-observer', 'economy.moneyEarned')
    ]
  })
  const next = handleApplyEventDelta(state, {
    player: { money: 100, fame: 25 }
  })
  assert.equal(next.player.money, 1100)
  assert.equal(next.player.fame, 225)
  assert.equal(progress(next, 'quest_local_legend'), 225)
  assert.equal(progress(next, 'cash-observer'), 100)
  assert.deepEqual(next.completedQuestIds, ['quest_payday'])
  assert.equal(progress(state, 'quest_payday'), 900)
})
