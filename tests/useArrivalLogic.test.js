import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { GAME_PHASES } from '../src/context/gameConstants.js'
import { act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import {
  setupArrivalLogicTest,
  setupArrivalScenario,
  resetMockGameState
} from './useArrivalLogicTestUtils.js'

const { useArrivalLogic, mockGameState } = await setupArrivalLogicTest()

describe('useArrivalLogic', () => {
  beforeEach(() => {
    setupJSDOM()
    resetMockGameState()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('executes standard arrival sequence', () => {
    const { result } = setupArrivalScenario(useArrivalLogic)

    act(() => {
      result.current.handleArrivalSequence()
    })

    // 1. Advance Day
    assert.equal(mockGameState.advanceDay.mock.calls.length, 1)
    // 2. Save Game
    assert.equal(mockGameState.saveGame.mock.calls.length, 1)
    // 3. Trigger Events
    assert.ok(mockGameState.triggerEvent.mock.calls.length >= 1)
    // 4. Default Routing (no current node found -> OVERWORLD)
    assert.equal(mockGameState.changeScene.mock.calls.length, 1)
    assert.equal(
      mockGameState.changeScene.mock.calls[0].arguments[0],
      GAME_PHASES.OVERWORLD
    )
  })

  test('applies harmony regen if upgrade active', () => {
    const { result } = setupArrivalScenario(useArrivalLogic, {
      band: { harmony: 50, harmonyRegenTravel: true }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.updateBand.mock.calls.length, 1)
    const updateArg = mockGameState.updateBand.mock.calls[0].arguments[0]
    assert.equal(updateArg.harmony, 55) // 50 + 5
  })

  test('handles REST_STOP node', () => {
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'REST_STOP' }
        }
      },
      band: {
        members: [{ mood: 50, stamina: 50 }]
      }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.updateBand.mock.calls.length, 1)
    const updateArg = mockGameState.updateBand.mock.calls[0].arguments[0]
    // Expect boost: mood + 10, stamina + 20
    assert.equal(updateArg.members[0].mood, 60)
    assert.equal(updateArg.members[0].stamina, 70)

    assert.ok(
      mockGameState.addToast.mock.calls.some(c =>
        c.arguments[0].includes('Rested')
      )
    )
  })

  test('handles GIG node with sufficient harmony', () => {
    const venue = { name: 'Club' }
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'GIG', venue }
        }
      },
      band: { harmony: 50 }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.startGig.mock.calls.length, 1)
    assert.deepEqual(mockGameState.startGig.mock.calls[0].arguments[0], venue)
  })

  test('prevents GIG if harmony too low', () => {
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'GIG', venue: {} }
        }
      },
      band: { harmony: 0 }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.startGig.mock.calls.length, 0)
    assert.equal(mockGameState.changeScene.mock.calls.length, 1)
    assert.equal(
      mockGameState.changeScene.mock.calls[0].arguments[0],
      GAME_PHASES.OVERWORLD
    )
    assert.ok(
      mockGameState.addToast.mock.calls.some(c =>
        c.arguments[0].includes('too low')
      )
    )
  })

  test('idempotency guard prevents double execution', () => {
    const { result } = setupArrivalScenario(useArrivalLogic)

    // Simulate double click (synchronous double invocation)
    act(() => {
      result.current.handleArrivalSequence()
      result.current.handleArrivalSequence()
    })

    // Should only call actions once
    assert.equal(mockGameState.advanceDay.mock.calls.length, 1)
    assert.equal(mockGameState.saveGame.mock.calls.length, 1)
  })

  test('resets idempotency guard on error', () => {
    const { result } = setupArrivalScenario(useArrivalLogic)

    // Mock advanceDay to throw an error
    mockGameState.advanceDay.mock.mockImplementationOnce(() => {
      throw new Error('Test Error')
    })

    assert.throws(() => {
      act(() => {
        result.current.handleArrivalSequence()
      })
    }, /Test Error/)

    assert.equal(mockGameState.advanceDay.mock.calls.length, 1)

    // Second call should proceed (since isHandlingRef was reset to false)
    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.advanceDay.mock.calls.length, 2)
  })

  test('handles SPECIAL node with event trigger', () => {
    // In useArrivalLogic, triggerEvent is called multiple times.
    // We mock it to return true on the third call (which is 'special')
    // Wait, useArrivalLogic calls:
    // 1. triggerEvent('transport', 'travel') -> returns false
    // 2. triggerEvent('band', 'travel') -> returns false
    // 3. handleNodeArrival -> triggerEvent('special') -> returns true
    let callCount = 0;
    mockGameState.triggerEvent.mock.mockImplementation((type) => {
      callCount++;
      if (type === 'special') return true;
      return false; // Let the 'travel' events fail so it reaches 'special'
    })

    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'SPECIAL' }
        }
      }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.ok(
      mockGameState.triggerEvent.mock.calls.some(c => c.arguments[0] === 'special'),
      'triggerEvent should be called with "special"'
    )
  })

  test('handles SPECIAL node when nothing happens', () => {
    mockGameState.triggerEvent.mock.mockImplementation(() => false)
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'SPECIAL' }
        }
      }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.ok(
      mockGameState.addToast.mock.calls.some(c =>
        c.arguments[0].includes('nothing happened')
      )
    )
  })

  test('handles START node and shows Home Sweet Home', () => {
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'START' }
        }
      }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.ok(
      mockGameState.addToast.mock.calls.some(c =>
        c.arguments[0].includes('Home Sweet Home')
      )
    )
  })

  test('handles FESTIVAL node with sufficient harmony', () => {
    const venue = { name: 'Festival Stage' }
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'FESTIVAL', venue }
        }
      },
      band: { harmony: 60 }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.startGig.mock.calls.length, 1)
    assert.deepEqual(mockGameState.startGig.mock.calls[0].arguments[0], venue)
  })

  test('handles FINALE node with sufficient harmony', () => {
    const venue = { name: 'Main Arena' }
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'FINALE', venue }
        }
      },
      band: { harmony: 80 }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.startGig.mock.calls.length, 1)
    assert.deepEqual(mockGameState.startGig.mock.calls[0].arguments[0], venue)
  })

  test('handles startGig error during GIG node gracefully', () => {
    mockGameState.startGig.mock.mockImplementationOnce(() => {
      throw new Error('Gig Failed To Start')
    })
    const venue = { name: 'Club' }
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: {
        nodes: {
          node_start: { type: 'GIG', venue }
        }
      },
      band: { harmony: 50 }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    assert.equal(mockGameState.startGig.mock.calls.length, 1)

    // handleError internally calls addToast with the fallback message
    // or the error's message. We assert that addToast was invoked with feedback.
    assert.ok(
      mockGameState.addToast.mock.calls.some(c =>
        c.arguments[0].includes('Failed to start Gig') ||
        c.arguments[0].includes('Gig Failed To Start')
      )
    )
  })
})
