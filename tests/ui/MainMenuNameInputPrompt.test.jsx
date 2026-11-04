import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MainMenuNameInputPrompt } from '../../src/scenes/mainmenu/MainMenuNameInputPrompt'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('identity validation', () => {
  for (const name of ['\u200b\u3164', '\u0301\u0302']) {
    it(`rejects an alias without visible characters: ${JSON.stringify(name)}`, async () => {
      const submit = vi.fn()
      render(
        <MainMenuNameInputPrompt
          playerNameInput={name}
          setPlayerNameInput={vi.fn()}
          handleNameSubmit={submit}
          onClose={vi.fn()}
        />
      )
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'ui:confirm_identity' })
        )
      })
      expect(submit).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent('ui:enter_name_error')
    })
  }
  it('saves the same sanitized alias the API accepts', async () => {
    const submit = vi.fn()
    render(
      <MainMenuNameInputPrompt
        playerNameInput={' A\u200blias '}
        setPlayerNameInput={vi.fn()}
        handleNameSubmit={submit}
        onClose={vi.fn()}
      />
    )
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'ui:confirm_identity' })
      )
    })
    expect(submit).toHaveBeenCalledWith('Alias')
  })
})
