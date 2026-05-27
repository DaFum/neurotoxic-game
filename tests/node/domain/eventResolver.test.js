import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEvent } from '../../../src/domain/eventResolver.ts'
import { createSetActiveEventAction } from '../../../src/context/actionCreators.ts'

const buildState = (overrides = {}) => ({
  player: {
    money: 200,
    time: 10,
    fame: 2,
    day: 3,
    eventsTriggeredToday: 0,
    van: { fuel: 50, condition: 80 }
  },
  band: {
    members: [{ id: 'alpha', stamina: 6, mood: 50 }],
    harmony: 60,
    inventory: {}
  },
  social: { instagram: 0, viral: 0 },
  activeEvent: { id: 'evt_test', titleKey: 'event:test' },
  pendingEvents: [],
  eventCooldowns: [],
  activeStoryFlags: [],
  ...overrides
})

// --- null choice ---
test('resolveEvent: null choice clears active event, no other actions', () => {
  const { actions, sideEffects, outcomeText, description, result } =
    resolveEvent(null, buildState())
  assert.equal(actions.length, 1)
  assert.deepEqual(actions[0], createSetActiveEventAction(null))
  assert.equal(sideEffects.length, 0)
  assert.equal(outcomeText, '')
  assert.equal(description, '')
  assert.equal(result, null)
})

// --- direct resource effect ---
test('resolveEvent: choice with resource effect emits applyDelta + cooldown + clearEvent actions', () => {
  const choice = {
    label: 'Pay fine',
    outcomeText: 'event:outcome_paid',
    effect: { type: 'resource', resource: 'money', value: -40 }
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  const types = actions.map(a => a.type)
  assert.ok(
    types.includes('APPLY_EVENT_DELTA'),
    'must include APPLY_EVENT_DELTA'
  )
  assert.ok(types.includes('ADD_COOLDOWN'), 'must include ADD_COOLDOWN')
  assert.ok(
    types.includes('SET_ACTIVE_EVENT'),
    'must include SET_ACTIVE_EVENT (clear)'
  )

  // APPLY_EVENT_DELTA carries the money delta
  const deltaAction = actions.find(a => a.type === 'APPLY_EVENT_DELTA')
  assert.equal(deltaAction.payload.player.money, -40)

  // cooldown uses active event id
  const cooldownAction = actions.find(a => a.type === 'ADD_COOLDOWN')
  assert.equal(cooldownAction.payload, 'evt_test')

  // outcome toast side effect
  const toastEffect = sideEffects.find(e => e.type === 'outcomeToast')
  assert.ok(toastEffect, 'must emit outcomeToast side effect')
  assert.equal(toastEffect.outcomeKey, 'event:outcome_paid')
})

// --- quest flag ---
test('resolveEvent: choice with addQuest flag emits ADD_QUEST actions', () => {
  const choice = {
    label: 'Accept quest',
    outcomeText: '',
    effect: {
      type: 'flag',
      flag: 'addQuest',
      value: [{ id: 'q1', deadlineOffset: 5 }]
    }
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)

  const questActions = actions.filter(a => a.type === 'ADD_QUEST')
  assert.equal(questActions.length, 1)
  // deadline = day(3) + offset(5) = 8
  assert.equal(questActions[0].payload.deadline, 8)
  assert.equal(questActions[0].payload.id, 'q1')
  // no deadlineOffset remaining
  assert.ok(!Object.hasOwn(questActions[0].payload, 'deadlineOffset'))
})

// --- unlock flag ---
test('resolveEvent: choice with unlock flag emits ADD_UNLOCK + persistUnlock + unlockToast', () => {
  const choice = {
    label: 'Unlock something',
    outcomeText: '',
    effect: { type: 'flag', flag: 'unlock', value: 'My Cool Unlock!' }
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  const unlockAction = actions.find(a => a.type === 'ADD_UNLOCK')
  assert.ok(unlockAction, 'must include ADD_UNLOCK action')
  // sanitized: lowercase, alphanumeric only
  assert.equal(unlockAction.payload, 'mycoolunlock')

  const persist = sideEffects.find(e => e.type === 'persistUnlock')
  assert.ok(persist)
  assert.equal(persist.id, 'mycoolunlock')

  const unlockToast = sideEffects.find(e => e.type === 'unlockToast')
  assert.ok(unlockToast)
  assert.equal(unlockToast.id, 'mycoolunlock')
})

// --- gameOver flag ---
test('resolveEvent: choice with gameOver flag emits changeScene + saveGame + gameOverToast, no cooldown', () => {
  const choice = {
    label: 'Die',
    outcomeText: '',
    description: 'event:death_desc',
    effect: { type: 'flag', flag: 'gameOver', value: true }
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  // no cooldown for game over
  assert.ok(
    !actions.find(a => a.type === 'ADD_COOLDOWN'),
    'no cooldown on game over'
  )

  const changeScene = sideEffects.find(e => e.type === 'changeScene')
  assert.ok(changeScene)
  assert.equal(changeScene.scene, 'GAMEOVER')

  const saveGame = sideEffects.find(e => e.type === 'saveGame')
  assert.ok(saveGame, 'must emit saveGame side effect')
  // saveGame carries a state snapshot (object)
  assert.equal(typeof saveGame.state, 'object')
  // validate the post-resolution snapshot activeEvent is cleared
  assert.equal(saveGame.state.activeEvent, null)

  const gameOverToast = sideEffects.find(e => e.type === 'gameOverToast')
  assert.ok(gameOverToast)
  assert.equal(gameOverToast.descriptionKey, 'event:death_desc')
})

// --- pendingEvent pop ---
test('resolveEvent: does NOT emit POP_PENDING_EVENT (triggerEvent handles it)', () => {
  const choice = {
    label: 'OK',
    outcomeText: '',
    effect: { type: 'resource', resource: 'money', value: 0 }
  }
  const state = buildState({ pendingEvents: ['evt_test'] })
  const { actions } = resolveEvent(choice, state)
  const popAction = actions.find(a => a.type === 'POP_PENDING_EVENT')
  assert.ok(
    !popAction,
    'resolveEvent must not pop pending events (triggerEvent does that)'
  )
})

// --- invalid unlock: non-string type ---
test('resolveEvent: non-string flags.unlock produces no ADD_UNLOCK or unlock side effects', () => {
  const choice = {
    label: 'Bad unlock',
    outcomeText: '',
    _precomputedResult: {
      delta: { flags: { unlock: 42 } },
      result: null
    }
  }
  const { actions, sideEffects } = resolveEvent(choice, buildState())

  assert.ok(
    !actions.find(a => a.type === 'ADD_UNLOCK'),
    'no ADD_UNLOCK for non-string unlock'
  )
  assert.ok(
    !sideEffects.find(e => e.type === 'persistUnlock'),
    'no persistUnlock'
  )
  assert.ok(!sideEffects.find(e => e.type === 'unlockToast'), 'no unlockToast')
  assert.ok(
    actions.find(a => a.type === 'ADD_COOLDOWN'),
    'cooldown still applied'
  )
  assert.ok(
    actions.find(a => a.type === 'SET_ACTIVE_EVENT'),
    'event still cleared'
  )
})

// --- invalid unlock: string sanitizes to empty ---
test('resolveEvent: unlock string that sanitizes to empty produces no ADD_UNLOCK or unlock side effects', () => {
  const choice = {
    label: 'Special chars only',
    outcomeText: '',
    _precomputedResult: {
      delta: { flags: { unlock: '!!!' } },
      result: null
    }
  }
  const { actions, sideEffects } = resolveEvent(choice, buildState())

  assert.ok(
    !actions.find(a => a.type === 'ADD_UNLOCK'),
    'no ADD_UNLOCK for empty sanitized id'
  )
  assert.ok(
    !sideEffects.find(e => e.type === 'persistUnlock'),
    'no persistUnlock'
  )
  assert.ok(!sideEffects.find(e => e.type === 'unlockToast'), 'no unlockToast')
  assert.ok(
    actions.find(a => a.type === 'ADD_COOLDOWN'),
    'cooldown still applied'
  )
  assert.ok(
    actions.find(a => a.type === 'SET_ACTIVE_EVENT'),
    'event still cleared'
  )
})

// --- empty-string preservation ---
test('resolveEvent: explicitly empty outcomeText/description strings are preserved', () => {
  const choice = {
    label: 'Silent choice',
    outcomeText: '',
    description: '',
    _precomputedResult: {
      outcomeText: 'should not see this',
      description: 'or this',
      delta: null
    }
  }
  const state = buildState()
  const { outcomeText, description, sideEffects } = resolveEvent(choice, state)
  assert.equal(outcomeText, '')
  assert.equal(description, '')
  const outcomeToast = sideEffects.find(e => e.type === 'outcomeToast')
  assert.ok(
    !outcomeToast,
    'should not emit outcomeToast when both strings are empty'
  )
})

// --- quest flag: string deadlineOffset ---
test('resolveEvent: choice with string deadlineOffset parses correctly', () => {
  const choice = {
    label: 'Accept quest string offset',
    outcomeText: '',
    effect: {
      type: 'flag',
      flag: 'addQuest',
      value: [{ id: 'q2', deadlineOffset: ' 7 ' }]
    }
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)
  const questActions = actions.filter(a => a.type === 'ADD_QUEST')
  assert.equal(questActions.length, 1)
  assert.equal(questActions[0].payload.deadline, 10) // day 3 + 7
})

// --- quest flag: invalid deadlineOffset ---
test('resolveEvent: choice with invalid deadlineOffset logs warning and ignores offset', () => {
  const choice = {
    label: 'Accept quest invalid offset',
    outcomeText: '',
    effect: {
      type: 'flag',
      flag: 'addQuest',
      value: [{ id: 'q3', deadlineOffset: 'abc' }, { id: 'q4', deadlineOffset: '' }]
    }
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)
  const questActions = actions.filter(a => a.type === 'ADD_QUEST')
  assert.equal(questActions.length, 2)
  assert.equal(questActions[0].payload.id, 'q3')
  assert.ok(!Object.hasOwn(questActions[0].payload, 'deadline')) // no deadline added
  assert.equal(questActions[1].payload.id, 'q4')
  assert.ok(!Object.hasOwn(questActions[1].payload, 'deadline'))
})

// --- quest flag: malformed quest ---
test('resolveEvent: choice with malformed quest skips quest', () => {
  const choice = {
    label: 'Accept malformed quest',
    outcomeText: '',
    effect: {
      type: 'flag',
      flag: 'addQuest',
      value: [{ deadlineOffset: 5 }, { id: 123 }]
    }
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)
  const questActions = actions.filter(a => a.type === 'ADD_QUEST')
  assert.equal(questActions.length, 0)
})

// --- activeEvent context ---
test('resolveEvent: includes activeEvent context in toasts', () => {
  const choice = {
    label: 'Test context',
    outcomeText: 'event:outcome_context',
    description: 'context desc',
    effect: { type: 'resource', resource: 'money', value: 0 }
  }
  const state = buildState({ activeEvent: { id: 'evt_context', titleKey: 'test', context: { foo: 'bar' } } })
  const { sideEffects } = resolveEvent(choice, state)

  const toastEffect = sideEffects.find(e => e.type === 'outcomeToast')
  assert.ok(toastEffect)
  assert.deepEqual(toastEffect.context, { foo: 'bar' })
})

// --- addStoryFlag remap ---
test('resolveEvent: remaps addStoryFlag for addQuest', () => {
  const choice = {
    label: 'Story Quest',
    outcomeText: '',
    effect: {
      type: 'flag',
      flag: 'addStoryFlag',
      value: 'addQuest'
    },
    _precomputedResult: {
      delta: { flags: { addStoryFlag: 'addQuest' } },
      result: { value: [{ id: 'storyQuest' }] }
    }
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)
  const questActions = actions.filter(a => a.type === 'ADD_QUEST')
  assert.equal(questActions.length, 1)
  assert.equal(questActions[0].payload.id, 'storyQuest')
})

test('resolveEvent: remaps addStoryFlag for unlock', () => {
  const choice = {
    label: 'Story Unlock',
    outcomeText: '',
    effect: {
      type: 'flag',
      flag: 'addStoryFlag',
      value: 'unlock'
    },
    _precomputedResult: {
      delta: { flags: { addStoryFlag: 'unlock' } },
      result: { value: 'storyUnlock' }
    }
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)
  const unlockAction = actions.find(a => a.type === 'ADD_UNLOCK')
  assert.ok(unlockAction)
  assert.equal(unlockAction.payload, 'storyunlock')
})

test('resolveEvent: remaps addStoryFlag for gameOver', () => {
  const choice = {
    label: 'Story GameOver',
    outcomeText: '',
    effect: {
      type: 'flag',
      flag: 'addStoryFlag',
      value: 'gameOver'
    },
    _precomputedResult: {
      delta: { flags: { addStoryFlag: 'gameOver' } },
      result: { value: true }
    }
  }
  const state = buildState()
  const { sideEffects } = resolveEvent(choice, state)
  const gameOver = sideEffects.find(e => e.type === 'changeScene' && e.scene === 'GAMEOVER')
  assert.ok(gameOver)
})

test('resolveEvent: no quests if flags.addQuest is not array', () => {
  const choice = {
    label: 'Bad quests array',
    outcomeText: '',
    _precomputedResult: {
      delta: { flags: { addQuest: { id: 'not_array' } } },
      result: null
    }
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)
  const questActions = actions.filter(a => a.type === 'ADD_QUEST')
  assert.equal(questActions.length, 0)
})

test('resolveEvent: fallback resolution uses choice/resolution correctly', () => {
  const choice = {
    label: 'Fallback text',
    outcomeText: 'choice_text',
    description: undefined,
    _precomputedResult: {
      outcomeText: 'should_be_ignored',
      description: 'resolution_desc',
      delta: null
    }
  }
  const state = buildState()
  const { outcomeText, description } = resolveEvent(choice, state)
  assert.equal(outcomeText, 'choice_text')
  assert.equal(description, 'resolution_desc')
})

test('resolveEvent: choice missing outcomeText and resolution has outcomeText', () => {
  const choice = {
    label: 'Fallback text',
    // outcomeText is undefined in choice, resolution has it
    description: undefined,
    _precomputedResult: {
      outcomeText: 'resolution_outcome',
      description: 'resolution_desc',
      delta: null
    }
  }
  const state = buildState()
  const { outcomeText, description } = resolveEvent(choice, state)
  assert.equal(outcomeText, 'resolution_outcome')
  assert.equal(description, 'resolution_desc')
})

test('resolveEvent: resolves event choice without precomputed result', () => {
  const choice = {
    label: 'Dynamic resolution',
    outcomeText: 'dynamic',
    effect: { type: 'resource', resource: 'money', value: 10 }
  }
  const state = buildState()
  // No _precomputedResult here, it will hit resolveEventChoice
  const { actions, outcomeText } = resolveEvent(choice, state)
  const deltaAction = actions.find(a => a.type === 'APPLY_EVENT_DELTA')
  assert.ok(deltaAction)
  assert.equal(deltaAction.payload.player.money, 10)
  assert.equal(outcomeText, 'dynamic')
})

test('resolveEvent: choice missing outcomeText and resolution has outcomeText missing', () => {
  const choice = {
    label: 'Fallback text completely missing',
    // outcomeText is undefined in choice
    description: undefined,
    _precomputedResult: {
      // outcomeText is undefined in resolution too
      description: undefined,
      delta: null
    }
  }
  const state = buildState()
  const { outcomeText, description } = resolveEvent(choice, state)
  assert.equal(outcomeText, '')
  assert.equal(description, '')
})
