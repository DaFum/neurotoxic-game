import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { FLAGS, isStoryFlag } from '../../src/data/flags.registry'

const listSourceFiles = dir => {
  const entries = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) entries.push(...listSourceFiles(full))
    else if (/\.(ts|tsx)$/.test(full)) entries.push(full)
  }
  return entries
}

const SOURCE_FILES = listSourceFiles('src').filter(
  file => !file.endsWith('flags.registry.ts')
)

/**
 * Collects flag string literals that escaped the registry.
 *
 * Scans the positions where a flag can appear: event `flag` effects, the
 * declarative quest flag arrays, `rewardFlag`, module `requiredStoryFlags`,
 * and reads against `activeStoryFlags`.
 */
const collectLiteralFlagUsages = () => {
  // `bare` patterns capture one already-unquoted flag; `list` patterns capture
  // a whole array body, whose quoted entries are extracted afterwards.
  const BARE_PATTERNS = [
    // The event-effect shape, not any property that happens to be named
    // `flag` — asset modifier flags are a separate namespace.
    /type:\s*'flag(?:\.add)?',\s*flag:\s*'([^']+)'/g,
    /rewardFlag:\s*'([^']+)'/g,
    /storyFlagNotSet\(\s*'([^']+)'/g,
    /activeStoryFlags\??\.includes\(\s*'([^']+)'/g,
    /activeStoryFlagsSet\.has\(\s*'([^']+)'/g,
    /hasStateItem\([^,]*activeStoryFlags,\s*'([^']+)'/g
  ]
  const LIST_PATTERNS = [
    /(?:startFlags|completionFlags|failureFlags|clearFlagsOnComplete|clearFlagsOnFail|requiredStoryFlags)\s*:\s*\[([^\]]*)\]/g
  ]

  const offenders = []
  for (const file of SOURCE_FILES) {
    // Strip comments: prose mentions flag shapes by example.
    const source = readFileSync(file, 'utf8')
      .split('\n')
      .filter(line => !/^\s*(\/\/|\/\*|\*)/.test(line))
      .join('\n')
    for (const pattern of BARE_PATTERNS) {
      for (const match of source.matchAll(pattern)) {
        offenders.push(`${file}: '${match[1]}'`)
      }
    }
    for (const pattern of LIST_PATTERNS) {
      for (const match of source.matchAll(pattern)) {
        for (const literal of match[1].matchAll(/'([^']+)'/g)) {
          offenders.push(`${file}: '${literal[1]}'`)
        }
      }
    }
  }
  return [...new Set(offenders)]
}

/**
 * Collects the registry members actually referenced anywhere in source.
 */
const collectReferencedFlagNames = () => {
  const referenced = new Set()
  for (const file of SOURCE_FILES) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/\bFLAGS\.([A-Z0-9_]+)/g)) {
      referenced.add(match[1])
    }
  }
  return referenced
}

describe('FLAGS registry', () => {
  test('has no duplicate flag values', () => {
    const values = Object.values(FLAGS)

    assert.equal(new Set(values).size, values.length)
  })

  test('every flag is a non-empty snake_case string', () => {
    for (const [name, value] of Object.entries(FLAGS)) {
      assert.match(value, /^[a-z][a-z0-9_]*$/, `${name} -> "${value}"`)
    }
  })

  test('no source file writes or reads a flag as a string literal', () => {
    assert.deepEqual(
      collectLiteralFlagUsages(),
      [],
      'these flag positions still use string literals instead of FLAGS.*'
    )
  })

  test('every registry entry is referenced by at least one writer or reader', () => {
    const referenced = collectReferencedFlagNames()
    const orphans = Object.keys(FLAGS).filter(name => !referenced.has(name))

    assert.deepEqual(
      orphans,
      [],
      'registry entries nothing references — either wire them up or delete them'
    )
  })

  test('isStoryFlag accepts registered flags and rejects everything else', () => {
    for (const value of Object.values(FLAGS)) {
      assert.equal(isStoryFlag(value), true, value)
    }
    for (const value of ['not_a_flag', '', null, undefined, 42, {}]) {
      assert.equal(isStoryFlag(value), false, String(value))
    }
  })
})
