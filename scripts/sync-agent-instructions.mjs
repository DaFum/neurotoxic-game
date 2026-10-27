#!/usr/bin/env node
/**
 * Regenerates `.github/copilot-instructions.md` and `GEMINI.md` from `AGENTS.md`.
 *
 * Each generated file is AGENTS.md verbatim behind a do-not-edit header.
 * `tests/node/agentInstructionsSync.test.js` fails if the two drift.
 */

import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'AGENTS.md'
const GENERATED = ['.github/copilot-instructions.md', 'GEMINI.md']

const HEADER = [
  '<!-- GENERATED FROM /AGENTS.md — DO NOT EDIT DIRECTLY.',
  '     Edit /AGENTS.md, then run: pnpm run sync:agents',
  '     tests/node/agentInstructionsSync.test.js fails if these drift. -->',
  ''
].join('\n')

const source = readFileSync(SOURCE, 'utf8')
for (const target of GENERATED) {
  writeFileSync(target, `${HEADER}\n${source}`)
  console.log(`Synced ${target} from ${SOURCE}`)
}
