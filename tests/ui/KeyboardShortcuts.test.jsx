import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  KeyboardShortcutsPanel,
  ShortcutsToggle
} from '../../src/ui/shared/KeyboardShortcuts'
import { OverworldHUD } from '../../src/ui/overworld/OverworldHUD'

// Mock dependencies for OverworldHUD
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key,
    i18n: { language: 'en' }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { isMuted: false },
    handleAudioChange: { toggleMute: vi.fn() }
  })
}))

describe('KeyboardShortcutsPanel & HUD shortcuts toggle', () => {
  it('renders disabled fallback button when onClose is not provided', () => {
    render(<KeyboardShortcutsPanel showHelp={true} />)

    const closeBtn = screen.getByRole('button', {
      name: /close keyboard shortcuts/i
    })
    expect(closeBtn).toBeInTheDocument()
    expect(closeBtn).toBeDisabled()
  })

  it('renders interactive close button when onClose is provided and handles click', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsPanel showHelp={true} onClose={onClose} />)

    const closeBtn = screen.getByRole('button', {
      name: /close keyboard shortcuts/i
    })
    expect(closeBtn).toBeInTheDocument()
    expect(closeBtn).not.toBeDisabled()

    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('binds aria-pressed on the shortcuts help toggle in OverworldHUD', () => {
    render(<OverworldHUD player={{ money: 100, fame: 50 }} />)

    const helpBtn = screen.getByRole('button', {
      name: /toggle keyboard shortcuts help/i
    })
    expect(helpBtn).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(helpBtn)
    expect(helpBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('ShortcutsToggle wires the panel ARIA and swaps state classes', () => {
    const onToggle = vi.fn()
    const props = {
      onToggle,
      className: 'base',
      activeClassName: 'is-active',
      inactiveClassName: 'is-idle',
      iconSize: 20
    }
    const { rerender } = render(<ShortcutsToggle {...props} showHelp={false} />)

    const toggle = screen.getByRole('button', {
      name: /toggle keyboard shortcuts help/i
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).not.toHaveAttribute('aria-controls')
    expect(toggle).toHaveClass('base', 'is-idle')

    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)

    rerender(<ShortcutsToggle {...props} showHelp={true} />)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveAttribute('aria-controls', 'shortcuts-panel')
    expect(toggle).toHaveClass('base', 'is-active')
    expect(toggle).not.toHaveClass('is-idle')
  })
})
