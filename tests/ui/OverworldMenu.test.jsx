import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { OverworldMenu } from '../../src/ui/overworld/OverworldMenu.tsx'
import { Modal } from '../../src/ui/shared/Modal.tsx'
import { GamepadContext } from '../../src/hooks/gamepad/GamepadContext'

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
  openVoidSermon: vi.fn(),
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
  it('prevents controller menu opening during travel while allowing closing', () => {
    const register = vi.fn(() => () => {})
    const setIsMenuOpen = vi.fn()
    const controller = {
      register,
      capture: () => () => {},
      status: { available: true, devices: [] },
      bindings: [2, 0, 1]
    }
    const props = {
      t,
      setIsMenuOpen,
      isTraveling: true,
      vanFuel: 50,
      vanCondition: 50,
      isSaving: false,
      ...defaultActions()
    }
    const view = render(
      <GamepadContext value={controller}>
        <OverworldMenu {...props} isMenuOpen={false} />
      </GamepadContext>
    )
    const menu = () =>
      act(() => register.mock.calls.at(-1)[0].handlers.current.onMenu())
    menu()
    expect(setIsMenuOpen).not.toHaveBeenCalled()
    view.rerender(
      <GamepadContext value={controller}>
        <OverworldMenu {...props} isMenuOpen />
      </GamepadContext>
    )
    menu()
    expect(setIsMenuOpen).toHaveBeenLastCalledWith(false)
    view.rerender(
      <GamepadContext value={controller}>
        <OverworldMenu {...props} isTraveling={false} isMenuOpen={false} />
      </GamepadContext>
    )
    menu()
    expect(setIsMenuOpen).toHaveBeenLastCalledWith(true)
  })

  it('keeps Cult Indoctrination reachable from the hustles category', () => {
    const actions = defaultActions()
    render(<Harness actions={actions} />)

    fireEvent.click(screen.getByRole('button', { name: /HUSTLES/i }))
    fireEvent.click(
      screen.getByRole('button', { name: /CULT INDOCTRINATION/i })
    )

    expect(actions.openCultIndoctrination).toHaveBeenCalledTimes(1)
  })

  it('keeps Void Sermon reachable from the hustles category', () => {
    const actions = defaultActions()
    render(<Harness actions={actions} />)

    fireEvent.click(screen.getByRole('button', { name: /HUSTLES/i }))
    fireEvent.click(screen.getByRole('button', { name: /VOID SERMON/i }))

    expect(actions.openVoidSermon).toHaveBeenCalledTimes(1)
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

describe('OverworldMenu with a modal stacked above it', () => {
  // "Crash in van" keeps the menu open while the day advances, so an event
  // dialog (useModalBehavior) can open on top of the still-open menu.
  const StackedHarness = ({ onModalClose }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    return (
      <>
        <OverworldMenu
          t={t}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isTraveling={false}
          vanFuel={50}
          vanCondition={50}
          isSaving={false}
          {...defaultActions()}
        />
        <button type='button' onClick={() => setIsModalOpen(true)}>
          open-event
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            onModalClose()
            setIsModalOpen(false)
          }}
          title='Event'
        >
          <button type='button'>event-choice</button>
        </Modal>
        <span data-testid='menu-state'>{isMenuOpen ? 'open' : 'closed'}</span>
      </>
    )
  }

  it('lets Escape close the topmost modal and leaves the menu open', () => {
    const onModalClose = vi.fn()
    render(<StackedHarness onModalClose={onModalClose} />)

    fireEvent.click(screen.getByText('open-event'))
    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onModalClose).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('menu-state').textContent).toBe('open')

    // With the dialog gone the menu owns Escape again.
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByTestId('menu-state').textContent).toBe('closed')
  })
})
