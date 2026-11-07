#!/usr/bin/env node
// analyze-duplicates.js
// ESM — requires "type": "module" in package.json (or rename to .mjs)
//
// Usage:
//   node scripts/analyze-duplicates.js
//     Standalone: prints the Markdown summary of ./jscpd-report to stdout.
//   node scripts/analyze-duplicates.js --markdown-file <path>
//     Result mode, used by scripts/lint-fix-preview.sh: writes the Markdown
//     summary to <path> and prints exactly one line, `status=ok total=<n>`,
//     where <n> counts the validated non-empty clusters. Fails closed: a
//     missing report prints `status=missing`, an invalid report (including
//     unsupported legacy shapes such as `clones`) prints `status=invalid`; both
//     exit 1 and write no Markdown, so neither can be read as zero duplicates.
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
// Arguments other than --markdown-file were always ignored by the standalone
// CLI and still are; only a malformed --markdown-file is a usage error.
const markdownFlagIndex = args.indexOf('--markdown-file')
const markdownFile =
  markdownFlagIndex === -1 ? null : (args[markdownFlagIndex + 1] ?? '')
if (markdownFile === '' || markdownFile?.startsWith('-')) {
  console.error('Usage: analyze-duplicates.js [--markdown-file <path>]')
  process.exit(2)
}

const reportMissing = message => {
  if (markdownFile !== null) {
    console.error(message)
    console.log('status=missing')
    process.exit(1)
  }
  console.log(`### Duplicate code\n\n${message}`)
  process.exit(0)
}

const dir = './jscpd-report'
if (!fs.existsSync(dir)) {
  reportMissing('No jscpd-report directory found.')
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
if (files.length === 0) {
  reportMissing('No jscpd-report JSON files found.')
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
    if (markdownFile !== null) console.log('status=invalid')
    process.exit(1)
  }
}

clones.sort((a, b) => b.lines - a.lines || b.tokens - a.tokens)

const top = clones.slice(0, 8)

const lines = []
const emit = line => lines.push(`${line}\n`)

if (top.length === 0) {
  emit(
    '### Duplicate code\n\nNo significant duplicates found (per jscpd thresholds).'
  )
} else {
  // Added total cluster count to summary for better context
  const totalClusters = clones.length
  const shown = top.length
  emit('### Duplicate code\n')
  emit(
    `Found **${totalClusters}** duplicate cluster${totalClusters !== 1 ? 's' : ''}` +
      (totalClusters > shown ? ` — showing top ${shown}` : '') +
      '. These appear to be copy/pasted blocks. Recommendation: extract shared logic into helper functions/modules (or shared components/hooks), then replace duplicates with calls.\n'
  )
  emit('**Top duplicate clusters:**\n')

  top.forEach((d, idx) => {
    const size = `${d.lines} lines / ${d.tokens} tokens`
    emit(`**${idx + 1}) ${size}**`)
    for (const file of [d.firstFile, d.secondFile]) {
      emit(`- \`${file.name}:${file.start}-${file.end}\``)
    }
    emit('')
    emit('Suggested refactor pattern:')
    emit('- Identify shared inputs/outputs and isolate side-effects')
    emit(
      '- Extract into a helper (e.g. `src/utils/...`, `src/lib/...`) or a shared hook/component'
    )
    emit('- Replace each block with a call; keep behavior identical')
    emit('- Add/adjust tests if available')
    emit('')
  })
}

const markdown = lines.join('')
if (markdownFile === null) {
  process.stdout.write(markdown)
} else {
  fs.writeFileSync(markdownFile, markdown)
  console.log(`status=ok total=${clones.length}`)
}
