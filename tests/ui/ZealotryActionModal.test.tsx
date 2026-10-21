import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ZealotryActionModal } from '../../src/ui/ZealotryActionModal'

const { mockState } = vi.hoisted(() => ({
  mockState: {
    current: {
      player: { money: 1000 },
      band: { harmony: 100 },
      social: { controversyLevel: 50, zealotry: 50 }
    }
  }
}))

vi.mock('../../src/context/GameState', () => ({
  useGameActions: vi.fn().mockImplementation(() => mockState.current),
  useGameSelector: vi
    .fn()
    .mockImplementation(selector => selector(mockState.current))
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

const defaultProps = {
  config: {
    COST: 100,
    FAME_GAIN: 50,
    ZEALOTRY_GAIN: 10,
    CONTROVERSY_GAIN: 20,
    HARMONY_COST: 15,
    REQUIRED_CONTROVERSY: 0,
    REQUIRED_ZEALOTRY: 0
  },
  labels: {
    title: 'Cult Indoctrination',
    description: 'Indoctrinate followers',
    costLabel: 'COST:',
    fameLabel: 'FAME:',
    zealotryLabel: 'ZEALOTRY:',
    controversyLabel: 'CONTROVERSY:',
    harmonyCostLabel: 'HARMONY COST:',
    alreadyRanToday: 'Followers already indoctrinated today.',
    cancel: 'CANCEL',
    execute: 'EXECUTE INDOCTRINATION'
  },
  canRun: true,
  hasRunToday: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn()
}

describe('ZealotryActionModal', () => {
  it('renders execute button enabled when action can run and has not run today', () => {
    render(<ZealotryActionModal {...defaultProps} />)

    const executeButton = screen.getByRole('button', {
      name: /EXECUTE INDOCTRINATION/i
    })
    expect(executeButton).toHaveAttribute('aria-disabled', 'false')
    expect(executeButton).not.toBeDisabled()

    fireEvent.click(executeButton)
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('keeps execute button focusable via aria-disabled when canRun is false', () => {
    const onConfirm = vi.fn()
    render(
      <ZealotryActionModal
        {...defaultProps}
        canRun={false}
        onConfirm={onConfirm}
      />
    )

    const executeButton = screen.getByRole('button', {
      name: /EXECUTE INDOCTRINATION/i
    })
    expect(executeButton).toHaveAttribute('aria-disabled', 'true')
    expect(executeButton).not.toBeDisabled()

    fireEvent.click(executeButton)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('keeps execute button focusable via aria-disabled when hasRunToday is true', () => {
    const onConfirm = vi.fn()
    render(
      <ZealotryActionModal
        {...defaultProps}
        hasRunToday={true}
        onConfirm={onConfirm}
      />
    )

    const executeButton = screen.getByRole('button', {
      name: /EXECUTE INDOCTRINATION/i
    })
    expect(executeButton).toHaveAttribute('aria-disabled', 'true')
    expect(executeButton).not.toBeDisabled()

    fireEvent.click(executeButton)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('explains missing money using spendable cash during an active expedition', () => {
    const previous = mockState.current
    mockState.current = {
      ...previous,
      expedition: { status: 'active', protectedCareerCash: 500 }
    } as typeof previous
    try {
      render(
        <ZealotryActionModal
          {...defaultProps}
          config={{ ...defaultProps.config, COST: 600 }}
          canRun={false}
        />
      )
      fireEvent.mouseEnter(
        screen.getByRole('button', { name: /EXECUTE INDOCTRINATION/i })
      )
      expect(screen.getByText('Not enough money')).toBeInTheDocument()
    } finally {
      mockState.current = previous
    }
  })

  it.each(['dark_web_leak', 'cult_indoctrination', 'void_sermon'] as const)(
    'resolves its labels from the %s locale prefix',
    prefix => {
      const { labels: _labels, ...rest } = defaultProps
      render(
        <ZealotryActionModal {...rest} i18nPrefix={prefix} hasRunToday={true} />
      )

      expect(screen.getByText(`ui:${prefix}.description`)).toBeInTheDocument()
      expect(screen.getByText(`ui:${prefix}.ran_today`)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: `ui:${prefix}.execute` })
      ).toHaveAttribute('aria-disabled', 'true')
    }
  )
})
