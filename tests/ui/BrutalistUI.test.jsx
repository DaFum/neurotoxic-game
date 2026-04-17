import { render, screen, fireEvent, act } from '@testing-library/react'
import { expect, test, vi, beforeEach, afterEach } from 'vitest'
import {
  BrutalToggle,
  BlockMeter,
  StatBlock,
  DeadmanButton,
  CorruptedText,
  HazardTicker,
  IndustrialChecklist,
  SelloutContract,
  VoidLoader
} from '../../src/ui/shared/BrutalistUI.tsx'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllTimers()
})

test('BrutalToggle renders and toggles state', () => {
  render(<BrutalToggle label='Test Toggle' initialState={false} />)
  const btn = screen.getByRole('button')
  expect(btn).toBeInTheDocument()
  expect(btn).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('Test Toggle')).toBeInTheDocument()

  fireEvent.click(btn)
  expect(btn).toHaveAttribute('aria-pressed', 'true')
})

test('BlockMeter renders correct number of blocks', () => {
  render(<BlockMeter label='Test Meter' value={3} max={5} />)
  const meter = screen.getByRole('meter', { name: 'Test Meter' })
  // The blocks container is the second child of the meter container
  const blocksContainer = meter.querySelector('.flex.gap-1')
  expect(blocksContainer.children.length).toBe(5)
})

test('StatBlock renders label, value and icon', () => {
  const DummyIcon = () => <svg data-testid='dummy-icon' />
  render(<StatBlock label='Test Stat' value='100' icon={DummyIcon} />)
  expect(screen.getByText('Test Stat')).toBeInTheDocument()
  expect(screen.getByText('100')).toBeInTheDocument()
  expect(screen.getByTestId('dummy-icon')).toBeInTheDocument()
})

test('DeadmanButton handles hold sequence to fire', () => {
  const onConfirm = vi.fn()
  render(<DeadmanButton label='Fire' onConfirm={onConfirm} />)

  const btn = screen.getByRole('button')

  // Start holding
  act(() => {
    fireEvent.mouseDown(btn)
    fireEvent.touchStart(btn)
  })

  act(() => {
    // Fill speed is 2 every 20ms, so it takes 50 ticks to reach 100. 50 * 20 = 1000ms
    vi.advanceTimersByTime(1100)
  })

  expect(onConfirm).toHaveBeenCalled()
})

test('DeadmanButton stops fill and drains when hold is stopped early', () => {
  const onConfirm = vi.fn()
  render(<DeadmanButton label='Fire' onConfirm={onConfirm} />)

  const btn = screen.getByRole('button')

  // Start holding
  act(() => {
    fireEvent.mouseDown(btn)
    fireEvent.touchStart(btn)
  })

  // Advance a little bit (progress > 0, but < 100)
  act(() => {
    vi.advanceTimersByTime(200)
  })

  expect(onConfirm).not.toHaveBeenCalled()

  // Stop hold early
  act(() => {
    fireEvent.mouseUp(btn)
    fireEvent.mouseLeave(btn)
  })

  // Advance timers to let it drain
  act(() => {
    vi.advanceTimersByTime(500)
  })

  expect(onConfirm).not.toHaveBeenCalled()
})

test('VoidLoader renders', () => {
  render(<VoidLoader />)
  expect(document.querySelector('svg')).toBeInTheDocument()
})

test('CorruptedText renders text', () => {
  render(<CorruptedText text='Secret' />)
  expect(document.querySelector('.font-mono')).toBeInTheDocument()
})

test('HazardTicker renders message content', () => {
  render(<HazardTicker message='Warning' />)
  const spans = document.querySelectorAll('span')
  expect(spans.length).toBeGreaterThan(0)
})

test('IndustrialChecklist toggles items', () => {
  render(<IndustrialChecklist />)
  const buttons = screen.getAllByRole('button')
  expect(buttons.length).toBeGreaterThan(0)
})

test('SelloutContract handles sign action', () => {
  render(<SelloutContract />)
  const signBtn = screen.getByRole('button')
  fireEvent.click(signBtn)

  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.getByText('Neurotoxic')).toBeInTheDocument()
})
