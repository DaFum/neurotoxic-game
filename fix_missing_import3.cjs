const fs = require('fs');

let testFile = 'tests/rhythmGameLogicMultiSong.test.js';
let testContent = fs.readFileSync(testFile, 'utf8');

// Now we need to add `StateError` and `GameError` to the mock for `errorHandler`!

testContent = testContent.replace(
  "mock.module('../src/utils/errorHandler.js', {\n  namedExports: {\n    handleError: mock.fn(),\n    AudioError: class extends Error {}\n  }\n})",
  "mock.module('../src/utils/errorHandler.js', {\n  namedExports: {\n    handleError: mock.fn(),\n    AudioError: class extends Error {},\n    StateError: class StateError extends Error {},\n    GameError: class GameError extends Error {}\n  }\n})"
);

fs.writeFileSync(testFile, testContent);

// Let's also verify testUtils
let utilsFile = 'tests/useRhythmGameLogicTestUtils.js';
let utilsContent = fs.readFileSync(utilsFile, 'utf8');

utilsContent = utilsContent.replace(
  "  mock.module('../src/utils/errorHandler.js', {\n    namedExports: mockErrorHandler\n  })",
  "  mock.module('../src/utils/errorHandler.js', {\n    namedExports: { ...mockErrorHandler, StateError: class StateError extends Error {}, GameError: class GameError extends Error {} }\n  })"
);

fs.writeFileSync(utilsFile, utilsContent);
