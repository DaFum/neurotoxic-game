import { eventEngine } from './src/utils/eventEngine.js';

const iterations = 1000000;

const mockGameState = {
  band: {
    members: [
      { id: 'm1', name: 'Alice', skill: 5, baseStats: { skill: 7 } },
      { id: 'm2', name: 'Bob', skill: 8, baseStats: { skill: 6 } },
      { id: 'm3', name: 'Charlie', skill: 4, baseStats: { skill: 9 } },
      { id: 'm4', name: 'Diana', skill: 6, baseStats: { skill: 8 } }
    ]
  }
};

const choice = {
  skillCheck: {
    stat: 'skill',
    threshold: 15,
    success: { effect: { type: 'stat', stat: 'fame', value: 10 } },
    failure: { effect: { type: 'stat', stat: 'fame', value: -10 } }
  }
};

const rng = () => 0.5;

// Warmup
for (let i = 0; i < 10000; i++) {
  eventEngine.resolveChoice(choice, mockGameState, rng);
}

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  eventEngine.resolveChoice(choice, mockGameState, rng);
}
const end = performance.now();

console.log(`Baseline: ${(end - start).toFixed(2)} ms for ${iterations} iterations`);
