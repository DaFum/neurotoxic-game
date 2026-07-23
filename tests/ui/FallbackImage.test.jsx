import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'

vi.mock('../../src/utils/imageGen', () => ({
  getGenImageUrl: prompt => `mock-generated-${prompt ?? 'missing'}`,
  isImageGenerationAvailable: () => true,
  getGeneratedImageFallbackUrl: () => 'mock-offline-fallback'
}))

const { FallbackImage } = await import('../../src/ui/shared/FallbackImage.tsx')

describe('FallbackImage', () => {
  it('uses a terminal one-shot error handler even when fallbackSrc equals src', () => {
    const { getByRole } = render(
      <FallbackImage src='same-url' fallbackSrc='same-url' alt='poster' />
    )
    const image = getByRole('img')

    fireEvent.error(image)

    expect(image.getAttribute('src')).toBe('same-url')
    expect(image.onerror).toBeNull()
    expect(() => fireEvent.error(image)).not.toThrow()
  })
})
