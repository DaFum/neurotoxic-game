/**
 * Day-loop step builders.
 *
 * Each builder turns the current state plus a target into the ordered array of
 * real action objects the production hooks would dispatch, using the same pure
 * utilities those hooks use. Hook-only concerns (leaderboard submission, React
 * refs, `queueMicrotask`, toasts, `saveGame`) are deliberately absent — this is
 * the logic spine, not the UI sequencing.
 *
 * Runner-agnostic: no `node:test`, no Vitest, no async, no timers.
 */
import { GAME_PHASES } from '../../src/context/gameConstants'
import {
  advanceDay,
  createChangeSceneAction,
  createCompleteTravelMinigameAction,
  createSetLastGigStatsAction,
  createSetSetlistAction,
  createStartGigAction,
  createStartTravelMinigameAction,
  createUpdateBandAction,
  createUpdatePlayerAction
} from '../../src/context/actionCreators'
import { getActiveAssetModifiers } from '../../src/utils/assetSelectors'
import {
  calculateTravelCostsAndImpact,
  checkTravelResources
} from '../../src/utils/travelUtils'
import { processHarmonyRegen } from '../../src/utils/arrivalUtils'
import { calculateGigFinancials } from '../../src/utils/economy'
import { buildGigStatsSnapshot } from '../../src/utils/gigStats'
import { getTotalDailyObligations } from '../../src/utils/assetSelectors'
import {
  BALANCE_CONSTANTS,
  calculateFameGain,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney
} from '../../src/utils/gameState'
import { calculateContinueStats } from '../../src/utils/postGig/performanceLogic'
import { applySequence } from './applySequence'

/**
 * Builds a map node with canonical venue keys.
 *
 * @param {object} [overrides] - Node and venue overrides.
 * @returns {object} Map node suitable for the travel builders.
 */
export function buildMapNode(overrides = {}) {
  const { venue: venueOverrides, ...nodeOverrides } = overrides
  return {
    id: 'node_1_0',
    layer: 1,
    type: 'GIG',
    status: 'unlocked',
    x: 40,
    y: 40,
    venue: {
      id: 'test_venue',
      name: 'Test Venue',
      capacity: 200,
      price: 10,
      pay: 300,
      dist: 20,
      diff: 2,
      ...venueOverrides
    },
    ...nodeOverrides
  }
}

/**
 * Registers a destination node in the map the reducer reads.
 *
 * Production only ever travels to a node the generated map already holds, and
 * `handleCompleteTravelMinigame` resolves its target through
 * `state.gameMap.nodes`. The driver's fixture map starts empty, so a travel
 * step has to seed its destination first or the reducer refuses the trip.
 *
 * @param {object} state - Current game state.
 * @param {object} node - Destination map node to register.
 * @returns {object} State whose `gameMap.nodes` contains the node.
 */
export function withMapNode(state, node) {
  return {
    ...state,
    gameMap: {
      ...(state.gameMap ?? {}),
      nodes: { ...(state.gameMap?.nodes ?? {}), [node.id]: node }
    }
  }
}

/**
 * Builds the travel + arrival actions, mirroring the production travel path:
 * the affordability gate in `useHandleTravel`, the tourbus minigame that
 * settles arrival in `handleCompleteTravelMinigame`, and the day tick that
 * `useArrivalLogic.handleArrivalSequence` runs once the player continues.
 *
 * @param {object} state - Current game state.
 * @param {object} node - Destination map node.
 * @returns {{actions: Array<object>, blocked: null | {errorKey?: string}}}
 * Ordered actions, or `blocked` when resources are insufficient — the hook
 * refuses to start the trip in that case, so the driver emits no actions.
 */
export function buildTravelStep(state, node) {
  const { player, band, social, assets, liabilities } = state
  const assetModifiers = getActiveAssetModifiers(assets)
  const currentStartNode = state.gameMap?.nodes?.[player.currentNodeId]

  const { fuelLiters, cashRequired } = calculateTravelCostsAndImpact(
    node,
    currentStartNode,
    player,
    band,
    social,
    assets,
    liabilities,
    assetModifiers
  )

  const resourceCheck = checkTravelResources(cashRequired, fuelLiters, player)
  if (!resourceCheck.allowed) {
    return { actions: [], blocked: { errorKey: resourceCheck.errorKey } }
  }

  // The completion reducer refuses to settle unless a tourbus run is active,
  // so the start action is part of the step, not fixture setup.
  const actions = [
    createStartTravelMinigameAction(node.id),
    // A clean run: this step is about money/fuel/location, not damage.
    createCompleteTravelMinigameAction(0, [])
  ]
  // `advanceDay` must be built from the state the earlier actions produce, so
  // its RNG stream is sized against the same asset list the reducer will see.
  actions.push(advanceDay(applySequence(state, actions)))

  return { actions, blocked: null }
}

/**
 * Builds the post-arrival harmony-regen action, mirroring `useArrivalLogic`.
 *
 * @param {object} state - State after travel actions applied.
 * @returns {Array<object>} Zero or one action.
 */
export function buildArrivalStep(state) {
  const regenHarmony = processHarmonyRegen(state.band)
  return regenHarmony === null
    ? []
    : [createUpdateBandAction({ harmony: regenHarmony })]
}

/**
 * Builds the gig-start actions, matching the production PRE_GIG → GIG order.
 *
 * @param {object} venue - Venue object; `currentGig` becomes this value.
 * @param {Array<object>} [setlist] - Songs for the gig.
 * @returns {Array<object>} Ordered actions.
 */
export function buildGigStartStep(venue, setlist = [{ id: 'song_1' }]) {
  return [
    createChangeSceneAction(GAME_PHASES.PRE_GIG),
    createStartGigAction(venue),
    createSetSetlistAction(setlist),
    createChangeSceneAction(GAME_PHASES.GIG)
  ]
}

/**
 * Builds the post-gig actions, mirroring `useContinueHandler` minus its
 * impure concerns.
 *
 * @param {object} state - State at the end of the gig.
 * @param {object} [performance] - Raw rhythm performance counters.
 * @returns {{actions: Array<object>, bankrupt: boolean, financials: object}}
 * Ordered actions plus the synchronously computed bankruptcy branch.
 */
export function buildPostGigStep(state, performance = {}) {
  const gigStats = buildGigStatsSnapshot(
    performance.score ?? 5000,
    {
      perfectHits: performance.perfectHits ?? 40,
      misses: performance.misses ?? 5,
      maxCombo: performance.maxCombo ?? 20,
      peakHype: performance.peakHype ?? 60
    },
    performance.toxicTimeTotal ?? 0
  )

  const financials = calculateGigFinancials({
    gigData: state.currentGig ?? {},
    gigStats,
    playerFame: state.player.fame,
    modifiers: state.gigModifiers,
    bandInventory: state.band?.inventory,
    zealotry: state.social?.zealotry,
    // `deriveFinancials` forwards the band's post-gig merch prices; without
    // them the merch path silently falls back to default pricing.
    context: { merchPrices: state.band?.merchPrices }
  })

  const continueStats = calculateContinueStats({
    player: state.player,
    perfScore: gigStats.accuracy,
    financials,
    misses: gigStats.misses,
    bandStyle: state.band?.style,
    calculateFameGain,
    calculateFameLevel,
    clampPlayerFame,
    clampPlayerMoney,
    BALANCE_CONSTANTS
  })

  const obligations = getTotalDailyObligations(state)
  const bankrupt = continueStats.newMoney <= 0 && obligations > 0

  const actions = [
    createSetLastGigStatsAction(gigStats),
    createChangeSceneAction(GAME_PHASES.POST_GIG),
    createUpdatePlayerAction({
      money: continueStats.newMoney,
      fame: continueStats.newFame,
      fameLevel: continueStats.fameLevel
    }),
    createChangeSceneAction(
      bankrupt ? GAME_PHASES.GAMEOVER : GAME_PHASES.OVERWORLD
    )
  ]

  return { actions, bankrupt, financials, gigStats, continueStats }
}
