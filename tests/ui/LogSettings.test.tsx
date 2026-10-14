import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LogSettings } from '../../src/ui/settings/LogSettings'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key })
}))

describe('LogSettings', () => {
  it('ignores non-numeric and unsupported log levels', () => {
    const onLogLevelChange = vi.fn()
    render(<LogSettings logLevel={2} onLogLevelChange={onLogLevelChange} />)
    const select = screen.getByLabelText('ui:min_log_level')

    fireEvent.change(select, { target: { value: 'bad' } })
    fireEvent.change(select, { target: { value: '5' } })

    expect(onLogLevelChange).not.toHaveBeenCalled()
  })

  it('forwards a supported log level', () => {
    const onLogLevelChange = vi.fn()
    render(<LogSettings logLevel={2} onLogLevelChange={onLogLevelChange} />)

    fireEvent.change(screen.getByLabelText('ui:min_log_level'), {
      target: { value: '3' }
    })

    expect(onLogLevelChange).toHaveBeenCalledWith(3)
  })
})
