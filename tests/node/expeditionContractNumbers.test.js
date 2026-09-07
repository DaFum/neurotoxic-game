/**
 * @fileoverview The owning plan is authority, so the code must match it.
 *
 * Two production changes shipped without their contracts: `extracted`
 * retention moved 0.60 -> 0.70 while G1 Task 7 still said 0.60, and
 * `sponsor_advance` became a seventh Between-Tour family while G5 Task 13
 * still listed six. Both are legitimate changes - the first sits inside the
 * spec's 50-70% band, the second is a deliberate Phase A economy lever - but
 * the plan is the executable authority in this repository, and G6 sits below
 * the G1-G5 contracts. A balance artifact that calibrates one economy while
 * the contract describes another is not evidence for either.
 *
 * These read the numbers back out of the plan text so the next edit has to
 * touch both, in whichever order.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { EXPEDITION_BASE_RETENTION } from '../../src/domain/expedition/extraction'
import {
  BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT,
  BETWEEN_TOUR_SPONSOR_ADVANCE_REPAYMENT_RATE
} from '../../src/data/expedition/betweenTour'

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)
const planText = name =>
  readFileSync(
    path.join(
      REPO_ROOT,
      'docs',
      'superpowers',
      'plans',
      'roguelite-expedition',
      name
    ),
    'utf8'
  )

describe('production matches its owning plan contract', () => {
  it('G1 Task 7 declares the retention rates the code settles at', () => {
    const g1 = planText('01-expedition-core-extraction.md')
    const declared = Object.fromEntries(
      [
        ...g1.matchAll(
          /^(extracted|failed|completed)\s+Money\/Fame\s+([\d.]+)$/gm
        )
      ].map(([, kind, rate]) => [kind, Number(rate)])
    )

    assert.deepEqual(
      Object.keys(declared).sort(),
      ['completed', 'extracted', 'failed'],
      'G1 Task 7 no longer states all three base retention rates'
    )
    for (const [kind, rate] of Object.entries(declared)) {
      assert.equal(
        EXPEDITION_BASE_RETENTION[kind],
        rate,
        `EXPEDITION_BASE_RETENTION.${kind} is ${EXPEDITION_BASE_RETENTION[kind]}, but G1 Task 7 binds ${rate}`
      )
    }
  })

  it('G5 Task 13 lists every Between-Tour family the code can generate', () => {
    const g5 = planText('05-meta-regions-ascension.md')
    const union = g5.match(
      /export type BetweenTourDecisionType =\n((?:\s+\|\s+'[a-z_]+'\n)+)/
    )
    assert.ok(union, 'G5 Task 13 no longer declares BetweenTourDecisionType')
    const declared = [...union[1].matchAll(/'([a-z_]+)'/g)].map(m => m[1])

    // The generator switches on exactly these ids, so a family present in one
    // place and absent from the other is the drift this pins.
    const source = readFileSync(
      path.join(REPO_ROOT, 'src', 'domain', 'expedition', 'betweenTour.ts'),
      'utf8'
    )
    for (const family of declared) {
      assert.ok(
        source.includes(`case '${family}'`),
        `G5 Task 13 declares '${family}', which betweenTour.ts does not handle`
      )
    }
    for (const [, family] of source.matchAll(/case '([a-z_]+)': \{/g)) {
      if (!family.includes('_')) continue
      if (!source.includes(`'${family}'`)) continue
      // Only the decision families, not the option ids the same switch shape
      // is used for elsewhere in the file.
      if (!/^(sponsor|injury|crew|rival|vehicle|network)_/.test(family))
        continue
      assert.ok(
        declared.includes(family),
        `betweenTour.ts handles '${family}', which G5 Task 13 does not declare`
      )
    }

    assert.ok(
      declared.includes('sponsor_advance'),
      'sponsor_advance ships in production and must be in the contract'
    )
  })

  it('G5 Task 13 states the Sponsor advance economics the code mints', () => {
    const g5 = planText('05-meta-regions-ascension.md')
    const ceiling = Math.round(
      BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT *
        BETWEEN_TOUR_SPONSOR_ADVANCE_REPAYMENT_RATE
    )
    assert.ok(
      g5.includes(`+€${BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT} Career Cash`),
      'the advance principal in G5 Task 13 does not match BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT'
    )
    assert.ok(
      g5.includes(
        `outstanding = round(${BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT} * ${BETWEEN_TOUR_SPONSOR_ADVANCE_REPAYMENT_RATE}) = €${ceiling}`
      ),
      'the repayment ceiling in G5 Task 13 does not match the constants'
    )
  })
})
