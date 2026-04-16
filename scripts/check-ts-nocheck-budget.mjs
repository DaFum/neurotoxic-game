#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CONFIG_PATH = '.ci/ts-nocheck-budget.json';
const SRC_DIR = 'src';

function findWithGrep() {
  try {
    const out = execSync(
      `grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l "^// @ts-nocheck" ${SRC_DIR}`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return out.trim() ? out.trim().split('\n') : [];
  } catch (error) {
    if (error?.status === 1) return []; // grep exit 1 = no matches
    throw error;
  }
}

function findWithRg() {
  try {
    const out = execSync(
      `rg -l "^// @ts-nocheck" ${SRC_DIR} --glob "*.{ts,tsx,js,jsx}"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return out.trim() ? out.trim().split('\n') : [];
  } catch (error) {
    if (error?.status === 1) return []; // rg exit 1 = no matches
    return null; // rg not available or other error
  }
}

function getOccurrences() {
  const rg = findWithRg();
  if (rg !== null) return rg;
  return findWithGrep();
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
