/**
 * @fileoverview Guards the generated Copilot code-review skill file against drift.
 *
 * `.github/skills/code-review/SKILL.md` is generated from
 * `.agents/skills/github-code-review/SKILL.md`. This test ensures both stay
 * in sync.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const GENERATED = '.github/skills/code-review/SKILL.md'
const SOURCE = '.agents/skills/github-code-review/SKILL.md'
const GENERATED_REFS = '.github/skills/code-review/references'
const SOURCE_REFS = '.agents/skills/github-code-review/references'

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

  it('keeps all reference files byte-identical between source and generated skill directories', () => {
    const sourceRefFiles = readdirSync(SOURCE_REFS).sort()
    const generatedRefFiles = readdirSync(GENERATED_REFS).sort()

    assert.deepEqual(
      generatedRefFiles,
      sourceRefFiles,
      `${GENERATED_REFS} file list differs from ${SOURCE_REFS}. Run: pnpm run sync:skills`
    )

    for (const file of sourceRefFiles) {
      const sourceContent = readFileSync(join(SOURCE_REFS, file), 'utf8')
      const generatedContent = readFileSync(join(GENERATED_REFS, file), 'utf8')

      assert.equal(
        generatedContent,
        sourceContent,
        `${join(GENERATED_REFS, file)} has drifted from ${join(SOURCE_REFS, file)}. Run: pnpm run sync:skills`
      )
    }
  })
})
