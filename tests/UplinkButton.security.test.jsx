import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { UplinkButton } from '../src/ui/shared/BrutalistUI.jsx'

test('UplinkButton should not allow javascript: URLs', () => {
  const maliciousUrl = "javascript:alert('XSS')"
  render(
    <UplinkButton
      title='Malicious Link'
      url={maliciousUrl}
      subtitle='XSS'
      type='exploit'
    />
  )

  const link = screen.getByRole('link')
  expect(link.getAttribute('href')).toBe('#')
  expect(link.getAttribute('target')).toBeNull()
  expect(link.getAttribute('rel')).toBeNull()
})

test('UplinkButton should use "#" when url is missing or undefined', () => {
  render(
    <UplinkButton
      title='No Link'
      subtitle='Missing'
      type='safe'
    />
  )

  const link = screen.getByRole('link', { name: /No Link/i })
  expect(link.getAttribute('href')).toBe('#')
})

test('UplinkButton should allow http: and https: URLs with varying formats', () => {
  const safeUrls = [
    'http://example.com',
    'https://example.com',
    'HTTPS://example.com',
    '  http://example.com',
  ]

  safeUrls.forEach(url => {
    const { unmount } = render(
      <UplinkButton
        title='Safe Link'
        url={url}
        subtitle='Safe'
        type='safe'
      />
    )
    const link = screen.getByRole('link', { name: /Safe Link/i })
    expect(link.getAttribute('href')).toBe(url.trim())
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    unmount()
  })
})

test('UplinkButton should prevent default action for unsafe URLs on click', () => {
  render(
    <UplinkButton
      title='Unsafe Link'
      url="javascript:alert('XSS')"
      subtitle='Unsafe'
      type='exploit'
    />
  )

  const link = screen.getByRole('link', { name: /Unsafe Link/i })
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  })

  fireEvent(link, clickEvent)

  expect(clickEvent.defaultPrevented).toBe(true)
})
