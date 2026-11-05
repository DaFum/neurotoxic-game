import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  readdirSync,
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  chmodSync,
  rmSync
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { renderLintFixPreview } from '../../scripts/render-lint-fix-preview.js'

const loadWorkflow = name =>
  parse(readFileSync(`.github/workflows/${name}`, 'utf8'))

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const MARKER = '<!-- lint-fix-preview: do-not-edit -->'
const BOT = { login: 'github-actions[bot]', type: 'Bot' }

const findScript = (workflow, needle) => {
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps ?? []) {
      const script = step.with?.script
      if (typeof script === 'string' && script.includes(needle)) return script
    }
  }
  throw new Error(`No github-script step containing ${needle}`)
}

/** Fake GitHub client whose un-paginated listComments returns page 1 only. */
const createFakeGithub = comments => {
  const calls = { creates: [], updates: [], paginate: [] }
  const listComments = async () => ({ data: comments.slice(0, 30) })
  const github = {
    rest: {
      issues: {
        listComments,
        updateComment: async ({ comment_id, body }) => {
          calls.updates.push({ comment_id, body })
          const target = comments.find(c => c.id === comment_id)
          if (target) target.body = body
        },
        createComment: async ({ body }) => {
          calls.creates.push({ body })
          comments.push({ id: 1000 + comments.length, user: BOT, body })
        }
      }
    },
    paginate: async (endpoint, options) => {
      calls.paginate.push({ endpoint, options })
      return [...comments]
    }
  }
  return { github, calls, listComments }
}

const runReport = async (github, body) => {
  const script = findScript(
    loadWorkflow('lint-fix-preview.yml'),
    'lint-fix-preview: do-not-edit'
  )
  const fakeFs = { readFileSync: () => body }
  const context = {
    repo: { owner: 'o', repo: 'r' },
    issue: { number: 7 }
  }
  await new AsyncFunction('github', 'context', 'require', script)(
    github,
    context,
    () => fakeFs
  )
}

describe('lint-fix-preview sticky report (#3377)', () => {
  test('updates the same report on a later comment page without adding another', async () => {
    const comments = Array.from({ length: 35 }, (_, i) => ({
      id: i + 1,
      body: `chatter ${i}`
    }))
    comments.push({ id: 500, user: BOT, body: `${MARKER}\nold report` })
    const { github, calls, listComments } = createFakeGithub(comments)

    await runReport(github, `${MARKER}\nfirst`)
    await runReport(github, `${MARKER}\nsecond`)

    assert.equal(calls.creates.length, 0)
    assert.deepEqual(
      calls.updates.map(u => u.comment_id),
      [500, 500]
    )
    assert.equal(comments.length, 36)
    assert.equal(comments.find(c => c.id === 500).body, `${MARKER}\nsecond`)
    assert.equal(calls.paginate[0].endpoint, listComments)
    assert.deepEqual(calls.paginate[0].options, {
      owner: 'o',
      repo: 'r',
      issue_number: 7,
      per_page: 100
    })
  })

  test('creates one report when none exists', async () => {
    const comments = [
      { id: 1, body: null },
      { id: 2, body: '' },
      { id: 3, body: 'hello' }
    ]
    const { github, calls } = createFakeGithub(comments)

    await runReport(github, `${MARKER}\nreport`)

    assert.equal(calls.updates.length, 0)
    assert.equal(calls.creates.length, 1)
  })
})

describe('bounded lint preview publication', () => {
  for (const [name, patch, truncated] of [
    ['long line', '+' + 'x'.repeat(100000) + '\n', true],
    ['many lines', '+line\n'.repeat(5000), true],
    ['small', '-old\n+new\n', false]
  ]) {
    for (const update of [false, true]) {
      test(`${name}: ${update ? 'updates' : 'creates'} the bounded body unchanged`, async () => {
        const body = renderLintFixPreview({
          header: `${MARKER}\n## Lint Fix Preview\n\n`,
          patch,
          duplicates: '### Duplicate code\n\nNone.\n',
          hasDiff: true
        })
        const comments = update
          ? [{ id: 42, user: BOT, body: `${MARKER}\nold` }]
          : []
        const { github, calls } = createFakeGithub(comments)
        await runReport(github, body)
        assert.equal(calls.creates.length, update ? 0 : 1)
        assert.equal(calls.updates.length, update ? 1 : 0)
        const submitted = (update ? calls.updates : calls.creates)[0]
        if (update) assert.equal(submitted.comment_id, 42)
        assert.equal(submitted.body, body)
        assert.ok(submitted.body.length <= 65536)
        assert.ok(submitted.body.includes(MARKER))
        const fence = body.match(/^(`{3,})diff\n/m)?.[1]
        assert.ok(fence)
        assert.ok(body.includes(`\n${fence}\n\n`))
        assert.ok(
          body.indexOf('### Duplicate code') > body.indexOf(`\n${fence}\n\n`)
        )
        assert.equal(body.includes('Patch truncated:'), truncated)
      })
    }
  }
})

describe('autofix failure reporting and enforcement', () => {
  /** @param {import('node:test').TestContext} t @param {string} scenario */
  function runPreview(t, scenario) {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'autofix-preview-'))
    t.after(() => rmSync(directory, { recursive: true, force: true }))
    for (const name of ['scripts', 'bin', 'src/nested', 'jscpd-report']) {
      mkdirSync(path.join(directory, name), { recursive: true })
    }
    for (const name of [
      'lint-fix-preview.sh',
      'render-lint-fix-preview.js',
      'analyze-duplicates.js'
    ]) {
      copyFileSync(
        fileURLToPath(new URL(`../../scripts/${name}`, import.meta.url)),
        path.join(directory, 'scripts', name)
      )
    }
    writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        type: 'module',
        scripts: { format: 'fixture', 'lint:fix': 'fixture' }
      })
    )
    writeFileSync(
      path.join(directory, 'src/nested/source.js'),
      'export const value = 1\n'
    )
    const fakePnpm = path.join(directory, 'bin/pnpm')
    writeFileSync(
      fakePnpm,
      `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "exec" ]]; then exit 0; fi
echo "$2" >> command-order
if [[ "$2" == "format" ]]; then
  if [[ "$PREVIEW_SCENARIO" == "fixable-only" || "$PREVIEW_SCENARIO" == "mixed" ]]; then
    echo 'export const value = 2' >src/nested/source.js
  fi
  if [[ "$PREVIEW_SCENARIO" != "mixed" ]]; then exit 0; fi
  status=2
else
  if [[ "$PREVIEW_SCENARIO" != "mixed" && "$PREVIEW_SCENARIO" != "failure-only" ]]; then exit 0; fi
  status=3
fi
for ((i=1; i<=80; i++)); do echo "$2 log line $i"; done
node -e "process.stdout.write('x'.repeat(70000) + '\\n')"
echo "$2 unresolved diagnostic </details> &" >&2
exit "$status"
`
    )
    chmodSync(fakePnpm, 0o755)
    /** @param {string[]} args */
    const git = args => {
      const result = spawnSync('git', args, {
        cwd: directory,
        encoding: 'utf8',
        timeout: 10000
      })
      assert.equal(result.status, 0, result.stderr)
    }
    git(['init'])
    git(['add', '.'])
    git([
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.com',
      'commit',
      '-m',
      'fixture'
    ])
    const duplicates =
      scenario === 'mixed'
        ? [
            {
              lines: 10,
              tokens: 80,
              firstFile: { name: 'src/first.js', start: 1, end: 10 },
              secondFile: { name: 'src/second.js', start: 1, end: 10 }
            }
          ]
        : []
    writeFileSync(
      path.join(directory, 'jscpd-report/report.json'),
      JSON.stringify({ duplicates })
    )
    const output = path.join(directory, 'github-output')
    const result = spawnSync('bash', ['scripts/lint-fix-preview.sh'], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 1024 * 1024,
      env: {
        ...process.env,
        PATH: `${path.join(directory, 'bin')}${path.delimiter}${process.env.PATH ?? ''}`,
        PREVIEW_SCENARIO: scenario,
        GITHUB_OUTPUT: output
      }
    })
    assert.equal(result.status, 0, result.stderr)
    const body = readFileSync(path.join(directory, 'comment.md'), 'utf8')
    const outputs = readFileSync(output, 'utf8')
    assert.ok(body.length <= 65536)
    assert.ok(body.includes(MARKER))
    assert.ok(result.stdout.endsWith(body))
    assert.equal(
      readFileSync(path.join(directory, 'command-order'), 'utf8'),
      'format\nlint:fix\n'
    )
    assert.ok(body.indexOf('Autofix status') > body.indexOf('Target roots:'))
    const delimiter = outputs.match(/^comment<<(.*)$/m)?.[1]
    assert.ok(delimiter)
    assert.equal(
      outputs.split(`comment<<${delimiter}\n`)[1],
      `${body}${delimiter}\n`
    )
    return { body, outputs }
  }

  for (const scenario of ['clean', 'fixable-only', 'mixed', 'failure-only']) {
    test(`${scenario} completes the report before exiting zero`, t => {
      if (
        process.platform === 'win32' &&
        spawnSync('bash', ['--version'], { encoding: 'utf8', timeout: 5000 })
          .status !== 0
      ) {
        t.skip('bash is unavailable')
        return
      }
      const { body, outputs } = runPreview(t, scenario)
      const failed = scenario === 'mixed' || scenario === 'failure-only'
      const changed = scenario === 'fixable-only' || scenario === 'mixed'
      assert.match(outputs, new RegExp(`^has_diff=${changed ? 1 : 0}$`, 'm'))
      assert.match(outputs, new RegExp(`^fix_failed=${failed ? 1 : 0}$`, 'm'))
      assert.match(
        outputs,
        new RegExp(`^format_status=${scenario === 'mixed' ? 2 : 0}$`, 'm')
      )
      assert.match(
        outputs,
        new RegExp(`^lint_fix_status=${failed ? 3 : 0}$`, 'm')
      )
      assert.match(
        outputs,
        new RegExp(`^should_comment=${failed || changed ? 1 : 0}$`, 'm')
      )
      if (changed) {
        assert.match(body, /### Patch preview/)
        assert.match(body, /\+export const value = 2/)
      }
      if (failed) {
        assert.match(body, /unresolved errors remain/i)
        assert.match(body, /run did not pass/i)
        assert.match(body, /fixes applied before the tools stopped/i)
        assert.match(
          body,
          /Stylelint CSS fixes.*(may|possibly|might).*not.*run/i
        )
        assert.match(body, /failed \(exit 3\)/)
        assert.match(body, /<details>/)
        assert.match(
          body,
          /lint:fix unresolved diagnostic &lt;\/details&gt; &amp;/
        )
        assert.doesNotMatch(body, /log line 1\b/)
        assert.doesNotMatch(body, /No changes would be made/)
        if (scenario === 'mixed') {
          assert.match(body, /failed \(exit 2\)/)
          assert.match(body, /format unresolved diagnostic/)
          assert.match(outputs, /^has_dup=1$/m)
          assert.match(body, /### Duplicate code/)
          assert.match(body, /Found \*\*1\*\* duplicate cluster/)
        }
        assert.equal(
          (body.match(/<details>/g) ?? []).length,
          scenario === 'mixed' ? 2 : 1
        )
        assert.equal(
          (body.match(/<\/details>/g) ?? []).length,
          scenario === 'mixed' ? 2 : 1
        )
      } else {
        assert.match(body, /passed/)
        assert.doesNotMatch(
          body,
          /unresolved errors remain|run did not pass|<details>/i
        )
        if (!changed) assert.match(body, /No changes would be made/)
      }
    })
  }

  test('publishes failures before enforcing failure, including for fork PRs', () => {
    const steps = loadWorkflow('lint-fix-preview.yml').jobs['lint-preview']
      .steps
    const previewIndex = steps.findIndex(step => step.id === 'lint-preview')
    const publicationIndex = steps.findIndex(step =>
      step.with?.script?.includes(MARKER)
    )
    const enforcementIndex = steps.findIndex(
      step => step.name === 'Fail when autofix left unresolved errors'
    )
    const publication = steps[publicationIndex]
    assert.ok(
      publication.if.includes("steps.lint-preview.outputs.fix_failed == '1'")
    )
    assert.ok(
      publication.if.includes('head.repo.full_name == github.repository')
    )
    assert.ok(enforcementIndex > publicationIndex)
    assert.ok(publicationIndex > previewIndex)
    assert.equal(enforcementIndex, steps.length - 1)
    const enforcement = steps[enforcementIndex]
    assert.ok(
      enforcement.if.includes("steps.lint-preview.outputs.fix_failed == '1'")
    )
    assert.ok(enforcement.if.includes('always()'))
    assert.ok(!enforcement.if.includes('head.repo'))
    assert.ok(enforcement.env.FORMAT_STATUS.includes('outputs.format_status'))
    assert.ok(
      enforcement.env.LINT_FIX_STATUS.includes('outputs.lint_fix_status')
    )
    assert.match(enforcement.run, /exit 1/)
    assert.ok(!enforcement.run.includes('${{'))
  })
})

const TRACKER_MARKER = '<!-- PR_COMMENT_TRACKER_MARKER -->'

const createFakeCore = () => {
  const log = { notices: [], warnings: [], failures: [] }
  const core = {
    notice: message => log.notices.push(message),
    warning: message => log.warnings.push(message),
    setFailed: message => log.failures.push(message)
  }
  return { core, log }
}

/** Runs a github-script body with the given globals and temporary env vars. */
const runScript = async (script, globals, env = {}) => {
  const saved = Object.keys(env).map(key => [key, process.env[key]])
  Object.assign(process.env, env)
  try {
    await new AsyncFunction(...Object.keys(globals), script)(
      ...Object.values(globals)
    )
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

const thread = (id, body, login = 'reviewer') => ({
  id,
  isResolved: false,
  comments: { nodes: [{ author: { login }, body }] }
})

const runTracker = async ({
  comments,
  threads,
  sameRepo = 'true',
  periodic = false,
  checkFailure = false,
  headSha = 'head-sha',
  mergeSha = 'merge-sha',
  checkRuns = []
}) => {
  const { github, calls } = createFakeGithub(comments)
  calls.checks = []
  const listForRef = async () => {}
  const paginateComments = github.paginate
  github.paginate = async (endpoint, options) => {
    if (endpoint === listForRef) {
      return checkRuns.filter(check => check.head_sha === options.ref)
    }
    return paginateComments(endpoint, options)
  }
  github.rest.checks = {
    listForRef,
    create: async check => {
      if (checkFailure) throw new Error('check publication failed')
      calls.checks.push(check)
      checkRuns.push({
        ...check,
        id: checkRuns.length + 1,
        app: { slug: 'github-actions' },
        pull_requests: [{ number: 7 }]
      })
    }
  }
  github.graphql = async () => ({
    repository: {
      pullRequest: {
        reviewThreads: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: threads
        }
      }
    }
  })
  const { core, log } = createFakeCore()
  const script = findScript(
    loadWorkflow('pr-comment-tracker.yml'),
    'PR_COMMENT_TRACKER_MARKER'
  )
  const context = {
    repo: { owner: 'o', repo: 'r' },
    payload: periodic ? {} : { pull_request: { number: 7 } }
  }
  await runScript(
    script,
    { github, context, core, console: { log: () => {} } },
    {
      SAME_REPO_PR: sameRepo,
      PERIODIC_REFRESH: String(periodic),
      PR_NUMBER: '7',
      PR_HEAD_SHA: headSha,
      PR_MERGE_SHA: mergeSha
    }
  )
  return { calls, log }
}

describe('pr-comment-tracker thread tracking (#3499)', () => {
  test('a foreign head check cannot suppress this PR stored verdict', async () => {
    const comments = []
    await runTracker({ comments, threads: [], periodic: true })
    const checkRuns = [
      {
        id: 1,
        name: 'Aggregate Comments & Enforce Resolution',
        head_sha: 'head-sha',
        app: { slug: 'github-actions' },
        pull_requests: [{ number: 99 }],
        status: 'completed',
        conclusion: 'failure'
      }
    ]
    const refresh = await runTracker({
      comments,
      threads: [],
      periodic: true,
      checkRuns,
      mergeSha: ''
    })
    assert.deepEqual(
      refresh.calls.checks.map(({ head_sha, conclusion }) => ({
        head_sha,
        conclusion
      })),
      [{ head_sha: 'head-sha', conclusion: 'success' }]
    )
    const repeated = await runTracker({
      comments,
      threads: [],
      periodic: true,
      checkRuns,
      mergeSha: ''
    })
    assert.equal(repeated.calls.checks.length, 0)
  })

  test('an unchanged report fills missing head and merge checks independently', async () => {
    for (const threads of [[], [thread('T1', 'blocking')]]) {
      for (const mergeSha of ['merge-sha', '', 'new-head-sha']) {
        const comments = []
        const checkRuns = []
        await runTracker({ comments, threads, periodic: true, checkRuns })
        const refresh = await runTracker({
          comments,
          threads,
          periodic: true,
          checkRuns,
          headSha: 'new-head-sha',
          mergeSha
        })
        assert.deepEqual(
          refresh.calls.checks.map(({ head_sha, conclusion }) => ({
            head_sha,
            conclusion
          })),
          [
            {
              head_sha: 'new-head-sha',
              conclusion: threads.length ? 'failure' : 'success'
            }
          ]
        )
        const repeated = await runTracker({
          comments,
          threads,
          periodic: true,
          checkRuns,
          headSha: 'new-head-sha',
          mergeSha
        })
        assert.equal(repeated.calls.checks.length, 0)
        assert.equal(refresh.calls.updates.length, 0)
      }
    }
  })

  test('periodic refresh updates a resolved thread and its PR-head check', async () => {
    const comments = [
      {
        id: 9,
        user: BOT,
        body: `${TRACKER_MARKER}\nold\n<!-- REPORTED_THREADS: T1 -->`
      }
    ]
    const { calls, log } = await runTracker({
      comments,
      threads: [{ ...thread('T1', 'resolved'), isResolved: true }],
      periodic: true
    })
    assert.equal(calls.updates.length, 1)
    assert.ok(calls.updates[0].body.includes('Keine offenen Review-Threads'))
    assert.equal(calls.checks[0].head_sha, 'head-sha')
    assert.equal(calls.checks[1].head_sha, 'merge-sha')
    assert.equal(calls.checks[0].conclusion, 'success')
    assert.equal(log.failures.length, 0)
  })

  test('failed periodic check publication leaves the report unchanged for retry', async () => {
    const oldBody = `${TRACKER_MARKER}\nold\n<!-- REPORTED_THREADS: T1 -->`
    const comments = [{ id: 9, user: BOT, body: oldBody }]
    await assert.rejects(
      runTracker({
        comments,
        threads: [],
        periodic: true,
        checkFailure: true
      }),
      /check publication failed/
    )
    assert.equal(comments[0].body, oldBody)
  })

  test('periodic refresh reports reopened threads but leaves unchanged reports alone', async () => {
    const comments = [
      {
        id: 9,
        user: BOT,
        body: `${TRACKER_MARKER}\nold\n<!-- REPORTED_THREADS:  -->`
      }
    ]
    const checkRuns = []
    const reopened = await runTracker({
      comments,
      threads: [thread('T1', 'reopened')],
      periodic: true,
      checkRuns
    })
    assert.equal(reopened.calls.checks[0].conclusion, 'failure')
    const unchanged = await runTracker({
      comments,
      threads: [thread('T1', 'reopened')],
      periodic: true,
      checkRuns
    })
    assert.equal(unchanged.calls.updates.length, 0)
    assert.equal(unchanged.calls.checks.length, 0)
  })

  test('an unchanged report copies its verdict to a new merge commit only', async () => {
    const comments = []
    const checkRuns = []
    await runTracker({
      comments,
      threads: [thread('T1', 'blocking')],
      periodic: true,
      checkRuns
    })
    const originalBody = comments[0].body
    const refresh = await runTracker({
      comments,
      threads: [thread('T1', 'blocking')],
      periodic: true,
      mergeSha: 'new-merge-sha',
      checkRuns
    })

    assert.equal(comments[0].body, originalBody)
    assert.equal(refresh.calls.updates.length, 0)
    assert.deepEqual(
      refresh.calls.checks.map(({ head_sha, conclusion }) => ({
        head_sha,
        conclusion
      })),
      [{ head_sha: 'new-merge-sha', conclusion: 'failure' }]
    )
  })

  test('an event report supplies missing head and merge verdicts', async () => {
    for (const [threads, expected] of [
      [[thread('T1', 'blocking')], 'failure'],
      [[], 'success']
    ]) {
      const comments = []
      const event = await runTracker({ comments, threads })
      assert.equal(event.log.failures.length, expected === 'failure' ? 1 : 0)
      const originalBody = comments[0].body
      const refresh = await runTracker({
        comments,
        threads,
        periodic: true,
        mergeSha: 'new-merge-sha'
      })
      assert.equal(comments[0].body, originalBody)
      assert.deepEqual(
        refresh.calls.checks.map(({ head_sha, conclusion }) => ({
          head_sha,
          conclusion
        })),
        [
          { head_sha: 'head-sha', conclusion: expected },
          { head_sha: 'new-merge-sha', conclusion: expected }
        ]
      )
    }
  })

  test('a truncated legacy report remains unchanged during migration', async () => {
    const comments = []
    const threads = [thread('T1', 'x'.repeat(70000))]
    await runTracker({ comments, threads })
    const verdictMarker = '\n<!-- TRACKER_VERDICT: failure -->'
    const newBody = comments[0].body
    assert.equal(newBody.length, 65536)
    comments[0].body = newBody
      .replace(
        '\n... (truncated)',
        `${'x'.repeat(verdictMarker.length)}\n... (truncated)`
      )
      .replace(verdictMarker, '')
    const legacyBody = comments[0].body
    const checkRuns = [
      {
        id: 1,
        name: 'Aggregate Comments & Enforce Resolution',
        head_sha: 'head-sha',
        app: { slug: 'github-actions' },
        pull_requests: [{ number: 7 }],
        status: 'completed',
        conclusion: 'failure'
      }
    ]
    const refresh = await runTracker({
      comments,
      threads,
      periodic: true,
      mergeSha: 'new-merge-sha',
      checkRuns
    })
    assert.equal(comments[0].body, legacyBody)
    assert.equal(refresh.calls.updates.length, 0)
    assert.equal(refresh.calls.checks[0].conclusion, 'failure')
  })

  test('a legacy report does not invent a verdict without a completed head check', async () => {
    const comments = []
    await runTracker({ comments, threads: [], periodic: true })
    comments[0].body = comments[0].body.replace(
      /\n<!-- TRACKER_VERDICT: (success|failure) -->$/,
      ''
    )
    const refresh = await runTracker({
      comments,
      threads: [],
      periodic: true,
      mergeSha: 'new-merge-sha'
    })
    assert.deepEqual(refresh.calls.checks, [])
  })

  test('a legacy report uses the latest trusted completed head verdict', async () => {
    const comments = []
    await runTracker({ comments, threads: [], periodic: true })
    comments[0].body = comments[0].body.replace(
      /\n<!-- TRACKER_VERDICT: (success|failure) -->$/,
      ''
    )
    const check = (
      id,
      conclusion,
      slug = 'github-actions',
      status = 'completed'
    ) => ({
      id,
      name: 'Aggregate Comments & Enforce Resolution',
      head_sha: 'head-sha',
      app: { slug },
      pull_requests: [{ number: 7 }],
      status,
      conclusion
    })
    const checkRuns = [
      check(2, 'success'),
      check(1, 'failure'),
      check(3, 'failure', 'untrusted-app')
    ]
    const refresh = await runTracker({
      comments,
      threads: [],
      periodic: true,
      mergeSha: 'new-merge-sha',
      checkRuns
    })
    assert.deepEqual(
      refresh.calls.checks.map(({ head_sha, conclusion }) => ({
        head_sha,
        conclusion
      })),
      [{ head_sha: 'new-merge-sha', conclusion: 'success' }]
    )

    const pending = await runTracker({
      comments,
      threads: [],
      periodic: true,
      mergeSha: 'another-merge-sha',
      checkRuns: [...checkRuns, check(4, null, 'github-actions', 'in_progress')]
    })
    assert.deepEqual(pending.calls.checks, [])
    assert.equal(pending.log.warnings.length, 1)
  })

  test('a legacy report only uses checks associated with this PR', async () => {
    const comments = []
    await runTracker({ comments, threads: [], periodic: true })
    comments[0].body = comments[0].body.replace(
      /\n<!-- TRACKER_VERDICT: (success|failure) -->$/,
      ''
    )
    const check = (id, pullRequests, conclusion) => ({
      id,
      name: 'Aggregate Comments & Enforce Resolution',
      head_sha: 'head-sha',
      app: { slug: 'github-actions' },
      pull_requests: pullRequests,
      status: 'completed',
      conclusion
    })
    const foreignAndUnknown = [
      check(3, [{ number: 8 }], 'failure'),
      check(2, [], 'failure'),
      check(1, undefined, 'failure')
    ]
    const noMatch = await runTracker({
      comments,
      threads: [],
      periodic: true,
      checkRuns: foreignAndUnknown
    })
    assert.deepEqual(noMatch.calls.checks, [])
    assert.equal(noMatch.log.warnings.length, 1)

    const matching = await runTracker({
      comments,
      threads: [],
      periodic: true,
      checkRuns: [...foreignAndUnknown, check(0, [{ number: 7 }], 'success')]
    })
    assert.equal(matching.calls.checks[0].conclusion, 'success')
  })

  test('scheduled and event runs serialize per PR without canceling an active update', () => {
    const workflow = loadWorkflow('pr-comment-tracker.yml')
    const concurrency = workflow.jobs['update-summary-and-check'].concurrency
    assert.match(concurrency.group, /matrix\.pr\.number/)
    assert.equal(concurrency['cancel-in-progress'], false)
  })

  test('periodic refresh is scheduled and only discovers eligible open PRs', async () => {
    const workflow = loadWorkflow('pr-comment-tracker.yml')
    assert.ok(workflow.on.schedule.length > 0)
    const script = findScript(workflow, 'TRACKER_OPEN_PRS')
    const list = async () => {}
    let output
    const pr = (number, repoName, login = 'author') => ({
      number,
      head: { sha: `sha-${number}`, repo: { full_name: repoName } },
      merge_commit_sha: `merge-${number}`,
      user: { login }
    })
    await runScript(script, {
      github: {
        rest: { pulls: { list } },
        paginate: async () => [
          pr(1, 'o/r'),
          pr(2, 'fork/r'),
          pr(3, 'o/r', 'dependabot[bot]')
        ]
      },
      context: {
        eventName: 'schedule',
        repo: { owner: 'o', repo: 'r' },
        payload: {}
      },
      core: {
        setOutput: (_name, value) => {
          output = JSON.parse(value)
        }
      }
    })
    assert.deepEqual(output, [
      { number: 1, headSha: 'sha-1', mergeSha: 'merge-1' }
    ])
  })

  test('scheduled discovery rotates bounded batches and reports deferred PRs', async () => {
    const script = findScript(
      loadWorkflow('pr-comment-tracker.yml'),
      'TRACKER_OPEN_PRS'
    )
    for (const count of [257, 512, 513]) {
      const prs = Array.from({ length: count }, (_, i) => ({
        number: i + 1,
        head: { sha: `sha-${i + 1}`, repo: { full_name: 'o/r' } },
        merge_commit_sha: `merge-${i + 1}`,
        user: { login: 'author' }
      })).reverse()
      const run = async slot => {
        let output
        const notices = []
        await runScript(script, {
          github: {
            rest: { pulls: { list: async () => {} } },
            paginate: async () => prs
          },
          context: { repo: { owner: 'o', repo: 'r' }, payload: {} },
          core: {
            setOutput: (_name, value) => {
              output = JSON.parse(value)
            },
            notice: message => notices.push(message)
          },
          Date: { now: () => slot * 30 * 60 * 1000 }
        })
        return { output, notices }
      }
      const batches = await Promise.all(
        Array.from({ length: Math.ceil(count / 256) }, (_, i) => run(3000 + i))
      )
      for (const batch of batches) {
        assert.equal(batch.output.length, 256)
        assert.equal(new Set(batch.output.map(pr => pr.number)).size, 256)
        assert.match(
          batch.notices.join(' '),
          new RegExp(`\\b${count - 256}\\b`)
        )
      }
      assert.equal(
        new Set(batches.flatMap(batch => batch.output.map(pr => pr.number)))
          .size,
        count
      )
    }
  })

  test('tracks threads with an identical 80-character prefix by thread id', async () => {
    const prefix = 'p'.repeat(80)
    const comments = [
      {
        id: 9,
        user: BOT,
        body: `${TRACKER_MARKER}\nold\n<!-- REPORTED_THREADS: T1 -->`
      }
    ]

    const { calls, log } = await runTracker({
      comments,
      threads: [
        thread('T1', `${prefix} first`),
        thread('T2', `${prefix} second`)
      ]
    })

    assert.equal(calls.creates.length, 0)
    assert.deepEqual(
      calls.updates.map(u => u.comment_id),
      [9]
    )
    const { body } = calls.updates[0]
    assert.ok(body.includes(`- [reviewer]: ${prefix} first`))
    assert.ok(body.includes(`- [reviewer]: ${prefix} second`))
    assert.ok(body.includes('<!-- REPORTED_THREADS: T1,T2 -->'))
    assert.equal(log.failures.length, 1)
    assert.match(log.failures[0], / 1 NEUE /)
    assert.ok(log.failures[0].includes(`${prefix} second`))
  })

  test('dependabot runs take the read-only path like fork runs', () => {
    const doc = parse(
      readFileSync('.github/workflows/pr-comment-tracker.yml', 'utf8')
    )
    const step = doc.jobs['update-summary-and-check'].steps[0]
    const expression = String(step.env.SAME_REPO_PR)
    assert.ok(expression.includes('head.repo.full_name == github.repository'))
    assert.ok(expression.includes("github.actor != 'dependabot[bot]'"))
  })

  test('fork runs write nothing, log a notice and do not gate on new threads', async () => {
    const { calls, log } = await runTracker({
      comments: [],
      threads: [thread('T1', 'first'), thread('T2', 'second')],
      sameRepo: 'false'
    })

    assert.deepEqual(calls.creates, [])
    assert.deepEqual(calls.updates, [])
    assert.equal(log.notices.length, 1)
    assert.match(log.notices[0], /Fork/)
    assert.deepEqual(log.failures, [])
    assert.deepEqual(log.warnings, [])
  })

  test('ignores reported thread ids planted in a foreign marker comment', async () => {
    const comments = [
      {
        id: 1,
        user: { login: 'evil-app[bot]', type: 'Bot' },
        body: `${TRACKER_MARKER}\n<!-- REPORTED_THREADS: T1 -->`
      }
    ]

    const { calls, log } = await runTracker({
      comments,
      threads: [thread('T1', 'blocking')]
    })

    assert.deepEqual(calls.updates, [])
    assert.equal(calls.creates.length, 1)
    assert.equal(log.failures.length, 1)
  })
})

const DEAD_CODE_MARKER = '<!-- dead-code-report: do-not-edit -->'
const TEST_FAILURE_MARKER = '<!-- test-failures -->'
const FOREIGN = { login: 'evil-app[bot]', type: 'Bot' }

const markerSites = [
  {
    name: 'lint-fix-preview.yml',
    marker: MARKER,
    run: async comments => {
      const { github, calls } = createFakeGithub(comments)
      await runReport(github, `${MARKER}\nnew`)
      return calls
    }
  },
  {
    name: 'dead-code-report.yml',
    marker: DEAD_CODE_MARKER,
    run: async comments => {
      const { github, calls } = createFakeGithub(comments)
      const script = findScript(
        loadWorkflow('dead-code-report.yml'),
        DEAD_CODE_MARKER
      )
      const fakeFs = { readFileSync: () => `${DEAD_CODE_MARKER}\nnew` }
      const context = { repo: { owner: 'o', repo: 'r' }, issue: { number: 7 } }
      await runScript(script, { github, context, require: () => fakeFs })
      return calls
    }
  },
  {
    name: 'post-test-failure-comment action',
    marker: TEST_FAILURE_MARKER,
    run: async comments => {
      const { github, calls } = createFakeGithub(comments)
      const action = parse(
        readFileSync(
          '.github/actions/post-test-failure-comment/action.yml',
          'utf8'
        )
      )
      const { script } = action.runs.steps[0].with
      const fakeFs = { existsSync: () => false, readFileSync: () => '' }
      const context = {
        serverUrl: 'https://github.example',
        runId: 1,
        repo: { owner: 'o', repo: 'r' },
        issue: { number: 7 }
      }
      const { core } = createFakeCore()
      await runScript(
        script,
        { github, context, core, require: () => fakeFs },
        {
          MARKER: TEST_FAILURE_MARKER,
          FILE_PATH: 'missing.log',
          REGEX: 'FAIL',
          MAX_LINES: '5',
          HEADER: '## Failures'
        }
      )
      return calls
    }
  },
  {
    name: 'pr-comment-tracker.yml',
    marker: TRACKER_MARKER,
    run: async comments => (await runTracker({ comments, threads: [] })).calls
  }
]

describe('sticky report markers require github-actions[bot] (#3499)', () => {
  for (const site of markerSites) {
    test(`${site.name} updates its own marker comment, not a foreign one`, async () => {
      const foreignBody = `${site.marker}\nplanted`
      const comments = [
        { id: 1, user: FOREIGN, body: foreignBody },
        { id: 2, user: BOT, body: `${site.marker}\nold` }
      ]

      const calls = await site.run(comments)

      assert.equal(calls.creates.length, 0)
      assert.deepEqual(
        calls.updates.map(u => u.comment_id),
        [2]
      )
      assert.equal(comments[0].body, foreignBody)
    })

    test(`${site.name} creates its own comment when only a foreign marker exists`, async () => {
      const comments = [{ id: 1, user: FOREIGN, body: `${site.marker}\nx` }]

      const calls = await site.run(comments)

      assert.deepEqual(calls.updates, [])
      assert.equal(calls.creates.length, 1)
    })
  }
})

describe('workflow hardening (#3466)', () => {
  test('every workflow and composite action passes expressions to scripts only via env', () => {
    const files = [
      ...readdirSync('.github/workflows')
        .filter(name => /\.ya?ml$/.test(name))
        .map(name => `.github/workflows/${name}`),
      ...readdirSync('.github/actions').map(
        dir => `.github/actions/${dir}/action.yml`
      )
    ]
    assert.ok(files.length >= 9, `scanned too few files: ${files.length}`)
    let scripts = 0
    for (const file of files) {
      const doc = parse(readFileSync(file, 'utf8'))
      const jobs = Object.entries(doc.jobs ?? { composite: doc.runs })
      for (const [jobId, job] of jobs) {
        for (const step of job.steps ?? []) {
          for (const [key, body] of [
            ['run', step.run],
            ['with.script', step.with?.script]
          ]) {
            if (typeof body !== 'string') continue
            scripts++
            assert.ok(
              !body.includes('${{'),
              `${file} job ${jobId} step "${step.name}" interpolates an expression into ${key}`
            )
          }
        }
      }
    }
    assert.ok(scripts > 0, 'no run/script bodies were scanned')
  })

  test('deploy.yml grants Pages/OIDC only to a deploy job that runs no repository code', () => {
    const workflow = loadWorkflow('deploy.yml')
    const privileged = permissions =>
      permissions?.pages === 'write' || permissions?.['id-token'] === 'write'

    assert.ok(!privileged(workflow.permissions))
    const holders = Object.entries(workflow.jobs).filter(([, job]) =>
      privileged(job.permissions)
    )
    assert.deepEqual(
      holders.map(([id]) => id),
      ['deploy']
    )
    const deploy = workflow.jobs.deploy
    assert.deepEqual([deploy.needs].flat(), ['build'])
    for (const step of deploy.steps) {
      assert.equal(step.run, undefined)
      assert.match(
        step.uses,
        /^actions\/(configure|deploy)-pages@[0-9a-f]{40}$/
      )
    }
    assert.deepEqual(workflow.jobs.build.permissions, { contents: 'read' })
  })

  test('deploy.yml builds the Pages bundle with leaderboard sync off (#3499)', () => {
    const workflow = loadWorkflow('deploy.yml')
    const build = workflow.jobs.build.steps.find(
      step => step.run === 'pnpm run build'
    )
    assert.ok(build, 'deploy.yml build job has no `pnpm run build` step')
    assert.equal(build.env?.VITE_ENABLE_LEADERBOARD_SYNC, 'false')
  })
})
