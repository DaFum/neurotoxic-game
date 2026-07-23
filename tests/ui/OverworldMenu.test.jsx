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
})
