import assert from 'node:assert/strict'
import test from 'node:test'
import { getRegionKeyForLocation } from '../../src/utils/mapUtils'
import {
  getCityKeyFromVenueId,
  getCityPrefix
} from '../../src/utils/mapGenerator/cityTraits'
import { ALL_VENUES } from '../../src/data/venues'

test('region and city keys agree on every shipped venue id', () => {
  for (const venue of ALL_VENUES) {
    assert.ok(getCityKeyFromVenueId(venue.id).length > 0, venue.id)
    assert.equal(
      getRegionKeyForLocation(venue.id),
      getCityKeyFromVenueId(venue.id),
      venue.id
    )
    assert.equal(
      getRegionKeyForLocation(venue.name),
      getCityKeyFromVenueId(venue.id)
    )
  }
})

test('underscore-less ids: the city key is empty, the region key falls back to the id', () => {
  assert.equal(getCityPrefix('stendal'), '')
  assert.equal(getCityKeyFromVenueId('stendal'), '')
  assert.equal(getRegionKeyForLocation('stendal'), 'stendal')
  assert.equal(getRegionKeyForLocation('venues:stendal.name'), 'stendal')
})

test('a leading underscore yields no city prefix in either helper', () => {
  assert.equal(getCityPrefix('_x'), '')
  assert.equal(getCityKeyFromVenueId('_x'), '')
  assert.equal(getRegionKeyForLocation('_x'), '_x')
})

test('region key rejects unusable locations', () => {
  for (const bad of [null, undefined, '', 0, false, {}]) {
    assert.equal(getRegionKeyForLocation(bad), null, String(bad))
  }
})
