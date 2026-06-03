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

  it('runs only node tests in the Node.js Tests job', () => {
    const workflow = readWorkflow('.github/workflows/test.yml')
    const runStep = workflow.jobs['node-tests'].steps.find(
      step => step.id === 'run-tests'
    )

    assert.match(runStep.run, /\bpnpm run test:node:quick\b/)
    assert.doesNotMatch(
      runStep.run,
      /\bpnpm test\b/,
      'pnpm test also runs Vitest logic, which has its own workflow job'
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
