import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import React from 'react'

// Mock GlitchButton
const GlitchButton = ({ children, onClick }) => <button onClick={onClick}>{children}</button>
mock.module('../src/ui/GlitchButton.jsx', { namedExports: { GlitchButton } })

const ThrowingComponent = () => {
  throw new Error('Test Error')
}

test('CrashHandler exposes stack trace in DEV mode', async (t) => {
  setupJSDOM()
  t.after(teardownJSDOM)

  globalThis.__IMPORT_META_ENV__ = { DEV: true }

  mock.method(console, 'error', () => {})

  const { ErrorBoundary } = await import('../src/ui/CrashHandler.jsx')

  const { getByText, container } = render(
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  )

  assert.ok(getByText('Error: Test Error'))

  const preTags = container.querySelectorAll('pre')
  assert.ok(preTags.length > 0)
  assert.match(preTags[0].textContent, /ThrowingComponent/)
})

test('CrashHandler HIDES stack trace in PROD mode', async (t) => {
  setupJSDOM()
  t.after(teardownJSDOM)

  globalThis.__IMPORT_META_ENV__ = { DEV: false }

  mock.method(console, 'error', () => {})

  const { ErrorBoundary } = await import('../src/ui/CrashHandler.jsx')

  const { getByText, queryByText, container } = render(
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  )

  assert.ok(getByText('The simulation has crashed. Reboot required.'))

  // Verify error message is NOT visible
  assert.strictEqual(queryByText('Error: Test Error'), null, 'Detailed error message should NOT be visible in PROD mode')

  // Verify stack trace container is NOT present
  const preTags = container.querySelectorAll('pre')
  assert.strictEqual(preTags.length, 0, 'Stack trace pre tag should NOT be present in PROD mode')
})
