import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEventSystem } from '../../src/context/useEventSystem'
import { ActionTypes } from '../../src/context/actionTypes'

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
      stateRef: { current: buildUnlockState() },
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
    expect(adapter.keys()).toContain(MARKER_KEY)
    // ...and must not leak into the module-default backend, or a save written
    // through adapter B would reference unlocks stored in adapter A.
    expect(localStorage.getItem(MARKER_KEY)).toBeNull()
  })
})
