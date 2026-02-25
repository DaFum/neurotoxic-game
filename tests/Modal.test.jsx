import { describe, expect, test, vi } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Modal } from '../src/ui/shared/Modal.jsx'

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
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <div>Modal Content</div>
      </Modal>
    )
    expect(getByText('Test Title')).toBeInTheDocument()
    expect(getByText('Modal Content')).toBeInTheDocument()
  })

  test('calls onClose when clicking outside', () => {
    const onCloseMock = vi.fn()
    const { getByText } = render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )
    
    // Click the background overlay
    const overlay = getByText('Modal Content').parentElement.parentElement
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
})
