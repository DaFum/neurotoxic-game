import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { sanitizeLoadedToast } from '../../src/context/reducers/toastSanitizers'

describe('toastSanitizers - sanitizePrimitiveOptions forbidden keys', () => {
  it('strips prototype-pollution keys from loaded toast options', () => {
    // JSON.parse creates `__proto__`/`constructor`/`prototype` as OWN
    // properties (unlike object literals), modeling a hostile save.
    const hostile = JSON.parse(
      '{"id":"t1","type":"info","messageKey":"ui:toast.test","options":' +
        '{"__proto__":"evil","constructor":"bad","prototype":"x","amount":5}}'
    )

    const result = sanitizeLoadedToast(hostile)

    assert.ok(result, 'toast should be sanitized, not rejected')
    assert.deepStrictEqual(result.options, { amount: 5 })
    assert.equal(Object.hasOwn(result.options, '__proto__'), false)
    assert.equal(Object.hasOwn(result.options, 'constructor'), false)
    assert.equal(Object.hasOwn(result.options, 'prototype'), false)
  })
})
