import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => {
      const translations = {
        'ui:language': 'SPRACHE',
        'ui:language_option_en': 'ENGLISCH',
        'ui:language_option_de': 'DEUTSCH',
        'ui:audio_protocols': 'AUDIO',
        'ui:music_volume': 'MUSIK',
        'ui:sfx_volume': 'SFX',
        'ui:mute_all': 'STUMM',
        'ui:settings.audio_mute': 'Audio stummschalten',
        'ui:settings.audio_unmute': 'Audio einschalten',
        'ui:visual_interface': 'VISUELL',
        'ui:crt_effect': 'CRT',
        'ui:settings.crt_enable': 'CRT aktivieren',
        'ui:settings.crt_disable': 'CRT deaktivieren',
        'ui:data_purge': 'DATEN LÖSCHEN',
        'ui:delete_warning': 'Warnung',
        'ui:delete_save': 'Speicherstand löschen',
        'ui:confirm_delete': 'Löschen bestätigen',
        'ui:confirm_delete_text': 'Sicher?',
        'ui:cancel': 'Abbrechen',
        'ui:confirm': 'Bestätigen'
      }
      return translations[key] || key
    },
    i18n: {
      language: 'de',
      changeLanguage: vi.fn()
    }
  })
}))

test('SettingsPanel renders localized language option labels', async () => {
  const { SettingsPanel } = await import('../src/ui/shared/SettingsPanel.jsx')

  render(
    <SettingsPanel
      settings={{ crtEnabled: false, logLevel: 0 }}
      onDeleteSave={() => {}}
    />
  )

  expect(screen.getByText('ENGLISCH')).toBeInTheDocument()
  expect(screen.getByText('DEUTSCH')).toBeInTheDocument()
  expect(screen.queryByText('ENGLISH')).not.toBeInTheDocument()
})
