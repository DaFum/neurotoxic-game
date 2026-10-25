import {
  type Context,
  type ReactNode,
  createContext,
  use,
  useReducer,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore
} from 'react'
import { useTranslation } from 'react-i18next'
import { logger } from '../utils/logger'
import { sanitizeSettingsPayload } from '../utils/settingsSanitizer'
import { getUnlocks } from '../utils/unlockManager'
import { isLooseRecord } from '../utils/gameState'
import { useLeaderboardSync } from '../hooks/useLeaderboardSync'
import {
  safeStorageOperation,
  getSafeStorageItem,
  removeStorageItem
} from '../utils/storage'
import { useStorage } from './StorageContext'
import type { IStorageAdapter } from '../utils/storageAdapter'

// Import modular state management
import { createInitialState } from './initialState'

/**
 * Marker key written by the screenshot-injection script to signal that the
 * save in storage was placed by tooling and should hydrate on mount.
 */
const INJECT_MARKER_KEY = 'neurotoxic_inject_marker'
import { gameReducer } from './gameReducer'
import { createLoadGameAction } from './actionCreators'
import type { GameState, GameAction } from '../types'
import { useMapGeneration } from './useMapGeneration'
import { SAVE_KEY, createRawLoadPayload } from './usePersistence'

declare global {
  interface Window {
    gameState?: unknown
  }
}

import {
  useGameDispatchActions,
  type GameDispatchActions
} from './useGameDispatchActions'

type GameStore = {
  getState: () => GameState
  subscribe: (listener: () => void) => () => void
}

type HotGameStateContextStore = typeof globalThis & {
  __NEUROTOXIC_GAME_STATE_CONTEXT__?: Context<GameStore | null>
  __NEUROTOXIC_GAME_DISPATCH_CONTEXT__?: Context<GameDispatchActions | null>
}

const getHotContextStore = () => globalThis as HotGameStateContextStore

const getStableGameStateContext = (): Context<GameStore | null> => {
  const store = getHotContextStore()
  if (!store.__NEUROTOXIC_GAME_STATE_CONTEXT__) {
    const GameStateContext = createContext<GameStore | null>(null)
    store.__NEUROTOXIC_GAME_STATE_CONTEXT__ = GameStateContext
  }
  return store.__NEUROTOXIC_GAME_STATE_CONTEXT__
}

const getStableGameDispatchContext =
  (): Context<GameDispatchActions | null> => {
    const store = getHotContextStore()
    if (!store.__NEUROTOXIC_GAME_DISPATCH_CONTEXT__) {
      const GameDispatchContext = createContext<GameDispatchActions | null>(
        null
      )
      store.__NEUROTOXIC_GAME_DISPATCH_CONTEXT__ = GameDispatchContext
    }
    return store.__NEUROTOXIC_GAME_DISPATCH_CONTEXT__
  }

const GameStateContext = getStableGameStateContext()
const GameDispatchContext = getStableGameDispatchContext()

const IS_DEV =
  typeof import.meta !== 'undefined' &&
  !!(import.meta as unknown as Record<string, unknown>).env &&
  !!(
    (import.meta as unknown as Record<string, unknown>).env as Record<
      string,
      unknown
    >
  ).DEV

/**
 * Resolves a React context and guarantees a non-null value, throwing if the context is missing.
 *
 * @remarks
 * Used internally to unwrap state slices and dispatch functions cleanly.
 *
 * @typeParam T - The expected structure of the context value.
 * @param context - The React context to consume.
 * @param name - The name of the hook calling this function, used for error reporting.
 * @returns The resolved non-null context value.
 * @throws {@link Error} If the context value is null, indicating missing provider hierarchy.
 */
function useRequiredContext<T>(context: Context<T | null>, name: string): T {
  const value = use(context)
  if (value === null) {
    throw new Error(`${name} must be used within GameStateProvider`)
  }
  return value
}

/**
 * Acts as a pass-through reducer for React's local state store since actions are pre-reduced.
 *
 * @param _state - The current game state (ignored).
 * @param next - The pre-calculated next game state.
 * @returns The next game state identically as provided.
 */
const replaceState = (_state: GameState, next: GameState): GameState => next

/**
 * Initializes game state with persistent unlocks and optional screenshot-test
 * hydration.
 *
 * @param storage - Adapter every read here goes through.
 *
 * @remarks
 * Takes the adapter as `useReducer`'s `initialArg` rather than reaching for the
 * module default: initialization runs before the provider body can hand
 * anything down, and reading the default here would leave a `StorageProvider`
 * governing only the post-mount persistence path while unlocks and the
 * screenshot save came from a different backend.
 */
const initGameState = (storage: IStorageAdapter): GameState => {
  // getUnlocks already runs inside safeStorageOperation and falls back to []
  // on any storage failure, so wrapping it again here would add nothing.
  const unlocks = getUnlocks(storage)
  const freshState = createInitialState({ unlocks, storage })

  // Check for test-injected state (screenshot testing).
  // A special marker key signals the state was placed by the screenshot
  // injection script and should be hydrated on mount.  Normal player
  // saves are loaded explicitly via the MENU → "Load Game" button.
  const shouldHydrate = safeStorageOperation(
    'checkInjectMarker',
    () => storage.get(INJECT_MARKER_KEY) === 'true',
    false
  )

  if (shouldHydrate) {
    // NOTE: Do NOT remove the marker here.  React StrictMode double-invokes
    // lazy initialisers in dev, so removing it on the first call would cause
    // the second (authoritative) call to miss the marker and return INTRO.
    // The marker is cleaned up in a useEffect after mount instead.

    const parsed = getSafeStorageItem<unknown>(SAVE_KEY, null, storage)
    const savedGame = isLooseRecord(parsed) ? parsed : null

    if (savedGame && Object.hasOwn(savedGame, 'version')) {
      try {
        return gameReducer(
          freshState,
          createLoadGameAction(createRawLoadPayload(savedGame, unlocks))
        )
      } catch (err) {
        logger.error('GameState', 'Failed to hydrate injected state', err)
      }
    }
  }

  return freshState
}

/**
 * Provides global game state and stable dispatch actions to the React tree.
 *
 * @param children - Optional child nodes to be wrapped by the context providers.
 * @returns React context providers wrapping the supplied children.
 */
export const GameStateProvider = ({ children }: { children?: ReactNode }) => {
  const listenersRef = useRef<Set<() => void>>(new Set())
  const { t } = useTranslation()
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const storage = useStorage()
  // React only stores what `dispatch` below computed (`replaceState`); the
  // reducer itself runs once, synchronously, in `dispatch`.
  const [state, setState] = useReducer(replaceState, storage, initGameState)

  // The state React last rendered. Reads that must agree with the UI (the
  // store, persistence, the DEV `window.gameState`) use this one; it also
  // keeps actions stable (memoized once) while still seeing the current state.
  //
  // Written during render on purpose (React Doctor's no-ref-current-in-render
  // flags it): `useGameSelector` reads this ref as its snapshot, so publishing
  // it from a layout effect would render every subscriber against the old
  // state first and then force a second synchronous pass per dispatch. A
  // discarded render leaking its state is no new hazard either, since
  // `latestStateRef` is ahead of the rendered state by design.
  const stateRef = useRef(state)
  stateRef.current = state

  // The state after every dispatch so far, including ones React has not
  // rendered yet. Action code that decides from the current state (a post
  // commit, a purchase) reads this one instead of a render that lags.
  const latestStateRef = useRef(state)

  // Reduces the action once against `latestStateRef` and hands React the
  // result. A reducer that throws now throws from `dispatch` instead of from
  // the render, and leaves the state untouched. Also logs each action type in
  // DEV (`debug` is suppressed at INFO and above, so silent in production).
  const dispatch = useCallback((action: GameAction) => {
    if (
      IS_DEV &&
      action &&
      typeof action === 'object' &&
      Object.hasOwn(action, 'type')
    ) {
      logger.debug('GameState', 'dispatch ' + String(action.type))
    }
    const next = gameReducer(latestStateRef.current, action)
    if (next === latestStateRef.current) return
    latestStateRef.current = next
    setState(next)
  }, [])

  // Clean up injection marker after mount (deferred from initGameState to
  // survive React StrictMode's double-invocation of lazy initialisers).
  useEffect(() => {
    safeStorageOperation('removeInjectMarker', () =>
      removeStorageItem(INJECT_MARKER_KEY, storage)
    )

    // Also clean up on page unload to prevent marker persistence if test crashes
    const handleUnload = () => {
      safeStorageOperation('removeInjectMarkerOnUnload', () =>
        removeStorageItem(INJECT_MARKER_KEY, storage)
      )
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [storage])

  // Leaderboard Sync Hook
  useLeaderboardSync(state)

  const storeRef = useRef<GameStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = {
      getState: () => stateRef.current,
      subscribe: (listener: () => void) => {
        listenersRef.current.add(listener)
        return () => {
          listenersRef.current.delete(listener)
        }
      }
    }
  }

  // Notify subscribers whenever state changes (immediately after DOM mutations to prevent tearing)
  useLayoutEffect(() => {
    const listeners = Array.from(listenersRef.current)
    listeners.forEach(listener => listener())
  }, [state])
  const { resetMapGenerationRetries } = useMapGeneration({
    gameMap: state.gameMap,
    runSeed: state.runSeed,
    dispatch,
    tRef
  })

  // Sync Logger with settings on load/change
  useEffect(() => {
    if (state.settings?.logLevel !== undefined) {
      // Same canonical sanitizer the reducer and the global-settings write use,
      // so the live logger level can never diverge from the validated state.
      const { logLevel } = sanitizeSettingsPayload({
        logLevel: state.settings.logLevel
      })
      if (logLevel !== undefined) {
        logger.setLevel(logLevel)
      } else {
        logger.warn(
          'GameState',
          'Rejected persisted invalid logLevel from settings',
          state.settings.logLevel
        )
      }
    }
  }, [state.settings?.logLevel])

  // Actions wrappers using ActionTypes for type safety

  const dispatchValue = useGameDispatchActions({
    dispatch,
    state,
    stateRef,
    latestStateRef,
    tRef,
    resetMapGenerationRetries
  })

  // Expose state to window for debugging/testing
  const dispatchValueRef = useRef(dispatchValue)
  dispatchValueRef.current = dispatchValue

  useEffect(() => {
    // Safely check for DEV environment to avoid crashes in test runners that don't polyfill import.meta.env
    if (IS_DEV) {
      Object.defineProperty(window, 'gameState', {
        configurable: true,
        get: () => ({ ...stateRef.current, ...dispatchValueRef.current })
      })
    }
    return () => {
      delete window.gameState
    }
  }, [])

  return (
    <GameDispatchContext value={dispatchValue}>
      <GameStateContext value={storeRef.current}>{children}</GameStateContext>
    </GameDispatchContext>
  )
}

/**
 * Hook to access stable game actions only.
 *
 * @returns An object containing the bound game action dispatchers.
 */
export const useGameActions = () => {
  return useRequiredContext(GameDispatchContext, 'useGameActions')
}

/**
 * Evaluates whether two unknown values are equal via strict shallow comparison.
 *
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @returns A boolean indicating if the values match identically at the first depth level.
 */
const isShallowEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false
  }
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  if (keysA.length !== keysB.length) return false
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i]
    if (key === undefined) continue
    if (!Object.hasOwn(objB, key) || !Object.is(objA[key], objB[key])) {
      return false
    }
  }
  return true
}

/**
 * Hook to select a specific state slice.
 *
 * @remarks
 * This is the preferred state surface for new code. Note that re-renders are still triggered by any context update; for equality-based bail-out, memoize the consuming component with `React.memo`.
 *
 * @typeParam T - The expected structure of the selected state slice.
 * @param selector - Function to extract the desired state slice.
 * @returns The specific state slice extracted by the selector.
 */
export function useGameSelector<T>(selector: (state: GameState) => T): T {
  const store = useRequiredContext(GameStateContext, 'useGameSelector')
  const instRef = useRef<{
    hasValue: boolean
    state: GameState | null
    selector: ((state: GameState) => T) | null
    value: T | null
  }>({
    hasValue: false,
    state: null,
    selector: null,
    value: null
  })

  const getSnapshot = useCallback(() => {
    const nextState = store.getState()
    const inst = instRef.current

    if (
      inst.hasValue &&
      inst.state === nextState &&
      inst.selector === selector
    ) {
      return inst.value as T
    }

    const nextValue = selector(nextState)

    if (inst.hasValue && isShallowEqual(inst.value, nextValue)) {
      inst.state = nextState
      inst.selector = selector
      return inst.value as T
    }

    inst.hasValue = true
    inst.state = nextState
    inst.selector = selector
    inst.value = nextValue
    return nextValue
  }, [store, selector])

  return useSyncExternalStore(store.subscribe, getSnapshot)
}
