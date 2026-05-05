import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEvent } from '../../src/domain/eventResolver.ts'
import {
  createApplyEventDeltaAction,
  createAddQuestAction,
  createAddUnlockAction,
  createAddCooldownAction,
  createSetActiveEventAction,
  createPopPendingEventAction,
} from '../../src/context/actionCreators.ts'

const buildState = (overrides = {}) => ({
  player: { money: 200, time: 10, fame: 2, day: 3, eventsTriggeredToday: 0, van: { fuel: 50, condition: 80 } },
  band: { members: [{ id: 'alpha', stamina: 6, mood: 50 }], harmony: 60, inventory: {} },
  social: { instagram: 0, viral: 0 },
  activeEvent: { id: 'evt_test', titleKey: 'event:test' },
  pendingEvents: [],
  eventCooldowns: [],
  activeStoryFlags: [],
  ...overrides,
})

// --- null choice ---
test('resolveEvent: null choice clears active event, no other actions', () => {
  const { actions, sideEffects, outcomeText, description, result } = resolveEvent(null, buildState())
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
    effect: { type: 'resource', resource: 'money', value: -40 },
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  const types = actions.map(a => a.type)
  assert.ok(types.includes('APPLY_EVENT_DELTA'), 'must include APPLY_EVENT_DELTA')
  assert.ok(types.includes('ADD_COOLDOWN'), 'must include ADD_COOLDOWN')
  assert.ok(types.includes('SET_ACTIVE_EVENT'), 'must include SET_ACTIVE_EVENT (clear)')

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
    effect: { type: 'flag', flag: 'addQuest', value: [{ id: 'q1', deadlineOffset: 5 }] },
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
    effect: { type: 'flag', flag: 'unlock', value: 'My Cool Unlock!' },
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
    effect: { type: 'flag', flag: 'gameOver', value: true },
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  // no cooldown for game over
  assert.ok(!actions.find(a => a.type === 'ADD_COOLDOWN'), 'no cooldown on game over')

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
test('resolveEvent: active event matching first pendingEvent emits POP_PENDING_EVENT in triggerEvent', () => {
  // NOTE: popPendingEvent is in triggerEvent, not resolveEvent.
  // This test verifies resolveEvent does NOT emit it (that is triggerEvent's job).
  const choice = {
    label: 'OK',
    outcomeText: '',
    effect: { type: 'resource', resource: 'money', value: 0 },
  }
  const state = buildState({ pendingEvents: ['evt_test'] })
  const { actions } = resolveEvent(choice, state)
  const popAction = actions.find(a => a.type === 'POP_PENDING_EVENT')
  assert.ok(!popAction, 'resolveEvent must not pop pending events (triggerEvent does that)')
})
