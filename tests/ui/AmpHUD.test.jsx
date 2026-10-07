import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AmpHUD } from '../../src/components/minigames/amp/AmpHUD'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key
  })
}))

const baseProps = {
  timeLeft: 20,
  score: 50,
  heat: 40,
  isOverheat: false
}

describe('AmpHUD meters', () => {
  it('renders heat, void resonance and interference as clamped progressbars', () => {
    render(
      <AmpHUD
        {...baseProps}
        heat={140}
        voidResonance={-5}
        isAnomalyActive
        interference={250}
      />
    )

    const heat = screen.getByRole('progressbar', { name: 'HEAT' })
    const resonance = screen.getByRole('progressbar', {
      name: 'VOID RESONANCE'
    })
    const interference = screen.getByRole('progressbar', {
      name: 'INTERFERENCE'
    })

    expect(heat).toHaveAttribute('aria-valuenow', '100')
    expect(heat.querySelector('[style]').style.width).toBe('100%')
    expect(resonance).toHaveAttribute('aria-valuenow', '0')
    expect(resonance.querySelector('[style]').style.width).toBe('0%')
    expect(interference).toHaveAttribute('aria-valuenow', '100')
    expect(interference.querySelector('[style]').style.width).toBe('100%')
  })

  it('omits the optional meters when their effects are inactive', () => {
    render(<AmpHUD {...baseProps} />)

    expect(screen.getAllByRole('progressbar')).toHaveLength(1)
    expect(screen.getByRole('progressbar', { name: 'HEAT' })).toHaveAttribute(
      'aria-valuenow',
      '40'
    )
  })
})
