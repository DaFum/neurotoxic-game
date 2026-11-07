import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const analyzer = fileURLToPath(
  new URL('../../scripts/analyze-duplicates.js', import.meta.url)
)

const createWorkspace = t => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'analyze-duplicates-')
  )
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  return directory
}

const runAnalyzer = directory =>
  spawnSync(process.execPath, [analyzer], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 10000
  })

const duplicate = (id, lines, tokens) => ({
  lines,
  tokens,
  firstFile: { name: `src/first-${id}.js`, start: 1, end: lines },
  secondFile: { name: `src/second-${id}.js`, start: 21, end: 20 + lines }
})

test('summarizes the report emitted by the installed jscpd CLI', t => {
  const directory = createWorkspace(t)
  const source = path.join(directory, 'source')
  fs.mkdirSync(source)
  const code = Array.from(
    { length: 12 },
    (_, index) => `const duplicateValue${index} = ${index} + ${index + 1}`
  ).join('\n')
  for (const name of ['first.js', 'second.js']) {
    fs.writeFileSync(path.join(source, name), code)
  }
  const scan = spawnSync(
    process.execPath,
    [
      require.resolve('jscpd/run-jscpd.js'),
      'source',
      '--min-lines',
      '5',
      '--min-tokens',
      '20',
      '--reporters',
      'json',
      '--output',
      'jscpd-report',
      '--silent'
    ],
    { cwd: directory, encoding: 'utf8', timeout: 10000 }
  )
  assert.equal(scan.status, 0, scan.stderr || scan.stdout)
  const report = JSON.parse(
    fs.readFileSync(
      path.join(directory, 'jscpd-report', 'jscpd-report.json'),
      'utf8'
    )
  )
  assert.equal(report.duplicates.length, 1)

  const result = runAnalyzer(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  assert.match(result.stdout, /Found \*\*1\*\* duplicate cluster\./)
  const clone = report.duplicates[0]
  assert.ok(
    result.stdout.includes(`${clone.lines} lines / ${clone.tokens} tokens`)
  )
  for (const file of [clone.firstFile, clone.secondFile]) {
    assert.ok(
      result.stdout.includes(`\`${file.name}:${file.start}-${file.end}\``)
    )
  }
  assert.doesNotMatch(result.stdout, /No significant duplicates/)
})

test('ranks duplicates by lines then tokens and limits the summary to eight', t => {
  const directory = createWorkspace(t)
  const reportDirectory = path.join(directory, 'jscpd-report')
  fs.mkdirSync(reportDirectory)
  const clones = [
    ...Array.from({ length: 8 }, (_, index) =>
      duplicate(`rank-${index}`, index + 1, 100)
    ),
    duplicate('tied-low', 20, 50),
    duplicate('tied-high', 20, 100)
  ]
  fs.writeFileSync(
    path.join(reportDirectory, 'first.json'),
    JSON.stringify({ duplicates: clones.slice(0, 5) })
  )
  fs.writeFileSync(
    path.join(reportDirectory, 'second.json'),
    JSON.stringify({ duplicates: clones.slice(5) })
  )

  const result = runAnalyzer(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  assert.match(
    result.stdout,
    /Found \*\*10\*\* duplicate clusters — showing top 8/
  )
  assert.equal((result.stdout.match(/^\*\*\d+\)/gm) ?? []).length, 8)
  assert.ok(
    result.stdout.indexOf('first-tied-high.js') <
      result.stdout.indexOf('first-tied-low.js')
  )
  assert.ok(
    result.stdout.indexOf('first-tied-low.js') <
      result.stdout.indexOf('first-rank-7.js')
  )
  assert.doesNotMatch(result.stdout, /first-rank-[01]\.js/)
})

test('keeps the missing-directory, missing-report, and valid-empty messages', t => {
  const directory = createWorkspace(t)
  let result = runAnalyzer(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /No jscpd-report directory found/)

  const reportDirectory = path.join(directory, 'jscpd-report')
  fs.mkdirSync(reportDirectory)
  result = runAnalyzer(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /No jscpd-report JSON files found/)

  fs.writeFileSync(
    path.join(reportDirectory, 'empty.json'),
    JSON.stringify({ duplicates: [] })
  )
  result = runAnalyzer(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  assert.match(result.stdout, /No significant duplicates found/)
})

test('fails clearly when a report cannot be parsed or has no duplicates array', async t => {
  for (const [name, contents] of [
    ['malformed.json', '{'],
    ['null.json', 'null'],
    ['missing.json', '{}'],
    ['nonarray.json', '{"duplicates": {}}'],
    ['invalid-cluster.json', '{"duplicates": [{}]}']
  ]) {
    await t.test(name, subtest => {
      const directory = createWorkspace(subtest)
      const reportDirectory = path.join(directory, 'jscpd-report')
      fs.mkdirSync(reportDirectory)
      fs.writeFileSync(path.join(reportDirectory, name), contents)

      const result = runAnalyzer(directory)
      assert.equal(result.status, 1, result.stderr)
      assert.ok(result.stderr.includes(name), result.stderr)
      assert.doesNotMatch(result.stdout, /No significant duplicates/)
    })
  }
})

test('fails clearly when a report file is unreadable', t => {
  const directory = createWorkspace(t)
  const reportDirectory = path.join(directory, 'jscpd-report')
  fs.mkdirSync(reportDirectory)
  // Reading a directory as a report fails even when tests run as root.
  fs.mkdirSync(path.join(reportDirectory, 'unreadable.json'))

  const result = runAnalyzer(directory)
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stderr, /unreadable\.json/)
  assert.doesNotMatch(result.stdout, /No significant duplicates/)
})

const runResultMode = directory =>
  spawnSync(process.execPath, [analyzer, '--markdown-file', 'dup.md'], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 10000
  })

// jscpd can report a cluster with zero lines and tokens; it is not a finding.
const emptyCluster = { ...duplicate('empty', 1, 1), lines: 0, tokens: 0 }

const writeReports = (directory, reports) => {
  const reportDirectory = path.join(directory, 'jscpd-report')
  fs.mkdirSync(reportDirectory)
  for (const [name, contents] of Object.entries(reports)) {
    fs.writeFileSync(path.join(reportDirectory, name), contents)
  }
}

test('result mode counts validated clusters across report files and keeps the standalone Markdown', t => {
  const directory = createWorkspace(t)
  writeReports(directory, {
    'first.json': JSON.stringify({
      duplicates: [duplicate('a', 12, 90), emptyCluster]
    }),
    'second.json': JSON.stringify({ duplicates: [duplicate('b', 9, 70)] })
  })

  const result = runResultMode(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, 'status=ok total=2\n')
  const markdown = fs.readFileSync(path.join(directory, 'dup.md'), 'utf8')
  assert.match(markdown, /Found \*\*2\*\* duplicate clusters\./)
  assert.doesNotMatch(markdown, /first-empty\.js/)
  assert.equal(markdown, runAnalyzer(directory).stdout)
})

test('result mode reports zero only for a valid report whose clusters are all empty', t => {
  const directory = createWorkspace(t)
  writeReports(directory, {
    'report.json': JSON.stringify({ duplicates: [emptyCluster] })
  })

  const result = runResultMode(directory)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, 'status=ok total=0\n')
  assert.match(
    fs.readFileSync(path.join(directory, 'dup.md'), 'utf8'),
    /No significant duplicates found/
  )
})

test('result mode fails closed on a missing report', async t => {
  for (const [name, reports, reason] of [
    ['no directory', null, /No jscpd-report directory found/],
    ['no JSON files', {}, /No jscpd-report JSON files found/]
  ]) {
    await t.test(name, subtest => {
      const directory = createWorkspace(subtest)
      if (reports) writeReports(directory, reports)

      const result = runResultMode(directory)
      assert.equal(result.status, 1)
      assert.equal(result.stdout, 'status=missing\n')
      assert.match(result.stderr, reason)
      assert.equal(fs.existsSync(path.join(directory, 'dup.md')), false)
    })
  }
})

test('result mode fails closed on malformed and legacy report shapes', async t => {
  const legacyClone = duplicate('legacy', 10, 80)
  for (const [name, contents] of [
    ['malformed.json', '{'],
    ['missing.json', '{}'],
    ['invalid-cluster.json', '{"duplicates": [{}]}'],
    ['legacy-clones.json', JSON.stringify({ clones: [legacyClone] })],
    [
      'legacy-result-clones.json',
      JSON.stringify({ result: { clones: [legacyClone] } })
    ]
  ]) {
    await t.test(name, subtest => {
      const directory = createWorkspace(subtest)
      writeReports(directory, {
        'valid.json': JSON.stringify({ duplicates: [duplicate('a', 9, 70)] }),
        [name]: contents
      })

      const result = runResultMode(directory)
      assert.equal(result.status, 1)
      assert.equal(result.stdout, 'status=invalid\n')
      assert.ok(result.stderr.includes(name), result.stderr)
      assert.equal(fs.existsSync(path.join(directory, 'dup.md')), false)
    })
  }
})

test('rejects a --markdown-file flag without a path', t => {
  const directory = createWorkspace(t)
  const result = spawnSync(process.execPath, [analyzer, '--markdown-file'], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 10000
  })
  assert.equal(result.status, 2)
  assert.equal(result.stdout, '')
  assert.match(result.stderr, /Usage:/)
})

test('standalone CLI keeps ignoring unrecognised arguments', t => {
  const directory = createWorkspace(t)
  const run = args =>
    spawnSync(process.execPath, [analyzer, ...args], {
      cwd: directory,
      encoding: 'utf8',
      timeout: 10000
    })
  const baseline = run([])
  for (const args of [['--json'], ['dup.md']]) {
    const result = run(args)
    assert.equal(result.status, baseline.status)
    assert.equal(result.stdout, baseline.stdout)
  }
})
