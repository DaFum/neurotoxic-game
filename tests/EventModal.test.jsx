import { expect, test, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EventModal } from '../src/ui/EventModal.jsx'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { changeLanguage: () => new Promise(() => {}) }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

vi.mock('../src/utils/eventEngine', () => ({
  resolveEventChoice: vi.fn(option => ({
    result: {},
    delta: { player: { money: 20 } },
    appliedDelta: { player: { money: 10 } },
    outcomeText: option.outcomeText || '',
    description:
      option.description !== undefined ? option.description : 'Description'
  }))
}))

vi.mock('../src/ui/shared/BrutalistUI', () => ({
  AlertIcon: () => <svg data-testid='alert-icon' />
}))

vi.mock('../src/ui/shared/Icons', () => ({
  VoidSkullIcon: () => <svg data-testid='void-skull-icon' />
}))

vi.mock('../src/context/GameState', () => ({
  useGameState: () => ({
    player: { money: 100 },
    band: { members: [{ id: 'm1', skills: {}, traits: {} }] },
    activeEvent: { id: 'test_event', context: {} }
  }),
  GameStateProvider: ({ children }) => <div>{children}</div>
}))

test('EventModal renders event details and handles click flow', async () => {
  const mockEvent = {
    id: 'test_event',
    title: 'Test Event',
    description: 'This is a test event.',
    options: [
      { label: 'Option 1', outcomeText: 'Good Outcome' },
      { label: 'Option 2' }
    ]
  }
  const handleSelect = vi.fn()
  const handleClose = vi.fn()

  render(
    <EventModal
      event={mockEvent}
      onOptionSelect={handleSelect}
      onClose={handleClose}
    />
  )

  const option1 = screen.getByText('Option 1')
  fireEvent.click(option1)

  // It should not call handleSelect immediately anymore, but show the outcome preview
  expect(handleSelect).not.toHaveBeenCalled()

  await waitFor(() => {
    expect(screen.getByText('Good Outcome Description')).toBeInTheDocument()
  })

  const continueButton = screen.getByText(/CONTINUE/i)
  fireEvent.click(continueButton)

  // Now it should call handleSelect with the precomputed result
  expect(handleSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      label: 'Option 1',
      _precomputedResult: expect.objectContaining({
        outcomeText: 'Good Outcome'
      })
    })
  )
})

test('EventModal handles resolveEventChoice error by showing fallback preview', async () => {
  const originalConsoleError = console.error
  console.error = () => {}
  try {
    const { resolveEventChoice } = await import('../src/utils/eventEngine')
    resolveEventChoice.mockImplementationOnce(() => {
      throw new Error('Test preview error')
    })

    const mockEvent = {
      id: 'test_event_error',
      title: 'Test Event',
      description: 'This is a test event.',
      options: [{ label: 'Option Error' }]
    }
    const handleSelect = vi.fn()

    render(<EventModal event={mockEvent} onOptionSelect={handleSelect} />)

    fireEvent.click(screen.getByText('Option Error'))

    // It should show outcome fallback instead of dispatching immediately
    expect(handleSelect).not.toHaveBeenCalled()

    await waitFor(() => {
      // Uses the generic error key
      expect(screen.getByText('ui:event_error')).toBeInTheDocument()
    })

    const continueButton = screen.getByText(/CONTINUE/i)
    fireEvent.click(continueButton)

    // It should call handleSelect with the raw option, since preview failed
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Option Error'
      })
    )
  } finally {
    console.error = originalConsoleError
  }
})

test('EventModal handles keyboard selection', async () => {
  const mockEvent = {
    id: 'test_event_2',
    title: 'Test Event',
    description: 'This is a test event.',
    options: [
      { label: 'Option 1' },
      { label: 'Option 2', outcomeText: 'Option 2 Outcome' }
    ]
  }
  const handleSelect = vi.fn()

  render(<EventModal event={mockEvent} onOptionSelect={handleSelect} />)

  fireEvent.keyDown(window, { key: '2' })

  // It should show outcome instead of dispatching immediately
  expect(handleSelect).not.toHaveBeenCalled()

  await waitFor(() => {
    expect(screen.getByText('Option 2 Outcome Description')).toBeInTheDocument()
  })

  const continueButton = screen.getByText(/CONTINUE/i)
  fireEvent.click(continueButton)

  expect(handleSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      label: 'Option 2',
      _precomputedResult: expect.objectContaining({
        outcomeText: 'Option 2 Outcome'
      })
    })
  )
})

test('EventModal keyboard selection blocks disabled options', async () => {
  const mockEvent = {
    id: 'test_event_3',
    title: 'Test Event',
    description: 'This is a test event.',
    options: [{ label: 'Option 1', disabled: true }, { label: 'Option 2' }]
  }
  const handleSelect = vi.fn()

  render(<EventModal event={mockEvent} onOptionSelect={handleSelect} />)

  fireEvent.keyDown(window, { key: '1' })

  // Since Option 1 is disabled, nothing should happen.
  expect(handleSelect).not.toHaveBeenCalled()

  // No CONTINUE button should appear
  expect(screen.queryByText(/CONTINUE/i)).not.toBeInTheDocument()
})

test('EventModal uses fallback text when both outcomeText and description are empty', async () => {
  const mockEvent = {
    id: 'test_event_empty',
    title: 'Test Event',
    description: 'This is a test event.',
    options: [{ label: 'Option 1', outcomeText: '', description: '' }]
  }
  const handleSelect = vi.fn()

  render(<EventModal event={mockEvent} onOptionSelect={handleSelect} />)

  fireEvent.click(screen.getByText('Option 1'))

  await waitFor(() => {
    expect(screen.getByText('ui:event.resolved')).toBeInTheDocument()
  })
})
