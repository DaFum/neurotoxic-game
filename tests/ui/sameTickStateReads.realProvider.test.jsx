import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { SAVE_KEY } from '../../src/context/usePersistence'
import { CHASSIS_CONFIG } from '../../src/utils/assets/assetConfig'
import { nextSeed } from '../../src/utils/seededRng'
import { resetStorageFallback } from '../../src/utils/storage'

// #3504: provider actions called in the same tick as an earlier dispatch must
// read the reduced state (`latestStateRef`), not the last render (`stateRef`).

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

const renderProvider = () =>
  renderHook(
    () => ({
      actions: useGameActions(),
      day: useGameSelector(s => s.player.day),
      money: useGameSelector(s => s.player.money),
      rngSeed: useGameSelector(s => s.rngSeed),
      activeEventId: useGameSelector(s => s.activeEvent?.id ?? null),
      eventCooldowns: useGameSelector(s => s.eventCooldowns),
      currentScene: useGameSelector(s => s.currentScene),
      rivalBand: useGameSelector(s => s.rivalBand),
      hasMap: useGameSelector(s => s.gameMap !== null),
      expeditionStatus: useGameSelector(s => s.expedition.status),
      sponsorProvenance: useGameSelector(
        s => s.expedition.preparedSponsorProvenance ?? null
      )
    }),
    { wrapper }
  )

const PROBE_EVENT = { id: 'same_tick_probe', title: 'probe', options: [] }

describe('same-tick state reads through the real provider', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetStorageFallback()
    localStorage.clear()
  })

  test('advanceDay after an earlier advanceDay in the same tick advances the RNG seed twice', () => {
    const { result } = renderProvider()
    const startDay = result.current.day
    const startSeed = result.current.rngSeed

    act(() => {
      result.current.actions.advanceDay()
      result.current.actions.advanceDay()
    })

    expect(result.current.day).toBe(startDay + 2)
    // A stale read rebuilds the second action from the pre-tick seed, so both
    // days roll the same stream and the seed advances only once.
    expect(result.current.rngSeed).toBe(nextSeed(nextSeed(startSeed)))
  })

  test('resolveEvent resolves an event activated earlier in the same tick', () => {
    const { result } = renderProvider()

    act(() => {
      result.current.actions.setActiveEvent(PROBE_EVENT)
      result.current.actions.resolveEvent({ id: 'ok', outcomeText: 'done' })
    })

    expect(result.current.activeEventId).toBeNull()
    expect(result.current.eventCooldowns).toContain(PROBE_EVENT.id)
  })

  test('resolveEvent saves a game-over snapshot that includes an earlier same-tick dispatch', () => {
    const { result } = renderProvider()
    act(() => {
      result.current.actions.setActiveEvent(PROBE_EVENT)
    })
    const money = result.current.money + 123

    act(() => {
      result.current.actions.updatePlayer({ money })
      result.current.actions.resolveEvent({
        id: 'doom',
        _precomputedResult: { delta: { flags: { gameOver: true } } }
      })
    })

    expect(result.current.money).toBe(money)
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')
    expect(saved?.player?.money).toBe(money)
    expect(saved?.terminalOutcome?.reason).toBe('event_game_over')
  })

  test('saveGame without a snapshot saves an earlier same-tick dispatch', () => {
    const { result } = renderProvider()
    const money = result.current.money + 321

    act(() => {
      result.current.actions.updatePlayer({ money })
      result.current.actions.saveGame(false)
    })

    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')
    expect(saved?.player?.money).toBe(money)
  })

  test('endGig follows a practice gig set earlier in the same tick', () => {
    const { result } = renderProvider()

    act(() => {
      result.current.actions.setCurrentGig({
        id: 'same_tick_practice',
        isPractice: true,
        sourceScene: GAME_PHASES.MENU
      })
      result.current.actions.endGig()
    })

    // A stale read sees no gig and routes to POST_GIG instead of back to MENU.
    expect(result.current.currentScene).toBe(GAME_PHASES.MENU)
  })

  test('moveRivalBand keeps an earlier same-tick rival update', () => {
    const { result } = renderProvider()
    act(() => {
      result.current.actions.spawnRivalBand()
    })
    expect(result.current.rivalBand).not.toBeNull()
    expect(result.current.hasMap).toBe(true)
    const powerLevel = result.current.rivalBand.powerLevel + 7

    act(() => {
      result.current.actions.updateRivalBand({ powerLevel })
      result.current.actions.moveRivalBand()
    })

    // A stale read rebuilds the moved rival from the pre-tick one and drops
    // the update.
    expect(result.current.rivalBand.powerLevel).toBe(powerLevel)
  })

  test('purchaseChassis accepts a purchase funded earlier in the same tick', () => {
    const { result } = renderProvider()
    const price = CHASSIS_CONFIG.studio_chassis.legit[1].price
    expect(result.current.money).toBeLessThan(price)

    let accepted = null
    act(() => {
      result.current.actions.updatePlayer({ money: price + 1 })
      accepted = result.current.actions.purchaseChassis({
        kind: 'studio_chassis',
        flavor: 'legit',
        tier: 1,
        mode: 'cash'
      })
    })

    // A stale read checks the pre-tick cash and refuses as unaffordable.
    expect(accepted).toBe(true)
    expect(result.current.money).toBe(1)
  })

  test('prepareExpeditionSponsorOffers stages offers for a run prepared earlier in the same tick', () => {
    const { result } = renderProvider()

    act(() => {
      result.current.actions.prepareExpeditionRun()
      result.current.actions.prepareExpeditionSponsorOffers()
    })

    expect(result.current.expeditionStatus).toBe('prepared')
    // A stale read sends the pre-prepare run seed, which the reducer refuses.
    expect(result.current.sponsorProvenance).not.toBeNull()
  })
})
