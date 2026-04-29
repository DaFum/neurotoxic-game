import { render, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OverworldHUD } from '../../src/ui/overworld/OverworldHUD'

vi.mock('../../src/hooks/useAudioControl', () => ({
  useAudioControl: () => ({
    audioState: { isPlaying: false },
    handleAudioChange: {
      stopMusic: vi.fn(),
      resumeMusic: vi.fn().mockResolvedValue()
    }
  })
}))

vi.mock('../../src/utils/locationI18n', () => ({
  translateLocation: (_t, location) => location
}))

describe('OverworldHUD', () => {
  let now
  let nextRafId
  let rafCallbacks

  beforeEach(() => {
    vi.useFakeTimers()
    now = 0
    nextRafId = 0
    rafCallbacks = new Map()
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', callback => {
      const id = ++nextRafId
      rafCallbacks.set(id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', id => {
      rafCallbacks.delete(id)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps the money animation class through animated number rerenders', () => {
    const player = {
      money: 100,
      day: 1,
      location: 'Berlin',
      van: { fuel: 80, condition: 80 }
    }
    const band = { harmony: 80, members: [] }
    const { container, rerender } = render(
      <OverworldHUD player={player} band={band} />
    )

    rerender(<OverworldHUD player={{ ...player, money: 200 }} band={band} />)

    const moneyValue = container.querySelector('.money-val')
    expect(moneyValue).toHaveClass('money-anim-up')

    act(() => {
      for (let i = 0; i < 5; i += 1) {
        const pendingCallbacks = [...rafCallbacks.values()]
        rafCallbacks.clear()
        now += 16
        pendingCallbacks.forEach(callback => callback(now))
      }
    })

    expect(moneyValue).toHaveClass('money-anim-up')

    act(() => {
      vi.advanceTimersByTime(450)
    })

    expect(moneyValue).not.toHaveClass('money-anim-up')
  })

  it('shows career status beside money and van status', () => {
    const player = {
      money: 100,
      day: 3,
      location: 'Berlin',
      fame: 12,
      fameLevel: 2,
      totalTravels: 7,
      passiveFollowers: 34,
      van: { fuel: 80, condition: 80 },
      stats: { totalDistance: 456 }
    }
    const band = { harmony: 80, members: [] }

    const { getByText } = render(<OverworldHUD player={player} band={band} />)

    expect(getByText('FAME')).toBeInTheDocument()
    expect(getByText('12')).toBeInTheDocument()
    expect(getByText('LVL')).toBeInTheDocument()
    expect(getByText('2')).toBeInTheDocument()
    expect(getByText('KM')).toBeInTheDocument()
    expect(getByText('456')).toBeInTheDocument()
  })
})
