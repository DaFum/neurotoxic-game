import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parse } from 'yaml'

const repoRoot = process.cwd()

const readText = relativePath =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')

const readWorkflow = relativePath => parse(readText(relativePath))

describe('GitHub Actions efficiency guardrails', () => {
  it('does not run the PR comment tracker for issue comments', () => {
    const workflowText = readText('.github/workflows/pr-comment-tracker.yml')
    const workflow = readWorkflow('.github/workflows/pr-comment-tracker.yml')

    assert.equal(
      Object.hasOwn(workflow.on, 'issue_comment'),
      false,
      'issue_comment events include the bot summary comment and can retrigger the tracker'
    )
    assert.doesNotMatch(
      workflowText,
      /github\.event\.issue|context\.payload\.issue/,
      'issue-event fallbacks are stale once issue_comment no longer triggers the workflow'
    )
  })

  it('runs all non-Playwright test suites in required PR CI', () => {
    const workflow = readWorkflow('.github/workflows/test.yml')
    const workflowText = readText('.github/workflows/test.yml')
    const runCommands = Object.values(workflow.jobs)
      .flatMap(job => job.steps)
      .map(step => step.run ?? '')
      .join('\n')

    assert.match(runCommands, /\bpnpm run test:node\b(?!:)/)
    assert.match(runCommands, /\bpnpm run test:vitest:logic\b/)
    assert.match(runCommands, /\bpnpm run test:vitest:ui\b/)
    assert.match(runCommands, /\bpnpm test:locale:smoke\b/)
    assert.match(runCommands, /\bpnpm test:locale:full\b/)
    assert.match(runCommands, /\bpnpm run test:perf\b/)
    assert.match(runCommands, /\bpnpm run typecheck:core\b/)
    assert.match(runCommands, /\bpnpm run typecheck\b(?!:)/)
    assert.doesNotMatch(
      workflowText,
      /\b(playwright|test:e2e|test:e2e:shard[12])\b/,
      'Playwright/e2e suites are intentionally excluded from required PR CI'
    )
  })

  it('detects lint-preview scripts without running package fixers', () => {
    const script = readText('scripts/lint-fix-preview.sh')

    assert.doesNotMatch(
      script,
      /pnpm run -s ["']?format["']? >/,
      'script detection must not execute the format script before preview work'
    )
    assert.doesNotMatch(
      script,
      /pnpm run -s ["']?lint:fix["']? >/,
      'script detection must not execute the lint:fix script before preview work'
    )
  })
})
