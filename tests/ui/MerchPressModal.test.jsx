import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MerchPressModal } from '../../src/ui/MerchPressModal'
import { useGameState } from '../../src/context/GameState'

vi.mock('../../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}))

describe('MerchPressModal', () => {
  const mockConfig = {
    cost: 150,
    loyaltyGain: 5,
    controversyGain: 10,
    failChance: 0.2,
    harmonyCostOnFail: 15
  }

  const defaultState = {
    player: { money: 1000 },
    band: { harmony: 100 },
    social: { loyalty: 10, controversyLevel: 0 }
  }

  it('renders correctly with sufficient funds', () => {
    useGameState.mockReturnValue(defaultState)
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
    const confirmBtn = screen.getByRole('button', { name: '[ ui:merch_press.confirm ]' })
    expect(confirmBtn).not.toBeDisabled()

    fireEvent.click(confirmBtn)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders disabled when canPress is false', () => {
    useGameState.mockReturnValue({
      ...defaultState,
      player: { money: 50 }
    })

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

    const confirmBtn = screen.getByRole('button', { name: '[ ui:merch_press.confirm ]' })
    expect(confirmBtn).toBeDisabled()

    fireEvent.click(confirmBtn)
    expect(onPress).not.toHaveBeenCalled()
  })
})
