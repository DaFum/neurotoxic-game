import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PirateRadioModal } from '../../src/ui/PirateRadioModal'

const { mockState } = vi.hoisted(() => ({
  mockState: {
    current: {
      player: { money: 500, fame: 100, zealotry: 10, controversy: 5 },
      band: { harmony: 80 }
    }
  }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameState: vi.fn().mockImplementation(() => mockState.current),
  useGameActions: vi.fn().mockImplementation(() => mockState.current),
  useGameSelector: vi
    .fn()
    .mockImplementation(selector => selector(mockState.current))
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

const config = {
  FAME_GAIN: 12,
  ZEALOTRY_GAIN: 8,
  CONTROVERSY_GAIN: 4,
  HARMONY_COST: 6
}

describe('PirateRadioModal', () => {
  it('is an accessible dialog that Escape closes', async () => {
    // Regression guard: this overlay used to be a hand-rolled `fixed inset-0`
    // div with no dialog role, no focus trap and no Escape handling. It must
    // keep going through `src/ui/shared/Modal.tsx`.
    const onClose = vi.fn()
    render(
      <PirateRadioModal
        onClose={onClose}
        onBroadcast={vi.fn()}
        canBroadcast={true}
        hasBroadcastedToday={false}
        config={config}
      />
    )

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
