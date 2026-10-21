import test from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { GAME_PHASES } from '../../src/context/gameConstants'

const toGameOver = state =>
  gameReducer(state, {
    type: ActionTypes.CHANGE_SCENE,
    payload: GAME_PHASES.GAMEOVER
  })

test('a live bankruptcy transition out of the post-gig screen is recorded', () => {
  const state = {
    ...createInitialState(),
    currentScene: GAME_PHASES.POST_GIG
  }
  const next = toGameOver(state)
  assert.equal(next.currentScene, GAME_PHASES.GAMEOVER)
  assert.deepEqual(next.terminalOutcome, { reason: 'bankruptcy' })
})

test('a completed tour is recorded as the victory', () => {
  const base = createInitialState()
  const state = {
    ...base,
    currentScene: GAME_PHASES.POST_GIG,
    player: {
      ...base.player,
      stats: { ...base.player.stats, tourCompleted: true }
    }
  }
  assert.deepEqual(toGameOver(state).terminalOutcome, {
    reason: 'career_victory'
  })
})

test('the stranded check leaving the overworld is recorded', () => {
  const state = {
    ...createInitialState(),
    currentScene: GAME_PHASES.OVERWORLD
  }
  assert.deepEqual(toGameOver(state).terminalOutcome, { reason: 'stranded' })
})

test('an outcome already recorded is not overwritten by the scene change', () => {
  const recorded = { reason: 'event_game_over', eventId: 'deal_devil' }
  const state = {
    ...createInitialState(),
    currentScene: GAME_PHASES.OVERWORLD,
    terminalOutcome: recorded
  }
  assert.deepEqual(toGameOver(state).terminalOutcome, recorded)
})

test('other scene changes leave the outcome alone', () => {
  const state = createInitialState()
  const next = gameReducer(state, {
    type: ActionTypes.CHANGE_SCENE,
    payload: GAME_PHASES.OVERWORLD
  })
  assert.equal(next.terminalOutcome, null)
})

test('the saved GAMEOVER reloads as GAMEOVER', async () => {
  const { handleLoadGame } =
    await import('../../src/context/reducers/systemReducer')
  const ended = toGameOver({
    ...createInitialState(),
    currentScene: GAME_PHASES.POST_GIG
  })
  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify({ terminalOutcome: ended.terminalOutcome }))
  )
  assert.equal(loaded.currentScene, GAME_PHASES.GAMEOVER)
})
