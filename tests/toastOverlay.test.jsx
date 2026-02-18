import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

mock.module('../src/context/GameState', {
  namedExports: {
    useGameState: () => ({
      toasts: [
        { id: 1, type: 'success', message: 'Saved' },
        { id: 2, type: 'warning', message: 'Low harmony' },
        { id: 3, type: 'error', message: 'Crash' },
        { id: 4, type: 'info', message: 'Traveling' }
      ]
    })
  }
})

const { ToastOverlay } = await import('../src/ui/ToastOverlay.jsx')

test('ToastOverlay renders all taxonomy variants with themed classes', () => {
  const html = renderToStaticMarkup(React.createElement(ToastOverlay))

  assert.ok(html.includes('Saved'))
  assert.ok(html.includes('Low harmony'))
  assert.ok(html.includes('Crash'))
  assert.ok(html.includes('Traveling'))
  assert.ok(html.includes('text-(--toxic-green)'))
  assert.ok(html.includes('text-(--warning-yellow)'))
  assert.ok(html.includes('text-(--blood-red)'))
  assert.ok(html.includes('text-(--info-blue)'))
})
