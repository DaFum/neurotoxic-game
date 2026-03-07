#!/bin/bash
echo "Running baseline benchmark..."
node --test --import tsx --experimental-test-module-mocks benchmarks/postOptions-baseline.bench.js
