import { test, describe, before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'

const { useBandHQModal } = await import('../src/hooks/useBandHQModal.js')

describe('useBandHQModal', () => {
  before(() => {
    setupJSDOM()
  })

  after(() => {
    teardownJSDOM()
  })

  afterEach(() => {
    cleanup()
  })

  test('toggles modal state correctly', () => {
    const { result } = renderHook(() => useBandHQModal())

    assert.equal(result.current.showHQ, false)

    act(() => {
      result.current.openHQ()
    })
    assert.equal(result.current.showHQ, true)

    act(() => {
      result.current.closeHQ()
    })
    assert.equal(result.current.showHQ, false)
  })
})
