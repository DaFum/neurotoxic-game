import { handleCompleteAmpCalibration } from './src/context/reducers/minigameReducer.js';

const mockState = {
  band: { harmony: 50, traits: [] },
  player: { money: 100 },
  gigModifiers: {}
};

console.log(handleCompleteAmpCalibration(mockState, { score: 80 }));
