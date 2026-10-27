/**
 * @fileoverview Browser-side Expedition save fixtures for the audit specs.
 *
 * @remarks
 * Loaded inside the page through Vite (`import('/e2e/fixtures/...')`), because
 * the sources it drives import `import.meta` and cannot run in the Node test
 * process. Every state is built with the real action types and `gameReducer`,
 * mirroring `tests/expeditionLifecycleFixture.js` (which cannot be imported
 * here: it pulls in `node:assert`). Each builder returns the raw save string
 * to seed plus the facts a spec asserts against.
 */

import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'
import { CURRENT_SAVE_VERSION } from '../../src/context/reducers/migrations/index.ts'
import { createPersistedState } from '../../src/context/usePersistence.ts'
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'
import { getEffectiveExpeditionRoute } from '../../src/domain/expedition/routeOverlay.ts'
import { getExpeditionSpendableCash } from '../../src/domain/expedition/spendableCash.ts'
import { SONGS_BY_ID } from '../../src/data/songs.ts'
import { calculateTravelCostsAndImpact } from '../../src/utils/travelUtils.ts'
import { getActiveAssetModifiers } from '../../src/utils/assets/assetSelectors.ts'
import { getLocationName } from '../../src/hooks/travel/actions/getLocationName.ts'

const FIXTURE_RUN_SEED = 4242
const FIXTURE_TOUR_ID = 'standard_tour'
const FIXTURE_REGION_ID = 'home_turf'
const FIXTURE_PREP_ID = 'run_fixture'
const FIXTURE_MONEY = 5000
const FIXTURE_SONG_ID = [...SONGS_BY_ID.keys()][0]

const fail = message => {
  throw new Error(`e2e fixture: ${message}`)
}

const loadout = protectedCareerCash => ({
  tourTypeId: FIXTURE_TOUR_ID,
  regionId: FIXTURE_REGION_ID,
  activeTourbusAssetId: null,
  crewIds: [],
  cargo: { spareParts: 0, supplies: 0 },
  starterPerkId: null,
  nativeContracts: [],
  insurancePolicyId: null,
  pressureModifierIds: [],
  build: {
    setlistSongIds: [FIXTURE_SONG_ID],
    equipment: { selectedGearItemIds: [] },
    selectedTourbusModuleIds: [],
    merch: [],
    contraband: [],
    sponsorOfferId: null,
    startingFuelTarget: 100,
    protectedCareerCash
  }
})

/** Fresh Career, prepared and started through the real START transaction. */
const startedState = (protectedCareerCash, runSeed = FIXTURE_RUN_SEED) => {
  const fresh = createInitialState()
  fresh.player.money = FIXTURE_MONEY
  fresh.player.fame = 100
  fresh.player.van.fuel = 100
  const prepared = gameReducer(fresh, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId: FIXTURE_PREP_ID, runSeed }
  })
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: FIXTURE_PREP_ID,
      expectedRunSeed: runSeed,
      loadout: loadout(protectedCareerCash)
    }
  })
  if (started.expedition.status !== 'active') fail('the run did not start')
  return started
}

const routeMap = state =>
  buildExpeditionMap(
    state.runSeed,
    state.expedition.loadout.tourTypeId,
    state.expedition.loadout.regionId
  )

const currentNodeId = state => state.expedition.visitedNodeIds.at(-1)

const advanceTo = (state, nodeId) => {
  const advanced = gameReducer(state, {
    type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
    payload: { nodeId, expectedRouteStep: state.expedition.routeStep }
  })
  if (advanced === state) fail(`route advance to ${nodeId} was refused`)
  return advanced
}

/** Nodes the run may travel to next, base edges plus the active overlay. */
const connectedNodeIds = state => {
  const from = currentNodeId(state)
  return getEffectiveExpeditionRoute(state, routeMap(state))
    .connections.filter(edge => edge.from === from)
    .map(edge => edge.to)
}

/**
 * The cost the travel gate quotes for a leg, exactly as `useHandleTravel`
 * derives it.
 *
 * @param state - Root game state.
 * @param nodeId - Destination node id.
 * @returns Leg cost, required cash, fuel and the spendable balance.
 */
export const quoteTravel = (state, nodeId) => {
  const nodes = state.gameMap.nodes
  const costs = calculateTravelCostsAndImpact(
    nodes[nodeId],
    nodes[state.player.currentNodeId],
    state.player,
    state.band,
    state.social,
    state.assets,
    state.liabilities,
    getActiveAssetModifiers(state.assets)
  )
  return {
    ...costs,
    wallet: state.player.money,
    spendable: getExpeditionSpendableCash(state)
  }
}

/** The localized name the travel handler puts into its "You are at" toast. */
export const locationNameOf = (state, nodeId) => {
  const node = state.gameMap.nodes[nodeId]
  const venueName = node.venue?.name
  return getLocationName(venueName, node.venueId ?? node.venue?.id ?? null)
}

/**
 * Serializes a state the way the game saves it.
 *
 * @remarks
 * `createPersistedState` owns the persisted-field whitelist, so the fixture
 * never carries a copy of it. The scene is the Overworld a Load Game resumes.
 */
const serialize = state =>
  JSON.stringify({
    ...createPersistedState({
      ...state,
      currentScene: GAME_PHASES.OVERWORLD
    }),
    version: CURRENT_SAVE_VERSION
  })

/**
 * Quotes every leg the run may travel next.
 *
 * @param state - Root game state.
 * @returns One quote per connected node, in route order.
 */
export const quoteConnectedLegs = state =>
  connectedNodeIds(state).map(nodeId => ({
    nodeId,
    ...quoteTravel(state, nodeId)
  }))

/**
 * A Career at the start node, protected cash sized against every first leg.
 *
 * @remarks
 * The map does not say which node a click lands on, so the cash is sized
 * against the whole connected set: the wallet covers the dearest leg, and the
 * spendable balance falls short of the cheapest one.
 */
const travelFixture = ({ protectsCash }) => {
  const probe = startedState(0)
  const quotes = quoteConnectedLegs(probe)
  if (quotes.length === 0) fail('the start node has no connected node')
  const dearestCost = Math.max(...quotes.map(quote => quote.totalCost))
  const dearestRequired = Math.max(...quotes.map(quote => quote.cashRequired))
  const cheapestRequired = Math.min(...quotes.map(quote => quote.cashRequired))
  const wallet = quotes[0].wallet
  if (!(wallet > dearestCost && wallet >= dearestRequired))
    fail('the wallet must cover every leg for the fixture to prove anything')

  // The probe is already past the upfront cost, so the same amount protected
  // from the START commitment leaves `cheapestRequired - 1` spendable.
  const protectedCareerCash = protectsCash ? wallet - (cheapestRequired - 1) : 0
  const state = startedState(protectedCareerCash)
  const finalQuotes = quoteConnectedLegs(state)
  for (const quote of finalQuotes) {
    if (protectsCash) {
      if (!(quote.wallet > quote.totalCost))
        fail(`protected-cash: wallet must exceed the ${quote.nodeId} leg cost`)
      if (!(quote.spendable < quote.cashRequired))
        fail(
          `protected-cash: spendable cash must fall short for ${quote.nodeId}`
        )
    } else if (!(quote.spendable >= quote.cashRequired)) {
      fail(`zero-protected: the ${quote.nodeId} leg must be affordable`)
    }
  }
  return {
    save: serialize(state),
    nodeIds: finalQuotes.map(quote => quote.nodeId)
  }
}

/** Wallet covers the leg, but protected Career Cash makes it unaffordable. */
export const protectedCashFixture = () => travelFixture({ protectsCash: true })

/** Fresh run on route seed 1, standing on its start node (visual audit #3254). */
export const seedOneStartFixture = () => ({
  save: serialize(startedState(0, 1))
})

/** Same run with nothing protected: the leg is affordable. */
export const zeroProtectedCashFixture = () =>
  travelFixture({ protectsCash: false })

const isBaseGig = (state, nodeId) => state.gameMap.nodes[nodeId]?.type === 'GIG'

/** Canonical unplayed base GIG node, reached through the real route action. */
export const ordinaryGigFixture = () => {
  for (let offset = 0; offset < 50; offset += 1) {
    const state = startedState(0, FIXTURE_RUN_SEED + offset)
    const gigNodeId = connectedNodeIds(state).find(id => isBaseGig(state, id))
    if (!gigNodeId) continue
    const arrived = advanceTo(state, gigNodeId)
    if (arrived.expedition.arrivedOverlay !== null)
      fail('an ordinary gig node must carry no overlay')
    return {
      save: serialize(arrived),
      nodeId: gigNodeId,
      locationName: locationNameOf(arrived, gigNodeId)
    }
  }
  return fail('no seed offered an unplayed base GIG at the first step')
}

/**
 * A run standing on a base GIG node that a Nemesis shortcut converted.
 *
 * @remarks
 * The Nemesis tier is the shortcut's own gate and lives in the Career, so the
 * Rival's `nemesisLevel` is raised in the state before the real route action
 * travels the overlay edge.
 */
export const convertedNodeFixture = () => {
  for (let offset = 0; offset < 50; offset += 1) {
    const started = startedState(0, FIXTURE_RUN_SEED + offset)
    const rivalId = started.rivalBand?.id
    if (!rivalId) continue
    const record = started.career.rivalsById[rivalId]
    const atTierTwo = {
      ...started,
      career: {
        ...started.career,
        rivalsById: {
          ...started.career.rivalsById,
          [rivalId]: {
            ...record,
            history: { ...record.history, nemesisLevel: 2 }
          }
        }
      }
    }
    const effective = getEffectiveExpeditionRoute(
      atTierTwo,
      routeMap(atTierTwo)
    )
    const shortcutNodeId = Object.keys(effective.sourceByNodeId).find(
      id => effective.sourceByNodeId[id] === 'nemesis_shortcut'
    )
    if (!shortcutNodeId || !isBaseGig(atTierTwo, shortcutNodeId)) continue
    const arrived = advanceTo(atTierTwo, shortcutNodeId)
    const overlay = arrived.expedition.arrivedOverlay
    if (
      overlay?.nodeId !== shortcutNodeId ||
      overlay.source !== 'nemesis_shortcut'
    )
      fail('the shortcut did not record its arrival overlay')
    return {
      save: serialize(arrived),
      nodeId: shortcutNodeId,
      locationName: locationNameOf(arrived, shortcutNodeId)
    }
  }
  return fail('no seed offered a Nemesis shortcut onto a base GIG node')
}
