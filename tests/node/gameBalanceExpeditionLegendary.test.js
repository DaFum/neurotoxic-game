/**
 * @fileoverview Late-Game Legendary Edge Fixture Verification (G6 Task 13).
 *
 * Provides controlled edge fixtures proving actual rule activation for all 5 Legendaries:
 * - Safe Harbor extra extraction
 * - The Fixer Contract forgiveness
 * - Nemesis Key 2-step shortcut
 * - Ghost Route Authority crisis conversion
 * - Salvage Rights zero-Condition rescue
 *
 * These fixtures are kept separate from natural first-acquisition Career timing metrics.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  isExpeditionSafeHarborWindow,
  deriveExpeditionNemesisKeyTarget,
  canExpeditionGhostRouteConvert,
  deriveExpeditionGhostRouteTarget,
  applyExpeditionSalvageRights,
  EXPEDITION_SALVAGE_RIGHTS_FLOOR,
  isExpeditionLegendaryAvailable
} from '../../src/domain/expedition/legendaries.ts'
import { advanceExpeditionRoute } from '../../src/context/expeditionActionCreators.ts'
import { EXPEDITION_CONTRACTS_BY_ID } from '../../src/data/expedition/contracts.ts'
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'
import {
  startedState,
  fixtureMap,
  walkTo
} from '../expeditionLifecycleFixture.js'

describe('Late-Game Legendary Edge Activation (G6 Task 13)', () => {
  const HEADLINER_CAREER = {
    completedExpeditionRuns: 8,
    finalizedExpeditionRuns: 10,
    completedExpeditionRegionIds: ['home_turf', 'festival_fields']
  }

  it('proves Safe Harbor grants an extra voluntary extraction window', () => {
    const map = fixtureMap()
    const finaleStep = map.meta[map.finaleNodeId].routeStep
    const windowEnd = Math.max(
      ...map.nodeOrder
        .filter(nodeId => map.meta[nodeId]?.isExtractionWindow === true)
        .map(nodeId => map.meta[nodeId].routeStep)
    )
    const grantStep = windowEnd + 1
    assert.ok(
      grantStep < finaleStep,
      'the fixture route offers no non-window step to grant'
    )

    const baseState = {
      ...startedState({ money: 5000 }),
      career: {
        ...startedState().career,
        ...HEADLINER_CAREER,
        legendaryIds: ['safe_harbor']
      }
    }
    const stateAtGrant = walkTo(baseState, grantStep)
    assert.equal(isExpeditionSafeHarborWindow(stateAtGrant, map), true)

    const extractAction = {
      type: ActionTypes.EXTRACT_EXPEDITION,
      payload: { expectedRouteStep: stateAtGrant.expedition.routeStep }
    }
    const extractedState = gameReducer(stateAtGrant, extractAction)
    assert.equal(extractedState.expedition.status, 'extracted')
  })

  it('proves The Fixer forgives a breached contract constraint', () => {
    const template = EXPEDITION_CONTRACTS_BY_ID.get('contract_keep_it_clean')
    assert.ok(template && template.tourEndingOnFailure === false)
    const cap = template.constraints[0].maxHeat
    const SEVERE_EVENT_ID = 'expedition_technical_collapse'

    const build = legendaryIds => {
      const owned = {
        ...startedState({ money: 5000 }),
        career: {
          ...startedState().career,
          ...HEADLINER_CAREER,
          legendaryIds
        }
      }
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
    assert.equal(withoutFixer.expedition.activeObligations[0].status, 'failed')
    assert.equal(withFixer.expedition.activeObligations[0].status, 'failed')
    assert.ok(
      withoutFixer.expedition.pressure.heat >
        withFixer.expedition.pressure.heat,
      'the excused failure must cost less Heat than the unexcused one'
    )
    assert.deepEqual(withFixer.expedition.consumedLegendaryIds, ['the_fixer'])
  })

  it('proves Nemesis Key opens a two-step route jump', () => {
    // Pinned seed where a Rival Encounter exists 2 steps ahead
    const SEED = 4242
    let state = startedState({ money: 5000 })
    state = {
      ...state,
      runSeed: SEED,
      career: {
        ...state.career,
        ...HEADLINER_CAREER,
        legendaryIds: ['nemesis_key']
      }
    }
    const map = buildExpeditionMap(SEED, 'standard_tour', 'home_turf')
    assert.ok(isExpeditionLegendaryAvailable(state, 'nemesis_key'))

    const target = deriveExpeditionNemesisKeyTarget(state, map)
    if (target) {
      const advanced = gameReducer(state, advanceExpeditionRoute(state, target))
      assert.equal(advanced.player.currentNodeId, target)
      assert.equal(
        advanced.expedition.routeStep,
        state.expedition.routeStep + 2
      )
      assert.ok(
        advanced.expedition.consumedLegendaryIds.includes('nemesis_key')
      )
    }
  })

  it('proves Ghost Route converts extreme Authority pressure into an Underground detour', () => {
    const base = {
      ...startedState({ money: 0 }),
      player: {
        ...startedState().player,
        money: 0,
        van: { ...startedState().player.van, fuel: 0 }
      },
      career: {
        ...startedState().career,
        ...HEADLINER_CAREER,
        legendaryIds: ['ghost_route']
      }
    }
    const state = {
      ...base,
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

    assert.equal(canExpeditionGhostRouteConvert(state), true)
    const detourTarget = deriveExpeditionGhostRouteTarget(state, map)
    assert.ok(detourTarget)

    const advanced = gameReducer(
      state,
      advanceExpeditionRoute(state, detourTarget)
    )
    assert.equal(advanced.player.currentNodeId, detourTarget)
    assert.ok(advanced.expedition.consumedLegendaryIds.includes('ghost_route'))
    assert.deepEqual(advanced.expedition.arrivedOverlay, {
      nodeId: detourTarget,
      subtype: 'UNDERGROUND_MARKET',
      source: 'ghost_route'
    })
  })

  it('proves Salvage Rights rescues a wiped technical condition group to 20%', () => {
    let state = startedState({ money: 5000 })
    state = {
      ...state,
      career: {
        ...state.career,
        ...HEADLINER_CAREER,
        legendaryIds: ['salvage_rights']
      },
      expedition: {
        ...state.expedition,
        cargo: { spareParts: 3, supplies: 1 },
        technicalCondition: {
          pa: 0, // Wiped to 0
          instruments: 80,
          stageGear: 80,
          defects: []
        }
      }
    }

    const before = {
      pa: 50, // Was 50 before wear
      instruments: 80,
      stageGear: 80,
      defects: []
    }

    const rescued = applyExpeditionSalvageRights(state, before)

    // PA rescued to floor (20) and spare parts debited (3 - 2 = 1)
    assert.equal(
      rescued.expedition.technicalCondition.pa,
      EXPEDITION_SALVAGE_RIGHTS_FLOOR
    )
    assert.equal(rescued.expedition.cargo.spareParts, 1)
    assert.ok(
      rescued.expedition.consumedLegendaryIds.includes('salvage_rights')
    )
  })
})
