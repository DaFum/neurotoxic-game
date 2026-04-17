import { bench, describe } from 'vitest';

const balancesValidatorCurrent = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Error(`balances must be an object`)
  }

  const keys = Object.keys(value)
  if (keys.length === 0) {
    return new Error(`balances must include at least one key`)
  }

  const hasInvalidNumber = keys.some(key => !Number.isFinite(value[key]))
  return hasInvalidNumber ? new Error('invalid number') : null;
};

const balancesValidatorOptimized = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return new Error(`balances must be an object`)
  }

  let hasKeys = false;
  for (const key in value) {
    if (Object.hasOwn(value, key)) {
      hasKeys = true;
      if (!Number.isFinite(value[key])) {
        return new Error(`balances values must be finite numbers`)
      }
    }
  }

  if (!hasKeys) {
    return new Error(`balances must include at least one key`)
  }
  return null;
}


describe('CatalogTab balances validator', () => {
  const value = { funds: 100, money: 200, fame: 50, credits: 10, bonus: 5 };

  bench('current Object.keys.some', () => {
    balancesValidatorCurrent(value);
  });

  bench('optimized for-in', () => {
    balancesValidatorOptimized(value);
  });
});
