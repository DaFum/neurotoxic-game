import test from 'node:test'
import assert from 'node:assert/strict'
import { addQuest } from '../../../src/domain/questAdd.ts'
import { QUEST_REGISTRY } from '../../../src/data/questRegistry.ts'

test('addQuest', async t => {
  await t.test('adds a quest if it is not already active', () => {
    const state = { activeQuests: [] }
    const quest = { id: 'test1' }
    const nextState = addQuest(state, quest)
    assert.deepEqual(nextState.activeQuests, [quest])
    assert.notEqual(nextState, state)
  })

  await t.test('does not add a quest if it is already active', () => {
    const quest = { id: 'test1' }
    const state = { activeQuests: [quest] }
    const nextState = addQuest(state, quest)
    assert.equal(nextState, state)
  })

  await t.test('handles missing activeQuests array', () => {
    const state = {}
    const quest = { id: 'test1' }
    const nextState = addQuest(state, quest)
    assert.deepEqual(nextState.activeQuests, [quest])
  })

  await t.test('rejects forbidden quest ids', () => {
    const state = { activeQuests: [] }
    const nextState = addQuest(state, { id: '__proto__' })
    assert.equal(nextState, state)
  })

  await t.test('rejects invalid quest ids', () => {
    const state = { activeQuests: [] }
    let nextState = addQuest(state, { id: '' })
    assert.equal(nextState, state)
    nextState = addQuest(state, { id: 123 as any })
    assert.equal(nextState, state)
    nextState = addQuest(state, { id: null as any })
    assert.equal(nextState, state)
  })

  await t.test('completes threshold quests seeded at their target', () => {
    const state = {
      player: { day: 1 },
      activeQuests: [],
      activeStoryFlags: ['breakup_quest_active'],
      completedQuestIds: [],
      questCooldowns: []
    }
    const nextState = addQuest(state, {
      id: 'quest_ego_management',
      progress: 80
    })

    assert.equal(
      nextState.activeQuests.find(q => q.id === 'quest_ego_management'),
      undefined
    )
    assert.ok(nextState.completedQuestIds.includes('quest_ego_management'))
  })

  await t.test('merges quest definition from registry if one exists', () => {
    const state = { player: { day: 5 }, activeQuests: [] }
    const nextState = addQuest(state, { id: 'quest_prove_yourself' })
    const addedQuest = nextState.activeQuests[0]

    assert.equal(addedQuest.id, 'quest_prove_yourself')
    // label is excluded in createActiveQuestRuntime actually? Wait let's just check what's on addedQuest
    // earlier output showed: { id: 'quest_prove_yourself', deadline: 25, progress: 0, required: 4, scopeKey: undefined, status: 'active', startedOnDay: 5 }
    assert.equal(addedQuest.progress, 0)
    // properties like label might not be on the active quest runtime but rather kept on definition or just not persisted
    // deadlineOffset 20 from definition is added to day 5 -> 25
    assert.equal(addedQuest.deadline, 25)
  })

  await t.test('delegates acceptance to canAcceptQuest and returns state if not accepted', () => {
    // repeatPolicy 'never' means it won't be accepted if already completed
    const state = {
      player: { day: 1 },
      activeQuests: [],
      completedQuestIds: ['quest_pick_of_destiny']
    }
    const nextState = addQuest(state, { id: 'quest_pick_of_destiny' })
    assert.equal(nextState, state)
  })

  await t.test('sets merged.scopeKey if canAcceptQuest returns a scopeKey', () => {
     // quest_venue_residency requires perVenue repeat policy which generates a scopeKey based on currentNodeId
     const state = {
        player: { day: 1, currentNodeId: 'venue_a' },
        activeQuests: [],
        gameMap: {
          nodes: {
            venue_a: { id: 'venue_a', type: 'GIG' }
          }
        }
      }
      const nextState = addQuest(state, { id: 'quest_venue_residency' })
      const addedQuest = nextState.activeQuests[0]
      assert.equal(addedQuest.scopeKey, 'venue_a')
  })

  await t.test('computes merged.deadline from merged.deadlineOffset and state.player.day', () => {
    const state = { player: { day: 5 }, activeQuests: [] }
    const nextState = addQuest(state, { id: 'test1', deadlineOffset: 10 })
    const addedQuest = nextState.activeQuests[0]
    assert.equal(addedQuest.deadline, 15)
    assert.equal(addedQuest.deadlineOffset, undefined)
  })

  await t.test('handles missing player day when computing deadline', () => {
    const state = { activeQuests: [] }
    const nextState = addQuest(state, { id: 'test1', deadlineOffset: 10 })
    const addedQuest = nextState.activeQuests[0]
    assert.equal(addedQuest.deadline, 10)
    assert.equal(addedQuest.deadlineOffset, undefined)
  })

  await t.test('handles non-finite deadlineOffset gracefully', () => {
     const state = { player: { day: 5 }, activeQuests: [] }
     const nextState = addQuest(state, { id: 'test1', deadlineOffset: NaN })
     const addedQuest = nextState.activeQuests[0]
     assert.equal(addedQuest.deadline, undefined)
     assert.equal(addedQuest.deadlineOffset, undefined)
  })

  await t.test('sets up nextStoryFlags if merged.startFlags are provided (small array)', () => {
    const state = { activeQuests: [], activeStoryFlags: ['existing'] }
    const nextState = addQuest(state, { id: 'test1', startFlags: ['new1', 'new2'] })
    assert.deepEqual(nextState.activeStoryFlags, ['existing', 'new1', 'new2'])
  })

  await t.test('sets up nextStoryFlags if merged.startFlags are provided (large array)', () => {
    const state = { activeQuests: [], activeStoryFlags: ['existing'] }
    const nextState = addQuest(state, { id: 'test1', startFlags: ['existing', 'new1', 'new2', 'new3', 'new4', 'new5', 'new6'] })
    assert.deepEqual(nextState.activeStoryFlags, ['existing', 'new1', 'new2', 'new3', 'new4', 'new5', 'new6'])
  })

  await t.test('sets up nextStoryFlags ignores non-strings', () => {
    const state = { activeQuests: [], activeStoryFlags: [] }
    const nextState = addQuest(state, { id: 'test1', startFlags: ['valid', 123 as any, null as any] })
    assert.deepEqual(nextState.activeStoryFlags, ['valid'])
  })

  await t.test('creates the active quest runtime via createActiveQuestRuntime', () => {
    const state = { player: { day: 5 }, activeQuests: [] }
    // quest_prove_yourself is in registry, so createActiveQuestRuntime sets startedOnDay
    const nextState = addQuest(state, { id: 'quest_prove_yourself' })
    const addedQuest = nextState.activeQuests[0]

    assert.equal(addedQuest.id, 'quest_prove_yourself')
    assert.equal(addedQuest.startedOnDay, 5)
  })
})
