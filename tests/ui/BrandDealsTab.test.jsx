import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

const resolveGenImageUrl = vi.fn(() => 'mock-image-url')

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} },
    t: (key, options) => {
      if (key.endsWith('.name')) return `NAME_MARKER:${options?.defaultValue}`
      if (key.endsWith('.description')) {
        return `DESCRIPTION_MARKER:${options?.defaultValue}`
      }
      return options?.defaultValue ?? key
    }
  })
}))

vi.mock('../../src/utils/networkStatus', () => ({
  useNetworkStatus: () => true
}))

vi.mock('../../src/utils/imageGen', () => ({
  resolveGenImageUrl: (...args) => resolveGenImageUrl(...args),
  getGenImageUrl: prompt => `mock-gen-${prompt ?? 'missing'}`,
  isImageGenerationAvailable: () => true,
  getGeneratedImageFallbackUrl: () => 'mock-fallback-url'
}))

const { BrandDealsTab } = await import('../../src/ui/bandhq/BrandDealsTab.tsx')

describe('BrandDealsTab', () => {
  it('builds generated art prompts from translated deal display text', () => {
    render(<BrandDealsTab social={{ activeDeals: [] }} />)

    expect(resolveGenImageUrl).toHaveBeenCalled()
    const [prompt] = resolveGenImageUrl.mock.calls[0]
    expect(prompt).toContain('NAME_MARKER:')
    expect(prompt).toContain('DESCRIPTION_MARKER:')
  })
})
