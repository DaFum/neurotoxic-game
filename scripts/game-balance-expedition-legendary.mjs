/**
 * @fileoverview Executable Late-Game Legendary Edge Verification (G6 Task 13).
 *
 * The balance report used to assert the five Legendaries were verified by
 * printing a hardcoded table. That claim was unfalsifiable: a Legendary could
 * stop firing entirely and the report would still say VERIFIED. Each entry here
 * drives the real reducer and domain owners against a controlled edge fixture
 * and reports what actually happened, so the report's table is a result rather
 * than a literal.
 *
 * These fixtures are deliberately separate from natural first-acquisition
 * Career timing metrics: they prove the rule fires, not when a Career earns it.
 */

import { gameReducer } from '../src/context/gameReducer.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import {
  isExpeditionSafeHarborWindow,
  deriveExpeditionNemesisKeyTarget,
  canExpeditionGhostRouteConvert,
  deriveExpeditionGhostRouteTarget,
  applyExpeditionSalvageRights,
  EXPEDITION_SALVAGE_RIGHTS_FLOOR,
  isExpeditionLegendaryAvailable
} from '../src/domain/expedition/legendaries.ts'
import { advanceExpeditionRoute } from '../src/context/expeditionActionCreators.ts'
import { EXPEDITION_CONTRACTS_BY_ID } from '../src/data/expedition/contracts.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import {
  startedState,
  fixtureMap,
  walkTo
} from '../tests/expeditionLifecycleFixture.js'

/** The Career a Legendary is only ever held by. */
const HEADLINER_CAREER = {
  completedExpeditionRuns: 8,
  finalizedExpeditionRuns: 10,
  completedExpeditionRegionIds: ['home_turf', 'festival_fields']
}

/** Seed pinned to a route where a Rival Encounter sits two steps ahead. */
const NEMESIS_SEED = 4242

/**
 * Builds a headliner state holding exactly the named Legendaries.
 *
 * @param {string[]} legendaryIds
 * @param {Record<string, unknown>} [options={ money: 5000 }]
 * @returns {import('../src/types').GameState}
 */
const headlinerState = (legendaryIds, options = { money: 5000 }) => {
  const base = startedState(options)
  return {
    ...base,
    career: { ...base.career, ...HEADLINER_CAREER, legendaryIds }
  }
}

/**
 * Runs one verification and converts a thrown assertion into a reported error.
 *
 * @param {() => void} check
 * @returns {string} `'VERIFIED'`, or the reason the rule did not fire.
 */
const report = check => {
  try {
    check()
    return 'VERIFIED'
  } catch (err) {
    return `FAILED: ${err instanceof Error ? err.message : String(err)}`
  }
}

/**
 * Asserts a condition, throwing the message when it does not hold.
 *
 * @param {unknown} condition
 * @param {string} message
 * @returns {void}
 */
const require_ = (condition, message) => {
  if (!condition) throw new Error(message)
}

/**
 * Safe Harbor grants a voluntary extraction window on a post-corridor,
 * non-Finale node the route would not otherwise offer one at.
 *
 * @returns {string}
 */
const verifySafeHarbor = () =>
  report(() => {
    const map = fixtureMap()
    const finaleStep = map.meta[map.finaleNodeId].routeStep
    const windowEnd = Math.max(
      ...map.nodeOrder
        .filter(nodeId => map.meta[nodeId]?.isExtractionWindow === true)
        .map(nodeId => map.meta[nodeId].routeStep)
    )
    const grantStep = windowEnd + 1
    require_(
      grantStep < finaleStep,
      'the fixture route offers no post-corridor non-Finale step to grant'
    )

    const stateAtGrant = walkTo(headlinerState(['safe_harbor']), grantStep)
    require_(
      isExpeditionSafeHarborWindow(stateAtGrant, map),
      'Safe Harbor did not open an extraction window at the granted step'
    )

    const extracted = gameReducer(stateAtGrant, {
      type: ActionTypes.EXTRACT_EXPEDITION,
      payload: { expectedRouteStep: stateAtGrant.expedition.routeStep }
    })
    require_(
      extracted.expedition.status === 'extracted',
      `extraction at the granted window was refused (status ${extracted.expedition.status})`
    )
  })

/**
 * The Fixer forgives the Heat and controversy penalty of a breached Contract
 * constraint. The constraint still fails; the Career just pays less for it.
 *
 * @returns {string}
 */
const verifyTheFixer = () =>
  report(() => {
    const template = EXPEDITION_CONTRACTS_BY_ID.get('contract_keep_it_clean')
    require_(
      template && template.tourEndingOnFailure === false,
      'the fixture contract is missing or ends the Tour on failure'
    )
    const cap = template.constraints[0].maxHeat
    const SEVERE_EVENT_ID = 'expedition_technical_collapse'

    const build = legendaryIds => {
      const owned = headlinerState(legendaryIds)
      const breaching = {
        ...owned,
        expedition: {
          ...owned.expedition,
          pressure: {
            ...owned.expedition.pressure,
            heat: cap + 20,
            lastSevereEventId: SEVERE_EVENT_ID
          },
          activeObligations: [
            {
              id: 'ob_fixer',
              sourceType: 'native',
              sourceId: template.id,
              status: 'active',
              settled: false,
              constraints: [...template.constraints],
              progressByConstraintId: Object.assign(Object.create(null), {
                [template.constraints[0].id]: {
                  constraintId: template.constraints[0].id,
                  value: 0,
                  satisfied: false,
                  failed: false
                }
              }),
              doubleDown: null
            }
          ]
        }
      }
      return gameReducer(breaching, {
        type: ActionTypes.RECORD_EXPEDITION_OBLIGATION_SIGNAL,
        payload: {
          signalType: 'heat',
          sourceId: SEVERE_EVENT_ID,
          expectedRouteStep: breaching.expedition.routeStep
        }
      })
    }

    const withoutFixer = build([])
    const withFixer = build(['the_fixer'])
    require_(
      withoutFixer.expedition.activeObligations[0].status === 'failed' &&
        withFixer.expedition.activeObligations[0].status === 'failed',
      'the breached constraint did not fail on both sides of the comparison'
    )
    require_(
      withoutFixer.expedition.pressure.heat >
        withFixer.expedition.pressure.heat,
      'the excused failure did not cost less Heat than the unexcused one'
    )
    require_(
      withFixer.expedition.consumedLegendaryIds.includes('the_fixer'),
      'The Fixer was not consumed by the excused failure'
    )
  })

/**
 * Nemesis Key opens a two-step route jump to a Rival Encounter.
 *
 * @returns {string}
 */
const verifyNemesisKey = () =>
  report(() => {
    const base = headlinerState(['nemesis_key'])
    const state = { ...base, runSeed: NEMESIS_SEED }
    const map = buildExpeditionMap(NEMESIS_SEED, 'standard_tour', 'home_turf')
    require_(
      isExpeditionLegendaryAvailable(state, 'nemesis_key'),
      'Nemesis Key was not available to a headliner Career holding it'
    )

    const target = deriveExpeditionNemesisKeyTarget(state, map)
    require_(
      typeof target === 'string' && target.length > 0,
      `seed ${NEMESIS_SEED} no longer offers a Rival Encounter two steps ahead`
    )

    const advanced = gameReducer(state, advanceExpeditionRoute(state, target))
    require_(
      advanced.player.currentNodeId === target,
      'the shortcut did not move the player to the Rival Encounter'
    )
    require_(
      advanced.expedition.routeStep === state.expedition.routeStep + 2,
      `the jump advanced ${advanced.expedition.routeStep - state.expedition.routeStep} steps rather than 2`
    )
    require_(
      advanced.expedition.consumedLegendaryIds.includes('nemesis_key'),
      'Nemesis Key was not consumed by the shortcut'
    )
  })

/**
 * Ghost Route converts an extreme Authority crisis into an Underground detour.
 *
 * @returns {string}
 */
const verifyGhostRoute = () =>
  report(() => {
    const base = headlinerState(['ghost_route'], { money: 0 })
    const state = {
      ...base,
      player: {
        ...base.player,
        money: 0,
        van: { ...base.player.van, fuel: 0 }
      },
      expedition: {
        ...base.expedition,
        pressure: { ...base.expedition.pressure, heat: 95 },
        cargo: { ...base.expedition.cargo, contraband: [] },
        loadout: { ...base.expedition.loadout, crewIds: [] },
        activeObligations: [
          { id: 'o1', sourceType: 'native', status: 'active' },
          { id: 'o2', sourceType: 'native', status: 'active' }
        ]
      }
    }
    const map = fixtureMap()

    require_(
      canExpeditionGhostRouteConvert(state) === true,
      'Ghost Route refused to convert an extreme Authority crisis'
    )
    const detourTarget = deriveExpeditionGhostRouteTarget(state, map)
    require_(
      typeof detourTarget === 'string' && detourTarget.length > 0,
      'Ghost Route produced no Underground detour target'
    )

    const advanced = gameReducer(
      state,
      advanceExpeditionRoute(state, detourTarget)
    )
    require_(
      advanced.player.currentNodeId === detourTarget,
      'the detour did not move the player to the Underground node'
    )
    require_(
      advanced.expedition.consumedLegendaryIds.includes('ghost_route'),
      'Ghost Route was not consumed by the detour'
    )
    require_(
      advanced.expedition.arrivedOverlay?.subtype === 'UNDERGROUND_MARKET' &&
        advanced.expedition.arrivedOverlay?.source === 'ghost_route',
      'the detour did not arrive on a Ghost Route Underground overlay'
    )
  })

/**
 * Salvage Rights rescues a wiped Condition group to its floor, paying spare
 * parts for it.
 *
 * @returns {string}
 */
const verifySalvageRights = () =>
  report(() => {
    const base = headlinerState(['salvage_rights'])
    const state = {
      ...base,
      expedition: {
        ...base.expedition,
        cargo: { spareParts: 3, supplies: 1 },
        technicalCondition: {
          pa: 0,
          instruments: 80,
          stageGear: 80,
          defects: []
        }
      }
    }
    const before = { pa: 50, instruments: 80, stageGear: 80, defects: [] }

    const rescued = applyExpeditionSalvageRights(state, before)
    require_(
      rescued.expedition.technicalCondition.pa ===
        EXPEDITION_SALVAGE_RIGHTS_FLOOR,
      `the wiped PA group was rescued to ${rescued.expedition.technicalCondition.pa} rather than the ${EXPEDITION_SALVAGE_RIGHTS_FLOOR} floor`
    )
    require_(
      rescued.expedition.cargo.spareParts === 1,
      `the rescue debited to ${rescued.expedition.cargo.spareParts} spare parts rather than 1`
    )
    require_(
      rescued.expedition.consumedLegendaryIds.includes('salvage_rights'),
      'Salvage Rights was not consumed by the rescue'
    )
  })

/**
 * Runs every Legendary edge verification.
 *
 * @returns {{
 *   passed: boolean,
 *   failures: string[],
 *   statusById: Record<string, string>
 * }}
 */
export const verifyLegendaryEdgeActivations = () => {
  const statusById = {
    safe_harbor: verifySafeHarbor(),
    the_fixer: verifyTheFixer(),
    nemesis_key: verifyNemesisKey(),
    ghost_route: verifyGhostRoute(),
    salvage_rights: verifySalvageRights()
  }
  const failures = Object.entries(statusById)
    .filter(([, status]) => status !== 'VERIFIED')
    .map(([id, status]) => `Legendary ${id}: ${status}`)
  return { passed: failures.length === 0, failures, statusById }
}
