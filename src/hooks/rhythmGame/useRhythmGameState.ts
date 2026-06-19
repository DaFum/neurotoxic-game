import {
  useReducer,
  useRef,
  useMemo,
  useState,
  type MutableRefObject
} from 'react'
import { getPixiColorFromToken } from '../../components/stage/stageRenderUtils'
import { getSafeRandom } from '../../utils/crypto'
import type {
  RhythmGameRefState,
  RhythmLiveStats,
  RhythmModifiers,
  RhythmNote
} from '../../types/rhythmGame'

type SetterPayload<T> = T | ((current: T) => T)

/**
 * React-rendered rhythm game state mirrored from the high-frequency game ref.
 */
export type RhythmUiState = {
  /** Current performance score accumulated during the song. */
  score: number
  /** Consecutive notes hit without missing. */
  combo: number
  /** Player's remaining health points, usually out of 100. */
  health: number
  /** Current level of accumulated overload from special interactions. */
  overload: number
  /** Indicates whether the game is currently in a hazardous or altered mode. */
  isToxicMode: boolean
  /** Indicates if the current song has ended via failure or completion. */
  isGameOver: boolean
  /** Represents the readiness state of the underlying audio engine, or null if uninitialized. */
  isAudioReady: boolean | null
  /** Calculated percentage of successful hits versus total attempts (0 to 100). */
  accuracy: number
  /** Accumulated level of corruption impacting gameplay metrics. */
  corruptionLevel: number
  /** Indicates whether a critical corruption event is actively ongoing. */
  isCorruptionBurstActive: boolean
  /** Relative gig time in milliseconds when the current corruption burst effect will conclude. */
  corruptionBurstEndTime: number
  /** Indicates whether corruption mechanics are currently active in the scene. */
  isCorruptionActive: boolean
}

type RhythmStateAction =
  | { type: 'SET_SCORE'; payload: SetterPayload<number> }
  | { type: 'SET_COMBO'; payload: SetterPayload<number> }
  | { type: 'SET_HEALTH'; payload: SetterPayload<number> }
  | { type: 'SET_OVERLOAD'; payload: SetterPayload<number> }
  | { type: 'SET_IS_TOXIC_MODE'; payload: SetterPayload<boolean> }
  | { type: 'SET_IS_GAME_OVER'; payload: SetterPayload<boolean> }
  | { type: 'SET_IS_AUDIO_READY'; payload: SetterPayload<boolean | null> }
  | { type: 'SET_ACCURACY'; payload: SetterPayload<number> }
  | { type: 'SET_CORRUPTION_LEVEL'; payload: SetterPayload<number> }
  | { type: 'SET_IS_CORRUPTION_BURST_ACTIVE'; payload: SetterPayload<boolean> }
  | { type: 'SET_CORRUPTION_BURST_END_TIME'; payload: SetterPayload<number> }
  | {
      type: 'SET_CORRUPTION_STATE'
      payload: { level: number; active: boolean }
    }

export type {
  RhythmGameRefState,
  RhythmLiveStats,
  RhythmModifiers,
  RhythmNote
} from '../../types/rhythmGame'

/**
 * Setter surface for rhythm UI state used by audio, scoring, and loop hooks.
 */
export type RhythmStateSetters = {
  /** Updates the performance score state. */
  setScore: (score: SetterPayload<number>) => void
  /** Updates the current consecutive hit combo state. */
  setCombo: (combo: SetterPayload<number>) => void
  /** Updates the remaining health state. */
  setHealth: (health: SetterPayload<number>) => void
  /** Updates the accumulated overload state. */
  setOverload: (overload: SetterPayload<number>) => void
  /** Toggles the active status of the hazardous toxic mode. */
  setIsToxicMode: (isToxicMode: SetterPayload<boolean>) => void
  /** Updates the completion or failure status of the current game session. */
  setIsGameOver: (isGameOver: SetterPayload<boolean>) => void
  /** Updates the availability status of the underlying audio engine. */
  setIsAudioReady: (isAudioReady: SetterPayload<boolean | null>) => void
  /** Updates the calculated accuracy percentage state. */
  setAccuracy: (accuracy: SetterPayload<number>) => void
  /** Updates the accumulated corruption level state. */
  setCorruptionLevel: (corruptionLevel: SetterPayload<number>) => void
  /** Toggles the active status of the critical corruption burst effect. */
  setIsCorruptionBurstActive: (
    isCorruptionBurstActive: SetterPayload<boolean>
  ) => void
  /** Updates the termination gig time in milliseconds for an active corruption burst. */
  setCorruptionBurstEndTime: (
    corruptionBurstEndTime: SetterPayload<number>
  ) => void
  /** Applies combined level and activity updates to the corruption state. */
  setCorruptionState: (level: number, active: boolean) => void
}

/**
 * State bundle returned by useRhythmGameState.
 */
export type RhythmGameStateHookReturn = {
  /** High-frequency mutable state reference avoiding React render cycles. */
  gameStateRef: MutableRefObject<RhythmGameRefState>
  /** React-reactive state exposed for UI rendering updates. */
  state: RhythmUiState
  /** Collection of dispatched setter actions modifying the UI state. */
  setters: RhythmStateSetters
}

const INITIAL_UI_STATE: RhythmUiState = {
  score: 0,
  combo: 0,
  health: 100,
  overload: 0,
  isToxicMode: false,
  isGameOver: false,
  isAudioReady: null,
  accuracy: 100,
  corruptionLevel: 0,
  isCorruptionBurstActive: false,
  corruptionBurstEndTime: 0,
  isCorruptionActive: false
}

function resolvePayload<T>(payload: SetterPayload<T>, currentStateValue: T): T {
  return typeof payload === 'function'
    ? (payload as (current: T) => T)(currentStateValue)
    : payload
}

function rhythmGameReducer(
  state: RhythmUiState,
  action: RhythmStateAction
): RhythmUiState {
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
    case 'SET_CORRUPTION_LEVEL':
      return {
        ...state,
        corruptionLevel: resolvePayload(action.payload, state.corruptionLevel)
      }
    case 'SET_IS_CORRUPTION_BURST_ACTIVE':
      return {
        ...state,
        isCorruptionBurstActive: resolvePayload(
          action.payload,
          state.isCorruptionBurstActive
        )
      }
    case 'SET_CORRUPTION_BURST_END_TIME':
      return {
        ...state,
        corruptionBurstEndTime: resolvePayload(
          action.payload,
          state.corruptionBurstEndTime
        )
      }
    case 'SET_CORRUPTION_STATE':
      return {
        ...state,
        corruptionLevel: action.payload.level,
        isCorruptionActive: action.payload.active
      }
    default:
      return state
  }
}

const INITIAL_GAME_STATE_REF: Omit<RhythmGameRefState, 'rng'> = {
  notes: [] as RhythmNote[],
  nextMissCheckIndex: 0, // Optimization: only check notes that haven't passed yet
  lanes: [
    {
      id: 'guitar',
      key: 'ArrowLeft',
      x: 0,
      color: getPixiColorFromToken('--rhythm-guitar'),
      active: false,
      hitWindow: 150
    },
    {
      id: 'drums',
      key: 'ArrowDown',
      x: 120,
      color: getPixiColorFromToken('--rhythm-drums'),
      active: false,
      hitWindow: 150
    },
    {
      id: 'bass',
      key: 'ArrowRight',
      x: 240,
      color: getPixiColorFromToken('--rhythm-bass'),
      active: false,
      hitWindow: 150
    }
  ],
  speed: 500,
  modifiers: {
    drumMultiplier: 1,
    guitarScoreMult: 1,
    bassScoreMult: 1,
    hitWindowBonus: 0,
    drumSpeedMult: 1
  } as RhythmModifiers,
  stats: {
    perfectHits: 0,
    misses: 0,
    maxCombo: 0,
    peakHype: 0,
    corruptionLevel: 0
  } as RhythmLiveStats,
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
  rivalPenaltyActive: false,
  currentSongStartPerfectHits: 0,
  currentSongStartMisses: 0,
  // Replaces audioPlaybackEnded; signals multi-song setlist completion
  setlistCompleted: false,
  // Incremented each time the notes array is replaced so NoteManager can
  // detect a song transition and reset its render pointer.
  notesVersion: 0,
  transportPausedByOverlay: false,
  toxicTimeTotal: 0,
  toxicModeEndTime: 0,
  corruptionLevel: 0,
  isCorruptionBurstActive: false,
  corruptionBurstEndTime: 0
  // Note: rng is attached in the ref directly since it isn't cloning friendly
}

/**
 * Manages the state for the rhythm game, including React state for UI
 * and a Ref for the high-frequency game loop.
 *
 * @returns State bundle containing the reactive UI state, setter surface, and high-frequency reference.
 */
export const useRhythmGameState = (): RhythmGameStateHookReturn => {
  // React State for UI
  const [state, dispatch] = useReducer(rhythmGameReducer, INITIAL_UI_STATE)

  const [initialRefValue] = useState<RhythmGameRefState>(() => ({
    ...structuredClone(INITIAL_GAME_STATE_REF),
    rng: getSafeRandom // Store RNG for consistency
  }))

  // High-Frequency Game State (Ref)
  // structuredClone is used to ensure a fresh copy of the initial state is created per hook instance
  const gameStateRef = useRef<RhythmGameRefState>(initialRefValue)

  const setters = useMemo<RhythmStateSetters>(
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
        dispatch({ type: 'SET_ACCURACY', payload: accuracy }),
      setCorruptionLevel: corruptionLevel =>
        dispatch({ type: 'SET_CORRUPTION_LEVEL', payload: corruptionLevel }),
      setIsCorruptionBurstActive: isCorruptionBurstActive =>
        dispatch({
          type: 'SET_IS_CORRUPTION_BURST_ACTIVE',
          payload: isCorruptionBurstActive
        }),
      setCorruptionBurstEndTime: corruptionBurstEndTime =>
        dispatch({
          type: 'SET_CORRUPTION_BURST_END_TIME',
          payload: corruptionBurstEndTime
        }),
      setCorruptionState: (level, active) =>
        dispatch({ type: 'SET_CORRUPTION_STATE', payload: { level, active } })
    }),
    []
  )

  return {
    gameStateRef,
    state,
    setters
  }
}
