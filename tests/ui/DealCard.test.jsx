import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DealCard } from '../../src/components/postGig/DealCard.tsx'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'economy:brandDeals.energy_drink_cx.description':
          'Das grüne Zeug, das leuchtet. Sie wollen, dass ihr es auf der Bühne trinkt.',
        'economy:brandDeals.energy_drink_cx.name': 'Toxischer Energy-Drink',
        'items:golden_pick.name': 'Golden Pick'
      }
      return translations[key] ?? options?.defaultValue ?? key
    },
    i18n: { language: 'en', changeLanguage: vi.fn(), options: {} }
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

test('DealCard shows registry perks and the record-label revenue share', () => {
  const recordDeal = {
    id: 'indie_cult_label',
    name: 'Cult Label',
    description: 'Record deal',
    type: 'RECORD_DEAL',
    offer: { upfront: 4000, duration: 10, revenueShare: 0.15 }
  }

  const { container } = render(
    <DealCard
      deal={recordDeal}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  // The i18n mock returns the raw defaultValue template.
  expect(container).toHaveTextContent('Label cut: {{percent}}% of merch sales')
  expect(container).toHaveTextContent('Perks')
  expect(container).toHaveTextContent('+{{value}} Loyalty per gig')
  expect(container).toHaveTextContent('+{{percent}}% Fame from gigs')
})

test('DealCard shows no perk row for a deal without benefits', () => {
  const { container } = render(
    <DealCard
      deal={{
        id: 'corp_fast_food',
        name: 'Burger',
        description: 'Slurry',
        offer: { upfront: 400, duration: 4, perGig: 40 }
      }}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )
  expect(container).not.toHaveTextContent('Perks')
  expect(container).not.toHaveTextContent('Label cut')
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

test('DealCard stacks content and actions on narrow screens', () => {
  const { container } = render(
    <DealCard
      deal={{
        id: 'mobile_deal',
        name: 'Mobile Deal',
        description: 'Responsive sponsorship card',
        offer: { upfront: 1000, duration: 3 }
      }}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  const card = container.firstElementChild
  expect(card).toHaveClass('flex-col')
  expect(card).toHaveClass('sm:flex-row')
  expect(card).toHaveClass('gap-4')

  const acceptButton = screen.getByRole('button', { name: 'ACCEPT' })
  expect(acceptButton).toHaveClass('w-full')
  expect(acceptButton).toHaveClass('min-h-11')

  const negotiateButton = screen.getByRole('button', { name: 'NEGOTIATE' })
  expect(negotiateButton).toHaveClass('w-full')
  expect(negotiateButton).toHaveClass('min-h-11')
})

test('DealCard shows the localized item name, not the raw item id', () => {
  const { container } = render(
    <DealCard
      deal={{
        id: 'deal_item',
        name: 'Item Deal',
        description: 'Gives a pick',
        offer: { upfront: 1000, item: 'golden_pick', duration: 10 }
      }}
      negotiationState={null}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  expect(container).toHaveTextContent('Golden Pick')
  expect(container).not.toHaveTextContent('golden_pick')
})

test('DealCard falls back to an unknown-item label for an id without a locale entry', () => {
  const { container } = render(
    <DealCard
      deal={{
        id: 'deal_item',
        name: 'Item Deal',
        description: 'Gives a thing',
        offer: { upfront: 1000, item: 'not_in_locale', duration: 10 }
      }}
      negotiationState={null}
      brandReputation={{}}
      handleAcceptDeal={vi.fn()}
      handleNegotiationStart={vi.fn()}
    />
  )

  expect(container).toHaveTextContent('Unknown item')
  expect(container).not.toHaveTextContent('not_in_locale')
})
