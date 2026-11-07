import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { renderLintFixPreview } from '../../scripts/render-lint-fix-preview.js'

const header = '<!-- lint-fix-preview: do-not-edit -->\n## Lint Fix Preview\n\n'
const duplicates = '### Duplicate code\n\nNo significant duplicates found.\n\n'
const heading = '### Patch preview\n\n(Showing last 4000 lines if larger.)\n\n'
const render = patch =>
  renderLintFixPreview({ header, patch, duplicates, hasDiff: true })

function check(body, truncated = true) {
  assert.ok(body.length <= 65536)
  assert.ok(body.startsWith(header))
  const opening = body.match(/^(`{3,})diff\n/m)
  assert.ok(opening)
  const closing = `\n${opening[1]}\n\n`
  assert.ok(body.includes(closing))
  assert.ok(body.indexOf('### Duplicate code') > body.indexOf(closing))
  assert.equal(body.includes('Patch truncated:'), truncated)
  return body.slice(
    body.indexOf(opening[0]) + opening[0].length,
    body.indexOf(closing)
  )
}

test('keeps an unchanged small report byte-identical', () => {
  const patch = '-old\n+new\n'
  const body = render(patch)
  assert.equal(
    body,
    `${header}${heading}\`\`\`diff\n${patch}\`\`\`\n\n${duplicates}`
  )
  check(body, false)
})

test('keeps the no-change message and duplicates in order', () => {
  assert.equal(
    renderLintFixPreview({ header, patch: '', duplicates, hasDiff: false }),
    `${header}No changes would be made by running either formatting or lint auto-fixes.\n\n${duplicates}`
  )
})

for (const [name, patch, total] of [
  ['single long line', '+' + 'x'.repeat(100000) + '\n', 1],
  [
    'fewer than 4000 lines',
    'x'.repeat(100) + '\n' + ('+' + 'y'.repeat(100) + '\n').repeat(1000),
    1001
  ],
  ['more than 4000 lines', '+line\n'.repeat(5000), 5000]
]) {
  test(`bounds ${name} and reports shown and total lines`, () => {
    const body = render(patch)
    const payload = check(body)
    const shown = payload.split('\n').length
    assert.match(
      body,
      new RegExp(`Patch truncated: showing ${shown} of ${total} lines`)
    )
    if (total > 1) assert.ok(patch.endsWith(payload + '\n'))
    if (total === 5000) assert.equal(shown, 4000)
  })
}

test('accepts exactly 65536 characters and truncates one character over', () => {
  const overhead = render('+\n').length - 2
  const patch = '+' + 'x'.repeat(65536 - overhead - 2) + '\n'
  assert.equal(render(patch).length, 65536)
  check(render(patch), false)
  check(render(patch.slice(0, -1) + 'x\n'))
})

test('clips a long last line without splitting an astral character', () => {
  const body = render('+' + '😀'.repeat(50000))
  const payload = check(body)
  assert.ok(payload.length > 1000)
  assert.doesNotMatch(
    payload,
    /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u
  )
})

test('uses longer matching fences and accounts for them when clipping', () => {
  for (const patch of [
    '+``````\n',
    '+``````' + 'x'.repeat(100000),
    '+' + '`'.repeat(100000)
  ]) {
    const body = render(patch)
    const payload = check(body, patch.length > 65536)
    const fence = body.match(/^(`{3,})diff/m)?.[1] ?? ''
    const longest = Math.max(
      0,
      ...Array.from(payload.matchAll(/`+/g), match => match[0].length)
    )
    assert.ok(fence.length > longest)
    assert.ok(payload.length > 0)
  }
})

test('names the artifact and links to the run outside the fence', () => {
  const body = renderLintFixPreview({
    header,
    patch: '+x\n'.repeat(5000),
    duplicates,
    hasDiff: true,
    runLink: 'https://github.example/o/r/actions/runs/1'
  })
  check(body)
  assert.match(
    body,
    /\[lint-fix-preview\]\(https:\/\/github.example\/o\/r\/actions\/runs\/1\)/
  )
  assert.ok(body.indexOf('Patch truncated:') > body.indexOf('\n```\n'))
})

test('clips oversized duplicate findings at a line boundary and omits the patch', () => {
  const findings =
    '### Duplicate code\n\n' + '- duplicate finding\n'.repeat(10000)
  const body = renderLintFixPreview({
    header,
    patch: '+changed\n',
    duplicates: findings,
    hasDiff: true
  })
  assert.ok(body.length <= 65536)
  assert.ok(body.startsWith(header))
  assert.ok(body.includes(heading))
  assert.match(body, /Patch omitted: showing 0 of 1 lines/)
  assert.match(body, /Duplicate findings omitted/)
  const retained = body.slice(
    body.indexOf('### Duplicate code'),
    body.indexOf('Duplicate findings omitted')
  )
  assert.ok(findings.startsWith(retained))
})

test('shell assembly exports the bounded body without changing eligibility', t => {
  if (
    process.platform === 'win32' &&
    spawnSync('bash', ['--version'], { encoding: 'utf8', timeout: 5000 })
      .status !== 0
  ) {
    t.skip('bash is unavailable')
    return
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-preview-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  fs.mkdirSync(path.join(directory, 'scripts'))
  fs.mkdirSync(path.join(directory, 'src', 'nested'), { recursive: true })
  for (const name of [
    'lint-fix-preview.sh',
    'render-lint-fix-preview.js',
    'analyze-duplicates.js'
  ]) {
    fs.copyFileSync(
      fileURLToPath(new URL(`../../scripts/${name}`, import.meta.url)),
      path.join(directory, 'scripts', name)
    )
  }
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    '{"type":"module","scripts":{}}'
  )
  const source = path.join(directory, 'src', 'nested', 'source.js')
  fs.writeFileSync(source, 'export const value = 1\n')
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
  fs.writeFileSync(source, `export const value = '${'x'.repeat(100000)}'\n`)
  fs.mkdirSync(path.join(directory, 'jscpd-report'))
  fs.writeFileSync(
    path.join(directory, 'jscpd-report', 'report.json'),
    '{"duplicates":[]}'
  )
  const output = path.join(directory, 'github-output')
  const result = spawnSync('bash', ['scripts/lint-fix-preview.sh'], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      GITHUB_OUTPUT: output,
      GITHUB_SERVER_URL: 'https://github.example',
      GITHUB_REPOSITORY: 'o/r',
      GITHUB_RUN_ID: '1'
    }
  })
  assert.equal(result.status, 0, result.stderr)
  const body = fs.readFileSync(path.join(directory, 'comment.md'), 'utf8')
  assert.ok(body.length <= 65536)
  check(body)
  assert.match(
    body,
    /\[lint-fix-preview\]\(https:\/\/github.example\/o\/r\/actions\/runs\/1\)/
  )
  assert.ok(result.stdout.endsWith(body))
  const outputs = fs.readFileSync(output, 'utf8')
  assert.match(outputs, /^has_diff=1$/m)
  assert.match(outputs, /^should_comment=1$/m)
  const delimiter = outputs.match(/^comment<<(.*)$/m)?.[1]
  assert.ok(delimiter)
  assert.equal(
    outputs.split(`comment<<${delimiter}\n`)[1],
    `${body}${delimiter}\n`
  )
  assert.ok(
    fs.readFileSync(path.join(directory, 'diff.patch'), 'utf8').length > 65536
  )
  assert.equal(
    fs.readFileSync(path.join(directory, 'diff.tail'), 'utf8'),
    fs.readFileSync(path.join(directory, 'diff.patch'), 'utf8')
  )
})

const cluster = (id, lines, tokens) => ({
  lines,
  tokens,
  firstFile: { name: `src/first-${id}.js`, start: 1, end: Math.max(lines, 1) },
  secondFile: { name: `src/second-${id}.js`, start: 1, end: Math.max(lines, 1) }
})

/**
 * Runs the shell in a clean, committed fixture whose autofix tools are no-op
 * stubs, so only the duplicate analysis can make the run comment-worthy.
 * @param {import('node:test').TestContext} t
 * @param {Record<string, string> | null} reports jscpd-report files, or none
 * @param {string} [analyzerStub] replacement analyzer source
 */
function runDuplicatePreview(t, reports, analyzerStub) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-preview-dup-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  for (const name of ['scripts', 'bin', 'src']) {
    fs.mkdirSync(path.join(directory, name))
  }
  for (const name of [
    'lint-fix-preview.sh',
    'render-lint-fix-preview.js',
    'analyze-duplicates.js'
  ]) {
    fs.copyFileSync(
      fileURLToPath(new URL(`../../scripts/${name}`, import.meta.url)),
      path.join(directory, 'scripts', name)
    )
  }
  if (analyzerStub !== undefined) {
    fs.writeFileSync(
      path.join(directory, 'scripts', 'analyze-duplicates.js'),
      analyzerStub
    )
  }
  fs.writeFileSync(
    path.join(directory, 'package.json'),
    '{"type":"module","scripts":{"format":"stub","lint:fix":"stub"}}'
  )
  fs.writeFileSync(path.join(directory, 'src', 'source.js'), 'export {}\n')
  fs.writeFileSync(path.join(directory, 'bin', 'pnpm'), '#!/bin/sh\nexit 0\n')
  fs.chmodSync(path.join(directory, 'bin', 'pnpm'), 0o755)
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))
  )
  const git = args => {
    const result = spawnSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      timeout: 10000,
      env
    })
    assert.equal(result.status, 0, result.stderr)
  }
  git(['init'])
  assert.equal(
    spawnSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: directory,
      encoding: 'utf8',
      env
    }).stdout.trim(),
    fs.realpathSync(directory)
  )
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
  if (reports) {
    fs.mkdirSync(path.join(directory, 'jscpd-report'))
    for (const [name, contents] of Object.entries(reports)) {
      fs.writeFileSync(path.join(directory, 'jscpd-report', name), contents)
    }
  }
  const output = path.join(directory, 'github-output')
  const result = spawnSync('bash', ['scripts/lint-fix-preview.sh'], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...env,
      PATH: `${path.join(directory, 'bin')}${path.delimiter}${env.PATH ?? ''}`,
      GITHUB_OUTPUT: output
    }
  })
  assert.equal(result.status, 0, result.stderr)
  const outputs = fs.readFileSync(output, 'utf8')
  const read = key => outputs.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]
  return {
    body: fs.readFileSync(path.join(directory, 'comment.md'), 'utf8'),
    outputs: Object.fromEntries(
      [
        'has_diff',
        'has_dup',
        'dup_total',
        'dup_status',
        'dup_failed',
        'should_comment'
      ].map(key => [key, read(key)])
    )
  }
}

const shellUnavailable = () =>
  process.platform === 'win32' &&
  spawnSync('bash', ['--version'], { encoding: 'utf8', timeout: 5000 })
    .status !== 0

test('shell counts validated clusters across report files, skipping empty ones', t => {
  if (shellUnavailable()) return t.skip('bash is unavailable')
  const { body, outputs } = runDuplicatePreview(t, {
    'first.json': JSON.stringify({
      duplicates: [cluster('a', 12, 90), cluster('empty', 0, 0)]
    }),
    'second.json': JSON.stringify({ duplicates: [cluster('b', 9, 70)] })
  })
  assert.deepEqual(outputs, {
    has_diff: '0',
    has_dup: '1',
    dup_total: '2',
    dup_status: 'ok',
    dup_failed: '0',
    should_comment: '1'
  })
  assert.match(body, /Found \*\*2\*\* duplicate clusters\./)
  assert.doesNotMatch(body, /first-empty\.js|Duplicate analysis failed/)
})

test('shell reports zero duplicates only for a valid report of empty clusters', t => {
  if (shellUnavailable()) return t.skip('bash is unavailable')
  const { body, outputs } = runDuplicatePreview(t, {
    'report.json': JSON.stringify({ duplicates: [cluster('empty', 0, 0)] })
  })
  assert.deepEqual(outputs, {
    has_diff: '0',
    has_dup: '0',
    dup_total: '0',
    dup_status: 'ok',
    dup_failed: '0',
    should_comment: '0'
  })
  assert.match(body, /No significant duplicates found/)
})

for (const [name, reports, status, analyzerStub] of [
  ['a malformed report', { 'report.json': '{' }, 'invalid'],
  [
    'a legacy clones report',
    { 'report.json': JSON.stringify({ clones: [cluster('legacy', 10, 80)] }) },
    'invalid'
  ],
  [
    'a legacy result.clones report',
    {
      'report.json': JSON.stringify({
        result: { clones: [cluster('legacy', 10, 80)] }
      })
    },
    'invalid'
  ],
  [
    'a malformed file beside a valid one',
    {
      'valid.json': JSON.stringify({ duplicates: [cluster('a', 9, 70)] }),
      'broken.json': '{"duplicates": [{}]}'
    },
    'invalid'
  ],
  ['a missing report directory', null, 'missing'],
  [
    'missing analyzer output',
    { 'report.json': '{"duplicates":[]}' },
    'error',
    ''
  ],
  [
    'a malformed analyzer result line',
    { 'report.json': '{"duplicates":[]}' },
    'error',
    "console.log('status=ok total=-1')\n"
  ],
  [
    'an ok result line with a failing exit',
    { 'report.json': '{"duplicates":[]}' },
    'error',
    "console.log('status=ok total=0'); process.exit(1)\n"
  ]
]) {
  test(`shell fails closed on ${name}`, t => {
    if (shellUnavailable()) return t.skip('bash is unavailable')
    const { body, outputs } = runDuplicatePreview(t, reports, analyzerStub)
    assert.deepEqual(outputs, {
      has_diff: '0',
      has_dup: '0',
      dup_total: '',
      dup_status: status,
      dup_failed: '1',
      should_comment: '1'
    })
    assert.match(
      body,
      new RegExp(
        `### Duplicate code\\n\\n> Duplicate analysis failed \\(status: \`${status}\`\\)\\. The duplicate count is unknown, not zero`
      )
    )
    assert.doesNotMatch(body, /No significant duplicates|Found \*\*/)
  })
}
