import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  NODE_TEST_DIRS,
  NODE_TEST_FILE_PATTERN
} from '../../scripts/utils/node-test-dirs.mjs'

const repoRoot = process.cwd()
const testsRoot = path.join(repoRoot, 'tests')
const nodeTestImportPattern =
  /(?:from\s+|(?:import|require)\s*\(\s*)['"]node:test['"]/
const testFilePattern = /(?:\.(?:test|spec)|_test)\.(?:[cm]?[jt]sx?)$/
// Imported from the shared module the runner itself uses, so this guard cannot
// drift into validating a stale copy of the discovery rules.
const nodeOwnedDirectories = NODE_TEST_DIRS
const localeOwnedFiles = new Set([
  'tests/locale/full.test.js',
  'tests/locale/smoke.test.js'
])

const toRepoPath = filePath =>
  path.relative(repoRoot, filePath).replaceAll('\\', '/')

const isNodeRunnerDirectory = relativePath =>
  nodeOwnedDirectories.some(
    directory =>
      relativePath === directory || relativePath.startsWith(`${directory}/`)
  )

const isRunnerOwned = relativePath =>
  localeOwnedFiles.has(relativePath) ||
  (isNodeRunnerDirectory(relativePath) &&
    NODE_TEST_FILE_PATTERN.test(relativePath))

const findTestFiles = directory => {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...findTestFiles(entryPath))
    } else if (testFilePattern.test(entry.name)) {
      files.push(entryPath)
    }
  }
  return files
}

describe('node:test discovery ownership', () => {
  it('matches the file names supported by each owning runner', () => {
    assert.equal(isRunnerOwned('tests/node/example.test.js'), true)
    assert.equal(isRunnerOwned('tests/events/example.spec.js'), true)
    assert.equal(isRunnerOwned('tests/locale/smoke.test.js'), true)
    assert.equal(isRunnerOwned('tests/locale/full.test.js'), true)
    assert.equal(isRunnerOwned('tests/node/example_test.js'), false)
    assert.equal(isRunnerOwned('tests/node/example.test.ts'), false)
    assert.equal(isRunnerOwned('tests/locale/extra.test.js'), false)
    assert.equal(isRunnerOwned('tests/example.test.js'), false)
  })

  it('keeps every node:test suite inside a runner-owned directory', () => {
    const unownedSuites = findTestFiles(testsRoot)
      .map(filePath => ({
        relativePath: toRepoPath(filePath),
        source: fs.readFileSync(filePath, 'utf8')
      }))
      .filter(
        ({ relativePath, source }) =>
          nodeTestImportPattern.test(source) && !isRunnerOwned(relativePath)
      )
      .map(({ relativePath }) => relativePath)
      .sort()

    assert.deepEqual(
      unownedSuites,
      [],
      `node:test suites outside runner-owned directories:\n${unownedSuites.join('\n')}`
    )
  })
})
