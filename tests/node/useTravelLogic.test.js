import {
  test,
  describe,
  before,
  after,
  beforeEach,
  afterEach,
  mock
} from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'
import {
  mockTravelLogicDependencies,
  createTravelLogicProps,
  setupTravelLogicTest,
  assertActionSuccess,
  assertTravelPrevented,
  setupTravelScenario,
  resetTravelLogicMockState
} from '../useTravelLogicTestUtils'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

const {
  mockCalculateTravelExpenses,
  mockCalculateRefuelCost,
  mockAudioManager,
  mockCalculateGuaranteedDailyCost,
  mockGetTotalDailyObligations,
  mockLogger,
  mockHandleError,
  setEnsureAudioContextResult
} = mockTravelLogicDependencies

const travelFuelModuleId = 'test_travel_fuel_discount'
const originalTravelFuelModule = MODULE_REGISTRY[travelFuelModuleId]

const createObligationAsset = overrides => ({
  id: 'asset_obligation',
  kind: 'tourbus_chassis',
  chassisFlavor: 'legit',
  chassisTier: 1,
  condition: 100,
  baseUpkeep: 40,
  baseDailyRevenue: 10,
  slots: [],
  acquiredOnDay: 1,
  acquisitionMode: 'cash',
  baseRiskEventChance: 0,
  ...overrides
})

const createLiability = overrides => ({
  id: 'liability_obligation',
  source: 'loan',
  assetId: 'asset_obligation',
  principalRemaining: 1000,
  interestRate: 0.05,
  dailyPayment: 25,
  termDaysRemaining: 60,
  defaultCounter: 0,
  ...overrides
})

const { useTravelLogic } = await setupTravelLogicTest()

describe('useTravelLogic', () => {
  before(() => {
    setupJSDOM()
  })

  after(() => {
    if (originalTravelFuelModule === undefined) {
      delete MODULE_REGISTRY[travelFuelModuleId]
    } else {
      MODULE_REGISTRY[travelFuelModuleId] = originalTravelFuelModule
    }
    teardownJSDOM()
  })

  beforeEach(() => {
    resetTravelLogicMockState()
    mockCalculateTravelExpenses.mock.resetCalls()
    mockCalculateRefuelCost.mock.resetCalls()
    mockCalculateGuaranteedDailyCost.mock.resetCalls()
    mockGetTotalDailyObligations.mock.resetCalls()
    mockCalculateTravelExpenses.mock.mockImplementation(() => ({
      dist: 100,
      totalCost: 50,
      fuelLiters: 10
    }))
    setEnsureAudioContextResult(true)
    mockAudioManager.ensureAudioContext.mock.resetCalls()
    mockAudioManager.playSFX.mock.resetCalls()
    mockLogger.info.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockLogger.debug.mock.resetCalls()
    mockHandleError.mock.resetCalls()
  })

  afterEach(() => {
    cleanup()
  })

  test('initial state', () => {
    const props = createTravelLogicProps()
    const { result } = renderHook(() => useTravelLogic(props))

    assert.equal(result.current.isTraveling, false)
    assert.equal(result.current.travelTarget, null)
  })

  test('handleTravel initiates travel when valid', async () => {
    const { result, targetNode } = setupTravelScenario(useTravelLogic)

    // First click: sets pending state
    act(() => {
      result.current.handleTravel(targetNode)
    })

    // Second click: confirms travel
    await act(async () => {
      result.current.handleTravel(targetNode)
      // wait for audio promise
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    assert.equal(result.current.isTraveling, true)
    assert.deepEqual(result.current.travelTarget, targetNode)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 1)
    assert.equal(mockAudioManager.playSFX.mock.calls[0].arguments[0], 'travel')
  })

  test('handleTravel confirmation includes travel, upkeep, and total cash impact', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        money: 1000,
        fameLevel: 3,
        currentNodeId: 'node_start',
        van: { fuel: 50, condition: 80 },
        totalTravels: 0
      },
      band: { members: [{}, {}, {}], harmony: 50 },
      assets: [createObligationAsset()],
      liabilities: { l1: createLiability({ id: 'l1' }) }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    const toastMessage = props.addToast.mock.calls[0].arguments[0]
    assert.match(toastMessage, /Travel Costs: €50/)
    assert.match(toastMessage, /Daily Upkeep: €210/)
    assert.match(toastMessage, /Total Cash Impact: €260/)
  })

  test('handleTravel confirmation passes social state into total daily obligations', () => {
    mockGetTotalDailyObligations.mock.mockImplementation(state =>
      state.social.youtube >= 10000 ? 42 : 155
    )
    const social = { youtube: 20000 }
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        money: 1000,
        fameLevel: 3,
        currentNodeId: 'node_start',
        van: { fuel: 50, condition: 80 },
        totalTravels: 0
      },
      band: { members: [{}, {}, {}], harmony: 50 },
      social
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(
      mockGetTotalDailyObligations.mock.calls[0].arguments[0].social,
      social
    )
    const toastMessage = props.addToast.mock.calls[0].arguments[0]
    assert.match(toastMessage, /Daily Upkeep: €42/)
    assert.match(toastMessage, /Total Cash Impact: €92/)
  })

  test('onTravelComplete passes social state into total daily obligations', () => {
    mockGetTotalDailyObligations.mock.mockImplementation(state =>
      state.social.youtube >= 10000 ? 42 : 155
    )
    const social = { youtube: 20000 }
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        money: 1000,
        fameLevel: 3,
        currentNodeId: 'node_start',
        van: { fuel: 50, condition: 80 },
        totalTravels: 0
      },
      band: { members: [{}, {}, {}], harmony: 50 },
      social
    })

    act(() => {
      result.current.onTravelComplete(targetNode)
    })

    assert.equal(
      mockGetTotalDailyObligations.mock.calls[0].arguments[0].social,
      social
    )
  })

  test('resetTravelLogicMockState restores total daily obligations default implementation', () => {
    mockGetTotalDailyObligations.mock.mockImplementation(() => 999)
    resetTravelLogicMockState()

    const defaultCost = mockGetTotalDailyObligations({
      player: { fameLevel: 2 },
      band: { members: [{}, {}] },
      social: {},
      assets: [createObligationAsset()],
      liabilities: { l1: createLiability({ id: 'l1', dailyPayment: 17 }) }
    })

    assert.equal(
      defaultCost,
      62 + 2 * 8 + Math.floor(Math.pow(2, 1.4) * 15) + 40 - 10 + 17
    )
    assert.equal(mockGetTotalDailyObligations.mock.calls.length, 1)
  })

  test('resetTravelLogicMockState restores refuel cost default implementation', () => {
    mockCalculateRefuelCost.mock.mockImplementation(() => 999)
    resetTravelLogicMockState()

    assert.equal(mockCalculateRefuelCost(25), 150)
    assert.equal(mockCalculateRefuelCost.mock.calls.length, 1)
  })

  test('handleTravel skips travel SFX and logs when audio context is unavailable', async () => {
    setEnsureAudioContextResult(false)
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      onStartTravelMinigame: () => {}
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    await act(async () => {
      result.current.handleTravel(targetNode)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    assert.equal(mockAudioManager.ensureAudioContext.mock.calls.length, 1)
    assert.equal(mockAudioManager.playSFX.mock.calls.length, 0)
    assert.equal(mockLogger.warn.mock.calls.length, 1)
    assert.deepEqual(mockLogger.warn.mock.calls[0].arguments, [
      'TravelLogic',
      'Travel audio context unavailable'
    ])
  })

  test('handleTravel prevents travel if insufficient funds', () => {
    const defaults = createTravelLogicProps()
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: { ...defaults.player, money: 10 }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assertTravelPrevented(result, props, /Not enough money/)
  })

  test('handleTravel includes liability payments in affordability check', () => {
    const defaults = createTravelLogicProps()
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: { ...defaults.player, money: 150 },
      band: { members: [{}, {}, {}], harmony: 50 },
      liabilities: { l1: createLiability({ id: 'l1', dailyPayment: 25 }) }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assertTravelPrevented(result, props, /Not enough money/)
  })

  test('handleTravel includes asset upkeep and revenue in affordability check', () => {
    const defaults = createTravelLogicProps()
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: { ...defaults.player, money: 150 },
      band: { members: [{}, {}, {}], harmony: 50 },
      assets: [
        createObligationAsset({
          baseUpkeep: 40,
          baseDailyRevenue: 10
        })
      ]
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assertTravelPrevented(result, props, /Not enough money/)
  })

  test('handleTravel prevents travel if insufficient fuel', () => {
    const defaults = createTravelLogicProps()
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic, {
      player: {
        ...defaults.player,
        van: { ...defaults.player.van, fuel: 5 }
      }
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })

    assertTravelPrevented(result, props, /Not enough fuel/)
  })

  test('handleTravel to current node triggers interaction', () => {
    const props = createTravelLogicProps()
    const currentNode = props.gameMap.nodes.node_start
    // node_start is type START, so it should trigger onShowHQ

    const { result } = renderHook(() => useTravelLogic(props))

    act(() => {
      result.current.handleTravel(currentNode)
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(props.onShowHQ.mock.calls.length, 1)
  })

  test('onTravelComplete updates state and finalizes travel', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic)

    // Start travel (requires 2 clicks)
    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleTravel(targetNode)
    })

    // Complete travel
    act(() => {
      result.current.onTravelComplete()
    })

    assert.equal(result.current.isTraveling, false)
    assert.equal(result.current.travelTarget, null)

    // Check player updates
    assert.equal(props.updatePlayer.mock.calls.length, 1)
    const updateArg = props.updatePlayer.mock.calls[0].arguments[0]
    assert.equal(updateArg.currentNodeId, targetNode.id)
    assert.equal(updateArg.money, 950) // 1000 - 50
    assert.equal(updateArg.van.fuel, 40) // 50 - 10
    assert.equal(updateArg.totalTravels, 1)

    assert.equal(props.advanceDay.mock.calls.length, 1)
    assert.equal(props.saveGame.mock.calls.length, 1)
  })

  test('onTravelComplete emits quest event with canonical arrival region', () => {
    const applyQuestEvent = mock.fn()
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      applyQuestEvent
    })

    act(() => {
      result.current.onTravelComplete(targetNode)
    })

    assert.equal(applyQuestEvent.mock.calls.length, 1)
    assert.deepEqual(applyQuestEvent.mock.calls[0].arguments[0], {
      type: 'travel.completed',
      amount: 1,
      success: true,
      context: { region: 'club' },
      tags: ['club']
    })
  })

  test('onTravelComplete applies travel band patch before advancing the day', () => {
    const dispatchOrder = []
    const updateBand = mock.fn(() => dispatchOrder.push('updateBand'))
    const advanceDay = mock.fn(() => dispatchOrder.push('advanceDay'))
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      band: { members: [], harmony: 50, harmonyRegenTravel: true },
      updateBand,
      advanceDay
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleTravel(targetNode)
    })

    act(() => {
      result.current.onTravelComplete()
    })

    assert.deepEqual(dispatchOrder.slice(0, 2), ['updateBand', 'advanceDay'])
  })

  test('onTravelComplete moves and checks rival through named dispatch actions', () => {
    const moveRivalBand = mock.fn()
    const checkRivalEncounter = mock.fn()
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      moveRivalBand,
      checkRivalEncounter
    })

    act(() => {
      result.current.onTravelComplete(targetNode)
    })

    assert.equal(moveRivalBand.mock.calls.length, 1)
    assert.equal(checkRivalEncounter.mock.calls.length, 1)
  })

  test('handleRefuel fills tank and deducts money', () => {
    // Defaults: money 1000, van.fuel 50. Price is 2 per unit.
    const { result, props } = setupTravelScenario(useTravelLogic)
    // Missing 50 fuel. Price is 2 per unit. Cost = 100.

    act(() => {
      result.current.handleRefuel()
    })

    assertActionSuccess(props, mockAudioManager, updateArg => {
      assert.equal(updateArg.money, 900)
      assert.equal(updateArg.van.fuel, 100)
    })
  })

  test('passes active asset modifiers into travel and refuel costs', () => {
    MODULE_REGISTRY[travelFuelModuleId] = {
      id: travelFuelModuleId,
      ownerKind: 'tourbus_chassis',
      slotType: 'tb_roof',
      flavor: 'legit',
      cost: 100,
      installCost: 10,
      removalRefundFraction: 0.5,
      boni: { fuelMultiplier: 0.5 },
      unlock: {},
      imagePromptKey: 'test_travel_fuel'
    }
    const asset = {
      id: 'asset_travel',
      kind: 'tourbus_chassis',
      chassisFlavor: 'legit',
      chassisTier: 1,
      condition: 100,
      baseUpkeep: 0,
      baseDailyRevenue: 0,
      slots: [
        {
          id: 'slot_fuel',
          slotType: 'tb_roof',
          position: { x: 0, y: 0 },
          installedModuleId: travelFuelModuleId
        }
      ],
      acquiredOnDay: 1,
      acquisitionMode: 'cash',
      baseRiskEventChance: 0
    }
    const { result, targetNode } = setupTravelScenario(useTravelLogic, {
      assets: [asset]
    })

    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleRefuel()
    })

    const travelCall = mockCalculateTravelExpenses.mock.calls.find(
      call => call.arguments[4] !== undefined
    )
    assert.ok(travelCall)
    assert.equal(travelCall.arguments[4].fuelMultiplier, 0.5)
    assert.equal(
      mockCalculateRefuelCost.mock.calls[0].arguments[1].fuelMultiplier,
      0.5
    )
  })

  test('handleRepair fixes van and deducts money', () => {
    // Defaults: money 1000, van.condition 80. Price is 5 per unit.
    const { result, props } = setupTravelScenario(useTravelLogic)
    // Missing 20 condition. Price is 5 per unit. Cost = 100.

    act(() => {
      result.current.handleRepair()
    })

    assertActionSuccess(props, mockAudioManager, updateArg => {
      assert.equal(updateArg.money, 900)
      assert.equal(updateArg.van.condition, 100)
    })
  })

  test('handleRefuel does nothing when traveling', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic)

    // Start travel to set isTravelingRef.current to true
    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, true)

    // Attempt refuel
    act(() => {
      result.current.handleRefuel()
    })

    assert.equal(props.updatePlayer.mock.calls.length, 0)
  })

  test('handleRepair does nothing when traveling', () => {
    const { result, props, targetNode } = setupTravelScenario(useTravelLogic)

    // Start travel
    act(() => {
      result.current.handleTravel(targetNode)
    })
    act(() => {
      result.current.handleTravel(targetNode)
    })

    assert.equal(result.current.isTraveling, true)

    // Attempt repair
    act(() => {
      result.current.handleRepair()
    })

    assert.equal(props.updatePlayer.mock.calls.length, 0)
  })
  test('prevents playing a gig at the same location consecutively', async () => {
    const defaults = createTravelLogicProps()
    const { result, props } = setupTravelScenario(useTravelLogic, {
      player: {
        ...defaults.player,
        currentNodeId: 'node_gig',
        lastGigNodeId: 'node_gig'
      },
      gameMap: {
        connections: [],
        nodes: {
          node_gig: {
            id: 'node_gig',
            type: 'GIG',
            venue: { id: 'venue_1', capacity: 100, name: 'Venue 1' }
          }
        }
      }
    })

    act(() => {
      // Simulate clicking on the current node which is a GIG
      result.current.handleTravel(props.gameMap.nodes.node_gig)
    })

    assert.equal(props.startGig.mock.calls.length, 0)
    assert.equal(props.addToast.mock.calls.length, 1)
    assert.equal(
      props.addToast.mock.calls[0].arguments[0],
      'You just played a gig here! Hit the road and find a new crowd.'
    )
  })

  test('keeps handleTravel stable when player money changes', () => {
    const initialProps = createTravelLogicProps({
      player: { money: 1000, currentNodeId: 'node_start', van: { fuel: 100 } }
    })

    const { result, rerender } = renderHook(props => useTravelLogic(props), {
      initialProps
    })

    const initialHandleTravel = result.current.handleTravel

    rerender({
      ...initialProps,
      player: { ...initialProps.player, money: 900 }
    })

    assert.strictEqual(
      result.current.handleTravel,
      initialHandleTravel,
      'handleTravel should be referentially stable when unrelated player stats change'
    )
  })

  test('keeps handleTravel stable when pendingTravelNode changes', async () => {
    const initialProps = createTravelLogicProps({
      player: { money: 1000, currentNodeId: 'node_start', van: { fuel: 100 } }
    })

    const { result, unmount } = renderHook(() => useTravelLogic(initialProps))

    const initialHandleTravel = result.current.handleTravel
    const targetNode = initialProps.gameMap.nodes.node_target

    await act(async () => {
      initialHandleTravel(targetNode)
    })

    assert.strictEqual(result.current.pendingTravelNode?.id, targetNode.id)
    assert.strictEqual(
      result.current.handleTravel,
      initialHandleTravel,
      'handleTravel should remain stable when pendingTravelNode updates'
    )

    unmount()
  })

  // A stranded player is one who cannot reach any connected node (insufficient
  // fuel) and cannot afford to refuel. calculateTravelExpenses is mocked to
  // require 10L per hop, so fuel < 10 with money below the refuel cost at a
  // non-GIG node trips checkSoftlock.
  const createStrandedPlayer = (overrides = {}) => ({
    money: 10,
    currentNodeId: 'node_start',
    van: { fuel: 5, condition: 80 },
    totalTravels: 0,
    ...overrides
  })

  test('schedules game over when the player is stranded (softlock)', t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const props = createTravelLogicProps({ player: createStrandedPlayer() })

    renderHook(() => useTravelLogic(props))

    // Synchronous: stranded toast + error log, no scene change yet.
    const strandedError = mockLogger.error.mock.calls.some(call =>
      /Stranded/i.test(String(call.arguments[1] ?? call.arguments[0]))
    )
    assert.ok(strandedError, 'expected a GAME OVER: Stranded error log')
    const strandedToast = props.addToast.mock.calls.some(
      call =>
        typeof call.arguments[0] === 'string' &&
        /Stranded/i.test(call.arguments[0]) &&
        call.arguments[1] === 'error'
    )
    assert.ok(strandedToast, 'expected a stranded error toast')
    assert.equal(props.changeScene.mock.calls.length, 0)

    // After the 3s grace period the game-over transition fires.
    t.mock.timers.tick(3000)
    assert.equal(props.saveGame.mock.calls.length, 1)
    assert.equal(props.saveGame.mock.calls[0].arguments[0], false)
    const wentGameOver = props.changeScene.mock.calls.some(
      call => call.arguments[0] === 'GAMEOVER'
    )
    assert.ok(wentGameOver, 'expected changeScene(GAMEOVER) after timeout')
  })

  test('cancels the stranded game-over timer when the softlock resolves', t => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const props = createTravelLogicProps({ player: createStrandedPlayer() })

    const { rerender } = renderHook(p => useTravelLogic(p), {
      initialProps: props
    })

    // Timer was scheduled on the stranded mount.
    assert.ok(
      mockLogger.error.mock.calls.some(call =>
        /Stranded/i.test(String(call.arguments[1] ?? call.arguments[0]))
      ),
      'expected the stranded timer to be scheduled'
    )

    // Player gains funds (can now afford refuel) — the effect re-runs and
    // clears the pending timeout. Reuse the same callback mocks.
    rerender({ ...props, player: createStrandedPlayer({ money: 5000 }) })

    t.mock.timers.tick(3000)
    const wentGameOver = props.changeScene.mock.calls.some(
      call => call.arguments[0] === 'GAMEOVER'
    )
    assert.ok(
      !wentGameOver,
      'game-over transition should be cancelled once the softlock resolves'
    )
    assert.equal(props.saveGame.mock.calls.length, 0)
  })
})
