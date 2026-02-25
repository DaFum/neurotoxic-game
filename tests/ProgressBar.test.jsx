import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { render, cleanup } from '@testing-library/react'

import { ProgressBar } from '../src/ui/shared/index.jsx'

afterEach(cleanup)

test('ProgressBar: renders default correctly', () => {


  const { container } = render(
    <ProgressBar label="Test" value={50} max={100} color="bg-(--blood-red)" />
  )

  // Should have label
  expect(container.textContent).toContain('Test')
  // Should have value
  expect(container.textContent.includes('50/100')).toBeTruthy()
  // Should have standard height (h-5 for md)
  const bar = container.querySelector('.h-5')
  expect(bar).toBeTruthy()
})

test('ProgressBar: renders mini variant correctly', () => {


  const { container } = render(
    <ProgressBar label="Mini" value={20} max={100} color="bg-(--condition-blue)" size="mini" />
  )

  // Should NOT have label or value
  expect(container.textContent).toBe('')

  // Should have mini height (h-1.5)
  // Note: we look for the element that has the height class.
  // The outer div has w-full and className. The inner div has the height and border.
  const barWrapper = container.querySelector('.h-1\\.5')
  expect(barWrapper).toBeTruthy()

  // Should have overflow-hidden (if we add it to the wrapper as per plan)
  expect(barWrapper.classList.contains('overflow-hidden')).toBeTruthy()
})

test('ProgressBar: applies warn animation', () => {


  const { container } = render(
    <ProgressBar label="Warn" value={10} max={100} color="bg-(--warning-yellow)" warn={true} />
  )

  const innerBar = container.querySelector('.animate-fuel-warning')
  expect(innerBar).toBeTruthy()
})

test('ProgressBar: has accessibility attributes', () => {


  const { getByRole } = render(
    <ProgressBar label="A11y Test" value={75} max={100} color="bg-(--toxic-green)" aria-label="Custom Label" />
  )

  const progressBar = getByRole('progressbar')
  expect(progressBar).toBeTruthy()

  // Check ARIA attributes
  expect(progressBar.getAttribute('aria-valuenow')).toBe('75')
  expect(progressBar.getAttribute('aria-valuemin')).toBe('0')
  expect(progressBar.getAttribute('aria-valuemax')).toBe('100')
  expect(progressBar.getAttribute('aria-label')).toBe('Custom Label')
})
