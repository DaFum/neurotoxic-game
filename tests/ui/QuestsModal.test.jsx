import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestsModal, getQuestDeadlineView, getQuestScopeHint, getQuestPrimaryHint } from '../../src/ui/QuestsModal.tsx'

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
    // Details hidden by default
    expect(
      screen.queryByText('ui:quests.postgig.apologyTour.description')
    ).not.toBeInTheDocument()
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


describe('QuestModal Helper Functions', () => {
  const mockT = (key, options) => {
    if (options && options.count !== undefined) return `${key}-${options.count}`;
    if (options && options.scope) return `${key}-${options.scope}`;
    return key;
  };

  describe('getQuestDeadlineView', () => {
    const quest = { id: 'q1', deadline: 10 };

    it('returns none if no deadline', () => {
      expect(getQuestDeadlineView({ id: 'q1' }, 5).level).toBe('none');
    });

    it('returns safe if > 5 days left', () => {
      const view = getQuestDeadlineView(quest, 2);
      expect(view.level).toBe('safe');
      expect(view.count).toBe(8);
    });

    it('returns soon if <= 5 and > 2 days left', () => {
      const view = getQuestDeadlineView(quest, 5);
      expect(view.level).toBe('soon');
      expect(view.count).toBe(5);
    });

    it('returns urgent if 2 days left', () => {
      const view = getQuestDeadlineView(quest, 8);
      expect(view.level).toBe('urgent');
      expect(view.count).toBe(2);
    });

    it('returns lastChance if 1 day left', () => {
      const view = getQuestDeadlineView(quest, 9);
      expect(view.level).toBe('lastChance');
    });

    it('returns today if 0 days left', () => {
      const view = getQuestDeadlineView(quest, 10);
      expect(view.level).toBe('today');
    });

    it('returns overdue if < 0 days left', () => {
      const view = getQuestDeadlineView(quest, 11);
      expect(view.level).toBe('overdue');
    });
  });

  describe('getQuestScopeHint', () => {
    const player = { location: 'Berlin' };

    it('returns null if no scopeKey', () => {
      expect(getQuestScopeHint({ id: 'q1' }, player)).toBeNull();
    });

    it('handles matching perRegion', () => {
      const hint = getQuestScopeHint({ id: 'q1', repeatPolicy: 'perRegion', scopeKey: 'Berlin' }, player);
      expect(hint.matching).toBe(true);
      expect(hint.text).toBe('ui:quests.hint.scope.region.matching');
    });

    it('handles mismatching perRegion', () => {
      const hint = getQuestScopeHint({ id: 'q1', repeatPolicy: 'perRegion', scopeKey: 'Hamburg' }, player);
      expect(hint.matching).toBe(false);
      expect(hint.text).toBe('ui:quests.hint.scope.region.mismatch');
      expect(hint.options.scope).toBe('Hamburg');
    });

    it('handles perVenue', () => {
      const hint = getQuestScopeHint({ id: 'q1', repeatPolicy: 'perVenue', scopeKey: 'SO36' }, player);
      expect(hint.matching).toBe(true);
      expect(hint.text).toBe('ui:quests.hint.scope.venue.only');
    });
  });

  describe('getQuestPrimaryHint', () => {
    it('prioritizes overdue/today over everything else', () => {
      const hint = getQuestPrimaryHint({
        deadlineView: { level: 'overdue', text: 'overdue_key' },
        scopeHint: { matching: false, text: 'mismatch_key' },
        nextStepHint: 'next_step_key',
        t: mockT
      });
      expect(hint.type).toBe('error');
      expect(hint.text).toBe('overdue_key');
    });

    it('prioritizes wrong scope over urgent deadline and next step', () => {
      const hint = getQuestPrimaryHint({
        deadlineView: { level: 'urgent', text: 'urgent_key', count: 2 },
        scopeHint: { matching: false, text: 'mismatch_key' },
        nextStepHint: 'next_step_key',
        t: mockT
      });
      expect(hint.type).toBe('warning');
      expect(hint.text).toBe('mismatch_key');
    });

    it('prioritizes urgent deadline over next step if scope matches', () => {
      const hint = getQuestPrimaryHint({
        deadlineView: { level: 'lastChance', text: 'lastChance_key' },
        scopeHint: { matching: true, text: 'match_key' },
        nextStepHint: 'next_step_key',
        t: mockT
      });
      expect(hint.type).toBe('warning');
      expect(hint.text).toBe('lastChance_key');
    });

    it('returns next step if safe deadline and matching scope', () => {
      const hint = getQuestPrimaryHint({
        deadlineView: { level: 'safe', text: 'safe_key', count: 5 },
        scopeHint: { matching: true, text: 'match_key' },
        nextStepHint: 'next_step_key',
        t: mockT
      });
      expect(hint.type).toBe('info');
      expect(hint.text).toBe('next_step_key');
    });

    it('returns null if nothing is relevant', () => {
      const hint = getQuestPrimaryHint({
        deadlineView: { level: 'none', text: null },
        scopeHint: null,
        nextStepHint: null,
        t: mockT
      });
      expect(hint).toBeNull();
    });
  });
});

  describe('QuestItem rendering interactions', () => {
    it('toggles description when details clicked', async () => {
      const user = userEvent.setup(); render(
        <QuestsModal
          onClose={vi.fn()}
          player={{ day: 7 }}
          activeQuests={[
            {
              id: 'q1',
              label: 'Label',
              description: 'My Description',
              progress: 0,
              required: 1
            }
          ]}
        />
      );

      // Description is hidden
      expect(screen.queryByText('My Description')).not.toBeInTheDocument();

      // Click show details
      const toggle = screen.getByRole('button', { name: /ui:quests\.details\.show/i });
      await user.click(toggle);

      // Now it is visible
      expect(screen.getByText('My Description')).toBeInTheDocument();
    });
  });
