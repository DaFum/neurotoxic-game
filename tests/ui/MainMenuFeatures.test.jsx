import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MainMenuFeatures } from '../../src/scenes/mainmenu/MainMenuFeatures'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key, options) => {
      if (options?.returnObjects && key === 'ui:featureList') {
        return [
          {
            title: 'features.duplicate.title',
            description: 'features.duplicate.description',
            type: 'table',
            headers: ['features.header.one', 'features.header.two'],
            rows: [['features.same', 'features.same']]
          }
        ]
      }
      return options?.defaultValue ?? key
    }
  })
}))

describe('MainMenuFeatures', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not emit duplicate key warnings for repeated table cell values', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<MainMenuFeatures onClose={vi.fn()} />)

    const duplicateKeyWarning = consoleError.mock.calls.some(call =>
      call.some(
        value =>
          typeof value === 'string' &&
          value.includes('Encountered two children with the same key')
      )
    )
    expect(duplicateKeyWarning).toBe(false)
  })
})
