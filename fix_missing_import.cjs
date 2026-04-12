const fs = require('fs');

let testFile = 'tests/rhythmGameLogicMultiSong.test.js';
let testContent = fs.readFileSync(testFile, 'utf8');

// I am adding the exact string the user provided: `mock.module('../src/utils/logger.js'...`
// at the VERY TOP of `tests/rhythmGameLogicMultiSong.test.js` BEFORE dynamic imports, right after `node:test` imports.
// Let's replace the ENTIRE top section manually to ensure NO missing exports.

testContent = testContent.replace(
  "import { test, describe, beforeEach, afterEach, mock } from 'node:test'",
  "import { test, describe, beforeEach, afterEach, mock } from 'node:test'\n\nmock.module('../src/utils/logger.js', {\n  namedExports: {\n    LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },\n    logger: { info: mock.fn(), warn: mock.fn(), error: mock.fn() }\n  }\n})\n"
);

fs.writeFileSync(testFile, testContent);

// To prevent conflict, I'll remove it from where it currently is in the file.
let utilsFile = 'tests/useRhythmGameLogicTestUtils.js';
let utilsContent = fs.readFileSync(utilsFile, 'utf8');

utilsContent = utilsContent.replace(
  "  mock.module('../src/utils/logger.js', {\n    namedExports: { logger: mockLogger }\n  })\n",
  ""
);
fs.writeFileSync(utilsFile, utilsContent);
