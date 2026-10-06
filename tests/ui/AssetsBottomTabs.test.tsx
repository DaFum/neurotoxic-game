import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AssetsBottomTabs } from '../../src/components/assets/AssetsBottomTabs'
import type { AssetKind } from '../../src/types/assets'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'assets:hub.accessibility.sectionTabs': 'Asset sections',
        'assets:section.tourbus.title': 'Tourbus',
        'assets:section.studio.title': 'Studio',
        'assets:section.bandhaus.title': 'Band House',
        'assets:section.workshop.title': 'Workshop'
      }
      return labels[key] ?? key
    }
  })
}))

describe('AssetsBottomTabs', () => {
  it('renders accessible section tabs and switches sections', () => {
    const onSelect = vi.fn()
    render(<AssetsBottomTabs active='tourbus_chassis' onSelect={onSelect} />)

    expect(
      screen.getByRole('tablist', { name: 'Asset sections' })
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tourbus/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )

    fireEvent.click(screen.getByRole('tab', { name: /Studio/ }))
    expect(onSelect).toHaveBeenCalledWith('studio_chassis')
  })

  it('supports roving tabindex with Arrow/Home/End keyboard navigation', () => {
    const onSelect = vi.fn()
    render(<AssetsBottomTabs active='tourbus_chassis' onSelect={onSelect} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map(tab => tab.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
      '-1'
    ])

    tabs[0]?.focus()
    fireEvent.keyDown(tabs[0] as HTMLElement, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith('studio_chassis')
    expect(tabs[1]).toHaveFocus()

    fireEvent.keyDown(tabs[0] as HTMLElement, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith('merch_workshop_chassis')
    expect(tabs[3]).toHaveFocus()

    fireEvent.keyDown(tabs[3] as HTMLElement, { key: 'Home' })
    expect(onSelect).toHaveBeenLastCalledWith('tourbus_chassis')
    expect(tabs[0]).toHaveFocus()

    fireEvent.keyDown(tabs[0] as HTMLElement, { key: 'End' })
    expect(onSelect).toHaveBeenLastCalledWith('merch_workshop_chassis')
    expect(tabs[3]).toHaveFocus()
  })

  it('preserves tab ids and panel controls', () => {
    render(
      <AssetsBottomTabs
        active={'merch_workshop_chassis' as AssetKind}
        onSelect={vi.fn()}
      />
    )

    const workshop = screen.getByRole('tab', { name: /Workshop/ })
    expect(workshop).toHaveAttribute('id', 'assets-tab-merch_workshop_chassis')
    expect(workshop).toHaveAttribute(
      'aria-controls',
      'assets-panel-merch_workshop_chassis'
    )
  })
})
