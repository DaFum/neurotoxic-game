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

  it('fails only for unresolved review threads that have not been reported yet', () => {
    const workflowText = readText('.github/workflows/pr-comment-tracker.yml')
    const workflow = readWorkflow('.github/workflows/pr-comment-tracker.yml')

    assert.equal(
      Object.hasOwn(workflow.on, 'pull_request_review_thread'),
      false,
      'GitHub Actions does not expose the review-thread resolved webhook as a workflow event'
    )
    assert.match(workflowText, /REPORTED_THREADS:\s*\(\[\^>\]\*\)/)
    assert.match(workflowText, /const reportedThreadIds = new Set/)
    assert.match(
      workflowText,
      /const newThreads = unresolvedThreads\.filter\([\s\S]*!reportedThreadIds\.has\(thread\.id\)/
    )
    assert.match(workflowText, /const recoveryHint = newThreads\.length > 0/)
    assert.match(workflowText, /beim nächsten Commit nicht erneut/)
    assert.match(
      workflowText,
      /const body = marker \+ header \+ copyableBlock \+ footer \+ recoveryHint \+ idsStateMarker/
    )
    assert.match(workflowText, /if \(newThreads\.length > 0\)/)
    assert.match(workflowText, /core\.setFailed\(`[\s\S]*\$\{recoveryHint\}`\)/)
    assert.doesNotMatch(
      workflowText,
      /Wird automatisch aktualisiert, sobald sich Kommentare ändern/,
      'thread resolution does not trigger this workflow automatically'
    )
  })

  it('keeps current unresolved marker ids and drops resolved marker ids', () => {
    const workflowText = readText('.github/workflows/pr-comment-tracker.yml')

    assert.match(
      workflowText,
      /new Set\(\s*unresolvedThreads\.map\(thread => thread\.id\)\s*\)/,
      'the persisted marker must be rebuilt from current unresolved thread ids'
    )
    assert.match(
      workflowText,
      /if \(newThreads\.length > 0\)/,
      'only newly reported threads should fail the check'
    )
  })

  it('runs all non-browser test suites in required PR CI', () => {
    const workflow = readWorkflow('.github/workflows/test.yml')
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
  })

  it('runs the server type gate from package scripts and required PR CI', () => {
    const packageJson = JSON.parse(readText('package.json'))
    const coreTypeConfig = JSON.parse(readText('tsconfig.json'))
    const workflow = readWorkflow('.github/workflows/test.yml')
    const runCommands = Object.values(workflow.jobs)
      .flatMap(job => job.steps)
      .map(step => step.run ?? '')
      .join('\n')

    assert.equal(packageJson.scripts['typecheck:core'], 'tsc -p tsconfig.json')
    assert.deepEqual(coreTypeConfig.include, ['src'])
    assert.equal(coreTypeConfig.compilerOptions.noUncheckedIndexedAccess, true)
    assert.equal(
      packageJson.scripts['typecheck:server'],
      'tsc -p tsconfig.server.json'
    )
    assert.match(runCommands, /\bpnpm run typecheck:server\b/)
  })

  it('keeps TypeScript migration instructions aligned with the core gate', () => {
    const instructions = readText(
      '.github/instructions/typescript-migration.instructions.md'
    )

    assert.match(
      instructions,
      /Full typecheck: `pnpm run typecheck:core` \(runs `tsc -p tsconfig\.json`/
    )
    assert.match(
      instructions,
      /`tsconfig\.json` applies `noUncheckedIndexedAccess` to all source files under `src\/`/
    )
    assert.doesNotMatch(instructions, /jsconfig\.checkjs\.json/)
  })

  it('runs Playwright with an explicit Chromium install in required PR CI', () => {
    const workflow = readWorkflow('.github/workflows/test.yml')
    const runCommands = Object.values(workflow.jobs)
      .flatMap(job => job.steps)
      .map(step => step.run ?? '')
      .join('\n')

    assert.match(
      runCommands,
      /\bpnpm exec playwright install --with-deps chromium\b/
    )
    assert.match(runCommands, /\bpnpm run test:e2e\b/)
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
