import { render, fireEvent, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OverworldHUD } from '../../src/ui/overworld/OverworldHUD'

vi.mock('../../src/utils/locationI18n', () => ({
  translateLocation: (_t, location) => location
}))

const mockToggleMute = vi.fn()
vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    handleAudioChange: { toggleMute: mockToggleMute }
  })
}))

describe('OverworldHUD', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockToggleMute.mockClear()
  })

  it('renders the OverworldHUD correctly and shows career status', () => {
    const player = {
      money: 100,
      day: 3,
      location: 'Berlin',
      fame: 12,
      fameLevel: 2,
      van: { fuel: 80, condition: 80 },
      stats: { totalDistance: 456 }
    }
    const band = { harmony: 80, members: [] }

    const { getByText } = render(<OverworldHUD player={player} band={band} />)

    expect(getByText('BAND STATUS')).toBeInTheDocument()
    expect(getByText('FAME')).toBeInTheDocument()
    expect(getByText('12')).toBeInTheDocument()
    expect(getByText('LVL')).toBeInTheDocument()
    expect(getByText('2')).toBeInTheDocument()
    expect(getByText('KM')).toBeInTheDocument()
    expect(getByText('456')).toBeInTheDocument()
  })

  it('renders BandMemberRow with low-stat warning colors', () => {
    const player = {
      money: 100,
      day: 1,
      location: 'Berlin',
      van: { fuel: 80, condition: 80 }
    }
    const band = {
      harmony: 80,
      members: [{ id: 'm1', name: 'Member 1', mood: 40, stamina: 30 }]
    }

    const { getByText } = render(<OverworldHUD player={player} band={band} />)

    const memberName = getByText('Member 1')
    expect(memberName).toHaveClass('text-blood-red') // stamina takes precedence in warning
  })

  it('invokes mute handler when M key is pressed', () => {
    const player = {
      money: 100,
      day: 1,
      location: 'Berlin',
      van: { fuel: 80, condition: 80 }
    }
    const band = { harmony: 80, members: [] }

    render(<OverworldHUD player={player} band={band} />)

    act(() => {
      fireEvent.keyDown(window, { key: 'm', code: 'KeyM' })
    })

    expect(mockToggleMute).toHaveBeenCalledOnce()
  })

  it('shows the compact career summary without duplicate cash/fuel/van/harmony readouts when expeditionActive is true', () => {
    const player = {
      money: 500,
      day: 3,
      location: 'Berlin',
      fame: 12,
      fameLevel: 2,
      van: { fuel: 80, condition: 65 },
      stats: { totalDistance: 456 }
    }
    const band = {
      harmony: 80,
      members: [{ id: 'm1', name: 'Member 1', mood: 60, stamina: 70 }]
    }

    const { getByText, queryByText, queryByRole } = render(
      <OverworldHUD player={player} band={band} expeditionActive={true} />
    )

    // Career summary and band member rows stay visible
    expect(getByText(/Berlin/)).toBeInTheDocument()
    expect(getByText(/FAME/)).toBeInTheDocument()
    expect(getByText('Member 1')).toBeInTheDocument()

    // Duplicate resources owned by ExpeditionStatusStrip are not rendered in OverworldHUD
    expect(queryByRole('progressbar', { name: 'Fuel Level' })).toBeNull()
    expect(queryByRole('progressbar', { name: 'Van Condition' })).toBeNull()
    expect(queryByText('HARMONY')).toBeNull()
    expect(queryByRole('progressbar', { name: 'Band Harmony' })).toBeNull()
  })
})
