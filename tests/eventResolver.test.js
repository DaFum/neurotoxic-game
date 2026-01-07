import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEventChoice } from '../src/utils/eventResolver.js';

const buildState = () => ({
  player: {
    money: 200,
    time: 10,
    fame: 2,
    day: 1,
    van: { fuel: 50, condition: 80 }
  },
  band: {
    members: [{ id: 'alpha', stamina: 6, mood: 50 }],
    harmony: 60,
    inventory: {}
  },
  social: {
    instagram: 0,
    viral: 0
  }
});

test('resolveEventChoice returns delta for direct effects', () => {
  const choice = {
    label: 'Pay fine',
    outcomeText: 'You pay the fine.',
    effect: { type: 'resource', resource: 'money', value: -40 }
  };

  const { delta, outcomeText, description, result } = resolveEventChoice(choice, buildState());

  assert.equal(outcomeText, 'You pay the fine.');
  assert.equal(description, '');
  assert.equal(result.outcome, 'direct');
  assert.deepEqual(delta.player.money, -40);
});

test('resolveEventChoice handles missing choices safely', () => {
  const { delta, outcomeText, description, result } = resolveEventChoice(null, buildState());

  assert.equal(outcomeText, '');
  assert.equal(description, '');
  assert.equal(result, null);
  assert.equal(delta, null);
});
