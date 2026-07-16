import { describe, test } from 'vitest'
import { expect } from 'vitest'
import {
  getGenImageUrl,
  appendImageSize,
  isImageGenerationAvailable,
  getGeneratedImageFallbackUrl,
  resolveGenImageUrl,
  getChassisImagePrompt,
  getModuleImagePrompt,
  getLoanProfileImagePrompt,
  getCrowdfundImagePrompt,
  getRiskEventImagePrompt,
  getSectionBackgroundPrompt,
  getTrailerImagePrompt,
  getRepairImagePrompt
} from '../../src/utils/imageGen'

describe('imageGen utilities', () => {
  describe('getGenImageUrl', () => {
    test('generates correct url for simple description', () => {
      const url = getGenImageUrl('cyber punk')
      expect(url).toBe(
        'https://gen.pollinations.ai/image/cyber%20punk?model=flux&seed=666&key=pk_xDL8u2ty4Sxucaa3&='
      )
    })

    test('generates correct url for complex description with special characters', () => {
      const url = getGenImageUrl('hello world / ? & =')
      expect(url).toBe(
        'https://gen.pollinations.ai/image/hello%20world%20%2F%20%3F%20%26%20%3D?model=flux&seed=666&key=pk_xDL8u2ty4Sxucaa3&='
      )
    })

    test('generates correct url for empty description', () => {
      const url = getGenImageUrl('')
      expect(url).toBe(
        'https://gen.pollinations.ai/image/?model=flux&seed=666&key=pk_xDL8u2ty4Sxucaa3&='
      )
    })
  })

  describe('appendImageSize', () => {
    test('appends size correctly to url with existing query params', () => {
      const url = 'https://example.com/image?model=flux'
      const result = appendImageSize(url, 800, 600)
      expect(result).toBe(
        'https://example.com/image?model=flux&width=800&height=600'
      )
    })

    test('appends size correctly to url without existing query params', () => {
      const url = 'https://example.com/image'
      const result = appendImageSize(url, 800, 600)
      expect(result).toBe('https://example.com/image?width=800&height=600')
    })
  })

  describe('isImageGenerationAvailable', () => {
    test('returns explicitly provided online status if given', () => {
      expect(isImageGenerationAvailable(true)).toBe(true)
      expect(isImageGenerationAvailable(false)).toBe(false)
    })

    test('uses navigator.onLine correctly if explicit status is not given', () => {
      const originalNavigator = globalThis.navigator

      delete globalThis.navigator
      expect(isImageGenerationAvailable()).toBe(true)

      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: true },
        configurable: true
      })
      expect(isImageGenerationAvailable()).toBe(true)

      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        configurable: true
      })
      expect(isImageGenerationAvailable()).toBe(false)

      if (originalNavigator) {
        Object.defineProperty(globalThis, 'navigator', {
          value: originalNavigator,
          configurable: true
        })
      } else {
        delete globalThis.navigator
      }
    })
  })

  describe('getGeneratedImageFallbackUrl', () => {
    test('returns standard fallback path', () => {
      expect(getGeneratedImageFallbackUrl()).toBe(
        '/images/generated-offline-fallback.svg'
      )
    })
  })

  describe('resolveGenImageUrl', () => {
    test('returns generated URL when online', () => {
      const url = resolveGenImageUrl('test', true)
      expect(url.includes('pollinations.ai')).toBe(true)
    })

    test('returns fallback URL when offline', () => {
      const url = resolveGenImageUrl('test', false)
      expect(url).toBe('/images/generated-offline-fallback.svg')
    })
  })

  describe('getChassisImagePrompt', () => {
    test('returns correct prompt for tourbus legit tier 1', () => {
      const prompt = getChassisImagePrompt('tourbus_chassis', 'legit', 1)
      expect(prompt).toBe(
        'pixel art tour van side view band gear cramped minimal setup dark moody toxic green accents'
      )
    })
  })

  describe('getModuleImagePrompt', () => {
    test('returns default prompt for unknown module', () => {
      const prompt = getModuleImagePrompt('unknown_module_id')
      expect(prompt).toBe(
        'pixel art unknown module id dark moody toxic green accents'
      )
    })
  })

  describe('getLoanProfileImagePrompt', () => {
    test('returns correct prompt for known profile', () => {
      const prompt = getLoanProfileImagePrompt('loanShark')
      expect(prompt).toBe('pixel art loan shark dark alley menacing dark moody')
    })

    test('returns default prompt for unknown profile', () => {
      const prompt = getLoanProfileImagePrompt('unknown_profile')
      expect(prompt).toBe('pixel art bank loan dark moody')
    })
  })

  describe('getCrowdfundImagePrompt', () => {
    test('returns correct prompt', () => {
      const prompt = getCrowdfundImagePrompt('tourbus_chassis', 'diy')
      expect(prompt).toBe(
        'pixel art crowdfunding campaign poster beat-up tour van duct tape repairs fans donating diy aesthetic'
      )
    })
  })

  describe('getRiskEventImagePrompt', () => {
    test('returns correct prompt', () => {
      const prompt = getRiskEventImagePrompt('fire')
      expect(prompt).toBe(
        'pixel art small fire damage smoking equipment dark moody punk'
      )
    })
  })

  describe('getSectionBackgroundPrompt', () => {
    test('returns correct prompt', () => {
      const prompt = getSectionBackgroundPrompt('studio_chassis', 'legit')
      expect(prompt).toBe(
        'pixel art recording studio control room background wide shot atmospheric dark moody toxic green accents'
      )
    })
  })

  describe('getTrailerImagePrompt', () => {
    test('returns correct prompt for diy', () => {
      const prompt = getTrailerImagePrompt('diy')
      expect(prompt).toBe(
        'pixel art trailer side view self-welded diy duct tape band gear toxic green accents'
      )
    })

    test('returns correct prompt for legit', () => {
      const prompt = getTrailerImagePrompt('legit')
      expect(prompt).toBe(
        'pixel art trailer side view certified rental band gear toxic green accents'
      )
    })
  })

  describe('getRepairImagePrompt', () => {
    test('returns severely damaged prompt for condition < 20', () => {
      const prompt = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 10)
      expect(prompt.includes('severely damaged broken')).toBe(true)
    })

    test('returns damaged prompt for condition < 50', () => {
      const prompt = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 40)
      expect(prompt.includes('severely damaged broken')).toBe(false)
      expect(prompt.includes('damaged worn')).toBe(true)
    })

    test('returns maintenance prompt for condition >= 50', () => {
      const prompt = getRepairImagePrompt('tourbus_chassis', 'legit', 1, 60)
      expect(prompt.includes('severely damaged broken')).toBe(false)
      expect(prompt.includes('damaged worn')).toBe(false)
      expect(prompt.includes('needs maintenance')).toBe(true)
    })
  })
})
