import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = file => fs.readFileSync(file, 'utf8')
const withoutComments = source =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('travel arrival parity', () => {
  it('keeps legacy travel-complete fallback aligned with minigame arrival side effects', () => {
    const fallback = read('src/hooks/travel/actions/useOnTravelComplete.ts')
    const arrival = read('src/hooks/useArrivalLogic.ts')

    for (const token of ['advanceDay', 'processTravelEvents']) {
      assert.match(fallback, new RegExp(`\\b${token}\\b`), token)
      assert.match(arrival, new RegExp(`\\b${token}\\b`), token)
    }

    assert.match(fallback, /moveRivalBandRef\.current/, 'fallback rival move')
    assert.match(arrival, /moveRivalBand\(/, 'arrival rival move')
    assert.match(
      fallback,
      /checkRivalEncounterRef\.current/,
      'fallback rival encounter'
    )
    assert.match(arrival, /checkRivalEncounter\(/, 'arrival rival encounter')
    assert.match(
      fallback,
      /handleNodeArrivalCallback/,
      'fallback arrival callback'
    )
    assert.match(arrival, /handleNodeArrival/, 'arrival node callback')

    assert.doesNotMatch(withoutComments(fallback), /includeGigNodes\s*:\s*true/)
    assert.doesNotMatch(withoutComments(arrival), /includeGigNodes\s*:\s*true/)
  })
})
