#!/bin/bash
cat tests/node/TourbusStageController.test.js | grep -n -B 5 -A 20 "isImageGenerationAvailable"
