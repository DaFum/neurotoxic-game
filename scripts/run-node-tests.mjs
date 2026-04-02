import { spawnSync } from 'node:child_process'
import { computeWorkerCount } from './utils/parallelism.mjs'

const rawArgs = process.argv.slice(2)
const nodeTestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const hasExplicitConcurrency = nodeTestArgs.some(arg =>
  arg.startsWith('--test-concurrency')
)

const testConcurrency = computeWorkerCount('NODE_TEST_CONCURRENCY')

const commandArgs = [
  '--test',
  '--import',
  'tsx',
  '--experimental-test-module-mocks',
  '--import',
  './tests/setup.mjs',
  ...(hasExplicitConcurrency ? [] : [`--test-concurrency=${testConcurrency}`]),
]

import fs from 'node:fs';
import path from 'node:path';

// Exclude directories that have been migrated to vitest
const getRemainingTestFiles = () => {
  const allFiles = [];
  const crawl = (dir) => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const normalizedPath = fullPath.replace(/\\/g, '/');
      if (fs.statSync(fullPath).isDirectory()) {
        crawl(fullPath);
      } else if (normalizedPath.endsWith('.test.js') || normalizedPath.endsWith('.spec.js')) {
        if (!normalizedPath.startsWith('tests/api/') && !normalizedPath.startsWith('tests/utils/') && !normalizedPath.startsWith('tests/data/')) {
          allFiles.push(fullPath);
        }
      }
    }
  };
  crawl('tests');
  return allFiles;
};

// If running a specific file, don't use default exclusions since they only apply globally
// We detect this by checking if the first arg is not an option flag
const isSpecificFile = nodeTestArgs.length > 0 && !nodeTestArgs[0].startsWith('--')

const finalArgs = isSpecificFile
  ? [...commandArgs, ...nodeTestArgs]
  : [...commandArgs, ...getRemainingTestFiles(), ...nodeTestArgs]

const result = spawnSync('node', finalArgs, {
  stdio: 'inherit',
  env: process.env
})

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.error) {
  throw result.error
}

process.exit(1)
