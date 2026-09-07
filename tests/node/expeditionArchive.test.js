/**
 * @fileoverview G5 Task 12 — the Tour Archive records discovery, and only that.
 *
 * Two halves. Nothing free gets in: every entry names a canonical registry id
 * *and* carries a source proof the reducer can still see in the state it was
 * dispatched against, so a real id that was never encountered is refused. And
 * nothing gets out: the Archive is read by no availability, eligibility or
 * completion path, so what it holds can never become permission.
 */

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createRecordExpeditionArchiveDiscoveryAction } from '../../src/context/careerActionCreators'
import {
  EXPEDITION_ARCHIVE_CATEGORIES,
  getExpeditionArchiveChassisId,
  isCanonicalExpeditionArchiveEntry,
  isExpeditionArchiveCategory
} from '../../src/data/expedition/archive'
import { sweepExpeditionArchiveObservations } from '../../src/domain/expedition/archive'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers'
import { createInitialState } from '../../src/context/initialState'
import { EXPEDITION_CREW_BY_ID } from '../../src/data/expedition/crew'
import { CONTRABAND_BY_ID } from '../../src/data/contraband'
import { BRAND_DEALS_BY_ID } from '../../src/data/brandDeals'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry'
import {
  FIXTURE_REGION_ID,
  startedState,
  walkToFinale
} from '../expeditionLifecycleFixture.js'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))

const record = (state, category, id, sourceId) =>
  gameReducer(
    state,
    createRecordExpeditionArchiveDiscoveryAction(category, id, sourceId)
  )

const archived = (state, category) => state.career.archiveByCategory[category]

describe('G5 — the Archive has a category for everything a run meets', () => {
  it('names the nine categories the design lists', () => {
    assert.deepEqual(EXPEDITION_ARCHIVE_CATEGORIES.slice().sort(), [
      'chassis',
      'contraband',
      'crew',
      'finale',
      'module',
      'region',
      'rival',
      'special_event',
      'sponsor'
    ])
    for (const category of EXPEDITION_ARCHIVE_CATEGORIES) {
      assert.equal(isExpeditionArchiveCategory(category), true)
    }
    for (const bad of ['', 'nope', null, 42, '__proto__']) {
      assert.equal(isExpeditionArchiveCategory(bad), false)
    }
  })

  it('starts every category present and empty', () => {
    // A fresh Career, not the fixture run: START itself already sweeps what
    // the committed build met, which the suite below is about.
    const archive = createInitialState().career.archiveByCategory
    for (const category of EXPEDITION_ARCHIVE_CATEGORIES) {
      assert.deepEqual(archive[category], [], category)
    }
    assert.equal(Object.hasOwn(archive, '__proto__'), false)
  })

  it('refuses an id no registry holds', () => {
    for (const category of EXPEDITION_ARCHIVE_CATEGORIES) {
      for (const bad of ['', 'not_a_real_id', '__proto__']) {
        assert.equal(
          isCanonicalExpeditionArchiveEntry(category, bad),
          false,
          `${category}/${bad}`
        )
      }
    }
    // Rival is the one category with no static registry: its canonical set is
    // the Career's own generated Rivals, checked against the state instead.
    const realCrewId = Object.keys(EXPEDITION_CREW_BY_ID)[0]
    assert.equal(isCanonicalExpeditionArchiveEntry('crew', realCrewId), true)
    assert.equal(isCanonicalExpeditionArchiveEntry('rival', 'rival_1'), false)
  })

  it('validates a chassis by looking its coordinate back up', () => {
    assert.equal(
      isCanonicalExpeditionArchiveEntry(
        'chassis',
        getExpeditionArchiveChassisId('tourbus_chassis', 'legit', 1)
      ),
      true
    )
    for (const bad of [
      getExpeditionArchiveChassisId('tourbus_chassis', 'legit', 99),
      getExpeditionArchiveChassisId('tourbus_chassis', 'nope', 1),
      getExpeditionArchiveChassisId('not_a_kind', 'legit', 1),
      'tourbus_chassis:legit',
      'tourbus_chassis:legit:1:extra',
      '__proto__:legit:1'
    ]) {
      assert.equal(
        isCanonicalExpeditionArchiveEntry('chassis', bad),
        false,
        bad
      )
    }
  })
})

describe('G5 — a real id still needs a proof of the encounter', () => {
  const started = startedState({ money: 5000 })
  const runId = started.expedition.runId

  it('records the Region the run actually committed to', () => {
    const recorded = record(started, 'region', FIXTURE_REGION_ID, runId)
    assert.deepEqual(archived(recorded, 'region'), [FIXTURE_REGION_ID])
  })

  it('refuses a real Region this run did not book', () => {
    // The whole point of the source proof: `festival_fields` is canonical, and
    // the run has never been there.
    assert.equal(record(started, 'region', 'festival_fields', runId), started)
  })

  it('refuses a proof that names another run', () => {
    assert.equal(
      record(started, 'region', FIXTURE_REGION_ID, 'some_other_run'),
      started
    )
  })

  it('refuses a sponsor the run only had on offer', () => {
    const dealId = [...BRAND_DEALS_BY_ID.keys()][0]
    assert.equal(record(started, 'sponsor', dealId, runId), started)
    // Signed, and it counts.
    const signed = {
      ...started,
      social: {
        ...started.social,
        activeDeals: [{ ...BRAND_DEALS_BY_ID.get(dealId), remainingGigs: 3 }]
      }
    }
    assert.deepEqual(
      archived(record(signed, 'sponsor', dealId, runId), 'sponsor'),
      [dealId]
    )
  })

  it('refuses a Rival that is not the one on the road', () => {
    const rivalId = 'rival_1'
    const met = {
      ...started,
      rivalBand: {
        id: rivalId,
        name: 'R',
        alignment: 'NEUTRAL',
        powerLevel: 3
      },
      career: {
        ...started.career,
        // Cleared first: START already swept the fixture's own Rival, and the
        // subject here is the proof rather than the accumulation.
        archiveByCategory: {
          ...started.career.archiveByCategory,
          rival: []
        },
        rivalsById: { [rivalId]: { snapshot: {}, history: {} } }
      }
    }
    assert.deepEqual(archived(record(met, 'rival', rivalId, runId), 'rival'), [
      rivalId
    ])
    // A Rival the Career has history with but that is not on this road.
    assert.equal(record(met, 'rival', 'rival_2', runId), met)
    // And one on the road the Career has no record of.
    const stranger = { ...met, career: { ...met.career, rivalsById: {} } }
    assert.equal(record(stranger, 'rival', rivalId, runId), stranger)
  })

  it('binds a module and a chassis to the asset that carries them', () => {
    const moduleId = Object.keys(MODULE_REGISTRY)[0]
    const asset = {
      id: 'asset_bus',
      kind: 'tourbus_chassis',
      chassisFlavor: 'legit',
      chassisTier: 1,
      condition: 80,
      slots: [{ id: 'slot_1', installedModuleId: moduleId }]
    }
    const withBus = {
      ...started,
      assets: [asset],
      expedition: {
        ...started.expedition,
        loadout: {
          ...started.expedition.loadout,
          activeTourbusAssetId: asset.id
        }
      }
    }
    assert.deepEqual(
      archived(record(withBus, 'module', moduleId, asset.id), 'module'),
      [moduleId]
    )
    assert.deepEqual(
      archived(
        record(
          withBus,
          'chassis',
          getExpeditionArchiveChassisId('tourbus_chassis', 'legit', 1),
          asset.id
        ),
        'chassis'
      ),
      [getExpeditionArchiveChassisId('tourbus_chassis', 'legit', 1)]
    )
    // The run id is not a proof for these: the asset is.
    assert.equal(record(withBus, 'module', moduleId, runId), withBus)
    // A module the Career owns but has not installed on this bus.
    const otherModuleId = Object.keys(MODULE_REGISTRY)[1]
    assert.equal(record(withBus, 'module', otherModuleId, asset.id), withBus)
  })

  it('refuses malformed and hostile payloads', () => {
    for (const payload of [
      null,
      42,
      {},
      { category: 'region', id: FIXTURE_REGION_ID },
      { category: 'nope', id: FIXTURE_REGION_ID, sourceId: runId },
      { category: 'region', id: FIXTURE_REGION_ID, sourceId: '' },
      { category: 'region', id: '__proto__', sourceId: runId },
      { category: '__proto__', id: FIXTURE_REGION_ID, sourceId: runId }
    ]) {
      assert.equal(
        gameReducer(started, {
          type: ActionTypes.RECORD_EXPEDITION_ARCHIVE_DISCOVERY,
          payload
        }),
        started
      )
    }
    assert.equal(
      Object.hasOwn(started.career.archiveByCategory, '__proto__'),
      false
    )
  })

  it('is an identity no-op the second time', () => {
    const once = record(started, 'region', FIXTURE_REGION_ID, runId)
    // Meeting the same thing twice is not an error, it just does not grow.
    assert.equal(record(once, 'region', FIXTURE_REGION_ID, runId), once)
  })
})

describe('G5 — the Archive is written by the run, not by a caller', () => {
  it('logs the committed build at START', () => {
    // The commit is the encounter: a run that is abandoned before it finishes
    // still met the Crew and the Region it booked.
    const started = startedState({ money: 5000 })
    assert.deepEqual(
      archived(started, 'region'),
      [FIXTURE_REGION_ID],
      'the committed Region must be logged at START'
    )
    assert.deepEqual(
      archived(started, 'crew').slice().sort(),
      [...started.expedition.loadout.crewIds].sort()
    )
  })

  it('logs the Finale a completed run resolved', () => {
    const atFinale = walkToFinale(startedState({ money: 5000 }))
    const resolved = {
      ...atFinale,
      currentGig: { id: 'finale_venue' },
      lastGigStats: { score: 9000, accuracy: 85, failed: false },
      expedition: {
        ...atFinale.expedition,
        // The Finale profile the run committed to. The fixture route never
        // selects one, and a run with no `finaleType` has no Finale to log.
        finaleType: 'regional_headliner',
        lastGigResolvedAtRouteStep: atFinale.expedition.routeStep
      }
    }
    const completed = gameReducer(resolved, {
      type: ActionTypes.COMPLETE_EXPEDITION,
      payload: {
        finaleResultId: 'finale_result_archive',
        expectedRouteStep: resolved.expedition.routeStep
      }
    })
    assert.equal(completed.expedition.status, 'completed')
    assert.deepEqual(archived(completed, 'finale'), [
      completed.expedition.finaleType
    ])
  })

  it('offers only claims the validator would accept', () => {
    // The sweep decides what to *offer*; it never decides what is accepted, so
    // everything it composes has to survive the same gate a dispatch does.
    const started = startedState({ money: 5000 })
    const swept = sweepExpeditionArchiveObservations(started)
    assert.ok(swept.length > 0)
    for (const claim of swept) {
      const before = {
        ...started,
        career: {
          ...started.career,
          archiveByCategory: {
            ...started.career.archiveByCategory,
            [claim.category]: []
          }
        }
      }
      assert.notEqual(
        record(before, claim.category, claim.id, claim.sourceId),
        before,
        `${claim.category}/${claim.id} was swept but is not recordable`
      )
    }
  })

  it('sweeps nothing when there is no run to observe', () => {
    const idle = startedState()
    assert.deepEqual(
      sweepExpeditionArchiveObservations({
        ...idle,
        expedition: { ...idle.expedition, runId: null }
      }),
      []
    )
  })
})

describe('G5 — the Archive survives a load without becoming authority', () => {
  it('keeps canonical entries and drops everything else', () => {
    const contrabandId = [...CONTRABAND_BY_ID.keys()][0]
    // Built from JSON text, not an object literal: `__proto__:` in a literal
    // sets the prototype instead of creating an own property, and
    // `JSON.stringify` then omits it entirely - so the sanitizer would never
    // see the hostile key this case exists to reject.
    const raw = JSON.parse(
      `{
        "region": ${JSON.stringify([
          FIXTURE_REGION_ID,
          'not_a_region',
          FIXTURE_REGION_ID
        ])},
        "contraband": ${JSON.stringify([contrabandId, ''])},
        "rival": ["rival_1", 42],
        "not_a_category": ["whatever"],
        "__proto__": ["hostile"]
      }`
    )
    assert.equal(Object.hasOwn(raw, '__proto__'), true)
    const sanitized = sanitizeCareerState({ archiveByCategory: raw })
    assert.deepEqual(sanitized.archiveByCategory.region, [FIXTURE_REGION_ID])
    assert.deepEqual(sanitized.archiveByCategory.contraband, [contrabandId])
    // Rival ids are Career-generated, so they are narrowed rather than looked
    // up - and re-proven against `rivalsById` whenever one is recorded.
    assert.deepEqual(sanitized.archiveByCategory.rival, ['rival_1'])
    assert.equal(
      Object.hasOwn(sanitized.archiveByCategory, 'not_a_category'),
      false
    )
    assert.equal(Object.hasOwn(sanitized.archiveByCategory, '__proto__'), false)
    for (const category of EXPEDITION_ARCHIVE_CATEGORIES) {
      assert.ok(Array.isArray(sanitized.archiveByCategory[category]), category)
    }
  })

  it('is read by nothing that decides what a Career may do', () => {
    // The binding contract: the Archive is discovery only. Anything reading it
    // outside its own module, its sanitizer and the UI would be an unlock path
    // wearing a log's name.
    const roots = ['src/domain', 'src/data', 'src/context', 'src/utils']
    const offenders = []
    for (const root of roots) {
      for (const name of readdirSync(join(REPO_ROOT, root), {
        recursive: true
      })) {
        const file = String(name)
        if (!/\.tsx?$/.test(file)) continue
        if (
          file.endsWith('expedition/archive.ts') ||
          // The initial-Career factory builds the empty log; it reads nothing.
          file.endsWith('expedition/career.ts') ||
          // Between-Tour reads the Region log to pick a *decision target* and
          // writes one back when the lead is followed. Neither is authority:
          // it decides what the Career is asked, never what it may do.
          file.endsWith('expedition/betweenTour.ts') ||
          file.endsWith('reducers/careerReducer.ts') ||
          file.endsWith('reducers/careerSanitizers.ts')
        ) {
          continue
        }
        const source = readFileSync(join(REPO_ROOT, root, file), 'utf8')
        if (source.includes('archiveByCategory')) {
          offenders.push(join(root, file))
        }
      }
    }
    assert.deepEqual(offenders, [])
  })
})
