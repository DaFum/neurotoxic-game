#!/bin/bash
cat tests/node/imageGen.test.js | grep "isImageGenerationAvailable returns true" -A 30
echo "---"
cat tests/node/imageGen.test.js | grep "fetchGenImageAsObjectUrl returns offline fallback" -A 40
