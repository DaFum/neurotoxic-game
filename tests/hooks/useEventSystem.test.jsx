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
