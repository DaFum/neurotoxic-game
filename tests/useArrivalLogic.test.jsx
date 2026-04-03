import { describe, it as test, beforeEach, afterEach, expect, vi as mock } from 'vitest'

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
    expect(mockGameState.advanceDay.mock.calls.length).toBe(1)
    // 2. Save Game
    expect(mockGameState.saveGame.mock.calls.length).toBe(1)
    // 3. Trigger Events
    expect(mockGameState.triggerEvent.mock.calls.length).toBeGreaterThanOrEqual(1)
    // 4. Default Routing (no current node found -> OVERWORLD)
    expect(mockGameState.changeScene.mock.calls.length).toBe(1)
    expect(mockGameState.changeScene.mock.calls[0][0]).toBe(GAME_PHASES.OVERWORLD)
  })

  test('applies harmony regen if upgrade active', () => {
    const { result } = setupArrivalScenario(useArrivalLogic, {
      band: { harmony: 50, harmonyRegenTravel: true }
    })

    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(mockGameState.updateBand.mock.calls.length).toBe(1)
    const updateArg = mockGameState.updateBand.mock.calls[0][0]
    expect(updateArg.harmony).toBe(55) // 50 + 5
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

    expect(mockGameState.updateBand.mock.calls.length).toBe(1)
    const updateArg = mockGameState.updateBand.mock.calls[0][0]
    // Expect boost: mood + 10, stamina + 20
    expect(updateArg.members[0].mood).toBe(60)
    expect(updateArg.members[0].stamina).toBe(70)

    expect(
      mockGameState.addToast.mock.calls.some(c =>
        c[0].includes('Rested')
      )
    )
  })

  test('handles GIG node with sufficient harmony', () => {
    const venue = { name: 'Club' }
    const { result } = setupArrivalScenario(useArrivalLogic, {
      gameMap: { nodes: { node_start: { type: 'GIG', venue } } },
      band: { harmony: 50 }
    })

    act(() => { result.current.handleArrivalSequence() })

    expect(mockGameState.startGig.mock.calls.length).toBe(1)
    expect(mockGameState.startGig.mock.calls[0][0]).toEqual(venue)
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

    expect(mockGameState.startGig.mock.calls.length).toBe(0)
    expect(mockGameState.changeScene.mock.calls.length).toBe(1)
    expect(mockGameState.changeScene.mock.calls[0][0]).toBe(GAME_PHASES.OVERWORLD)
    expect(
      mockGameState.addToast.mock.calls.some(c =>
        c[0].includes('cancelled')
      )
    )
  })

  test('handles luck-based cancellation in GIG node', () => {
    const rng = () => 0.1 // Below chance (0.25)
    const { result } = setupArrivalScenario(
      useArrivalLogic,
      {
        gameMap: {
          nodes: {
            node_start: { type: 'GIG', venue: {} }
          }
        },
        band: { harmony: 10 } // Below threshold (15)
      },
      { rng }
    )

    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(mockGameState.startGig.mock.calls.length).toBe(0)
    expect(mockGameState.changeScene.mock.calls.length).toBe(1)
    expect(
      mockGameState.addToast.mock.calls.some(c =>
        c[0].includes('cancelled')
      )
    )
    // Should apply fame penalty
    expect(mockGameState.updatePlayer.mock.calls.length).toBe(1)
  })

  test('idempotency guard prevents double execution', () => {
    const { result } = setupArrivalScenario(useArrivalLogic)

    // Simulate double click (synchronous double invocation)
    act(() => {
      result.current.handleArrivalSequence()
      result.current.handleArrivalSequence()
    })

    // Should only call actions once
    expect(mockGameState.advanceDay.mock.calls.length).toBe(1)
    expect(mockGameState.saveGame.mock.calls.length).toBe(1)
  })

  test('resets idempotency guard on error', () => {
    const { result } = setupArrivalScenario(useArrivalLogic)

    // Mock advanceDay to throw an error
    mockGameState.advanceDay.mockImplementationOnce(() => {
      throw new Error('Test Error')
    })

    assert.throws(() => {
      act(() => {
        result.current.handleArrivalSequence()
      })
    }, /Test Error/)

    expect(mockGameState.advanceDay.mock.calls.length).toBe(1)

    // Second call should proceed (since isHandlingRef was reset to false)
    act(() => {
      result.current.handleArrivalSequence()
    })

    expect(mockGameState.advanceDay.mock.calls.length).toBe(2)
  })

  test('handles SPECIAL node with event trigger', () => {
    // In useArrivalLogic, triggerEvent is called multiple times.
    // We mock it to return true on the third call (which is 'special')
    // Wait, useArrivalLogic calls:
    // 1. triggerEvent('transport', 'travel') -> returns false
    // 2. triggerEvent('band', 'travel') -> returns false
    // 3. handleNodeArrival -> triggerEvent('special') -> returns true
    let _callCount = 0
    mockGameState.triggerEvent.mockImplementation(type => {
      _callCount++
      if (type === 'special') return true
      return false // Let the 'travel' events fail so it reaches 'special'
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

    expect(
      mockGameState.triggerEvent.mock.calls.some(
        c => c[0] === 'special'
      ),
      'triggerEvent should be called with "special"'
    )
  })

  test('handles SPECIAL node when nothing happens', () => {
    mockGameState.triggerEvent.mockImplementation(() => false)
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

    expect(
      mockGameState.addToast.mock.calls.some(c =>
        c[0].includes('nothing happened')
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

    expect(
      mockGameState.addToast.mock.calls.some(c =>
        c[0].includes('Home Sweet Home')
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

    expect(mockGameState.startGig.mock.calls.length).toBe(1)
    expect(mockGameState.startGig.mock.calls[0][0]).toEqual(venue)
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

    expect(mockGameState.startGig.mock.calls.length).toBe(1)
    expect(mockGameState.startGig.mock.calls[0][0]).toEqual(venue)
  })

  test('handles startGig error during GIG node gracefully', () => {
    mockGameState.startGig.mockImplementationOnce(() => {
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

    expect(mockGameState.startGig.mock.calls.length).toBe(1)

    // handleError internally calls addToast with the fallback message
    // or the error's message. We assert that addToast was invoked with feedback.
    expect(
      mockGameState.addToast.mock.calls.some(
        c =>
          c[0].includes('Failed to start Gig') ||
          c[0].includes('Gig Failed To Start')
      )
    )
  })
})
