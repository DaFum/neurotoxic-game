/**
 * @fileoverview Guards the generated Copilot instruction file against drift.
 *
 * `.github/copilot-instructions.md` declares itself generated from `AGENTS.md`,
 * but nothing enforced that. It silently diverged into a hand-edited file
 * carrying rules that were never in `AGENTS.md` at all -- including a testing
 * rule that produced a wrong code-review finding. This test is the enforcement
 * the banner always claimed.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const GENERATED = '.github/copilot-instructions.md'
const SOURCE = 'AGENTS.md'
const HEADER_LINES = 4

describe('generated agent instruction files', () => {
  it('keeps the Copilot file byte-identical to AGENTS.md below its header', () => {
    const generated = readFileSync(GENERATED, 'utf8')
    const source = readFileSync(SOURCE, 'utf8')
    const body = generated.split('\n').slice(HEADER_LINES).join('\n')

    assert.equal(
      body,
      source,
      `${GENERATED} has drifted from ${SOURCE}. Run: pnpm run sync:agents`
    )
  })

  it('keeps the do-not-edit header on the generated file', () => {
    const generated = readFileSync(GENERATED, 'utf8')

    assert.match(generated, /^<!-- GENERATED FROM \/AGENTS\.md/)
    assert.match(generated, /pnpm run sync:agents/)
  })
})
