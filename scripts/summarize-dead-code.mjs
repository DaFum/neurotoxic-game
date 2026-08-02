#!/usr/bin/env node
/**
 * Turns `knip --reporter json` output into a Markdown summary and a per-category
 * count breakdown.
 *
 * Reads the JSON report on stdin or from the path in argv[2]. Writes Markdown to
 * stdout. `--counts` prints the category counts as JSON instead, which is what
 * `check-dead-code-budget.mjs` consumes.
 */
import fs from 'node:fs'

/** Categories knip reports, in the order the summary lists them. */
const CATEGORIES = [
  ['files', 'Unused files'],
  ['exports', 'Unused exports'],
  ['types', 'Unused exported types'],
  ['enumMembers', 'Unused enum members'],
  ['namespaceMembers', 'Unused namespace members'],
  ['duplicates', 'Duplicate exports'],
  ['dependencies', 'Unused dependencies'],
  ['devDependencies', 'Unused devDependencies'],
  ['optionalPeerDependencies', 'Unused optional peer dependencies'],
  ['unlisted', 'Unlisted dependencies'],
  ['binaries', 'Unlisted binaries'],
  ['unresolved', 'Unresolved imports']
]

const MAX_ROWS_PER_CATEGORY = 25

const readInput = () => {
  const path = process.argv.find(
    arg => !arg.startsWith('--') && arg.endsWith('.json')
  )
  if (path && fs.existsSync(path)) return fs.readFileSync(path, 'utf8')
  return fs.readFileSync(0, 'utf8')
}

/**
 * Flattens the report into `{ category: [{ file, name }] }`.
 *
 * knip reports a `files` entry as the file path itself and every other category
 * as `{ name }` records under the file that owns them.
 */
export const collectFindings = report => {
  const findings = new Map(CATEGORIES.map(([key]) => [key, []]))
  for (const issue of report.issues ?? []) {
    for (const [key] of CATEGORIES) {
      const value = issue[key]
      if (!Array.isArray(value) || value.length === 0) continue
      const bucket = findings.get(key)
      for (const entry of value) {
        bucket.push({
          file: issue.file,
          name: typeof entry === 'string' ? entry : (entry?.name ?? '(unnamed)')
        })
      }
    }
    // knip marks a wholly unused file with a truthy non-array `files` field in
    // some reporters; normalize that shape too.
    if (issue.files === true)
      findings.get('files').push({ file: issue.file, name: issue.file })
  }
  return findings
}

const toCounts = findings =>
  Object.fromEntries([...findings].map(([key, rows]) => [key, rows.length]))

const toMarkdown = findings => {
  const total = [...findings.values()].reduce(
    (sum, rows) => sum + rows.length,
    0
  )
  const lines = [
    '<!-- dead-code-report: do-not-edit -->',
    '## Dead-code report (knip)',
    ''
  ]

  if (total === 0) {
    lines.push('No unused exports, files, or dependencies found. ✅')
    return lines.join('\n')
  }

  lines.push(
    `${total} finding${total === 1 ? '' : 's'}. This check is **report-only** — it does not block the merge.`,
    ''
  )

  for (const [key, label] of CATEGORIES) {
    const rows = findings.get(key)
    if (rows.length === 0) continue
    lines.push(
      `<details><summary><b>${label} (${rows.length})</b></summary>`,
      ''
    )
    lines.push('| File | Name |', '| --- | --- |')
    for (const row of rows.slice(0, MAX_ROWS_PER_CATEGORY)) {
      lines.push(`| \`${row.file}\` | \`${row.name}\` |`)
    }
    if (rows.length > MAX_ROWS_PER_CATEGORY) {
      lines.push(
        `| … | ${rows.length - MAX_ROWS_PER_CATEGORY} more not shown — run \`pnpm run deadcode:check\` locally |`
      )
    }
    lines.push('', '</details>', '')
  }

  lines.push(
    'Per `AGENTS.md`, pre-existing dead code is reported rather than deleted. Triage this list before lowering `max` in `.ci/dead-code-budget.json`.'
  )
  return lines.join('\n')
}

const main = () => {
  let report
  try {
    report = JSON.parse(readInput())
  } catch (error) {
    // A crashed knip run must not be reported as "zero findings".
    console.error(`Could not parse the knip report: ${error.message}`)
    process.exit(2)
  }
  const findings = collectFindings(report)
  if (process.argv.includes('--counts')) {
    console.log(JSON.stringify(toCounts(findings), null, 2))
    return
  }
  console.log(toMarkdown(findings))
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].split('/').pop())
) {
  main()
}
