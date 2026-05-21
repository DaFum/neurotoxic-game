import { bench, describe } from 'vitest';
import { SOCKET_DEFS } from '../../src/scenes/kabelsalat/kabelsalatConstants';

const connections = {
  mic: 'xlr',
  amp: 'jack',
  pedal: 'dc',
  power: null,
  synth: 'midi'
} as any;

describe('kabelsalatTimer connections check', () => {
  bench('original Object.values', () => {
    const isComplete = Object.values(connections).filter(value => value != null).length ===
        Object.keys(SOCKET_DEFS).length;
  });

  bench('optimized for-in', () => {
    let count = 0;
    for (const key in connections) {
      if (connections[key] != null) {
        count++;
      }
    }
    const isComplete = count === Object.keys(SOCKET_DEFS).length;
  });
});
