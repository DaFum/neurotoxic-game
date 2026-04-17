import { bench, describe } from 'vitest';
import { handleUpdateBand } from '../src/context/reducers/bandReducer.ts';

describe('bandReducer handleUpdateBand', () => {
  const state = { band: { harmony: 50, other: 'test', more: 1, evenMore: 2 } };
  const payload = { harmony: 60, other: 'test2', more: 3, evenMore: 4 };

  bench('handleUpdateBand current', () => {
    handleUpdateBand(state, payload);
  });
});
