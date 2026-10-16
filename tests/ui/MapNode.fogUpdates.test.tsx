import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MapNodeView } from '../../src/components/MapNodeView'
import type { ExpeditionNodeFog } from '../../src/types/expedition'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'ui:expedition.node.onwardRoutes') {
        return `${options?.count} onward routes`
      }
      if (key === 'ui:expedition.node.routeFacts') {
        return `${options?.step} · ${options?.onward}`
      }
      return options?.defaultValue ?? key
    },
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
}))

const fog: ExpeditionNodeFog = {
  routeStep: 2,
  onwardRouteCount: 2,
  nodeClass: 'GIG',
  specialSubtype: null,
  dangerTier: 'low',
  rewardTier: 'moderate',
  isExtractionWindow: false,
  intelLevel: 1,
  estimatedPayout: 195,
  exactWearCost: 12,
  revealedIdentity: null,
  rareRewardId: null,
  hasRecoveryOrSponsorHint: null,
  hasRivalOrSponsorCategoryHint: null,
  hasUndergroundCategoryHint: null
}

const props = {
  node: { id: 'exp_2_0', type: 'GIG', x: 40, y: 20, layer: 2 },
  isCurrent: false,
  isTraveling: false,
  visibility: 'visible',
  isReachable: true,
  isPendingConfirm: true,
  handleTravel: vi.fn(),
  setHoveredNode: vi.fn(),
  iconUrl: '/icon.png',
  vanUrl: '/van.png',
  expeditionFog: fog
} satisfies ComponentProps<typeof MapNodeView>

describe('MapNodeView fog updates', () => {
  test('refreshes onward routes when only the fog route count changes', () => {
    const { rerender } = render(<MapNodeView {...props} />)
    expect(screen.getByTestId('expedition-node-fog-route')).toHaveTextContent(
      '2 onward routes'
    )

    rerender(
      <MapNodeView {...props} expeditionFog={{ ...fog, onwardRouteCount: 3 }} />
    )

    expect(screen.getByTestId('expedition-node-fog-route')).toHaveTextContent(
      '3 onward routes'
    )
  })

  test('refreshes scouted wear when only the fog wear cost changes', () => {
    const { rerender } = render(<MapNodeView {...props} />)
    expect(screen.getByTestId('expedition-node-fog-exact')).toHaveTextContent(
      'ui:expedition.node.wear 12'
    )

    rerender(
      <MapNodeView {...props} expeditionFog={{ ...fog, exactWearCost: 7 }} />
    )

    expect(screen.getByTestId('expedition-node-fog-exact')).toHaveTextContent(
      'ui:expedition.node.wear 7'
    )
  })
})
