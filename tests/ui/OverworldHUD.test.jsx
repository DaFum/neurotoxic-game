import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OverworldHUD } from '../../src/ui/overworld/OverworldHUD'

const mockGameState = vi.hoisted(() => ({
  player: {
    money: 100,
    day: 1,
    location: 'venues:stendal_proberaum.name',
    van: { fuel: 100, condition: 100 }
  },
  band: {
    harmony: 80,
    members: []
  }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameSelector: selector => selector(mockGameState)
}))

vi.mock('../../src/context/useMapGeneration', () => ({
  useMapGeneration: () => ({ isGenerating: false })
}))

vi.mock('../../src/utils/locationI18n', () => ({
  translateLocation: (_t, location) => location
}))

describe('OverworldHUD', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the OverworldHUD correctly', () => {
    const { getByText } = render(<OverworldHUD />)
    expect(getByText('BAND STATUS')).toBeInTheDocument()
  })
})
