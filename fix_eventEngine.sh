#!/bin/bash
cat tests/node/eventEngine.test.js | grep "mock.module" -B 2 -A 5
