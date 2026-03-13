import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClinicScene } from '../src/scenes/ClinicScene.jsx'
import { useClinicLogic } from '../src/hooks/useClinicLogic.js'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/i18n.js'

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useTranslation: () => ({ t: (key, options) => options?.defaultValue || key })
  }
})

vi.mock('../src/hooks/useClinicLogic.js', () => ({
  useClinicLogic: vi.fn()
}))

const mockState = {
  player: { money: 1000, fame: 500, clinicVisits: 0 },
  band: {
    members: [
      { id: 'm1', name: 'M1', stamina: 50, mood: 50, traits: [] },
      { id: 'm2', name: 'M2', stamina: 100, mood: 100, traits: ['cyber_lungs'] }
    ]
  },
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

  const renderComponent = () =>
    render(
      <I18nextProvider i18n={i18n}>
        <ClinicScene />
      </I18nextProvider>
    )

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

    const enhanceButtons = screen.getAllByRole('button', { name: /GRAFT: CYBER LUNGS/i })
    fireEvent.click(enhanceButtons[0]) // M1

    expect(mockState.enhanceMember).toHaveBeenCalledWith('m1', 'cyber_lungs')
  })

  it('disables buttons correctly based on state', () => {
    // M2 has 100 stamina, so their heal button should be disabled
    // M2 has 'cyber_lungs', so their enhance button should be disabled
    renderComponent()

    const healButtons = screen.getAllByRole('button', { name: /HEAL/i })
    const enhanceButtons = screen.getAllByRole('button', { name: /GRAFT: CYBER LUNGS/i })

    // First member is active
    expect(healButtons[0]).not.toBeDisabled()
    expect(enhanceButtons[0]).not.toBeDisabled()

    // Second member is maxed/already has trait
    expect(healButtons[1]).toBeDisabled()
    expect(enhanceButtons[1]).toBeDisabled()
  })

  it('calls leaveClinic when leave button is clicked', () => {
    renderComponent()

    const leaveButton = screen.getByText(/LEAVE CLINIC/i)
    fireEvent.click(leaveButton)

    expect(mockState.leaveClinic).toHaveBeenCalled()
  })
})
