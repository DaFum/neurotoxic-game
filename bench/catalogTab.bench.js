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

describe('CatalogTab balances validator', () => {
  const value = { funds: 100, money: 200, fame: 50, credits: 10, bonus: 5 };

  bench('current Object.keys.some', () => {
    const keys = Object.keys(value)
    if (keys.length === 0) return false;
    keys.some(key => !Number.isFinite(value[key]))
  });

  bench('optimized for-in', () => {
    let hasKeys = false;
    for (const key in value) {
      if (Object.hasOwn(value, key)) {
        hasKeys = true;
        if (!Number.isFinite(value[key])) return true;
      }
    }
    if (!hasKeys) return false;
  });
});
