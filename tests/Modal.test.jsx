import { test, describe, afterEach, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { Modal } from '../src/ui/shared/Modal.jsx'

describe('Modal Component', () => {
  beforeEach(() => {
    setupJSDOM()
  })

  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )
    assert.equal(container.firstChild, null)
  })

  test('renders children and title when isOpen is true', () => {
    const { getByText } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <div>Modal Content</div>
      </Modal>
    )
    assert.ok(getByText('Test Title'))
    assert.ok(getByText('Modal Content'))
  })

  test('calls onClose when clicking outside', () => {
    const onCloseMock = mock.fn()
    const { getByText } = render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )
    
    // Click the background overlay
    const overlay = getByText('Modal Content').parentElement.parentElement
    fireEvent.click(overlay)
    assert.equal(onCloseMock.mock.calls.length, 1)
  })

  test('does not call onClose when clicking inside the modal dialog', () => {
    const onCloseMock = mock.fn()
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )
    
    // Click the dialog itself
    const dialog = getByRole('dialog')
    fireEvent.click(dialog)
    assert.equal(onCloseMock.mock.calls.length, 0)
  })

  test('calls onClose when Escape key is pressed', () => {
    const onCloseMock = mock.fn()
    render(
      <Modal isOpen={true} onClose={onCloseMock}>
        <div>Modal Content</div>
      </Modal>
    )
    
    fireEvent.keyDown(window, { key: 'Escape' })
    assert.equal(onCloseMock.mock.calls.length, 1)
  })
})
