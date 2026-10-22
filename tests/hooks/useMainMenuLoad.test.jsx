import { describe, expect, it, vi } from 'vitest'
import { useReducer } from 'react'
import { act, renderHook } from '@testing-library/react'
import { useMainMenuLoad } from '../../src/scenes/mainmenu/hooks/useMainMenuLoad'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'
import { GAME_PHASES } from '../../src/context/gameConstants'
import {
  createChangeSceneAction,
  createLoadGameAction
} from '../../src/context/actionCreators'

// A save written on the post-gig result screen, before Continue settled it.
const buildPostGigSave = ({ nodeType = 'GIG', net = 300 } = {}) => {
  const base = createInitialState()
  return {
    currentScene: GAME_PHASES.POST_GIG,
    player: {
      ...base.player,
      money: 500,
      fame: 100,
      currentNodeId: 'node_gig',
      lastGigNodeId: 'node_gig'
    },
    gameMap: {
      nodes: { node_gig: { id: 'node_gig', type: nodeType, x: 0, y: 0 } },
      connections: []
    },
    currentGig: { id: 'gig_venue', name: 'Gig Venue' },
    lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
    pendingGigSettlement: {
      id: 'settlement-1',
      gigId: 'gig_venue',
      net,
      perfScore: 80,
      misses: 0,
      dealFameMultiplier: 1,
      soldMerch: {}
    }
  }
}

// The menu's load path against the real reducer: `loadGame` dispatches
// LOAD_GAME like `usePersistence`, and every scene callback the menu holds
// dispatches CHANGE_SCENE, so a navigation after the load is observable.
const renderMenuLoad = save =>
  renderHook(() => {
    const [state, dispatch] = useReducer(gameReducer, undefined, () => ({
      ...createInitialState(),
      currentScene: GAME_PHASES.MENU
    }))
    const handlers = useMainMenuLoad({
      setIsLoadingGame: vi.fn(),
      loadGame: () => {
        dispatch(createLoadGameAction(save))
        return { ok: true }
      },
      changeScene: scene => dispatch(createChangeSceneAction(scene)),
      initializeAudio: vi.fn(),
      setShowExistingSavePrompt: vi.fn(),
      addToast: vi.fn(),
      tRef: { current: key => key }
    })
    return { state, ...handlers }
  })

describe('useMainMenuLoad with a pending gig settlement', () => {
  it('keeps the victory screen for a won Career Finale', () => {
    const { result } = renderMenuLoad(buildPostGigSave({ nodeType: 'FINALE' }))

    act(() => result.current.handleLoad())

    expect(result.current.state.player.stats.tourCompleted).toBe(true)
    expect(result.current.state.currentScene).toBe(GAME_PHASES.GAMEOVER)
  })

  it('keeps the game-over screen for a bankrupting net', () => {
    const { result } = renderMenuLoad(buildPostGigSave({ net: -700 }))

    act(() => result.current.handleLoadExistingFromPrompt())

    expect(result.current.state.player.money).toBe(0)
    expect(result.current.state.currentScene).toBe(GAME_PHASES.GAMEOVER)
  })

  it('lands on the Overworld for an ordinary settlement', () => {
    const { result } = renderMenuLoad(buildPostGigSave())

    act(() => result.current.handleLoad())

    expect(result.current.state.player.money).toBe(800)
    expect(result.current.state.currentScene).toBe(GAME_PHASES.OVERWORLD)
  })
})
