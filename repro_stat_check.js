
import { eventEngine } from './src/utils/eventEngine.js';

// Mock state with REAL structure (nested baseStats)
const realState = {
  band: {
    members: [
      {
        name: 'TestMember',
        baseStats: { skill: 10 },
        stamina: 100,
        mood: 100
      }
    ],
    luck: 0
  }
};

const choice = {
  skillCheck: {
    stat: 'skill', // Checks 'skill', which is nested
    threshold: 5,
    success: { type: 'log', msg: 'success' },
    failure: { type: 'log', msg: 'failure' }
  }
};

// This should fail (return failure) if eventEngine only checks top-level
const result = eventEngine.resolveChoice(choice, realState);
console.log('Result outcome:', result.outcome);
// Expect 'failure' if bug exists (skill=undefined -> 0 < 5), 'success' if logic is correct (skill=10 > 5)
