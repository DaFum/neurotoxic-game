import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { DebugLogViewer } from '../src/ui/DebugLogViewer.jsx'

vi.mock('../src/utils/logger', () => {
  const listeners = new Set()
  const logger = {
    maxLogs: 100,
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
    subscribe: cb => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
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
    LOG_LEVELS: { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40 }
  }
})

describe('DebugLogViewer', () => {
  let loggerMock

  beforeEach(async () => {
    vi.clearAllMocks()
    loggerMock = (await import('../src/utils/logger')).logger

    // Reset seed data
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
  })

  test('clears logs', () => {
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    act(() => { loggerMock.clear() })

    expect(loggerMock.clear).toHaveBeenCalled()
    expect(screen.queryByText('hello world')).not.toBeInTheDocument()
    expect(screen.queryByText('critical failure')).not.toBeInTheDocument()
  })

  test('closes via close button', () => {
    render(<DebugLogViewer />)
    fireEvent.keyDown(window, { key: '`', ctrlKey: true })

    const closeButton = screen.getByText('CLOSE')
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
      loggerMock._emitAdd({
        id: 'log3',
        timestamp: '2025-01-01T10:02:00.000Z',
        level: 'WARN',
        channel: 'Network',
        message: 'retry connection'
      })
    })

    expect(await screen.findByText('retry connection')).toBeInTheDocument()
  })
})
