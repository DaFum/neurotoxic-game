import { afterEach, describe, expect, test } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Header } from '../../src/components/minigames/kabelsalat/Header.tsx'
import { HeaderTimer } from '../../src/components/minigames/kabelsalat/HeaderTimer.tsx'

const t = (key, options) => (options ? `${key}:${options.count}` : key)
const CRITICAL = ['border-error-red', 'text-error-red', 'animate-pulse']

afterEach(cleanup)

describe('Kabelsalat Header', () => {
  test('is a chatter obstacle on every screen and holds the title and the countdown', () => {
    const { container } = render(
      <Header
        t={(key, options) => (options ? `${key}:${options.count}` : key)}
        isShocked={false}
        isPoweredOn={false}
        isGameOver={false}
        timeLeft={42}
      />
    )

    const header = container.querySelector('[data-chatter-avoid]')
    expect(header).not.toBeNull()
    expect(header?.querySelector('h2')).not.toBeNull()
    expect(header?.textContent).toContain('ui:seconds:42')
  })

  test('switches the countdown to critical styling at 10 seconds, not 11', () => {
    const { container, rerender } = render(
      <HeaderTimer t={t} isPoweredOn={false} timeLeft={11} />
    )
    const timer = container.firstElementChild
    expect(timer?.classList).toContain('border-warning-yellow')
    expect(timer?.classList).toContain('text-warning-yellow')
    for (const cls of CRITICAL) expect(timer?.classList).not.toContain(cls)

    rerender(<HeaderTimer t={t} isPoweredOn={false} timeLeft={10} />)
    for (const cls of CRITICAL) expect(timer?.classList).toContain(cls)
    expect(timer?.classList).not.toContain('border-warning-yellow')
  })

  test('powered state takes precedence over critical styling at every time', () => {
    const { container, rerender } = render(
      <HeaderTimer t={t} isPoweredOn timeLeft={11} />
    )
    const timer = container.firstElementChild
    for (const timeLeft of [11, 10, 9, 0]) {
      rerender(<HeaderTimer t={t} isPoweredOn timeLeft={timeLeft} />)
      expect(timer?.classList).toContain('border-success-green')
      expect(timer?.classList).toContain('text-success-green')
      for (const cls of CRITICAL) expect(timer?.classList).not.toContain(cls)
    }
  })
})
