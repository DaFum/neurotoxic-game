import { test, describe, before, after, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { renderHook, act, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils.js'

let mockPendingForeclosureNotices = []
const mockDismissForeclosureNotice = mock.fn()

mock.module('../../src/context/GameState', {
  namedExports: {
    useGameSelector: mock.fn(selector =>
      selector({ pendingForeclosureNotices: mockPendingForeclosureNotices })
    ),
    useGameActions: mock.fn(() => ({
      dismissForeclosureNotice: mockDismissForeclosureNotice
    }))
  }
})

const { useForeclosureModal } =
  await import('../../src/hooks/useForeclosureModal')

describe('useForeclosureModal', () => {
  before(() => {
    setupJSDOM()
  })

  after(() => {
    teardownJSDOM()
  })

  afterEach(() => {
    cleanup()
    mockPendingForeclosureNotices = []
    mockDismissForeclosureNotice.mock.resetCalls()
  })

  test('stays closed when there are no pending foreclosure notices', () => {
    const { result } = renderHook(() => useForeclosureModal())

    assert.equal(result.current.isOpen, false)
    assert.equal(result.current.currentKind, null)

    act(() => {
      result.current.dismiss()
    })

    assert.equal(mockDismissForeclosureNotice.mock.calls.length, 0)
  })

  test('exposes the first pending notice and dismisses it by kind', () => {
    mockPendingForeclosureNotices = ['studio_chassis', 'tourbus_chassis']

    const { result } = renderHook(() => useForeclosureModal())

    assert.equal(result.current.isOpen, true)
    assert.equal(result.current.currentKind, 'studio_chassis')

    act(() => {
      result.current.dismiss()
    })

    assert.deepEqual(mockDismissForeclosureNotice.mock.calls[0].arguments, [
      'studio_chassis'
    ])
  })
})
