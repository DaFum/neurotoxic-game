import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../src/i18n'
import { getLocationName } from '../../../src/hooks/travel/actions/getLocationName'

vi.mock('../../../src/i18n', async () => {
  const { createInstance } = await import('i18next')
  const i18n = createInstance()
  await i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    keySeparator: false,
    resources: {
      en: { venues: { 'berlin_so36.name': 'SO36 English' } },
      de: { venues: { 'berlin_so36.name': 'SO36 Deutsch' } }
    }
  })
  return { default: i18n }
})

describe('getLocationName', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('uses the current language through the same resolver', async () => {
    const resolveLocationName = getLocationName
    expect(resolveLocationName('berlin_so36')).toBe('SO36 English')

    await i18n.changeLanguage('de')

    expect(resolveLocationName('berlin_so36')).toBe('SO36 Deutsch')
    expect(resolveLocationName('venues:berlin_so36.name')).toBe('SO36 Deutsch')
  })

  it.each([
    ['berlin_so36', undefined, 'SO36 English'],
    ['venues:berlin_so36.name', undefined, 'SO36 English'],
    [undefined, 'berlin_so36', 'SO36 English'],
    [undefined, 'venues:berlin_so36.name', 'SO36 English'],
    ['berlin_so36', 'other_venue', 'SO36 English'],
    ['Custom stop', undefined, 'Custom stop'],
    ['venues:missing_venue.name', undefined, 'missing venue'],
    [undefined, undefined, 'Unknown']
  ])('resolves %s with venue fallback %s', (location, venueId, expected) => {
    expect(getLocationName(location, venueId)).toBe(expected)
  })
})
