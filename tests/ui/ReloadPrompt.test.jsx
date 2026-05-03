import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReloadPrompt from '../../src/components/ReloadPrompt'

const mockUpdateServiceWorker = vi.fn()
let mockOfflineReady = false
let mockNeedRefresh = false
const mockSetOfflineReady = vi.fn(v => {
  mockOfflineReady = v
})
const mockSetNeedRefresh = vi.fn(v => {
  mockNeedRefresh = v
})

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    offlineReady: [mockOfflineReady, mockSetOfflineReady],
    needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
    updateServiceWorker: mockUpdateServiceWorker
  })
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('ReloadPrompt', () => {
  beforeEach(() => {
    mockOfflineReady = false
    mockNeedRefresh = false
    mockUpdateServiceWorker.mockClear()
    mockSetOfflineReady.mockClear()
    mockSetNeedRefresh.mockClear()
  })

  it('renders nothing when neither offlineReady nor needRefresh', () => {
    const { container } = render(<ReloadPrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('shows offlineReady message and close button when offline-ready', () => {
    mockOfflineReady = true
    render(<ReloadPrompt />)
    expect(screen.getByText('ui:offline.offlineReady')).toBeInTheDocument()
    expect(screen.getByText('ui:offline.close')).toBeInTheDocument()
    expect(screen.queryByText('ui:offline.reload')).not.toBeInTheDocument()
  })

  it('shows needRefresh message with reload and close buttons', () => {
    mockNeedRefresh = true
    render(<ReloadPrompt />)
    expect(screen.getByText('ui:offline.needRefresh')).toBeInTheDocument()
    expect(screen.getByText('ui:offline.reload')).toBeInTheDocument()
    expect(screen.getByText('ui:offline.close')).toBeInTheDocument()
  })

  it('close button dismisses the prompt', () => {
    mockOfflineReady = true
    render(<ReloadPrompt />)
    fireEvent.click(screen.getByText('ui:offline.close'))
    expect(mockSetOfflineReady).toHaveBeenCalledWith(false)
    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false)
  })

  it('reload button calls updateServiceWorker', () => {
    mockNeedRefresh = true
    render(<ReloadPrompt />)
    fireEvent.click(screen.getByText('ui:offline.reload'))
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
  })
})
