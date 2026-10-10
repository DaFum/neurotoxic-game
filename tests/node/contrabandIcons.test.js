import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CONTRABAND_BY_ID } from '../../src/data/contraband'
import { getContrabandIconGlyph } from '../../src/ui/contrabandIcons'

describe('getContrabandIconGlyph', () => {
  it('has a glyph for every catalogue icon id', () => {
    const missing = []
    for (const [id, item] of CONTRABAND_BY_ID) {
      if (getContrabandIconGlyph(id, undefined) === null) {
        missing.push(`${id}:${item.icon}`)
      }
    }
    assert.deepEqual(missing, [])
  })

  it('prefers the catalogue icon over a stored one', () => {
    assert.equal(
      getContrabandIconGlyph('c_void_energy', 'icon_coffee'),
      getContrabandIconGlyph('c_void_energy', undefined)
    )
  })

  it('falls back to a known stored icon and rejects unknown or inherited ids', () => {
    assert.equal(
      getContrabandIconGlyph('not_in_catalogue', 'icon_coffee'),
      getContrabandIconGlyph('c_weekender_coffee', undefined)
    )
    assert.equal(getContrabandIconGlyph('not_in_catalogue', 'icon_nope'), null)
    assert.equal(getContrabandIconGlyph(undefined, 'toString'), null)
    assert.equal(getContrabandIconGlyph(42, 7), null)
  })
})
