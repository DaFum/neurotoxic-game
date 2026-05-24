import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GeneratedImagePanel } from '../../src/ui/shared/GeneratedImagePanel'
import * as imageGen from '../../src/utils/imageGen'

vi.mock('../../src/utils/imageGen', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    isImageGenerationAvailable: vi.fn(),
    resolveGenImageUrl: vi.fn((prompt) => `http://mock.gen/${encodeURIComponent(prompt)}`),
    getGeneratedImageFallbackUrl: vi.fn(() => 'http://mock.gen/fallback.svg'),
  }
})

describe('GeneratedImagePanel', () => {
  beforeEach(() => {
    vi.mocked(imageGen.isImageGenerationAvailable).mockReturnValue(true)
  })

  it('renders with a prompt and shows an img with right alt', () => {
    render(<GeneratedImagePanel prompt="test prompt" alt="test alt" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt', 'test alt')
    expect(img).toHaveAttribute('src', expect.stringContaining('test%20prompt'))
  })

  it('sizeHint causes src to contain width and height', () => {
    render(<GeneratedImagePanel prompt="test prompt" alt="test" sizeHint={{ width: 100, height: 200 }} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', expect.stringContaining('width=100&height=200'))
  })

  it('calls onLoad when image fires onLoad', () => {
    const onLoadMock = vi.fn()
    render(<GeneratedImagePanel prompt="test prompt" alt="test" onLoad={onLoadMock} />)
    const img = screen.getByRole('img')
    fireEvent.load(img)
    expect(onLoadMock).toHaveBeenCalled()
  })

  it('same prompt yields same URL deterministically', () => {
    const { rerender } = render(<GeneratedImagePanel prompt="same" alt="test" />)
    const img1 = screen.getByRole('img').getAttribute('src')
    rerender(<GeneratedImagePanel prompt="same" alt="test" />)
    const img2 = screen.getByRole('img').getAttribute('src')
    expect(img1).toBe(img2)
  })

  it('falls back to offline URL on error', () => {
    render(<GeneratedImagePanel prompt="test prompt" alt="test" />)
    const img = screen.getByRole('img')
    fireEvent.error(img)
    expect(img).toHaveAttribute('src', 'http://mock.gen/fallback.svg')
  })
})
