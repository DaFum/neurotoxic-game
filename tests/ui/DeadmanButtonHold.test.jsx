import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { DeadmanButton } from '../../src/ui/shared/BrutalistUI'

afterEach(() => {
  vi.useRealTimers()
})

test('DeadmanButton invokes onConfirm exactly once when a hold completes under StrictMode', () => {
  vi.useFakeTimers()
  const onConfirm = vi.fn()
  render(
    <StrictMode>
      <DeadmanButton label='PURGE SAVE' onConfirm={onConfirm} />
    </StrictMode>
  )
  const button = screen.getByRole('button')

  fireEvent.mouseDown(button)
  for (let i = 0; i < 51; i++) {
    act(() => {
      vi.advanceTimersByTime(20)
    })
  }
  act(() => {
    vi.advanceTimersByTime(500)
  })

  expect(onConfirm).toHaveBeenCalledTimes(1)
  expect(button).toHaveAttribute(
    'aria-label',
    expect.stringMatching(/executed/i)
  )
})

test('DeadmanButton releasing before completion does not confirm', () => {
  vi.useFakeTimers()
  const onConfirm = vi.fn()
  render(
    <StrictMode>
      <DeadmanButton label='PURGE SAVE' onConfirm={onConfirm} />
    </StrictMode>
  )
  const button = screen.getByRole('button')

  fireEvent.mouseDown(button)
  act(() => {
    vi.advanceTimersByTime(400)
  })
  fireEvent.mouseUp(button)
  act(() => {
    vi.advanceTimersByTime(2000)
  })

  expect(onConfirm).not.toHaveBeenCalled()
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
})

test('DeadmanButton confirms on the tick that fills it, even if released right after', () => {
  vi.useFakeTimers()
  const onConfirm = vi.fn()
  render(
    <StrictMode>
      <DeadmanButton label='PURGE SAVE' onConfirm={onConfirm} />
    </StrictMode>
  )
  const button = screen.getByRole('button')

  fireEvent.mouseDown(button)
  for (let i = 0; i < 50; i++) {
    act(() => {
      vi.advanceTimersByTime(20)
    })
  }
  fireEvent.mouseUp(button)
  act(() => {
    vi.advanceTimersByTime(2000)
  })

  expect(onConfirm).toHaveBeenCalledTimes(1)
})
