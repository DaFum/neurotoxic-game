import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestsModal } from '../src/ui/QuestsModal.jsx'

describe('QuestsModal', () => {
  it('renders accepted quests with localized title/description keys and progress', () => {
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

    expect(
      screen.getByText('ui:quests.postgig.apologyTour.title')
    ).toBeInTheDocument()
    expect(
      screen.getByText('ui:quests.postgig.apologyTour.description')
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })
})
