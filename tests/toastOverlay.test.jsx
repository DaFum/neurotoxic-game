import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('../src/context/GameState', () => ({
    useGameState: () => ({
      toasts: [
        { id: 1, type: 'success', message: 'Saved' },
        { id: 2, type: 'warning', message: 'Low harmony' },
        { id: 3, type: 'error', message: 'Crash' },
        { id: 4, type: 'info', message: 'Traveling' }
      ]
    })
  }))
const { ToastOverlay } = await import('../src/ui/ToastOverlay.jsx')

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
