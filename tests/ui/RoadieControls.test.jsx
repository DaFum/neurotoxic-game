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
    handleMoveUp: vi.fn(),
    handleMoveLeft: vi.fn(),
    handleMoveDown: vi.fn(),
    handleMoveRight: vi.fn()
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

    expect(surface).toHaveAttribute('role', 'region')
    expect(surface).toHaveAccessibleName('ui:roadieRun.controls.touchAria')
  })

  test('moves by swipe direction on the touch surface', () => {
    const { handlers, surface } = setup()

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

    expect(handlers.handleMoveRight).toHaveBeenCalledTimes(1)
    expect(handlers.handleMoveLeft).not.toHaveBeenCalled()
    expect(handlers.handleMoveUp).not.toHaveBeenCalled()
    expect(handlers.handleMoveDown).not.toHaveBeenCalled()
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

    expect(handlers.handleMoveDown).toHaveBeenCalledTimes(1)
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

    expect(handlers.handleMoveUp).toHaveBeenCalledTimes(1)
    expect(handlers.handleMoveDown).not.toHaveBeenCalled()
  })

  test('keeps the controller pad hidden on mobile and optional on desktop', () => {
    const { rerender } = render(
      <RoadieControls
        showControls={false}
        setShowControls={() => {}}
        handleMoveUp={() => {}}
        handleMoveLeft={() => {}}
        handleMoveDown={() => {}}
        handleMoveRight={() => {}}
      />
    )

    const dpad = screen.getByRole('button', { name: 'Move Up' }).parentElement
    expect(dpad).toHaveClass('hidden')
    expect(dpad.className).not.toContain('md:hidden')

    rerender(
      <RoadieControls
        showControls={true}
        setShowControls={() => {}}
        handleMoveUp={() => {}}
        handleMoveLeft={() => {}}
        handleMoveDown={() => {}}
        handleMoveRight={() => {}}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Move Up' }).parentElement
    ).toHaveClass('md:grid')
  })
})
