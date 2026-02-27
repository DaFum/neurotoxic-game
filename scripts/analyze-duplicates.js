#!/usr/bin/env node
// analyze-duplicates.js (ES module)
// Updated to use ESM imports because package.json contains "type": "module".
import fs from 'fs'
import path from 'path'

const dir = './jscpd-report'
if (!fs.existsSync(dir)) {
  console.log(
    '### Duplicate code (doubled code)\n\nNo jscpd-report directory found.'
  )
  process.exit(0)
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
if (files.length === 0) {
  console.log(
    '### Duplicate code (doubled code)\n\nNo jscpd-report JSON files found.'
  )
  process.exit(0)
}

let clones = []
for (const f of files) {
  const p = path.join(dir, f)
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const data = JSON.parse(raw)
    const list =
      data?.clones ||
      data?.duplicates ||
      data?.report?.clones ||
      data?.result?.clones ||
      []
    if (Array.isArray(list)) clones.push(...list)
  } catch (err) {
    // skip malformed JSON
  }
}

const normalized = clones
  .map(c => {
    const instances = c?.instances || c?.duplications || c?.fragments || []
    const inst = instances
      .map(x => {
        const file =
          x?.file ||
          x?.sourceId ||
          x?.path ||
          x?.name ||
          x?.source ||
          x?.sourceFile
        const start =
          x?.start?.line ??
          x?.startLine ??
          x?.from?.line ??
          x?.range?.start?.line ??
          null
        const end =
          x?.end?.line ??
          x?.endLine ??
          x?.to?.line ??
          x?.range?.end?.line ??
          null
        return { file, start, end }
      })
      .filter(x => x.file)
    return {
      lines: c?.lines ?? c?.fragment?.lines ?? c?.duplication?.lines ?? null,
      tokens:
        c?.tokens ?? c?.fragment?.tokens ?? c?.duplication?.tokens ?? null,
      instances: inst
    }
  })
  .filter(x => Array.isArray(x.instances) && x.instances.length >= 2)

normalized.sort(
  (a, b) => (b.lines || 0) - (a.lines || 0) || (b.tokens || 0) - (a.tokens || 0)
)

const top = normalized.slice(0, 8)

if (top.length === 0) {
  console.log(
    '### Duplicate code (doubled code)\n\nNo significant duplicates found (per jscpd thresholds).'
  )
  process.exit(0)
}

console.log('### Duplicate code (doubled code)\n')
console.log(
  'These appear to be copy/pasted blocks across the codebase. Recommendation: extract shared logic into helper functions/modules (or shared components/hooks), then replace duplicates with calls.\n'
)
console.log('**Top duplicate clusters:**\n')

top.forEach((d, idx) => {
  const size = `${d.lines ?? '?'} lines / ${d.tokens ?? '?'} tokens`
  console.log(`**${idx + 1}) ${size}**`)
  d.instances.slice(0, 6).forEach(inst => {
    const range = inst.start && inst.end ? `:${inst.start}-${inst.end}` : ''
    console.log(`- \`${inst.file}${range}\``)
  })
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
