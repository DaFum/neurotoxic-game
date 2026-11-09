import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { RoadieControls } from '../../src/components/minigames/roadie/RoadieControls.tsx'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key
  })
}))

const setup = (props = {}) => {
  const handlers = {
    setShowControls: vi.fn(),
    onMove: vi.fn()
  }

  render(<RoadieControls showControls={false} {...handlers} {...props} />)

  const surface = screen.getByTestId('roadie-touch-surface')
  surface.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 300,
    bottom: 300,
    width: 300,
    height: 300,
    toJSON: () => ({})
  })

  return { handlers, surface }
}

describe('RoadieControls touch input', () => {
  test('exposes the touch surface as an aria-labelled region', () => {
    const { surface } = setup()

    expect(surface.tagName).toBe('SECTION')
    expect(surface).toHaveAccessibleName('ui:roadieRun.controls.touchAria')
  })

  test('moves by swipe direction on the touch surface', () => {
    const { handlers, surface } = setup()

    // Swipe right
    fireEvent.pointerDown(surface, {
      clientX: 80,
      clientY: 120,
      pointerId: 1,
      pointerType: 'touch'
    })
    fireEvent.pointerUp(surface, {
      clientX: 150,
      clientY: 126,
      pointerId: 1,
      pointerType: 'touch'
    })
    expect(handlers.onMove).toHaveBeenCalledWith(1, 0)

    // Swipe left
    fireEvent.pointerDown(surface, {
      clientX: 150,
      clientY: 120,
      pointerId: 1,
      pointerType: 'touch'
    })
    fireEvent.pointerUp(surface, {
      clientX: 80,
      clientY: 126,
      pointerId: 1,
      pointerType: 'touch'
    })
    expect(handlers.onMove).toHaveBeenCalledWith(-1, 0)

    // Swipe up
    fireEvent.pointerDown(surface, {
      clientX: 120,
      clientY: 150,
      pointerId: 1,
      pointerType: 'touch'
    })
    fireEvent.pointerUp(surface, {
      clientX: 126,
      clientY: 80,
      pointerId: 1,
      pointerType: 'touch'
    })
    expect(handlers.onMove).toHaveBeenCalledWith(0, -1)

    // Swipe down
    fireEvent.pointerDown(surface, {
      clientX: 120,
      clientY: 80,
      pointerId: 1,
      pointerType: 'touch'
    })
    fireEvent.pointerUp(surface, {
      clientX: 126,
      clientY: 150,
      pointerId: 1,
      pointerType: 'touch'
    })
    expect(handlers.onMove).toHaveBeenCalledWith(0, 1)
  })

  test('keeps movement working when pointer capture is unavailable', () => {
    const { handlers, surface } = setup()
    surface.setPointerCapture = vi.fn(() => {
      throw new Error('No active pointer')
    })

    expect(() =>
      fireEvent.pointerDown(surface, {
        clientX: 80,
        clientY: 120,
        pointerId: 1,
        pointerType: 'touch'
      })
    ).not.toThrow()

    fireEvent.pointerUp(surface, {
      clientX: 80,
      clientY: 180,
      pointerId: 1,
      pointerType: 'touch'
    })

    expect(handlers.onMove).toHaveBeenCalledWith(0, 1)
  })

  test('moves by tap quadrant when there is no swipe', () => {
    const { handlers, surface } = setup()

    fireEvent.pointerDown(surface, {
      clientX: 150,
      clientY: 60,
      pointerId: 1,
      pointerType: 'touch'
    })
    fireEvent.pointerUp(surface, {
      clientX: 152,
      clientY: 62,
      pointerId: 1,
      pointerType: 'touch'
    })

    expect(handlers.onMove).toHaveBeenCalledWith(0, -1)
  })

  test('triggers movement when D-pad buttons are clicked', () => {
    const { handlers } = setup({ showControls: true })

    fireEvent.click(screen.getByRole('button', { name: 'ui:moveUp' }))
    expect(handlers.onMove).toHaveBeenCalledWith(0, -1)

    fireEvent.click(screen.getByRole('button', { name: 'ui:moveLeft' }))
    expect(handlers.onMove).toHaveBeenCalledWith(-1, 0)

    fireEvent.click(screen.getByRole('button', { name: 'ui:moveDown' }))
    expect(handlers.onMove).toHaveBeenCalledWith(0, 1)

    fireEvent.click(screen.getByRole('button', { name: 'ui:moveRight' }))
    expect(handlers.onMove).toHaveBeenCalledWith(1, 0)
  })

  test('keeps the controller pad hidden on mobile and optional on desktop', () => {
    const { rerender } = render(
      <RoadieControls
        showControls={false}
        setShowControls={() => {}}
        onMove={() => {}}
      />
    )

    const dpad = screen.getByRole('button', { name: 'ui:moveUp' }).parentElement
    expect(dpad).toHaveClass('hidden')
    expect(dpad).not.toHaveClass('md:hidden')

    rerender(
      <RoadieControls
        showControls={true}
        setShowControls={() => {}}
        onMove={() => {}}
      />
    )

    expect(
      screen.getByRole('button', { name: 'ui:moveUp' }).parentElement
    ).toHaveClass('md:grid')
  })
})

describe('RoadieControls layout', () => {
  test('keeps the controls toggle below the frame SKIP button (top-4)', () => {
    setup()

    const toggle = screen.getByRole('button', {
      name: 'ui:roadieRun.controls.toggleAria'
    })
    expect(toggle).toHaveClass('top-16', 'right-4')
    expect(toggle).not.toHaveClass('top-4')
  })
})
