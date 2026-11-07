import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseNodeTestArgs } from '../../scripts/utils/node-test-args.mjs'

const EMPTY = {
  skipHeavy: false,
  onlyHeavy: false,
  onlyTooling: false,
  shard: null,
  concurrency: null,
  reporterArgs: [],
  forwardedArgs: [],
  explicitFiles: []
}

describe('parseNodeTestArgs', () => {
  it('returns an empty selection for no arguments', () => {
    assert.deepEqual(parseNodeTestArgs([]), EMPTY)
    assert.deepEqual(parseNodeTestArgs(['--']), EMPTY)
  })

  it('splits runner options, reporters, forwarded args and files in one pass', () => {
    assert.deepEqual(
      parseNodeTestArgs([
        '--',
        '--only-tooling',
        '--shard=2/3',
        '--test-concurrency=4',
        '--test-reporter=spec',
        '--import',
        'a.js',
        'tests/node/x.test.js',
        '--',
        '--shard=9/1'
      ]),
      {
        ...EMPTY,
        onlyTooling: true,
        shard: { token: '--shard=2/3', index: 2, total: 3, valid: true },
        concurrency: '4',
        reporterArgs: ['--test-reporter=spec'],
        forwardedArgs: ['--import', 'a.js', 'tests/node/x.test.js', '--'],
        explicitFiles: ['tests/node/x.test.js']
      }
    )
  })

  it('reports an invalid shard instead of throwing', () => {
    assert.deepEqual(parseNodeTestArgs(['--shard=0/2']).shard, {
      token: '--shard=0/2',
      index: 0,
      total: 2,
      valid: false
    })
  })

  it('keeps the value-slot and separate-value quirks', () => {
    const swallowed = parseNodeTestArgs(['-r', '--skip-heavy', 'x.test.js'])
    assert.equal(swallowed.skipHeavy, true)
    assert.deepEqual(swallowed.explicitFiles, [])
    assert.deepEqual(swallowed.forwardedArgs, ['-r', 'x.test.js'])

    const separate = parseNodeTestArgs(['--test-concurrency', '4'])
    assert.equal(separate.concurrency, 'undefined')
    assert.deepEqual(separate.forwardedArgs, ['4'])
  })
})
