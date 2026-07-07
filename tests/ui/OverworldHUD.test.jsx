import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OverworldHUD } from '../../src/ui/overworld/OverworldHUD'

vi.mock('../../src/utils/locationI18n', () => ({
  translateLocation: (_t, location) => location
}))

vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    handleAudioChange: { toggleMute: vi.fn() }
  })
}))

describe('OverworldHUD', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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
})
