import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'

const loadWorkflow = name =>
  parse(readFileSync(`.github/workflows/${name}`, 'utf8'))

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const MARKER = '<!-- lint-fix-preview: do-not-edit -->'

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
          comments.push({ id: 1000 + comments.length, body })
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
    comments.push({ id: 500, body: `${MARKER}\nold report` })
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

const BOT = { login: 'github-actions[bot]', type: 'Bot' }
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

const runTracker = async ({ comments, threads, sameRepo = 'true' }) => {
  const { github, calls } = createFakeGithub(comments)
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
    payload: { pull_request: { number: 7 } }
  }
  await runScript(
    script,
    { github, context, core, console: { log: () => {} } },
    { SAME_REPO_PR: sameRepo }
  )
  return { calls, log }
}

describe('pr-comment-tracker thread tracking (#3499)', () => {
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
})
