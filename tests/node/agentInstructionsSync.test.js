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

// The exact block `scripts/sync-agent-instructions.mjs` writes. Pinning it
// whole rather than matching fragments means a reworded or reordered header
// fails here instead of silently drifting from the generator.
const EXPECTED_HEADER = [
  '<!-- GENERATED FROM /AGENTS.md — DO NOT EDIT DIRECTLY.',
  '     Edit /AGENTS.md, then run: pnpm run sync:agents',
  '     tests/node/agentInstructionsSync.test.js fails if these drift. -->',
  ''
].join('\n')

const HEADER_LINES = EXPECTED_HEADER.split('\n').length

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

  it('opens with the exact generated-file header', () => {
    const generated = readFileSync(GENERATED, 'utf8')

    assert.equal(
      generated.slice(0, EXPECTED_HEADER.length),
      EXPECTED_HEADER,
      `${GENERATED} header does not match the generator. Run: pnpm run sync:agents`
    )
  })
})
