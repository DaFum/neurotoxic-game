import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestsModal } from '../src/ui/QuestsModal.jsx'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (key === 'ui:quests.postgig.apologyTour.title') return 'APOLOGY TOUR'
      if (key === 'ui:quests.postgig.apologyTour.description') {
        return 'Play 3 gigs to repair your image after the cancellation backlash.'
      }
      if (key === 'ui:quests.moneyReward') return `+€${options?.amount ?? 0}`
      return key
    },
    i18n: {
      language: 'en'
    }
  })
}))

describe('QuestsModal', () => {
  it('renders translated accepted quests and progress', () => {
    render(
      <QuestsModal
        onClose={vi.fn()}
        player={{ day: 7 }}
        activeQuests={[
          {
            id: 'quest_apology_tour',
            label: 'ui:quests.postgig.apologyTour.title',
            description: 'ui:quests.postgig.apologyTour.description',
            progress: 1,
            required: 3,
            deadline: 14,
            moneyReward: 100
          }
        ]}
      />
    )

    expect(screen.getByText('APOLOGY TOUR')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Play 3 gigs to repair your image after the cancellation backlash.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })
})
