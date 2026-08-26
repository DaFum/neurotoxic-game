#!/usr/bin/env node
/**
 * Regenerates `.github/copilot-instructions.md` from `AGENTS.md`.
 *
 * The generated file is AGENTS.md verbatim behind a do-not-edit header.
 * `tests/node/agentInstructionsSync.test.js` fails if the two drift.
 */

import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'AGENTS.md'
const GENERATED = '.github/copilot-instructions.md'

const HEADER = [
  '<!-- GENERATED FROM /AGENTS.md — DO NOT EDIT DIRECTLY.',
  '     Edit /AGENTS.md, then run: pnpm run sync:agents',
  '     tests/node/agentInstructionsSync.test.js fails if these drift. -->',
  ''
].join('\n')

writeFileSync(GENERATED, `${HEADER}\n${readFileSync(SOURCE, 'utf8')}`)
console.log(`Synced ${GENERATED} from ${SOURCE}`)
