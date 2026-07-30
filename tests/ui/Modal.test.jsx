import { describe, expect, test, vi } from 'vitest'
import { useState } from 'react'
import {
  render,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '../../src/ui/shared/Modal.tsx'

describe('Modal Component', () => {
  test('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )
    expect(container.firstChild).toBeNull()
  })

  test('renders children and title when isOpen is true', () => {
    const { getByText } = render(
      <Modal isOpen={true} onClose={() => {}} title='Test Title'>
        <div>Modal Content</div>
      </Modal>
    )
    expect(getByText('Test Title')).toBeInTheDocument()
    expect(getByText('Modal Content')).toBeInTheDocument()
  })

  test('uses the rendered title as the accessible dialog name when ariaLabel is absent', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={() => {}} title='Fallback Title'>
        <div>Modal Content</div>
      </Modal>
    )

    const heading = getByRole('heading', { name: 'Fallback Title' })
    const dialog = getByRole('dialog')

    expect(heading.id).not.toBe('')
    expect(dialog).not.toHaveAttribute('aria-label')
    expect(dialog).toHaveAttribute('aria-labelledby', heading.id)
  })

  test('uses the explicit ariaLabel instead of the title fallback', () => {
    const { getByRole } = render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title='Visible Title'
        ariaLabel='Explicit Dialog Label'
      >
        <div>Modal Content</div>
      </Modal>
    )

    const dialog = getByRole('dialog')

    expect(dialog).toHaveAttribute('aria-label', 'Explicit Dialog Label')
    expect(dialog).not.toHaveAttribute('aria-labelledby')
  })

  test('constrains the dialog to the mobile viewport', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )

    expect(getByRole('dialog')).toHaveClass('max-h-[calc(100svh-1rem)]')
    expect(getByRole('dialog')).not.toHaveClass('overflow-hidden')
  })

  test('keeps mobile gutters and close control inside the viewport', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={() => {}} title='Mobile Title'>
        <div>Modal Content</div>
      </Modal>
    )

    const dialog = getByRole('dialog')
    const overlay = dialog.parentElement
    const closeButton = getByRole('button', { name: /close/i })

    expect(overlay).toHaveClass('p-3')
    expect(dialog).toHaveClass('w-[min(calc(100vw-1.5rem),100%)]')
    expect(dialog).toHaveClass('shadow-[4px_4px_0px_var(--color-toxic-green)]')
    expect(closeButton.parentElement).toHaveClass('top-2')
    expect(closeButton.parentElement).toHaveClass('right-2')
  })

  test('keeps clipping and scrolling on the inner content layer', () => {
    const { getByText } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )

    const contentLayer = getByText('Modal Content').parentElement
    expect(contentLayer).toHaveClass('overflow-y-auto')
    expect(contentLayer).toHaveClass('overflow-x-hidden')
    expect(contentLayer).toHaveClass('max-h-[calc(100svh-3rem)]')
  })

  test('calls onClose when clicking outside', () => {
    const onCloseMock = vi.fn()
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )

    // Click the background overlay (which is the parent of the dialog)
    const overlay = getByRole('dialog').parentElement
    fireEvent.click(overlay)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  test('does not call onClose when clicking inside the modal dialog', () => {
    const onCloseMock = vi.fn()
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )

    // Click the dialog itself
    const dialog = getByRole('dialog')
    fireEvent.click(dialog)
    expect(onCloseMock).not.toHaveBeenCalled()
  })

  test('calls onClose when Escape key is pressed', () => {
    const onCloseMock = vi.fn()
    render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  test('calls onClose when the close button is clicked', () => {
    const onCloseMock = vi.fn()
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )

    // The button has an aria-label from i18n (defaults to the key in tests if not mocked with a specific value, but we can just query by role button with the generic catch-all or specifically by label if we know what the mock returns)
    // The test setup uses a default mock that returns the key or fallback. Let's just find the close button.
    const closeBtn = getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  test('loops Tab and Shift+Tab focus within the dialog', async () => {
    const user = userEvent.setup()

    render(
      <>
        <button type='button'>Outside control</button>
        <Modal isOpen={true} onClose={() => {}} title='Focus trap'>
          <button type='button'>First action</button>
          <a href='/last-action'>Last action</a>
        </Modal>
      </>
    )

    const dialog = screen.getByRole('dialog')
    const closeButton = screen.getByRole('button', { name: /close/i })
    const lastAction = screen.getByRole('link', { name: 'Last action' })
    const focusableElements = Array.from(
      dialog.querySelectorAll('button, a[href]')
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    expect(firstFocusable).toBe(closeButton)
    expect(lastFocusable).toBe(lastAction)

    lastFocusable.focus()
    await user.tab()
    expect(firstFocusable).toHaveFocus()

    firstFocusable.focus()
    await user.tab({ shift: true })
    expect(lastFocusable).toHaveFocus()
  })

  test('returns focus to the opener after Escape closes the dialog', async () => {
    const user = userEvent.setup()

    const Harness = () => {
      const [isOpen, setIsOpen] = useState(false)

      return (
        <>
          <button type='button' onClick={() => setIsOpen(true)}>
            Open dialog
          </button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title='Return focus'
          >
            <button type='button'>Dialog action</button>
          </Modal>
        </>
      )
    }

    render(<Harness />)

    const opener = screen.getByRole('button', { name: 'Open dialog' })
    await user.click(opener)
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(opener).toHaveFocus()
  })

  test('marks background branches inert while preserving modal semantics', () => {
    const preserveInertAttribute = element => {
      if (element && !element.hasAttribute('inert')) {
        element.setAttribute('inert', 'preserved')
      }
    }

    const { rerender } = render(
      <>
        <main data-testid='background-content'>
          <button type='button'>Background action</button>
        </main>
        <aside
          data-testid='pre-hidden-background'
          aria-hidden='false'
          ref={preserveInertAttribute}
        >
          Preserved background state
        </aside>
        <Modal isOpen={true} onClose={() => {}} title='Semantic modal'>
          Modal content
        </Modal>
      </>
    )

    const background = screen.getByTestId('background-content')
    const preHiddenBackground = screen.getByTestId('pre-hidden-background')
    const dialog = screen.getByRole('dialog', { name: 'Semantic modal' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.parentElement).toHaveAttribute('role', 'presentation')
    expect(background).toHaveAttribute('aria-hidden', 'true')
    expect(background).toHaveAttribute('inert')
    expect(preHiddenBackground).toHaveAttribute('aria-hidden', 'true')
    expect(preHiddenBackground).toHaveAttribute('inert')

    rerender(
      <>
        <main data-testid='background-content'>
          <button type='button'>Background action</button>
        </main>
        <aside
          data-testid='pre-hidden-background'
          aria-hidden='false'
          ref={preserveInertAttribute}
        >
          Preserved background state
        </aside>
        <Modal isOpen={false} onClose={() => {}} title='Semantic modal'>
          Modal content
        </Modal>
      </>
    )

    expect(background).not.toHaveAttribute('aria-hidden')
    expect(background).not.toHaveAttribute('inert')
    expect(preHiddenBackground).toHaveAttribute('aria-hidden', 'false')
    expect(preHiddenBackground).toHaveAttribute('inert', 'preserved')
  })

  test('only the topmost stacked modal handles Escape and restores focus through the stack', async () => {
    const user = userEvent.setup()
    const outerClose = vi.fn()
    const innerClose = vi.fn()

    const Harness = () => {
      const [outerOpen, setOuterOpen] = useState(false)
      const [innerOpen, setInnerOpen] = useState(false)

      return (
        <>
          <button type='button' onClick={() => setOuterOpen(true)}>
            Open chassis acquisition
          </button>
          <Modal
            isOpen={outerOpen}
            onClose={() => {
              outerClose()
              setOuterOpen(false)
            }}
            title='Chassis acquisition'
          >
            <button type='button' onClick={() => setInnerOpen(true)}>
              Configure crowdfunding
            </button>
          </Modal>
          <Modal
            isOpen={innerOpen}
            onClose={() => {
              innerClose()
              setInnerOpen(false)
            }}
            title='Crowdfund setup'
          >
            <button type='button'>Confirm crowdfunding</button>
          </Modal>
        </>
      )
    }

    render(<Harness />)

    const outerOpener = screen.getByRole('button', {
      name: 'Open chassis acquisition'
    })
    await user.click(outerOpener)
    await waitFor(() =>
      expect(
        screen.getByRole('dialog', { name: 'Chassis acquisition' })
      ).toHaveFocus()
    )
    const outerDialog = screen.getByRole('dialog', {
      name: 'Chassis acquisition'
    })

    const innerOpener = screen.getByRole('button', {
      name: 'Configure crowdfunding'
    })
    await user.click(innerOpener)
    await waitFor(() =>
      expect(
        screen.getByRole('dialog', { name: 'Crowdfund setup' })
      ).toHaveFocus()
    )
    const innerDialog = screen.getByRole('dialog', {
      name: 'Crowdfund setup'
    })
    const innerLastAction = within(innerDialog).getByRole('button', {
      name: 'Confirm crowdfunding'
    })
    const innerFirstAction = within(innerDialog).getByRole('button', {
      name: /close/i
    })
    let outerReceivedFocus = false
    const recordFocus = event => {
      if (event.target instanceof Node && outerDialog.contains(event.target)) {
        outerReceivedFocus = true
      }
    }

    innerLastAction.focus()
    document.addEventListener('focusin', recordFocus)
    try {
      await user.tab()
    } finally {
      document.removeEventListener('focusin', recordFocus)
    }

    expect(innerFirstAction).toHaveFocus()
    expect(outerReceivedFocus).toBe(false)

    await user.keyboard('{Escape}')

    expect(innerClose).toHaveBeenCalledTimes(1)
    expect(outerClose).not.toHaveBeenCalled()
    expect(
      screen.getByRole('dialog', { name: 'Chassis acquisition' })
    ).toBeInTheDocument()
    expect(innerOpener).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(outerClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(outerOpener).toHaveFocus()
  })

  test('keeps the topmost sibling modal interactive when both are initially open', async () => {
    render(
      <>
        <Modal
          isOpen={true}
          onClose={() => {}}
          title='Initial chassis acquisition'
        >
          Chassis content
        </Modal>
        <Modal isOpen={true} onClose={() => {}} title='Initial crowdfund setup'>
          Crowdfund content
        </Modal>
      </>
    )

    const [outerDialog, innerDialog] = screen.getAllByRole('dialog', {
      hidden: true
    })
    const outerOverlay = outerDialog.parentElement
    const innerOverlay = innerDialog.parentElement

    expect(outerOverlay).toHaveAttribute('aria-hidden', 'true')
    expect(outerOverlay).toHaveAttribute('inert')
    expect(innerOverlay).not.toHaveAttribute('aria-hidden')
    expect(innerOverlay).not.toHaveAttribute('inert')
    await waitFor(() => expect(innerDialog).toHaveFocus())
  })

  test('restores shared background state after stacked modals close together', () => {
    const preserveInertAttribute = element => {
      if (element && !element.hasAttribute('inert')) {
        element.setAttribute('inert', 'preserved')
      }
    }

    const Stack = ({ outerOpen, innerOpen }) => (
      <>
        <main
          data-testid='stacked-background'
          aria-hidden='false'
          ref={preserveInertAttribute}
        >
          Background content
        </main>
        <Modal
          isOpen={outerOpen}
          onClose={() => {}}
          title='Chassis acquisition'
        >
          Chassis content
        </Modal>
        <Modal isOpen={innerOpen} onClose={() => {}} title='Crowdfund setup'>
          Crowdfund content
        </Modal>
      </>
    )

    const { rerender } = render(<Stack outerOpen={true} innerOpen={false} />)
    const background = screen.getByTestId('stacked-background')

    expect(background).toHaveAttribute('aria-hidden', 'true')
    expect(background).toHaveAttribute('inert')

    rerender(<Stack outerOpen={true} innerOpen={true} />)

    expect(background).toHaveAttribute('aria-hidden', 'true')
    expect(background).toHaveAttribute('inert')

    rerender(<Stack outerOpen={false} innerOpen={false} />)

    expect(background).toHaveAttribute('aria-hidden', 'false')
    expect(background).toHaveAttribute('inert', 'preserved')
  })
})
