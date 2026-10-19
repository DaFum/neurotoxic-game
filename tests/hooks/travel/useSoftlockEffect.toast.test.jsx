import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('../../../src/utils/mapUtils', () => ({
  checkSoftlock: vi.fn(() => true)
}))
vi.mock('../../../src/utils/travelSoftlockUtils', () => ({
  getSellableAssets: () => [],
  getPostSaleScenarios: () => []
}))
vi.mock('../../../src/utils/assetSelectors', () => ({
  getActiveAssetModifiers: () => ({}),
  getTotalDailyObligations: () => 0
}))
vi.mock('../../../src/utils/travelUtils', () => ({
  getNodeAccessStatus: () => ({ allowed: true })
}))

import { checkSoftlock } from '../../../src/utils/mapUtils'
import { useSoftlockEffect } from '../../../src/hooks/travel/effects/useSoftlockEffect'
import { GAME_PHASES } from '../../../src/context/gameConstants'

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
  const { rerender } = renderHook(
    ({ player }) =>
      useSoftlockEffect({ refs, state, params: { ...base, player } }),
    { initialProps: { player: makePlayer() } }
  )
  return { addToast, saveGame, changeScene, rerender, makePlayer }
}

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
