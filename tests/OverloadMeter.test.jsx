// TODO: Implement this
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { OverloadMeter } from '../src/components/hud/OverloadMeter.jsx'

vi.mock('../src/ui/shared/index.jsx', () => ({
  BlockMeter: ({ label, value, max, isDanger }) => (
    <div
      data-testid='block-meter'
      data-value={value}
      data-max={max}
      data-danger={isDanger}
    >
      {label}
    </div>
  )
}))

test('OverloadMeter renders correct value and danger state', () => {
  const { rerender } = render(<OverloadMeter overload={50} />)

  expect(screen.getByText('ui:overload.toxic')).toBeInTheDocument()
  let meter = screen.getByTestId('block-meter')
  expect(meter).toHaveAttribute('data-value', '5')
  expect(meter).toHaveAttribute('data-max', '10')
  expect(meter).toHaveAttribute('data-danger', 'false')

  rerender(<OverloadMeter overload={80} />)
  meter = screen.getByTestId('block-meter')
  expect(meter).toHaveAttribute('data-value', '8')
  expect(meter).toHaveAttribute('data-danger', 'false')

  rerender(<OverloadMeter overload={85} />)
  meter = screen.getByTestId('block-meter')
  expect(meter).toHaveAttribute('data-value', '9')
  expect(meter).toHaveAttribute('data-danger', 'true')
})
