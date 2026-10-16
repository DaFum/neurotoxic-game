#!/usr/bin/env node
// analyze-duplicates.js
// ESM — requires "type": "module" in package.json (or rename to .mjs)
import fs from 'fs'
import path from 'path'

const dir = './jscpd-report'
if (!fs.existsSync(dir)) {
  console.log('### Duplicate code\n\nNo jscpd-report directory found.')
  process.exit(0)
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
if (files.length === 0) {
  console.log('### Duplicate code\n\nNo jscpd-report JSON files found.')
  process.exit(0)
}

const clones = []
for (const f of files) {
  const p = path.join(dir, f)
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const data = JSON.parse(raw)
    if (!Array.isArray(data?.duplicates)) {
      throw new Error('Expected a duplicates array.')
    }
    // jscpd is pinned in package.json; its JSON report uses two file locations.
    for (const clone of data.duplicates) {
      const validFiles = [clone?.firstFile, clone?.secondFile].every(
        file =>
          typeof file?.name === 'string' &&
          file.name.trim().length > 0 &&
          Number.isInteger(file.start) &&
          file.start > 0 &&
          Number.isInteger(file.end) &&
          file.end >= file.start
      )
      if (
        !validFiles ||
        !Number.isFinite(clone.lines) ||
        clone.lines < 0 ||
        !Number.isFinite(clone.tokens) ||
        clone.tokens < 0
      ) {
        throw new Error('Invalid duplicate cluster in jscpd report.')
      }
      if (clone.lines > 0 || clone.tokens > 0) clones.push(clone)
    }
  } catch (error) {
    console.error(`Unable to analyze jscpd report "${p}": ${error.message}`)
    process.exit(1)
  }
}

clones.sort((a, b) => b.lines - a.lines || b.tokens - a.tokens)

const top = clones.slice(0, 8)

if (top.length === 0) {
  console.log(
    '### Duplicate code\n\nNo significant duplicates found (per jscpd thresholds).'
  )
  process.exit(0)
}

// Added total cluster count to summary for better context
const totalClusters = clones.length
const shown = top.length
console.log('### Duplicate code\n')
console.log(
  `Found **${totalClusters}** duplicate cluster${totalClusters !== 1 ? 's' : ''}` +
    (totalClusters > shown ? ` — showing top ${shown}` : '') +
    '. These appear to be copy/pasted blocks. Recommendation: extract shared logic into helper functions/modules (or shared components/hooks), then replace duplicates with calls.\n'
)
console.log('**Top duplicate clusters:**\n')

top.forEach((d, idx) => {
  const size = `${d.lines} lines / ${d.tokens} tokens`
  console.log(`**${idx + 1}) ${size}**`)
  for (const file of [d.firstFile, d.secondFile]) {
    console.log(`- \`${file.name}:${file.start}-${file.end}\``)
  }
  console.log('')
  console.log('Suggested refactor pattern:')
  console.log('- Identify shared inputs/outputs and isolate side-effects')
  console.log(
    '- Extract into a helper (e.g. `src/utils/...`, `src/lib/...`) or a shared hook/component'
  )
  console.log('- Replace each block with a call; keep behavior identical')
  console.log('- Add/adjust tests if available')
  console.log('')
})
