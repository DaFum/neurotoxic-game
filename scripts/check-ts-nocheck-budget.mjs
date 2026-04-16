#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const CONFIG_PATH = '.ci/ts-nocheck-budget.json';

function getOccurrences() {
  const out = execSync('rg -n "^// @ts-nocheck" src --glob "*.{ts,tsx,js,jsx}"', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

  if (!out) return [];

  return out.split('\n').map((line) => {
    const [file] = line.split(':');
    return file;
  });
}

function toDomain(filePath) {
  const withoutSrc = filePath.replace(/^src\//, '');
  const [head, second] = withoutSrc.split('/');

  if (!second) return '__root__';
  if (head === 'utils' && second === 'audio') return 'utils/audio';
  if (head === 'hooks' && second === 'minigames') return 'hooks/minigames';
  if (head === 'hooks' && second === 'rhythmGame') return 'hooks/rhythmGame';
  if (head === 'scenes' && second === 'kabelsalat') return 'scenes/kabelsalat';
  return head;
}

function formatDomain(domain) {
  return domain === '__root__' ? 'src root' : domain;
}

function printBreakdown(files) {
  const counts = new Map();
  for (const file of files) {
    const domain = toDomain(file);
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }

  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.log('\nBreakdown by domain:');
  for (const [domain, count] of rows) {
    console.log(`- ${formatDomain(domain)}: ${count}`);
  }
}

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const files = getOccurrences();
  const count = files.length;

  console.log(`Current @ts-nocheck count in src: ${count}`);
  console.log(`Budget (max allowed): ${config.max}`);

  printBreakdown(files);

  if (count > config.max) {
    console.error(`\n❌ Budget exceeded by ${count - config.max} files.`);
    process.exit(1);
  }

  console.log('\n✅ Budget check passed. No new @ts-nocheck debt introduced.');
}

main();
