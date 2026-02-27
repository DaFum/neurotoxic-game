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

let clones = []
for (const f of files) {
  const p = path.join(dir, f)
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const data = JSON.parse(raw)
    // FIX: added data?.report?.clones to match shell script + broader jscpd format compat
    const list =
      data?.clones ??
      data?.duplicates ??
      data?.report?.clones ??
      data?.result?.clones ??
      []
    if (Array.isArray(list)) clones.push(...list)
  } catch {
    // skip malformed JSON silently
  }
}

const normalized = clones
  .map(c => {
    const instances = c?.instances ?? c?.duplications ?? c?.fragments ?? []
    const inst = instances
      .map(x => {
        const file =
          x?.file ??
          x?.sourceId ??
          x?.path ??
          x?.name ??
          x?.source ??
          x?.sourceFile ??
          null
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
      .filter(x => x.file != null)
    return {
      lines: c?.lines ?? c?.fragment?.lines ?? c?.duplication?.lines ?? null,
      tokens: c?.tokens ?? c?.fragment?.tokens ?? c?.duplication?.tokens ?? null,
      instances: inst
    }
  })
  // FIX: require at least 2 instances WITH files (guards against empty-instance clusters in top)
  .filter(x => Array.isArray(x.instances) && x.instances.length >= 2)

normalized.sort(
  (a, b) => (b.lines ?? 0) - (a.lines ?? 0) || (b.tokens ?? 0) - (a.tokens ?? 0)
)

const top = normalized.slice(0, 8)

if (top.length === 0) {
  console.log(
    '### Duplicate code\n\nNo significant duplicates found (per jscpd thresholds).'
  )
  process.exit(0)
}

// FIX: added total cluster count to summary for better PR comment context
const totalClusters = normalized.length
const shown = top.length
console.log('### Duplicate code\n')
console.log(
  `Found **${totalClusters}** duplicate cluster${totalClusters !== 1 ? 's' : ''}` +
  (totalClusters > shown ? ` — showing top ${shown}` : '') +
  '. These appear to be copy/pasted blocks. Recommendation: extract shared logic into helper functions/modules (or shared components/hooks), then replace duplicates with calls.\n'
)
console.log('**Top duplicate clusters:**\n')

top.forEach((d, idx) => {
  const size = `${d.lines ?? '?'} lines / ${d.tokens ?? '?'} tokens`
  console.log(`**${idx + 1}) ${size}**`)
  // FIX: guard against clusters that somehow still have 0 displayable instances
  if (d.instances.length === 0) {
    console.log('- *(instance paths unavailable)*')
  } else {
    d.instances.slice(0, 6).forEach(inst => {
      const range = inst.start != null && inst.end != null ? `:${inst.start}-${inst.end}` : ''
      console.log(`- \`${inst.file}${range}\``)
    })
  }
  console.log('')
  console.log('Suggested refactor pattern:')
  console.log('- Identify shared inputs/outputs and isolate side-effects')
  console.log('- Extract into a helper (e.g. `src/utils/...`, `src/lib/...`) or a shared hook/component')
  console.log('- Replace each block with a call; keep behavior identical')
  console.log('- Add/adjust tests if available')
  console.log('')
})
