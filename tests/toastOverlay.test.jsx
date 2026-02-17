import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, cleanup } from '@testing-library/react'

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
  const { getByText } = render(React.createElement(ToastOverlay))

  const savedToast = getByText('Saved').closest('div[class]')
  const warningToast = getByText('Low harmony').closest('div[class]')
  const errorToast = getByText('Crash').closest('div[class]')
  const infoToast = getByText('Traveling').closest('div[class]')

  assert.ok(savedToast.className.includes('text-(--toxic-green)'))
  assert.ok(warningToast.className.includes('text-(--warning-yellow)'))
  assert.ok(errorToast.className.includes('text-(--blood-red)'))
  assert.ok(infoToast.className.includes('text-(--info-blue)'))

  cleanup()
})
