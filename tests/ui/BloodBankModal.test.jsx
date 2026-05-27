import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BloodBankModal } from '../../src/ui/BloodBankModal'

vi.mock('../../src/utils/imageGen', () => ({
  resolveGenImageUrl: () => 'mock-url',
  IMG_PROMPTS: { BLOOD_BANK_BG: 'blood-bank-bg' }
}))

describe('BloodBankModal', () => {
  const baseProps = {
    onClose: vi.fn(),
    onDonate: vi.fn(),
    canDonate: true,
    canDonateMarrow: true,
    config: {
      moneyGain: 50,
      harmonyCost: 5,
      staminaCost: 10,
      controversyGain: 2
    },
    marrowConfig: {
      moneyGain: 150,
      harmonyCost: 15,
      staminaCost: 25,
      controversyGain: 8
    }
  }

  it('uses a mobile-safe scrollable dialog shell', () => {
    const { container } = render(<BloodBankModal {...baseProps} />)

    const dialog = screen.getByRole('dialog')
    const sheet = container.querySelector('[data-testid="blood-bank-sheet"]')
    const content = container.querySelector(
      '[data-testid="blood-bank-content"]'
    )
    const closeButton = screen.getByRole('button', { name: /leave/i })

    expect(dialog).toHaveClass('p-2')
    expect(sheet).toHaveClass('max-h-[calc(100svh-1rem)]')
    expect(content).toHaveClass('overflow-y-auto')
    expect(closeButton).toHaveClass('w-full')
    expect(closeButton).toHaveClass('sm:w-auto')
  })
})
