// TODO: Implement this
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

test('SettingsPanel renders localized language option labels', async () => {
  const { SettingsPanel } = await import('../src/ui/shared/SettingsPanel.jsx')

  render(
    <SettingsPanel
      settings={{ crtEnabled: false, logLevel: 0 }}
      onDeleteSave={() => {}}
    />
  )

  expect(screen.getByText('ui:language_option_en')).toBeInTheDocument()
  expect(screen.getByText('ui:language_option_de')).toBeInTheDocument()
})
