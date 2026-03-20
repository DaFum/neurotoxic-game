import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContrabandStash } from '../src/hooks/useContrabandStash'
import * as GameState from '../src/context/GameState'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      // Simple translation mock
      if (options?.defaultValue) {
        let text = options.defaultValue
        if (options.action) text = text.replace('{action}', options.action)
        if (options.itemName)
          text = text.replace('{itemName}', options.itemName)
        return text
      }
      return key
    }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('useContrabandStash', () => {
  const mockUseContraband = vi.fn()
  const mockAddToast = vi.fn()

  const defaultBand = {
    members: [
      { id: 'member1', name: 'Member One' },
      { id: 'member2', name: 'Member Two' }
    ],
    stash: {
      c_energy_drink: {
        id: 'c_energy_drink',
        instanceId: 'item1',
        type: 'consumable',
        effectType: 'stamina',
        name: 'Energy Drink'
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(GameState, 'useGameState').mockReturnValue({
      band: defaultBand,
      useContraband: mockUseContraband,
      addToast: mockAddToast
    })
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useContrabandStash())

    expect(result.current.showStash).toBe(false)
    expect(result.current.stashProps.selectedMember).toBe('member1')
    expect(result.current.stashProps.stash).toEqual(
      Object.values(defaultBand.stash)
    )
    expect(result.current.stashProps.members).toEqual(defaultBand.members)
  })

  it('toggles stash visibility with openStash and closeStash', () => {
    const { result } = renderHook(() => useContrabandStash())

    act(() => {
      result.current.openStash()
    })
    expect(result.current.showStash).toBe(true)

    act(() => {
      result.current.closeStash()
    })
    expect(result.current.showStash).toBe(false)

    // Test onClose via stashProps
    act(() => {
      result.current.openStash()
    })
    act(() => {
      result.current.stashProps.onClose()
    })
    expect(result.current.showStash).toBe(false)
  })

  it('allows changing selected member', () => {
    const { result } = renderHook(() => useContrabandStash())

    act(() => {
      result.current.stashProps.setSelectedMember('member2')
    })
    expect(result.current.stashProps.selectedMember).toBe('member2')
  })

  it('errors when using stamina item without a selected member', () => {
    const { result } = renderHook(() => useContrabandStash())

    act(() => {
      result.current.stashProps.setSelectedMember(null)
    })

    act(() => {
      result.current.stashProps.handleUseItem('item1', { effectType: 'stamina' })
    })

    expect(mockUseContraband).not.toHaveBeenCalled()
    expect(mockAddToast).toHaveBeenCalledWith(
      'Select a band member first!',
      'warning'
    )
  })

  it('errors when using mood item without a selected member', () => {
    const { result } = renderHook(() => useContrabandStash())

    act(() => {
      result.current.stashProps.setSelectedMember(null)
    })

    act(() => {
      result.current.stashProps.handleUseItem('item1', { effectType: 'mood' })
    })

    expect(mockUseContraband).not.toHaveBeenCalled()
    expect(mockAddToast).toHaveBeenCalledWith(
      'Select a band member first!',
      'warning'
    )
  })

  it('uses consumable item and shows success toast', () => {
    const { result } = renderHook(() => useContrabandStash())

    act(() => {
      result.current.stashProps.handleUseItem('item1', {
        id: 'energy_drink',
        type: 'consumable',
        name: 'Energy Drink'
      })
    })

    expect(mockUseContraband).toHaveBeenCalledWith(
      'item1',
      'energy_drink',
      'member1'
    )
    expect(mockAddToast).toHaveBeenCalledWith('Used Energy Drink!', 'success')
  })

  it('applies non-consumable item and shows success toast', () => {
    const { result } = renderHook(() => useContrabandStash())

    act(() => {
      result.current.stashProps.handleUseItem('item2', {
        id: 'guitar_strings',
        type: 'equipment',
        name: 'Guitar Strings'
      })
    })

    expect(mockUseContraband).toHaveBeenCalledWith(
      'item2',
      'guitar_strings',
      'member1'
    )
    expect(mockAddToast).toHaveBeenCalledWith(
      'Applied Guitar Strings!',
      'success'
    )
  })

  it('handles empty stash gracefully', () => {
    vi.spyOn(GameState, 'useGameState').mockReturnValue({
      band: { members: [], stash: undefined },
      useContraband: mockUseContraband,
      addToast: mockAddToast
    })

    const { result } = renderHook(() => useContrabandStash())

    expect(result.current.stashProps.stash).toEqual([])
    expect(result.current.stashProps.selectedMember).toBeUndefined()
  })
})
