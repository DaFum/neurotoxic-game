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
import { logger, isValidLogLevel } from '../utils/logger'
import { getUnlocks } from '../utils/unlockManager'
import { isLooseRecord } from '../utils/gameState'
import { useLeaderboardSync } from '../hooks/useLeaderboardSync'
import { safeStorageOperation, getSafeStorageItem } from '../utils/storage'

// Import modular state management
import { createInitialState } from './initialState'
import { gameReducer } from './gameReducer'
import { createLoadGameAction } from './actionCreators'
import type { GameState } from '../types'
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
export type { GameDispatchActions }

export type GameStore = {
  getState: () => GameState
  subscribe: (listener: () => void) => () => void
}

type HotGameStateContextStore = typeof globalThis & {
  __NEUROTOXIC_GAME_STATE_CONTEXT__?: Context<GameStore | null>
  __NEUROTOXIC_GAME_DISPATCH_CONTEXT__?: Context<GameDispatchActions | null>
}

const getStableGameStateContext = (): Context<GameStore | null> => {
  const store = globalThis as HotGameStateContextStore
  if (!store.__NEUROTOXIC_GAME_STATE_CONTEXT__) {
    const GameStateContext = createContext<GameStore | null>(null)
    store.__NEUROTOXIC_GAME_STATE_CONTEXT__ = GameStateContext
  }
  return store.__NEUROTOXIC_GAME_STATE_CONTEXT__
}

const getStableGameDispatchContext =
  (): Context<GameDispatchActions | null> => {
    const store = globalThis as HotGameStateContextStore
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

function useRequiredContext<T>(context: Context<T | null>, name: string): T {
  const value = use(context)
  if (value === null) {
    throw new Error(`${name} must be used within GameStateProvider`)
  }
  return value
}

/** Initializes game state with persistent unlocks and optional screenshot-test hydration. */
const initGameState = (): GameState => {
  const unlocks = safeStorageOperation(
    'loadUnlocks',
    () => getUnlocks(),
    [] as string[]
  )
  const freshState = createInitialState({ unlocks })

  // Check for test-injected state (screenshot testing).
  // A special marker key signals the state was placed by the screenshot
  // injection script and should be hydrated on mount.  Normal player
  // saves are loaded explicitly via the MENU → "Load Game" button.
  const shouldHydrate = safeStorageOperation(
    'checkInjectMarker',
    () => localStorage.getItem('neurotoxic_inject_marker') === 'true',
    false
  )

  if (shouldHydrate) {
    // NOTE: Do NOT remove the marker here.  React StrictMode double-invokes
    // lazy initialisers in dev, so removing it on the first call would cause
    // the second (authoritative) call to miss the marker and return INTRO.
    // The marker is cleaned up in a useEffect after mount instead.

    const parsed = getSafeStorageItem<unknown>(SAVE_KEY, null)
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

  const [state, rawDispatch] = useReducer(gameReducer, undefined, initGameState)

  // Dev-only dispatch logging middleware: records each action type before it
  // reduces. Gated by the logger level (`debug` is suppressed at INFO and
  // above), so it is silent in production and changes no behavior — it only
  // forwards to the underlying reducer dispatch with a stable identity.
  const dispatch = useCallback<typeof rawDispatch>(action => {
    if (
      IS_DEV &&
      action &&
      typeof action === 'object' &&
      Object.hasOwn(action, 'type')
    ) {
      logger.debug('GameState', 'dispatch ' + String(action.type))
    }
    rawDispatch(action)
  }, [])

  // Clean up injection marker after mount (deferred from initGameState to
  // survive React StrictMode's double-invocation of lazy initialisers).
  useEffect(() => {
    safeStorageOperation('removeInjectMarker', () =>
      localStorage.removeItem('neurotoxic_inject_marker')
    )

    // Also clean up on page unload to prevent marker persistence if test crashes
    const handleUnload = () => {
      safeStorageOperation('removeInjectMarkerOnUnload', () =>
        localStorage.removeItem('neurotoxic_inject_marker')
      )
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  // Leaderboard Sync Hook
  useLeaderboardSync(state)

  // Use a ref to access the latest state in actions without creating a dependency loop
  // This allows actions to be stable (memoized once) while still accessing current state.
  const stateRef = useRef(state)
  stateRef.current = state

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
    dispatch,
    tRef
  })

  // Sync Logger with settings on load/change
  useEffect(() => {
    if (state.settings?.logLevel !== undefined) {
      const numericLogLevel = Number(state.settings.logLevel)
      if (isValidLogLevel(numericLogLevel)) {
        logger.setLevel(numericLogLevel)
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
 * Hook to access the global game dispatch functions only with a stable reference.
 *
 * @returns An object containing the bound game action dispatchers.
 */
export const useGameDispatch = () => {
  return useRequiredContext(GameDispatchContext, 'useGameDispatch')
}

/**
 * Hook to access stable game actions only.
 *
 * @remarks
 * This is the preferred action surface for new code.
 *
 * @returns An object containing the bound game action dispatchers.
 */
export const useGameActions = () => {
  return useRequiredContext(GameDispatchContext, 'useGameActions')
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
        if (!key) continue
        if (!Object.hasOwn(objB, key) || !Object.is(objA[key], objB[key])) {
          return false
        }
      }
      return true
    }

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
