import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

describe('pr-comment-tracker triggers (#3362)', () => {
  test('reruns when a review thread is resolved or reopened', () => {
    const { on } = loadWorkflow('pr-comment-tracker.yml')
    assert.deepEqual(on.pull_request_review_thread.types, [
      'resolved',
      'unresolved'
    ])
  })
})
