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
