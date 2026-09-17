import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { OverworldMenu } from '../../src/ui/overworld/OverworldMenu.tsx'

/**
 * @param {string} key
 * @param {{ defaultValue?: string }=} options
 * @returns {string}
 */
const t = (key, options) => options?.defaultValue ?? key

const defaultActions = () => ({
  openStash: vi.fn(),
  openQuests: vi.fn(),
  openPirateRadio: vi.fn(),
  openMerchPress: vi.fn(),
  openBloodBank: vi.fn(),
  openClinic: vi.fn(),
  openDarkWebLeak: vi.fn(),
  openCultIndoctrination: vi.fn(),
  openHQ: vi.fn(),
  openAssets: vi.fn(),
  handleRefuel: vi.fn(),
  handleRepair: vi.fn(),
  handleRestInVan: vi.fn(),
  handleSaveWithDelay: vi.fn()
})

/**
 * @param {{ actions: ReturnType<typeof defaultActions> }} props
 */
const Harness = ({ actions }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  return (
    <OverworldMenu
      t={t}
      isMenuOpen={isMenuOpen}
      setIsMenuOpen={setIsMenuOpen}
      isTraveling={false}
      vanFuel={50}
      vanCondition={50}
      isSaving={false}
      {...actions}
    />
  )
}

describe('OverworldMenu', () => {
  it('keeps Cult Indoctrination reachable from the hustles category', () => {
    const actions = defaultActions()
    render(<Harness actions={actions} />)

    fireEvent.click(screen.getByRole('button', { name: /HUSTLES/i }))
    fireEvent.click(
      screen.getByRole('button', { name: /CULT INDOCTRINATION/i })
    )

    expect(actions.openCultIndoctrination).toHaveBeenCalledTimes(1)
  })

  it('keeps the logistics menu open for the second rest-in-van click', () => {
    const actions = defaultActions()
    render(<Harness actions={actions} />)

    fireEvent.click(screen.getByRole('button', { name: /LOGISTICS/i }))
    const restButton = screen.getByRole('button', { name: /CRASH IN VAN/i })
    fireEvent.click(restButton)

    expect(actions.handleRestInVan).toHaveBeenCalledTimes(1)
    expect(restButton).toBeInTheDocument()
  })

  it('includes ARIA expanded attribute on main toggle button', () => {
    const actions = defaultActions()
    render(<Harness actions={actions} />)

    const mainToggle = screen.getByRole('button', { name: /CLOSE MENU/i })
    expect(mainToggle).toHaveAttribute('aria-expanded', 'true')
    expect(mainToggle).toHaveAttribute('aria-controls', 'overworld-menu-panel')
  })

  it('renders a tooltip explanation when refuel or repair is disabled', () => {
    const actions = defaultActions()
    const [isMenuOpen, setIsMenuOpen] = [true, vi.fn()]

    render(
      <OverworldMenu
        t={t}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTraveling={false}
        vanFuel={100}
        vanCondition={100}
        isSaving={false}
        {...actions}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /LOGISTICS/i }))
    const refuelBtn = screen.getByRole('button', { name: /REFUEL/i })
    expect(refuelBtn).toBeDisabled()

    fireEvent.mouseEnter(refuelBtn.parentElement)
    expect(screen.getByText(/Fuel tank is already full/i)).toBeInTheDocument()
  })
})
