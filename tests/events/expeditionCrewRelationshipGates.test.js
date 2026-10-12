import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { EXPEDITION_CREW_EVENTS } from '../../src/data/events/crew.ts'
import { validateGameEvent } from '../../src/utils/eventValidator.ts'
import { resolveEvent } from '../../src/domain/eventResolver.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'
import { getExpeditionRelationshipPairKey } from '../../src/domain/expedition/relationships.ts'
import { startedState } from '../expeditionLifecycleFixture.js'
import { applyExpeditionEventDelta } from '../../src/context/expeditionActionCreators.ts'

const crew = id => ({ kind: 'crew', id })
const MATZE_TOM = getExpeditionRelationshipPairKey(
  { kind: 'band', id: 'matze' },
  crew('tom')
)
const MIKA_TOM = getExpeditionRelationshipPairKey(crew('mika'), crew('tom'))
const NOAH_YARA = getExpeditionRelationshipPairKey(crew('noah'), crew('yara'))

const eventById = id => {
  const event = EXPEDITION_CREW_EVENTS.find(candidate => candidate.id === id)
  assert.ok(event, `missing event ${id}`)
  return event
}
const optionById = (event, id) => {
  const option = event.options.find(candidate => candidate.id === id)
  assert.ok(option, `missing option ${event.id}:${id}`)
  return option
}

/** An active run with the given Crew and stored relationship tiers. */
const runWith = (crewIds, tiers = {}) => {
  const base = createInitialState()
  return {
    ...base,
    career: { ...base.career, expeditionRelationshipByPair: tiers },
    expedition: {
      ...base.expedition,
      status: 'active',
      loadout: { crewIds }
    }
  }
}

const eligible = (id, state) => Boolean(eventById(id).condition(state))

describe('Crew relationship tiers gate Crew event eligibility', () => {
  test('every Crew event and option validates', () => {
    for (const event of EXPEDITION_CREW_EVENTS)
      assert.equal(validateGameEvent(event), true, event.id)
  })

  test('Crew<->Crew Mika/Tom: a soured pair opens reconciliation and a broken one ends the conflict', () => {
    const pair = ['mika', 'tom']
    assert.equal(
      eligible('expedition_crew_reconcile_mika_tom', runWith(pair)),
      false
    )
    assert.equal(
      eligible(
        'expedition_crew_reconcile_mika_tom',
        runWith(pair, { [MIKA_TOM]: -1 })
      ),
      true
    )
    assert.equal(
      eligible('expedition_crew_conflict_mika_tom', runWith(pair)),
      true
    )
    assert.equal(
      eligible(
        'expedition_crew_conflict_mika_tom',
        runWith(pair, { [MIKA_TOM]: -2 })
      ),
      false
    )
  })

  test('Crew<->Crew Noah/Yara: the breakthrough gate is no longer always true', () => {
    const pair = ['noah', 'yara']
    assert.equal(eligible('expedition_crew_breakthrough', runWith(pair)), true)
    assert.equal(
      eligible(
        'expedition_crew_breakthrough',
        runWith(pair, { [NOAH_YARA]: -1 })
      ),
      false
    )
    assert.equal(
      eligible('expedition_crew_route_dispute_noah_yara', runWith(pair)),
      true
    )
    assert.equal(
      eligible(
        'expedition_crew_route_dispute_noah_yara',
        runWith(pair, { [NOAH_YARA]: 1 })
      ),
      false
    )
  })

  test('Band<->Crew Matze/Tom: negative opens the grudge, positive unlocks cover and closes tension', () => {
    assert.equal(
      eligible('expedition_crew_band_grudge', runWith(['tom'])),
      false
    )
    assert.equal(
      eligible(
        'expedition_crew_band_grudge',
        runWith(['tom'], { [MATZE_TOM]: -1 })
      ),
      true
    )
    assert.equal(
      eligible('expedition_crew_band_tension', runWith(['tom'])),
      true
    )
    assert.equal(
      eligible(
        'expedition_crew_band_tension',
        runWith(['tom'], { [MATZE_TOM]: 2 })
      ),
      false
    )
    const cover = optionById(
      eventById('expedition_crew_injury_scare'),
      'tom_covers'
    )
    assert.equal(cover.condition(runWith(['ines', 'tom'])), false)
    assert.equal(
      cover.condition(runWith(['ines', 'tom'], { [MATZE_TOM]: 1 })),
      true
    )
    assert.equal(cover.condition(runWith(['ines'], { [MATZE_TOM]: 1 })), false)
  })

  test('a malformed stored tier reads as neutral', () => {
    assert.equal(
      eligible(
        'expedition_crew_reconcile_mika_tom',
        runWith(['mika', 'tom'], { [MIKA_TOM]: Number.NaN })
      ),
      false
    )
  })
})

describe('resolved Crew events flip later eligibility through the reducer', () => {
  const resolve = (state, eventId, optionId) => {
    const event = eventById(eventId)
    const withEvent = { ...state, activeEvent: event }
    return resolveEvent(optionById(event, optionId), withEvent).actions.reduce(
      gameReducer,
      withEvent
    )
  }

  test('Crew<->Crew: conflict sours Mika/Tom, reconciliation restores them', () => {
    const started = startedState({}, { crewIds: ['mika', 'tom'] })
    assert.equal(eligible('expedition_crew_reconcile_mika_tom', started), false)
    const soured = resolve(
      started,
      'expedition_crew_conflict_mika_tom',
      'separate'
    )
    assert.equal(soured.career.expeditionRelationshipByPair[MIKA_TOM], -1)
    // The tier survives a save/load round-trip of the Career.
    const reloaded = {
      ...soured,
      career: sanitizeCareerState(JSON.parse(JSON.stringify(soured.career)))
    }
    assert.equal(eligible('expedition_crew_reconcile_mika_tom', reloaded), true)
    const mended = resolve(
      reloaded,
      'expedition_crew_reconcile_mika_tom',
      'mediate'
    )
    assert.equal(mended.career.expeditionRelationshipByPair[MIKA_TOM], 0)
    assert.equal(eligible('expedition_crew_reconcile_mika_tom', mended), false)
  })

  test('Band<->Crew: brushing Tom off opens the grudge; making amends closes it', () => {
    const started = startedState({}, { crewIds: ['mika', 'tom'] })
    const brushed = resolve(
      started,
      'expedition_crew_band_tension',
      'brush_off'
    )
    assert.equal(brushed.career.expeditionRelationshipByPair[MATZE_TOM], -1)
    assert.equal(eligible('expedition_crew_band_grudge', brushed), true)
    const settled = resolve(
      brushed,
      'expedition_crew_band_grudge',
      'make_amends'
    )
    assert.equal(settled.career.expeditionRelationshipByPair[MATZE_TOM], 0)
    assert.equal(eligible('expedition_crew_band_grudge', settled), false)
  })

  test('Band<->Crew: listening to Tom unlocks his cover option', () => {
    const started = startedState({}, { crewIds: ['mika', 'tom'] })
    const cover = optionById(
      eventById('expedition_crew_injury_scare'),
      'tom_covers'
    )
    assert.equal(cover.condition(started), false)
    const heard = resolve(started, 'expedition_crew_band_tension', 'listen')
    assert.equal(heard.career.expeditionRelationshipByPair[MATZE_TOM], 1)
    assert.equal(cover.condition(heard), true)
  })

  test('Band<->Crew: the reducer refuses a locked cover option', () => {
    const started = startedState({}, { crewIds: ['mika', 'tom', 'ines'] })
    const event = eventById('expedition_crew_injury_scare')
    const dispatchCover = state => {
      const withEvent = { ...state, activeEvent: event }
      const action = applyExpeditionEventDelta(
        withEvent,
        ['crew_injury_scare_covered'],
        { eventId: event.id, optionId: 'tom_covers' }
      )
      return gameReducer(withEvent, action).expedition.crew
    }

    // Below the trust tier the option is locked: a direct dispatch changes nothing.
    assert.deepEqual(dispatchCover(started), started.expedition.crew)

    const trusted = {
      ...started,
      career: {
        ...started.career,
        expeditionRelationshipByPair: { [MATZE_TOM]: 1 }
      }
    }
    const covered = dispatchCover(trusted)
    assert.ok(covered.stressByCrewId.tom > 0)
    assert.equal(covered.injuryByCrewId.ines, 'light')
  })
})
