import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
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
})

test('UplinkButton should allow http: and https: URLs', () => {
  const safeUrls = ['http://example.com', 'https://example.com']

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
    expect(link.getAttribute('href')).toBe(url)
    unmount()
  })
})
