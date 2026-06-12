import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QuestEvents } from '../../src/utils/questProgress.js'
import { handleCompleteTravelMinigame } from '../../src/context/reducers/minigameReducer.js'
import { DEFAULT_MINIGAME_STATE } from '../../src/context/gameConstants.js'

test('travel.completed emits canonical city key', (t) => {
  const originalEmit = QuestEvents.emit;
  t.mock.method(QuestEvents, 'emit', function (state, event) {
    const nextState = originalEmit.apply(this, arguments);
    return {
      ...nextState,
      quests: {
        ...nextState.quests,
        events: [...(nextState.quests?.events || []), event]
      }
    };
  });

  const initialState = {
    player: {
      currentNodeId: 'node1',
      money: 1000,
      van: { fuel: 100, condition: 100 },
      stats: { totalDistance: 0 },
      totalTravels: 0
    },
    band: { members: [] },
    gameMap: {
      nodes: {
        'node1': { id: 'node1' },
        'node2': { id: 'node2', venue: 'venues:berlin_club.name' }
      }
    },
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      targetDestination: 'node2'
    },
    toasts: []
  }

  const resultState = handleCompleteTravelMinigame(initialState, { damageTaken: 0, itemsCollected: [] })

  const travelEvents = resultState.quests?.events.filter(e => e.type === 'travel.completed')
  assert.equal(travelEvents?.length, 1)
  assert.equal(travelEvents[0].context.region, 'berlin')
})
