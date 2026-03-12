import { expect, test, vi } from 'vitest'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('../src/context/GameState', () => ({
  useGameState: () => ({
    toasts: [
      { id: 1, type: 'success', message: 'Saved' },
      { id: 2, type: 'warning', message: 'Low harmony' },
      { id: 3, type: 'error', message: 'Crash' },
      { id: 4, type: 'info', message: 'Traveling' },
      { id: 5, type: 'info', message: 'ui:test.key|{invalid:json}' }
    ]
  })
}))

const mockLogger = {
  error: vi.fn()
}

vi.mock('../src/utils/logger.js', () => ({
  logger: mockLogger
}))

const { ToastOverlay, translateContextKeys } =
  await import('../src/ui/ToastOverlay.jsx')

test('translateContextKeys securely translates and filters deep properties', () => {
  const t = vi.fn(key => key.toUpperCase())

  // Use JSON.parse to ensure __proto__ is created as an own property,
  // not as setting the actual object prototype, mimicking a malicious JSON payload.
  const ctx = JSON.parse(`{
    "normalKey": "ui:hello",
    "num": 123,
    "nullVal": null,
    "arr": [1, 2, 3],
    "nested": {
      "deepKey": "events:boom"
    },
    "__proto__": { "injected": "bad" },
    "constructor": { "prototype": { "injected": "bad" } },
    "normalStr": "hello"
  }`)

  const result = translateContextKeys(ctx, t)

  // check valid translations
  expect(result.normalKey).toBe('UI:HELLO')
  expect(result.num).toBe(123)
  expect(result.nullVal).toBeNull()
  expect(result.arr).toEqual([1, 2, 3])
  expect(result.nested.deepKey).toBe('EVENTS:BOOM')
  expect(result.normalStr).toBe('hello')

  // check forbidden keys
  // Note: the test runner creates object prototype anyway so checking undefined on __proto__ directly fails in some envs
  expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false)
  expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(
    false
  )
})

test('ToastOverlay renders all taxonomy variants with themed classes', () => {
  const html = renderToStaticMarkup(React.createElement(ToastOverlay))

  expect(html).toContain('Saved')
  expect(html).toContain('Low harmony')
  expect(html).toContain('Crash')
  expect(html).toContain('Traveling')
  expect(html).toContain('text-(--toxic-green)')
  expect(html).toContain('text-(--warning-yellow)')
  expect(html).toContain('text-(--blood-red)')
  expect(html).toContain('text-(--info-blue)')
})

test('ToastOverlay logs error when message JSON parsing fails', () => {
  renderToStaticMarkup(React.createElement(ToastOverlay))

  expect(mockLogger.error).toHaveBeenCalledWith(
    'UI',
    'Toast message JSON parse error',
    expect.objectContaining({
      contextStr: '{invalid:json}',
      toastMessage: 'ui:test.key|{invalid:json}'
    })
  )
})
