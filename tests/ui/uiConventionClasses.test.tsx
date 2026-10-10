import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TFunction } from 'i18next'
import { AutoplayOverlay } from '../../src/scenes/intro/components/AutoplayOverlay'
import { SocketItem } from '../../src/scenes/kabelsalat/components/SocketItem'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('UI convention classes', () => {
  it('backs the intro autoplay overlay with a defined color token', () => {
    render(<AutoplayOverlay onPlay={vi.fn()} />)
    const overlay = screen.getByRole('button').closest('div.absolute')
    expect(overlay?.className).toContain('bg-void-black/80')
    // `bg-overlay` has no `--color-overlay` token, so it rendered no backdrop.
    expect(overlay?.className.split(/\s+/)).not.toContain('bg-overlay')
  })

  it('uses a Tailwind v4 arbitrary property for the socket hover fill', () => {
    const { container } = render(
      <svg>
        <SocketItem
          t={((key: string) => key) as unknown as TFunction}
          socketId='mic'
          index={0}
          connections={{}}
          isPowerConnected={false}
          selectedCable='xlr'
          isGameOver={false}
          handleSocketClick={vi.fn()}
        />
      </svg>
    )
    const ring = container.querySelector('circle[stroke-dasharray]')
    const classes = ring?.getAttribute('class') ?? ''
    expect(classes).toContain('group-hover:[fill-opacity:0.2]')
    expect(classes).not.toContain('group-hover:fill-opacity-20')
  })
})
