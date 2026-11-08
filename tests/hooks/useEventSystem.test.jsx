import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEventSystem } from '../../src/context/useEventSystem'
import { eventEngine } from '../../src/utils/eventEngine'
import { ActionTypes } from '../../src/context/actionTypes'

const hoisted = vi.hoisted(() => ({
  reducerMock: vi.fn()
}))

vi.mock('../../src/context/gameReducer', async importOriginal => {
  const actual = await importOriginal()
  hoisted.reducerMock.mockImplementation((state, action) =>
    actual.gameReducer(state, action)
  )
  return {
    ...actual,
    gameReducer: hoisted.reducerMock
  }
})

describe('useEventSystem.triggerEvent pending-queue drain', () => {
  let dispatch
  let params

  const buildState = overrides => ({
    currentScene: 'OVERWORLD',
    player: { eventsTriggeredToday: 0 },
    pendingEvents: [],
    eventCooldowns: [],
    activeStoryFlags: [],
    band: { members: [], harmony: 50 },
    social: {},
    assets: [],
    ...overrides
  })

  beforeEach(() => {
    dispatch = vi.fn()
    params = {
      stateRef: { current: buildState() },
      dispatch,
      addToast: vi.fn(),
      changeScene: vi.fn(),
      saveGame: vi.fn(),
      tRef: { current: key => key }
    }
    // No dispatch is pending, so rendered and latest state are one ref.
    params.latestStateRef = params.stateRef
  })

  it('pops an unknown queue head and returns false without selecting an event', () => {
    params.stateRef.current = buildState({
      // Unknown head plus a real pending-gated event at [1]: selecting
      // against the stale snapshot would play event_bad_press without
      // popping it (the pop-on-played check compares against the old head).
      pendingEvents: ['removed_in_patch_event', 'event_bad_press']
    })

    const { result } = renderHook(() => useEventSystem(params))
    const triggered = result.current.triggerEvent('special', 'post_gig')

    expect(triggered).toBe(false)
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({
      type: ActionTypes.POP_PENDING_EVENT
    })
  })

  it('pops at most once per queue instance across chained fallback calls', () => {
    params.stateRef.current = buildState({
      pendingEvents: ['removed_in_patch_event', 'event_bad_press']
    })

    const { result } = renderHook(() => useEventSystem(params))
    // Callers chain categories synchronously against the same stale
    // snapshot; only the first call may pop, or valid events behind the
    // unknown head would be drained too.
    result.current.triggerEvent('financial', 'post_gig')
    result.current.triggerEvent('special', 'post_gig')
    result.current.triggerEvent('band', 'post_gig')

    const pops = dispatch.mock.calls.filter(
      ([action]) => action.type === ActionTypes.POP_PENDING_EVENT
    )
    expect(pops).toHaveLength(1)
  })

  it('does not pop known pending event ids', () => {
    params.stateRef.current = buildState({
      currentScene: 'GIG',
      pendingEvents: ['event_bad_press']
    })

    const { result } = renderHook(() => useEventSystem(params))
    // GIG scene exits before the drain; this only asserts no spurious pop.
    result.current.triggerEvent('special', 'post_gig')

    expect(dispatch).not.toHaveBeenCalledWith({
      type: ActionTypes.POP_PENDING_EVENT
    })
  })
})

describe('useEventSystem.triggerEvent daily cap with a corrupt counter', () => {
  const fakeEvent = { id: 'fake_event', options: [] }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setup = eventsTriggeredToday => {
    vi.spyOn(eventEngine, 'checkEvent').mockReturnValue(fakeEvent)
    const dispatch = vi.fn()
    const params = {
      stateRef: {
        current: {
          currentScene: 'OVERWORLD',
          player: { eventsTriggeredToday },
          pendingEvents: [],
          eventCooldowns: [],
          activeStoryFlags: [],
          band: { members: [], harmony: 50 },
          social: {},
          assets: []
        }
      },
      dispatch,
      addToast: vi.fn(),
      changeScene: vi.fn(),
      saveGame: vi.fn(),
      tRef: { current: key => key }
    }
    params.latestStateRef = params.stateRef
    const { result } = renderHook(() => useEventSystem(params))
    return { result, dispatch, params }
  }

  it('recovers a NaN counter to 0 so the increment stays finite', () => {
    const { result, dispatch } = setup(Number.NaN)

    expect(result.current.triggerEvent('special', 'post_gig')).toBe(true)

    const update = dispatch.mock.calls.find(
      ([action]) => action.type === ActionTypes.UPDATE_PLAYER
    )
    expect(update[0].payload.eventsTriggeredToday).toBe(1)
  })

  it('still enforces the cap at 2 for a finite counter', () => {
    const { result } = setup(2)
    expect(result.current.triggerEvent('special', 'post_gig')).toBe(false)
  })

  it('rolls no event once the run has ended (#3499)', () => {
    const { result, dispatch, params } = setup(0)
    params.stateRef.current.currentScene = 'GAMEOVER'
    expect(result.current.triggerEvent('transport')).toBe(false)
    params.stateRef.current.currentScene = 'OVERWORLD'
    params.stateRef.current.terminalOutcome = { type: 'bankruptcy' }
    expect(result.current.triggerEvent('transport')).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
  })
})

describe('useEventSystem unlock persistence honors the injected adapter', () => {
  const UNLOCK_ID = 'test_injected_unlock'
  const MARKER_KEY = `neurotoxic_unlock:${UNLOCK_ID}`

  const buildUnlockState = () => ({
    currentScene: 'OVERWORLD',
    player: { eventsTriggeredToday: 0, day: 1 },
    pendingEvents: [],
    eventCooldowns: [],
    activeStoryFlags: [],
    band: { members: [], harmony: 50 },
    social: {},
    assets: [],
    unlocks: [],
    activeEvent: { id: 'test_event', choices: [] }
  })

  beforeEach(() => {
    localStorage.clear()
  })

  it('writes an event-earned unlock to the provided adapter, not the default', async () => {
    const { StorageProvider } = await import('../../src/context/StorageContext')
    const { InMemoryAdapter } = await import('../../src/utils/storageAdapter')
    const adapter = new InMemoryAdapter()

    const params = {
      latestStateRef: { current: buildUnlockState() },
      dispatch: vi.fn(),
      addToast: vi.fn(),
      changeScene: vi.fn(),
      saveGame: vi.fn(),
      tRef: { current: key => key }
    }

    const { result } = renderHook(() => useEventSystem(params), {
      wrapper: ({ children }) => (
        <StorageProvider adapter={adapter}>{children}</StorageProvider>
      )
    })

    // `_precomputedResult` is resolveEvent's documented bypass of the event
    // engine, so this drives the unlock side effect without a data fixture.
    result.current.resolveEvent({
      _precomputedResult: { delta: { flags: { unlock: UNLOCK_ID } } }
    })

    // The unlock must land in the injected backend...
    expect(adapter.keys()).toEqual({
      ok: true,
      keys: expect.arrayContaining([MARKER_KEY])
    })
    // ...and must not leak into the module-default backend, or a save written
    // through adapter B would reference unlocks stored in adapter A.
    expect(localStorage.getItem(MARKER_KEY)).toBeNull()
  })
})

describe('useEventSystem.triggerEvent DEV ?events=off switch', () => {
  const buildState = () => ({
    currentScene: 'OVERWORLD',
    player: { eventsTriggeredToday: 0 },
    // An unknown head would normally be drained with a dispatch.
    pendingEvents: ['removed_in_patch_event'],
    eventCooldowns: [],
    activeStoryFlags: [],
    band: { members: [], harmony: 50 },
    social: {},
    assets: []
  })
  const buildParams = dispatch => {
    const stateRef = { current: buildState() }
    return {
      stateRef,
      latestStateRef: stateRef,
      dispatch,
      addToast: vi.fn(),
      changeScene: vi.fn(),
      saveGame: vi.fn(),
      tRef: { current: key => key }
    }
  }

  afterEach(() => {
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
  })

  it('rolls no event and dispatches nothing while ?events=off is set', () => {
    window.history.replaceState(null, '', '/?seed=2&events=off')
    const checkEvent = vi.spyOn(eventEngine, 'checkEvent')
    const dispatch = vi.fn()

    const { result } = renderHook(() => useEventSystem(buildParams(dispatch)))

    for (const [category, triggerPoint] of [
      ['transport', 'travel'],
      ['gig', 'gig_intro'],
      ['financial', 'post_gig']
    ]) {
      expect(result.current.triggerEvent(category, triggerPoint)).toBe(false)
    }
    expect(checkEvent).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('keeps rolling events for any other events value', () => {
    window.history.replaceState(null, '', '/?events=on')
    const checkEvent = vi.spyOn(eventEngine, 'checkEvent')
    const dispatch = vi.fn()
    const params = buildParams(dispatch)
    params.stateRef.current = { ...buildState(), pendingEvents: [] }

    const { result } = renderHook(() => useEventSystem(params))
    result.current.triggerEvent('transport', 'travel')

    expect(checkEvent).toHaveBeenCalledTimes(1)
  })
})

describe('useEventSystem.resolveEvent provider-contract regression tests', () => {
  const UNLOCK_ID = 'test_regression_unlock'
  let latestStateRef
  let timeline
  let oneShotThrowActionType
  let toastThrow
  let sceneThrow
  let dispatch
  let addToast
  let changeScene
  let saveGame
  let storage
  let params

  const buildInitialState = (overrides = {}) => ({
    currentScene: 'OVERWORLD',
    player: { eventsTriggeredToday: 0, day: 1, money: 500 },
    pendingEvents: [],
    eventCooldowns: [],
    activeStoryFlags: [],
    activeQuests: [],
    band: { members: [], harmony: 50 },
    social: {},
    assets: [],
    unlocks: [],
    toasts: [],
    activeEvent: { id: 'evt_regression', choices: [] },
    ...overrides
  })

  beforeEach(async () => {
    timeline = []
    oneShotThrowActionType = null
    toastThrow = false
    sceneThrow = false

    const { InMemoryAdapter } = await import('../../src/utils/storageAdapter')
    const realStorage = new InMemoryAdapter()
    storage = {
      get: key => realStorage.get(key),
      set: (key, val) => {
        timeline.push(`storage:set:${key}`)
        return realStorage.set(key, val)
      },
      remove: key => realStorage.remove(key),
      clear: () => realStorage.clear(),
      keys: () => realStorage.keys()
    }

    latestStateRef = { current: buildInitialState() }

    // Dispatcher following GameStateProvider publication contract:
    // calls real gameReducer against latestStateRef.current and publishes only changed reference
    const { gameReducer: actualReducer } =
      await import('../../src/context/gameReducer')
    dispatch = vi.fn(action => {
      timeline.push(`dispatch:${action?.type}`)
      if (oneShotThrowActionType && action?.type === oneShotThrowActionType) {
        oneShotThrowActionType = null
        throw new Error(`One-shot dispatch throw on ${action.type}`)
      }
      const next = actualReducer(latestStateRef.current, action)
      if (next !== latestStateRef.current) {
        latestStateRef.current = next
      }
    })

    addToast = vi.fn((message, type) => {
      timeline.push(`toast:${type}:${message}`)
      if (
        toastThrow &&
        type === 'error' &&
        String(message).includes('GAME_OVER_')
      ) {
        toastThrow = false
        throw new Error('One-shot toast throw on gameOverToast')
      }
    })

    changeScene = vi.fn(scene => {
      timeline.push(`scene:${scene}`)
      if (sceneThrow) {
        sceneThrow = false
        throw new Error('One-shot scene throw on changeScene')
      }
    })

    saveGame = vi.fn((showToast, stateSnapshot) => {
      timeline.push(`saveGame:${Boolean(showToast)}`)
      params.lastSavedSnapshot = stateSnapshot
    })

    params = {
      latestStateRef,
      dispatch,
      addToast,
      changeScene,
      saveGame,
      tRef: {
        current: (key, opts) => {
          if (opts?.defaultValue) return opts.defaultValue
          if (opts?.unlock) return `UNLOCKED_${opts.unlock}`
          if (opts?.description) return `GAME_OVER_${opts.description}`
          return key
        }
      },
      lastSavedSnapshot: null
    }

    hoisted.reducerMock.mockClear()
  })

  it('single reduction and synchronous snapshot reads on game-over choice with delta, quest, and unlock', async () => {
    const { StorageProvider } = await import('../../src/context/StorageContext')
    const { result } = renderHook(() => useEventSystem(params), {
      wrapper: ({ children }) => (
        <StorageProvider adapter={storage}>{children}</StorageProvider>
      )
    })

    // StrictMode can run initialization twice; clear reducer calls after mount/setup
    hoisted.reducerMock.mockClear()

    const resolutionResult = result.current.resolveEvent({
      _precomputedResult: {
        result: null,
        delta: {
          player: { money: -50 },
          flags: {
            gameOver: true,
            addQuest: [{ id: 'quest_doom', deadlineOffset: 2 }],
            unlock: UNLOCK_ID
          }
        },
        description: 'doom_desc'
      }
    })

    expect(resolutionResult.result).toBeNull()

    // Assert one root reducer call per resolver action and that each call receives previous call's result
    const reducerCalls = hoisted.reducerMock.mock.calls
    expect(reducerCalls.length).toBe(dispatch.mock.calls.length)
    expect(reducerCalls.length).toBeGreaterThan(0)
    for (let i = 0; i < reducerCalls.length; i++) {
      const [inputState, action] = reducerCalls[i]
      expect(action).toBe(dispatch.mock.calls[i][0])
      if (i > 0) {
        const previousCallResult = hoisted.reducerMock.mock.results[i - 1].value
        expect(inputState).toBe(previousCallResult)
      }
    }

    // Assert that the saved snapshot equals the ref after the last action
    expect(params.lastSavedSnapshot).toBe(latestStateRef.current)

    // Assert saved snapshot contains delta, quest, unlock, terminal outcome, cleared event, but not side-effect toasts
    expect(params.lastSavedSnapshot.player.money).toBe(450)
    expect(params.lastSavedSnapshot.activeQuests).toEqual([
      expect.objectContaining({ id: 'quest_doom', deadline: 3 })
    ])
    expect(params.lastSavedSnapshot.unlocks).toContain(UNLOCK_ID)
    expect(params.lastSavedSnapshot.terminalOutcome).toEqual({
      reason: 'event_game_over',
      eventId: 'evt_regression'
    })
    expect(params.lastSavedSnapshot.activeEvent).toBeNull()
    expect(params.lastSavedSnapshot.toasts).toEqual([])

    // Assert the timeline: dispatches, unlock persistence, unlock toast, game-over toast, save, scene change
    expect(timeline).toEqual([
      'dispatch:APPLY_EVENT_DELTA',
      'dispatch:ADD_QUEST',
      'dispatch:ADD_UNLOCK',
      'dispatch:SET_TERMINAL_OUTCOME',
      'dispatch:SET_ACTIVE_EVENT',
      `storage:set:neurotoxic_unlock:${UNLOCK_ID}`,
      'storage:set:neurotoxic_unlocks',
      `toast:success:UNLOCKED_${UNLOCK_ID.toUpperCase()}`,
      'toast:error:GAME_OVER_doom_desc',
      'saveGame:false',
      'scene:GAMEOVER'
    ])
  })

  it('no-op continuation when eventCooldowns is seeded: ADD_COOLDOWN returns same root ref, SET_ACTIVE_EVENT(null) runs with that ref, outcome toast runs', async () => {
    const { StorageProvider } = await import('../../src/context/StorageContext')
    // Seed eventCooldowns with the event ID in normal state
    // Unlock day far ahead, so ADD_COOLDOWN has nothing to extend.
    latestStateRef.current.eventCooldowns = { evt_regression: 999 }

    const { result } = renderHook(() => useEventSystem(params), {
      wrapper: ({ children }) => (
        <StorageProvider adapter={storage}>{children}</StorageProvider>
      )
    })

    hoisted.reducerMock.mockClear()

    result.current.resolveEvent({
      id: 'opt1',
      outcomeText: 'event:peaceful_resolution',
      _precomputedResult: {
        outcomeText: 'event:peaceful_resolution'
      }
    })

    // ADD_COOLDOWN returned same reference
    const cooldownCallIdx = dispatch.mock.calls.findIndex(
      ([a]) => a.type === 'ADD_COOLDOWN'
    )
    const clearCallIdx = dispatch.mock.calls.findIndex(
      ([a]) => a.type === 'SET_ACTIVE_EVENT' && a.payload === null
    )
    expect(cooldownCallIdx).toBeGreaterThanOrEqual(0)
    expect(clearCallIdx).toBeGreaterThan(cooldownCallIdx)

    const cooldownResult =
      hoisted.reducerMock.mock.results[cooldownCallIdx].value
    const clearInput = hoisted.reducerMock.mock.calls[clearCallIdx][0]
    expect(clearInput).toBe(cooldownResult)

    // Outcome toast ran
    expect(addToast).toHaveBeenCalledWith('event:peaceful_resolution', 'info')
  })

  it('throw once on later dispatch: earlier actions remain published, failed/later actions do not publish, no resolver side effects run, catch order preserved', async () => {
    const { StorageProvider } = await import('../../src/context/StorageContext')
    const { result } = renderHook(() => useEventSystem(params), {
      wrapper: ({ children }) => (
        <StorageProvider adapter={storage}>{children}</StorageProvider>
      )
    })

    hoisted.reducerMock.mockClear()
    // Fail on ADD_UNLOCK (which is after APPLY_EVENT_DELTA)
    oneShotThrowActionType = 'ADD_UNLOCK'

    const res = result.current.resolveEvent({
      _precomputedResult: {
        result: null,
        delta: {
          player: { money: -50 },
          flags: {
            gameOver: true,
            unlock: UNLOCK_ID
          }
        },
        description: 'doom'
      }
    })

    // Earlier action (APPLY_EVENT_DELTA) was published and remains published
    expect(latestStateRef.current.player.money).toBe(450)
    // Failed action (ADD_UNLOCK) and later actions (SET_TERMINAL_OUTCOME, etc.) did not publish to latestStateRef
    expect(latestStateRef.current.unlocks).not.toContain(UNLOCK_ID)
    expect(latestStateRef.current.terminalOutcome).toBeUndefined()

    // No resolver side effects ran (no unlock persistence, toasts, save, or scene change)
    expect(saveGame).not.toHaveBeenCalled()
    expect(changeScene).not.toHaveBeenCalled()

    // Catch order: error log, ui:event_error toast, event-clear dispatch, fallback with result: null
    expect(res).toEqual({
      outcomeText: '',
      description: '',
      result: null
    })
    expect(addToast).toHaveBeenCalledWith('ui:event_error', 'error')
    expect(latestStateRef.current.activeEvent).toBeNull()

    // Assert relative catch order in timeline: failed dispatch, error toast, event-clear dispatch
    expect(timeline).toEqual([
      'dispatch:APPLY_EVENT_DELTA',
      'dispatch:ADD_UNLOCK',
      'toast:error:ui:event_error',
      'dispatch:SET_ACTIVE_EVENT'
    ])
  })

  it('throw once from game-over toast: all actions published, saveGame and changeScene do not run, catch order occurs', async () => {
    const { StorageProvider } = await import('../../src/context/StorageContext')
    const { result } = renderHook(() => useEventSystem(params), {
      wrapper: ({ children }) => (
        <StorageProvider adapter={storage}>{children}</StorageProvider>
      )
    })

    hoisted.reducerMock.mockClear()
    toastThrow = true

    const res = result.current.resolveEvent({
      _precomputedResult: {
        delta: {
          player: { money: -50 },
          flags: {
            gameOver: true
          }
        },
        description: 'doom'
      }
    })

    // All actions were published
    expect(latestStateRef.current.player.money).toBe(450)
    expect(latestStateRef.current.terminalOutcome).toBeDefined()
    expect(latestStateRef.current.activeEvent).toBeNull()

    // saveGame and changeScene did not run
    expect(saveGame).not.toHaveBeenCalled()
    expect(changeScene).not.toHaveBeenCalled()

    // Catch order occurred
    expect(addToast).toHaveBeenCalledWith('ui:event_error', 'error')
    expect(res).toEqual({
      outcomeText: '',
      description: '',
      result: null
    })

    // Assert relative catch order in timeline: all resolution dispatches, failed toast, error toast, event-clear dispatch
    expect(timeline).toEqual([
      'dispatch:APPLY_EVENT_DELTA',
      'dispatch:SET_TERMINAL_OUTCOME',
      'dispatch:SET_ACTIVE_EVENT',
      'toast:error:GAME_OVER_doom',
      'toast:error:ui:event_error',
      'dispatch:SET_ACTIVE_EVENT'
    ])
  })

  it('throw once from changeScene: saveGame already ran with the fixed snapshot', async () => {
    const { StorageProvider } = await import('../../src/context/StorageContext')
    const { result } = renderHook(() => useEventSystem(params), {
      wrapper: ({ children }) => (
        <StorageProvider adapter={storage}>{children}</StorageProvider>
      )
    })

    hoisted.reducerMock.mockClear()
    sceneThrow = true

    const res = result.current.resolveEvent({
      _precomputedResult: {
        delta: {
          player: { money: -50 },
          flags: {
            gameOver: true
          }
        },
        description: 'doom'
      }
    })

    // saveGame already ran with the fixed snapshot
    expect(saveGame).toHaveBeenCalledTimes(1)
    expect(params.lastSavedSnapshot.player.money).toBe(450)
    expect(params.lastSavedSnapshot.terminalOutcome).toBeDefined()

    // Catch order occurred after changeScene threw
    expect(addToast).toHaveBeenCalledWith('ui:event_error', 'error')
    expect(res.result).toBeNull()
  })

  it('for already persisted unlock, no new unlock toast appears', async () => {
    const { StorageProvider } = await import('../../src/context/StorageContext')
    // Pre-populate storage with the unlock
    await storage.set(`neurotoxic_unlock:${UNLOCK_ID}`, 'true')

    const { result } = renderHook(() => useEventSystem(params), {
      wrapper: ({ children }) => (
        <StorageProvider adapter={storage}>{children}</StorageProvider>
      )
    })

    hoisted.reducerMock.mockClear()
    // Observe only events emitted by the resolution itself
    timeline = []

    result.current.resolveEvent({
      _precomputedResult: {
        delta: {
          flags: {
            unlock: UNLOCK_ID
          }
        }
      }
    })

    // Resolution completed without the error path and still dispatched the unlock
    expect(timeline).not.toContain('toast:error:ui:event_error')
    expect(timeline).toContain('dispatch:ADD_UNLOCK')

    // No unlock toast appeared because addUnlock returned false (already exists)
    const unlockToastCall = addToast.mock.calls.find(
      ([msg, type]) => type === 'success' && String(msg).includes('UNLOCKED_')
    )
    expect(unlockToastCall).toBeUndefined()
  })
})
