import { afterEach, describe, expect, test } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Header } from '../../src/scenes/kabelsalat/components/Header.tsx'

afterEach(cleanup)

describe('Kabelsalat Header', () => {
  test('is a phone chatter obstacle that holds the title and the countdown', () => {
    const { container } = render(
      <Header
        t={(key, options) => (options ? `${key}:${options.count}` : key)}
        isShocked={false}
        isPoweredOn={false}
        isGameOver={false}
        timeLeft={42}
      />
    )

    const header = container.querySelector('[data-chatter-avoid-compact]')
    expect(header).not.toBeNull()
    expect(header?.querySelector('h2')).not.toBeNull()
    expect(header?.textContent).toContain('ui:seconds:42')
  })
})
