import { test } from 'node:test'
import assert from 'node:assert/strict'
import { render, fireEvent } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import React from 'react'
import { GlitchButton } from '../src/ui/GlitchButton.jsx'

test('GlitchButton renders children correctly', async t => {
  setupJSDOM()
  t.after(teardownJSDOM)

  const { getByText } = render(
    <GlitchButton onClick={() => {}}>Click Me</GlitchButton>
  )
  assert.ok(getByText('Click Me'))
})

test('GlitchButton calls onClick when clicked', async t => {
  setupJSDOM()
  t.after(teardownJSDOM)

  let clicked = false
  const handleClick = () => {
    clicked = true
  }

  const { getByText } = render(
    <GlitchButton onClick={handleClick}>Click Me</GlitchButton>
  )
  fireEvent.click(getByText('Click Me'))

  assert.strictEqual(clicked, true)
})

test('GlitchButton does not call onClick when disabled', async t => {
  setupJSDOM()
  t.after(teardownJSDOM)

  let clicked = false
  const handleClick = () => {
    clicked = true
  }

  const { getByRole } = render(
    <GlitchButton onClick={handleClick} disabled>
      Click Me
    </GlitchButton>
  )
  const button = getByRole('button')

  fireEvent.click(button)

  assert.strictEqual(clicked, false)
  assert.strictEqual(button.disabled, true)
})

test('GlitchButton shows loading state', async t => {
  setupJSDOM()
  t.after(teardownJSDOM)

  let clicked = false
  const handleClick = () => {
    clicked = true
  }

  const { getByRole, container } = render(
    <GlitchButton onClick={handleClick} isLoading>
      Loading...
    </GlitchButton>
  )
  const button = getByRole('button')

  assert.strictEqual(button.disabled, true)
  assert.strictEqual(button.getAttribute('aria-busy'), 'true')

  fireEvent.click(button)
  assert.strictEqual(clicked, false)

  // Check for spinner class 'animate-spin'
  const spinner = container.querySelector('.animate-spin')
  assert.ok(spinner, 'Spinner should be present')
})
