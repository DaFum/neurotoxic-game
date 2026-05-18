import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MerchPressModal } from '../../src/ui/MerchPressModal'

const { mockState } = vi.hoisted(() => ({
  mockState: { current: {} }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameState: vi.fn().mockImplementation(() => mockState.current),
  useGameActions: vi.fn().mockImplementation(() => mockState.current),
  useGameSelector: vi
    .fn()
    .mockImplementation(selector => selector(mockState.current))
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('MerchPressModal', () => {
  beforeEach(() => {
    mockState.current = {}
  })

  const mockConfig = {
    cost: 150,
    loyaltyGain: 5,
    controversyGain: 10,
    fameGain: 100,
    failChance: 0.2,
    harmonyCostOnFail: 15
  }

  const defaultState = {
    player: { money: 1000 },
    band: { harmony: 100 },
    social: { loyalty: 10, controversyLevel: 0 }
  }

  it('renders correctly with sufficient funds', () => {
    mockState.current = defaultState
    const onClose = vi.fn()
    const onPress = vi.fn()

    render(
      <MerchPressModal
        onClose={onClose}
        onPress={onPress}
        canPress={true}
        config={mockConfig}
      />
    )

    expect(screen.getByText('ui:merch_press.title')).toBeInTheDocument()
    expect(screen.getByText('€150')).toBeInTheDocument()

    // Check buttons
    const confirmBtn = screen.getByRole('button', {
      name: '[ ui:merch_press.confirm ]'
    })
    expect(confirmBtn).not.toBeDisabled()

    fireEvent.click(confirmBtn)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders disabled when canPress is false', () => {
    mockState.current = {
      ...defaultState,
      player: { money: 50 }
    }

    const onClose = vi.fn()
    const onPress = vi.fn()

    render(
      <MerchPressModal
        onClose={onClose}
        onPress={onPress}
        canPress={false}
        config={mockConfig}
      />
    )

    const confirmBtn = screen.getByRole('button', {
      name: '[ ui:merch_press.confirm ]'
    })
    expect(confirmBtn).toBeDisabled()

    fireEvent.click(confirmBtn)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('stacks footer actions on mobile to avoid crushed button text', () => {
    mockState.current = defaultState

    render(
      <MerchPressModal
        onClose={() => {}}
        onPress={() => {}}
        canPress={true}
        config={mockConfig}
      />
    )

    const confirmBtn = screen.getByRole('button', {
      name: '[ ui:merch_press.confirm ]'
    })
    expect(confirmBtn.parentElement).toHaveClass('flex-col')
    expect(confirmBtn.parentElement).toHaveClass('sm:flex-row')
    expect(confirmBtn).toHaveClass('w-full')
  })
})
