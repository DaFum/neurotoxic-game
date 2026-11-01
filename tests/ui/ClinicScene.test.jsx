import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClinicScene } from '../../src/scenes/ClinicScene.tsx'
import { useClinicLogic } from '../../src/hooks/useClinicLogic'
import { formatCurrency } from '../../src/utils/numberUtils'

vi.mock('../../src/context/gameConstants', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    CLINIC_CONFIG: {
      CYBER_LUNGS_TRAIT_ID: 'cyber_lungs',
      HEAL_MOOD_GAIN: 10
    }
  }
})

vi.mock('react-i18next', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, options) => options?.defaultValue || key,
      i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
    })
  }
})

vi.mock('../../src/hooks/useClinicLogic', () => ({
  useClinicLogic: vi.fn()
}))

const mockState = {
  player: { money: 1000, fame: 500, clinicVisits: 0 },
  band: {
    harmony: 40,
    members: [
      { id: 'm1', name: 'M1', stamina: 50, mood: 50, traits: {} },
      {
        id: 'm2',
        name: 'M2',
        stamina: 100,
        mood: 100,
        traits: { cyber_lungs: { id: 'cyber_lungs' } }
      }
    ]
  },
  spendableMoney: 1000,
  healCostMoney: 150,
  enhanceCostFame: 500,
  healMember: vi.fn(),
  enhanceMember: vi.fn(),
  leaveClinic: vi.fn()
}

describe('ClinicScene', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useClinicLogic.mockReturnValue(mockState)
  })

  const renderComponent = () => render(<ClinicScene />)

  it('renders clinic title and member data', () => {
    renderComponent()

    expect(screen.getByText(/THE VOID CLINIC/i)).toBeInTheDocument()
    expect(screen.getByText(/FUNDS:/i)).toBeInTheDocument()
    expect(screen.getByText(/FAME:/i)).toBeInTheDocument()
    expect(screen.getByText('M1')).toBeInTheDocument()
    expect(screen.getByText('M2')).toBeInTheDocument()
  })

  it('calls healMember on valid member', () => {
    renderComponent()

    // Find the first heal button.
    // getByText on a button with multiple spans might return the span or button. Use role:
    const healButtons = screen.getAllByRole('button', { name: /HEAL/i })
    fireEvent.click(healButtons[0]) // M1 (50 stamina)

    expect(mockState.healMember).toHaveBeenCalledWith('m1')
  })

  it('calls enhanceMember on valid member', () => {
    renderComponent()

    const enhanceButtons = screen.getAllByRole('button', {
      name: /GRAFT: CYBER LUNGS/i
    })
    fireEvent.click(enhanceButtons[0]) // M1

    expect(mockState.enhanceMember).toHaveBeenCalledWith('m1', 'cyber_lungs')
  })

  it('disables buttons correctly based on state', () => {
    // M2 has 100 stamina AND 100 mood, so their heal button should be disabled
    // M2 has 'cyber_lungs', so their enhance button should be disabled
    useClinicLogic.mockReturnValue({
      player: { money: 100, fame: 100 }, // Ensure player has enough resources to not trigger disable due to funds
      spendableMoney: 100,
      band: {
        members: [
          { id: 'm1', name: 'M1', stamina: 50, mood: 50, traits: {} },
          {
            id: 'm2',
            name: 'M2',
            stamina: 100,
            mood: 100,
            traits: { cyber_lungs: true }
          }
        ]
      },
      healCostMoney: 50,
      enhanceCostFame: 50,
      healMember: vi.fn(),
      enhanceMember: vi.fn(),
      leaveClinic: vi.fn()
    })

    renderComponent()

    const healButtons = screen.getAllByRole('button', { name: /HEAL/i })
    const enhanceButtons = screen.getAllByRole('button', {
      name: /GRAFT: CYBER LUNGS/i
    })

    // First member is active
    expect(healButtons[0]).not.toBeDisabled()
    expect(enhanceButtons[0]).not.toBeDisabled()

    // Second member is maxed/already has trait
    expect(healButtons[1]).toBeDisabled()
    expect(enhanceButtons[1]).toBeDisabled()
  })

  it('keeps Heal available below an upgraded stamina maximum (#3391)', () => {
    /** @param {number} stamina */
    const member = stamina => ({
      id: 'm9',
      name: 'M9',
      stamina,
      staminaMax: 110,
      mood: 100,
      traits: {}
    })
    /** @param {number} stamina */
    const render = stamina => {
      useClinicLogic.mockReturnValue({
        player: { money: 100, fame: 100 },
        spendableMoney: 100,
        band: { members: [member(stamina)] },
        healCostMoney: 50,
        enhanceCostFame: 50,
        healMember: vi.fn(),
        enhanceMember: vi.fn(),
        leaveClinic: vi.fn()
      })
      return renderComponent()
    }
    const first = render(100)
    expect(screen.getByRole('button', { name: /HEAL/i })).not.toBeDisabled()
    first.unmount()
    render(110)
    expect(screen.getByRole('button', { name: /HEAL/i })).toBeDisabled()
  })

  it('gates Heal and Neuro-Overclock on spendable, not raw, money (#3464)', () => {
    // Active Expedition: 1000 on hand, 900 protected, so 100 is spendable.
    useClinicLogic.mockReturnValue({
      ...mockState,
      player: { money: 1000, fame: 500, clinicVisits: 0 },
      spendableMoney: 100,
      healCostMoney: 300
    })

    renderComponent()

    const healButtons = screen.getAllByRole('button', { name: /HEAL/i })
    expect(healButtons[0]).toBeDisabled()
    const graftButtons = screen.getAllByRole('button', {
      name: /NEURO-OVERCLOCK/i
    })
    expect(graftButtons[0]).toBeDisabled()
  })

  it('header FUNDS shows spendable, not raw, money (#3464)', () => {
    useClinicLogic.mockReturnValue({
      ...mockState,
      player: { money: 1000, fame: 500, clinicVisits: 0 },
      spendableMoney: 100
    })

    renderComponent()

    const funds = screen.getByText(/FUNDS:/i)
    expect(funds).toHaveTextContent(formatCurrency(100, 'en'))
    expect(funds).not.toHaveTextContent(formatCurrency(1000, 'en'))
  })

  it('calls leaveClinic when leave button is clicked', () => {
    renderComponent()

    const leaveButton = screen.getByText(/LEAVE CLINIC/i)
    fireEvent.click(leaveButton)

    expect(mockState.leaveClinic).toHaveBeenCalled()
  })
})
