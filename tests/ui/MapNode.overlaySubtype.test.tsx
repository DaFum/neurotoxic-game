import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MapNodeView } from '../../src/components/MapNodeView'
import type { ExpeditionNodeFog } from '../../src/types/expedition'

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.defaultValue ?? key,
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
  })
}))

const fog: ExpeditionNodeFog = {
  routeStep: 2,
  onwardRouteCount: 1,
  nodeClass: 'CLUB_GIG',
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

// A base GIG node; arrival converts it to the advertised encounter, so the
// gig is never played. Low harmony makes the cancellation badge render.
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
  harmony: 10,
  tourSuccess: 0,
  expeditionFog: fog,
  bookingLockMinimumFame: 500
} satisfies ComponentProps<typeof MapNodeView>

describe('MapNodeView overlay destination on a GIG node', () => {
  test('a plain GIG still shows payout, cancellation risk and booking lock', () => {
    render(<MapNodeView {...props} />)
    expect(screen.getByTestId('expedition-node-fog-exact')).toHaveTextContent(
      'ui:expedition.node.estimatedPayout'
    )
    expect(screen.getByText(/Cancel risk/)).toBeInTheDocument()
    expect(screen.getByTestId('map-node-booking-locked')).toBeInTheDocument()
  })

  test('an overlay destination names the encounter and hides gig-only readouts', () => {
    render(<MapNodeView {...props} overlaySubtype='RIVAL_ENCOUNTER' />)
    expect(
      screen.getAllByText('ui:expedition.node.subtype.RIVAL_ENCOUNTER').length
    ).toBeGreaterThan(0)
    expect(
      screen.getByTestId('expedition-node-fog-exact')
    ).not.toHaveTextContent('ui:expedition.node.estimatedPayout')
    expect(screen.queryByText(/Cancel risk/)).toBeNull()
    expect(screen.queryByTestId('map-node-booking-locked')).toBeNull()
  })
})
