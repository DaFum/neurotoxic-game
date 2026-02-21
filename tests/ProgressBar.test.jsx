import { test } from 'node:test'
import assert from 'node:assert/strict'
import { render, cleanup } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from './testUtils.js'
import { ProgressBar } from '../src/ui/shared/index.jsx'

test('ProgressBar: renders default correctly', (t) => {
  setupJSDOM()
  t.after(cleanup)
  t.after(teardownJSDOM)

  const { container } = render(
    <ProgressBar label="Test" value={50} max={100} color="bg-red-500" />
  )

  // Should have label
  assert.ok(container.textContent.includes('Test'))
  // Should have value
  assert.ok(container.textContent.includes('50/100'))
  // Should have standard height (h-5 for md)
  const bar = container.querySelector('.h-5')
  assert.ok(bar, 'Should have h-5 class for default size')
})

test('ProgressBar: renders mini variant correctly', (t) => {
  setupJSDOM()
  t.after(cleanup)
  t.after(teardownJSDOM)

  const { container } = render(
    <ProgressBar label="Mini" value={20} max={100} color="bg-blue-500" size="mini" />
  )

  // Should NOT have label or value
  assert.equal(container.textContent, '', 'Mini variant should not display text')

  // Should have mini height (h-1.5)
  // Note: we look for the element that has the height class.
  // The outer div has w-full and className. The inner div has the height and border.
  const barWrapper = container.querySelector('.h-1\\.5')
  assert.ok(barWrapper, 'Should have h-1.5 class for mini size')

  // Should have overflow-hidden (if we add it to the wrapper as per plan)
  assert.ok(barWrapper.classList.contains('overflow-hidden'), 'Should have overflow-hidden')
})

test('ProgressBar: applies warn animation', (t) => {
  setupJSDOM()
  t.after(cleanup)
  t.after(teardownJSDOM)

  const { container } = render(
    <ProgressBar label="Warn" value={10} max={100} color="bg-yellow-500" warn={true} />
  )

  const innerBar = container.querySelector('.animate-fuel-warning')
  assert.ok(innerBar, 'Should have animate-fuel-warning class')
})
