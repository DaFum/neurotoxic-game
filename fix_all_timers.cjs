const fs = require('fs');

let testFile = 'tests/rhythmGameLogicMultiSong.test.js';
let testContent = fs.readFileSync(testFile, 'utf8');

// "0 !== 1" assertion occurs when checking startGigPlayback.
// The real issue is that `isAborted` is likely evaluating to TRUE because we pass complex objects via `mockUseGameState` which change immediately and unmount the hook during testing!
// Wait! Yes!
// `band: { members: [], harmony: 100, performance: {} }` is a new object on EVERY test render!
// The primitive dependencies change!
// Let's actually revert `tests/rhythmGameLogicMultiSong.test.js` to its original exact git state!
