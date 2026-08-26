import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

/**
 * @param {string} file
 * @returns {string}
 */
const read = file => fs.readFileSync(file, 'utf8')

/**
 * @param {string} source
 * @returns {string}
 */
const withoutComments = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('travel arrival wiring', () => {
  it('does not pass the real startGig action into the shared arrival utility', () => {
    const callback = withoutComments(
      read('src/hooks/travel/actions/useHandleNodeArrivalCallback.ts')
    )

    assert.match(
      callback,
      /handleNodeArrival\(\{[\s\S]*?\bstartGig\s*:\s*\(\)\s*=>\s*\{\s*\}/,
      'the arrival callback receives a no-op startGig'
    )
    assert.doesNotMatch(callback, /handleNodeArrival\(\{[\s\S]*?\bstartGig,/)
  })
})
