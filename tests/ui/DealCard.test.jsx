import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DealCard } from '../../src/components/postGig/DealCard.tsx'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'economy:brandDeals.energy_drink_cx.description':
          'Das grüne Zeug, das leuchtet. Sie wollen, dass ihr es auf der Bühne trinkt.',
        'economy:brandDeals.energy_drink_cx.name': 'Toxischer Energy-Drink'
      }
      return translations[key] ?? options?.defaultValue ?? key
    }
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
  expect(container).toHaveTextContent('€1,000')
  expect(container).toHaveTextContent('3 Gigs')
})

test('DealCard ignores negotiated deals with missing description or non-finite numbers', () => {
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
          id: 'bad_deal_2',
          name: 'Bad Deal 2',
          offer: { upfront: Number.NaN, duration: Number.POSITIVE_INFINITY }
        }
      }}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  expect(screen.getByText('Base Deal')).toBeInTheDocument()
  expect(container).toHaveTextContent('Base description')
  expect(container).toHaveTextContent('€1,000')
  expect(container).toHaveTextContent('3 Gigs')
})

test('DealCard translates catalog deal names and descriptions', () => {
  render(
    <DealCard
      deal={{
        id: 'energy_drink_cx',
        name: 'Toxic Energy Drink',
        description:
          'The green stuff that glows. They want you to drink it on stage.',
        offer: { upfront: 1000, duration: 3 }
      }}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  expect(screen.getByText('Toxischer Energy-Drink')).toBeInTheDocument()
  expect(
    screen.getByText(
      'Das grüne Zeug, das leuchtet. Sie wollen, dass ihr es auf der Bühne trinkt.'
    )
  ).toBeInTheDocument()
})

test('DealCard translates by id even when name is dynamically generated', () => {
  render(
    <DealCard
      deal={{
        id: 'energy_drink_cx',
        name: 'Toxic Rush Energy',
        description:
          'The green stuff that glows. They want you to drink it on stage.',
        offer: { upfront: 1000, duration: 3 }
      }}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  expect(screen.getByText('Toxischer Energy-Drink')).toBeInTheDocument()
  expect(screen.queryByText('Toxic Rush Energy')).not.toBeInTheDocument()
})
