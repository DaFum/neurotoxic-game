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

describe('travel arrival parity', () => {
  it('keeps legacy travel-complete fallback aligned with minigame arrival side effects', () => {
    const fallback = withoutComments(
      read('src/hooks/travel/actions/useOnTravelComplete.ts')
    )
    const arrival = withoutComments(read('src/hooks/useArrivalLogic.ts'))

    assert.match(fallback, /\badvanceDay\s*\(/, 'fallback advance day')
    assert.match(arrival, /\badvanceDay\s*\(/, 'arrival advance day')
    assert.match(
      fallback,
      /\bprocessTravelEvents\s*\(/,
      'fallback travel events'
    )
    assert.match(arrival, /\bprocessTravelEvents\s*\(/, 'arrival travel events')

    assert.match(
      fallback,
      /moveRivalBandRef\.current(?:\?\.)?\s*\(/,
      'fallback rival move'
    )
    assert.match(arrival, /moveRivalBand\s*\(/, 'arrival rival move')
    assert.match(
      fallback,
      /checkRivalEncounterRef\.current(?:\?\.)?\s*\(/,
      'fallback rival encounter'
    )
    assert.match(arrival, /checkRivalEncounter\s*\(/, 'arrival rival encounter')
    assert.match(
      fallback,
      /handleNodeArrivalCallback\s*\(/,
      'fallback arrival callback'
    )
    assert.match(arrival, /handleNodeArrival\s*\(/, 'arrival node callback')

    assert.doesNotMatch(fallback, /includeGigNodes\s*:\s*true/)
    assert.doesNotMatch(arrival, /includeGigNodes\s*:\s*true/)
  })
})
