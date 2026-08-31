#!/usr/bin/env node
/**
 * Synchronizes `.github/skills/code-review/SKILL.md` from `.agents/skills/github-code-review/SKILL.md`.
 *
 * `.github/skills/code-review/SKILL.md` is generated from `.agents/skills/github-code-review/SKILL.md`
 * with modified frontmatter name ('code-review') and a sync warning banner.
 * `tests/node/skillSync.test.js` fails if they drift.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'

const SOURCE = '.agents/skills/github-code-review/SKILL.md'
const GENERATED = '.github/skills/code-review/SKILL.md'
const SOURCE_REFS = '.agents/skills/github-code-review/references'
const GENERATED_REFS = '.github/skills/code-review/references'

const HEADER_COMMENT = [
  '<!-- GENERATED FROM .agents/skills/github-code-review/SKILL.md — DO NOT EDIT DIRECTLY.',
  '     Edit .agents/skills/github-code-review/SKILL.md, then run: pnpm run sync:skills',
  '     tests/node/skillSync.test.js fails if these drift. -->',
  ''
].join('\n')

const sourceContent = readFileSync(SOURCE, 'utf8')

const HOST_DESCRIPTION = `description: >
  Run as the Copilot host-integrated code review for this repository. Invoke when GitHub Copilot
  is explicitly asked to review a pull request from within the GitHub host interface (PR page,
  Copilot chat on a PR). Delegates to the canonical github-code-review skill in
  .agents/skills/github-code-review — do not invoke both simultaneously.`

// Parse frontmatter in a line-ending agnostic way
const frontmatterMatch = sourceContent.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/)

let generatedContent
if (frontmatterMatch) {
  let frontmatter = frontmatterMatch[1]
  const body = sourceContent.slice(frontmatter.length)

  frontmatter = frontmatter.replace(/^name:\s*github-code-review$/m, 'name: code-review')
  frontmatter = frontmatter.replace(/^description:\s*>[\s\S]*?(?=^compatibility:)/m, `${HOST_DESCRIPTION}\n`)

  generatedContent = `${frontmatter}\n${HEADER_COMMENT}\n${body}`
} else {
  generatedContent = `${HEADER_COMMENT}\n${sourceContent}`
}

mkdirSync(dirname(GENERATED), { recursive: true })
writeFileSync(GENERATED, generatedContent, 'utf8')
console.log(`Synced ${GENERATED} from ${SOURCE}`)

rmSync(GENERATED_REFS, { recursive: true, force: true })
mkdirSync(GENERATED_REFS, { recursive: true })
const refFiles = readdirSync(SOURCE_REFS)
for (const file of refFiles) {
  cpSync(join(SOURCE_REFS, file), join(GENERATED_REFS, file))
}
console.log(`Synced reference files in ${GENERATED_REFS} from ${SOURCE_REFS}`)
