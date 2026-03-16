// TODO: Implement this
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MapConnection } from '../src/components/MapConnection.jsx'

test('MapConnection returns null if startVis or endVis is hidden', () => {
  const { container, rerender } = render(
    <svg>
      <title>MapConnection hidden</title>
      <MapConnection
        start={{ x: 10, y: 10 }}
        end={{ x: 20, y: 20 }}
        startVis='hidden'
        endVis='visible'
      />
    </svg>
  )
  expect(container.querySelector('line')).not.toBeInTheDocument()

  rerender(
    <svg>
      <title>MapConnection hidden</title>
      <MapConnection
        start={{ x: 10, y: 10 }}
        end={{ x: 20, y: 20 }}
        startVis='visible'
        endVis='hidden'
      />
    </svg>
  )
  expect(container.querySelector('line')).not.toBeInTheDocument()
})

test('MapConnection renders line correctly', () => {
  const { container } = render(
    <svg>
      <title>MapConnection visible</title>
      <MapConnection
        start={{ x: 10, y: 10 }}
        end={{ x: 20, y: 20 }}
        startVis='visible'
        endVis='visible'
      />
    </svg>
  )
  const line = container.querySelector('line')
  expect(line).toBeInTheDocument()
  expect(line).toHaveAttribute('x1', '10%')
  expect(line).toHaveAttribute('y1', '10%')
  expect(line).toHaveAttribute('x2', '20%')
  expect(line).toHaveAttribute('y2', '20%')
  expect(line).toHaveAttribute('opacity', '0.5')
})

test('MapConnection renders dimmed line', () => {
  const { container } = render(
    <svg>
      <title>MapConnection dimmed</title>
      <MapConnection
        start={{ x: 10, y: 10 }}
        end={{ x: 20, y: 20 }}
        startVis='dimmed'
        endVis='visible'
      />
    </svg>
  )
  const line = container.querySelector('line')
  expect(line).toBeInTheDocument()
  expect(line).toHaveAttribute('opacity', '0.2')
})
