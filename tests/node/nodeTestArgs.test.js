import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseNodeTestArgs } from '../../scripts/utils/node-test-args.mjs'

const EMPTY = {
  skipHeavy: false,
  onlyHeavy: false,
  onlyTooling: false,
  shard: null,
  concurrency: null,
  repeatedOptions: [],
  unknownOptions: [],
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
        concurrency: { token: '--test-concurrency=4', value: 4, valid: true },
        repeatedOptions: ['--shard'],
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

  it('keeps the value-slot quirk', () => {
    const swallowed = parseNodeTestArgs(['-r', '--skip-heavy', 'x.test.js'])
    assert.equal(swallowed.skipHeavy, true)
    assert.deepEqual(swallowed.explicitFiles, [])
    assert.deepEqual(swallowed.forwardedArgs, ['-r', 'x.test.js'])
  })

  it('reads runner option values in separate form', () => {
    const separate = parseNodeTestArgs([
      '--test-concurrency',
      '4',
      '--shard',
      '1/2'
    ])
    assert.deepEqual(separate.concurrency, {
      token: '--test-concurrency 4',
      value: 4,
      valid: true
    })
    assert.deepEqual(separate.shard, {
      token: '--shard 1/2',
      index: 1,
      total: 2,
      valid: true
    })
    assert.deepEqual(separate.forwardedArgs, [])
  })

  it('reports a missing separate value without consuming the next option', () => {
    const missing = parseNodeTestArgs(['--test-concurrency', '--only-heavy'])
    assert.equal(missing.onlyHeavy, true)
    assert.equal(missing.concurrency?.valid, false)
    assert.equal(missing.concurrency?.token, '--test-concurrency')
  })

  it('bounds --test-concurrency to a safe worker count', () => {
    const concurrencyOf = value =>
      parseNodeTestArgs([`--test-concurrency=${value}`]).concurrency
    assert.deepEqual(concurrencyOf('1024'), {
      token: '--test-concurrency=1024',
      value: 1024,
      valid: true
    })
    assert.equal(concurrencyOf('1025')?.valid, false)
    // Matches the digit pattern but serialises as 1e+22.
    assert.equal(concurrencyOf(`1${'0'.repeat(22)}`)?.valid, false)
  })

  it('reports a longer name sharing a runner option prefix as unknown', () => {
    const parsed = parseNodeTestArgs([
      '--test-concurrency-foo',
      '--shard-x=1/2',
      '--test-concurrency=2'
    ])
    assert.deepEqual(parsed.unknownOptions, [
      '--test-concurrency-foo',
      '--shard-x=1/2'
    ])
    assert.deepEqual(parsed.forwardedArgs, [])
    assert.equal(parsed.concurrency?.value, 2)
  })
})
