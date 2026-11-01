import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('../../../src/utils/mapUtils', () => ({
  checkSoftlock: vi.fn(() => true)
}))
vi.mock('../../../src/utils/travelSoftlockUtils', () => ({
  getSellableAssets: () => [],
  getPostSaleScenarios: () => []
}))
vi.mock('../../../src/utils/assets/assetSelectors', () => ({
  getActiveAssetModifiers: () => ({}),
  getTotalDailyObligations: () => 0
}))
vi.mock('../../../src/utils/travelUtils', () => ({
  getNodeAccessStatus: () => ({ allowed: true })
}))

import { checkSoftlock } from '../../../src/utils/mapUtils'
import { useSoftlockEffect } from '../../../src/hooks/travel/effects/useSoftlockEffect'
import { GAME_PHASES } from '../../../src/context/gameConstants'
import { logger } from '../../../src/utils/logger'

// A stranded player gets one "GAME OVER: Stranded!" toast per softlock
// episode, even when the effect re-runs because a dependency (e.g. a fresh
// `player` object) changed identity during the countdown.
const renderSoftlock = () => {
  const addToast = vi.fn()
  const saveGame = vi.fn()
  const changeScene = vi.fn()
  const refs = { timeoutRef: { current: null } }
  const state = { isTraveling: false }
  const base = {
    gameMap: { nodes: {}, connections: [] },
    band: {},
    social: {},
    assets: [],
    liabilities: [],
    addToast,
    saveGame,
    changeScene,
    venueBlacklist: [],
    reputationByRegion: {}
  }
  const makePlayer = () => ({ currentNodeId: 'node_0', day: 1, money: 0 })
  // Rerender props may swap the callbacks to model a parent handing down new
  // `saveGame` / `changeScene` identities mid-countdown.
  const { rerender, unmount } = renderHook(
    ({ player, ...callbacks }) =>
      useSoftlockEffect({
        refs,
        state,
        params: { ...base, ...callbacks, player }
      }),
    { initialProps: { player: makePlayer() } }
  )
  return { addToast, saveGame, changeScene, rerender, unmount, makePlayer }
}

describe('useSoftlockEffect fuel pricing', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  test('prices the live stranded check with the expedition fuel multiplier', () => {
    const refs = { timeoutRef: { current: null } }
    const { unmount } = renderHook(() =>
      useSoftlockEffect({
        refs,
        state: { isTraveling: false },
        params: {
          gameMap: { nodes: {}, connections: [] },
          player: { currentNodeId: 'node_0', day: 1, money: 0 },
          band: {},
          social: {},
          assets: [],
          liabilities: [],
          addToast: vi.fn(),
          saveGame: vi.fn(),
          changeScene: vi.fn(),
          venueBlacklist: [],
          reputationByRegion: {},
          expeditionFuelMultiplier: 0.85
        }
      })
    )
    expect(checkSoftlock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ fuelMultiplier: 0.85 })
    )
    unmount()
  })

  test('hands the social slice to the rest-income escape', () => {
    const social = { youtube: 50000 }
    const { unmount } = renderHook(() =>
      useSoftlockEffect({
        refs: { timeoutRef: { current: null } },
        state: { isTraveling: false },
        params: {
          gameMap: { nodes: {}, connections: [] },
          player: { currentNodeId: 'node_0', day: 1, money: 0 },
          band: {},
          social,
          assets: [],
          liabilities: [],
          addToast: vi.fn(),
          saveGame: vi.fn(),
          changeScene: vi.fn(),
          venueBlacklist: [],
          reputationByRegion: {}
        }
      })
    )
    expect(checkSoftlock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ restRecovery: { social } })
    )
    unmount()
  })
})

describe('useSoftlockEffect during an active run', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('leaves the stranding to the run, so the Career is not ended over its crisis', () => {
    const changeScene = vi.fn()
    const refs = { timeoutRef: { current: null } }
    const { unmount } = renderHook(() =>
      useSoftlockEffect({
        refs,
        state: { isTraveling: false },
        params: {
          gameMap: { nodes: {}, connections: [] },
          player: { currentNodeId: 'node_0', day: 1, money: 0 },
          band: {},
          social: {},
          assets: [],
          liabilities: [],
          addToast: vi.fn(),
          saveGame: vi.fn(),
          changeScene,
          venueBlacklist: [],
          reputationByRegion: {},
          expeditionStatus: 'active'
        }
      })
    )
    vi.advanceTimersByTime(10000)
    expect(changeScene).not.toHaveBeenCalled()
    expect(refs.timeoutRef.current).toBeNull()
    unmount()
  })
})

describe('useSoftlockEffect when a run starts during the countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('cancels a stranding countdown that is already running', () => {
    const changeScene = vi.fn()
    const refs = { timeoutRef: { current: null } }
    const makeParams = expeditionStatus => ({
      gameMap: { nodes: {}, connections: [] },
      player: { currentNodeId: 'node_0', day: 1, money: 0 },
      band: {},
      social: {},
      assets: [],
      liabilities: [],
      addToast: vi.fn(),
      saveGame: vi.fn(),
      changeScene,
      venueBlacklist: [],
      reputationByRegion: {},
      expeditionStatus
    })
    const { rerender, unmount } = renderHook(
      ({ expeditionStatus }) =>
        useSoftlockEffect({
          refs,
          state: { isTraveling: false },
          params: makeParams(expeditionStatus)
        }),
      { initialProps: { expeditionStatus: 'idle' } }
    )
    // Stranded outside a run: the countdown is running.
    expect(refs.timeoutRef.current).not.toBeNull()

    // A run takes over the stranding; the pending Career game over is cancelled.
    rerender({ expeditionStatus: 'active' })
    expect(refs.timeoutRef.current).toBeNull()
    vi.advanceTimersByTime(10000)
    expect(changeScene).not.toHaveBeenCalled()
    unmount()
  })
})

describe('useSoftlockEffect stranded toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(checkSoftlock).mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('toasts once when a dependency changes during the countdown', () => {
    const { addToast, rerender, makePlayer } = renderSoftlock()
    vi.advanceTimersByTime(1000)
    rerender({ player: makePlayer() })

    expect(addToast).toHaveBeenCalledTimes(1)
  })

  test('saves and routes to GAMEOVER once after the countdown', () => {
    const { saveGame, changeScene, rerender, makePlayer } = renderSoftlock()
    vi.advanceTimersByTime(1000)
    rerender({ player: makePlayer() })
    vi.advanceTimersByTime(3000)

    expect(saveGame).toHaveBeenCalledTimes(1)
    expect(saveGame).toHaveBeenCalledWith(false)
    expect(changeScene).toHaveBeenCalledTimes(1)
    expect(changeScene).toHaveBeenCalledWith(GAME_PHASES.GAMEOVER)
  })

  test('toasts again for a new episode after recovering', () => {
    const { addToast, changeScene, rerender, makePlayer } = renderSoftlock()
    expect(addToast).toHaveBeenCalledTimes(1)

    vi.mocked(checkSoftlock).mockReturnValue(false)
    rerender({ player: makePlayer() })
    expect(addToast).toHaveBeenCalledTimes(1)

    vi.mocked(checkSoftlock).mockReturnValue(true)
    rerender({ player: makePlayer() })
    expect(addToast).toHaveBeenCalledTimes(2)
    expect(changeScene).not.toHaveBeenCalled()
  })
})

// The 3s countdown is anchored to the start of the stranded episode: a
// dependency change mid-countdown must neither cancel nor restart it.
describe('useSoftlockEffect stranded countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(checkSoftlock).mockReturnValue(true)
    vi.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.mocked(logger.error).mockRestore()
    vi.clearAllMocks()
  })

  test('a dependency change does not restart the countdown', () => {
    const { changeScene, rerender, makePlayer } = renderSoftlock()
    vi.advanceTimersByTime(2000)
    rerender({ player: makePlayer() })
    vi.advanceTimersByTime(1000)

    expect(changeScene).toHaveBeenCalledTimes(1)
    expect(changeScene).toHaveBeenCalledWith(GAME_PHASES.GAMEOVER)
  })

  test('unmounting clears the countdown', () => {
    const { saveGame, changeScene, unmount } = renderSoftlock()
    unmount()
    vi.advanceTimersByTime(5000)

    expect(saveGame).not.toHaveBeenCalled()
    expect(changeScene).not.toHaveBeenCalled()
  })

  test('recovering clears the countdown', () => {
    const { changeScene, rerender, makePlayer } = renderSoftlock()
    vi.mocked(checkSoftlock).mockReturnValue(false)
    rerender({ player: makePlayer() })
    vi.advanceTimersByTime(5000)

    expect(changeScene).not.toHaveBeenCalled()
  })

  test('the countdown calls the latest saveGame and changeScene', () => {
    const { saveGame, changeScene, rerender, makePlayer } = renderSoftlock()
    const nextSaveGame = vi.fn()
    const nextChangeScene = vi.fn()
    vi.advanceTimersByTime(1000)
    rerender({
      player: makePlayer(),
      saveGame: nextSaveGame,
      changeScene: nextChangeScene
    })
    vi.advanceTimersByTime(2000)

    expect(saveGame).not.toHaveBeenCalled()
    expect(changeScene).not.toHaveBeenCalled()
    expect(nextSaveGame).toHaveBeenCalledTimes(1)
    expect(nextSaveGame).toHaveBeenCalledWith(false)
    expect(nextChangeScene).toHaveBeenCalledTimes(1)
    expect(nextChangeScene).toHaveBeenCalledWith(GAME_PHASES.GAMEOVER)
  })

  test('logs the stranded game over once per episode', () => {
    const { rerender, makePlayer } = renderSoftlock()
    vi.advanceTimersByTime(1000)
    rerender({ player: makePlayer() })
    vi.advanceTimersByTime(1000)
    rerender({ player: makePlayer() })

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      'TravelLogic',
      'GAME OVER: Stranded'
    )
  })
})
