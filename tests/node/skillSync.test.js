/**
 * @fileoverview Guards the generated Copilot code-review skill file against drift.
 *
 * `.github/skills/code-review/SKILL.md` is generated from
 * `.agents/skills/github-code-review/SKILL.md`. This test ensures both stay
 * in sync.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const GENERATED = '.github/skills/code-review/SKILL.md'
const SOURCE = '.agents/skills/github-code-review/SKILL.md'

const EXPECTED_HEADER = [
  '<!-- GENERATED FROM .agents/skills/github-code-review/SKILL.md — DO NOT EDIT DIRECTLY.',
  '     Edit .agents/skills/github-code-review/SKILL.md, then run: pnpm run sync:skills',
  '     tests/node/skillSync.test.js fails if these drift. -->',
  ''
].join('\n')

describe('generated code-review skill file', () => {
  it('keeps the Copilot code-review skill synchronized with the canonical github-code-review skill', () => {
    const generated = readFileSync(GENERATED, 'utf8')
    const source = readFileSync(SOURCE, 'utf8')

    const sourceWithReplacedName = source.replace(/^name:\s*github-code-review$/m, 'name: code-review')
    const frontmatterEndIndex = sourceWithReplacedName.indexOf('---\n', 3)
    const insertPos = frontmatterEndIndex + 4
    const expectedGenerated =
      sourceWithReplacedName.slice(0, insertPos) +
      '\n' +
      EXPECTED_HEADER +
      sourceWithReplacedName.slice(insertPos)

    assert.equal(
      generated,
      expectedGenerated,
      `${GENERATED} has drifted from ${SOURCE}. Run: pnpm run sync:skills`
    )
  })

  it('contains the trust boundary section', () => {
    const generated = readFileSync(GENERATED, 'utf8')
    assert.ok(
      generated.includes('### 0. Establish trust boundary'),
      `${GENERATED} missing Trust Boundary section`
    )
  })
})
