import { describe, expect, test, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
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
})
