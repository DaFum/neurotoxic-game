import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { HecklerOverlay } from '../src/components/HecklerOverlay.jsx'

describe('HecklerOverlay', () => {
  let gameStateRef

  beforeEach(() => {
    gameStateRef = {
      current: {
        projectiles: []
      }
    }
  })

  test('renders without crashing', () => {
    const { container } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    expect(container).toBeTruthy()
  })

  test('renders empty when no projectiles', () => {
    const { container } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    const projectileElements = container.querySelectorAll('.absolute.text-4xl')
    expect(projectileElements.length).toBe(0)
  })

  test('renders projectiles from gameState', () => {
    gameStateRef.current.projectiles = [
      { id: '1', x: 100, y: 200, rotation: 0, type: 'bottle' },
      { id: '2', x: 150, y: 250, rotation: 1.5, type: 'tomato' }
    ]

    const { container } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    const projectileElements = container.querySelectorAll('.absolute.text-4xl')
    expect(projectileElements.length).toBe(2)
  })

  test('renders bottle emoji for bottle type', () => {
    gameStateRef.current.projectiles = [
      { id: '1', x: 100, y: 200, rotation: 0, type: 'bottle' }
    ]

    const { getByText } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    expect(getByText('🍾')).toBeInTheDocument()
  })

  test('renders tomato emoji for tomato type', () => {
    gameStateRef.current.projectiles = [
      { id: '1', x: 100, y: 200, rotation: 0, type: 'tomato' }
    ]

    const { getByText } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    expect(getByText('🍅')).toBeInTheDocument()
  })

  test('applies correct positioning styles', () => {
    gameStateRef.current.projectiles = [
      { id: '1', x: 100, y: 200, rotation: 0.5, type: 'bottle' }
    ]

    const { container } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    const projectile = container.querySelector('.absolute.text-4xl')
    expect(projectile.style.left).toBe('100px')
    expect(projectile.style.top).toBe('200px')
  })

  test('converts rotation from radians to degrees', () => {
    const rotation = Math.PI / 2 // 90 degrees in radians
    gameStateRef.current.projectiles = [
      { id: '1', x: 100, y: 200, rotation: rotation, type: 'bottle' }
    ]

    const { container } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    const projectile = container.querySelector('.absolute.text-4xl')
    const expectedDegrees = (rotation * 57.29).toFixed(0)
    expect(projectile.style.transform).toContain(expectedDegrees)
  })

  test('uses requestAnimationFrame for updates', () => {
    vi.spyOn(window, 'requestAnimationFrame')
    render(<HecklerOverlay gameStateRef={gameStateRef} />)
    expect(window.requestAnimationFrame).toHaveBeenCalled()
    window.requestAnimationFrame.mockRestore()
  })

  test('cancels animation frame on unmount', () => {
    vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    window.cancelAnimationFrame.mockRestore()
  })

  test('handles rapidly changing projectile list', () => {
    const { rerender } = render(<HecklerOverlay gameStateRef={gameStateRef} />)

    gameStateRef.current.projectiles = [
      { id: '1', x: 100, y: 200, rotation: 0, type: 'bottle' }
    ]
    rerender(<HecklerOverlay gameStateRef={gameStateRef} />)

    gameStateRef.current.projectiles = [
      { id: '2', x: 150, y: 250, rotation: 1, type: 'tomato' }
    ]
    rerender(<HecklerOverlay gameStateRef={gameStateRef} />)

    expect(() =>
      rerender(<HecklerOverlay gameStateRef={gameStateRef} />)
    ).not.toThrow()
  })

  test('has correct z-index and overflow settings', () => {
    const { container } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    const overlay = container.firstChild
    expect(overlay.className).toContain('z-20')
    expect(overlay.className).toContain('overflow-hidden')
    expect(overlay.className).toContain('pointer-events-none')
  })

  test('renders multiple projectiles with unique keys', () => {
    gameStateRef.current.projectiles = [
      { id: 'proj-1', x: 100, y: 200, rotation: 0, type: 'bottle' },
      { id: 'proj-2', x: 150, y: 250, rotation: 1, type: 'tomato' },
      { id: 'proj-3', x: 200, y: 300, rotation: 2, type: 'bottle' }
    ]

    const { container } = render(<HecklerOverlay gameStateRef={gameStateRef} />)
    const projectiles = container.querySelectorAll('.absolute.text-4xl')
    expect(projectiles.length).toBe(3)
  })
})
