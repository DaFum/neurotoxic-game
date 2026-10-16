import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { mock, test } from 'node:test'
import { fileURLToPath } from 'node:url'

let execKnip
let importId = 0
const checkerUrl = new URL(
  '../../scripts/check-dead-code-budget.mjs',
  import.meta.url
)
const workDir = fileURLToPath(new URL('../../work/', import.meta.url))

mock.module('node:child_process', {
  namedExports: { execSync: (...args) => execKnip(...args) }
})

const runBudget = async (
  t,
  { report, input = false, max = 1, knipError } = {}
) => {
  fs.mkdirSync(workDir, { recursive: true })
  const fixture = fs.mkdtempSync(path.join(workDir, 'dead-code-budget-'))
  fs.mkdirSync(path.join(fixture, '.ci'))
  fs.writeFileSync(
    path.join(fixture, '.ci/dead-code-budget.json'),
    JSON.stringify({ max })
  )
  if (report !== undefined) {
    fs.writeFileSync(path.join(fixture, 'report.json'), report)
  }
  const originalCwd = process.cwd()
  const originalArgv = process.argv
  process.chdir(fixture)
  process.argv = [process.execPath, fileURLToPath(checkerUrl)]
  if (input) process.argv.push('report.json')
  t.after(() => {
    process.chdir(originalCwd)
    process.argv = originalArgv
    fs.rmSync(fixture, { recursive: true, force: true })
  })

  const commands = []
  execKnip = (...args) => {
    commands.push(args)
    if (knipError) throw knipError
    return report
  }
  const output = []
  const errors = []
  const exits = []
  const exitSignal = new Error('budget checker exited')
  t.mock.method(console, 'log', message => output.push(message))
  t.mock.method(console, 'error', message => errors.push(message))
  t.mock.method(process, 'exit', code => {
    exits.push(code)
    throw exitSignal
  })

  let failure
  try {
    await import(`${checkerUrl.href}?case=${importId++}`)
  } catch (error) {
    if (error !== exitSignal) failure = error
  }
  return { commands, output, errors, exits, failure }
}

const report = JSON.stringify({
  issues: [{ file: 'src/example.js', exports: [{ name: 'unused' }] }]
})

test('budget checker consumes an existing report without running Knip', async t => {
  const result = await runBudget(t, { report, input: true })
  assert.deepEqual(result.commands, [])
  assert.deepEqual(result.exits, [])
  assert.equal(result.failure, undefined)
  assert.ok(result.output.includes('Current knip finding count: 1'))
  assert.ok(result.output.includes('- exports: 1'))
  assert.match(result.output.at(-1), /Budget check passed/)
})

test('existing reports still fail when their findings exceed the budget', async t => {
  const result = await runBudget(t, { report, input: true, max: 0 })
  assert.deepEqual(result.commands, [])
  assert.deepEqual(result.exits, [1])
  assert.match(result.errors[0], /Budget exceeded by 1 findings/)
})

test('invalid existing reports fail without running Knip or reporting an all-clear', async t => {
  const result = await runBudget(t, { report: 'not JSON', input: true })
  assert.deepEqual(result.commands, [])
  assert.ok(result.failure instanceof SyntaxError)
  assert.deepEqual(result.output, [])
})

test('missing report paths fail instead of silently rerunning Knip', async t => {
  const result = await runBudget(t, { input: true })
  assert.deepEqual(result.commands, [])
  assert.equal(result.failure?.code, 'ENOENT')
  assert.deepEqual(result.output, [])
})

test('no-argument invocation preserves the local Knip command', async t => {
  const result = await runBudget(t, { report })
  assert.equal(result.commands.length, 1)
  assert.equal(result.commands[0][0], 'pnpm exec knip --reporter json')
  assert.equal(result.commands[0][1].encoding, 'utf8')
  assert.deepEqual(result.exits, [])
  assert.equal(result.failure, undefined)
})

test('no-argument invocation accepts findings from a nonzero Knip exit', async t => {
  const result = await runBudget(t, {
    knipError: Object.assign(new Error('Knip found unused exports'), {
      stdout: report
    })
  })
  assert.equal(result.commands.length, 1)
  assert.deepEqual(result.exits, [])
  assert.equal(result.failure, undefined)
  assert.ok(result.output.includes('Current knip finding count: 1'))
})

test('no-argument invocation keeps crashed Knip runs as errors', async t => {
  const result = await runBudget(t, {
    knipError: Object.assign(new Error('Knip crashed'), {
      stderr: 'failed to load'
    })
  })
  assert.deepEqual(result.exits, [2])
  assert.deepEqual(result.output, [])
  assert.deepEqual(result.errors, [
    'knip did not produce a JSON report.',
    'failed to load'
  ])
})
