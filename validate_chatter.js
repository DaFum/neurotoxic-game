import { getRandomChatter } from './src/data/chatter.js';

const mockState = {
  currentScene: 'OVERWORLD',
  player: {
    location: 'Stendal',
    currentNodeId: 'node_stendal_adler',
    money: 500
  },
  gameMap: {
    nodes: {
      'node_stendal_adler': {
        venue: { id: 'stendal_adler' }
      }
    }
  },
  band: {
    members: [
      { name: 'Matze', mood: 50, stamina: 100 },
      { name: 'Lars', mood: 50, stamina: 100 },
      { name: 'Marius', mood: 50, stamina: 100 }
    ]
  },
  social: { instagram: 100, viral: 0 }
};

try {
  const result = getRandomChatter(mockState);
  console.log('Result:', result);
  if (result && result.text) {
    console.log('SUCCESS: getRandomChatter returned a valid response.');
  } else {
    console.log('FAILURE: getRandomChatter returned null or invalid result.');
  }
} catch (e) {
  console.error('ERROR during execution:', e);
}
