import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestsModal } from '../../src/ui/QuestsModal.tsx'

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

    expect(
      screen.getByText('ui:quests.postgig.apologyTour.title')
    ).toBeInTheDocument()
    expect(
      screen.getByText('ui:quests.postgig.apologyTour.description')
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('renders structured rewards and failure penalties', () => {
    render(
      <QuestsModal
        onClose={vi.fn()}
        player={{ day: 3 }}
        activeQuests={[
          {
            id: 'structured_quest',
            label: 'ui:quests.structured.title',
            description: 'ui:quests.structured.description',
            progress: 0,
            required: 1,
            rewards: [{ type: 'fame', amount: 25 }],
            failurePenalties: [{ type: 'band.harmony', amount: -5 }]
          }
        ]}
      />
    )

    expect(screen.getByText('ui:rewards.fameWithAmount')).toBeInTheDocument()
    expect(screen.getByText('ui:quests.penalty.harmony')).toBeInTheDocument()
  })
})
