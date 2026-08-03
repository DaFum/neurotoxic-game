#!/usr/bin/env node
/**
 * Fails only when knip's finding count exceeds the budget in
 * `.ci/dead-code-budget.json`.
 *
 * Modelled on `check-ts-nocheck-budget.mjs`: the budget starts at the captured
 * baseline so the check is report-only today, and promotion to a blocking gate is
 * a matter of lowering `max` after triage.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { collectFindings } from './summarize-dead-code.mjs'

const CONFIG_PATH = '.ci/dead-code-budget.json'

function runKnip() {
  try {
    // knip exits non-zero when it has findings, which is the normal case here;
    // only a missing/garbled report is a real failure.
    return execFileSync('pnpm', ['exec', 'knip', '--reporter', 'json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024
    })
  } catch (error) {
    if (
      typeof error?.stdout === 'string' &&
      error.stdout.trim().startsWith('{')
    ) {
      return error.stdout
    }
    console.error('knip did not produce a JSON report.')
    if (error?.stderr) console.error(error.stderr.toString())
    process.exit(2)
  }
}

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  const findings = collectFindings(JSON.parse(runKnip()))

  const rows = [...findings]
    .map(([category, entries]) => [category, entries.length])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
  const total = rows.reduce((sum, [, count]) => sum + count, 0)

  console.log(`Current knip finding count: ${total}`)
  console.log(`Budget (max allowed): ${config.max}`)

  console.log('\nBreakdown by category:')
  if (rows.length === 0) {
    console.log('- none')
  } else {
    for (const [category, count] of rows) {
      console.log(`- ${category}: ${count}`)
    }
  }

  if (total > config.max) {
    console.error(`\n❌ Budget exceeded by ${total - config.max} findings.`)
    process.exit(1)
  }

  console.log('\n✅ Budget check passed. No new dead-code debt introduced.')
}

main()
