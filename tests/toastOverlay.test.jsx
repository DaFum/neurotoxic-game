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
  logger: mockLogger,
  LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 }
}))

const { ToastOverlay } = await import('../src/ui/ToastOverlay.jsx')

test('ToastOverlay renders all taxonomy variants with themed classes', () => {
  const html = renderToStaticMarkup(React.createElement(ToastOverlay))

  expect(html).toContain('Saved')
  expect(html).toContain('Low harmony')
  expect(html).toContain('Crash')
  expect(html).toContain('Traveling')
  expect(html).toContain('text-toxic-green')
  expect(html).toContain('text-warning-yellow')
  expect(html).toContain('text-blood-red')
  expect(html).toContain('text-info-blue')
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
