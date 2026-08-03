import test from 'node:test'
import assert from 'node:assert/strict'
import { addQuest } from '../../../src/domain/questAdd.js'

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
    // @ts-expect-error - testing invalid types intentionally
    nextState = addQuest(state, { id: 123 })
    assert.equal(nextState, state)
    // @ts-expect-error - testing invalid types intentionally
    nextState = addQuest(state, { id: null })
    assert.equal(nextState, state)
  })

  await t.test('rejects malformed structural quest fields', () => {
    const state = { activeQuests: [] }
    const malformedQuests = [
      { id: 'bad_kind', kind: 'unbounded' },
      { id: 'bad_repeat', repeatPolicy: 'whenever' },
      { id: 'bad_flags', completionFlags: {} },
      { id: 'bad_deadline', deadline: 'never' }
    ]

    for (const quest of malformedQuests) {
      assert.equal(addQuest(state, quest), state)
    }
  })

  await t.test(
    'registry policy cannot be overridden by an inline payload',
    () => {
      const state = {
        activeQuests: [],
        completedQuestIds: ['quest_pick_of_destiny']
      }

      const nextState = addQuest(state, {
        id: 'quest_pick_of_destiny',
        repeatPolicy: 'cooldown'
      })

      assert.equal(nextState, state)
    }
  )

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
    assert.equal(addedQuest.progress, 0)
    // deadlineOffset 20 from definition is added to day 5 -> 25
    assert.equal(addedQuest.deadline, 25)
  })

  await t.test(
    'delegates acceptance to canAcceptQuest and returns state if not accepted',
    () => {
      // repeatPolicy 'never' means it won't be accepted if already completed
      const state = {
        player: { day: 1 },
        activeQuests: [],
        completedQuestIds: ['quest_pick_of_destiny']
      }
      const nextState = addQuest(state, { id: 'quest_pick_of_destiny' })
      assert.equal(nextState, state)
    }
  )

  await t.test(
    'sets merged.scopeKey if canAcceptQuest returns a scopeKey',
    () => {
      // quest_venue_residency has the perVenue repeat policy, so its scopeKey
      // comes from the current gig node's canonical venue id — never the node
      // id, which venue quest events cannot match.
      const state = {
        player: { day: 1, currentNodeId: 'node_1_0' },
        activeQuests: [],
        gameMap: {
          nodes: {
            node_1_0: { id: 'node_1_0', type: 'GIG', venueId: 'venue_a' }
          }
        }
      }
      const nextState = addQuest(state, { id: 'quest_venue_residency' })
      const addedQuest = nextState.activeQuests[0]
      assert.equal(addedQuest.scopeKey, 'venue_a')
    }
  )

  await t.test(
    'computes merged.deadline from merged.deadlineOffset and state.player.day',
    () => {
      const state = { player: { day: 5 }, activeQuests: [] }
      const nextState = addQuest(state, { id: 'test1', deadlineOffset: 10 })
      const addedQuest = nextState.activeQuests[0]
      assert.equal(addedQuest.deadline, 15)
      assert.equal(addedQuest.deadlineOffset, undefined)
    }
  )

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
    assert.equal(nextState, state)
  })

  await t.test('rejects a quest whose deadline overflows to Infinity', () => {
    // Admitting it without a deadline would be just as bad as an infinite one:
    // checkDeadlines only expires finite deadlines, so the slot never frees.
    const state = { player: { day: Number.MAX_VALUE }, activeQuests: [] }
    const nextState = addQuest(state, {
      id: 'test1',
      deadlineOffset: Number.MAX_VALUE
    })
    assert.equal(nextState, state)
  })

  await t.test('rejects malformed progressRules entries', () => {
    const state = { activeQuests: [] }
    const malformedQuests = [
      { id: 'bad_rule_null', progressRules: [null] },
      { id: 'bad_rule_primitive', progressRules: ['gig.completed'] },
      { id: 'bad_rule_no_event', progressRules: [{ amount: 'fixed' }] }
    ]

    for (const quest of malformedQuests) {
      assert.equal(addQuest(state, quest), state)
    }
  })

  await t.test('accepts well-formed ad-hoc progressRules', () => {
    const state = { player: { day: 1 }, activeQuests: [] }
    const nextState = addQuest(state, {
      id: 'adhoc_rules',
      required: 2,
      progress: 0,
      progressRules: [{ event: 'gig.completed', amount: 'fixed' }]
    })
    assert.equal(nextState.activeQuests[0].id, 'adhoc_rules')
  })

  await t.test(
    'sets up nextStoryFlags if merged.startFlags are provided (small array)',
    () => {
      const state = { activeQuests: [], activeStoryFlags: ['existing'] }
      const nextState = addQuest(state, {
        id: 'test1',
        startFlags: ['new1', 'new2']
      })
      assert.deepEqual(nextState.activeStoryFlags, ['existing', 'new1', 'new2'])
    }
  )

  await t.test(
    'sets up nextStoryFlags if merged.startFlags are provided (large array)',
    () => {
      const state = { activeQuests: [], activeStoryFlags: ['existing'] }
      const nextState = addQuest(state, {
        id: 'test1',
        startFlags: ['existing', 'new1', 'new2', 'new3', 'new4', 'new5', 'new6']
      })
      assert.deepEqual(nextState.activeStoryFlags, [
        'existing',
        'new1',
        'new2',
        'new3',
        'new4',
        'new5',
        'new6'
      ])
    }
  )

  await t.test('sets up nextStoryFlags ignores non-strings', () => {
    const state = { activeQuests: [], activeStoryFlags: [] }
    const nextState = addQuest(state, {
      id: 'test1',
      // @ts-expect-error - testing invalid types intentionally
      startFlags: ['valid', 123, null]
    })
    assert.deepEqual(nextState.activeStoryFlags, ['valid'])
  })

  await t.test(
    'creates the active quest runtime via createActiveQuestRuntime',
    () => {
      const state = { player: { day: 5 }, activeQuests: [] }
      // quest_prove_yourself is in registry, so createActiveQuestRuntime sets startedOnDay
      const nextState = addQuest(state, { id: 'quest_prove_yourself' })
      const addedQuest = nextState.activeQuests[0]

      assert.equal(addedQuest.id, 'quest_prove_yourself')
      assert.equal(addedQuest.startedOnDay, 5)
    }
  )
})
