import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerStatusCard } from '../../src/ui/hud/shared/SharedHUDComponents'

const t = (key, options) => options?.defaultValue ?? key

const renderCard = props =>
  render(
    <PlayerStatusCard
      money={500}
      day={3}
      locationName='Stendal'
      fuel={50}
      condition={80}
      language='en'
      t={t}
      {...props}
    />
  )

describe('PlayerStatusCard', () => {
  it('renders money, day/location and the van mini bars', () => {
    renderCard()

    expect(screen.getByText(/500/)).toBeInTheDocument()
    expect(screen.getByText(/Day 3 — Stendal/)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Fuel Level' })).toBeTruthy()
    expect(
      screen.getByRole('progressbar', { name: 'Van Condition' })
    ).toBeTruthy()
  })

  it('switches money to the danger colour below the shared 40 threshold', () => {
    const { unmount } = renderCard({ money: 39 })
    expect(screen.getByText(/39/)).toHaveClass('text-blood-red')
    unmount()

    renderCard({ money: 40 })
    expect(screen.getByText(/40/)).not.toHaveClass('text-blood-red')
  })

  it('renders the accessory inside the money row and keeps variant chrome', () => {
    const { container } = renderCard({
      variant: 'hud',
      moneyRowAccessory: <span data-testid='accessory'>FAME</span>
    })

    expect(screen.getByTestId('accessory')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('backdrop-blur-sm')
  })

  it('uses the fuel-yellow token for the fuel bar', () => {
    const { container } = renderCard()
    expect(container.querySelector('.bg-fuel-yellow')).not.toBeNull()
    expect(container.querySelector('.bg-warning-yellow')).toBeNull()
  })
})
