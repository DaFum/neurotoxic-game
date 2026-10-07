import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RiskEventModal } from '../../src/components/assets/RiskEventModal'
import type { RiskEventType } from '../../src/types/assets'

vi.mock('../../src/ui/shared/GeneratedImagePanel', () => ({
  GeneratedImagePanel: ({ alt }: { alt: string }) => <div>{alt}</div>
}))

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key
  })
}))

describe('RiskEventModal', () => {
  it('closes through the shared ConfirmButton with the section-accent styling', () => {
    const onClose = vi.fn()
    render(
      <RiskEventModal
        eventType={'breakdown' as RiskEventType}
        isOpen
        onClose={onClose}
      />
    )

    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.style.background).toContain('--section-accent')
    expect(close.className).toContain('focus-visible:ring-2')

    fireEvent.click(close)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
