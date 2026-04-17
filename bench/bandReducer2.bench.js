import { bench, describe } from 'vitest';

const isForbiddenKey = (key) => key === '__proto__' || key === 'constructor';

const runCurrent = (updates) => {
    return Object.keys(updates).some(isForbiddenKey)
};

const runOptimized = (updates) => {
    for (const key in updates) {
      if (Object.hasOwn(updates, key) && isForbiddenKey(key)) {
        return true;
      }
    }
    return false;
};

describe('bandReducer handleUpdateBand', () => {
  const updates = { harmony: 60, other: 'test2', more: 3, evenMore: 4 };

  bench('current Object.keys.some', () => {
    runCurrent(updates);
  });

  bench('optimized for-in', () => {
    runOptimized(updates);
  });
});
