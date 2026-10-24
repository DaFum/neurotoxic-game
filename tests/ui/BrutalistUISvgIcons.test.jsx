import { render } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ i18n: { language: 'en' }, t: key => key })
}))

import { AlertIcon, HexNode } from '../../src/ui/shared/BrutalistUI.tsx'

describe.each([
  ['AlertIcon', AlertIcon, '0 0 24 24'],
  ['HexNode', HexNode, '0 0 100 100']
])('%s', (_name, Icon, viewBox) => {
  test('draws into its own view box and keeps the class', () => {
    const { container } = render(<Icon className='custom-icon' />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('viewBox')).toBe(viewBox)
    expect(svg.getAttribute('fill')).toBe('none')
    expect(svg.className.baseVal).toBe('custom-icon')
  })

  test('is hidden from assistive technology without a title', () => {
    const { container } = render(<Icon />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.getAttribute('role')).toBe('presentation')
    expect(svg.querySelector('title')).toBeNull()
    expect(svg.hasAttribute('aria-labelledby')).toBe(false)
  })

  test('is named by its own <title> when one is given', () => {
    const { container } = render(<Icon title='Heads up' />)
    const svg = container.querySelector('svg')
    const title = svg.querySelector('title')
    expect(svg.getAttribute('role')).toBe('img')
    expect(title.textContent).toBe('Heads up')
    expect(svg.getAttribute('aria-labelledby')).toBe(title.id)
    expect(svg.hasAttribute('aria-hidden')).toBe(false)
  })

  test('gives two titled icons different ids', () => {
    const { container } = render(
      <>
        <Icon title='First' />
        <Icon title='Second' />
      </>
    )
    const ids = [...container.querySelectorAll('title')].map(el => el.id)
    expect(new Set(ids).size).toBe(2)
  })
})
