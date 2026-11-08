import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions,
  useGameSelector
} from '../../src/context/GameState'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { StorageProvider } from '../../src/context/StorageContext'
import { InMemoryAdapter } from '../../src/utils/storageAdapter'
import {
  SAVE_KEY,
  createPersistedState
} from '../../src/context/usePersistence'
import { applyExpeditionRouteAdvance } from '../../src/context/reducers/expeditionReducer'
import { buildExpeditionMap } from '../../src/domain/expedition/map'
import { getEffectiveExpeditionRoute } from '../../src/domain/expedition/routeOverlay'
import { CHASSIS_CONFIG } from '../../src/utils/assets/assetConfig'
import { createFixedClock } from '../../src/utils/clock'
import { nextSeed } from '../../src/utils/seededRng'
import { resetStorageFallback } from '../../src/utils/storage'
import { startedExpeditionState } from '../expeditionBaseFixture.js'

// #3504: provider actions called in the same tick as an earlier dispatch must
// read the reduced state (`latestStateRef`), not the last render (`stateRef`).

const translations = vi.hoisted(() => ({ t: vi.fn(key => key) }))
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: translations.t,
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
}))

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

const renderProvider = (adapter = null) =>
  renderHook(
    () => ({
      actions: useGameActions(),
      toasts: useGameSelector(s => s.toasts),
      day: useGameSelector(s => s.player.day),
      money: useGameSelector(s => s.player.money),
      rngSeed: useGameSelector(s => s.rngSeed),
      activeEventId: useGameSelector(s => s.activeEvent?.id ?? null),
      eventCooldowns: useGameSelector(s => s.eventCooldowns),
      currentScene: useGameSelector(s => s.currentScene),
      rivalBand: useGameSelector(s => s.rivalBand),
      hasMap: useGameSelector(s => s.gameMap !== null),
      expeditionStatus: useGameSelector(s => s.expedition.status),
      currentNodeId: useGameSelector(s => s.player.currentNodeId),
      arrivedOverlay: useGameSelector(s => s.expedition.arrivedOverlay),
      sponsorProvenance: useGameSelector(
        s => s.expedition.preparedSponsorProvenance ?? null
      )
    }),
    {
      wrapper: adapter
        ? ({ children }) => (
            <StorageProvider adapter={adapter}>
              <GameStateProvider>{children}</GameStateProvider>
            </StorageProvider>
          )
        : wrapper
    }
  )

const PROBE_EVENT = { id: 'same_tick_probe', title: 'probe', options: [] }

/**
 * Seeds the provider with an active run standing on a node a Nemesis shortcut
 * converted. No public action sets `arrivedOverlay`, so the state goes in as a
 * screenshot-injected save that `initGameState` hydrates on mount. Fame clears
 * the Festival booking tier, so the converted node is the only refusal.
 */
const injectConvertedNodeSave = () => {
  const started = startedExpeditionState({ fame: 300 })
  const rivalId = started.rivalBand.id
  const rival = started.career.rivalsById[rivalId]
  const atTierTwo = {
    ...started,
    career: {
      ...started.career,
      rivalsById: {
        ...started.career.rivalsById,
        [rivalId]: { ...rival, history: { ...rival.history, nemesisLevel: 2 } }
      }
    }
  }
  const { tourTypeId, regionId } = atTierTwo.expedition.loadout
  const map = buildExpeditionMap(atTierTwo.runSeed, tourTypeId, regionId)
  const [convertedNodeId] = Object.keys(
    getEffectiveExpeditionRoute(atTierTwo, map).subtypeByNodeId
  )
  const travelled = applyExpeditionRouteAdvance(atTierTwo, convertedNodeId)
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(createPersistedState(travelled, createFixedClock(1000)))
  )
  localStorage.setItem('neurotoxic_inject_marker', 'true')
  return {
    convertedNodeId,
    previousNodeId: travelled.expedition.visitedNodeIds.at(-2)
  }
}

describe('same-tick state reads through the real provider', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
    translations.t.mockClear()
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

    expect(
      translations.t.mock.calls
        .filter(([key]) => key === 'ui:day_advance')
        .map(([, options]) => options.day)
    ).toEqual([startDay + 1, startDay + 2])
    expect(result.current.day).toBe(startDay + 2)
    // A stale read rebuilds the second action from the pre-tick seed, so both
    // days roll the same stream and the seed advances only once.
    expect(result.current.rngSeed).toBe(nextSeed(nextSeed(startSeed)))
  })

  test('advanceDay uses a day updated earlier in the same tick for its toast', () => {
    const { result } = renderProvider()
    const day = result.current.day + 10
    act(() => {
      result.current.actions.updatePlayer({ day })
      result.current.actions.advanceDay()
    })
    expect(result.current.day).toBe(day + 1)
    expect(translations.t).toHaveBeenCalledWith('ui:day_advance', {
      day: day + 1
    })
    expect(result.current.toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'ui:day_advance', type: 'info' })
      ])
    )
  })

  test('resolveEvent consumes an event only once in the same tick', () => {
    const { result } = renderProvider()
    act(() => result.current.actions.setActiveEvent(PROBE_EVENT))
    let repeated
    act(() => {
      result.current.actions.resolveEvent({ id: 'ok', outcomeText: 'done' })
      repeated = result.current.actions.resolveEvent({
        id: 'again',
        outcomeText: 'fallback',
        description: 'no active event'
      })
    })
    expect(repeated).toEqual({
      outcomeText: 'fallback',
      description: 'no active event',
      result: null
    })
  })

  test('resolveEvent resolves an event activated earlier in the same tick', () => {
    const { result } = renderProvider()

    act(() => {
      result.current.actions.setActiveEvent(PROBE_EVENT)
      result.current.actions.resolveEvent({ id: 'ok', outcomeText: 'done' })
    })

    expect(result.current.activeEventId).toBeNull()
    expect(Object.hasOwn(result.current.eventCooldowns, PROBE_EVENT.id)).toBe(
      true
    )
  })

  test('every resolveEvent game-over save includes the earlier same-tick dispatch', () => {
    const adapter = new InMemoryAdapter()
    const { result } = renderProvider(adapter)
    const writes = vi.spyOn(adapter, 'set')
    const money = result.current.money + 123
    let repeated = null

    // In one act: update money, activate event, resolve terminal choice with delta,
    // and call a state-dependent action before React renders.
    act(() => {
      result.current.actions.updatePlayer({ money })
      result.current.actions.setActiveEvent(PROBE_EVENT)
      result.current.actions.resolveEvent({
        id: 'doom',
        _precomputedResult: {
          delta: {
            player: { money: -23 },
            flags: { gameOver: true }
          }
        }
      })
      // Second resolution returns fallback:
      repeated = result.current.actions.resolveEvent({
        id: 'again',
        outcomeText: 'fallback',
        description: 'no active event'
      })
      // Call state-dependent action before React renders:
      result.current.actions.updatePlayer(prev => ({
        money: prev.money + 10
      }))
    })

    expect(repeated).toEqual({
      outcomeText: 'fallback',
      description: 'no active event',
      result: null
    })

    // Post-render money reflects the same-tick functional update against latest state
    expect(result.current.money).toBe(money - 23 + 10)

    const saves = writes.mock.calls
      .filter(([key]) => key === SAVE_KEY)
      .map(([, value]) => JSON.parse(value))
    expect(saves.length).toBeGreaterThan(0)
    for (const saved of saves) {
      // Must contain earlier money update (money), event delta (-23), and terminal outcome
      expect(saved.player.money).toBe(money - 23)
      expect(saved.terminalOutcome.reason).toBe('event_game_over')
    }
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

  test('checkStartGig reads a node change made earlier in the same tick', () => {
    const { convertedNodeId, previousNodeId } = injectConvertedNodeSave()
    const { result } = renderProvider()
    expect(result.current.expeditionStatus).toBe('active')
    expect(result.current.arrivedOverlay?.nodeId).toBe(convertedNodeId)
    expect(result.current.currentNodeId).toBe(convertedNodeId)
    expect(typeof previousNodeId).toBe('string')

    const venue = { id: 'same_tick_venue', name: 'Same Tick Venue' }
    const reads = []
    act(() => {
      const { actions } = result.current
      reads.push(actions.checkStartGig(venue))
      actions.updatePlayer({ currentNodeId: previousNodeId })
      reads.push(actions.checkStartGig(venue))
      actions.updatePlayer({ currentNodeId: convertedNodeId })
      reads.push(actions.checkStartGig(venue))
      // Nothing has rendered yet: the last render still stands on the node.
      reads.push(result.current.currentNodeId)
    })

    // A render-snapshot read would refuse all three checks.
    expect(reads).toEqual([
      'node_converted',
      null,
      'node_converted',
      convertedNodeId
    ])
  })
})
