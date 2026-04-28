import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DealCard } from '../../src/components/postGig/DealCard.tsx'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key, options) => options?.defaultValue ?? _key
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

test('DealCard ignores malformed negotiated deals without upfront/duration', () => {
  const baseDeal = {
    id: 'deal_base',
    name: 'Base Deal',
    description: 'Base description',
    offer: { upfront: 1000, duration: 3 }
  }

  const { container } = render(
    <DealCard
      deal={baseDeal}
      negotiationState={{
        status: 'SUCCESS',
        deal: {
          id: 'bad_deal',
          name: 'Bad Deal',
          description: 'Missing required offer fields',
          offer: {}
        }
      }}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  expect(screen.getByText('Base Deal')).toBeInTheDocument()
  expect(container).toHaveTextContent('1000€')
  expect(container).toHaveTextContent('3 Gigs')
})
