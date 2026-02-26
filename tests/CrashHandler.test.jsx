import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi
} from 'vitest'

import { render } from '@testing-library/react'

// Mock GlitchButton
const GlitchButton = ({ children, onClick }) => (
  <button type='button' onClick={onClick}>
    {children}
  </button>
)
vi.mock('../src/ui/GlitchButton.jsx', () => ({ GlitchButton }))

let originalEnv

beforeEach(() => {
  originalEnv = globalThis.__IMPORT_META_ENV__
})

afterEach(() => {
  globalThis.__IMPORT_META_ENV__ = originalEnv
  vi.restoreAllMocks()
})

const ThrowingComponent = () => {
  throw new Error('Test Error')
}

test('CrashHandler exposes stack trace in DEV mode', async () => {
  //  removed (handled by vitest env)

  globalThis.__IMPORT_META_ENV__ = { DEV: true }

  vi.spyOn(console, 'error').mockImplementation(() => {})

  const { ErrorBoundary } = await import('../src/ui/CrashHandler.jsx')

  const { getByText, container } = render(
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  )

  expect(getByText('Error: Test Error')).toBeInTheDocument()
  const preTags = container.querySelectorAll('pre')
  expect(preTags.length > 0).toBeTruthy()
  expect(preTags[0].textContent).toMatch(/ThrowingComponent/)
})

test('CrashHandler HIDES stack trace in PROD mode', async () => {
  //  removed (handled by vitest env)

  globalThis.__IMPORT_META_ENV__ = { DEV: false }

  vi.spyOn(console, 'error').mockImplementation(() => {})

  const { ErrorBoundary } = await import('../src/ui/CrashHandler.jsx')

  const { getByText, queryByText, container } = render(
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  )

  expect(
    getByText('The simulation has crashed. Reboot required.')
  ).toBeInTheDocument()
  // Verify error message is NOT visible
  expect(queryByText('Error: Test Error')).toBe(null)

  // Verify stack trace container is NOT present
  const preTags = container.querySelectorAll('pre')
  expect(preTags.length).toBe(0)
})
