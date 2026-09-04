/**
 * @fileoverview Structural invariants the Expedition plan authority depends on.
 *
 * Two classes of regression are cheap to introduce and expensive to find later:
 * a second run-seed owner (which silently lets the Tour Prep preview and the
 * played route diverge) and a resurrected contract from a superseded
 * `00-*` review record. Both are pinned here.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createInitialState } from '../../src/context/initialState'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { createRawLoadPayload } from '../../src/context/usePersistence'
import { ActionTypes } from '../../src/context/actionTypes'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers'

const repoPath = relative =>
  fileURLToPath(new URL(`../../${relative}`, import.meta.url))

describe('single run-seed owner', () => {
  it('drops an Expedition-local seed from a legacy save', () => {
    const sanitized = sanitizeExpeditionState({
      status: 'idle',
      runSeed: 999999
    })
    assert.equal(Object.hasOwn(sanitized, 'runSeed'), false)
  })

  it('keeps the root runSeed authoritative when a save carries both', () => {
    const state = createInitialState()
    // Deliberately mismatched: the Expedition slice claims one seed, the root
    // another. Only the root value may survive.
    const loaded = handleLoadGame(
      state,
      createRawLoadPayload(
        {
          version: state.version,
          runSeed: 4242,
          expedition: {
            status: 'prepared',
            prep: { prepId: 'prep-legacy' },
            runSeed: 999999
          }
        },
        []
      )
    )

    assert.equal(loaded.runSeed, 4242)
    assert.equal(Object.hasOwn(loaded.expedition, 'runSeed'), false)
    assert.equal(loaded.expedition.status, 'prepared')
  })

  it('declares no seed field on the persisted Expedition slice', () => {
    const source = readFileSync(repoPath('src/types/expedition.d.ts'), 'utf8')
    const marker = 'export interface ExpeditionState'
    const start = source.indexOf(marker)
    assert.ok(start >= 0, 'ExpeditionState declaration not found')
    // `ExpeditionMap.runSeed` is a derived echo of the root seed used by the
    // START parity check, not a stored owner, so the check is scoped to the
    // persisted state interface.
    assert.equal(source.slice(start).includes('runSeed'), false)
  })
})

describe('no fictitious per-member equip action', () => {
  it('ships no per-member Expedition equip action type', () => {
    for (const type of Object.keys(ActionTypes)) {
      assert.equal(
        /^EQUIP_|_EQUIP_MEMBER$|^SET_MEMBER_EQUIPMENT$/.test(type),
        false,
        `${type} reintroduces a per-member equip action; Expedition equipment is a run-only selection over owned HQ purchases`
      )
    }
  })
})

describe('plan authority records', () => {
  const planDir = 'docs/superpowers/plans/roguelite-expedition'

  it('marks every 00-* child file as non-normative', () => {
    const files = readdirSync(repoPath(planDir)).filter(name =>
      name.startsWith('00')
    )
    assert.ok(files.length > 0, 'expected historical review records to exist')
    for (const file of files) {
      const source = readFileSync(repoPath(`${planDir}/${file}`), 'utf8')
      assert.match(
        source,
        /NON-NORMATIVE|non-normative/,
        `${file} must declare itself non-normative so a superseded contract cannot be implemented`
      )
    }
  })

  it('keeps the six normative child plans present', () => {
    const expected = [
      '01-expedition-core-extraction.md',
      '02-condition-repairs-cargo.md',
      '03-crew-stress-relationships.md',
      '04-pressure-rivals-contracts.md',
      '05-meta-regions-ascension.md',
      '06-balance-simulator-recalibration.md'
    ]
    const present = readdirSync(repoPath(planDir))
    for (const file of expected) {
      assert.ok(present.includes(file), `${file} is missing`)
    }
  })
})
