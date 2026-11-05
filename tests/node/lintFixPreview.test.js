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
