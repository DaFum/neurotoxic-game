import { useReducer, useRef, useMemo, useState } from 'react'
import { getPixiColorFromToken } from '../../components/stage/utils'
import { getSafeRandom } from '../../utils/crypto'

const INITIAL_UI_STATE = {
  score: 0,
  combo: 0,
  health: 100,
  overload: 0,
  isToxicMode: false,
  isGameOver: false,
  isAudioReady: null,
  accuracy: 100
}

function resolvePayload(payload, currentStateValue) {
  return typeof payload === 'function' ? payload(currentStateValue) : payload
}

function rhythmGameReducer(state, action) {
  switch (action.type) {
    case 'SET_SCORE':
      return { ...state, score: resolvePayload(action.payload, state.score) }
    case 'SET_COMBO':
      return { ...state, combo: resolvePayload(action.payload, state.combo) }
    case 'SET_HEALTH':
      return { ...state, health: resolvePayload(action.payload, state.health) }
    case 'SET_OVERLOAD':
      return {
        ...state,
        overload: resolvePayload(action.payload, state.overload)
      }
    case 'SET_IS_TOXIC_MODE':
      return {
        ...state,
        isToxicMode: resolvePayload(action.payload, state.isToxicMode)
      }
    case 'SET_IS_GAME_OVER':
      return {
        ...state,
        isGameOver: resolvePayload(action.payload, state.isGameOver)
      }
    case 'SET_IS_AUDIO_READY':
      return {
        ...state,
        isAudioReady: resolvePayload(action.payload, state.isAudioReady)
      }
    case 'SET_ACCURACY':
      return {
        ...state,
        accuracy: resolvePayload(action.payload, state.accuracy)
      }
    default:
      return state
  }
}

const INITIAL_GAME_STATE_REF = {
  notes: [],
  nextMissCheckIndex: 0, // Optimization: only check notes that haven't passed yet
  lanes: [
    {
      id: 'guitar',
      key: 'ArrowLeft',
      x: 0,
      color: getPixiColorFromToken('--rhythm-guitar', '#ff0041'),
      active: false,
      hitWindow: 150
    },
    {
      id: 'drums',
      key: 'ArrowDown',
      x: 120,
      color: getPixiColorFromToken('--rhythm-drums', '#00ff41'),
      active: false,
      hitWindow: 150
    },
    {
      id: 'bass',
      key: 'ArrowRight',
      x: 240,
      color: getPixiColorFromToken('--rhythm-bass', '#0041ff'),
      active: false,
      hitWindow: 150
    }
  ],
  speed: 500,
  modifiers: {},
  stats: { perfectHits: 0, misses: 0, maxCombo: 0, peakHype: 0 },
  projectiles: [],
  // Mirror React State for Renderer
  combo: 0,
  health: 100,
  score: 0,
  progress: 0,
  isToxicMode: false,
  isGameOver: false,
  overload: 0,
  totalDuration: 0,
  hasSubmittedResults: false,
  songTransitioning: false,
  songStats: [],
  lastEndedSongIndex: -1,
  currentSongStartScore: 0,
  currentSongStartPerfectHits: 0,
  currentSongStartMisses: 0,
  // Replaces audioPlaybackEnded; signals multi-song setlist completion
  setlistCompleted: false,
  // Incremented each time the notes array is replaced so NoteManager can
  // detect a song transition and reset its render pointer.
  notesVersion: 0,
  transportPausedByOverlay: false,
  toxicTimeTotal: 0,
  toxicModeEndTime: 0
  // Note: rng is attached in the ref directly since it isn't cloning friendly
}

/**
 * Manages the state for the rhythm game, including React state for UI
 * and a Ref for the high-frequency game loop.
 *
 * @returns {{gameStateRef: React.MutableRefObject, state: Object, setters: Object}} State and setters.
 */
export const useRhythmGameState = () => {
  // React State for UI
  const [state, dispatch] = useReducer(rhythmGameReducer, INITIAL_UI_STATE)

  // High-Frequency Game State (Ref)
  // structuredClone is used to ensure a fresh copy of the initial state is created per hook instance
  const [initialRefValue] = useState(() => ({
    ...structuredClone(INITIAL_GAME_STATE_REF),
    rng: getSafeRandom // Store RNG for consistency
  }))
  const gameStateRef = useRef(initialRefValue)

  const setters = useMemo(
    () => ({
      setScore: score => dispatch({ type: 'SET_SCORE', payload: score }),
      setCombo: combo => dispatch({ type: 'SET_COMBO', payload: combo }),
      setHealth: health => dispatch({ type: 'SET_HEALTH', payload: health }),
      setOverload: overload =>
        dispatch({ type: 'SET_OVERLOAD', payload: overload }),
      setIsToxicMode: isToxicMode =>
        dispatch({ type: 'SET_IS_TOXIC_MODE', payload: isToxicMode }),
      setIsGameOver: isGameOver =>
        dispatch({ type: 'SET_IS_GAME_OVER', payload: isGameOver }),
      setIsAudioReady: isAudioReady =>
        dispatch({ type: 'SET_IS_AUDIO_READY', payload: isAudioReady }),
      setAccuracy: accuracy =>
        dispatch({ type: 'SET_ACCURACY', payload: accuracy })
    }),
    []
  )

  return {
    gameStateRef,
    state,
    setters
  }
}
