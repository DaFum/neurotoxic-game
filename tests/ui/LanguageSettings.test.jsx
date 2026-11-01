import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LanguageSettings } from '../../src/ui/settings/LanguageSettings'

const mockChangeLanguage = vi.fn()
let currentLanguage = 'en'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      get language() {
        return currentLanguage
      },
      changeLanguage: mockChangeLanguage
    }
  })
}))

describe('LanguageSettings', () => {
  it('renders a role="group" labeled by the Language heading', () => {
    currentLanguage = 'en'
    render(<LanguageSettings />)

    const heading = screen.getByRole('heading', { level: 2, name: 'ui:language' })
    expect(heading).toBeInTheDocument()
    expect(heading.id).toBeTruthy()

    const group = screen.getByRole('group', { name: 'ui:language' })
    expect(group).toBeInTheDocument()
    expect(group).toHaveAttribute('aria-labelledby', heading.id)
  })

  it('reflects aria-pressed states based on current language', () => {
    currentLanguage = 'en'
    const { unmount } = render(<LanguageSettings />)

    let enBtn = screen.getByRole('button', { name: 'ui:language_option_en' })
    let deBtn = screen.getByRole('button', { name: 'ui:language_option_de' })

    expect(enBtn).toHaveAttribute('aria-pressed', 'true')
    expect(deBtn).toHaveAttribute('aria-pressed', 'false')

    unmount()
    currentLanguage = 'de'
    render(<LanguageSettings />)

    enBtn = screen.getByRole('button', { name: 'ui:language_option_en' })
    deBtn = screen.getByRole('button', { name: 'ui:language_option_de' })

    expect(enBtn).toHaveAttribute('aria-pressed', 'false')
    expect(deBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls changeLanguage on click', () => {
    currentLanguage = 'en'
    render(<LanguageSettings />)

    const deBtn = screen.getByRole('button', { name: 'ui:language_option_de' })
    fireEvent.click(deBtn)

    expect(mockChangeLanguage).toHaveBeenCalledWith('de')
  })
})
