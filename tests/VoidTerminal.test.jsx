import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { VoidTerminal } from '../src/ui/VoidTerminal'

// Mock useGameState
const mockDispatch = vi.fn()
vi.mock('../src/context/GameState', () => ({
  useGameState: () => ({
    state: { player: { money: 100, fame: 50 }, band: { harmony: 80 } },
    dispatch: mockDispatch
  })
}))

// Mock Translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

// We need to mock Framer Motion since we are testing in a JSDOM environment
// where complex layout animations might fail or take too long
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      // Omit framer-motion specific props to prevent React warnings
      const { initial, animate, exit, transition, ...safeProps } = props
      return <div {...safeProps}>{children}</div>
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

test('VoidTerminal is hidden initially and toggles on backtick', async () => {
  render(<VoidTerminal />)

  // Shouldn't be on screen
  expect(screen.queryByPlaceholderText('ENTER COMMAND...')).not.toBeInTheDocument()

  // Press backtick
  fireEvent.keyDown(window, { key: '`', code: 'Backquote' })

  expect(screen.getByPlaceholderText('ENTER COMMAND...')).toBeInTheDocument()

  // Press Escape to close
  fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })

  expect(screen.queryByPlaceholderText('ENTER COMMAND...')).not.toBeInTheDocument()
})

test('VoidTerminal executes help command and prints output', async () => {
  render(<VoidTerminal />)

  fireEvent.keyDown(window, { key: '\\', code: 'Backslash' })

  const input = screen.getByPlaceholderText('ENTER COMMAND...')
  fireEvent.change(input, { target: { value: 'help' } })
  fireEvent.submit(input.closest('form'))

  // Check if history was added
  await waitFor(() => {
    expect(screen.getByText('AVAILABLE COMMANDS:')).toBeInTheDocument()
    expect(screen.getByText(/give_money/i)).toBeInTheDocument()
  })
})

test('VoidTerminal executes state mutating commands', async () => {
  render(<VoidTerminal />)

  fireEvent.keyDown(window, { key: '`', code: 'Backquote' })
  const input = screen.getByPlaceholderText('ENTER COMMAND...')

  // Issue give_money
  fireEvent.change(input, { target: { value: 'give_money 5000' } })
  fireEvent.submit(input.closest('form'))

  // Verify it output the response
  await waitFor(() => {
    expect(screen.getByText('GRANTED 5000 EUROS.')).toBeInTheDocument()
  })
})
