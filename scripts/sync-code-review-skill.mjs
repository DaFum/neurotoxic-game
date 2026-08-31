#!/usr/bin/env node
/**
 * Synchronizes `.github/skills/code-review/SKILL.md` from `.agents/skills/github-code-review/SKILL.md`.
 *
 * `.github/skills/code-review/SKILL.md` is generated from `.agents/skills/github-code-review/SKILL.md`
 * with modified frontmatter name ('code-review') and a sync warning banner.
 * `tests/node/skillSync.test.js` fails if they drift.
 */

import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = '.agents/skills/github-code-review/SKILL.md'
const GENERATED = '.github/skills/code-review/SKILL.md'

const HEADER_COMMENT = [
  '<!-- GENERATED FROM .agents/skills/github-code-review/SKILL.md — DO NOT EDIT DIRECTLY.',
  '     Edit .agents/skills/github-code-review/SKILL.md, then run: pnpm run sync:skills',
  '     tests/node/skillSync.test.js fails if these drift. -->',
  ''
].join('\n')

const sourceContent = readFileSync(SOURCE, 'utf8')

// Replace `name: github-code-review` with `name: code-review` in frontmatter
let generatedContent = sourceContent.replace(
  /^name:\s*github-code-review$/m,
  'name: code-review'
)

// Insert header comment right after frontmatter closing `---`
const frontmatterEndIndex = generatedContent.indexOf('---\n', 3)
if (frontmatterEndIndex !== -1) {
  const insertPos = frontmatterEndIndex + 4
  generatedContent =
    generatedContent.slice(0, insertPos) +
    '\n' +
    HEADER_COMMENT +
    generatedContent.slice(insertPos)
} else {
  generatedContent = HEADER_COMMENT + '\n' + generatedContent
}

writeFileSync(GENERATED, generatedContent, 'utf8')
console.log(`Synced ${GENERATED} from ${SOURCE}`)
