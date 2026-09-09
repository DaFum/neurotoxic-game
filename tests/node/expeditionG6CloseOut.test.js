/**
 * @fileoverview The G6 close-out must describe the artifact that is committed.
 *
 * The close-out section claimed `Correctness is green` while the committed v15
 * artifact reported `passed: false`, and carried Task 12 counts (44/6000 and
 * 37/6000) from a run three economy passes old, plus a 100%-completion
 * observation that two profiles no longer show. Prose drifts from evidence
 * silently: nothing fails when a number in a plan goes stale, and the master
 * plan only marks a gate green when its child exit criteria actually pass.
 *
 * So the section is pinned to the artifact rather than trusted. These read the
 * figures back out of the Markdown and compare them with the JSON.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
)

const closeOut = () => {
  const text = readFileSync(
    path.join(
      REPO_ROOT,
      'docs',
      'superpowers',
      'plans',
      'roguelite-expedition',
      '06-balance-simulator-recalibration.md'
    ),
    'utf8'
  ).replaceAll('\r\n', '\n')
  const start = text.indexOf('## Open at G6 close')
  assert.ok(start > 0, 'the G6 close-out section is gone')
  return text.slice(start)
}

const artifact = () =>
  JSON.parse(
    readFileSync(
      path.join(
        REPO_ROOT,
        'docs',
        'superpowers',
        'reports',
        'roguelite-expedition-v15-balance.json'
      ),
      'utf8'
    )
  )

/** The Task 12 produced/expected counts the artifact's own failure text names. */
const taskTwelveCounts = report =>
  report.hardFailures
    .map(line =>
      line.match(/Task 12 [^(]*\((\w+)\) produced (\d+) of the expected (\d+)/)
    )
    .filter(Boolean)
    .map(([, cohort, produced, expected]) => ({
      cohort,
      produced: Number(produced),
      expected: Number(expected)
    }))

describe('the G6 close-out matches the committed artifact', () => {
  it('does not claim a verdict the artifact contradicts', () => {
    const report = artifact()
    const section = closeOut()

    if (report.passed === true) {
      assert.doesNotMatch(
        section,
        /not green/,
        'the artifact passes, so the close-out may not call correctness not green'
      )
    }
    if (report.passed !== true) {
      assert.doesNotMatch(
        section,
        /^Correctness is green/m,
        'the artifact reports hard correctness failures, so the close-out may not open by calling correctness green'
      )
      assert.match(
        section,
        /not green/,
        'the artifact is failing and the close-out has to say so'
      )
    }
  })

  it('states the Task 12 counts the artifact actually produced', () => {
    const report = artifact()
    const section = closeOut()
    const counts = taskTwelveCounts(report)

    if (counts.length > 0) {
      // Still short: every produced/expected pair has to appear verbatim.
      for (const { cohort, produced, expected } of counts) {
        assert.ok(
          section.includes(`${produced} / ${expected}`),
          `the close-out does not state the ${cohort} count ${produced} / ${expected}`
        )
      }
    } else {
      // Covered: the section must say so with the full counts, not merely stop
      // mentioning a shortfall. Silence would read as a stale section.
      const rows = report.coverage?.expected ?? []
      for (const row of rows) {
        if (!String(row.label ?? '').includes('Task 12')) continue
        assert.ok(
          section.includes(`${row.actual} / ${row.expected}`),
          `Task 12 is fully covered at ${row.actual} / ${row.expected}; the close-out has to state it`
        )
      }
      assert.match(
        section,
        /Correctness is green/,
        'the artifact passes and the close-out has to say so'
      )
    }

    // The superseded figures that made this test necessary, named so a
    // copy-paste of an older section fails loudly rather than reading well.
    for (const stale of ['44 of 6,000', '37 of 6,000', '3768 / 6000']) {
      assert.ok(
        !section.includes(stale),
        `the close-out still carries the superseded count "${stale}"`
      )
    }
  })

  it('counts the open corridor findings the artifact lists', () => {
    const report = artifact()
    const section = closeOut()
    const corridor = report.softFindings.filter(f =>
      f.startsWith('Balance corridor:')
    ).length
    if (corridor === 0) return
    assert.ok(
      section.includes(`${corridor} open outcome-mix corridor finding`),
      `the close-out does not account for the ${corridor} corridor findings in the artifact`
    )
  })

  it('does not describe a profile as completing every seed unless it does', () => {
    const report = artifact()
    const section = closeOut()
    const perfect = Object.entries(report.calibrationSummary)
      .filter(([, s]) => s.completedRate >= 1)
      .map(([id]) => id)

    for (const [id, summary] of Object.entries(report.calibrationSummary)) {
      if (perfect.includes(id)) continue
      const claim = new RegExp(`\`${id}\`[^.]*100% of seeds`)
      assert.doesNotMatch(
        section,
        claim,
        `the close-out says ${id} completes every seed, but the artifact reports ${(summary.completedRate * 100).toFixed(1)}%`
      )
    }
  })
})
