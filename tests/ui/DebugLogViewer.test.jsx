import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { DebugLogViewer } from '../../src/ui/DebugLogViewer.tsx'

const locale = vi.hoisted(() => ({ translations: {} }))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) =>
      locale.translations[key] ?? options?.defaultValue ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
}))

vi.mock('../../src/utils/logger', async importOriginal => {
  const { safeStringify } = await importOriginal()
  const listeners = new Set()
  const logger = {
    maxLogs: 100,
    minLevel: 10,
    setLevel: vi.fn(level => {
      logger.minLevel = level
    }),
    logs: [
      {
        id: 'log1',
        timestamp: '2025-01-01T10:00:00.000Z',
        level: 'INFO',
        channel: 'Test',
        message: 'hello world'
      },
      {
        id: 'log2',
        timestamp: '2025-01-01T10:01:00.000Z',
        level: 'ERROR',
        channel: 'System',
        message: 'critical failure',
        data: { reason: 'timeout' }
      }
    ],
    subscribe: vi.fn(cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    }),
    clear: vi.fn(() => {
      logger.logs = []
      listeners.forEach(cb => {
        cb({ type: 'clear' })
      })
    }),
    dump: vi.fn(() => []),
    _emitAdd: entry => {
      listeners.forEach(cb => {
        cb({ type: 'add', entry })
      })
    }
  }
  return {
    logger,
    isValidLogLevel: vi.fn(() => true),
    safeStringify,
    LOG_LEVELS: { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 }
  }
})

describe('DebugLogViewer', () => {
  let loggerMock

  beforeEach(async () => {
    vi.clearAllMocks()
    loggerMock = (await import('../../src/utils/logger')).logger

    // Reset seed data
    loggerMock.minLevel = 10
    loggerMock.logs = [
      {
        id: 'log1',
        timestamp: '2025-01-01T10:00:00.000Z',
        level: 'INFO',
        channel: 'Test',
        message: 'hello world'
      },
      {
        id: 'log2',
        timestamp: '2025-01-01T10:01:00.000Z',
        level: 'ERROR',
        channel: 'System',
        message: 'critical failure',
        data: { reason: 'timeout' }
      }
    ]

    // Reset to test environment
    vi.stubEnv('DEV', true)
  })

  test('is invisible by default', () => {
    const { container } = render(<DebugLogViewer />)
    expect(container.firstChild).toBeNull()
  })

  test('toggles visibility via keyboard shortcut (Ctrl + `)', () => {
    render(<DebugLogViewer />)

    // initially hidden
    expect(screen.queryByText('NEUROTOXIC DEBUGGER')).not.toBeInTheDocument()

    // press Ctrl + `
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    // should be visible
    expect(screen.getByText('NEUROTOXIC DEBUGGER')).toBeInTheDocument()
    expect(screen.getByText('hello world')).toBeInTheDocument()
    expect(screen.getByText('critical failure')).toBeInTheDocument()
    expect(screen.getByText('{"reason":"timeout"}')).toBeInTheDocument()

    // press Ctrl + ` again
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    // should be hidden
    expect(screen.queryByText('NEUROTOXIC DEBUGGER')).not.toBeInTheDocument()
  })

  test('does not toggle in production', () => {
    vi.stubEnv('DEV', false)
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })
    expect(screen.queryByText('NEUROTOXIC DEBUGGER')).not.toBeInTheDocument()
  })

  test('filters logs by level', () => {
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    expect(screen.getByText('hello world')).toBeInTheDocument()

    // Change filter to ERROR (40)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '40' } }) // ERROR level

    // INFO log should be hidden, ERROR log should be visible
    expect(screen.queryByText('hello world')).not.toBeInTheDocument()
    expect(screen.getByText('critical failure')).toBeInTheDocument()
    // The viewer only hides rows; the global logger level stays untouched.
    expect(loggerMock.setLevel).not.toHaveBeenCalled()
  })

  test('renders an Error payload with its message', () => {
    loggerMock.logs = [
      {
        id: 'log3',
        timestamp: '2025-01-01T10:02:00.000Z',
        level: 'ERROR',
        channel: 'EventModal',
        message: 'Failed to preview',
        data: new Error('boom')
      }
    ]
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    expect(screen.getByText(/"message":"boom"/)).toBeInTheDocument()
  })

  test('clears logs', () => {
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    const clearButton = screen.getByText('ui:action_clear')
    fireEvent.click(clearButton)

    expect(loggerMock.clear).toHaveBeenCalled()
    expect(screen.queryByText('hello world')).not.toBeInTheDocument()
    expect(screen.queryByText('critical failure')).not.toBeInTheDocument()
  })

  test('closes via close button', () => {
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    const closeButton = screen.getByRole('button', { name: 'ui:action_close' })
    fireEvent.click(closeButton)

    expect(screen.queryByText('NEUROTOXIC DEBUGGER')).not.toBeInTheDocument()
  })

  test('copies logs to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue()
      }
    })
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')
    try {
      render(<DebugLogViewer />)
      fireEvent.keyDown(window, { key: '`', ctrlKey: true })

      const copyButton = screen.getByText('COPY LOGS')
      fireEvent.click(copyButton)

      expect(loggerMock.dump).toHaveBeenCalled()
      expect(clipboardSpy).toHaveBeenCalledWith(
        loggerMock.dump.mock.results[0].value
      )
    } finally {
      clipboardSpy.mockRestore()
    }
  })

  test('receives new logs dynamically', async () => {
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    act(() => {
      // Must also update the mock's logs array since the component re-syncs state immediately
      // on subscribe and slice/reads from logger.logs
      const newEntry = {
        id: 'log3',
        timestamp: '2025-01-01T10:02:00.000Z',
        level: 'WARN',
        channel: 'Network',
        message: 'retry connection'
      }
      // Add the new log entry directly to the mock store
      loggerMock.logs = [newEntry, ...loggerMock.logs]
      // Then trigger the event for any active subscriptions
      loggerMock._emitAdd(newEntry)
    })

    // wait for React to process the state update
    expect(await screen.findByText('retry connection')).toBeInTheDocument()
  })

  test('renders localized toolbar labels that match their accessible names', () => {
    locale.translations = {
      'ui:debugViewer.title': 'NEUROTOXIC-DEBUGGER',
      'ui:debugViewer.levelFilter': 'Protokollstufe filtern',
      'ui:action_dump_logs': 'PROTOKOLLE IN KONSOLE AUSGEBEN',
      'ui:action_close': 'SCHLIESSEN'
    }
    try {
      render(<DebugLogViewer />)
      fireEvent.keyDown(window, { key: '`', ctrlKey: true })

      expect(screen.getByText('NEUROTOXIC-DEBUGGER')).toBeInTheDocument()
      expect(
        screen.getByRole('combobox', { name: 'Protokollstufe filtern' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'PROTOKOLLE IN KONSOLE AUSGEBEN' })
      ).toHaveTextContent('PROTOKOLLE IN KONSOLE AUSGEBEN')
      expect(
        screen.getByRole('button', { name: 'SCHLIESSEN' })
      ).toHaveTextContent('SCHLIESSEN')
    } finally {
      locale.translations = {}
    }
  })

  test('keeps one logger subscription across re-renders', () => {
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })
    expect(loggerMock.subscribe).toHaveBeenCalledTimes(1)

    act(() => {
      const newEntry = {
        id: 'log3',
        timestamp: '2025-01-01T10:02:00.000Z',
        level: 'WARN',
        channel: 'Network',
        message: 'retry connection'
      }
      loggerMock.logs = [newEntry, ...loggerMock.logs]
      loggerMock._emitAdd(newEntry)
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '40' }
    })

    expect(screen.getByText('critical failure')).toBeInTheDocument()
    expect(loggerMock.subscribe).toHaveBeenCalledTimes(1)
  })
})
