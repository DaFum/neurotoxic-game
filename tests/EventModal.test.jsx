import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { EventModal } from '../src/ui/EventModal.jsx'

vi.mock('../src/ui/shared/BrutalistUI', () => ({
  AlertIcon: () => <svg data-testid='alert-icon' />
}))

vi.mock('../src/ui/shared/Icons', () => ({
  VoidSkullIcon: () => <svg data-testid='void-skull-icon' />
}))

vi.mock('../src/context/GameState', () => ({
  useGameState: () => ({
    player: { money: 100 },
    band: { members: [{ id: 'm1', skills: {}, traits: [] }] },
    activeEvent: { id: 'test_event', context: {} }
  }),
  GameStateProvider: ({ children }) => <div>{children}</div>
}))

test('EventModal renders event details and handles click flow', async () => {
  const mockEvent = {
    title: 'Test Event',
    description: 'This is a test event.',
    options: [
      { label: 'Option 1', outcomeText: 'Good Outcome' },
      { label: 'Option 2' }
    ]
  }
  const handleSelect = vi.fn()

  render(<EventModal event={mockEvent} onOptionSelect={handleSelect} />)

  const option1 = screen.getByText('Option 1')
  fireEvent.click(option1)

  await waitFor(() => {
    expect(screen.getByText('Good Outcome')).toBeInTheDocument()
  })

  const continueButton = screen.getByText(/CONTINUE/i)
  fireEvent.click(continueButton)

  expect(handleSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      label: 'Option 1',
      _precomputedResult: expect.any(Object)
    })
  )
})

test('EventModal handles keyboard selection', async () => {
  const mockEvent = {
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

  await waitFor(() => {
    expect(screen.getByText('Option 2 Outcome')).toBeInTheDocument()
  })

  const continueButton = screen.getByText(/CONTINUE/i)
  fireEvent.click(continueButton)

  expect(handleSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      label: 'Option 2',
      _precomputedResult: expect.any(Object)
    })
  )
})

test('EventModal handles option with direct action callback', () => {
  const mockAction = vi.fn()
  const mockEvent = {
    title: 'Test Event',
    description: 'Test',
    options: [{ label: 'Option 1', action: mockAction }]
  }
  const handleSelect = vi.fn()

  render(<EventModal event={mockEvent} onOptionSelect={handleSelect} />)

  fireEvent.click(screen.getByText('Option 1'))
  expect(mockAction).toHaveBeenCalledTimes(1)
  expect(handleSelect).not.toHaveBeenCalled()
})
