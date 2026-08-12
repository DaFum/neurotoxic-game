#!/bin/bash
node --experimental-test-module-mocks --import "file://$(pwd)/node_modules/tsx/dist/loader.mjs" --test tests/node/actionCreators.test.js
node --experimental-test-module-mocks --import "file://$(pwd)/node_modules/tsx/dist/loader.mjs" --test tests/node/objectUtils.test.js
# we'll run stateSanitizers later once we find the test file
